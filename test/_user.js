module.exports = User;

function User(name) {
  this.name = name;
}
User.users = [];
User.all = function() {
  return this.users;
};
User.count = function() {
  return this.users.length;
};
User.find = function(username) {
  return this.users.filter(function(u) {
    return u.name === username;
  })[0];
};
User.create = function(username) {
  var u = new User(username);
  this.users.push(u);
  return u;
};
User.cleanup = function() {
  this.users = [];
};
