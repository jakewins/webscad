
{Block, NumberValue, StringValue, BooleanValue, VectorValue, RangeValue} = require "../lib/webscad/nodes"
{assertParsing, produces} = require "./parseutils"

test 'parses number values', ->
  assertParsing '1', produces [
    new NumberValue 1]

test 'parses string values', -> 
  assertParsing '"astring"', produces [
    new StringValue "astring"]

test 'parses boolean values', ->
  assertParsing 'true', produces [
    new BooleanValue true]

  assertParsing 'false', produces [
    new BooleanValue true]
    
test 'parses vector values', ->

  assertParsing '[1,2]', produces [
    new VectorValue [
      new NumberValue 1
      new NumberValue 2 
    ]]
  
  assertParsing '[1,true,"astring"]', produces [
    new VectorValue [
      new NumberValue 1
      new BooleanValue true
      new StringValue "astring"
    ]]
    
test 'parses range values', ->

  assertParsing '[0:100]', produces [
    new RangeValue new NumberValue(0), new NumberValue(1), new NumberValue(100)
    ]

  assertParsing '[0:2:100]', produces [
    new RangeValue new NumberValue(0), new NumberValue(2), new NumberValue(100)
    ]
  
