
{assertEvaluating} = require "../evalutils"
{producesGeometry} = require "./evalcsgutils"
{Polyhedron} = require "../../src/webscad/geometry"

test "simple cube", ->
  assertEvaluating "cube(size = 1, center = false);", producesGeometry(
    new Polyhedron
  )
