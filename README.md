
WebSCAD
-------

An implementation of SCAD for in-browser use. 

The parser and the build tooling is based on the
coffeescript project. 

This is still incomplete, the SCAD -> AST parsing
is done, and the infrastructure for the CSG tree.

Usage
-----

    npm install
    cake test

Architecture overview:
----------------------

 - Lexing
   
   Reads raw text, outputs a list
   of tokens.

 - Parsing
   
   Based on the CoffeeScript parser,
   parses the list of tokens, resolves imports,
   and yields an abstract syntax tree.
   
 - Evaluation
 
   All AST nodes has an evaluate() method.
   All expressions are evaluated, all
   user-defined modules are executed.
   
   Yields a CSG Tree, consisting of
   CSG operations and primitives.
   
 - CSG execution
 
   The CSG tree is executed, yielding a
   single 3d object.
   
 - Rendering
   
   The resulting 3d object is rendered in
   some way.
   
