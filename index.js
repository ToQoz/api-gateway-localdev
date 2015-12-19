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

  routes.forEach(function(route) {
    app[route.method.toLowerCase()](route.path, function(req, res) {
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
          var contentType, responseTemplate, responseBody, statusCode;

          if (err) {
            statusCode = 400;
            contentType = "application/json";
            responseTemplate = "$input.json('$')";
            obj = {error: err.toString()};
          } else {
            try {
              statusCode = route.statusCode;
              if (Object.keys(route.responseTemplates).length > 0) {
                contentType = req.accepts(Object.keys(route.responseTemplates)) || "application/json";
              } else {
                contentType = "application/json";
              }
              responseTemplate = route.responseTemplates[contentType.toLowerCase()] || "$input.json('$')";
            } catch(error) {
              this.done(error, null);
            }
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
