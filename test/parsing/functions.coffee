
{Block, NumberValue, StringValue, BooleanValue, VectorValue, RangeValue, UndefinedValue, Identifier, Assign, Code, Param,
Op, FunctionCall, IndexAccess, Arguments} = require "../../lib/webscad/ast"
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
      new Arguments([new Identifier('d')]))
  ]
