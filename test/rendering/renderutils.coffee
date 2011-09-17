
{parse,Scad} = require "../../lib/webscad/scad"

scad = new Scad

exports.produces = (expectedGeometry) ->
  verify = (geometry) ->
    eq geometry.toString(), expectedGeometry.toString()
    
exports.assertRendering = (text, verify) ->
  verify scad.render text
