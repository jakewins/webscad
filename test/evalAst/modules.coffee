
{assertEvaluating} = require "../evalutils"
{producesCsg} = require "./evalastutils"
csg = require("../../lib/csg_module").CSG

test "user defined module with parameters", ->
  assertEvaluating """
  module myMod(a, b, c) {
    translate([a, b, c]) sphere(r=1);
  }
  
  myMod(1,2,3);
  """, producesCsg csg.sphere({radius:1}).translate [1,2,3]


#
# Built in modules
#

test "difference module produces expected result", ->
  assertEvaluating """
  difference() {
      cube([1,2,3]);
      cube([0.1,0.2,0.3]);
  }
  """, producesCsg csg.cube( {radius:[1,2,3]} ).subtract(csg.cube({radius:[0.1,0.2,0.3]}))