
{assertEvaluating} = require "../evalutils"
{producesCsg} = require "./evalastutils"

#test "simple cube with comment", ->
#  assertEvaluating "cube(size = 1, center = false); // A comment", producesCsg(
#    new csg.Union([new csg.Cube(1,false)])
#  )
