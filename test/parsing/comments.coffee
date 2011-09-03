{Lexer} = require "../../src/webscad/lexer"

lexer = new Lexer
{Block, NumberValue, StringValue, BooleanValue, VectorValue, RangeValue, UndefinedValue, Identifier, Assign, Code,
Op, Module, ModuleCall, ModuleCallList, Comment} = require "../../lib/webscad/ast"
{assertParsing, produces} = require "./parseutils"
  
test 'parses lone line comment', -> 
  assertParsing '''
// A comment
''', produces [
    new Comment('A comment')
  ]
  
test 'parses end of line comment', -> 
  assertParsing '''
a = 12; // A comment
''', produces [
    new Assign(new Identifier('a'), new NumberValue(12)),
    new Comment('A comment')
  ]
  
test 'parses simple block comment', ->
  assertParsing '''
/**
 * Hello
 * world.
 */
''', produces [
    new Comment('Hello\n world.')
  ]
