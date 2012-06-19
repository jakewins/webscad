
{parse,Scad} = require "../../lib/webscad/scad"

scad = new Scad

exports.producesCsg = (expectedCSG) ->
  verify = (text) ->
    csg = scad.evalAst text
    eq csg.toString(), expectedCSG.toString()
    

