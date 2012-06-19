{Lexer} = require "./lexer"
{parser} = require "./parser"
{extend} = require "./helpers"

astNodes = require './ast'
csgNodes = require './csg'
{NefPolyhedron} = require './geometry'

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

# Give parser AST node types
parser.yy = astNodes
    

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
      ast = @parse text
      calls = 1
      ast.replaceIncludes (path, replaceCb) =>
        calls++
        @load path, (childAst) ->
          replaceCb childAst
          calls--
          cb(ast) if calls == 0
      calls--
      cb(ast) if calls == 0
      
  ###
  Parse a string of SCAD code or an array of lexed tokens, and
  return the AST. 
  ###
  parse : (source, options) ->
    if typeof source is 'string'
      parser.parse lexer.tokenize source, options
    else
      parser.parse source
      
  ###
  Evalutate an abstract syntax tree, yielding
  a CSG tree.
  ###
  evalAst : (ast) ->
    
    if typeof ast is 'string' or ast not instanceof astNodes.AstNode
      ast = @parse ast
    
    ctx = new astNodes.Context
    ctx._modules = builtin.modules
    ctx._functions = builtin.functions
      
    call = new astNodes.ModuleCall()
    ast.evaluate(ctx, call)
   
  ###
  Evaluate a CSG tree, yielding the final 3d output
  in the form of a NefPolyhedron object.
  ### 
  evalCsg : (csgTree) ->
    if typeof csgTree is 'string' or csgTree not instanceof csgNodes.CsgNode
      csgTree = @evalAst csgTree
    
    csgTree.evaluate()
    
  render : (nefPolyhedron) ->
    if typeof nefPolyhedron is 'string' or nefPolyhedron not instanceof NefPolyhedron
      nefPolyhedron = @evalCsg nefPolyhedron
      
    
    
