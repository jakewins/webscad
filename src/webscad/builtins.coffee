


csg = if CSG? then CSG else require('../csg_module').CSG
ast = require './ast'

exports.UnimplementedModule = class UnimplementedModule extends ast.Module
  
  constructor : (@name) ->
    super(@name, [])
             
  evaluate : () ->
    throw "'#{@name}' is not implemented."


class CubeModule extends ast.Module

  constructor: ()->
    super('cube', [ 
             new ast.Identifier('size'), 
             new ast.Identifier('center') ])
  
  evaluate : (ctx, submodules) ->
    radius = ctx.getVar('size')
    if not (radius instanceof Array)
      radius = [radius,radius,radius]
    
    center = if ctx.getVar('center') then [radius[0]/2,radius[1]/2,radius[2]/2] else [0,0,0]
      
    csg.cube({ radius : radius, center : center})

class SphereModule extends ast.Module

  constructor: ()->
    super('sphere', [ new ast.Identifier('r') ])

  evaluate : (ctx, submodules) ->
    radius = ctx.getVar('r')
    csg.sphere({ radius : radius, center : [0,0,0]})

class CylinderModule extends ast.Module

  constructor: ()->
    super('cylinder', [ new ast.Identifier('h'), 
                        new ast.Identifier('r1'), 
                        new ast.Identifier('r2'), 
                        new ast.Identifier('r'), 
                        new ast.Identifier('center') ])

  evaluate : (ctx, submodules) ->
    # TODO: support for r1 and r2
    radius = ctx.getVar('r')
    height = ctx.getVar('h')
    
    csg.cylinder({ radius : radius, center : [0,0,0]})


class CSGOperationModule extends ast.Module

  constructor: (name, @_csgName)->
    super(name, [])
    
  evaluate : (ctx, submodules) ->
    for submodule in submodules
      if not result?
        result = submodule
      else
        result = result[@_csgName](submodule)
    result
  
unionModule      = new CSGOperationModule 'union', 'union'
intersectModule  = new CSGOperationModule 'intersect', 'intersect'
differenceModule = new CSGOperationModule 'difference', 'union'
    
class TranslateModule extends ast.Module

  constructor: ()->
    super('translate', [new ast.Identifier('v')])

  evaluate : (ctx, submodules) ->
    vector = ctx.getVar('v')
    for submodule in submodules
      submodule.translate(vector)
  

exports.modules = 
  # Primitives
  cube       : new CubeModule()
  cylinder   : new CylinderModule()
  sphere     : new SphereModule()
  polyhedron : new UnimplementedModule('polyhedron')
  square : new UnimplementedModule('square')
  circle : new UnimplementedModule('circle')
  polygon : new UnimplementedModule('polygon')
  
  # CSG operations
  union        : unionModule
  difference   : new UnimplementedModule('difference')
  intersection : intersectModule
  render       : new UnimplementedModule('render')
  
  translate : new TranslateModule
  
exports.functions = {}
