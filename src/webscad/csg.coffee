
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

#### CSG OPERATIONS

exports.Union = class Union extends CsgNode

  constructor: (@nodes)->
    
  children: ['nodes']
