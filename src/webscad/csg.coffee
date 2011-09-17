
###
This file defines node classes
for the CSG tree. The CSG tree is the
result of evaluating the AST, and
describes a set of CSG operations to
be performed to yield a 3d model.
###

{TreeNode} = require './tree'
{PolyhedronBuilder} = require './geometry'

class CsgNode extends TreeNode


#### PRIMITIVES

exports.Cube = class Cube extends CsgNode

  toStringAttrs:['size','center']

  constructor:(@size,@center)->
    @x = @y = @z = @size
  
  render:()->
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
  
    polygons = [
      # Top
      [[x1,y1,z2],[x2,y1,z2]
       [x2,y2,z2],[x1,y2,z2]]
      
      # Bottom
      [[x1,y2,z1],[x1,y2,z1]
       [x2,y2,z1],[x2,y1,z1]]
       
      # Side 1
      [[x1,y1,z1],[x2,y1,z1]
       [x2,y1,z2],[x1,y1,z2]]
       
      # Side 2
      [[x2,y1,z1],[x2,y2,z1]
       [x2,y2,z2],[x2,y1,z2]]
       
      # Side 3
      [[x2,y2,z1],[x1,y2,z1]
       [x1,y2,z2],[x2,y2,z2]]
       
      # Side 4
      [[x1,y2,z1],[x1,y1,z1]
       [x1,y1,z2],[x1,y2,z2]]
    ]
  
    PolyhedronBuilder.fromPolygons polygons

#### CSG OPERATIONS

exports.Union = class Union extends CsgNode

  constructor: (@nodes)->
    
  children: ['nodes']
  
  render:()->
    first = true
    for node in @nodes
      if first
        first = false
        polyhedron = node.render()
      else
        polyhedron.union node.render()
    return polyhedron
