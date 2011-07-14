
{Block, NumberValue, StringValue, BooleanValue, VectorValue, RangeValue, UndefinedValue, IndexAccess, Access, Identifier,
FunctionCall, ModuleCall, MemberAccess, If, Op} = require "../lib/webscad/nodes"
{assertParsing, produces} = require "./parseutils"

test 'parses empty if block', -> 
  assertParsing '''
if( a == 12 ) {
  
}
''', produces [
    new If( 
      new Op('==', new Identifier('a'), new NumberValue(12)),
      [  ]
    )]
    
test 'parses lone if block', -> 
  assertParsing '''
if( a == 12 ) {
  blah();
}
''', produces [
    new If( 
      new Op('==', new Identifier('a'), new NumberValue(12)),
      [ new ModuleCall( new Identifier('blah') ) ]
    )]
    
test 'parses if/else block', -> 

  expectedIf = new If( 
    new Op('==', new Identifier('a'), new NumberValue(12)),
    [ new ModuleCall( new Identifier('blah') ) ]
  )
    
  expectedIf.addElse [ new ModuleCall( new Identifier('bluh') ) ]

  assertParsing '''
if( a == 12 ) {
  blah();
} else {
  bluh();
}
''', produces [ expectedIf ]
    
test 'parses if/else if/else block', -> 

  expectedIf = new If( 
    new Op('==', new Identifier('a'), new NumberValue(12)),
    [ new ModuleCall( new Identifier('blah') ) ]
  )
    
  expectedIf.addElse new If( 
    new Op('!=', new Identifier('a'), new NumberValue(14)),
    [ new ModuleCall( new Identifier('blih') ) ]
  )
    
  expectedIf.addElse [ new ModuleCall( new Identifier('bluh') ) ]

  assertParsing '''
if( a == 12 ) {
  blah();
} else if( a != 14) {
  blih();
} else {
  bluh();
}
''', produces [ expectedIf ]
