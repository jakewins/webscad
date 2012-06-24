
{ThreeRenderer, ThreeGeometryBuilder, ScadFaceToThreeFacesConverter} = require "../../lib/webscad/threerender"
{Three} = require "../../lib/Three_module"
{NefPolyhedron,PolyhedronBuilder} = require "../../src/webscad/geometry"

threeRenderer = new ThreeRenderer
faceConverter = new ScadFaceToThreeFacesConverter

producesGeometry = (expectedGeometry) ->
  verify = (nefPoly) ->
    geometry = threeRenderer.render nefPoly

    #whatIExpected = expectedGeometry.toString()
    #whatIGot = geometry.toString()

    #if whatIGot isnt whatIExpected
    #  console.log "Expected:"
    #  console.log whatIExpected
    #  console.log "Got:"
    #  console.log whatIGot

    #eq whatIGot, whatIExpected

assertRendering = (nefPoly, verify) ->
  verify nefPoly

test 'can convert half edge structure face to triangles', ->
  
  poly = PolyhedronBuilder.fromPolygons [
    [[0,0,1],[1,0,1],[1,1,1],[0,1,1]]
    [[0,1,0],[1,1,0],[1,0,0],[0,0,0]]
    [[0,0,0],[1,0,0],[1,0,1],[0,0,1]]
    [[1,0,0],[1,1,0],[1,1,1],[1,0,1]]
    [[1,1,0],[0,1,0],[0,1,1],[1,1,1]]
    [[0,1,0],[0,0,0],[0,0,1],[0,1,1]]
  ]

  console.log poly.faces

  faceConverter.convert(face)
  

test 'renders simple cube', ->
  
  nefPoly = new NefPolyhedron(PolyhedronBuilder.fromPolygons [
    [[0,0,1],[1,0,1],[1,1,1],[0,1,1]]
    [[0,1,0],[1,1,0],[1,0,0],[0,0,0]]
    [[0,0,0],[1,0,0],[1,0,1],[0,0,1]]
    [[1,0,0],[1,1,0],[1,1,1],[1,0,1]]
    [[1,1,0],[0,1,0],[0,1,1],[1,1,1]]
    [[0,1,0],[0,0,0],[0,0,1],[0,1,1]]
  ])

  #geometry = ThreeGeometryBuilder.fromTriangles [
  #  [[0,0,1],[1,0,1],[1,1,1]]
  #  [[0,0,1],[[0,1,1]]
  #]

  #assertRendering nefPoly, producesGeometry([])

  
