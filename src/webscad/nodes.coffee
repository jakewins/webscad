# `nodes.coffee` contains all of the node classes for the syntax tree. Most
# nodes are created as the result of actions in the [grammar](grammar.html),
# but some are created by other nodes as a method of code generation. To convert
# the syntax tree into a string of JavaScript code, call `compile()` on the root.

{Scope} = require './scope'

# Import the helpers we plan to use.
{compact, flatten, extend, merge, del, starts, ends, last} = require './helpers'

exports.extend = extend  # for parser

# Constant functions for nodes that don't need customization.
YES     = -> yes
NO      = -> no
THIS    = -> this
NEGATE  = -> @negated = not @negated; this

#### Base

# The **Base** is the abstract base class for all nodes in the syntax tree.
exports.Base = class Base
  # Construct a node that returns the current node's result.
  # Note that this is overridden for smarter behavior for
  # many statement nodes (e.g. If, For)...
  makeReturn: ->
    new Return this

  # Does this node, or any of its children, contain a node of a certain kind?
  # Recursively traverses down the *children* of the nodes, yielding to a block
  # and returning true when the block finds a match. `contains` does not cross
  # scope boundaries.
  contains: (pred) ->
    contains = no
    @traverseChildren no, (node) ->
      if pred node
        contains = yes
        return no
    contains

  # Is this node of a certain type, or does it contain the type?
  containsType: (type) ->
    this instanceof type or @contains (node) -> node instanceof type

  # Pull out the last non-comment node of a node list.
  lastNonComment: (list) ->
    i = list.length
    return list[i] while i-- when list[i] not instanceof Comment
    null

  # `toString` representation of the node, for inspecting the parse tree.
  # This is what `coffee --nodes` prints out.
  toString: (idt = '', name = @constructor.name) ->
    tree = '\n' + idt + name
    @eachChild (node) -> tree += node.toString idt + TAB
    tree

  # Passes each child to a function, breaking when the function returns `false`.
  eachChild: (func) ->
    return this unless @children
    for attr in @children when @[attr]
      for child in flatten [@[attr]]
        return this if func(child) is false
    this

  traverseChildren: (crossScope, func) ->
    @eachChild (child) ->
      return false if func(child) is false
      child.traverseChildren crossScope, func

  invert: ->
    new Op '!', this

  unwrapAll: ->
    node = this
    continue until node is node = node.unwrap()
    node

  # Default implementations of the common node properties and methods. Nodes
  # will override these with custom logic, if needed.
  children: []

  isStatement     : NO
  jumps           : NO
  isComplex       : YES
  isChainable     : NO
  isAssignable    : NO

  unwrap     : THIS

  # Is this node used to assign a certain variable?
  assigns: NO

#### Block

# The block is a list of statements
exports.Block = class Block extends Base
  constructor: (nodes) ->
    @statements = compact flatten nodes or []

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

  jumps: (o) ->
    for st in @statements
      return st if st.jumps o
      
  # Wrap up the given nodes as an **Block**, unless it already happens
  # to be one.
  @wrap: (nodes) ->
    return nodes[0] if nodes.length is 1 and nodes[0] instanceof Block
    new Block nodes

#### Literal

# Literals are static values that can be passed through directly into
# JavaScript without translation, such as: strings, numbers,
# `true`, `false`, `null`...
exports.Literal = class Literal extends Base
  constructor: (@value) ->

  makeReturn: ->
    if @isStatement() then this else new Return this

  isAssignable: ->
    IDENTIFIER.test @value

  isStatement: ->
    @value in ['break', 'continue', 'debugger']

  isComplex: NO

  assigns: (name) ->
    name is @value

  jumps: (o) ->
    return no unless @isStatement()
    if not (o and (o.loop or o.block and (@value isnt 'continue'))) then this else no

  toString: ->
    ' "' + @value + '"'

#### Return

# A `return` is a *pureStatement* -- wrapping it in a closure wouldn't
# make sense.
exports.Return = class Return extends Base
  constructor: (expr) ->
    @expression = expr if expr and not expr.unwrap().isUndefined

  children: ['expression']

  isStatement:     YES
  makeReturn:      THIS
  jumps:           THIS

#### Value

# A value, variable or literal or parenthesized, indexed or dotted into,
# or vanilla.
exports.Value = class Value extends Base
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
  isSimpleNumber : -> @base instanceof Literal and SIMPLENUM.test @base.value
  isAtomic       : ->
    for node in @properties.concat @base
      return no if node instanceof Call
    yes

  isStatement : (o)    -> not @properties.length and @base.isStatement o
  assigns     : (name) -> not @properties.length and @base.assigns name
  jumps       : (o)    -> not @properties.length and @base.jumps o

  isObject: (onlyGenerated) ->
    return no if @properties.length
    (@base instanceof Obj) and (not onlyGenerated or @base.generated)

  isSplice: ->
    last(@properties) instanceof Slice

  makeReturn: ->
    if @properties.length then super() else @base.makeReturn()

  # The value can be unwrapped as its inner node, if there are no attached
  # properties.
  unwrap: ->
    if @properties.length then this else @base

exports.Identifier = class Identifier extends Base
  constructor: (@name) ->

  isAssignable: ->
    IDENTIFIER.test @name

  assigns: (name) ->
    name is @name
  
  toString: (idt = '', name = @constructor.name) ->
    super(idt,name) + ' "' + @name + '"'

exports.BaseValue = class BaseValue extends Base
  constructor: (@value) ->

  isAssignable: ->
    IDENTIFIER.test @value

  assigns: (name) ->
    name is @value

exports.UndefinedValue = class UndefinedValue extends BaseValue

exports.NumberValue = class NumberValue extends BaseValue

  toString: (idt = '', name = @constructor.name) ->
    super(idt,name) + ' ' + @value + ''
    
exports.StringValue = class StringValue extends BaseValue

  constructor: (value) ->
    @value = value[1:-1] # Strip the parenthesis

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

  assigns: (name) ->
    for obj in @objects when obj.assigns name then return yes
    no

exports.RangeValue = class RangeValue extends BaseValue

  constructor: (@from, @step, @to) ->

  children: ['from','step','to']

  assigns: (name) ->
    for obj in [@from,@step,@to] when obj.assigns name then return yes
    no

#### Comment

# CoffeeScript passes through block comments as JavaScript block comments
# at the same position.
exports.Comment = class Comment extends Base
  constructor: (@comment) ->

  isStatement:     YES
  makeReturn:      THIS
    
  toString: (idt = '', name = @constructor.name) ->
    '\n' + idt + name + ' "' + @comment + '"'

#### Function call

# Node for a function invocation. Takes care of converting `super()` calls into
# calls against the prototype's function of the same name.
exports.FunctionCall = class FunctionCall extends Base
  constructor: (@variable, @args = []) ->
    
  children: ['variable', 'args']


# Module invocation, this differs from function
# invocation in that it is a statement, and can have
# syntax like: mymodule(arg1,arg2) { childModule(); otherModule(); }
exports.ModuleCall = class ModuleCall extends Base
  constructor: (@name, @args = [], @subModules=[]) ->
    
  children: ['name', 'args', 'subModules']

#### MemberAccess

# A `.` access into a property of a value
exports.MemberAccess = class MemberAccess extends Base
  constructor: (@objectExpression, @memberName) ->

  children: ['objectExpression','memberName']

  isComplex: NO

#### IndexAccess

# A `[ ... ]` indexed access into a vector
exports.IndexAccess = class IndexAccess extends Base
  constructor: (@vectorExpression, @indexExpression) ->

  children: ['vectorExpression','indexExpression']

  isComplex: ->
    @index.isComplex()

#### Range

# A range literal. Ranges can be used to extract portions (slices) of arrays,
# to specify a range for comprehensions, or as a value, to be expanded into the
# corresponding array of integers at runtime.
exports.Range = class Range extends Base

  children: ['from', 'to']

  constructor: (@from, @to, tag) ->
    @exclusive = tag is 'exclusive'
    @equals = if @exclusive then '' else '='

#### Module

exports.Module = class Module extends Base
  constructor: (@variable, @body = new Block) ->
    @boundFuncs = []
    @body.classBody = yes

  children: ['variable', 'body']

#### Assign

# The **Assign** is used to assign a local variable to value, or to set the
# property of an object -- including within object literals.
exports.Assign = class Assign extends Base
  constructor: (@variable, @value, @context, options) ->
    @param = options and options.param

  children: ['variable', 'value']

  assigns: (name) ->
    @[if @context is 'object' then 'value' else 'variable'].assigns name

#### Code

# A function definition. 
exports.Code = class Code extends Base
  constructor: (@name, params, @expression) ->
    @params  = params or []

  children: ['name', 'params', 'expression']

  isStatement: -> !!@ctor

  jumps: NO

  # Short-circuit `traverseChildren` method to prevent it from crossing scope boundaries
  # unless `crossScope` is `true`.
  traverseChildren: (crossScope, func) ->
    super(crossScope, func) if crossScope

#### Op

# Simple Arithmetic and logical operations. Performs some conversion from
# CoffeeScript operations into their JavaScript equivalents.
exports.Op = class Op extends Base
  constructor: (op, first, second, flip ) ->
    return new In first, second if op is 'in'
    if op is 'do'
      call = new Call first, first.params or []
      call.do = yes
      return call
    if op is 'new'
      return first.newInstance() if first instanceof Call and not first.do
      first = new Parens first   if first instanceof Code and first.bound or first.do
    @operator = CONVERSIONS[op] or op
    @first    = first
    @second   = second
    @flip     = !!flip
    return this

  # The map of conversions from CoffeeScript to JavaScript symbols.
  CONVERSIONS =
    '==': '==='
    '!=': '!=='
    'of': 'in'

  # The map of invertible operators.
  INVERSIONS =
    '!==': '==='
    '===': '!=='

  children: ['first', 'second']

  isSimpleNumber: NO

  isUnary: ->
    not @second

  isComplex: ->
    not (@isUnary() and (@operator in ['+', '-'])) or @first.isComplex()

  # Am I capable of
  # [Python-style comparison chaining](http://docs.python.org/reference/expressions.html#notin)?
  isChainable: ->
    @operator in ['<', '>', '>=', '<=', '===', '!==']

  invert: ->
    if @isChainable() and @first.isChainable()
      allInvertable = yes
      curr = this
      while curr and curr.operator
        allInvertable and= (curr.operator of INVERSIONS)
        curr = curr.first
      return new Parens(this).invert() unless allInvertable
      curr = this
      while curr and curr.operator
        curr.invert = !curr.invert
        curr.operator = INVERSIONS[curr.operator]
        curr = curr.first
      this
    else if op = INVERSIONS[@operator]
      @operator = op
      if @first.unwrap() instanceof Op
        @first.invert()
      this
    else if @second
      new Parens(this).invert()
    else if @operator is '!' and (fst = @first.unwrap()) instanceof Op and
                                  fst.operator in ['!', 'in', 'instanceof']
      fst
    else
      new Op '!', this

  toString: (idt) ->
    super idt, @constructor.name + ' ' + @operator

#### Conditional

# 1>1 ? true : false

exports.Conditional = class Conditional extends Base
  constructor: (@condition, @trueExpression, @falseExpression) ->

  children: ['condition', 'trueExpression', 'falseExpression']

#### If

# *If/else* statements. Acts as an expression by pushing down requested returns
# to the last line of each clause.
#
# Single-expression **Ifs** are compiled into conditional operators if possible,
# because ternaries are already proper expressions, and don't need conversion.
exports.If = class If extends Base
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

  # The **If** only compiles into a statement if either of its bodies needs
  # to be a statement. Otherwise a conditional operator is safe.
  isStatement: (o) ->
    o?.level is LEVEL_TOP or
      @bodyNode().isStatement(o) or @elseBodyNode()?.isStatement(o)

  jumps: (o) -> @body.jumps(o) or @elseBody?.jumps(o)

  makeReturn: ->
    @body     and= new Block [@body.makeReturn()]
    @elseBody and= new Block [@elseBody.makeReturn()]
    this

  ensureBlock: (node) ->
    if node instanceof Block then node else new Block [node]

# Constants
# ---------

# Levels indicates a node's position in the AST. Useful for knowing if
# parens are necessary or superfluous.
LEVEL_TOP    = 1  # ...;
LEVEL_PAREN  = 2  # (...)
LEVEL_LIST   = 3  # [...]
LEVEL_COND   = 4  # ... ? x : y
LEVEL_OP     = 5  # !...
LEVEL_ACCESS = 6  # ...[0]

# Tabs are two spaces for pretty printing.
TAB = '  '

IDENTIFIER_STR = "[$A-Za-z_\\x7f-\\uffff][$\\w\\x7f-\\uffff]*"
IDENTIFIER = /// ^ #{IDENTIFIER_STR} $ ///
SIMPLENUM  = /^[+-]?\d+$/
METHOD_DEF = ///
  ^
    (?:
      (#{IDENTIFIER_STR})
      \.prototype
      (?:
        \.(#{IDENTIFIER_STR})
      | \[("(?:[^\\"\r\n]|\\.)*"|'(?:[^\\'\r\n]|\\.)*')\]
      | \[(0x[\da-fA-F]+ | \d*\.?\d+ (?:[eE][+-]?\d+)?)\]
      )
    )
  |
    (#{IDENTIFIER_STR})
  $
///

# Is a literal value a string?
IS_STRING = /^['"]/

# Utility Functions
# -----------------

# Helper for ensuring that utility functions are assigned at the top level.
utility = (name) ->
  ref = "__#{name}"
  Scope.root.assign ref, UTILITIES[name]
  ref

multident = (code, tab) ->
  code.replace /\n/g, '$&' + tab
