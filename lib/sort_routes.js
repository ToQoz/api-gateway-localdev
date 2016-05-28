module.exports = function(routes) {
  var maxDepth = 0;
  routes.forEach(function(r) {
    var d = r.path.split('/').length
    if (d > maxDepth) {
      maxDepth = d;
    }
  });
  routes.sort(function(a, b) {
    var al = a.path.length;
    a.path.split("/").forEach(function(segment, i) {
      if (segment.indexOf("{") !== -1) {
        al += 999 * (maxDepth - i);
      }
    });

    var bl = b.path.length;
    b.path.split("/").forEach(function(segment, i) {
      if (segment.indexOf("{") !== -1) {
        bl += 999 * (maxDepth - i);
      }
    });

    return al - bl;
  });
}
