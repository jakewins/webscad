
{parse,Scad} = require "../../lib/webscad/scad"

scad = new Scad

exports.produces = (expectedScene) ->
  verify = (scene) ->
    

exports.assertEvaluating = (text, verify) ->
  verify scad.evaluate( parse text )
