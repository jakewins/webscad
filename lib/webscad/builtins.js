// Generated by CoffeeScript 1.4.0
(function() {
  var ast, csg, csgOperationModule, cubeModule, cylinderModule, defineModule, differenceModule, intersectModule, mirrorModule, polyhedronModule, rotateModule, scaleModule, sphereModule, translateModule, unimplementedModule, unionModule;

  csg = typeof CSG !== "undefined" && CSG !== null ? CSG : require('../csg_module').CSG;

  ast = require('./ast');

  defineModule = function(params, func) {
    func.params = params;
    return func;
  };

  unimplementedModule = function(name) {
    return defineModule([], function() {
      throw "module '" + name + "' is not implemented.";
    });
  };

  cubeModule = defineModule(['size'], function(ctx, submodules) {
    var center, radius;
    radius = ctx.getVar('size');
    if (!(radius instanceof Array)) {
      radius = [radius, radius, radius];
    }
    center = ctx.getVar('center') ? [radius[0] / 2, radius[1] / 2, radius[2] / 2] : [0, 0, 0];
    return csg.cube({
      radius: radius,
      center: center
    });
  });

  sphereModule = defineModule(['r'], function(ctx, submodules) {
    var radius;
    radius = ctx.getVar('r');
    return csg.sphere({
      radius: radius,
      center: [0, 0, 0]
    });
  });

  cylinderModule = defineModule(['h', 'r1', 'r2', 'r'], function(ctx, submodules) {
    var height, radius;
    radius = ctx.getVar('r');
    height = ctx.getVar('h');
    return csg.cylinder({
      radius: radius,
      center: [0, 0, 0]
    });
  });

  polyhedronModule = defineModule(['points', 'triangles'], function(ctx, submodules) {
    var pointId, points, polygons, triangle, triangles, vertexes, x, y, z;
    points = ctx.getVar('points');
    triangles = ctx.getVar('triangles');
    polygons = (function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = triangles.length; _i < _len; _i++) {
        triangle = triangles[_i];
        vertexes = (function() {
          var _j, _len1, _ref, _results1;
          _results1 = [];
          for (_j = 0, _len1 = triangle.length; _j < _len1; _j++) {
            pointId = triangle[_j];
            _ref = points[pointId], x = _ref[0], y = _ref[1], z = _ref[2];
            _results1.push(new CSG.Vertex(new CSG.Vector3D(x, y, z)));
          }
          return _results1;
        })();
        _results.push(new CSG.Polygon(vertexes));
      }
      return _results;
    })();
    return csg.fromPolygons(polygons);
  });

  csgOperationModule = function(csgName) {
    return defineModule([], function(ctx, submodules) {
      var result, submodule, _i, _len;
      for (_i = 0, _len = submodules.length; _i < _len; _i++) {
        submodule = submodules[_i];
        if (!(typeof result !== "undefined" && result !== null)) {
          result = submodule;
        } else {
          result = result[csgName](submodule);
        }
      }
      return result;
    });
  };

  unionModule = csgOperationModule('union');

  intersectModule = csgOperationModule('intersect');

  differenceModule = csgOperationModule('subtract');

  rotateModule = defineModule(['a', 'v'], function(ctx, submodules) {
    var angle, submodule, x, y, z, _i, _len, _ref, _ref1, _results;
    angle = ctx.getVar('a');
    _ref = ctx.getVar('v') || [0, 0, 1], x = _ref[0], y = _ref[1], z = _ref[2];
    if (angle != null) {
      _ref1 = [x * angle, y * angle, z * angle], x = _ref1[0], y = _ref1[1], z = _ref1[2];
    }
    _results = [];
    for (_i = 0, _len = submodules.length; _i < _len; _i++) {
      submodule = submodules[_i];
      if (x !== 0) {
        submodule = submodule.rotateX(x);
      }
      if (y !== 0) {
        submodule = submodule.rotateY(y);
      }
      if (z !== 0) {
        submodule = submodule.rotateZ(z);
      }
      _results.push(submodule);
    }
    return _results;
  });

  translateModule = defineModule(['v'], function(ctx, submodules) {
    var submodule, vector, _i, _len, _results;
    vector = ctx.getVar('v');
    _results = [];
    for (_i = 0, _len = submodules.length; _i < _len; _i++) {
      submodule = submodules[_i];
      _results.push(submodule.translate(vector));
    }
    return _results;
  });

  scaleModule = defineModule(['v'], function(ctx, submodules) {
    var submodule, vector, _i, _len, _results;
    vector = ctx.getVar('v');
    _results = [];
    for (_i = 0, _len = submodules.length; _i < _len; _i++) {
      submodule = submodules[_i];
      _results.push(submodule.scale(vector));
    }
    return _results;
  });

  mirrorModule = defineModule(['v'], function(ctx, submodules) {
    var submodule, x, y, z, _i, _len, _ref, _results;
    _ref = ctx.getVar('v'), x = _ref[0], y = _ref[1], z = _ref[2];
    _results = [];
    for (_i = 0, _len = submodules.length; _i < _len; _i++) {
      submodule = submodules[_i];
      if (x !== 0) {
        submodule = submodule.mirroredX();
      }
      if (y !== 0) {
        submodule = submodule.mirroredY();
      }
      if (z !== 0) {
        submodule = submodule.mirroredZ();
      }
      _results.push(submodule);
    }
    return _results;
  });

  exports.modules = {
    cube: cubeModule,
    cylinder: cylinderModule,
    sphere: sphereModule,
    polyhedron: polyhedronModule,
    square: unimplementedModule('square'),
    circle: unimplementedModule('circle'),
    polygon: unimplementedModule('polygon'),
    union: unionModule,
    difference: differenceModule,
    intersection: intersectModule,
    render: unimplementedModule('render'),
    translate: translateModule,
    rotate: rotateModule,
    scale: scaleModule,
    mirror: mirrorModule
  };

  exports.functions = {};

}).call(this);
