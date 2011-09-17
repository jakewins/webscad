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
  
  
### A face is the area inside a polygon.
###
exports.Face = class Face
  
  constructor:( @plane )->
  setHalfEdge:( @halfEdge )->


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
  
  constructor:(@_face, @_vertex)->

  # Does this halfedge have a face connected?
  isBorder : () -> @_face?
  
  setPrevious:(@_previous)->
  previous:()->@_previous
  
  setNext:(@_next)->
  next:()->@_next
  
  setFace:(@_face)->
  face:()->@_face
  
  setVertex:(@_vertex)->
  vertex:()->@_vertex
  
  # The "other" half of the line.
  setOpposite:(@_opposite)->
  opposite:()->@_opposite

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

  constructor : (polygons) ->
    super()

  toString : () ->
    return ""


### A coffeescript port of CGAL's
Polyhedron_incremental_builder_3.
###    
exports.PolyhedronBuilder = class PolyhedronBuilder

  ### Convert a list of polygons
  to a polyhedron.
  ###
  @fromPolygons : (polygons) ->
    vertexes = []
    vertexIds = new Grid
    
    for polygon in polygons
      for point in polygon
        if not vertexIds.has point
          vertexIds.set point, vertexes.length
          vertexes.push point
          
    builder = new PolyhedronBuilder
    builder.begin()
    if DEBUG
      console.log "=== CGAL Surface ==="
    
    i=0
    for vertex in vertexes
      builder.addVertex vertex
      if DEBUG
        console.log "#{i++}: ", vertex
    
    i=1
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
        
      if DEBUG
        console.log "Face #{i++}:"
      for point in polygon
        if not faceIsDegenerated
          if DEBUG
            console.log " #{vertexIds.get(point)} (", point, ")"
          builder.addVertexToFace(vertexIds.get(point))
      
      if not faceIsDegenerated
        builder.endFace()
    
    builder.endFace()
    return builder.getPolygon()
      
  ### A simple API to create half-edge based
  polyhedrons.
  
  @param (optional) hds - A half-edge data structure, defaults to a new polyhedron instance.
  ###
  constructor: (hds)->
    @hds = if hds? then hds else new Polyhedron
  
  getPolygon : ()-> @hds
  
  begin : () ->
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
    
    @newVertices++
    @indexToVertexMap[@newVertices] = vertex
    this
    
  beginFace : () ->
    @firstVertex = true
    @firstHalfedge = true
    @lastVertex = false
    
    @currentFace = new Face()
    @hds.addFace( @currentFace )
    this
  
  addVertexToFace : (v2)->
    if @firstVertex
      @w1 = v2
      @firstVertex = false
      return
    if @firstHalfedge
      @gprime = @lookupHalfedge(@w1, v2)
      @h1 = @g1 = @gprime.next()
      @v1 = @w2 = v2
      @firstHalfedge = false
      return
    
    if @lastVertex
      hprime = @gprime
    else
      hprime = @lookupHalfedge @v1,v2
    
    h2 = hprime.next()
    prev = @h1.next()
    @h1.setNext(h2)
    h2.setPrevious(@h1)
    
    if not @vertexToEdgeMap[@v1]?
      h2.opposite().setNext( @h1.opposite() )
      @h1.opposite().setPrevious( h2.opposite() )
    else
      b1 = @h1.opposite().isBorder()
      b2 = h2.opposite().isBorder()
      if b1 and b2
        holeHalfEdge = @lookupHole @v1
        h2.opposite().setNext(holeHalfEdge.next())
        holeHalfEdge.next().setPrevious(h2.opposite())
        holeHalfEdge.setNext( @h1.opposite() )
        @h1.opposite().setNext(holeHalfEdge)
      else if b2
        h2.opposite().setNext(prev)
        prev.setPrevious(h2.opposite())
      else if b1
        hprime.setNext( @h1.opposite())
        @h1.opposite().setPrevious( hprime )
      else if h2.opposite().next() == @h1.opposite()
        if @h1.opposite().face() != h2.opposite().face()
          throw new Error("Incorrect halfedge structure.")
      else
        if prev != h2
          hprime.setNext(prev)
          prev.setPrevious(hprime)
          he = @h1
          first = true
          while @h1.next() != prev and he != @h1 and not first
            first = false
            if he.isBorder()
              hole = he
            he = he.next().opposite()
            
          if he == @h1
            # Disconnected facet complexes
            if hole?
              # The complex can be connected with
              # the hole at hprime.
              hprime.setNext(hole.next())
              hole.next().setPrevious(hprime)
              hole.setNext(prev)
              prev.setPrevious(hole)
            else
              throw new Error("Disconnected facet complexes at vertex #{@v1}")
    if @h1.vertex() == @indexToVertexMap[@v1]
      @vertexToEdgeMap[@v1] = @h1
    
    @h1 = h2
    @v1 = v2
    this
        
  endFace : () ->
    @addVertexToFace @w1
    @lastVertex = true
    @addVertexToFace @w2
    he = @vertexToEdgeMap[@w2]
    @currentFace.setHalfEdge(he)
    @newFaces++
    return he
  
  end : () ->
    this
  
  lookupHalfedge : (startVertexId, endVertexId) ->
    # Pre: 0 <= w,v < new_vertices
    # Case a: It exists an halfedge g from start to end:
    #     g must be a border halfedge and the facet of g->opposite()
    #     must be set and different from the current facet.
    #     Set the facet of g to the current facet. Return the
    #     halfedge pointing to g.
    # Case b: It exists no halfedge from start to end:
    #     Create a new pair of halfedges g and g->opposite().
    #     Set the facet of g to the current facet and g->opposite()
    #     to a border halfedge. Assign the vertex references.
    #     Set g->opposite()->next() to g. Return g->opposite().
    if @vertexToEdgeMap[startVertexId]?
      he = @vertexToEdgeMap[startVertexId]
      if @currentFace == he.face()
        throw new Error("Face #{@newFaces} has self-intersection at vertex #{startVertexId}.")
      
      startEdge = he
      endVertex = @indexToVertexMap[endVertexId]
      first = true
      while startEdge != he and not first
        first = false
        
        if he.next().vertex() == endVertex
          if !he.next().isBorder()
            throw new Error("Face #{@newFaces} shares a halfedge from vertex #{startVertexId} with another face.")
          
          if @currentFace? and @currentFace == he.next().opposite().face()
            throw new Error("Face #{@newFaces} has a self intersection at the halfedge from vertex #{startVertexId} to vertex #{endVertexId}.")
            
          he.next().setFace(@currentFace)
          return he
        he = he.next().opposite()
    
    # Create new halfedge
    he = @hds.addHalfEdgePair( new HalfEdge(), new HalfEdge())
    @newHalfedges += 2
    
    he.setFace @currentFace
    he.setVertex @indexToVertexMap[startVertexId]
    he.setPrevious( he.opposite() )
    
    he = he.opposite()
    he.setVertex(@indexToVertexMap[endVertexId])
    he.setNext(he.opposite())
    return he
      
  lookupHole : (he) ->
    # Halfedge he points to a vertex w. Walk around w to find a hole
    # in the facet structure. Report an error if none exist. Return
    # the halfedge at this hole that points to the vertex w.
    startEdge = he
    first = true
    while he != startEdge and not first
      first = false
      return he if he.next().isBorder()
      he = he.next().opposite()
      
    throw new Error("A closed surface already exists, yet facet #{@newFaces} is still adjacent.")
    
    
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
    
