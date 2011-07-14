
{Block, NumberValue, StringValue, BooleanValue, VectorValue, RangeValue, UndefinedValue, Identifier, Assign, FunctionCall} = require "../lib/webscad/nodes"
{assertParsing, produces} = require "./parseutils"

test 'parses basic assignment', -> 
  assertParsing 'a = 1;', produces [
    new Assign new Identifier('a'), new NumberValue(1)]
    
test 'parses assignment from call', -> 
  assertParsing 'a = b();', produces [
    new Assign(
      new Identifier('a'), 
      new FunctionCall(new Identifier('b'))
    )]
