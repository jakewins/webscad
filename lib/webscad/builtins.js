(function() {
  var CubeModule, UnimplementedModule, ast, csg;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  };
  csg = require('./csg');
  ast = require('./ast');
  exports.UnimplementedModule = UnimplementedModule = (function() {
    __extends(UnimplementedModule, ast.Module);
    function UnimplementedModule(name) {
      this.name = name;
    }
    UnimplementedModule.prototype.evaluate = function() {
      throw "'" + this.name + "' is not implemented.";
    };
    return UnimplementedModule;
  })();
  CubeModule = (function() {
    __extends(CubeModule, ast.Module);
    function CubeModule() {
      CubeModule.__super__.constructor.call(this, 'cube', [new ast.Identifier('size'), new ast.Identifier('center')]);
    }
    CubeModule.prototype.evaluate = function(ctx, submodules) {
      return new csg.Cube(ctx.getVar('size'), ctx.getVar('center'));
    };
    return CubeModule;
  })();
  exports.modules = {
    cube: new CubeModule(),
    cylinder: new UnimplementedModule('cylinder'),
    sphere: new UnimplementedModule('sphere'),
    polyhedron: new UnimplementedModule('polyhedron'),
    square: new UnimplementedModule('square'),
    circle: new UnimplementedModule('circle'),
    polygon: new UnimplementedModule('polygon'),
    union: new UnimplementedModule('union'),
    difference: new UnimplementedModule('difference'),
    intersection: new UnimplementedModule('intersection'),
    render: new UnimplementedModule('render')
  };
  exports.functions = {};
}).call(this);
