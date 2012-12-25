
{assertEvaluating} = require "../evalutils"
{producesCsg} = require "./evalastutils"
csg = require("../../lib/csg_module").CSG

test "supports negative values in vectors", ->
  assertEvaluating """
  cube([1,-2,-3.3]);
  """, producesCsg csg.cube( {radius:[1,-2,-3.3]} )

