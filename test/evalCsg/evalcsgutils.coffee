
{parse,Scad} = require "../../lib/webscad/scad"

scad = new Scad

exports.producesGeometry = (expectedGeometry) ->
  verify = (text) ->
    geometry = scad.evalCsg text
    eq geometry.toString(), expectedGeometry.toString()
