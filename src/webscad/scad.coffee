{Lexer} = require "webscad/lexer"
{parser} = require "webscad/parser"

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
  
  setFileLoader : (@fileLoader) ->
    # Empty
    
  load : (path) ->
    ast = parse(@fileLoader(path))
    
    ast.replaceIncludes (path) =>
      @load path
      

exports.Evaluator = class Evaluator
  
  constructor : (@render) ->
    # pass
  
  evaluate : (ast, ctx={}) ->
    vars = ctx.vars or {}
    modules = ctx.modules or {}
    for st in ast.statements
      if st instanceof Module
        modules[st.name] = st
    
# Parse a string of SCAD code or an array of lexed tokens, and
# return the AST. You can then compile it by calling `.compile()` on the root,
# or traverse it by using `.traverse()` with a callback.
exports.parse = parse = (source, options) ->
  if typeof source is 'string'
    parser.parse lexer.tokenize source, options
  else
    parser.parse source
    
parser.yy = require 'webscad/nodes'
