
{ThreeRenderer, ThreeGeometryBuilder, ScadFaceToThreeFacesConverter} = require "../../lib/webscad/threerender"
{Three} = require "../../lib/Three_module"
{NefPolyhedron,PolyhedronBuilder} = require "../../src/webscad/geometry"
{Scad} = require "../../lib/webscad/scad"

threeRenderer = new ThreeRenderer
scad = new Scad

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

test 'can convert half edge structure to three geometry', ->
  
  #  0,2,0   C   2,2,0
  #      \      /     
  #  B    1,1,2      D
  #      /      \ 
  #  0,0,0   A   2,0,0
  v0 = [0,0,0]
  v1 = [2,0,0]
  v2 = [2,2,0]
  v3 = [0,2,0]
  v4 = [1,1,2]
  
  polygons = [
    [v0,v1,v2,v3] # Bottom
    [v1,v0,v4] # Side A
    [v0,v3,v4] # Side B
    [v3,v2,v4] # Side C
    [v2,v1,v4] # Side D
  ]

  poly = PolyhedronBuilder.fromPolygons(polygons)

  geometry = threeRenderer.render(new NefPolyhedron(poly))

  eq geometry.vertices.length, 5
  

test 'parses and renders simple cube', ->
  
  geometry = threeRenderer.render(scad.evalCsg("cube(size=2,center=false)"))

  eq geometry.vertices.length, 8
  eq geometry.faces.length, 6

  
