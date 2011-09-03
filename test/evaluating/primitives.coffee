
{assertEvaluating, produces} = require "./evalutils"
csg = require "../../src/webscad/csg"

test "simple cube", ->
  assertEvaluating "cube(size = 1, center = false);", produces(
    new csg.Union([new csg.Cube(1,false)])
  )
