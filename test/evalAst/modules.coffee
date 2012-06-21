
{assertEvaluating} = require "../evalutils"
{producesCsg} = require "./evalastutils"
csg = require "../../src/webscad/csg"

test "simple cube", ->
  assertEvaluating "cube(size = [1,2,3], center = false);", producesCsg(
    new csg.Union([new csg.Cube([1,2,3],false)])
  )
