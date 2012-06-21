
{parse,Scad} = require "../../lib/webscad/scad"

scad = new Scad

exports.producesGeometry = (expectedGeometry) ->
  verify = (text) ->
    geometry = scad.evalCsg text

    whatIExpected = expectedGeometry.toString()
    whatIGot = geometry.toString()

    if whatIGot isnt whatIExpected
      console.log "Expected:"
      console.log whatIExpected
      console.log "Got:"
      console.log whatIGot

    eq whatIGot, whatIExpected
