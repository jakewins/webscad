
{assertRendering, produces} = require "./renderutils"
{Polyhedron} = require "../../src/webscad/geometry"

test "simple cube", ->
  assertRendering "cube(size = 1, center = false);", produces(
    new Polyhedron
  )
