

csg = require './csg'

exports.UnimplementedModule = class UnimplementedModule
  
  constructor : (@name) ->
  
  evaluate : () ->
    throw "'#{@name}' is not implemented."


class CubeModule
  
  evaluate : () ->
    new csg.Cube


exports.modules = 
  # Primitives
  cube : new CubeModule('cube')
  cylinder : new UnimplementedModule('cylinder')
  sphere : new UnimplementedModule('sphere')
  polyhedron : new UnimplementedModule('polyhedron')
  square : new UnimplementedModule('square')
  circle : new UnimplementedModule('circle')
  polygon : new UnimplementedModule('polygon')
  
  # CSG operations
  union : new UnimplementedModule('union')
  difference : new UnimplementedModule('difference')
  intersection : new UnimplementedModule('intersection')
  render : new UnimplementedModule('render')
  
exports.functions = {}
