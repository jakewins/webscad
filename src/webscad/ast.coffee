# `nodes.coffee` contains all of the node classes for the syntax tree. Most
# nodes are created as the result of actions in the [grammar](grammar.html),
# but some are created by other nodes as a method of code generation. To convert
# the syntax tree into a string of JavaScript code, call `compile()` on the root.

# Import the helpers we plan to use.
{compact, flatten, extend, merge, del, starts, ends, last} = require './helpers'

{TreeNode} = require './tree'

exports.extend = extend  # for parser

# Constant functions for nodes that don't need customization.
YES     = -> yes
NO      = -> no
THIS    = -> this
NEGATE  = -> @negated = not @negated; this

exports.Context = class Context

  constructor: (@parent) ->
    @_modules = {}
    @_functions = {}
    @_vars = {}
    
  getModule: (name)->
    @_get name, "_modules", "No module named #{name}"
    
  getVar: (name)->
    @_get name, "_vars", null, true
    
  getFunction: (name)->
    @_get name, "_functions", "No function named #{name}"
    
  addVar: (name, val)->
    @_vars[name] = val
    
  addFunction: (name, func)->
    @_functions[name] = func
    
  addModule: (name, module)->
    @_modules[name] = module
    
  _get : (name, attrname, errMsgOrDefault, hasDefault=false)->
    if @[attrname][name]?
      return @[attrname][name]
    if @parent?
      return @parent._get name, attrname, errMsgOrDefault, hasDefault
    if hasDefault
      return errMsgOrDefault
    throw new Error(errMsgOrDefault)
    

#### AstNode

# The **AstNode** is the abstract base class for all nodes in the syntax tree.
exports.AstNode = class AstNode extends TreeNode

  # Pull out the last non-comment node of a node list.
  lastNonComment: (list) ->
    i = list.length
    return list[i] while i-- when list[i] not instanceof Comment
    null
    
  invert: ->
    new Op '!', this

  unwrapAll: ->
    node = this
    continue until node is node = node.unwrap()
    node
    
  evaluate : ->
    throw new Error(this + " does not yet have an evaluate method :(")

  isStatement     : NO
  isComplex       : YES
  isChainable     : NO
  isAssignable    : NO

  unwrap     : THIS
  
#### Block

# The block is a list of statements
exports.Block = class Block extends AstNode
  constructor: (statements) ->
    @statements = compact flatten statements or []

  children: ['statements']

  # Tack an expression on to the end of this expression list.
  push: (node) ->
    @statements.push node
    this

  # Remove and return the last expression of this expression list.
  pop: ->
    @statements.pop()

  # Add an expression at the beginning of this expression list.
  unshift: (node) ->
    @statements.unshift node
    this

  # If this Block consists of just a single node, unwrap it by pulling
  # it back out.
  unwrap: ->
    if @statements.length is 1 then @statements[0] else this

  # Is this an empty block of code?
  isEmpty: ->
    not @statements.length

  isStatement: (o) ->
    yes
      
  # Wrap up the given nodes as an **Block**, unless it already happens
  # to be one.
  @wrap: (nodes) ->
    return nodes[0] if nodes.length is 1 and nodes[0] instanceof Block
    new Block nodes
    
  replaceIncludes: ( load, traverseChildren = true ) ->
    for position in [0..@statements.length]
      statement = @statements[position]
      if statement instanceof Include or statement instanceof Use
        load statement.path, (loaded) =>
          if statement instanceof Include
            loaded = loaded.statements
          else
            loaded = loaded.getModuleDefinitions()
          args = [position, 1].concat loaded
          Array.prototype.splice.apply(@statements, args)
    
    @traverseChildren (node) ->
      if node instanceof Block
        node.replaceIncludes(load, false) 
    this
    
  getModuleDefinitions: ->
    modules = []
    @eachChild (node) ->
      if node instanceof Module
        modules.push node
    modules
    
  evaluate: (ctx) ->
    children = []
    for statement in @statements
      if statement instanceof ModuleCall
        children.push statement
      else
        statement.evaluate ctx
    
    new ModuleCall({name:'union'}, new Arguments, children).evaluate(ctx)

#### Value

# A value, variable or literal or parenthesized, indexed or dotted into,
# or vanilla.
exports.Value = class Value extends AstNode
  constructor: (base, props, tag) ->
    return base if not props and base instanceof Value
    @base       = base
    @properties = props or []
    @[tag]      = true if tag
    return this

  children: ['base', 'properties']

  # Add a property access to the list.
  push: (prop) ->
    @properties.push prop
    this

  hasProperties: ->
    !!@properties.length

  # Some boolean checks for the benefit of other nodes.
  isArray        : -> not @properties.length and @base instanceof Arr
  isComplex      : -> @hasProperties() or @base.isComplex()
  isAssignable   : -> @hasProperties() or @base.isAssignable()

  isAtomic       : ->
    for node in @properties.concat @base
      return no if node instanceof Call
    yes

  isStatement : (o)    -> not @properties.length and @base.isStatement o

  isObject: (onlyGenerated) ->
    return no if @properties.length
    (@base instanceof Obj) and (not onlyGenerated or @base.generated)


  # The value can be unwrapped as its inner node, if there are no attached
  # properties.
  unwrap: ->
    if @properties.length then this else @base

exports.Identifier = class Identifier extends AstNode
  constructor: (@name) ->
  
  toString: (idt = '', name = @constructor.name) ->
    super(idt,name) + ' "' + @name + '"'
    
  evaluate : (ctx) ->
    return ctx.getVar(@name)

exports.BaseValue = class BaseValue extends AstNode
  constructor: (@value) ->
  
  evaluate: (ctx) ->
    @value

exports.UndefinedValue = class UndefinedValue extends BaseValue

exports.NumberValue = class NumberValue extends BaseValue

  toString: (idt = '', name = @constructor.name) ->
    super(idt,name) + ' ' + @value + ''
    
exports.StringValue = class StringValue extends BaseValue

  constructor: (value) ->
    @value = value[1:-1] # Strip the quotes

  toString: (idt = '', name = @constructor.name) ->
    super(idt,name) + ' "' + @value + '"'
    
exports.BooleanValue = class BooleanValue extends BaseValue

  constructor: (value) ->
    @value = value is true or value is 'true'

  toString: (idt = '', name = @constructor.name) ->
    val = if (@value is true) then 'true' else 'false'
    super(idt,name) + ' ' + val

exports.VectorValue = class VectorValue extends BaseValue

  constructor: (objs) ->
    @objects = objs or []

  children: ['objects']

  evaluate : ->
    for obj in @objects
      obj.evaluate()


exports.RangeValue = class RangeValue extends BaseValue

  constructor: (@from, @step, @to) ->

  children: ['from','step','to']


#### Comment

# CoffeeScript passes through block comments as JavaScript block comments
# at the same position.
exports.Comment = class Comment extends AstNode
  constructor: (@comment) ->

  isStatement:     YES
    
  toString: (idt = '', name = @constructor.name) ->
    '\n' + idt + name + ' "' + @comment + '"'
  
  evaluate: ->
    
#### Arguments

# Arguments for a function call or module invocation.
exports.Arguments = class Arguments extends AstNode
    
  children: ['args']
  
  constructor: (@args = []) ->
    @posArgs = []
    @keywordArgs = {}
    
    for arg in @args
      if arg instanceof Assign
        @keywordArgs[arg.variable.name] = arg.value
      else
        @posArgs.push arg
  
  evaluate : (ctx, propNames) ->
    for i in [0...propNames.length]
      propName = propNames[i]
      if i < @posArgs.length
        val = @posArgs[i]
      else
        if @keywordArgs[propName]?
          val = @keywordArgs[propName]
        else
          val = new UndefinedValue
          
      ctx.addVar propName, val.evaluate(ctx)

#### Function call

# Node for a function invocation. Takes care of converting `super()` calls into
# calls against the prototype's function of the same name.
exports.FunctionCall = class FunctionCall extends AstNode
  constructor: (@name, @args = new Arguments) ->
    @name = @name.name
    
  children: ['args']


# Module invocation, this differs from function
# invocation in that it is a statement, and can have
# syntax like: mymodule(arg1,arg2) { childModule(); otherModule(); }
exports.ModuleCall = class ModuleCall extends AstNode

  constructor: (@name, @args = new Arguments, @subModules=[], opts={}) ->
    @name = if @name then @name.name else ""
    @isRoot = opts.isRoot or false
    @isHighlighted = opts.isHighlighted or false
    @isInBackground = opts.isInBackground or false
    @isIgnored = opts.isIgnored or false
    
  children: ['args', 'subModules']
  
  setIsRoot : (@isRoot) -> this
  setIsHighlighted : (@isHighlighted) -> this
  setIsInBackground : (@isInBackground) -> this
  setIsIgnored : (@isIgnored) -> this
  
  toString: (idt = '', name = @constructor.name) ->
    modifiers = []
    for m in ['isRoot','isHighlighted','isInBackground','isIgnored']
      if this[m]
        modifiers.push m[2..]
    modifiers = "(" + (modifiers.join ',') + ")"
    tree = '\n' + idt + name + modifiers
    @eachChild (node) -> tree += node.toString idt + TAB
    tree
    
  evaluate: (ctx)->
    
    ctx = new Context(ctx)
  
    childCalls = for child in @subModules
      child.evaluate ctx
    
    module = ctx.getModule(@name)
    @args.evaluate ctx, module.params
    
    module(ctx, childCalls)

#### MemberAccess

# A `.` access into a property of a value
exports.MemberAccess = class MemberAccess extends AstNode
  constructor: (@objectExpression, @memberName) ->

  children: ['objectExpression','memberName']

  isComplex: NO

#### IndexAccess

# A `[ ... ]` indexed access into a vector
exports.IndexAccess = class IndexAccess extends AstNode
  constructor: (@vectorExpression, @indexExpression) ->

  children: ['vectorExpression','indexExpression']

  isComplex: ->
    @index.isComplex()

#### Range

# A range literal. Ranges can be used to extract portions (slices) of arrays,
# to specify a range for comprehensions, or as a value, to be expanded into the
# corresponding array of integers at runtime.
exports.Range = class Range extends AstNode

  children: ['from', 'to']

  constructor: (@from, @to, tag) ->
    @exclusive = tag is 'exclusive'
    @equals = if @exclusive then '' else '='

#### Module

### A module in the AST represents the 
definition of a module, with a name, 
a declaration of arguments, and a module block, or 
body.
###
exports.Module = class Module extends AstNode
  constructor: (@name, @params=[], @body = new Block) ->
    # no-op

  children: ['name', 'params', 'body']
  
  evaluate : (ctx)->
    body = @body
    func = (runtimeCtx, subModules) ->
      body.evaluate(runtimeCtx)
    func.params = [param.name for param in @params]
    ctx.addModule @name.name, func


#### Assign

# The **Assign** is used to assign a local variable to value, or to set the
# property of an object -- including within object literals.
exports.Assign = class Assign extends AstNode
  constructor: (@variable, @value, @context, options) ->
    @param = options and options.param

  children: ['variable', 'value']
  
#### Code

# A function definition. 
exports.Code = class Code extends AstNode
  constructor: (@name, params, @expression) ->
    @params  = params or []

  children: ['name', 'params', 'expression']

  isStatement: -> !!@ctor

  # Short-circuit `traverseChildren` method to prevent it from crossing scope boundaries
  # unless `crossScope` is `true`.
  traverseChildren: (crossScope, func) ->
    super(crossScope, func) if crossScope

#### Arithmetics

exports.Op = class Op extends AstNode
  constructor: (op, first, second, flip ) ->
    @operator = op
    @first    = first
    @second   = second
    @flip     = !!flip
    return this

  children: ['first', 'second']

  toString: (idt) ->
    super idt, @constructor.name + ' ' + @operator

#### Use

exports.Use = class Use extends AstNode

  constructor: (@path) ->

  toString: (idt = '', name = @constructor.name) ->
    super(idt,name) + ' "' + @path + '"'

#### Include

exports.Include = class Include extends AstNode

  constructor: (@path) ->

  toString: (idt = '', name = @constructor.name) ->
    super(idt,name) + ' "' + @path + '"'

#### Conditional

# 1>1 ? true : false

exports.Conditional = class Conditional extends AstNode
  constructor: (@condition, @trueExpression, @falseExpression) ->

  children: ['condition', 'trueExpression', 'falseExpression']

#### If

# *If/else* statements. Acts as an expression by pushing down requested returns
# to the last line of each clause.
#
# Single-expression **Ifs** are compiled into conditional operators if possible,
# because ternaries are already proper expressions, and don't need conversion.
exports.If = class If extends AstNode
  constructor: (@condition, @body, options = {}) ->
    @elseBody  = null
    @isChain   = false

  children: ['condition', 'body', 'elseBody']

  bodyNode:     -> @body?.unwrap()
  elseBodyNode: -> @elseBody?.unwrap()

  # Rewrite a chain of **Ifs** to add a default case as the final *else*.
  addElse: (elseBody) ->
    if @isChain
      @elseBodyNode().addElse elseBody
    else
      @isChain  = elseBody instanceof If
      @elseBody = @ensureBlock elseBody
    this

  ensureBlock: (node) ->
    if node instanceof Block then node else new Block [node]

# Constants
# ---------

# Tabs are two spaces for pretty printing.
TAB = '  '

SIMPLENUM  = /^[+-]?\d+$/

# Is a literal value a string?
IS_STRING = /^['"]/
