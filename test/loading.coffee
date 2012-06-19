
{Scad} = require "../lib/webscad/scad"

parse = (new Scad).parse

files = {}

files.includeFile = '''

include <externalFile.scad>;

rotate([90, 0, 0]) ring(10, 1, 1);

'''

files.useFile = '''

use <externalFile.scad>;

rotate([90, 0, 0]) ring(10, 1, 1);

'''


files.externalFile = '''

module ring(r1, r2, h) {
    difference() {
        cylinder(r = r1, h = h);
        translate([ 0, 0, -1 ]) cylinder(r = r2, h = h+2);
    }
}

ring(5, 4, 10);

'''

test 'produces correct effective AST with include statement', -> 

  includeAst = parse(files.includeFile)
  externalAst = parse(files.externalFile)
  
  # This is what we expect
  st = includeAst.statements
  Array.prototype.splice.apply(st, [0,1].concat(externalAst.statements))
  
  # Make the Scad object do it
  scad = new Scad
  
  scad.setFileLoader (path,cb) ->
    cb(files[path[..-6]])
  
  scad.load 'includeFile.scad', (ast) ->
    eq includeAst.toString(), ast.toString()
  
test 'produces correct effective AST with use statement', -> 

  useAst = parse(files.useFile)
  externalAst = parse(files.externalFile)
  
  st = useAst.statements
  Array.prototype.splice.apply(st, [0,1].concat(externalAst.getModuleDefinitions()))
  scad = new Scad
  
  scad.setFileLoader (path,cb) ->
    cb(files[path[..-6]])
    
  scad.load 'useFile.scad', (ast) ->  
    eq useAst.toString(), ast.toString()
