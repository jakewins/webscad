
WebSCAD
-------

An implementation of SCAD for in-browser use. 

The parser and the build tooling is based on the
coffeescript project. 

Architecture overview:
----------------------

 1. Parsing
   
   Based on the CoffeeScript parser,
   parses input text, resolves imports,
   and yields an abstract syntax tree.
   
 2. Evaluation
 
   All AST nodes has an evaluate() method.
   All expressions are evaluated, all
   user-defined modules are executed.
   
   Yields a CSG Tree, consisting of
   CSG operations and primitives.
   
 3. Normalization
 
   The CSG term tree is normalized, 
   optimizing the amount of work we 
   need to do once we actually perform 
   the 3d operations it describes.
   
 4. CSG chain generation
 
   The normalized CSG term tree is
   turned into a chain, describing
   the order of which terms need to 
   be executed.
   
 5. Term execution
 
   The CSG tree is executed, yielding a
   single 3d object. 
   
 6. Rendering
   
   The resulting 3d object is rendered in
   some way.
   
