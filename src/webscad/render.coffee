
{Scad} = require './scad'

scad = new Scad

exports.render = (text) ->
  nefPoly = scad.evalCsg(text)
