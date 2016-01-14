var http = require('http');
var assert = require('assert');

var express = require('express');
var apiGatewayLocal = require("..");

var lambdas = require('./_lambdas');
var apiGatewayRoutes = [
  {
    lambda: lambdas.users.index,
    method: "GET",
    path: "/json/users",
    statusCode: 200,
    requestTemplates: {},
    responseTemplates: {},
  },
  {
    lambda: lambdas.users.create,
    method: "POST",
    path: "/json/users",
    statusCode: 201,
    requestTemplates: {},
    responseTemplates: {},
  },
  {
    lambda: lambdas.users.show,
    method: "GET",
    path: "/json/users/{username}",
    statusCode: 200,
    requestTemplates: {
      "application/json": '{"username": "$input.params(\'username\')"}'
    },
    responseTemplates: {},
  },
  {
    lambda: lambdas.users.showHtml,
    method: "GET",
    path: "/html/users/{username}",
    statusCode: 200,
    requestTemplates: {
      "application/json": '{"username": "$input.params(\'username\')"}'
    },
    responseTemplates: {
      "text/html": "<h1>$input.path('$.name')</h1>"
    },
  },
  {
    lambda: lambdas.users.showHtml_v2,
    method: "GET",
    path: "/html/v2/users/{username}",
    statusCode: 200,
    requestTemplates: {
      "application/json": '{"username": "$input.params(\'username\')"}'
    },
    responseTemplates: {
      "text/html": "$input.path('$')"
    },
  }
];

var port = 3000;
var app = apiGatewayLocal(express(), apiGatewayRoutes);
var server;

var User = require('./_user');

describe('api-gateway-localdev', function() {
  describe('sample app', function() {
    before(function() {
      server = app.listen(port);
    });

    afterEach(function() {
      User.cleanup();
    });

    describe("GET /json/users", function() {
      beforeEach(function() {
        User.create("ToQoz");
      });

      it("returns 200", function(done) {
        req("GET", "/json/users", "", function(res, data) {
          assert.equal(res.statusCode, 200);
          done();
        });
      });

      it("returns all users as JSON", function(done) {
        req("GET", "/json/users", "", function(res, data) {
          var users = JSON.parse(data);
          assert.deepEqual(users, User.all());
          assert.equal(users[0].name, "ToQoz");
          done();
        });
      });
    });

    describe("POST /json/users", function() {
      it("returns 201", function(done) {
        req("POST", "/json/users", '{"username": "ToQoz"}', function(res, data) {
          assert.equal(res.statusCode, 201);
          done();
        });
      });

      it("creates a user", function(done) {
        var oldCount = User.count();

        req("POST", "/json/users", '{"username": "ToQoz"}', function(res, data) {
          assert.equal(User.count(), oldCount + 1);
          done();
        });
      });

      it("returns the created user as JSON", function(done) {
        req("POST", "/json/users", '{"username": "ToQoz"}', function(res, data) {
          var user = JSON.parse(data);
          assert.equal(user.name, "ToQoz");
          done();
        });
      });
    });

    describe("GET /html/users/{username}", function() {
      beforeEach(function() {
        User.create("ToQoz");
      });

      it("returns 200", function(done) {
        req("GET", "/html/users/ToQoz", '', function(res, data) {
          assert.equal(res.statusCode, 200);
          done();
        });
      });

      it("returns the user as HTML", function(done) {
        req("GET", "/html/users/ToQoz", "", function(res, data) {
          assert.equal(data, "<h1>ToQoz</h1>");
          done();
        });
      });
    });

    describe("GET /html/v2/users/{username}", function() {
      beforeEach(function() {
        User.create("ToQoz");
      });

      it("returns 200", function(done) {
        req("GET", "/html/v2/users/ToQoz", '', function(res, data) {
          assert.equal(res.statusCode, 200);
          done();
        });
      });

      it("returns the user as HTML", function(done) {
        req("GET", "/html/v2/users/ToQoz", "", function(res, data) {
          assert.equal(data, "<h1>ToQoz</h1>");
          done();
        });
      });
    });

    after(function() {
      server.close();
    });
  });
});

function req(method, path, data, cb) {
  var r = http.request({
    hostname: 'localhost',
    port: port,
    path: path,
    method: method,
  }, function(res) {
    var data = '';

    res.on('data', function(chunk) {
      data += chunk;
    });

    res.on('end', function() {
      cb(res, data);
    });
  });

  r.write(data);
  r.end();
}
