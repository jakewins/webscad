
{Block, NumberValue, StringValue, BooleanValue, VectorValue, RangeValue, UndefinedValue, IndexAccess, Access, Identifier,
FunctionCall, MemberAccess} = require "../../lib/webscad/ast"
{assertParsingExpression, produces} = require "./parseutils"

test 'parses undefined values', -> 
  assertParsingExpression 'undef', produces [new UndefinedValue]
    
test 'parses number values', ->
  assertParsingExpression '1', produces [
    new NumberValue 1]

test 'parses string values', -> 
  assertParsingExpression '"astring"', produces [
    new StringValue "astring"]

test 'parses boolean values', ->
  assertParsingExpression 'true', produces [
    new BooleanValue true]

  assertParsingExpression 'false', produces [
    new BooleanValue false]
    
test 'parses vector values', ->

  assertParsingExpression '[1,2]', produces [
    new VectorValue [
      new NumberValue 1
      new NumberValue 2 
    ]]
  
  assertParsingExpression '[1,true,"astring"]', produces [
    new VectorValue [
      new NumberValue 1
      new BooleanValue true
      new StringValue "astring"
    ]]
    
test 'parses matrix values', ->

  assertParsingExpression '''
[[1,2],
 [3,4]]
''', produces [
    new VectorValue [
      new VectorValue [
        new NumberValue 1
        new NumberValue 2 
      ]
      new VectorValue [
        new NumberValue 3
        new NumberValue 4 
      ]
    ]]
    
    
test 'parses range values', ->

  assertParsingExpression '[0:100]', produces [
    new RangeValue new NumberValue(0), new NumberValue(1), new NumberValue(100)
    ]

  assertParsingExpression '[0:2:100]', produces [
    new RangeValue new NumberValue(0), new NumberValue(2), new NumberValue(100)
    ]
    
test 'parses identifier index accessor', ->

  assertParsingExpression 'a[1]', produces [
    new IndexAccess(
      new Identifier('a')
      new NumberValue(1)
    )]
    
test 'parses invocation index accessor', ->

  assertParsingExpression 'a()[1]', produces [
    new IndexAccess(
      new FunctionCall(new Identifier('a'), []),
      new NumberValue(1)
    )]
    
test 'parses nested index accessor', ->

  assertParsingExpression 'a[1][2]', produces [
    new IndexAccess(
      new IndexAccess(
        new Identifier('a'),
        new NumberValue(1)
      ),
      new NumberValue(2)
    )]
    
test 'parses member access', ->

  assertParsingExpression 'a.blah', produces [
    new MemberAccess(
      new Identifier('a'),
      new Identifier('blah')
    )]
    
test 'parses member access from index access', ->

  assertParsingExpression 'a[1].blah', produces [
    new MemberAccess(
      new IndexAccess(
        new Identifier('a'),
        new NumberValue(1)
      ),
      new Identifier('blah')
    )]
