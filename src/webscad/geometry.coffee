### Full disclosure:
My current knowledge level of geometry
is something like "squares are a type of rectangle".
I apologize in advance if any of the documentation
below is rediculously incorrect. This is kind of a 
learning-by-doing experience.
###

DEBUG = false
  
### A vertex is a special type of point that
specifies the beginning or end of a line.

Our vertexes have three defining dimensions (x,y and z).
###
exports.Vertex = class Vertex

  constructor:(@x,@y,@z)->
  setHalfEdge:(@halfEdge)->

  toString : () ->
    return "V[#{@x},#{@y},#{@z}]"
  
  
### A face is the area inside a polygon.
###
exports.Face = class Face
  
  constructor:( @plane )->
  setHalfEdge:( @halfEdge )->

  toString : () ->
    out = []
    nextHalfEdge = @halfEdge
    while nextHalfEdge?
      prevV = if nextHalfEdge.previous? then nextHalfEdge.previous.vertex else "null"
      out.push "(#{prevV}->#{nextHalfEdge.vertex})"
      nextHalfEdge = nextHalfEdge.next
      break if nextHalfEdge == @halfEdge

    return "Face[" + out.join(" ") + "]"


exports.HalfEdge = class HalfEdge
  # This is the core part of the data structure
  # we use to express geometric objects.
  # It is much more complicated than a simple list of
  # geometric points or some other measly attempt to express
  # polygons and polyhedrons and all that good stuff, 
  # and is consequently much more awesome.
  #
  # Imagine a mesh, like a bunch of polygons
  # stuck together (mostly, but lets not get technical). 
  # Now, each line in the mesh would be part of two polygons, 
  # yes?
  #
  # Ait. Use abstract thinking to imagine that you
  # split one of those lines along the length of it. Now
  # you have two lines, each is part of only one 
  # polygon. These lines are half edges (or half lines).
  #
  # So a half edge has a corresponding opposite half edge,
  # a start point (or start vertex), an end
  # point, and a polygon it belongs to.
  #
  #
  # Each of our half edge objects contain only one point, 
  # the one it ends at. It also contains a  reference to the previous 
  # half edge (we would get the start point from that if we wanted it), 
  # and a reference to the next half edge. This way we can hop
  # from half edge to half edge to discover a full geometric shape.
  #
  # Each half edge also keeps a reference to the facet 
  # (what we called polygon above) it is a defining part of, as
  # well as it's opposing half edge, together with which it
  # makes a normal line.
  #
  # For an explaination of why all this is good, see:
  # http://www.flipcode.com/archives/The_Half-Edge_Data_Structure.shtml
  #
  # For an overview of the architecture
  # this code based on, see:
  # http://www.cgal.org/Manual/latest/doc_html/cgal_manual/HalfedgeDS/Chapter_main.html
  #
  #
  # Now go have a cup of coffee and read through those,
  # the second one comes with pictures!
  #

  @IDS = 0
  
  constructor:(@face, @vertex)->
    @id = HalfEdge.IDS++

  # True if no facet is associated with this half edge
  isBorder : () -> not (@face?)
  
  setPrevious:(@previous)->
  
  setNext:(@next)->
  
  setFace:(@face)->
  
  setVertex:(@vertex)->
  
  # The "other" half of the line.
  setOpposite:(@opposite)->

  toString : () ->
    v = if @vertex? then @vertex.toString() else "null"
    p = if @previous? and @previous.vertex? then @previous.vertex.toString() else "null"
    n = if @next? and @next.vertex? then @next.vertex.toString() else "null"
    f = if @face? and @face.halfEdge? and @face.halfEdge.vertex? then @face.halfEdge.vertex.toString() else "null"
    return "HE(#{v})[p=#{p},n=#{n},f=#{f}]"

### Works as a low-level foundation
for higher level geometric concepts, like
polyhedrons.
###
exports.HalfEdgeDataStructure = class HalfEdgeDataStructure
  
  constructor:()->
    @faces = []
    @halfEdges = []
    @vertices = []
    
  addVertex : (vertex)->
    @vertices.push vertex
    
  addFace : (face) ->
    @faces.push face
    
  addHalfEdgePair : (h, g) ->
    h.setOpposite g
    g.setOpposite h
    @halfEdges.push h
    @halfEdges.push g
    return h
      
    
exports.Polyhedron = class Polyhedron extends HalfEdgeDataStructure

  toString : () ->
    faces = for f in @faces
      f.toString()
    
    faces = faces.join(",\n  ")
    if faces.length > 0
      return "Polyhedron[\n  #{faces}]"
    else
      return "Polyhedron[empty]"


exports.NefPolyhedron = class NefPolyhedron
  
  constructor : (@polyhedron) ->
    
  #
  # NefPolyhedrons related to this NefPolyhedron
  #
  
  complement : ->
    throw new Error("Not implemented")
  interior : ->
    throw new Error("Not implemented")
  closure : ->
    throw new Error("Not implemented")
  boundary : ->
    throw new Error("Not implemented")
  regularization : ->
    throw new Error("Not implemented")
  
  # 
  # Manipulations using another NefPolyhedron
  #
  
  intersection : (other) -> 
    throw new Error("Not implemented")
  join : (other) -> 
    throw new Error("Not implemented")
  difference : (other) -> 
    throw new Error("Not implemented")
  symmetricDifference : (other) -> 
    throw new Error("Not implemented")
  complement : (other) -> 
    throw new Error("Not implemented")
  
  # 
  # Transformations of this NefPolyhedron
  # 
  
  transform : (transformation) -> 
    throw new Error("Not implemented")
  changeOrientation : (full=false) ->
    throw new Error("Not implemented")
  
  isScaling : (transformation) ->
    throw new Error("Not implemented")
  is90DegreeRotation : (transformation) ->
    throw new Error("Not implemented")

  toString : () ->
    return "Nef[#{@polyhedron.toString()}]"
    
    
### A coffeescript port of CGAL's
Polyhedron_incremental_builder_3.

This is used to create Polyhedrons by initially
defining all vertexes in it, and then listing
which vertexes make up each face.

There is an important expectation when you use this,
and it is in what "direction" around a face you list
vertexes. You can only add an edge from A to B once.
If you want to add it again (for a second face sharing
that edge) you need to add it from B to A, eg. reversed.

Lets say you wanted to create this partial polyhedron:

A-----B
\    / \
 \  /   \
  C-----D

If you were to do:

    beginFace()
    addVertexToFace(A)
    addVertexToFace(B)
    addVertexToFace(C)
    endFace()
    beginFace()
    addVertexToFace(B)
    addVertexToFace(C)
    addVertexToFace(D)
    endFace()

This would fail, because the builder thinks you want to 
add the half-edge from B to C twice. You need to tell it
you want it's opposite half edge, the one from C to B, associated
with your second face, like so:

    beginFace()
    addVertexToFace(A)
    addVertexToFace(B)
    addVertexToFace(C)
    endFace()
    beginFace()
    addVertexToFace(C)
    addVertexToFace(B)
    addVertexToFace(D)
    endFace()
###    
exports.PolyhedronBuilder = class PolyhedronBuilder

  ### Convert a list of polygons
  to a polyhedron.
  ###
  @fromPolygons : (polygons) ->
    vertexes = []
    vertexIds = new Grid
 
    builder = new PolyhedronBuilder
    builder.begin()

    # When we add vertices to the builder, it assigns them
    # ids incrementally. We need to reverse-lookup vertices
    # by id later on, so write them down here, incrementally
    for polygon in polygons
      for vertex in polygon
        if not vertexIds.has vertex
          if DEBUG
            console.log "Remembering vertex id: #{builder.newVertices} -> ", vertex
          vertexIds.set vertex, builder.newVertices
          builder.addVertex vertex
    
    i=0
    for polygon in polygons
      faceIsDegenerated = false
      fc = {}
      for point in polygon
        v = vertexIds.get point
        if not fc[v]? then fc[v] = 0
        if fc[v]++ > 0
          faceIsDegenerated = true
          
      if not faceIsDegenerated
        builder.beginFace()
      
      for point in polygon
        if not faceIsDegenerated
          builder.addVertexToFace(vertexIds.get(point))
      
      if not faceIsDegenerated
        builder.endFace()
    
    builder.end()
    return builder.getPolyhedron()
      
  ### A simple API to create half-edge based
  polyhedrons.
  
  @param (optional) hds - A half-edge data structure, defaults to a new polyhedron instance.
  ###
  constructor: (hds)->
    @hds = if hds? then hds else new Polyhedron
  
  getPolyhedron : ()-> @hds
  
  begin : () ->
    if DEBUG
      console.log "=== Build Polyhedron ==="

    @indexToVertexMap = {}
    @vertexToEdgeMap = {}
    @newVertices = 0
    @newFaces = 0
    @newHalfedges = 0
    this
  
  addVertex : (point) ->
    [x,y,z] = point
    vertex = new Vertex(x,y,z)
    
    @hds.addVertex vertex
    
    @indexToVertexMap[@newVertices] = vertex
    if DEBUG
      console.log "Vertex: #{@newVertices}: ", vertex
    @newVertices++

    this
    
  beginFace : () ->

    if DEBUG
      console.log "Face #{@hds.faces.length}:"

    @isFirstVertex = true
    @isFirstHalfedge = true
    @isLastVertex = false
    
    @currentFace = new Face()
    @hds.addFace( @currentFace )
    this
  
  addVertexToFace : (vertexToAdd)->

    if DEBUG
      console.log " Vertex #{@indexToVertexMap[vertexToAdd]}"

    if @isFirstVertex
      @firstVertex = vertexToAdd
      @isFirstVertex = false
      return
    if @isFirstHalfedge
      @firstHalfEdge = @lookupHalfedge(@firstVertex, vertexToAdd)
      @prevHalfEdge = @firstHalfEdge.next
      @prevVertex = @secondVertex = vertexToAdd
      @isFirstHalfedge = false
      return
    
    if @isLastVertex
      currentHalfEdge = @firstHalfEdge
    else
      currentHalfEdge = @lookupHalfedge @prevVertex,vertexToAdd
    
    nextHalfEdge = currentHalfEdge.next
    halfEdgeAfterPrevious = @prevHalfEdge.next
    @prevHalfEdge.setNext(nextHalfEdge)
    nextHalfEdge.setPrevious(@prevHalfEdge)
    
    #console.log @vertexToEdgeMap, @prevVertex
    if not @vertexToEdgeMap[@prevVertex]?
      nextHalfEdge.opposite.setNext( @prevHalfEdge.opposite )
      @prevHalfEdge.opposite.setPrevious( nextHalfEdge.opposite )
    
    else
      prevIsBorder = @prevHalfEdge.opposite.isBorder()
      nextIsBorder = nextHalfEdge.opposite.isBorder()

      #console.log "Next is border: #{nextIsBorder}"
      #console.log "Prev is border: #{prevIsBorder}"

      if prevIsBorder and nextIsBorder
        holeHalfEdge = @lookupHole @prevVertex
        nextHalfEdge.opposite.setNext(holeHalfEdge.next)
        holeHalfEdge.next.setPrevious(nextHalfEdge.opposite)
        holeHalfEdge.setNext( @prevHalfEdge.opposite )
        @prevHalfEdge.opposite.setNext(holeHalfEdge)
      else if nextIsBorder
        nextHalfEdge.opposite.setNext(halfEdgeAfterPrevious)
        halfEdgeAfterPrevious.setPrevious(nextHalfEdge.opposite)
      else if prevIsBorder
        currentHalfEdge.setNext( @prevHalfEdge.opposite)
        @prevHalfEdge.opposite.setPrevious( currentHalfEdge )
      else if nextHalfEdge.opposite.next == @prevHalfEdge.opposite
        if @prevHalfEdge.opposite.face != nextHalfEdge.opposite.face
          throw new Error("Incorrect halfedge structure.")
      else
        if halfEdgeAfterPrevious != nextHalfEdge
          currentHalfEdge.setNext(halfEdgeAfterPrevious)
          halfEdgeAfterPrevious.setPrevious(currentHalfEdge)
          he = @prevHalfEdge
          loop 
            if he.isBorder()
              hole = he
            he = he.next.opposite
            break unless @prevHalfEdge.next != halfEdgeAfterPrevious and he != @prevHalfEdge
            
          #console.log @currentFaceStateToString()

          if he == @prevHalfEdge
            # Disconnected facet complexes
            if hole?
              # The complex can be connected with
              # the hole at currentHalfEdge.
              currentHalfEdge.setNext(hole.next)
              hole.next.setPrevious(currentHalfEdge)
              hole.setNext(halfEdgeAfterPrevious)
              halfEdgeAfterPrevious.setPrevious(hole)
            else
              throw new Error("Disconnected facet complexes at vertex #{@prevVertex}")

    #console.log "HalfEdge.vertex:#{@prevHalfEdge.vertex} == #{@indexToVertexMap[@prevVertex]} (Vertex id #{@prevVertex})"
    if @prevHalfEdge.vertex == @indexToVertexMap[@prevVertex]
      @vertexToEdgeMap[@prevVertex] = @prevHalfEdge
    
    @prevHalfEdge = nextHalfEdge
    @prevVertex = vertexToAdd

    this
        
  endFace : () ->
    @addVertexToFace @firstVertex
    @isLastVertex = true
    @addVertexToFace @secondVertex
    he = @vertexToEdgeMap[@secondVertex]
    @currentFace.setHalfEdge(he)
    @newFaces++
    if DEBUG
      console.log "/Face he=#{he}"
      console.log @currentFace.toString()
    this
  
  end : () ->
    this
  
  lookupHalfedge : (startVertexId, endVertexId) ->
    # Pre: 0 <= w,v < new_vertices
    # Case a: It exists an halfedge g from start to end:
    #     g must be a border halfedge and the facet of g->opposite
    #     must be set and different from the current facet.
    #     Set the facet of g to the current facet. Return the
    #     halfedge pointing to g.
    # Case b: It exists no halfedge from start to end:
    #     Create a new pair of halfedges g and g->opposite.
    #     Set the facet of g to the current facet and g->opposite
    #     to a border halfedge. Assign the vertex references.
    #     Set g->opposite->next to g. Return g->opposite.
    #console.log "Looking up #{@indexToVertexMap[startVertexId]}: " + (if @vertexToEdgeMap[startVertexId]? then @vertexToEdgeMap[startVertexId].id else "none")
    if @vertexToEdgeMap[startVertexId]? 
      # Case a, we have a half-edge g pointing to startVertex
      he = @vertexToEdgeMap[startVertexId]
      
      # Must not be associated with current face
      if @currentFace == he.face
        throw new Error("Face #{@newFaces} has self-intersection at vertex #{startVertexId}.")
      
      # Find half edge starting at g
      startEdge = he
      endVertex = @indexToVertexMap[endVertexId]
      loop
        if he.next.vertex == endVertex
          if !he.next.isBorder()
            throw new Error("Face #{@newFaces} shares a halfedge from vertex #{startVertexId} with another face.")
          
          if @currentFace? and @currentFace == he.next.opposite.face
            throw new Error("Face #{@newFaces} has a self intersection at the halfedge from vertex #{startVertexId} to vertex #{endVertexId}.")
            
          he.next.setFace(@currentFace)
          return he
        he = he.next.opposite
        break if startEdge == he
    
    # Case b, create new halfedge
    he = @hds.addHalfEdgePair( new HalfEdge(), new HalfEdge())
    @newHalfedges += 2
    
    he.setFace @currentFace
    he.setVertex @indexToVertexMap[endVertexId]
    he.setPrevious( he.opposite )
    
    he = he.opposite
    he.setVertex(@indexToVertexMap[startVertexId])
    he.setNext(he.opposite)
    return he
      
  lookupHole : (he) ->
    # Halfedge he points to a vertex w. Walk around w to find a hole
    # in the facet structure. Report an error if none exist. Return
    # the halfedge at this hole that points to the vertex w.
    startEdge = he
    first = true
    while he != startEdge and not first
      first = false
      return he if he.next.isBorder()
      he = he.next.opposite
      
    throw new Error("A closed surface already exists, yet facet #{@newFaces} is still adjacent.")

  currentFaceStateToString : ->
    if @isFirstVertex then return ""
    if @isFirstHalfedge then return "(none)"
    out = []
    nextHalfEdge = @firstHalfEdge
    while nextHalfEdge?
      prevV = if nextHalfEdge.previous? then nextHalfEdge.previous.vertex else "null"
      out.push " (#{prevV}-[#{nextHalfEdge.id}]->#{nextHalfEdge.vertex})"
      nextHalfEdge = nextHalfEdge.next
      break if nextHalfEdge == @firstHalfEdge

    return out.join("")
      
    
    
### A lookup table with an arbitrary number of dimensions,
used to store and retrieve objects using points.

You can use it as a two-dimensional structure:

  mygrid.set([0,0],"This is the object at 0,0")
  obj = mygrid.get([0,0])

Or as a three dimensional one:

  mygrid.set([0,0,0],"This is the object at 0,0,0")
  obj = mygrid.get([0,0,0])

Or any other number of dimensions.
###
exports.Grid = class Grid
  
  constructor : () ->
    @data = []
    
  set : (pt, value) ->
    dimension = @data
    for v in pt[..-2]
      if not dimension[v]?
        dimension[v] = []
      dimension = dimension[v]
    dimension[pt[pt.length-1]] = value
    
  get : (pt) ->
    dimension = @data
    for v in pt
      if not dimension[v]?
        return undefined
      dimension = dimension[v]
    dimension

  has : (pt) ->
    return @get(pt) != undefined
    
