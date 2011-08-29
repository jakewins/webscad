{Lexer} = require "./lexer"
{parser} = require "./parser"
{extend} = require "./helpers"
ns = require './ast'

# Build ins
builtin = require './builtins'

lexer = new Lexer

# Wrapper to make generic lexer work with Jison parser
parser.lexer = 
  lex: ->
    [tag, @yytext, @yylineno] = @tokens[@pos++] or ['']
    tag
  setInput: (@tokens) ->
    @pos = 0
  upcomingInput: ->
    ""
    
exports.Scad = class Scad

  ###
  Set the file loader to be used
  by Scad#load(path).
  
  The file loader should be a 
  function that takes a file
  path and a callback, and returns
  the text contents of the file.
  ###
  setFileLoader : (@fileLoader) ->
    
  ###
  Generate the effective AST given
  a file path. Uses the file loader
  from Scad#setFileLoader to load
  relevant files.
  ###
  load : (path, cb) ->
    @fileLoader path, (text) =>
      ast = parse text
      calls = 1
      ast.replaceIncludes (path, replaceCb) =>
        calls++
        @load path, (childAst) ->
          replaceCb childAst
          calls--
          cb(ast) if calls == 0
      calls--
      cb(ast) if calls == 0
      
  evaluate : (root_block) ->
    
    ctx = new ns.Context
    ctx._modules = builtin.modules
    ctx._functions = builtin.functions
      
    call = new ns.ModuleCall()
    root_block.evaluate(ctx, call)
    
# Parse a string of SCAD code or an array of lexed tokens, and
# return the AST. You can then compile it by calling `.compile()` on the root,
# or traverse it by using `.traverse()` with a callback.
exports.parse = parse = (source, options) ->
  if typeof source is 'string'
    parser.parse lexer.tokenize source, options
  else
    parser.parse source
    
parser.yy = ns
