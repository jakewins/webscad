(function() {
  var CubeModule, UnimplementedModule, csg;
  csg = require('./csg');
  exports.UnimplementedModule = UnimplementedModule = (function() {
    function UnimplementedModule(name) {
      this.name = name;
    }
    UnimplementedModule.prototype.evaluate = function() {
      throw "'" + this.name + "' is not implemented.";
    };
    return UnimplementedModule;
  })();
  CubeModule = (function() {
    function CubeModule() {}
    CubeModule.prototype.evaluate = function() {
      return new csg.Cube;
    };
    return CubeModule;
  })();
  exports.modules = {
    cube: new CubeModule('cube'),
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
