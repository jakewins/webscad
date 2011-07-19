
{Block, NumberValue, StringValue, BooleanValue, VectorValue, RangeValue, UndefinedValue, Identifier, Assign, Call, Include, Use} = require "../../lib/webscad/nodes"
{assertParsing, produces} = require "./parseutils"


test 'parses include statement', -> 
  assertParsing '''
  
include <blah.scad>;
  
''', produces [
    new Include('blah.scad')
  ]
  
test 'parses import statement', -> 
  assertParsing '''
  
use <../a/blah.scad>;
  
''', produces [
    new Use('../a/blah.scad')
  ]
