(function() {
  var TAB, TreeNode, flatten;
  flatten = require('./helpers').flatten;
  TAB = '  ';
  exports.TreeNode = TreeNode = (function() {
    function TreeNode() {}
    TreeNode.prototype.children = [];
    TreeNode.prototype.toStringAttrs = [];
    TreeNode.prototype.contains = function(pred) {
      var contains;
      contains = false;
      this.traverseChildren(function(node) {
        if (pred(node)) {
          contains = true;
          return false;
        }
      });
      return contains;
    };
    TreeNode.prototype.containsType = function(type) {
      return this instanceof type || this.contains(function(node) {
        return node instanceof type;
      });
    };
    TreeNode.prototype.toString = function(idt, name) {
      var a, attr, tree;
      if (idt == null) {
        idt = '';
      }
      if (name == null) {
        name = this.constructor.name;
      }
      tree = '\n' + idt + name;
      if (this.toStringAttrs.length > 0) {
        a = (function() {
          var _i, _len, _ref, _results;
          _ref = this.toStringAttrs;
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            attr = _ref[_i];
            _results.push(this[attr]);
          }
          return _results;
        }).call(this);
        tree += "(" + a.join(',') + ")";
      }
      this.eachChild(function(node) {
        return tree += node.toString(idt + TAB);
      });
      return tree;
    };
    TreeNode.prototype.eachChild = function(func) {
      var attr, child, _i, _j, _len, _len2, _ref, _ref2;
      if (!this.children) {
        return this;
      }
      _ref = this.children;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        attr = _ref[_i];
        if (this[attr]) {
          _ref2 = flatten([this[attr]]);
          for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
            child = _ref2[_j];
            if (func(child) === false) {
              return this;
            }
          }
        }
      }
      return this;
    };
    TreeNode.prototype.traverseChildren = function(func) {
      return this.eachChild(function(child) {
        if (func(child) === false) {
          return false;
        }
        return child.traverseChildren(func);
      });
    };
    return TreeNode;
  })();
}).call(this);
