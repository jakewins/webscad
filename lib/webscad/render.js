// Generated by CoffeeScript 1.3.3
(function() {
  var Scad, scad;

  Scad = require('./scad').Scad;

  scad = new Scad;

  exports.render = function(text) {
    var nefPoly;
    return nefPoly = scad.evalCsg(text);
  };

}).call(this);
