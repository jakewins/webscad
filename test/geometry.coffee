
{PolyhedronBuilder, Polyhedron} = require "../lib/webscad/geometry"

test 'Can create correct faces', ->
  
  polyhedron = new Polyhedron()
  builder = new PolyhedronBuilder(polyhedron)

  pts = [
    [0,0,0]
    [1,0,0]
    [1,1,0]
    [0,1,0]
  ]
  
  faces = [
    {verticeIds:[0,1,2],expected:"Face[(V[0,0,0]->V[1,0,0]) (V[1,0,0]->V[1,1,0]) (V[1,1,0]->V[0,0,0])]"}
    {verticeIds:[0,3,2],expected:"Face[(V[0,0,0]->V[0,1,0]) (V[0,1,0]->V[1,1,0]) (V[1,1,0]->V[0,0,0])]"}
  ]
  
  builder.begin()
  for p in pts
    builder.addVertex(p)
  
  for face in faces
    builder.beginFace()
    for vertexId in face.verticeIds
      builder.addVertexToFace(vertexId)
    builder.endFace()    
    eq builder.currentFace.toString(), face.expected
  builder.end()
  

test 'Can build simple polyhedron', -> 

  polyhedron = new Polyhedron()
  builder = new PolyhedronBuilder(polyhedron)

  # A simple pyramid

  #  0,2,0   C   2,2,0
  #      \      /     
  #  B    1,1,2      D
  #      /      \ 
  #  0,0,0   A   2,0,0
  pts = [
    [0,0,0] # 0
    [2,0,0] # 1
    [2,2,0] # 2
    [0,2,0] # 3
    [1,1,2] # 4
  ]
  
  faces = [
    # Bottom
    {verticeIds:[0,1,2,3],expected:"Face[(V[0,0,0]->V[2,0,0]) (V[2,0,0]->V[2,2,0]) (V[2,2,0]->V[0,2,0]) (V[0,2,0]->V[0,0,0])]"}

    # Side A
    {verticeIds:[1,0,4],expected:"Face[(V[2,0,0]->V[0,0,0]) (V[0,0,0]->V[1,1,2]) (V[1,1,2]->V[2,0,0])]"}
    
    # Side B
    #{verticeIds:[0,3,4],expected:"Face[(V[0,0,0]->V[0,2,0]) (V[0,2,0]->V[1,1,2]) (V[1,1,2]->V[0,0,0])]"}
    
    # Side C
    #{verticeIds:[3,2,4],expected:"Face[(V[0,2,0]->V[2,2,0]) (V[2,2,0]->V[1,1,2]) (V[1,1,2]->V[0,2,0])]"}
    
    # Side D
    #{verticeIds:[1,2,4],expected:"Face[(V[2,0,0]->V[2,2,0]) (V[2,2,0]->V[1,1,2]) (V[1,1,2]->V[2,0,0])]"}
  ]
  
  builder.begin()
  for p in pts
    builder.addVertex(p)
  
  for face in faces
    builder.beginFace()
    for vertexId in face.verticeIds
      builder.addVertexToFace(vertexId)
      console.log builder.currentFaceStateToString()
    builder.endFace()    
    eq builder.currentFace.toString(), face.expected
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
