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
    return Cube;
  })();
  exports.Union = Union = (function() {
    __extends(Union, CsgNode);
    function Union(nodes) {
      this.nodes = nodes;
    }
    Union.prototype.children = ['nodes'];
    return Union;
  })();
}).call(this);
