
scad = require "../lib/webscad/scad"
{Block} = require "../lib/webscad/nodes"

exports.produces = (expectedAst) -> 
  # Block is always at the bottom, include it here for DRY
  expectedAst = new Block(expectedAst)
  verify = (ast) ->
    # TODO: Traverse the trees and do full comparison
    eq expectedAst.toString(), ast.toString()

exports.assertParsing = (text, verify) ->
  verify scad.parse(text)
