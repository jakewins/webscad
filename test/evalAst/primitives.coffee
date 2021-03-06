
{assertEvaluating} = require "../evalutils"
{producesCsg} = require "./evalastutils"
csg = require("../../lib/csg_module").CSG

test "cube module", ->
  assertEvaluating "cube([1,2,3]);", producesCsg csg.cube( {radius:[1,2,3]} )
  
test "sphere module", ->
  assertEvaluating "sphere(r=3);", producesCsg csg.sphere( {radius:3} )
  
test "polyhedron module", ->
  assertEvaluating """polyhedron(
    points=[ [10,10,0],[10,-10,0],[-10,-10,0],[-10,10,0],
             [0,0,10]  ], 
    triangles=[ [0,1,4],[1,2,4],[2,3,4],[3,0,4],
                [1,0,3],[2,1,3] ]
   );""", producesCsg CSG.fromPolygons([
    new CSG.Polygon([ # [0,1,4]
      new CSG.Vertex(new CSG.Vector3D(10,10,0)),
      new CSG.Vertex(new CSG.Vector3D(10,-10,0)),
      new CSG.Vertex(new CSG.Vector3D(0,0,10)),
    ]), 
    new CSG.Polygon([ # [1,2,4]
      new CSG.Vertex(new CSG.Vector3D(10,-10,0)),
      new CSG.Vertex(new CSG.Vector3D(-10,-10,0)),
      new CSG.Vertex(new CSG.Vector3D(0,0,10)),
    ]),
    new CSG.Polygon([ # [2,3,4]
      new CSG.Vertex(new CSG.Vector3D(-10,-10,0)),
      new CSG.Vertex(new CSG.Vector3D(-10,10,0)),
      new CSG.Vertex(new CSG.Vector3D(0,0,10)),
    ]),
    new CSG.Polygon([ # [3,0,4]
      new CSG.Vertex(new CSG.Vector3D(-10,10,0)),
      new CSG.Vertex(new CSG.Vector3D(10,10,0)),
      new CSG.Vertex(new CSG.Vector3D(0,0,10)),
    ]),
    new CSG.Polygon([ # [1,0,3]
      new CSG.Vertex(new CSG.Vector3D(10,-10,0)),
      new CSG.Vertex(new CSG.Vector3D(10,10,0)),
      new CSG.Vertex(new CSG.Vector3D(-10,10,0)),
    ]),
    new CSG.Polygon([ # [2,1,3]
      new CSG.Vertex(new CSG.Vector3D(-10,-10,0)),
      new CSG.Vertex(new CSG.Vector3D(10,-10,0)),
      new CSG.Vertex(new CSG.Vector3D(-10,10,0)),
    ])])