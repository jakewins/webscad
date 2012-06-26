
###
This file defines node classes
for the CSG tree. The CSG tree is the
result of evaluating the AST, and
describes a set of CSG operations to
be performed to yield a 3d model.
###

{TreeNode} = require './tree'
{PolyhedronBuilder, NefPolyhedron} = require './geometry'

class CsgNode extends TreeNode


#### PRIMITIVES

exports.Cube = class Cube extends CsgNode

  toStringAttrs:['x','y','z','center']

  constructor:(size,@center)->
    if size instanceof Array
      [@x,@y,@z] = size
    else
      @x = @y = @z = size
  
  evaluate:()->
    if @center
      x1 = -@x/2
      x2 = +@x/2
      y1 = -@y/2
      y2 = +@y/2
      z1 = -@z/2
      z2 = +@z/2
    else
      x1 = y1 = z1 = 0
      x2 = @x
      y2 = @y
      z2 = @z

    # Bottom vertexes
    [v0,v1,v2,v3] = [[x1,y1,z1],[x2,y1,z1],[x2,y2,z1],[x1,y2,z1]]
      
    # Top vertexes
    [v4,v5,v6,v7] = [[x1,y1,z2],[x2,y1,z2],[x2,y2,z2],[x1,y2,z2]]
  
    polygons = [
      [v0,v1,v2,v3] # Bottom
      [v7,v6,v5,v4] # Top
      [v0,v4,v5,v1] # Side A
      [v3,v7,v4,v0] # Side B
      [v2,v6,v7,v3] # Sice C
      [v1,v5,v6,v2] # Side D
    ]

    new NefPolyhedron PolyhedronBuilder.fromPolygons polygons

#### CSG OPERATIONS

exports.Union = class Union extends CsgNode

  constructor: (@nodes)->
    
  children: ['nodes']
  
  evaluate:()->
    first = true
    for node in @nodes
      if first
        first = false
        polyhedron = node.evaluate()
      else
        polyhedron.union node.evaluate()
    return polyhedron
