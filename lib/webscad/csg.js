(function() {
  /*
  This file defines node classes
  for the CSG tree. The CSG tree is the
  result of evaluating the AST, and
  describes a set of CSG operations to
  be performed to yield a 3d model.
  */  var CsgNode, Cube, TreeNode, Union;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  };
  TreeNode = require('./tree').TreeNode;
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
    }
    Cube.prototype.render = function() {};
    return Cube;
  })();
  exports.Union = Union = (function() {
    __extends(Union, CsgNode);
    function Union(nodes) {
      this.nodes = nodes;
    }
    Union.prototype.children = ['nodes'];
    Union.prototype.render = function() {
      var first, node, polyhedron, _i, _len, _ref, _results;
      first = true;
      _ref = this.nodes;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        node = _ref[_i];
        _results.push(first ? (first = false, polyhedron = node.render()) : polyhedron.union(node.render()));
      }
      return _results;
    };
    return Union;
  })();
}).call(this);
