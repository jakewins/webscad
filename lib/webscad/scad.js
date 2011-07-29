(function() {
  var Evaluator, Lexer, Scad, lexer, parse, parser;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  Lexer = require("webscad/lexer").Lexer;
  parser = require("webscad/parser").parser;
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
  exports.Scad = Scad = (function() {
    function Scad() {}
    Scad.prototype.setFileLoader = function(fileLoader) {
      this.fileLoader = fileLoader;
    };
    Scad.prototype.load = function(path) {
      var ast;
      ast = parse(this.fileLoader(path));
      return ast.replaceIncludes(__bind(function(path) {
        return this.load(path);
      }, this));
    };
    return Scad;
  })();
  exports.Evaluator = Evaluator = (function() {
    function Evaluator(three) {
      this.three = three;
    }
    Evaluator.prototype.evaluate = function(ast) {
      var modules, st, vars, _i, _len, _ref, _results;
      vars = {};
      modules = {};
      _ref = ast.statements;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        st = _ref[_i];
        _results.push(st instanceof Module ? modules[st.name] = st : void 0);
      }
      return _results;
    };
    return Evaluator;
  })();
  exports.parse = parse = function(source, options) {
    if (typeof source === 'string') {
      return parser.parse(lexer.tokenize(source, options));
    } else {
      return parser.parse(source);
    }
  };
  parser.yy = require('webscad/nodes');
}).call(this);
