(function() {
  var Lexer, Scad, astNodes, builtin, csgNodes, extend, lexer, parser;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  Lexer = require("./lexer").Lexer;
  parser = require("./parser").parser;
  extend = require("./helpers").extend;
  astNodes = require('./ast');
  csgNodes = require('./csg');
  builtin = require('./builtins');
  lexer = new Lexer;
  parser.lexer = {
    lex: function() {
      var tag, _ref;
      _ref = this.tokens[this.pos++] || [''], tag = _ref[0], this.yytext = _ref[1], this.yylineno = _ref[2];
      return tag;
    },
    setInput: function(tokens) {
      this.tokens = tokens;
      return this.pos = 0;
    },
    upcomingInput: function() {
      return "";
    }
  };
  parser.yy = astNodes;
  exports.Scad = Scad = (function() {
    function Scad() {}
    /*
      Set the file loader to be used
      by Scad#load(path).
      
      The file loader should be a 
      function that takes a file
      path and a callback, and returns
      the text contents of the file.
      */
    Scad.prototype.setFileLoader = function(fileLoader) {
      this.fileLoader = fileLoader;
    };
    /*
      Generate the effective AST given
      a file path. Uses the file loader
      from Scad#setFileLoader to load
      relevant files.
      */
    Scad.prototype.load = function(path, cb) {
      return this.fileLoader(path, __bind(function(text) {
        var ast, calls;
        ast = this.parse(text);
        calls = 1;
        ast.replaceIncludes(__bind(function(path, replaceCb) {
          calls++;
          return this.load(path, function(childAst) {
            replaceCb(childAst);
            calls--;
            if (calls === 0) {
              return cb(ast);
            }
          });
        }, this));
        calls--;
        if (calls === 0) {
          return cb(ast);
        }
      }, this));
    };
    /*
      Parse a string of SCAD code or an array of lexed tokens, and
      return the AST. 
      */
    Scad.prototype.parse = function(source, options) {
      if (typeof source === 'string') {
        return parser.parse(lexer.tokenize(source, options));
      } else {
        return parser.parse(source);
      }
    };
    /*
      Evalutate an abstract syntax tree, yielding
      a CSG tree.
      */
    Scad.prototype.evaluate = function(ast) {
      var call, ctx;
      if (typeof ast === 'string' || !(ast instanceof astNodes.AstNode)) {
        ast = this.parse(ast);
      }
      ctx = new astNodes.Context;
      ctx._modules = builtin.modules;
      ctx._functions = builtin.functions;
      call = new astNodes.ModuleCall();
      return ast.evaluate(ctx, call);
    };
    /*
      Render a CSG tree, yielding the final 3d output
      in the form of a polyhedron object.
      */
    Scad.prototype.render = function(csgTree) {
      if (typeof csgTree === 'string' || !(csgTree instanceof csgNodes.CsgNode)) {
        csgTree = this.evaluate(csgTree);
      }
      return csgTree.render();
    };
    return Scad;
  })();
}).call(this);
