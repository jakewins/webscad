
{Block, NumberValue, StringValue, BooleanValue, VectorValue, RangeValue, UndefinedValue, Identifier, Assign, Code,
Op, Module, Conditional} = require "../../lib/webscad/ast"
{assertParsingExpression, produces} = require "./parseutils"

test 'parses not operator', -> 
  assertParsingExpression '!true', produces [
    new Op('!', new BooleanValue(true))
  ]
  
test 'parses and operator', -> 
  assertParsingExpression 'true && false', produces [
    new Op('&&', new BooleanValue(true), new BooleanValue(false))
  ]

test 'parses or operator', -> 
  assertParsingExpression 'true || false', produces [
    new Op('||', new BooleanValue(true), new BooleanValue(false))
  ]
  
test 'parses * operator', -> 
  assertParsingExpression '1 * 2', produces [
    new Op('*', new NumberValue(1), new NumberValue(2))
  ]
  
test 'parses / operator', -> 
  assertParsingExpression '1 / 2', produces [
    new Op('/', new NumberValue(1), new NumberValue(2))
  ]
  
test 'parses % operator', -> 
  assertParsingExpression '1 % 2', produces [
    new Op('%', new NumberValue(1), new NumberValue(2))
  ]
  
test 'parses + operator', -> 
  assertParsingExpression '1 + 2', produces [
    new Op('+', new NumberValue(1), new NumberValue(2))
  ]
  
test 'parses - operator', -> 
  assertParsingExpression '1 - 2', produces [
    new Op('-', new NumberValue(1), new NumberValue(2))
  ]
  
test 'parses < operator', -> 
  assertParsingExpression '1 < 2', produces [
    new Op('<', new NumberValue(1), new NumberValue(2))
  ]
  
test 'parses <= operator', -> 
  assertParsingExpression '1 <= 2', produces [
    new Op('<=', new NumberValue(1), new NumberValue(2))
  ]
  
test 'parses == operator', -> 
  assertParsingExpression '1 == 2', produces [
    new Op('==', new NumberValue(1), new NumberValue(2))
  ]
  
test 'parses != operator', -> 
  assertParsingExpression '1 != 2', produces [
    new Op('!=', new NumberValue(1), new NumberValue(2))
  ]
  
test 'parses >= operator', -> 
  assertParsingExpression '1 >= 2', produces [
    new Op('>=', new NumberValue(1), new NumberValue(2))
  ]
  
test 'parses > operator', -> 
  assertParsingExpression '1 > 2', produces [
    new Op('>', new NumberValue(1), new NumberValue(2))
  ]
  
test 'parses conditional operator', -> 
  assertParsingExpression '1 > 2 ? 1 : 2', produces [
    new Conditional(
      new Op('>', new NumberValue(1), new NumberValue(2)),
      new NumberValue(1),
      new NumberValue(2))
  ]
  
test 'parses invert operator', -> 
  assertParsingExpression '- true', produces [
    new Op('-', new BooleanValue(true))
  ]
