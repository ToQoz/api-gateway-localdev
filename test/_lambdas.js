var User = require('./_user');

module.exports = {
  users: {
    index: function(event, context) {
      context.done(null, User.all());
    },
    show: function(event, context) {
      context.done(null, User.find(event.username));
    },
    create: function(event, context) {
      context.done(null, User.create(event.username));
    },
    showHtml: function(event, context) {
      context.done(null, User.find(event.username));
    },
    showHtml_v2: function(event, context) {
      var user = User.find(event.username);
      context.done(null, "<h1>" + user.name + "</h1>");
    },
  }
};
