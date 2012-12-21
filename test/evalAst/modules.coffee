
{assertEvaluating} = require "../evalutils"
{producesCsg} = require "./evalastutils"

test "simple cube", ->
  assertEvaluating "cube(size = [1,2,3], center = false);", producesCsg()
