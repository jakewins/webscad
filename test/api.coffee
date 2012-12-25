
# Import Scad, either from the file system, or by adding the
# aggregated webscad.js file as a <script> tag in your HTML. The aggregated
# version can be found under 'extras'. Note that both of them depend on csg.js, which
# can be found in extras/csg.js.
{Scad} = require "../lib/webscad/scad"

test "show how to evaluate SCAD code", ->
  
  # Create a new instance
  scad = new Scad
  
  # Run some SCAD code
  csgObject = scad.evaluate("cube(10);")
  
  # Now we have a csg object, which we can use to do lots
  # of cool things (like rendering in the browser, or dumping as an .STL)
  #
  # Please refer to the csg.js API for how to use this, or check out the
  # webscad demo for how to render these in the browser.
  
  
test "show how to define how imports should be loaded", ->
  
  # Create a new instance
  scad = new Scad
  
  # Define a custom file loader
  scad.setFileLoader (path, callback) ->
    # A function that loads files, and gives them as text
    # to the callback method when they are loaded.
    callback "cube(10);"