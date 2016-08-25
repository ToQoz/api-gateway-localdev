var fs = require('fs');

var sort = require('./lib/sort_routes');
var mappingTemplate = require("api-gateway-mapping-template");

// - Parameters
//   - app - `instance of express`
//   - routes - `Array<map>`
//     - lambda - `Function`
//     - method - `String`
//     - path - `String`
//     - statusCode - `Number`
//     - requestTemplates - `map<String, String|Buffer>`
//     - responseTemplates - `map<String, String|Buffer>`
module.exports = function(app, routes) {
  app.use(function(req, res, next) {
    req.rawBody = '';
    req.setEncoding('utf8');
    req.on('data', function(chunk) { req.rawBody += chunk; });
    req.on('end', function() {
      next();
    });
  });

  paramRegexp = /^{[a-zA-Z0-9._-]+}$/
  normalRegexp = /^[a-zA-Z0-9._-]+$/

  sort(routes);

  routes.forEach(function(route) {
    if (!('responses' in route)) {
      throw new Error("responses is not found in route");
    }

    var path = route.path
      .split("/")
      .map(function(segment) {
        if (segment !== "" && !normalRegexp.test(segment) && !paramRegexp.test(segment)) {
          // follows the API Gateway's rule
          throw new Error("Resource's path part only allow a-zA-Z0-9._- and curly braces at the begining and the end.");
        }

        // converts to express style param
        if (paramRegexp.test(segment)) {
          return ":" + segment.replace(/^{/, "").replace(/}$/, "")
        }

        return segment;
      })
      .join("/");

    app[route.method.toLowerCase()](path, function(req, res) {
      var requestContentType = req.headers['content-type'] || "application/json";
      var requestTemplate = route.requestTemplates[requestContentType.toLowerCase()] || "$input.json('$')";

      var event = JSON.parse(mappingTemplate({
        template: requestTemplate.toString(),
        payload: req.rawBody,
        params: {
          header: req.headers,
          path: req.params,
          querystring: req.query
        },
      }));
      var context = {
        done: function(err, obj) {
          obj = obj || "";
          var contentType, responseTemplates, responseTemplate, responseBody, statusCode;
          var response;

          // default
          Object.keys(route.responses).forEach(function(code) {
            var res = route.responses[code];
            if (!res.selectionPattern) {
              statusCode = code;
              response = res;
            }
          });

          if (err) {
            // selection pattern
            Object.keys(route.responses).forEach(function(code) {
              var res = route.responses[code];
              if ((new RegExp(res.selectionPattern)).test(JSON.stringify(err))) {
                statusCode = code;
                response = res;
              }
            });
          }

          responseTemplates = response.responseTemplates || {};
          if (Object.keys(responseTemplates).length > 0) {
            contentType = req.accepts(Object.keys(responseTemplates)) || "application/json";
          } else {
            contentType = "application/json";
          }
          responseTemplate = responseTemplates[contentType.toLowerCase()] || "$input.json('$')";

          if (err) {
            // obj = {error: err.toString()};
            obj = err
          }

          responseBody = mappingTemplate({
            template: responseTemplate.toString(),
            payload: JSON.stringify(obj)
          });

          res.setHeader("Content-Type", contentType);
          res
            .status(statusCode)
            .send(responseBody);
        },
        succeed: function(obj) {
          this.done(null, obj);
        },
        fail: function(err) {
          this.done(err, null);
        },
      };

      route.lambda(event, context, context.done);
    });
  });

  return app;
};
