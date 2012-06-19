
{assertEvaluating} = require "../evalutils"
{producesGeometry} = require "./evalcsgutils"
{Polyhedron,PolyhedronBuilder} = require "../../src/webscad/geometry"

test "simple cube", ->
  PolyBuilder

  polyhedron = PolyhedronBuilder.fromPolygons [
    [[0,0,0],[1,0,0],[1,1,0]]
    [[1,0,0],[1,1,0],[1,1,1]]
    [[0,0,0],[1,0,0],[1,1,0]]
    [[0,0,0],[1,1,0],[1,1,1]]
  ]

  assertEvaluating "cube(size = 1, center = false);", producesGeometry(
    polyhedron
  )
