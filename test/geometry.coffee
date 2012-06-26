
{PolyhedronBuilder, Polyhedron} = require "../lib/webscad/geometry"

test 'Can build simple pyramid', -> 

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
    {verticeIds:[0,3,4],expected:"Face[(V[0,0,0]->V[0,2,0]) (V[0,2,0]->V[1,1,2]) (V[1,1,2]->V[0,0,0])]"}
    
    # Side C
    {verticeIds:[3,2,4],expected:"Face[(V[0,2,0]->V[2,2,0]) (V[2,2,0]->V[1,1,2]) (V[1,1,2]->V[0,2,0])]"}
    
    # Side D
    {verticeIds:[2,1,4],expected:"Face[(V[2,2,0]->V[2,0,0]) (V[2,0,0]->V[1,1,2]) (V[1,1,2]->V[2,2,0])]"}
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

test 'Can build simple cube', -> 

  polyhedron = new Polyhedron()
  builder = new PolyhedronBuilder(polyhedron)

  # A simple cube

  #  0,2,0   C   2,2,0   #   0,2,2   C   2,2,2
  #                      #
  #  B    Bottom     D   &   B      Top      D
  #                      #
  #  0,0,0   A   2,0,0   #   0,0,2   A   2,0,2
  pts = [
    # Bottom vertexes
    [0,0,0] # 0
    [2,0,0] # 1
    [2,2,0] # 2
    [0,2,0] # 3
    
    # Top vertexes
    [0,0,2] # 4
    [2,0,2] # 5
    [2,2,2] # 6
    [0,2,2] # 7
  ]
  
  faces = [
    # Bottom
    {verticeIds:[0,1,2,3],expected:"Face[(V[0,0,0]->V[2,0,0]) (V[2,0,0]->V[2,2,0]) (V[2,2,0]->V[0,2,0]) (V[0,2,0]->V[0,0,0])]"}

    # Top
    {verticeIds:[7,6,5,4],expected:"Face[(V[0,2,2]->V[2,2,2]) (V[2,2,2]->V[2,0,2]) (V[2,0,2]->V[0,0,2]) (V[0,0,2]->V[0,2,2])]"}

    # Side A
    {verticeIds:[0,4,5,1],expected:"Face[(V[0,0,0]->V[0,0,2]) (V[0,0,2]->V[2,0,2]) (V[2,0,2]->V[2,0,0]) (V[2,0,0]->V[0,0,0])]"}

    # Side B
    {verticeIds:[3,7,4,0],expected:"Face[(V[0,2,0]->V[0,2,2]) (V[0,2,2]->V[0,0,2]) (V[0,0,2]->V[0,0,0]) (V[0,0,0]->V[0,2,0])]"}

    # Side C
    {verticeIds:[2,6,7,3],expected:"Face[(V[2,2,0]->V[2,2,2]) (V[2,2,2]->V[0,2,2]) (V[0,2,2]->V[0,2,0]) (V[0,2,0]->V[2,2,0])]"}

    # Side D
    {verticeIds:[1,5,6,2],expected:"Face[(V[2,0,0]->V[2,0,2]) (V[2,0,2]->V[2,2,2]) (V[2,2,2]->V[2,2,0]) (V[2,2,0]->V[2,0,0])]"}
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
  
