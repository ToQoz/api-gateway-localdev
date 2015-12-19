# api-gateway-localdev

simulate AWS API Gateway for dev in your local

## Installation

```
npm install api-gateway-localdev
```

## Usage

```node
var express = require('express');
var apiGatewayLocal = require('api-gateway-localdev');

var app = apiGatewayLocal(express(), [
  {
    lambda: handler,
    method: "GET",
    path: "/users.json",
    statusCode: 200,
    requestTemplates: {},
    responseTemplates: {},
  }
]);

function handler(event, context) {
    var users;
    // ...
    context.done(null, users);
}

app.listen(8000);
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
    - requestTemplates - `map<String, String|Buffer>`
    - responseTemplates - `map<String, String|Buffer>`
- Return value
  - app
