{Lexer} = require "../src/webscad/lexer"

lexer = new Lexer
{Block, NumberValue, StringValue, BooleanValue, VectorValue, RangeValue, UndefinedValue, Identifier, Assign, Code,
Op, Module, ModuleCall, ModuleCallList} = require "../lib/webscad/nodes"
{assertParsing, produces} = require "./parseutils"

test 'parses empty noparam module', -> 
  assertParsing 'module mymodule() {}', produces [
    new Module(
      new Identifier('mymodule'), 
      [],
      new Block)
  ]
  
test 'parses empty module with params', -> 
  assertParsing 'module mymodule(a,ba) {}', produces [
    new Module(
      new Identifier('mymodule'), 
      [new Identifier('a'), 
       new Identifier('ba')],
      new Block)
  ]
  
test 'parses nested modules', -> 
  assertParsing '''
module mymodule(a) {

  module innermodule(b) {}
  
}''', produces [
    new Module(
      new Identifier('mymodule'), 
      [new Identifier('a')],
      new Block([
        new Module(
          new Identifier('innermodule'),
          [new Identifier('b')],
          new Block)
      ]))
  ]

test 'parses assignments in modules', -> 
  assertParsing '''
module mymodule() {

  a = 12;
  
}''', produces [
    new Module(
      new Identifier('mymodule'), 
      [],
      new Block([
        new Assign(
          new Identifier('a'),
          new NumberValue(12))
      ]))
  ]
  

test 'parses statements in modules', ->
  assertParsing '''
module mymodule() {

  function blah() = 12;
  
  function bleh(b) = b * 1;
  
}''', produces [
    new Module(
      new Identifier('mymodule'), 
      [],
      new Block([
        new Code(
          new Identifier('blah'),
          [],
          new NumberValue(12))
        new Code(
          new Identifier('bleh'),
          [new Identifier('b')],
          new Op('*', new Identifier('b'), new NumberValue(1)))
      ]))
  ]
  
test 'parses multi child module call', ->
  assertParsing '''
mymodule(12){
  otherModule();
  thirdModule();
};''', produces [
    new ModuleCall(
      new Identifier('mymodule'), 
      [new NumberValue(12)],
      [
        new ModuleCall(new Identifier('otherModule'))
        new ModuleCall(new Identifier('thirdModule'))
      ])
  ]
  
test 'parses assignment in arguments to module calls', ->
  assertParsing '''mymodule(1+1,a=12);''', produces [
    new ModuleCall(
      new Identifier('mymodule'), 
      [new Op('+',new NumberValue(1),new NumberValue(1)),
       new Assign(new Identifier('a'), new NumberValue(12))
      ]
    )
  ]
  
