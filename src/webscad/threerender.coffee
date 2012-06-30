
# I apologize for some of the messiness below,
# this is due to get refactored, but I need to understand
# what is involved in making three.js work the
# way we like first. /jake

if THREE?
  Three = THREE
else
  {Three} = require '../Three_module'

{Grid} = require './geometry'

# TODO: Refactor :)
exports.ThreeGeometryBuilder = class ThreeGeometryBuilder
  
  begin : ->
    @currentMaterialIdx = 0
    @geometry = new Three.Geometry()
    # Temporary
    @materials = [new Three.MeshBasicMaterial( { color: 0xED374C } )]

    @faces = []
    @verticeMap = new Grid()
    @vertexes = []

  addFace : (v1,v2,v3,v4=null) =>
    if v4 == null
      [v1,v2,v3] = [@_getOrCreateV(v1),@_getOrCreateV(v2),@_getOrCreateV(v3)]
      face = new Three.Face3(v1,v2,v3)
      face.centroid.addSelf( v1 ).addSelf( v2 ).addSelf( v3 ).divideScalar( 3 )
      face.normal = normal = face.centroid.clone().normalize()
      face.vertexNormals.push normal.clone(), normal.clone(), normal.clone()
    else
      [v1,v2,v3,v4] = [@_getOrCreateV(v1),@_getOrCreateV(v2),
                       @_getOrCreateV(v3),@_getOrCreateV(v4)]
      face = new Three.Face4(v1,v2,v3,v4)
      face.centroid.addSelf( v1 ).addSelf( v2 ).addSelf( v3 ).addSelf( v4 ).divideScalar( 4 )
      face.normal = normal = face.centroid.clone().normalize()
      face.vertexNormals.push normal.clone(), normal.clone(), normal.clone(), normal.clone()

    face.materialIndex = 0
    

    @currentMaterialIdx = if @currentMaterialIdx >= (@materials.length-2) then 0 else @currentMaterialIdx + 1

    @faces.push( face )

  end : ->
    @geometry.materials = @materials
    @geometry.vertices = @vertexes
    @geometry.faces = @faces
    @geometry.computeCentroids()
    #@geometry.computeFaceNormals()
    @geometry.computeVertexNormals()
    @geometry

  # TODO: Perhaps declare vertices upfront, rather than doing
  # a lookup over-and-over?
  _getOrCreateV : (point) ->
    if not @verticeMap.has(point)
      @verticeMap.set(point, @vertexes.length)
      vertex = new Three.Vector3(point[0],point[1],point[2])

      # TODO: Calculate UV

      @vertexes.push(vertex)
    return @verticeMap.get(point)

  _azimuth     : (vector) -> Math.atan2( vector.z, -vector.x )
  _inclination : (vector) -> Math.atan2( -vector.y, Math.sqrt( ( vector.x * vector.x ) + ( vector.z * vector.z ) ) )

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
