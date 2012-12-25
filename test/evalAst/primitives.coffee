
{assertEvaluating} = require "../evalutils"
{producesCsg} = require "./evalastutils"
csg = require("../../lib/csg_module").CSG

test "cube module", ->
  assertEvaluating "cube([1,2,3]);", producesCsg csg.cube( {radius:[1,2,3]} )
  
test "sphere module", ->
  assertEvaluating "sphere(r=3);", producesCsg csg.sphere( {radius:3} )