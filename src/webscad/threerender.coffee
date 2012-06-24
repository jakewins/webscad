
if THREE?
  Three = THREE
else
  {Three} = require '../Three_module'

exports.ScadFaceToThreeFacesConverter = class ScadFaceToThreeFacesConverter
  
  ### Takes one of our faces (based on the half-edge data structure),
  and converts it to one or more THREE.Face3 objects.
  TODO: Use the THREE.Face4 class when possible.
  ###
  convert : (scadFace) ->
    console.log(scadFace)
    

exports.ThreeGeometryBuilder = class ThreeGeometryBuilder
  
  begin : ->
    @geometry = new Three.Geometry()
    @materials = []

  end : ->
    @geometry.materials = @materials
    @geometry

exports.ThreeRenderer = class ThreeRenderer

  constructor : ->
    @builder = new ThreeGeometryBuilder()

  ### Takes a NefPolyhedron, and converts it into
  a Three.js polyhedron.
  ###
  render : (nefPolyhedron) ->
    #@builder.begin()
    #@builder.end()
