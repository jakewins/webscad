
{Block, NumberValue, StringValue, BooleanValue, VectorValue, RangeValue, UndefinedValue, Identifier, Assign, Call, Include, Use} = require "../../lib/webscad/ast"
{assertParsing, produces} = require "./parseutils"

test 'ignores single empty statement', -> 
  assertParsing ';', produces []
    
test 'ignores empty statement in block', -> 
  assertParsing '{;}', produces []
    
test 'ignores empty statement between statements', -> 
  assertParsing '''a=1;;
;;;
;
a=2;
''', produces [
    new Assign(new Identifier('a'),new NumberValue(1)), 
    new Assign(new Identifier('a'),new NumberValue(2))
  ]


test 'parses include statement', -> 
  assertParsing 'include <ring.scad>;', produces [
    new Include('ring.scad')
  ]
