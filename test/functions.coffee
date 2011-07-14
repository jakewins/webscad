{Lexer} = require "../src/webscad/lexer"

lexer = new Lexer
{Block, NumberValue, StringValue, BooleanValue, VectorValue, RangeValue, UndefinedValue, Identifier, Assign, Code, Param,
Op, FunctionCall, IndexAccess} = require "../lib/webscad/nodes"
{assertParsing, assertParsingExpression, produces} = require "./parseutils"

test 'parses basic function', -> 
  assertParsing 'function r_from_dia(d) = d / 2;', produces [
    new Code(
      new Identifier('r_from_dia'), 
      [new Identifier('d')],
      new Op "/", new Identifier('d'), new NumberValue 2)
  ]

test 'parses function call', -> 
  assertParsingExpression 'myfunc(d)', produces [
    new FunctionCall(
      new Identifier('myfunc'), 
      [new Identifier('d')])
  ]
