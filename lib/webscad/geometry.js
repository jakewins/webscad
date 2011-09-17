(function() {
  /* Full disclosure:
  My current knowledge level of geometry
  is something like "squares are a type of rectangle".
  I apologize in advance if any of the documentation
  below is rediculously incorrect. This is kind of a 
  learning-by-doing experience.
  */  var DEBUG, Face, Grid, HalfEdge, HalfEdgeDataStructure, Polyhedron, PolyhedronBuilder, Vertex;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  };
  DEBUG = false;
  /* A vertex is a special type of point that
  specifies the beginning or end of a line.
  
  Our vertexes have three defining dimensions (x,y and z).
  */
  exports.Vertex = Vertex = (function() {
    function Vertex(x, y, z) {
      this.x = x;
      this.y = y;
      this.z = z;
    }
    Vertex.prototype.setHalfEdge = function(halfEdge) {
      this.halfEdge = halfEdge;
    };
    return Vertex;
  })();
  /* A face is the area inside a polygon.
  */
  exports.Face = Face = (function() {
    function Face(plane) {
      this.plane = plane;
    }
    Face.prototype.setHalfEdge = function(halfEdge) {
      this.halfEdge = halfEdge;
    };
    return Face;
  })();
  exports.HalfEdge = HalfEdge = (function() {
    function HalfEdge(_face, _vertex) {
      this._face = _face;
      this._vertex = _vertex;
    }
    HalfEdge.prototype.isBorder = function() {
      return this._face != null;
    };
    HalfEdge.prototype.setPrevious = function(_previous) {
      this._previous = _previous;
    };
    HalfEdge.prototype.previous = function() {
      return this._previous;
    };
    HalfEdge.prototype.setNext = function(_next) {
      this._next = _next;
    };
    HalfEdge.prototype.next = function() {
      return this._next;
    };
    HalfEdge.prototype.setFace = function(_face) {
      this._face = _face;
    };
    HalfEdge.prototype.face = function() {
      return this._face;
    };
    HalfEdge.prototype.setVertex = function(_vertex) {
      this._vertex = _vertex;
    };
    HalfEdge.prototype.vertex = function() {
      return this._vertex;
    };
    HalfEdge.prototype.setOpposite = function(_opposite) {
      this._opposite = _opposite;
    };
    HalfEdge.prototype.opposite = function() {
      return this._opposite;
    };
    return HalfEdge;
  })();
  /* Works as a low-level foundation
  for higher level geometric concepts, like
  polyhedrons.
  */
  exports.HalfEdgeDataStructure = HalfEdgeDataStructure = (function() {
    function HalfEdgeDataStructure() {
      this.faces = [];
      this.halfEdges = [];
      this.vertices = [];
    }
    HalfEdgeDataStructure.prototype.addVertex = function(vertex) {
      return this.vertices.push(vertex);
    };
    HalfEdgeDataStructure.prototype.addFace = function(face) {
      return this.faces.push(face);
    };
    HalfEdgeDataStructure.prototype.addHalfEdgePair = function(h, g) {
      h.setOpposite(g);
      g.setOpposite(h);
      this.halfEdges.push(h);
      this.halfEdges.push(g);
      return h;
    };
    return HalfEdgeDataStructure;
  })();
  exports.Polyhedron = Polyhedron = (function() {
    __extends(Polyhedron, HalfEdgeDataStructure);
    function Polyhedron(polygons) {
      Polyhedron.__super__.constructor.call(this);
    }
    Polyhedron.prototype.toString = function() {
      return "";
    };
    return Polyhedron;
  })();
  /* A coffeescript port of CGAL's
  Polyhedron_incremental_builder_3.
  */
  exports.PolyhedronBuilder = PolyhedronBuilder = (function() {
    /* Convert a list of polygons
    to a polyhedron.
    */    PolyhedronBuilder.fromPolygons = function(polygons) {
      var builder, faceIsDegenerated, fc, i, point, polygon, v, vertex, vertexIds, vertexes, _i, _j, _k, _l, _len, _len2, _len3, _len4, _len5, _len6, _m, _n;
      vertexes = [];
      vertexIds = new Grid;
      for (_i = 0, _len = polygons.length; _i < _len; _i++) {
        polygon = polygons[_i];
        for (_j = 0, _len2 = polygon.length; _j < _len2; _j++) {
          point = polygon[_j];
          if (!vertexIds.has(point)) {
            vertexIds.set(point, vertexes.length);
            vertexes.push(point);
          }
        }
      }
      builder = new PolyhedronBuilder;
      builder.begin();
      if (DEBUG) {
        console.log("=== CGAL Surface ===");
      }
      i = 0;
      for (_k = 0, _len3 = vertexes.length; _k < _len3; _k++) {
        vertex = vertexes[_k];
        builder.addVertex(vertex);
        if (DEBUG) {
          console.log("" + (i++) + ": ", vertex);
        }
      }
      i = 1;
      for (_l = 0, _len4 = polygons.length; _l < _len4; _l++) {
        polygon = polygons[_l];
        faceIsDegenerated = false;
        fc = {};
        for (_m = 0, _len5 = polygon.length; _m < _len5; _m++) {
          point = polygon[_m];
          v = vertexIds.get(point);
          if (!(fc[v] != null)) {
            fc[v] = 0;
          }
          if (fc[v]++ > 0) {
            faceIsDegenerated = true;
          }
        }
        if (!faceIsDegenerated) {
          builder.beginFace();
        }
        if (DEBUG) {
          console.log("Face " + (i++) + ":");
        }
        for (_n = 0, _len6 = polygon.length; _n < _len6; _n++) {
          point = polygon[_n];
          if (!faceIsDegenerated) {
            if (DEBUG) {
              console.log(" " + (vertexIds.get(point)) + " (", point, ")");
            }
            builder.addVertexToFace(vertexIds.get(point));
          }
        }
        if (!faceIsDegenerated) {
          builder.endFace();
        }
      }
      builder.endFace();
      return builder.getPolygon();
    };
    /* A simple API to create half-edge based
    polyhedrons.
    
    @param (optional) hds - A half-edge data structure, defaults to a new polyhedron instance.
    */
    function PolyhedronBuilder(hds) {
      this.hds = hds != null ? hds : new Polyhedron;
    }
    PolyhedronBuilder.prototype.getPolygon = function() {
      return this.hds;
    };
    PolyhedronBuilder.prototype.begin = function() {
      this.indexToVertexMap = {};
      this.vertexToEdgeMap = {};
      this.newVertices = 0;
      this.newFaces = 0;
      this.newHalfedges = 0;
      return this;
    };
    PolyhedronBuilder.prototype.addVertex = function(point) {
      var vertex, x, y, z;
      x = point[0], y = point[1], z = point[2];
      vertex = new Vertex(x, y, z);
      this.hds.addVertex(vertex);
      this.newVertices++;
      this.indexToVertexMap[this.newVertices] = vertex;
      return this;
    };
    PolyhedronBuilder.prototype.beginFace = function() {
      this.firstVertex = true;
      this.firstHalfedge = true;
      this.lastVertex = false;
      this.currentFace = new Face();
      this.hds.addFace(this.currentFace);
      return this;
    };
    PolyhedronBuilder.prototype.addVertexToFace = function(v2) {
      var b1, b2, first, h2, he, hole, holeHalfEdge, hprime, prev;
      if (this.firstVertex) {
        this.w1 = v2;
        this.firstVertex = false;
        return;
      }
      if (this.firstHalfedge) {
        this.gprime = this.lookupHalfedge(this.w1, v2);
        this.h1 = this.g1 = this.gprime.next();
        this.v1 = this.w2 = v2;
        this.firstHalfedge = false;
        return;
      }
      if (this.lastVertex) {
        hprime = this.gprime;
      } else {
        hprime = this.lookupHalfedge(this.v1, v2);
      }
      h2 = hprime.next();
      prev = this.h1.next();
      this.h1.setNext(h2);
      h2.setPrevious(this.h1);
      if (!(this.vertexToEdgeMap[this.v1] != null)) {
        h2.opposite().setNext(this.h1.opposite());
        this.h1.opposite().setPrevious(h2.opposite());
      } else {
        b1 = this.h1.opposite().isBorder();
        b2 = h2.opposite().isBorder();
        if (b1 && b2) {
          holeHalfEdge = this.lookupHole(this.v1);
          h2.opposite().setNext(holeHalfEdge.next());
          holeHalfEdge.next().setPrevious(h2.opposite());
          holeHalfEdge.setNext(this.h1.opposite());
          this.h1.opposite().setNext(holeHalfEdge);
        } else if (b2) {
          h2.opposite().setNext(prev);
          prev.setPrevious(h2.opposite());
        } else if (b1) {
          hprime.setNext(this.h1.opposite());
          this.h1.opposite().setPrevious(hprime);
        } else if (h2.opposite().next() === this.h1.opposite()) {
          if (this.h1.opposite().face() !== h2.opposite().face()) {
            throw new Error("Incorrect halfedge structure.");
          }
        } else {
          if (prev !== h2) {
            hprime.setNext(prev);
            prev.setPrevious(hprime);
            he = this.h1;
            first = true;
            while (this.h1.next() !== prev && he !== this.h1 && !first) {
              first = false;
              if (he.isBorder()) {
                hole = he;
              }
              he = he.next().opposite();
            }
            if (he === this.h1) {
              if (hole != null) {
                hprime.setNext(hole.next());
                hole.next().setPrevious(hprime);
                hole.setNext(prev);
                prev.setPrevious(hole);
              } else {
                throw new Error("Disconnected facet complexes at vertex " + this.v1);
              }
            }
          }
        }
      }
      if (this.h1.vertex() === this.indexToVertexMap[this.v1]) {
        this.vertexToEdgeMap[this.v1] = this.h1;
      }
      this.h1 = h2;
      this.v1 = v2;
      return this;
    };
    PolyhedronBuilder.prototype.endFace = function() {
      var he;
      this.addVertexToFace(this.w1);
      this.lastVertex = true;
      this.addVertexToFace(this.w2);
      he = this.vertexToEdgeMap[this.w2];
      this.currentFace.setHalfEdge(he);
      this.newFaces++;
      return he;
    };
    PolyhedronBuilder.prototype.end = function() {
      return this;
    };
    PolyhedronBuilder.prototype.lookupHalfedge = function(startVertexId, endVertexId) {
      var endVertex, first, he, startEdge;
      if (this.vertexToEdgeMap[startVertexId] != null) {
        he = this.vertexToEdgeMap[startVertexId];
        if (this.currentFace === he.face()) {
          throw new Error("Face " + this.newFaces + " has self-intersection at vertex " + startVertexId + ".");
        }
        startEdge = he;
        endVertex = this.indexToVertexMap[endVertexId];
        first = true;
        while (startEdge !== he && !first) {
          first = false;
          if (he.next().vertex() === endVertex) {
            if (!he.next().isBorder()) {
              throw new Error("Face " + this.newFaces + " shares a halfedge from vertex " + startVertexId + " with another face.");
            }
            if ((this.currentFace != null) && this.currentFace === he.next().opposite().face()) {
              throw new Error("Face " + this.newFaces + " has a self intersection at the halfedge from vertex " + startVertexId + " to vertex " + endVertexId + ".");
            }
            he.next().setFace(this.currentFace);
            return he;
          }
          he = he.next().opposite();
        }
      }
      he = this.hds.addHalfEdgePair(new HalfEdge(), new HalfEdge());
      this.newHalfedges += 2;
      he.setFace(this.currentFace);
      he.setVertex(this.indexToVertexMap[startVertexId]);
      he.setPrevious(he.opposite());
      he = he.opposite();
      he.setVertex(this.indexToVertexMap[endVertexId]);
      he.setNext(he.opposite());
      return he;
    };
    PolyhedronBuilder.prototype.lookupHole = function(he) {
      var first, startEdge;
      startEdge = he;
      first = true;
      while (he !== startEdge && !first) {
        first = false;
        if (he.next().isBorder()) {
          return he;
        }
        he = he.next().opposite();
      }
      throw new Error("A closed surface already exists, yet facet " + this.newFaces + " is still adjacent.");
    };
    return PolyhedronBuilder;
  })();
  exports.Grid = Grid = (function() {
    function Grid() {
      this.data = [];
    }
    Grid.prototype.set = function(pt, value) {
      var dimension, v, _i, _len, _ref;
      dimension = this.data;
      _ref = pt.slice(0, -1);
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        v = _ref[_i];
        if (!(dimension[v] != null)) {
          dimension[v] = [];
        }
        dimension = dimension[v];
      }
      return dimension[pt[pt.length - 1]] = value;
    };
    Grid.prototype.get = function(pt) {
      var dimension, v, _i, _len;
      dimension = this.data;
      for (_i = 0, _len = pt.length; _i < _len; _i++) {
        v = pt[_i];
        if (!(dimension[v] != null)) {
          return;
        }
        dimension = dimension[v];
      }
      return dimension;
    };
    Grid.prototype.has = function(pt) {
      return this.get(pt) !== void 0;
    };
    return Grid;
  })();
}).call(this);
