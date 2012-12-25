WebSCAD
-------

An implementation of SCAD for Javascript. It uses Jison for parsing, Coffeescripts DSL for Jison Grammars, and csg.js for the 
actual 3d manipulation.

This is still a work in progress, and there is many features that are missing from the original OpenSCAD. The parser is the
only part that is (other than bug hunting) complete. It is based on a port of the OpenSCAD grammar.

For an overview of what features are supported and which still remain to implement, see 'FEATURES'.

Demo
----

http://jakewins.github.com/webscad/

Building
--------

    npm install
    cake build:full && cake build:browser

Similar projects
----------------

There are several projects aimed at bringing 3D editing to the web. Here are some:

 * [OpenSCAD-JS](https://github.com/EiNSTeiN-/openscad-js) - A sister implementation of OpenSCAD for the browser
 * [OpenJsCad](https://github.com/joostn/OpenJsCad) - An alternative to OpenSCAD, using Javascript as its syntax
 * [CoffeeSCAD](https://github.com/kaosat-dev/CoffeeSCad) - An alternative to OpenSCAD, using Coffeescript as its syntax

 
Contributing
------------

Contributions are super welcome - please make sure what you contribute is unit tested! Check out the FEATURES file in
the root of the repo for a list of yet-to-be-implemented OpenSCAD features.

License
-------

All code, unless otherwise stated, is copyright Jacob Hansson 2013, and licensed under the MIT public license.
