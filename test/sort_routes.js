var sort = require('../lib/sort_routes');

var assert = require('assert');

describe('sort_routes', function() {
  var routes = [
    {path: '/{a}'},
    {path: '/'},
    {path: '/users/{user_id}'},
  ];
  sort(routes);

  assert.deepEqual(routes, [
    {path: '/'},
    {path: '/users/{user_id}'},
    {path: '/{a}'},
  ]);
});
