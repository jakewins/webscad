
{flatten} = require './helpers'

TAB = '  '

exports.TreeNode = class TreeNode

  children: []
  
  toStringAttrs: []

  # Does this node, or any of its children, contain a node of a certain kind?
  # Recursively traverses down the *children* of the nodes, yielding to a block
  # and returning true when the block finds a match. `contains` does not cross
  # scope boundaries.
  contains: (pred) ->
    contains = no
    @traverseChildren (node) ->
      if pred node
        contains = yes
        return no
    contains

  # Is this node of a certain type, or does it contain the type?
  containsType: (type) ->
    this instanceof type or @contains (node) -> node instanceof type

  # `toString` representation of the node, for inspecting the tree.
  toString: (idt = '', name = @constructor.name) ->
    tree = '\n' + idt + name
    if @toStringAttrs.length > 0
      a = for attr in @toStringAttrs
        @[attr]
      tree += "(" + a.join(',') + ")"
    @eachChild (node) -> tree += node.toString idt + TAB
    tree

  # Passes each child to a function, breaking when the function returns `false`.
  eachChild: (func) ->
    return this unless @children
    for attr in @children when @[attr]
      for child in flatten [@[attr]]
        return this if func(child) is false
    this

  traverseChildren: (func) ->
    @eachChild (child) ->
      return false if func(child) is false
      child.traverseChildren func

