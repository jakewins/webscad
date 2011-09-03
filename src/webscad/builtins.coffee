

csg = require './csg'
ast = require './ast'

exports.UnimplementedModule = class UnimplementedModule extends ast.Module
  
  constructor : (@name) ->
  
  evaluate : () ->
    throw "'#{@name}' is not implemented."


class CubeModule extends ast.Module

  constructor: ()->
    super('cube', [ 
             new ast.Identifier('size'), 
             new ast.Identifier('center') ])
  
  evaluate : (ctx, submodules) ->
    new csg.Cube(ctx.getVar('size'),ctx.getVar('center'))


exports.modules = 
  # Primitives
  cube : new CubeModule()
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
