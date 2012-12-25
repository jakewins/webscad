


csg = if CSG? then CSG else require('../csg_module').CSG
ast = require './ast'

defineModule = (params, func) ->
  func.params = params
  func

unimplementedModule = (name) ->
  defineModule [], () -> throw "'#{@name}' is not implemented."

#
# Primitive Objects
#

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


#
# Mutating operations
#


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

rotateModule = defineModule ['a', 'v'], (ctx, submodules) ->
  angle   = ctx.getVar('a')
  vectors = ctx.getVar('v')
  
  if not (vectors?) or vectors.length != 3
    throw new Error("You need to provide a three-value vector to rotate. Got '#{vectors}'.")
  
  if angle? then vectors = [vectors[0] * angle, vectors[1] * angle, vectors[2] * angle]
  
  for submodule in submodules
    if vectors[0] != 0 then submodule = submodule.rotateX vectors[0]
    if vectors[1] != 0 then submodule = submodule.rotateY vectors[1]
    if vectors[2] != 0 then submodule = submodule.rotateZ vectors[2]
    submodule
    
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
  
  translate    : translateModule
  rotate       : rotateModule
  
exports.functions = {}
