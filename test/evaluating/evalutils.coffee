
{parse,Scad} = require "../../lib/webscad/scad"

scad = new Scad

exports.produces = (expectedCSG) ->
  verify = (csg) ->
    eq csg.toString(), expectedCSG.toString()
    
exports.assertEvaluating = (text, verify) ->
  verify scad.evaluate( parse text )
