var fs = require('fs');

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

  routes.sort(function(a, b) {
    var al = a.path.length;
    if (a.path.indexOf("{") !== -1) al += 999;
    var bl = b.path.length;
    if (b.path.indexOf("{") !== -1) bl += 999;

    return al - bl;
  });

  routes.forEach(function(route) {
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
        }
      }));
      var context = {
        done: function(err, obj) {
          obj = obj || "";
          var contentType, responseTemplates, responseTemplate, responseBody, statusCode;

          if (err) {
            statusCode = 400;
            contentType = "application/json";
            responseTemplate = "$input.json('$')";
            obj = {error: err.toString()};
          } else {
            statusCode = route.statusCode;
            responseTemplates = route.responseTemplates || {};
            if (Object.keys(responseTemplates).length > 0) {
              contentType = req.accepts(Object.keys(responseTemplates)) || "application/json";
            } else {
              contentType = "application/json";
            }
            responseTemplate = responseTemplates[contentType.toLowerCase()] || "$input.json('$')";
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

      route.lambda(event, context);
    });
  });

  return app;
};
