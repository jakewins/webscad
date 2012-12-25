


csg = if CSG? then CSG else require('../csg_module').CSG
ast = require './ast'

defineModule = (params, func) ->
  func.params = params
  func


unimplementedModule = (name) ->
  defineModule [], () -> throw "'#{@name}' is not implemented."


cubeModule = defineModule ['size'], (ctx, submodules) ->
  radius = ctx.getVar('size')
  if not (radius instanceof Array)
    radius = [radius,radius,radius]
  
  center = if ctx.getVar('center') then [radius[0]/2,radius[1]/2,radius[2]/2] else [0,0,0]
    
  csg.cube({ radius : radius, center : center})

sphereModule = defineModule ['r'], (ctx, submodules) ->
  radius = ctx.getVar('r')
  csg.sphere({ radius : radius, center : [0,0,0]})

cylinderModule = defineModule ['h', 'r1', 'r2', 'r'], (ctx, submodules) ->
  # TODO: support for r1 and r2
  radius = ctx.getVar('r')
  height = ctx.getVar('h')
  
  csg.cylinder({ radius : radius, center : [0,0,0]})


csgOperationModule = (csgName) ->
  defineModule [], (ctx, submodules) ->
    for submodule in submodules
      if not result?
        result = submodule
      else
        result = result[csgName](submodule)
    result
  
unionModule      = csgOperationModule 'union'
intersectModule  = csgOperationModule 'intersect'
differenceModule = csgOperationModule 'subtract'
    
translateModule = defineModule ['v'], (ctx, submodules) ->
  vector = ctx.getVar('v')
  for submodule in submodules
    submodule.translate(vector)
  

exports.modules = 
  # Primitives
  cube       : cubeModule
  cylinder   : cylinderModule
  sphere     : sphereModule
  polyhedron : unimplementedModule('polyhedron')
  square     : unimplementedModule('square')
  circle     : unimplementedModule('circle')
  polygon    : unimplementedModule('polygon')
  
  # CSG operations
  union        : unionModule
  difference   : differenceModule
  intersection : intersectModule
  render       : unimplementedModule('render')
  
  translate : translateModule
  
exports.functions = {}
