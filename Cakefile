fs            = require 'fs'
path          = require 'path'
{extend}      = require './lib/webscad/helpers'
CoffeeScript  = require 'coffee-script'
{spawn, exec} = require 'child_process'

# ANSI Terminal Colors.
bold  = '\033[0;1m'
red   = '\033[0;31m'
green = '\033[0;32m'
reset = '\033[0m'

# Built file header.
header = """
  /**
   * WebSCAD
   *
   * Copyright 2011, Jacob Hansson
   * Released under the MIT License
   */
"""

run = (args) ->
  proc =         spawn 'coffee', args
  proc.stderr.on 'data', (buffer) -> console.log buffer.toString()
  proc.on        'exit', (status) -> process.exit(1) if status != 0

# Log a message with a color.
log = (message, color, explanation) ->
  console.log color + message + reset + ' ' + (explanation or '')

option '-p', '--prefix [DIR]', 'set the installation prefix for `cake install`'


task 'build', 'build the CoffeeScript language from source', ->
  run ['-c', '-o', 'lib', 'src']


task 'build:full', 'rebuild the source twice, and run the tests', ->
  exec 'bin/cake build && bin/cake build && bin/cake test', (err, stdout, stderr) ->
    console.log stdout.trim() if stdout
    console.log stderr.trim() if stderr
    throw err    if err


task 'build:parser', 'rebuild the Jison parser (run build first)', ->
  extend global, require('util')
  require 'jison'
  parser = require('./lib/webscad/grammar').parser
  fs.writeFile 'lib/webscad/parser.js', parser.generate()


task 'build:browser', 'rebuild the merged script for inclusion in the browser', ->
  code = ''
  for name in ['helpers', 'rewriter', 'lexer', 'parser', 'scope', 'nodes', 'coffee-script', 'browser']
    code += """
      require['./#{name}'] = new function() {
        var exports = this;
        #{fs.readFileSync "lib/#{name}.js"}
      };
    """
  code = """
    this.CoffeeScript = function() {
      function require(path){ return require[path]; }
      #{code}
      return require['./coffee-script']
    }()
  """
  unless process.env.MINIFY is 'false'
    {parser, uglify} = require 'uglify-js'
    code = uglify.gen_code uglify.ast_squeeze uglify.ast_mangle parser.parse code
  fs.writeFileSync 'extras/coffee-script.js', header + '\n' + code
  console.log "built ... running browser tests:"
  invoke 'test:browser'


task 'doc:site', 'watch and continually rebuild the documentation for the website', ->
  exec 'rake doc', (err) ->
    throw err if err


task 'doc:source', 'rebuild the internal documentation', ->
  exec 'docco src/*.coffee && cp -rf docs documentation && rm -r docs', (err) ->
    throw err if err


# Run the CoffeeScript test suite.
runTests = (CoffeeScript) ->
  startTime   = Date.now()
  currentFile = null
  passedTests = 0
  failures    = []

  # make "global" reference available to tests
  global.global = global

  # Mix in the assert module globally, to make it available for tests.
  addGlobal = (name, func) ->
    global[name] = ->
      passedTests += 1
      func arguments...

  addGlobal name, func for name, func of require 'assert'

  # Convenience aliases.
  global.eq = global.strictEqual
  global.CoffeeScript = CoffeeScript

  # Our test helper function for delimiting different test cases.
  global.test = (description, fn) ->
    try
      fn.test = {description, currentFile}
      fn.call(fn)
    catch e
      e.description = description if description?
      e.source      = fn.toString() if fn.toString?
      failures.push file: currentFile, error: e

  # A recursive functional equivalence helper; uses egal for testing equivalence.
  # See http://wiki.ecmascript.org/doku.php?id=harmony:egal
  arrayEqual = (a, b) ->
    if a is b
      # 0 isnt -0
      a isnt 0 or 1/a is 1/b
    else if a instanceof Array and b instanceof Array
      return no unless a.length is b.length
      return no for el, idx in a when not arrayEqual el, b[idx]
      yes
    else
      # NaN is NaN
      a isnt a and b isnt b

  global.arrayEq = (a, b, msg) -> ok arrayEqual(a,b), msg

  # When all the tests have run, collect and print errors.
  # If a stacktrace is available, output the compiled function source.
  process.on 'exit', ->
    time = ((Date.now() - startTime) / 1000).toFixed(2)
    message = "passed #{passedTests} tests in #{time} seconds#{reset}"
    return log(message, green) unless failures.length
    log "failed #{failures.length} and #{message}", red
    for fail in failures
      {error, file}      = fail
      jsFile             = file.replace(/\.coffee$/,'.js')
      match              = error.stack?.match(new RegExp(fail.file+":(\\d+):(\\d+)"))
      match              = error.stack?.match(/on line (\d+):/) unless match
      [match, line, col] = match if match
      log "\n  #{error.toString()}", red
      log "  #{error.description}", red if error.description
      log "  #{jsFile}: line #{line or 'unknown'}, column #{col or 'unknown'}", red
      console.log "  #{error.source}" if error.source

  # Run every test in the `test` folder, recording failures.
  fs.readdir 'test', (err, files) ->
    files.forEach (file) ->
      return unless file.match(/\.coffee$/i)
      filename = path.join 'test', file
      fs.readFile filename, (err, code) ->
        currentFile = filename
        try
          CoffeeScript.run code.toString(), {filename}
        catch e
          failures.push file: currentFile, error: e


task 'test', 'run the CoffeeScript language test suite', ->
  runTests CoffeeScript


task 'test:browser', 'run the test suite against the merged browser script', ->
  source = fs.readFileSync 'extras/coffee-script.js', 'utf-8'
  result = {}
  global.testingBrowser = yes
  (-> eval source).call result
  runTests result.CoffeeScript
