# api-gateway-localdev

simulate AWS API Gateway for dev in your local

## Installation

```
npm install api-gateway-localdev
```

## Usage

app.js:

```node
var express = require('express');
var apiGatewayLocal = require('api-gateway-localdev');

var app = apiGatewayLocal(express(), [
  {
    lambda: require("./lambda").handler,
    method: "GET",
    path: "/users/{username}",
    responses: {
        "200": {
          "responseTemplates": {},
          "responseModels": {}
        },
        "404": {
          "selectionPattern": ".*404.*",
          "responseTemplates": {},
          "responseModels": {}
        }
    }
    requestTemplates: {
      "application/json": '{"username": "$input.params(\'username\')"}'
    },
  }
]);

app.listen(8000);
```

lambda.js:

```node
exports.handler = function (event, context) {
  context.done(null, findUser(event.username));
}

function findUser(username) {
  // ...
}
```

***

```
$ node ./app.js
```

## API

```node
var apiGatewayLocal = require('api-gateway-localdev')
```

### apiGatewayLocal(app, routes)

- Arguments
  - app - `instance of express`
  - routes - `Array<map>`
    - lambda - `Function`
    - method - `String`
    - path - `String`
    - statusCode - `Number`
    - responses - `map<String, map>`
      - 'status code' e.g. "200"
        - selectionPattern - `String`
        - responseTemplates - `map<String, String|Buffer>`
        - responseModels - `map<String, String|Buffer>`
    - requestTemplates - `map<String, String|Buffer>`
- Return value
  - app
