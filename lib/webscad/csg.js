(function() {
  /*
  This file defines node classes
  for the CSG tree. The CSG tree is the
  result of evaluating the AST, and
  describes a set of CSG operations to
  be performed to yield a 3d model.
  */  var CsgNode, Cube, PolyhedronBuilder, TreeNode, Union;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  };
  TreeNode = require('./tree').TreeNode;
  PolyhedronBuilder = require('./geometry').PolyhedronBuilder;
  CsgNode = (function() {
    __extends(CsgNode, TreeNode);
    function CsgNode() {
      CsgNode.__super__.constructor.apply(this, arguments);
    }
    return CsgNode;
  })();
  exports.Cube = Cube = (function() {
    __extends(Cube, CsgNode);
    Cube.prototype.toStringAttrs = ['size', 'center'];
    function Cube(size, center) {
      this.size = size;
      this.center = center;
      this.x = this.y = this.z = this.size;
    }
    Cube.prototype.render = function() {
      var polygons, x1, x2, y1, y2, z1, z2;
      if (this.center) {
        x1 = -this.x / 2;
        x2 = +this.x / 2;
        y1 = -this.y / 2;
        y2 = +this.y / 2;
        z1 = -this.z / 2;
        z2 = +this.z / 2;
      } else {
        x1 = y1 = z1 = 0;
        x2 = this.x;
        y2 = this.y;
        z2 = this.z;
      }
      polygons = [[[x1, y1, z2], [x2, y1, z2], [x2, y2, z2], [x1, y2, z2]], [[x1, y2, z1], [x1, y2, z1], [x2, y2, z1], [x2, y1, z1]], [[x1, y1, z1], [x2, y1, z1], [x2, y1, z2], [x1, y1, z2]], [[x2, y1, z1], [x2, y2, z1], [x2, y2, z2], [x2, y1, z2]], [[x2, y2, z1], [x1, y2, z1], [x1, y2, z2], [x2, y2, z2]], [[x1, y2, z1], [x1, y1, z1], [x1, y1, z2], [x1, y2, z2]]];
      return PolyhedronBuilder.fromPolygons(polygons);
    };
    return Cube;
  })();
  exports.Union = Union = (function() {
    __extends(Union, CsgNode);
    function Union(nodes) {
      this.nodes = nodes;
    }
    Union.prototype.children = ['nodes'];
    Union.prototype.render = function() {
      var first, node, polyhedron, _i, _len, _ref;
      first = true;
      _ref = this.nodes;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        node = _ref[_i];
        if (first) {
          first = false;
          polyhedron = node.render();
        } else {
          polyhedron.union(node.render());
        }
      }
      return polyhedron;
    };
    return Union;
  })();
}).call(this);
