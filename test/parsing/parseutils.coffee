
{Scad} = require "../../lib/webscad/scad"
{Block} = require "../../lib/webscad/ast"
{Lexer} = require "../../lib/webscad/lexer"

lexer = new Lexer
scad = new Scad

exports.produces = (expectedAst) -> 
  # Block is always at the bottom, include it here for DRY
  expectedAst = new Block(expectedAst)
  verify = (ast) ->
    # TODO: Traverse the trees and do full comparison
    if expectedAst.toString() isnt ast.toString()
      console.log "Expected:"
      console.log expectedAst.toString()
      console.log "Got:"
      console.log ast.toString()
    eq expectedAst.toString(), ast.toString()

exports.assertParsing = assertParsing = (text, verify) ->
  try
    verify scad.parse(text)
  catch e
    console.log "Parse error, tokens were:"
    console.log lexer.tokenize text
    throw e
    
# Shorthand for testing expressions
exports.assertParsingExpression = (expression, verify) ->
  assertParsing "a=#{expression}", (ast) ->
    # Get rid of the assignment
    verify new Block([ast.statements[0].value])
