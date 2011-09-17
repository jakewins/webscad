
{PolyhedronBuilder, Polyhedron} = require "../lib/webscad/geometry"


test 'Can build simple polyhedron', -> 

  polyhedron = new Polyhedron()
  builder = new PolyhedronBuilder(polyhedron)
  
  # A simple pyramid
  pts = [
    [0,0,0]
    [1,0,0]
    [1,1,0]
    [1,1,1]
  ]
  
  faces = [
    [0,1,2]
    [1,2,3]
    [0,1,2]
    [0,2,3]
  ]
  
  builder.begin()
  for p in pts
    builder.addVertex(p)
  
  for f in faces
    builder.beginFace()
    for vertexId in f
      builder.addVertexToFace(vertexId)
    builder.endFace()
  builder.end()
  
test 'Can create polyhedron using a list of polygons', -> 
  
  # A simple pyramid
  polygons = [
    [[0,0,0],[1,0,0],[1,1,0]]
    [[1,0,0],[1,1,0],[1,1,1]]
    [[0,0,0],[1,0,0],[1,1,0]]
    [[0,0,0],[1,1,0],[1,1,1]]
  ]
  
  polyhedron = PolyhedronBuilder.fromPolygons polygons
