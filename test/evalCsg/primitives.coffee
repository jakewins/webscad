
{assertEvaluating} = require "../evalutils"
{producesGeometry} = require "./evalcsgutils"
{NefPolyhedron,PolyhedronBuilder} = require "../../src/webscad/geometry"

test "simple cube", ->

  polyhedron = new NefPolyhedron(PolyhedronBuilder.fromPolygons [
    [[0,0,1],[1,0,1],[1,1,1],[0,1,1]]
    [[0,1,0],[1,1,0],[1,0,0],[0,0,0]]
    [[0,0,0],[1,0,0],[1,0,1],[0,0,1]]
    [[1,0,0],[1,1,0],[1,1,1],[1,0,1]]
    [[1,1,0],[0,1,0],[0,1,1],[1,1,1]]
    [[0,1,0],[0,0,0],[0,0,1],[0,1,1]]
  ])

  assertEvaluating "cube(size = 1, center = false);", producesGeometry(
    polyhedron
  )

  polyhedron = new NefPolyhedron(PolyhedronBuilder.fromPolygons [
    [[0,0,3],[1,0,3],[1,2,3],[0,2,3]]
    [[0,2,0],[1,2,0],[1,0,0],[0,0,0]]
    [[0,0,0],[1,0,0],[1,0,3],[0,0,3]]
    [[1,0,0],[1,2,0],[1,2,3],[1,0,3]]
    [[1,2,0],[0,2,0],[0,2,3],[1,2,3]]
    [[0,2,0],[0,0,0],[0,0,3],[0,2,3]]
  ])

  assertEvaluating "cube(size = [1,2,3], center = false);", producesGeometry(
    polyhedron
  )
