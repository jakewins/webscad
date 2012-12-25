// Generated by CoffeeScript 1.4.0

/*
This file defines node classes
for the CSG tree. The CSG tree is the
result of evaluating the AST, and
describes a set of CSG operations to
be performed to yield a 3d model.
*/


(function() {
  var CsgNode, Cube, NefPolyhedron, PolyhedronBuilder, TreeNode, Union, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  TreeNode = require('./tree').TreeNode;

  _ref = require('./geometry'), PolyhedronBuilder = _ref.PolyhedronBuilder, NefPolyhedron = _ref.NefPolyhedron;

  CsgNode = (function(_super) {

    __extends(CsgNode, _super);

    function CsgNode() {
      return CsgNode.__super__.constructor.apply(this, arguments);
    }

    return CsgNode;

  })(TreeNode);

  exports.Cube = Cube = (function(_super) {

    __extends(Cube, _super);

    Cube.prototype.toStringAttrs = ['x', 'y', 'z', 'center'];

    function Cube(size, center) {
      this.center = center;
      if (size instanceof Array) {
        this.x = size[0], this.y = size[1], this.z = size[2];
      } else {
        this.x = this.y = this.z = size;
      }
    }

    Cube.prototype.evaluate = function() {
      var polygons, v0, v1, v2, v3, v4, v5, v6, v7, x1, x2, y1, y2, z1, z2, _ref1, _ref2;
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
      _ref1 = [[x1, y1, z1], [x2, y1, z1], [x2, y2, z1], [x1, y2, z1]], v0 = _ref1[0], v1 = _ref1[1], v2 = _ref1[2], v3 = _ref1[3];
      _ref2 = [[x1, y1, z2], [x2, y1, z2], [x2, y2, z2], [x1, y2, z2]], v4 = _ref2[0], v5 = _ref2[1], v6 = _ref2[2], v7 = _ref2[3];
      polygons = [[v0, v1, v2, v3], [v7, v6, v5, v4], [v0, v4, v5, v1], [v3, v7, v4, v0], [v2, v6, v7, v3], [v1, v5, v6, v2]];
      return new NefPolyhedron(PolyhedronBuilder.fromPolygons(polygons));
    };

    return Cube;

  })(CsgNode);

  exports.Union = Union = (function(_super) {

    __extends(Union, _super);

    function Union(nodes) {
      this.nodes = nodes;
    }

    Union.prototype.children = ['nodes'];

    Union.prototype.evaluate = function() {
      var first, node, polyhedron, _i, _len, _ref1;
      first = true;
      _ref1 = this.nodes;
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        node = _ref1[_i];
        if (first) {
          first = false;
          polyhedron = node.evaluate();
        } else {
          polyhedron.union(node.evaluate());
        }
      }
      return polyhedron;
    };

    return Union;

  })(CsgNode);

}).call(this);