
{Scad} = require "../../lib/webscad/scad"
{Block} = require "../../lib/webscad/ast"
{Lexer} = require "../../lib/webscad/lexer"

lexer = new Lexer
scad = new Scad

test 'picks up correct line number of syntax error', -> 

  try
    scad.parse '''
if( a == 12 ) {

  asd
}
'''
    eq true, false
  catch e
    eq e.message, "Parse error on line 3: Unexpected 'TERMINATOR'"
