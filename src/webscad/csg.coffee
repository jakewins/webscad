
###
This file defines node classes
for the CSG tree. The CSG tree is the
result of evaluating the AST, and
describes a set of CSG operations to
be performed to yield a 3d model.
###

{TreeNode} = require './tree'

class CsgNode extends TreeNode


#### PRIMITIVES

exports.Cube = class Cube extends CsgNode

  toStringAttrs:['size','center']

  constructor:(@size,@center)->
  
  render:()->
    

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
