
if THREE?
  Three = THREE
else
  {Three} = require '../Three_module'

{Grid} = require './geometry'

exports.ScadFaceToThreeFacesConverter = class ScadFaceToThreeFacesConverter
  
  ### Takes one of our faces (based on the half-edge data structure),
  and converts it to one or more THREE.Face3 objects.
  TODO: Use the THREE.Face4 class when possible.
  ###
  convert : (scadFace) ->
    current = scadFace.halfEdge
    while current?
      console.log current.vertex
      current = current.next
      break if current == scadFace.halfEdge
    

exports.ThreeGeometryBuilder = class ThreeGeometryBuilder
  
  begin : ->
    @currentMaterialIdx = 0
    @geometry = new Three.Geometry()
    # Temporary
    @materials = for i in [0..6]
      new Three.MeshBasicMaterial( { color: Math.random() * 0xffffff } )

    @faces = []
    @verticeMap = new Grid()
    @vertexes = []

  addFace : (v1,v2,v3,v4=null) =>
    if v4 == null
      [v1,v2,v3] = [@_getOrCreateV(v1),@_getOrCreateV(v2),@_getOrCreateV(v3)]
      face = new Three.Face3(v1,v2,v3)
    else
      [v1,v2,v3,v4] = [@_getOrCreateV(v1),@_getOrCreateV(v2),
                       @_getOrCreateV(v3),@_getOrCreateV(v4)]
      face = new Three.Face4(v1,v2,v3,v4)
    face.materialIndex = @currentMaterialIdx
    @currentMaterialIdx = if @currentMaterialIdx >= (@materials.length-2) then 0 else @currentMaterialIdx++
    console.log @currentMaterialIndex
    @faces.push( face )

  end : ->
    @geometry.materials = @materials
    @geometry.vertices = @vertexes
    @geometry.faces = @faces
    @geometry.computeCentroids()
    @geometry.computeFaceNormals()
    @geometry.computeVertexNormals()
    @geometry

  # TODO: Perhaps declare vertices upfront, rather than doing
  # this lookup over-and-over?
  _getOrCreateV : (point) ->
    if not @verticeMap.has(point)
      @verticeMap.set(point, @vertexes.length)
      @vertexes.push(new Three.Vector3(point[0],point[1],point[2]))
    return @verticeMap.get(point)

exports.ThreeRenderer = class ThreeRenderer

  constructor : ->
    @builder = new ThreeGeometryBuilder()

  ### Takes a NefPolyhedron, and converts it into
  a Three.js polyhedron.
  ###
  render : (nefPolyhedron) ->
    polyhedron = nefPolyhedron.polyhedron
    @builder.begin()
    
    # Add faces
    for face in polyhedron.faces
      firstHE = face.halfEdge
      currentHE = firstHE.next

      # Iterate over the data structure, assembling four
      # vertexes at a time, and creating Three.js faces from
      # those. This is a bit complex, because while we support
      # arbitrarily sized faces, three.js only supports three
      # or four-vertex faces.
      loop
        faceVertexes = [[firstHE.vertex.x,firstHE.vertex.y,firstHE.vertex.z]]
        # Pick the next four vertexes (or three, if only three are available)
        for i in [0..3] 
          faceVertexes.push([currentHE.vertex.x,currentHE.vertex.y,currentHE.vertex.z])
          currentHE = currentHE.next
          break if currentHE == firstHE
        
        # Add the face
        @builder.addFace.apply(this, faceVertexes)  

        break if currentHE == firstHE

    @builder.end()
