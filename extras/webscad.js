/**
 * WebSCAD
 *
 * Copyright 2011, Jacob Hansson
 * Released under the MIT License
 */
this.WebSCAD = (function() {
  function require(path){ return require[path]; }
  require['./helpers'] = new function() {
  var exports = this;
  (function() {
  var extend, flatten;
  exports.starts = function(string, literal, start) {
    return literal === string.substr(start, literal.length);
  };
  exports.ends = function(string, literal, back) {
    var len;
    len = literal.length;
    return literal === string.substr(string.length - len - (back || 0), len);
  };
  exports.compact = function(array) {
    var item, _i, _len, _results;
    _results = [];
    for (_i = 0, _len = array.length; _i < _len; _i++) {
      item = array[_i];
      if (item) {
        _results.push(item);
      }
    }
    return _results;
  };
  exports.count = function(string, substr) {
    var num, pos;
    num = pos = 0;
    if (!substr.length) {
      return 1 / 0;
    }
    while (pos = 1 + string.indexOf(substr, pos)) {
      num++;
    }
    return num;
  };
  exports.merge = function(options, overrides) {
    return extend(extend({}, options), overrides);
  };
  extend = exports.extend = function(object, properties) {
    var key, val;
    for (key in properties) {
      val = properties[key];
      object[key] = val;
    }
    return object;
  };
  exports.flatten = flatten = function(array) {
    var element, flattened, _i, _len;
    flattened = [];
    for (_i = 0, _len = array.length; _i < _len; _i++) {
      element = array[_i];
      if (element instanceof Array) {
        flattened = flattened.concat(flatten(element));
      } else {
        flattened.push(element);
      }
    }
    return flattened;
  };
  exports.del = function(obj, key) {
    var val;
    val = obj[key];
    delete obj[key];
    return val;
  };
  exports.last = function(array, back) {
    return array[array.length - (back || 0) - 1];
  };
}).call(this);

};require['./lexer'] = new function() {
  var exports = this;
  (function() {
  var ASSIGNED, BOOL, CALLABLE, CODE, COMMENT, COMPARE, IDENTIFIER, INCLUDE_OR_USE, INDEXABLE, KEYWORDS, LINE_CONTINUER, LOGIC, Lexer, MULTILINER, NO_NEWLINE, NUMBER, OPERATOR, SIMPLESTR, TRAILING_SPACES, WHITESPACE, compact, count, last, starts, _ref;
  var __indexOf = Array.prototype.indexOf || function(item) {
    for (var i = 0, l = this.length; i < l; i++) {
      if (this[i] === item) return i;
    }
    return -1;
  };
  _ref = require('./helpers'), count = _ref.count, starts = _ref.starts, compact = _ref.compact, last = _ref.last;
  exports.Lexer = Lexer = (function() {
    function Lexer() {}
    Lexer.prototype.tokenize = function(code, opts) {
      var i;
      if (opts == null) {
        opts = {};
      }
      if (WHITESPACE.test(code)) {
        code = "\n" + code;
      }
      code = code.replace(/\r/g, '').replace(TRAILING_SPACES, '');
      this.code = code;
      this.line = opts.line || 0;
      this.indent = 0;
      this.indebt = 0;
      this.outdebt = 0;
      this.indents = [];
      this.tokens = [];
      i = 0;
      while (this.chunk = code.slice(i)) {
        i += this.useOrIncludeToken() || this.identifierToken() || this.commentToken() || this.whitespaceToken() || this.stringToken() || this.numberToken() || this.literalToken();
      }
      return this.tokens;
    };
    Lexer.prototype.identifierToken = function() {
      var colon, forcedIdentifier, id, input, match, prev, tag, _ref2;
      if (!(match = IDENTIFIER.exec(this.chunk))) {
        return 0;
      }
      input = match[0], id = match[1], colon = match[2];
      forcedIdentifier = colon || (prev = last(this.tokens)) && (((_ref2 = prev[0]) === '.' || _ref2 === '?.' || _ref2 === '::') || !prev.spaced && prev[0] === '@');
      tag = 'IDENTIFIER';
      if (__indexOf.call(KEYWORDS, id) >= 0) {
        tag = id.toUpperCase();
      }
      if (!forcedIdentifier) {
        tag = (function() {
          switch (id) {
            case '==':
            case '!=':
              return 'COMPARE';
            case '&&':
            case '||':
              return 'LOGIC';
            case 'true':
            case 'false':
            case 'null':
            case 'undef':
              return 'BOOL';
            case 'function':
              return 'FUNCTION';
            case 'module':
              return 'MODULE';
            default:
              return tag;
          }
        })();
      }
      this.token(tag, id);
      if (colon) {
        this.token(':', ':');
      }
      return input.length;
    };
    Lexer.prototype.useOrIncludeToken = function() {
      var match, path, type;
      if (!(match = INCLUDE_OR_USE.exec(this.chunk))) {
        return 0;
      }
      type = match[1];
      path = match[2];
      switch (type) {
        case 'include':
          this.token('INCLUDE', path);
          break;
        case 'use':
          this.token('USE', path);
          break;
        default:
          return 0;
      }
      return match[0].length;
    };
    Lexer.prototype.numberToken = function() {
      var match, number;
      if (!(match = NUMBER.exec(this.chunk))) {
        return 0;
      }
      number = match[0];
      this.token('NUMBER', number);
      return number.length;
    };
    Lexer.prototype.stringToken = function() {
      var match, string;
      switch (this.chunk.charAt(0)) {
        case "'":
          if (!(match = SIMPLESTR.exec(this.chunk))) {
            return 0;
          }
          this.token('STRING', (string = match[0]).replace(MULTILINER, '\\\n'));
          break;
        case '"':
          if (!(string = this.balancedString(this.chunk, '"'))) {
            return 0;
          }
          this.token('STRING', this.escapeLines(string));
          break;
        default:
          return 0;
      }
      this.line += count(string, '\n');
      return string.length;
    };
    Lexer.prototype.commentToken = function() {
      var block, comment, match;
      if (!(match = this.chunk.match(COMMENT))) {
        return 0;
      }
      comment = match[0], block = match[1];
      if (block) {
        this.token('COMMENT', this.sanitizeBlockComment(block, {
          blockcomment: true,
          indent: Array(this.indent + 1).join(' ')
        }));
        this.token('TERMINATOR', '\n');
      } else {
        this.token('COMMENT', comment.trim().slice(2).trim());
        this.token('TERMINATOR', '\n');
      }
      this.line += count(comment, '\n');
      return comment.length;
    };
    Lexer.prototype.whitespaceToken = function() {
      var match, nline, prev;
      if (!((match = WHITESPACE.exec(this.chunk)) || (nline = this.chunk.charAt(0) === '\n'))) {
        return 0;
      }
      prev = last(this.tokens);
      if (prev) {
        prev[match ? 'spaced' : 'newLine'] = true;
      }
      if (match) {
        return match[0].length;
      } else {
        return 0;
      }
    };
    Lexer.prototype.terminatorToken = function() {
      if (this.tag() !== 'TERMINATOR' && this.tokens.length > 0) {
        this.token('TERMINATOR', '\n');
      }
      return this;
    };
    Lexer.prototype.literalToken = function() {
      var match, prev, tag, tok, twoTagsBack, value, _ref2, _ref3, _ref4;
      if (match = OPERATOR.exec(this.chunk)) {
        value = match[0];
      } else {
        value = this.chunk.charAt(0);
      }
      tag = value;
      prev = last(this.tokens);
      if (value === '=' && prev) {
        if (!prev[1].reserved && (_ref2 = prev[1], __indexOf.call(KEYWORDS, _ref2) >= 0)) {
          this.assignmentError();
        }
      }
      if (value === ';' || value === '\n') {
        this.terminatorToken();
        return 1;
      } else if (__indexOf.call(COMPARE, value) >= 0) {
        tag = 'COMPARE';
      } else if (__indexOf.call(LOGIC, value) >= 0) {
        tag = 'LOGIC';
      } else if (prev && !prev.spaced) {
        if (value === '(') {
          if (this.tokens.length > 1) {
            twoTagsBack = this.tokens[this.tokens.length - 2][0];
          }
          if (twoTagsBack === 'FUNCTION' || twoTagsBack === 'MODULE') {
            tag = 'PARAM_START';
          } else if (_ref3 = prev[0], __indexOf.call(CALLABLE, _ref3) >= 0) {
            tag = 'CALL_START';
          }
        }
        if (value === ')') {
          tok = this.backtrackToOpeningTokenFor('(', ')');
          if (tok[0] === 'CALL_START') {
            tag = 'CALL_END';
          } else if (tok[0] === 'PARAM_START') {
            tag = 'PARAM_END';
          } else {
            tag = ')';
          }
        } else if (value === '[' && (_ref4 = prev[0], __indexOf.call(INDEXABLE, _ref4) >= 0)) {
          tag = 'INDEX_START';
        } else if (value === ']') {
          tok = this.backtrackToOpeningTokenFor('[', ']');
          if (tok[0] === 'INDEX_START') {
            tag = 'INDEX_END';
          } else {
            tag = ']';
          }
        }
      }
      this.token(tag, value);
      return value.length;
    };
    Lexer.prototype.sanitizeBlockComment = function(doc, options) {
      doc = doc.replace(/(\n\s|^)\*/g, '\n');
      return doc.trim();
    };
    Lexer.prototype.identifierError = function(word) {
      throw SyntaxError("Reserved word \"" + word + "\" on line " + (this.line + 1));
    };
    Lexer.prototype.assignmentError = function() {
      throw SyntaxError("Reserved word \"" + (this.value()) + "\" on line " + (this.line + 1) + " can't be assigned");
    };
    Lexer.prototype.balancedString = function(str, end) {
      var i, letter, prev, stack, _ref2;
      stack = [end];
      for (i = 1, _ref2 = str.length; 1 <= _ref2 ? i < _ref2 : i > _ref2; 1 <= _ref2 ? i++ : i--) {
        switch (letter = str.charAt(i)) {
          case '\\':
            i++;
            continue;
          case end:
            stack.pop();
            if (!stack.length) {
              return str.slice(0, i + 1);
            }
            end = stack[stack.length - 1];
            continue;
        }
        if (end === '}' && (letter === '"' || letter === "'")) {
          stack.push(end = letter);
        } else if (end === '}' && letter === '{') {
          stack.push(end = '}');
        } else if (end === '"' && prev === '#' && letter === '{') {
          stack.push(end = '}');
        }
        prev = letter;
      }
      throw new Error("missing " + (stack.pop()) + ", starting on line " + (this.line + 1));
    };
    Lexer.prototype.token = function(tag, value) {
      return this.tokens.push([tag, value, this.line]);
    };
    Lexer.prototype.tag = function(index, tag) {
      var tok;
      return (tok = last(this.tokens, index)) && (tag ? tok[0] = tag : tok[0]);
    };
    Lexer.prototype.value = function(index, val) {
      var tok;
      return (tok = last(this.tokens, index)) && (val ? tok[1] = val : tok[1]);
    };
    Lexer.prototype.backtrackToOpeningTokenFor = function(openingSign, closingSign) {
      var i, stack, tok;
      stack = [];
      i = this.tokens.length;
      while (tok = this.tokens[--i]) {
        switch (tok[1]) {
          case closingSign:
            stack.push(tok);
            break;
          case openingSign:
            if (stack.length) {
              stack.pop();
            } else {
              return tok;
            }
        }
      }
      return null;
    };
    Lexer.prototype.unfinished = function() {
      var prev, value;
      return LINE_CONTINUER.test(this.chunk) || (prev = last(this.tokens, 1)) && prev[0] !== '.' && (value = this.value()) && !value.reserved && NO_NEWLINE.test(value) && !CODE.test(value) && !ASSIGNED.test(this.chunk);
    };
    Lexer.prototype.escapeLines = function(str, heredoc) {
      return str.replace(MULTILINER, heredoc ? '\\n' : '');
    };
    Lexer.prototype.makeString = function(body, quote, heredoc) {
      if (!body) {
        return quote + quote;
      }
      body = body.replace(/\\([\s\S])/g, function(match, contents) {
        if (contents === '\n' || contents === quote) {
          return contents;
        } else {
          return match;
        }
      });
      body = body.replace(RegExp("" + quote, "g"), '\\$&');
      return quote + this.escapeLines(body, heredoc) + quote;
    };
    return Lexer;
  })();
  KEYWORDS = ['true', 'false', 'undef', 'if', 'else', 'module', 'function'];
  INCLUDE_OR_USE = /^((?:use)|(?:include))\s<([^>]*)>/;
  IDENTIFIER = /^([$A-Za-z_\x7f-\uffff][$\w\x7f-\uffff]*)([^\n\S]*:(?!:))?/;
  NUMBER = /^0x[\da-f]+|^\d*\.?\d+(?:e[+-]?\d+)?/i;
  OPERATOR = /^(?:[-+*\/%<>&|^!?=]=|([-+:])\1|([&|<>])\2=?)/;
  WHITESPACE = /^[^\n\S]+/;
  COMMENT = /^\/\*((?:(?!\*\/)[\n\s\S])*)(?:\*\/[^\n\S]*|(?:\*\/)?$)|^(?:\s*\/\/.*)+/;
  CODE = /^\)\s+=/;
  SIMPLESTR = /^'[^\\']*(?:\\.[^\\']*)*'/;
  MULTILINER = /\n/g;
  ASSIGNED = /^\s*@?([$A-Za-z_][$\w\x7f-\uffff]*|['"].*['"])[^\n\S]*?[:=][^:=>]/;
  LINE_CONTINUER = /^\s*(?:,|\??\.(?![.\d]))/;
  TRAILING_SPACES = /\s+$/;
  NO_NEWLINE = /^(?:[-+*&|\/%=<>!.\\][<>=&|]*|and|or|is(?:nt)?|n(?:ot|ew)|delete|typeof|instanceof)$/;
  LOGIC = ['&&', '||'];
  COMPARE = ['==', '!=', '<', '>', '<=', '>='];
  BOOL = ['TRUE', 'FALSE', 'UNDEF'];
  CALLABLE = ['IDENTIFIER', 'STRING', ')', ']', 'CALL_END', 'INDEX_END'];
  INDEXABLE = CALLABLE.concat('NUMBER', 'BOOL');
}).call(this);

};require['./parser'] = new function() {
  var exports = this;
  /* Jison generated parser */
var parser = (function(){
var parser = {trace: function trace() { },
yy: {},
symbols_: {"error":2,"Root":3,"Body":4,"Block":5,"TERMINATOR":6,"{":7,"}":8,"Statement":9,"Module":10,"ModuleCall":11,"Assign":12,"Code":13,"If":14,"Comment":15,"Include":16,"Expression":17,"Value":18,"FunctionCall":19,"Operation":20,"Conditional":21,"Identifier":22,"IDENTIFIER":23,"Assignable":24,"=":25,"COMMENT":26,"FUNCTION":27,"PARAM_START":28,"ParamList":29,"PARAM_END":30,"OptComma":31,",":32,"BasicValue":33,"IndexAccess":34,"MemberAccess":35,"NUMBER":36,"STRING":37,"BOOL":38,"Range":39,"Vector":40,"INDEX_START":41,"INDEX_END":42,".":43,"INCLUDE":44,"USE":45,"MODULE":46,"Arguments":47,"!":48,"#":49,"%":50,"*":51,"ModuleCalls":52,"ModuleCallList":53,"CALL_START":54,"CALL_END":55,"ArgList":56,"[":57,"]":58,":":59,"Arg":60,"?":61,"IfBlock":62,"IF":63,"(":64,")":65,"ELSE":66,"-":67,"+":68,"/":69,"COMPARE":70,"LOGIC":71,"$accept":0,"$end":1},
terminals_: {2:"error",6:"TERMINATOR",7:"{",8:"}",23:"IDENTIFIER",25:"=",26:"COMMENT",27:"FUNCTION",28:"PARAM_START",30:"PARAM_END",32:",",36:"NUMBER",37:"STRING",38:"BOOL",41:"INDEX_START",42:"INDEX_END",43:".",44:"INCLUDE",45:"USE",46:"MODULE",48:"!",49:"#",50:"%",51:"*",54:"CALL_START",55:"CALL_END",57:"[",58:"]",59:":",61:"?",63:"IF",64:"(",65:")",66:"ELSE",67:"-",68:"+",69:"/",70:"COMPARE",71:"LOGIC"},
productions_: [0,[3,0],[3,1],[3,1],[3,2],[5,2],[5,3],[5,3],[5,4],[4,1],[4,3],[4,2],[9,1],[9,1],[9,1],[9,1],[9,1],[9,1],[9,1],[17,1],[17,1],[17,1],[17,1],[22,1],[12,3],[15,1],[13,7],[31,0],[31,1],[29,0],[29,1],[29,3],[24,1],[24,2],[24,2],[33,1],[33,1],[33,1],[33,1],[33,1],[33,1],[18,1],[18,2],[18,2],[34,3],[35,2],[16,1],[16,1],[10,6],[11,2],[11,2],[11,2],[11,2],[11,2],[11,3],[52,1],[52,3],[53,0],[53,1],[53,3],[53,2],[19,2],[47,2],[47,4],[40,2],[40,4],[39,5],[39,7],[56,1],[56,3],[56,4],[60,1],[60,1],[21,5],[62,5],[62,7],[14,1],[14,3],[20,2],[20,2],[20,2],[20,3],[20,3],[20,3],[20,3],[20,3],[20,3],[20,3]],
performAction: function anonymous(yytext,yyleng,yylineno,yy,yystate,$$,_$) {

var $0 = $$.length - 1;
switch (yystate) {
case 1:return this.$ = new yy.Block;
break;
case 2:return this.$ = $$[$0];
break;
case 3:return this.$ = $$[$0];
break;
case 4:return this.$ = $$[$0-1];
break;
case 5:this.$ = new yy.Block;
break;
case 6:this.$ = new yy.Block;
break;
case 7:this.$ = $$[$0-1];
break;
case 8:this.$ = $$[$0-1];
break;
case 9:this.$ = yy.Block.wrap([$$[$0]]);
break;
case 10:this.$ = $$[$0-2].push($$[$0]);
break;
case 11:this.$ = $$[$0-1];
break;
case 12:this.$ = $$[$0];
break;
case 13:this.$ = $$[$0];
break;
case 14:this.$ = $$[$0];
break;
case 15:this.$ = $$[$0];
break;
case 16:this.$ = $$[$0];
break;
case 17:this.$ = $$[$0];
break;
case 18:this.$ = $$[$0];
break;
case 19:this.$ = $$[$0];
break;
case 20:this.$ = $$[$0];
break;
case 21:this.$ = $$[$0];
break;
case 22:this.$ = $$[$0];
break;
case 23:this.$ = new yy.Identifier($$[$0]);
break;
case 24:this.$ = new yy.Assign($$[$0-2], $$[$0]);
break;
case 25:this.$ = new yy.Comment($$[$0]);
break;
case 26:this.$ = new yy.Code($$[$0-5], $$[$0-3], $$[$0]);
break;
case 27:this.$ = $$[$0];
break;
case 28:this.$ = $$[$0];
break;
case 29:this.$ = [];
break;
case 30:this.$ = [$$[$0]];
break;
case 31:this.$ = $$[$0-2].concat($$[$0]);
break;
case 32:this.$ = $$[$0];
break;
case 33:this.$ = new yy.IndexAccess($$[$0-1], $$[$0]);
break;
case 34:this.$ = new yy.MemberAccess($$[$0-1], $$[$0]);
break;
case 35:this.$ = $$[$0];
break;
case 36:this.$ = new yy.NumberValue($$[$0]);
break;
case 37:this.$ = new yy.StringValue($$[$0]);
break;
case 38:this.$ = (function () {
        if ($$[$0] === 'undef') {
          return new yy.UndefinedValue;
        } else {
          return new yy.BooleanValue($$[$0]);
        }
      }());
break;
case 39:this.$ = $$[$0];
break;
case 40:this.$ = $$[$0];
break;
case 41:this.$ = $$[$0];
break;
case 42:this.$ = new yy.IndexAccess($$[$0-1], $$[$0]);
break;
case 43:this.$ = new yy.MemberAccess($$[$0-1], $$[$0]);
break;
case 44:this.$ = $$[$0-1];
break;
case 45:this.$ = $$[$0];
break;
case 46:this.$ = new yy.Include($$[$0]);
break;
case 47:this.$ = new yy.Use($$[$0]);
break;
case 48:this.$ = new yy.Module($$[$0-4], $$[$0-2], $$[$0]);
break;
case 49:this.$ = new yy.ModuleCall($$[$0-1], $$[$0]);
break;
case 50:this.$ = $$[$0].setIsRoot(true);
break;
case 51:this.$ = $$[$0].setIsHighlighted(true);
break;
case 52:this.$ = $$[$0].setIsInBackground(true);
break;
case 53:this.$ = $$[$0].setIsIgnored(true);
break;
case 54:this.$ = new yy.ModuleCall($$[$0-2], $$[$0-1], $$[$0]);
break;
case 55:this.$ = [$$[$0]];
break;
case 56:this.$ = $$[$0-1];
break;
case 57:this.$ = [];
break;
case 58:this.$ = [$$[$0]];
break;
case 59:this.$ = $$[$0-2].concat($$[$0]);
break;
case 60:this.$ = $$[$0-1];
break;
case 61:this.$ = new yy.FunctionCall($$[$0-1], $$[$0]);
break;
case 62:this.$ = new yy.Arguments;
break;
case 63:this.$ = new yy.Arguments($$[$0-2]);
break;
case 64:this.$ = new yy.VectorValue([]);
break;
case 65:this.$ = new yy.VectorValue($$[$0-2]);
break;
case 66:this.$ = new yy.RangeValue($$[$0-3], new yy.NumberValue(1), $$[$0-1]);
break;
case 67:this.$ = new yy.RangeValue($$[$0-5], $$[$0-3], $$[$0-1]);
break;
case 68:this.$ = [$$[$0]];
break;
case 69:this.$ = $$[$0-2].concat($$[$0]);
break;
case 70:this.$ = $$[$0-3].concat($$[$0]);
break;
case 71:this.$ = $$[$0];
break;
case 72:this.$ = $$[$0];
break;
case 73:this.$ = new yy.Conditional($$[$0-4], $$[$0-2], $$[$0]);
break;
case 74:this.$ = new yy.If($$[$0-2], $$[$0]);
break;
case 75:this.$ = $$[$0-6].addElse(new yy.If($$[$0-2], $$[$0]));
break;
case 76:this.$ = $$[$0];
break;
case 77:this.$ = $$[$0-2].addElse($$[$0]);
break;
case 78:this.$ = new yy.Op('!', $$[$0]);
break;
case 79:this.$ = new yy.Op('-', $$[$0]);
break;
case 80:this.$ = new yy.Op('+', $$[$0]);
break;
case 81:this.$ = new yy.Op('+', $$[$0-2], $$[$0]);
break;
case 82:this.$ = new yy.Op('-', $$[$0-2], $$[$0]);
break;
case 83:this.$ = new yy.Op('*', $$[$0-2], $$[$0]);
break;
case 84:this.$ = new yy.Op('/', $$[$0-2], $$[$0]);
break;
case 85:this.$ = new yy.Op('%', $$[$0-2], $$[$0]);
break;
case 86:this.$ = new yy.Op($$[$0-1], $$[$0-2], $$[$0]);
break;
case 87:this.$ = new yy.Op($$[$0-1], $$[$0-2], $$[$0]);
break;
}
},
table: [{1:[2,1],3:1,4:2,5:3,7:[1,5],9:4,10:6,11:7,12:8,13:9,14:10,15:11,16:12,22:14,23:[1,25],24:19,26:[1,22],27:[1,20],33:26,36:[1,28],37:[1,29],38:[1,30],39:31,40:32,44:[1,23],45:[1,24],46:[1,13],48:[1,15],49:[1,16],50:[1,17],51:[1,18],57:[1,33],62:21,63:[1,27]},{1:[3]},{1:[2,2],6:[1,34]},{1:[2,3],6:[1,35]},{1:[2,9],6:[2,9],8:[2,9]},{4:38,6:[1,37],8:[1,36],9:4,10:6,11:7,12:8,13:9,14:10,15:11,16:12,22:14,23:[1,25],24:19,26:[1,22],27:[1,20],33:26,36:[1,28],37:[1,29],38:[1,30],39:31,40:32,44:[1,23],45:[1,24],46:[1,13],48:[1,15],49:[1,16],50:[1,17],51:[1,18],57:[1,33],62:21,63:[1,27]},{1:[2,12],6:[2,12],8:[2,12]},{1:[2,13],6:[2,13],8:[2,13]},{1:[2,14],6:[2,14],8:[2,14]},{1:[2,15],6:[2,15],8:[2,15]},{1:[2,16],6:[2,16],8:[2,16]},{1:[2,17],6:[2,17],8:[2,17]},{1:[2,18],6:[2,18],8:[2,18]},{22:39,23:[1,25]},{25:[2,32],41:[2,32],43:[2,32],47:40,54:[1,41]},{11:42,22:43,23:[1,25],48:[1,15],49:[1,16],50:[1,17],51:[1,18]},{11:44,22:43,23:[1,25],48:[1,15],49:[1,16],50:[1,17],51:[1,18]},{11:45,22:43,23:[1,25],48:[1,15],49:[1,16],50:[1,17],51:[1,18]},{11:46,22:43,23:[1,25],48:[1,15],49:[1,16],50:[1,17],51:[1,18]},{6:[2,35],25:[1,47],32:[2,35],41:[2,35],43:[2,35],50:[2,35],51:[2,35],55:[2,35],58:[2,35],59:[2,35],61:[2,35],67:[2,35],68:[2,35],69:[2,35],70:[2,35],71:[2,35]},{22:48,23:[1,25]},{1:[2,76],6:[2,76],8:[2,76],66:[1,49]},{1:[2,25],6:[2,25],8:[2,25]},{1:[2,46],6:[2,46],8:[2,46]},{1:[2,47],6:[2,47],8:[2,47]},{1:[2,23],6:[2,23],8:[2,23],25:[2,23],28:[2,23],30:[2,23],32:[2,23],41:[2,23],42:[2,23],43:[2,23],50:[2,23],51:[2,23],54:[2,23],55:[2,23],58:[2,23],59:[2,23],61:[2,23],65:[2,23],67:[2,23],68:[2,23],69:[2,23],70:[2,23],71:[2,23]},{34:50,35:51,41:[1,52],43:[1,53]},{64:[1,54]},{1:[2,36],6:[2,36],8:[2,36],32:[2,36],41:[2,36],42:[2,36],43:[2,36],50:[2,36],51:[2,36],55:[2,36],58:[2,36],59:[2,36],61:[2,36],65:[2,36],67:[2,36],68:[2,36],69:[2,36],70:[2,36],71:[2,36]},{1:[2,37],6:[2,37],8:[2,37],32:[2,37],41:[2,37],42:[2,37],43:[2,37],50:[2,37],51:[2,37],55:[2,37],58:[2,37],59:[2,37],61:[2,37],65:[2,37],67:[2,37],68:[2,37],69:[2,37],70:[2,37],71:[2,37]},{1:[2,38],6:[2,38],8:[2,38],32:[2,38],41:[2,38],42:[2,38],43:[2,38],50:[2,38],51:[2,38],55:[2,38],58:[2,38],59:[2,38],61:[2,38],65:[2,38],67:[2,38],68:[2,38],69:[2,38],70:[2,38],71:[2,38]},{1:[2,39],6:[2,39],8:[2,39],32:[2,39],41:[2,39],42:[2,39],43:[2,39],50:[2,39],51:[2,39],55:[2,39],58:[2,39],59:[2,39],61:[2,39],65:[2,39],67:[2,39],68:[2,39],69:[2,39],70:[2,39],71:[2,39]},{1:[2,40],6:[2,40],8:[2,40],32:[2,40],41:[2,40],42:[2,40],43:[2,40],50:[2,40],51:[2,40],55:[2,40],58:[2,40],59:[2,40],61:[2,40],65:[2,40],67:[2,40],68:[2,40],69:[2,40],70:[2,40],71:[2,40]},{12:68,17:55,18:58,19:59,20:60,21:61,22:64,23:[1,25],24:19,33:63,36:[1,28],37:[1,29],38:[1,30],39:31,40:32,48:[1,65],56:57,57:[1,33],58:[1,56],60:62,67:[1,66],68:[1,67]},{1:[2,11],6:[2,11],8:[2,11],9:69,10:6,11:7,12:8,13:9,14:10,15:11,16:12,22:14,23:[1,25],24:19,26:[1,22],27:[1,20],33:26,36:[1,28],37:[1,29],38:[1,30],39:31,40:32,44:[1,23],45:[1,24],46:[1,13],48:[1,15],49:[1,16],50:[1,17],51:[1,18],57:[1,33],62:21,63:[1,27]},{1:[2,4]},{1:[2,5],6:[2,5],8:[2,5]},{4:71,8:[1,70],9:4,10:6,11:7,12:8,13:9,14:10,15:11,16:12,22:14,23:[1,25],24:19,26:[1,22],27:[1,20],33:26,36:[1,28],37:[1,29],38:[1,30],39:31,40:32,44:[1,23],45:[1,24],46:[1,13],48:[1,15],49:[1,16],50:[1,17],51:[1,18],57:[1,33],62:21,63:[1,27]},{6:[1,34],8:[1,72]},{28:[1,73]},{1:[2,49],6:[2,49],7:[1,76],8:[2,49],11:75,22:43,23:[1,25],48:[1,15],49:[1,16],50:[1,17],51:[1,18],52:74,66:[2,49]},{12:68,17:79,18:58,19:59,20:60,21:61,22:64,23:[1,25],24:19,33:63,36:[1,28],37:[1,29],38:[1,30],39:31,40:32,48:[1,65],55:[1,77],56:78,57:[1,33],60:62,67:[1,66],68:[1,67]},{1:[2,50],6:[2,50],8:[2,50],66:[2,50]},{47:40,54:[1,41]},{1:[2,51],6:[2,51],8:[2,51],66:[2,51]},{1:[2,52],6:[2,52],8:[2,52],66:[2,52]},{1:[2,53],6:[2,53],8:[2,53],66:[2,53]},{17:80,18:58,19:59,20:60,21:61,22:64,23:[1,25],24:81,33:63,36:[1,28],37:[1,29],38:[1,30],39:31,40:32,48:[1,65],57:[1,33],67:[1,66],68:[1,67]},{28:[1,82]},{7:[1,76],11:75,22:43,23:[1,25],48:[1,15],49:[1,16],50:[1,17],51:[1,18],52:83,63:[1,84]},{1:[2,33],6:[2,33],8:[2,33],25:[2,33],32:[2,33],41:[2,33],42:[2,33],43:[2,33],50:[2,33],51:[2,33],55:[2,33],58:[2,33],59:[2,33],61:[2,33],65:[2,33],67:[2,33],68:[2,33],69:[2,33],70:[2,33],71:[2,33]},{1:[2,34],6:[2,34],8:[2,34],25:[2,34],32:[2,34],41:[2,34],42:[2,34],43:[2,34],50:[2,34],51:[2,34],55:[2,34],58:[2,34],59:[2,34],61:[2,34],65:[2,34],67:[2,34],68:[2,34],69:[2,34],70:[2,34],71:[2,34]},{17:85,18:58,19:59,20:60,21:61,22:64,23:[1,25],24:81,33:63,36:[1,28],37:[1,29],38:[1,30],39:31,40:32,48:[1,65],57:[1,33],67:[1,66],68:[1,67]},{22:86,23:[1,25]},{17:87,18:58,19:59,20:60,21:61,22:64,23:[1,25],24:81,33:63,36:[1,28],37:[1,29],38:[1,30],39:31,40:32,48:[1,65],57:[1,33],67:[1,66],68:[1,67]},{6:[2,71],32:[2,71],50:[1,93],51:[1,91],58:[2,71],59:[1,88],61:[1,96],67:[1,90],68:[1,89],69:[1,92],70:[1,94],71:[1,95]},{1:[2,64],6:[2,64],8:[2,64],32:[2,64],41:[2,64],42:[2,64],43:[2,64],50:[2,64],51:[2,64],55:[2,64],58:[2,64],59:[2,64],61:[2,64],65:[2,64],67:[2,64],68:[2,64],69:[2,64],70:[2,64],71:[2,64]},{6:[2,27],31:97,32:[1,98],58:[2,27]},{1:[2,19],6:[2,19],8:[2,19],32:[2,19],42:[2,19],50:[2,19],51:[2,19],55:[2,19],58:[2,19],59:[2,19],61:[2,19],65:[2,19],67:[2,19],68:[2,19],69:[2,19],70:[2,19],71:[2,19]},{1:[2,20],6:[2,20],8:[2,20],32:[2,20],34:99,35:100,41:[1,52],42:[2,20],43:[1,53],50:[2,20],51:[2,20],55:[2,20],58:[2,20],59:[2,20],61:[2,20],65:[2,20],67:[2,20],68:[2,20],69:[2,20],70:[2,20],71:[2,20]},{1:[2,21],6:[2,21],8:[2,21],32:[2,21],42:[2,21],50:[2,21],51:[2,21],55:[2,21],58:[2,21],59:[2,21],61:[2,21],65:[2,21],67:[2,21],68:[2,21],69:[2,21],70:[2,21],71:[2,21]},{1:[2,22],6:[2,22],8:[2,22],32:[2,22],42:[2,22],50:[2,22],51:[2,22],55:[2,22],58:[2,22],59:[2,22],61:[2,22],65:[2,22],67:[2,22],68:[2,22],69:[2,22],70:[2,22],71:[2,22]},{6:[2,68],32:[2,68],55:[2,68],58:[2,68]},{1:[2,41],6:[2,41],8:[2,41],32:[2,41],34:50,35:51,41:[1,52],42:[2,41],43:[1,53],50:[2,41],51:[2,41],55:[2,41],58:[2,41],59:[2,41],61:[2,41],65:[2,41],67:[2,41],68:[2,41],69:[2,41],70:[2,41],71:[2,41]},{1:[2,32],6:[2,32],8:[2,32],25:[2,32],32:[2,32],41:[2,32],42:[2,32],43:[2,32],47:101,50:[2,32],51:[2,32],54:[1,41],55:[2,32],58:[2,32],59:[2,32],61:[2,32],65:[2,32],67:[2,32],68:[2,32],69:[2,32],70:[2,32],71:[2,32]},{17:102,18:58,19:59,20:60,21:61,22:64,23:[1,25],24:81,33:63,36:[1,28],37:[1,29],38:[1,30],39:31,40:32,48:[1,65],57:[1,33],67:[1,66],68:[1,67]},{17:103,18:58,19:59,20:60,21:61,22:64,23:[1,25],24:81,33:63,36:[1,28],37:[1,29],38:[1,30],39:31,40:32,48:[1,65],57:[1,33],67:[1,66],68:[1,67]},{17:104,18:58,19:59,20:60,21:61,22:64,23:[1,25],24:81,33:63,36:[1,28],37:[1,29],38:[1,30],39:31,40:32,48:[1,65],57:[1,33],67:[1,66],68:[1,67]},{6:[2,72],32:[2,72],55:[2,72],58:[2,72]},{1:[2,10],6:[2,10],8:[2,10]},{1:[2,6],6:[2,6],8:[2,6]},{6:[1,34],8:[1,105]},{1:[2,7],6:[2,7],8:[2,7]},{22:107,23:[1,25],29:106,30:[2,29],32:[2,29]},{1:[2,54],6:[2,54],8:[2,54],66:[2,54]},{1:[2,55],6:[2,55],8:[2,55],66:[2,55]},{6:[2,57],8:[2,57],11:109,22:43,23:[1,25],48:[1,15],49:[1,16],50:[1,17],51:[1,18],53:108},{1:[2,62],6:[2,62],7:[2,62],8:[2,62],23:[2,62],32:[2,62],41:[2,62],42:[2,62],43:[2,62],48:[2,62],49:[2,62],50:[2,62],51:[2,62],55:[2,62],58:[2,62],59:[2,62],61:[2,62],65:[2,62],66:[2,62],67:[2,62],68:[2,62],69:[2,62],70:[2,62],71:[2,62]},{6:[2,27],31:110,32:[1,98],55:[2,27]},{6:[2,71],32:[2,71],50:[1,93],51:[1,91],55:[2,71],58:[2,71],61:[1,96],67:[1,90],68:[1,89],69:[1,92],70:[1,94],71:[1,95]},{1:[2,24],6:[2,24],8:[2,24],32:[2,24],50:[1,93],51:[1,91],55:[2,24],58:[2,24],61:[1,96],67:[1,90],68:[1,89],69:[1,92],70:[1,94],71:[1,95]},{1:[2,35],6:[2,35],8:[2,35],32:[2,35],41:[2,35],42:[2,35],43:[2,35],50:[2,35],51:[2,35],55:[2,35],58:[2,35],59:[2,35],61:[2,35],65:[2,35],67:[2,35],68:[2,35],69:[2,35],70:[2,35],71:[2,35]},{22:107,23:[1,25],29:111,30:[2,29],32:[2,29]},{1:[2,77],6:[2,77],8:[2,77]},{64:[1,112]},{42:[1,113],50:[1,93],51:[1,91],61:[1,96],67:[1,90],68:[1,89],69:[1,92],70:[1,94],71:[1,95]},{1:[2,45],6:[2,45],8:[2,45],25:[2,45],32:[2,45],41:[2,45],42:[2,45],43:[2,45],50:[2,45],51:[2,45],55:[2,45],58:[2,45],59:[2,45],61:[2,45],65:[2,45],67:[2,45],68:[2,45],69:[2,45],70:[2,45],71:[2,45]},{50:[1,93],51:[1,91],61:[1,96],65:[1,114],67:[1,90],68:[1,89],69:[1,92],70:[1,94],71:[1,95]},{17:115,18:58,19:59,20:60,21:61,22:64,23:[1,25],24:81,33:63,36:[1,28],37:[1,29],38:[1,30],39:31,40:32,48:[1,65],57:[1,33],67:[1,66],68:[1,67]},{17:116,18:58,19:59,20:60,21:61,22:64,23:[1,25],24:81,33:63,36:[1,28],37:[1,29],38:[1,30],39:31,40:32,48:[1,65],57:[1,33],67:[1,66],68:[1,67]},{17:117,18:58,19:59,20:60,21:61,22:64,23:[1,25],24:81,33:63,36:[1,28],37:[1,29],38:[1,30],39:31,40:32,48:[1,65],57:[1,33],67:[1,66],68:[1,67]},{17:118,18:58,19:59,20:60,21:61,22:64,23:[1,25],24:81,33:63,36:[1,28],37:[1,29],38:[1,30],39:31,40:32,48:[1,65],57:[1,33],67:[1,66],68:[1,67]},{17:119,18:58,19:59,20:60,21:61,22:64,23:[1,25],24:81,33:63,36:[1,28],37:[1,29],38:[1,30],39:31,40:32,48:[1,65],57:[1,33],67:[1,66],68:[1,67]},{17:120,18:58,19:59,20:60,21:61,22:64,23:[1,25],24:81,33:63,36:[1,28],37:[1,29],38:[1,30],39:31,40:32,48:[1,65],57:[1,33],67:[1,66],68:[1,67]},{17:121,18:58,19:59,20:60,21:61,22:64,23:[1,25],24:81,33:63,36:[1,28],37:[1,29],38:[1,30],39:31,40:32,48:[1,65],57:[1,33],67:[1,66],68:[1,67]},{17:122,18:58,19:59,20:60,21:61,22:64,23:[1,25],24:81,33:63,36:[1,28],37:[1,29],38:[1,30],39:31,40:32,48:[1,65],57:[1,33],67:[1,66],68:[1,67]},{17:123,18:58,19:59,20:60,21:61,22:64,23:[1,25],24:81,33:63,36:[1,28],37:[1,29],38:[1,30],39:31,40:32,48:[1,65],57:[1,33],67:[1,66],68:[1,67]},{6:[1,125],58:[1,124]},{6:[2,28],12:68,17:79,18:58,19:59,20:60,21:61,22:64,23:[1,25],24:19,33:63,36:[1,28],37:[1,29],38:[1,30],39:31,40:32,48:[1,65],55:[2,28],57:[1,33],58:[2,28],60:126,67:[1,66],68:[1,67]},{1:[2,42],6:[2,42],8:[2,42],32:[2,42],42:[2,42],50:[2,42],51:[2,42],55:[2,42],58:[2,42],59:[2,42],61:[2,42],65:[2,42],67:[2,42],68:[2,42],69:[2,42],70:[2,42],71:[2,42]},{1:[2,43],6:[2,43],8:[2,43],32:[2,43],42:[2,43],50:[2,43],51:[2,43],55:[2,43],58:[2,43],59:[2,43],61:[2,43],65:[2,43],67:[2,43],68:[2,43],69:[2,43],70:[2,43],71:[2,43]},{1:[2,61],6:[2,61],8:[2,61],32:[2,61],41:[2,61],42:[2,61],43:[2,61],50:[2,61],51:[2,61],55:[2,61],58:[2,61],59:[2,61],61:[2,61],65:[2,61],67:[2,61],68:[2,61],69:[2,61],70:[2,61],71:[2,61]},{1:[2,78],6:[2,78],8:[2,78],32:[2,78],42:[2,78],50:[2,78],51:[2,78],55:[2,78],58:[2,78],59:[2,78],61:[2,78],65:[2,78],67:[2,78],68:[2,78],69:[2,78],70:[2,78],71:[2,78]},{1:[2,79],6:[2,79],8:[2,79],32:[2,79],42:[2,79],50:[1,93],51:[1,91],55:[2,79],58:[2,79],59:[2,79],61:[2,79],65:[2,79],67:[2,79],68:[2,79],69:[1,92],70:[2,79],71:[2,79]},{1:[2,80],6:[2,80],8:[2,80],32:[2,80],42:[2,80],50:[1,93],51:[1,91],55:[2,80],58:[2,80],59:[2,80],61:[2,80],65:[2,80],67:[2,80],68:[2,80],69:[1,92],70:[2,80],71:[2,80]},{1:[2,8],6:[2,8],8:[2,8]},{30:[1,127],32:[1,128]},{30:[2,30],32:[2,30]},{6:[1,130],8:[1,129]},{6:[2,58],8:[2,58]},{6:[1,125],55:[1,131]},{30:[1,132],32:[1,128]},{17:133,18:58,19:59,20:60,21:61,22:64,23:[1,25],24:81,33:63,36:[1,28],37:[1,29],38:[1,30],39:31,40:32,48:[1,65],57:[1,33],67:[1,66],68:[1,67]},{1:[2,44],6:[2,44],8:[2,44],25:[2,44],32:[2,44],41:[2,44],42:[2,44],43:[2,44],50:[2,44],51:[2,44],55:[2,44],58:[2,44],59:[2,44],61:[2,44],65:[2,44],67:[2,44],68:[2,44],69:[2,44],70:[2,44],71:[2,44]},{7:[1,76],11:75,22:43,23:[1,25],48:[1,15],49:[1,16],50:[1,17],51:[1,18],52:134},{50:[1,93],51:[1,91],58:[1,135],59:[1,136],61:[1,96],67:[1,90],68:[1,89],69:[1,92],70:[1,94],71:[1,95]},{1:[2,81],6:[2,81],8:[2,81],32:[2,81],42:[2,81],50:[1,93],51:[1,91],55:[2,81],58:[2,81],59:[2,81],61:[2,81],65:[2,81],67:[2,81],68:[2,81],69:[1,92],70:[2,81],71:[2,81]},{1:[2,82],6:[2,82],8:[2,82],32:[2,82],42:[2,82],50:[1,93],51:[1,91],55:[2,82],58:[2,82],59:[2,82],61:[2,82],65:[2,82],67:[2,82],68:[2,82],69:[1,92],70:[2,82],71:[2,82]},{1:[2,83],6:[2,83],8:[2,83],32:[2,83],42:[2,83],50:[2,83],51:[2,83],55:[2,83],58:[2,83],59:[2,83],61:[2,83],65:[2,83],67:[2,83],68:[2,83],69:[2,83],70:[2,83],71:[2,83]},{1:[2,84],6:[2,84],8:[2,84],32:[2,84],42:[2,84],50:[2,84],51:[2,84],55:[2,84],58:[2,84],59:[2,84],61:[2,84],65:[2,84],67:[2,84],68:[2,84],69:[2,84],70:[2,84],71:[2,84]},{1:[2,85],6:[2,85],8:[2,85],32:[2,85],42:[2,85],50:[2,85],51:[2,85],55:[2,85],58:[2,85],59:[2,85],61:[2,85],65:[2,85],67:[2,85],68:[2,85],69:[2,85],70:[2,85],71:[2,85]},{1:[2,86],6:[2,86],8:[2,86],32:[2,86],42:[2,86],50:[1,93],51:[1,91],55:[2,86],58:[2,86],59:[2,86],61:[2,86],65:[2,86],67:[1,90],68:[1,89],69:[1,92],70:[2,86],71:[2,86]},{1:[2,87],6:[2,87],8:[2,87],32:[2,87],42:[2,87],50:[1,93],51:[1,91],55:[2,87],58:[2,87],59:[2,87],61:[2,87],65:[2,87],67:[1,90],68:[1,89],69:[1,92],70:[1,94],71:[2,87]},{50:[1,93],51:[1,91],59:[1,137],61:[1,96],67:[1,90],68:[1,89],69:[1,92],70:[1,94],71:[1,95]},{1:[2,65],6:[2,65],8:[2,65],32:[2,65],41:[2,65],42:[2,65],43:[2,65],50:[2,65],51:[2,65],55:[2,65],58:[2,65],59:[2,65],61:[2,65],65:[2,65],67:[2,65],68:[2,65],69:[2,65],70:[2,65],71:[2,65]},{12:68,17:79,18:58,19:59,20:60,21:61,22:64,23:[1,25],24:19,33:63,36:[1,28],37:[1,29],38:[1,30],39:31,40:32,48:[1,65],57:[1,33],60:138,67:[1,66],68:[1,67]},{6:[2,69],32:[2,69],55:[2,69],58:[2,69]},{5:139,7:[1,5]},{22:140,23:[1,25]},{1:[2,56],6:[2,56],8:[2,56],66:[2,56]},{6:[2,60],8:[2,60],11:141,22:43,23:[1,25],48:[1,15],49:[1,16],50:[1,17],51:[1,18]},{1:[2,63],6:[2,63],7:[2,63],8:[2,63],23:[2,63],32:[2,63],41:[2,63],42:[2,63],43:[2,63],48:[2,63],49:[2,63],50:[2,63],51:[2,63],55:[2,63],58:[2,63],59:[2,63],61:[2,63],65:[2,63],66:[2,63],67:[2,63],68:[2,63],69:[2,63],70:[2,63],71:[2,63]},{25:[1,142]},{50:[1,93],51:[1,91],61:[1,96],65:[1,143],67:[1,90],68:[1,89],69:[1,92],70:[1,94],71:[1,95]},{1:[2,74],6:[2,74],8:[2,74],66:[2,74]},{1:[2,66],6:[2,66],8:[2,66],32:[2,66],41:[2,66],42:[2,66],43:[2,66],50:[2,66],51:[2,66],55:[2,66],58:[2,66],59:[2,66],61:[2,66],65:[2,66],67:[2,66],68:[2,66],69:[2,66],70:[2,66],71:[2,66]},{17:144,18:58,19:59,20:60,21:61,22:64,23:[1,25],24:81,33:63,36:[1,28],37:[1,29],38:[1,30],39:31,40:32,48:[1,65],57:[1,33],67:[1,66],68:[1,67]},{17:145,18:58,19:59,20:60,21:61,22:64,23:[1,25],24:81,33:63,36:[1,28],37:[1,29],38:[1,30],39:31,40:32,48:[1,65],57:[1,33],67:[1,66],68:[1,67]},{6:[2,70],32:[2,70],55:[2,70],58:[2,70]},{1:[2,48],6:[2,48],8:[2,48]},{30:[2,31],32:[2,31]},{6:[2,59],8:[2,59]},{17:146,18:58,19:59,20:60,21:61,22:64,23:[1,25],24:81,33:63,36:[1,28],37:[1,29],38:[1,30],39:31,40:32,48:[1,65],57:[1,33],67:[1,66],68:[1,67]},{7:[1,76],11:75,22:43,23:[1,25],48:[1,15],49:[1,16],50:[1,17],51:[1,18],52:147},{50:[1,93],51:[1,91],58:[1,148],61:[1,96],67:[1,90],68:[1,89],69:[1,92],70:[1,94],71:[1,95]},{1:[2,73],6:[2,73],8:[2,73],32:[2,73],42:[2,73],50:[1,93],51:[1,91],55:[2,73],58:[2,73],59:[2,73],61:[2,73],65:[2,73],67:[1,90],68:[1,89],69:[1,92],70:[1,94],71:[1,95]},{1:[2,26],6:[2,26],8:[2,26],50:[1,93],51:[1,91],61:[1,96],67:[1,90],68:[1,89],69:[1,92],70:[1,94],71:[1,95]},{1:[2,75],6:[2,75],8:[2,75],66:[2,75]},{1:[2,67],6:[2,67],8:[2,67],32:[2,67],41:[2,67],42:[2,67],43:[2,67],50:[2,67],51:[2,67],55:[2,67],58:[2,67],59:[2,67],61:[2,67],65:[2,67],67:[2,67],68:[2,67],69:[2,67],70:[2,67],71:[2,67]}],
defaultActions: {35:[2,4]},
parseError: function parseError(str, hash) {
    throw new Error(str);
},
parse: function parse(input) {
    var self = this,
        stack = [0],
        vstack = [null], // semantic value stack
        lstack = [], // location stack
        table = this.table,
        yytext = '',
        yylineno = 0,
        yyleng = 0,
        recovering = 0,
        TERROR = 2,
        EOF = 1;

    //this.reductionCount = this.shiftCount = 0;

    this.lexer.setInput(input);
    this.lexer.yy = this.yy;
    this.yy.lexer = this.lexer;
    if (typeof this.lexer.yylloc == 'undefined')
        this.lexer.yylloc = {};
    var yyloc = this.lexer.yylloc;
    lstack.push(yyloc);

    if (typeof this.yy.parseError === 'function')
        this.parseError = this.yy.parseError;

    function popStack (n) {
        stack.length = stack.length - 2*n;
        vstack.length = vstack.length - n;
        lstack.length = lstack.length - n;
    }

    function lex() {
        var token;
        token = self.lexer.lex() || 1; // $end = 1
        // if token isn't its numeric value, convert
        if (typeof token !== 'number') {
            token = self.symbols_[token] || token;
        }
        return token;
    };

    var symbol, preErrorSymbol, state, action, a, r, yyval={},p,len,newState, expected;
    while (true) {
        // retreive state number from top of stack
        state = stack[stack.length-1];

        // use default actions if available
        if (this.defaultActions[state]) {
            action = this.defaultActions[state];
        } else {
            if (symbol == null)
                symbol = lex();
            // read action for current state and first input
            action = table[state] && table[state][symbol];
        }

        // handle parse error
        if (typeof action === 'undefined' || !action.length || !action[0]) {

            if (!recovering) {
                // Report error
                expected = [];
                for (p in table[state]) if (this.terminals_[p] && p > 2) {
                    expected.push("'"+this.terminals_[p]+"'");
                }
                var errStr = '';
                if (this.lexer.showPosition) {
                    errStr = 'Parse error on line '+(yylineno+1)+":\n"+this.lexer.showPosition()+'\nExpecting '+expected.join(', ');
                } else {
                    errStr = 'Parse error on line '+(yylineno+1)+": Unexpected " +
                                  (symbol == 1 /*EOF*/ ? "end of input" :
                                              ("'"+(this.terminals_[symbol] || symbol)+"'"));
                }
                this.parseError(errStr,
                    {text: this.lexer.match, token: this.terminals_[symbol] || symbol, line: this.lexer.yylineno, loc: yyloc, expected: expected});
            }

            // just recovered from another error
            if (recovering == 3) {
                if (symbol == EOF) {
                    throw new Error(errStr || 'Parsing halted.');
                }

                // discard current lookahead and grab another
                yyleng = this.lexer.yyleng;
                yytext = this.lexer.yytext;
                yylineno = this.lexer.yylineno;
                yyloc = this.lexer.yylloc;
                symbol = lex();
            }

            // try to recover from error
            while (1) {
                // check for error recovery rule in this state
                if ((TERROR.toString()) in table[state]) {
                    break;
                }
                if (state == 0) {
                    throw new Error(errStr || 'Parsing halted.');
                }
                popStack(1);
                state = stack[stack.length-1];
            }

            preErrorSymbol = symbol; // save the lookahead token
            symbol = TERROR;         // insert generic error symbol as new lookahead
            state = stack[stack.length-1];
            action = table[state] && table[state][TERROR];
            recovering = 3; // allow 3 real symbols to be shifted before reporting a new error
        }

        // this shouldn't happen, unless resolve defaults are off
        if (action[0] instanceof Array && action.length > 1) {
            throw new Error('Parse Error: multiple actions possible at state: '+state+', token: '+symbol);
        }

        switch (action[0]) {

            case 1: // shift
                //this.shiftCount++;

                stack.push(symbol);
                vstack.push(this.lexer.yytext);
                lstack.push(this.lexer.yylloc);
                stack.push(action[1]); // push state
                symbol = null;
                if (!preErrorSymbol) { // normal execution/no error
                    yyleng = this.lexer.yyleng;
                    yytext = this.lexer.yytext;
                    yylineno = this.lexer.yylineno;
                    yyloc = this.lexer.yylloc;
                    if (recovering > 0)
                        recovering--;
                } else { // error just occurred, resume old lookahead f/ before error
                    symbol = preErrorSymbol;
                    preErrorSymbol = null;
                }
                break;

            case 2: // reduce
                //this.reductionCount++;

                len = this.productions_[action[1]][1];

                // perform semantic action
                yyval.$ = vstack[vstack.length-len]; // default to $$ = $1
                // default location, uses first token for firsts, last for lasts
                yyval._$ = {
                    first_line: lstack[lstack.length-(len||1)].first_line,
                    last_line: lstack[lstack.length-1].last_line,
                    first_column: lstack[lstack.length-(len||1)].first_column,
                    last_column: lstack[lstack.length-1].last_column
                };
                r = this.performAction.call(yyval, yytext, yyleng, yylineno, this.yy, action[1], vstack, lstack);

                if (typeof r !== 'undefined') {
                    return r;
                }

                // pop off stack
                if (len) {
                    stack = stack.slice(0,-1*len*2);
                    vstack = vstack.slice(0, -1*len);
                    lstack = lstack.slice(0, -1*len);
                }

                stack.push(this.productions_[action[1]][0]);    // push nonterminal (reduce)
                vstack.push(yyval.$);
                lstack.push(yyval._$);
                // goto new state = table[STATE][NONTERMINAL]
                newState = table[stack[stack.length-2]][stack[stack.length-1]];
                stack.push(newState);
                break;

            case 3: // accept
                return true;
        }

    }

    return true;
}};
return parser;
})();
if (typeof require !== 'undefined' && typeof exports !== 'undefined') {
exports.parser = parser;
exports.parse = function () { return parser.parse.apply(parser, arguments); }
exports.main = function commonjsMain(args) {
    if (!args[1])
        throw new Error('Usage: '+args[0]+' FILE');
    if (typeof process !== 'undefined') {
        var source = require('fs').readFileSync(require('path').join(process.cwd(), args[1]), "utf8");
    } else {
        var cwd = require("file").path(require("file").cwd());
        var source = cwd.join(args[1]).read({charset: "utf-8"});
    }
    return exports.parser.parse(source);
}
if (typeof module !== 'undefined' && require.main === module) {
  exports.main(typeof process !== 'undefined' ? process.argv.slice(1) : require("system").args);
}
}
};require['./tree'] = new function() {
  var exports = this;
  (function() {
  var TAB, TreeNode, flatten;
  flatten = require('./helpers').flatten;
  TAB = '  ';
  exports.TreeNode = TreeNode = (function() {
    function TreeNode() {}
    TreeNode.prototype.children = [];
    TreeNode.prototype.toStringAttrs = [];
    TreeNode.prototype.contains = function(pred) {
      var contains;
      contains = false;
      this.traverseChildren(function(node) {
        if (pred(node)) {
          contains = true;
          return false;
        }
      });
      return contains;
    };
    TreeNode.prototype.containsType = function(type) {
      return this instanceof type || this.contains(function(node) {
        return node instanceof type;
      });
    };
    TreeNode.prototype.toString = function(idt, name) {
      var a, attr, tree;
      if (idt == null) {
        idt = '';
      }
      if (name == null) {
        name = this.constructor.name;
      }
      tree = '\n' + idt + name;
      if (this.toStringAttrs.length > 0) {
        a = (function() {
          var _i, _len, _ref, _results;
          _ref = this.toStringAttrs;
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            attr = _ref[_i];
            _results.push(this[attr]);
          }
          return _results;
        }).call(this);
        tree += "(" + a.join(',') + ")";
      }
      this.eachChild(function(node) {
        return tree += node.toString(idt + TAB);
      });
      return tree;
    };
    TreeNode.prototype.eachChild = function(func) {
      var attr, child, _i, _j, _len, _len2, _ref, _ref2;
      if (!this.children) {
        return this;
      }
      _ref = this.children;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        attr = _ref[_i];
        if (this[attr]) {
          _ref2 = flatten([this[attr]]);
          for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
            child = _ref2[_j];
            if (func(child) === false) {
              return this;
            }
          }
        }
      }
      return this;
    };
    TreeNode.prototype.traverseChildren = function(func) {
      return this.eachChild(function(child) {
        if (func(child) === false) {
          return false;
        }
        return child.traverseChildren(func);
      });
    };
    return TreeNode;
  })();
}).call(this);

};require['./geometry'] = new function() {
  var exports = this;
  (function() {
  /* Full disclosure:
  My current knowledge level of geometry
  is something like "squares are a type of rectangle".
  I apologize in advance if any of the documentation
  below is rediculously incorrect. This is kind of a 
  learning-by-doing experience.
  */  var DEBUG, Face, Grid, HalfEdge, HalfEdgeDataStructure, NefPolyhedron, Polyhedron, PolyhedronBuilder, Vertex;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  };
  DEBUG = false;
  /* A vertex is a special type of point that
  specifies the beginning or end of a line.
  
  Our vertexes have three defining dimensions (x,y and z).
  */
  exports.Vertex = Vertex = (function() {
    function Vertex(x, y, z) {
      this.x = x;
      this.y = y;
      this.z = z;
    }
    Vertex.prototype.setHalfEdge = function(halfEdge) {
      this.halfEdge = halfEdge;
    };
    return Vertex;
  })();
  /* A face is the area inside a polygon.
  */
  exports.Face = Face = (function() {
    function Face(plane) {
      this.plane = plane;
    }
    Face.prototype.setHalfEdge = function(halfEdge) {
      this.halfEdge = halfEdge;
    };
    return Face;
  })();
  exports.HalfEdge = HalfEdge = (function() {
    function HalfEdge(_face, _vertex) {
      this._face = _face;
      this._vertex = _vertex;
    }
    HalfEdge.prototype.isBorder = function() {
      return this._face != null;
    };
    HalfEdge.prototype.setPrevious = function(_previous) {
      this._previous = _previous;
    };
    HalfEdge.prototype.previous = function() {
      return this._previous;
    };
    HalfEdge.prototype.setNext = function(_next) {
      this._next = _next;
    };
    HalfEdge.prototype.next = function() {
      return this._next;
    };
    HalfEdge.prototype.setFace = function(_face) {
      this._face = _face;
    };
    HalfEdge.prototype.face = function() {
      return this._face;
    };
    HalfEdge.prototype.setVertex = function(_vertex) {
      this._vertex = _vertex;
    };
    HalfEdge.prototype.vertex = function() {
      return this._vertex;
    };
    HalfEdge.prototype.setOpposite = function(_opposite) {
      this._opposite = _opposite;
    };
    HalfEdge.prototype.opposite = function() {
      return this._opposite;
    };
    return HalfEdge;
  })();
  /* Works as a low-level foundation
  for higher level geometric concepts, like
  polyhedrons.
  */
  exports.HalfEdgeDataStructure = HalfEdgeDataStructure = (function() {
    function HalfEdgeDataStructure() {
      this.faces = [];
      this.halfEdges = [];
      this.vertices = [];
    }
    HalfEdgeDataStructure.prototype.addVertex = function(vertex) {
      return this.vertices.push(vertex);
    };
    HalfEdgeDataStructure.prototype.addFace = function(face) {
      return this.faces.push(face);
    };
    HalfEdgeDataStructure.prototype.addHalfEdgePair = function(h, g) {
      h.setOpposite(g);
      g.setOpposite(h);
      this.halfEdges.push(h);
      this.halfEdges.push(g);
      return h;
    };
    return HalfEdgeDataStructure;
  })();
  exports.Polyhedron = Polyhedron = (function() {
    __extends(Polyhedron, HalfEdgeDataStructure);
    function Polyhedron(polygons) {
      Polyhedron.__super__.constructor.call(this);
    }
    Polyhedron.prototype.toString = function() {
      return "";
    };
    return Polyhedron;
  })();
  exports.NefPolyhedron = NefPolyhedron = (function() {
    function NefPolyhedron(polyhedron) {
      this.polyhedron = polyhedron;
    }
    NefPolyhedron.prototype.complement = function() {
      throw new Error("Not implemented");
    };
    NefPolyhedron.prototype.interior = function() {
      throw new Error("Not implemented");
    };
    NefPolyhedron.prototype.closure = function() {
      throw new Error("Not implemented");
    };
    NefPolyhedron.prototype.boundary = function() {
      throw new Error("Not implemented");
    };
    NefPolyhedron.prototype.regularization = function() {
      throw new Error("Not implemented");
    };
    NefPolyhedron.prototype.intersection = function(other) {
      throw new Error("Not implemented");
    };
    NefPolyhedron.prototype.join = function(other) {
      throw new Error("Not implemented");
    };
    NefPolyhedron.prototype.difference = function(other) {
      throw new Error("Not implemented");
    };
    NefPolyhedron.prototype.symmetricDifference = function(other) {
      throw new Error("Not implemented");
    };
    NefPolyhedron.prototype.complement = function(other) {
      throw new Error("Not implemented");
    };
    NefPolyhedron.prototype.transform = function(transformation) {
      throw new Error("Not implemented");
    };
    NefPolyhedron.prototype.changeOrientation = function(full) {
      if (full == null) {
        full = false;
      }
      throw new Error("Not implemented");
    };
    NefPolyhedron.prototype.isScaling = function(transformation) {
      throw new Error("Not implemented");
    };
    NefPolyhedron.prototype.is90DegreeRotation = function(transformation) {
      throw new Error("Not implemented");
    };
    NefPolyhedron.prototype.toString = function() {
      return "";
    };
    return NefPolyhedron;
  })();
  /* A coffeescript port of CGAL's
  Polyhedron_incremental_builder_3.
  */
  exports.PolyhedronBuilder = PolyhedronBuilder = (function() {
    /* Convert a list of polygons
    to a polyhedron.
    */    PolyhedronBuilder.fromPolygons = function(polygons) {
      var builder, faceIsDegenerated, fc, i, point, polygon, v, vertex, vertexIds, vertexes, _i, _j, _k, _l, _len, _len2, _len3, _len4, _len5, _len6, _m, _n;
      vertexes = [];
      vertexIds = new Grid;
      for (_i = 0, _len = polygons.length; _i < _len; _i++) {
        polygon = polygons[_i];
        for (_j = 0, _len2 = polygon.length; _j < _len2; _j++) {
          point = polygon[_j];
          if (!vertexIds.has(point)) {
            vertexIds.set(point, vertexes.length);
            vertexes.push(point);
          }
        }
      }
      builder = new PolyhedronBuilder;
      builder.begin();
      if (DEBUG) {
        console.log("=== CGAL Surface ===");
      }
      i = 0;
      for (_k = 0, _len3 = vertexes.length; _k < _len3; _k++) {
        vertex = vertexes[_k];
        builder.addVertex(vertex);
        if (DEBUG) {
          console.log("" + (i++) + ": ", vertex);
        }
      }
      i = 1;
      for (_l = 0, _len4 = polygons.length; _l < _len4; _l++) {
        polygon = polygons[_l];
        faceIsDegenerated = false;
        fc = {};
        for (_m = 0, _len5 = polygon.length; _m < _len5; _m++) {
          point = polygon[_m];
          v = vertexIds.get(point);
          if (!(fc[v] != null)) {
            fc[v] = 0;
          }
          if (fc[v]++ > 0) {
            faceIsDegenerated = true;
          }
        }
        if (!faceIsDegenerated) {
          builder.beginFace();
        }
        if (DEBUG) {
          console.log("Face " + (i++) + ":");
        }
        for (_n = 0, _len6 = polygon.length; _n < _len6; _n++) {
          point = polygon[_n];
          if (!faceIsDegenerated) {
            if (DEBUG) {
              console.log(" " + (vertexIds.get(point)) + " (", point, ")");
            }
            builder.addVertexToFace(vertexIds.get(point));
          }
        }
        if (!faceIsDegenerated) {
          builder.endFace();
        }
      }
      builder.endFace();
      return builder.getPolygon();
    };
    /* A simple API to create half-edge based
    polyhedrons.
    
    @param (optional) hds - A half-edge data structure, defaults to a new polyhedron instance.
    */
    function PolyhedronBuilder(hds) {
      this.hds = hds != null ? hds : new Polyhedron;
    }
    PolyhedronBuilder.prototype.getPolygon = function() {
      return this.hds;
    };
    PolyhedronBuilder.prototype.begin = function() {
      this.indexToVertexMap = {};
      this.vertexToEdgeMap = {};
      this.newVertices = 0;
      this.newFaces = 0;
      this.newHalfedges = 0;
      return this;
    };
    PolyhedronBuilder.prototype.addVertex = function(point) {
      var vertex, x, y, z;
      x = point[0], y = point[1], z = point[2];
      vertex = new Vertex(x, y, z);
      this.hds.addVertex(vertex);
      this.newVertices++;
      this.indexToVertexMap[this.newVertices] = vertex;
      return this;
    };
    PolyhedronBuilder.prototype.beginFace = function() {
      this.firstVertex = true;
      this.firstHalfedge = true;
      this.lastVertex = false;
      this.currentFace = new Face();
      this.hds.addFace(this.currentFace);
      return this;
    };
    PolyhedronBuilder.prototype.addVertexToFace = function(v2) {
      var b1, b2, first, h2, he, hole, holeHalfEdge, hprime, prev;
      if (this.firstVertex) {
        this.w1 = v2;
        this.firstVertex = false;
        return;
      }
      if (this.firstHalfedge) {
        this.gprime = this.lookupHalfedge(this.w1, v2);
        this.h1 = this.g1 = this.gprime.next();
        this.v1 = this.w2 = v2;
        this.firstHalfedge = false;
        return;
      }
      if (this.lastVertex) {
        hprime = this.gprime;
      } else {
        hprime = this.lookupHalfedge(this.v1, v2);
      }
      h2 = hprime.next();
      prev = this.h1.next();
      this.h1.setNext(h2);
      h2.setPrevious(this.h1);
      if (!(this.vertexToEdgeMap[this.v1] != null)) {
        h2.opposite().setNext(this.h1.opposite());
        this.h1.opposite().setPrevious(h2.opposite());
      } else {
        b1 = this.h1.opposite().isBorder();
        b2 = h2.opposite().isBorder();
        if (b1 && b2) {
          holeHalfEdge = this.lookupHole(this.v1);
          h2.opposite().setNext(holeHalfEdge.next());
          holeHalfEdge.next().setPrevious(h2.opposite());
          holeHalfEdge.setNext(this.h1.opposite());
          this.h1.opposite().setNext(holeHalfEdge);
        } else if (b2) {
          h2.opposite().setNext(prev);
          prev.setPrevious(h2.opposite());
        } else if (b1) {
          hprime.setNext(this.h1.opposite());
          this.h1.opposite().setPrevious(hprime);
        } else if (h2.opposite().next() === this.h1.opposite()) {
          if (this.h1.opposite().face() !== h2.opposite().face()) {
            throw new Error("Incorrect halfedge structure.");
          }
        } else {
          if (prev !== h2) {
            hprime.setNext(prev);
            prev.setPrevious(hprime);
            he = this.h1;
            first = true;
            while (this.h1.next() !== prev && he !== this.h1 && !first) {
              first = false;
              if (he.isBorder()) {
                hole = he;
              }
              he = he.next().opposite();
            }
            if (he === this.h1) {
              if (hole != null) {
                hprime.setNext(hole.next());
                hole.next().setPrevious(hprime);
                hole.setNext(prev);
                prev.setPrevious(hole);
              } else {
                throw new Error("Disconnected facet complexes at vertex " + this.v1);
              }
            }
          }
        }
      }
      if (this.h1.vertex() === this.indexToVertexMap[this.v1]) {
        this.vertexToEdgeMap[this.v1] = this.h1;
      }
      this.h1 = h2;
      this.v1 = v2;
      return this;
    };
    PolyhedronBuilder.prototype.endFace = function() {
      var he;
      this.addVertexToFace(this.w1);
      this.lastVertex = true;
      this.addVertexToFace(this.w2);
      he = this.vertexToEdgeMap[this.w2];
      this.currentFace.setHalfEdge(he);
      this.newFaces++;
      return he;
    };
    PolyhedronBuilder.prototype.end = function() {
      return this;
    };
    PolyhedronBuilder.prototype.lookupHalfedge = function(startVertexId, endVertexId) {
      var endVertex, first, he, startEdge;
      if (this.vertexToEdgeMap[startVertexId] != null) {
        he = this.vertexToEdgeMap[startVertexId];
        if (this.currentFace === he.face()) {
          throw new Error("Face " + this.newFaces + " has self-intersection at vertex " + startVertexId + ".");
        }
        startEdge = he;
        endVertex = this.indexToVertexMap[endVertexId];
        first = true;
        while (startEdge !== he && !first) {
          first = false;
          if (he.next().vertex() === endVertex) {
            if (!he.next().isBorder()) {
              throw new Error("Face " + this.newFaces + " shares a halfedge from vertex " + startVertexId + " with another face.");
            }
            if ((this.currentFace != null) && this.currentFace === he.next().opposite().face()) {
              throw new Error("Face " + this.newFaces + " has a self intersection at the halfedge from vertex " + startVertexId + " to vertex " + endVertexId + ".");
            }
            he.next().setFace(this.currentFace);
            return he;
          }
          he = he.next().opposite();
        }
      }
      he = this.hds.addHalfEdgePair(new HalfEdge(), new HalfEdge());
      this.newHalfedges += 2;
      he.setFace(this.currentFace);
      he.setVertex(this.indexToVertexMap[startVertexId]);
      he.setPrevious(he.opposite());
      he = he.opposite();
      he.setVertex(this.indexToVertexMap[endVertexId]);
      he.setNext(he.opposite());
      return he;
    };
    PolyhedronBuilder.prototype.lookupHole = function(he) {
      var first, startEdge;
      startEdge = he;
      first = true;
      while (he !== startEdge && !first) {
        first = false;
        if (he.next().isBorder()) {
          return he;
        }
        he = he.next().opposite();
      }
      throw new Error("A closed surface already exists, yet facet " + this.newFaces + " is still adjacent.");
    };
    return PolyhedronBuilder;
  })();
  exports.Grid = Grid = (function() {
    function Grid() {
      this.data = [];
    }
    Grid.prototype.set = function(pt, value) {
      var dimension, v, _i, _len, _ref;
      dimension = this.data;
      _ref = pt.slice(0, -1);
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        v = _ref[_i];
        if (!(dimension[v] != null)) {
          dimension[v] = [];
        }
        dimension = dimension[v];
      }
      return dimension[pt[pt.length - 1]] = value;
    };
    Grid.prototype.get = function(pt) {
      var dimension, v, _i, _len;
      dimension = this.data;
      for (_i = 0, _len = pt.length; _i < _len; _i++) {
        v = pt[_i];
        if (!(dimension[v] != null)) {
          return;
        }
        dimension = dimension[v];
      }
      return dimension;
    };
    Grid.prototype.has = function(pt) {
      return this.get(pt) !== void 0;
    };
    return Grid;
  })();
}).call(this);

};require['./csg'] = new function() {
  var exports = this;
  (function() {
  /*
  This file defines node classes
  for the CSG tree. The CSG tree is the
  result of evaluating the AST, and
  describes a set of CSG operations to
  be performed to yield a 3d model.
  */  var CsgNode, Cube, NefPolyhedron, PolyhedronBuilder, TreeNode, Union, _ref;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  };
  TreeNode = require('./tree').TreeNode;
  _ref = require('./geometry'), PolyhedronBuilder = _ref.PolyhedronBuilder, NefPolyhedron = _ref.NefPolyhedron;
  CsgNode = (function() {
    __extends(CsgNode, TreeNode);
    function CsgNode() {
      CsgNode.__super__.constructor.apply(this, arguments);
    }
    return CsgNode;
  })();
  exports.Cube = Cube = (function() {
    __extends(Cube, CsgNode);
    Cube.prototype.toStringAttrs = ['size', 'center'];
    function Cube(size, center) {
      this.size = size;
      this.center = center;
      this.x = this.y = this.z = this.size;
    }
    Cube.prototype.evaluate = function() {
      var polygons, x1, x2, y1, y2, z1, z2;
      if (this.center) {
        x1 = -this.x / 2;
        x2 = +this.x / 2;
        y1 = -this.y / 2;
        y2 = +this.y / 2;
        z1 = -this.z / 2;
        z2 = +this.z / 2;
      } else {
        x1 = y1 = z1 = 0;
        x2 = this.x;
        y2 = this.y;
        z2 = this.z;
      }
      polygons = [[[x1, y1, z2], [x2, y1, z2], [x2, y2, z2], [x1, y2, z2]], [[x1, y2, z1], [x1, y2, z1], [x2, y2, z1], [x2, y1, z1]], [[x1, y1, z1], [x2, y1, z1], [x2, y1, z2], [x1, y1, z2]], [[x2, y1, z1], [x2, y2, z1], [x2, y2, z2], [x2, y1, z2]], [[x2, y2, z1], [x1, y2, z1], [x1, y2, z2], [x2, y2, z2]], [[x1, y2, z1], [x1, y1, z1], [x1, y1, z2], [x1, y2, z2]]];
      return new NefPolyhedron(PolyhedronBuilder.fromPolygons(polygons));
    };
    return Cube;
  })();
  exports.Union = Union = (function() {
    __extends(Union, CsgNode);
    function Union(nodes) {
      this.nodes = nodes;
    }
    Union.prototype.children = ['nodes'];
    Union.prototype.evaluate = function() {
      var first, node, polyhedron, _i, _len, _ref2;
      first = true;
      _ref2 = this.nodes;
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        node = _ref2[_i];
        if (first) {
          first = false;
          polyhedron = node.evaluate();
        } else {
          polyhedron.union(node.evaluate());
        }
      }
      return polyhedron;
    };
    return Union;
  })();
}).call(this);

};require['./ast'] = new function() {
  var exports = this;
  (function() {
  var Arguments, Assign, AstNode, BaseValue, Block, BooleanValue, Code, Comment, Conditional, Context, FunctionCall, IS_STRING, Identifier, If, Include, IndexAccess, MemberAccess, Module, ModuleCall, NEGATE, NO, NumberValue, Op, Range, RangeValue, SIMPLENUM, StringValue, TAB, THIS, TreeNode, UndefinedValue, Use, Value, VectorValue, YES, compact, csg, del, ends, extend, flatten, last, merge, starts, _ref;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  }, __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  _ref = require('./helpers'), compact = _ref.compact, flatten = _ref.flatten, extend = _ref.extend, merge = _ref.merge, del = _ref.del, starts = _ref.starts, ends = _ref.ends, last = _ref.last;
  csg = require('./csg');
  TreeNode = require('./tree').TreeNode;
  exports.extend = extend;
  YES = function() {
    return true;
  };
  NO = function() {
    return false;
  };
  THIS = function() {
    return this;
  };
  NEGATE = function() {
    this.negated = !this.negated;
    return this;
  };
  exports.Context = Context = (function() {
    function Context(parent) {
      this.parent = parent;
      this._modules = {};
      this._functions = {};
      this._vars = {};
    }
    Context.prototype.getModule = function(name) {
      return this._get(name, "_modules", "No module named " + name);
    };
    Context.prototype.getVar = function(name) {
      return this._get(name, "_vars", null, true);
    };
    Context.prototype.getFunction = function(name) {
      return this._get(name, "_functions", "No function named " + name);
    };
    Context.prototype.addVar = function(name, val) {
      return this._vars[name] = val;
    };
    Context.prototype.addFunction = function(name, func) {
      return this._functions[name] = func;
    };
    Context.prototype.addModule = function(name, module) {
      return this._modules[name] = module;
    };
    Context.prototype._get = function(name, attrname, errMsgOrDefault, hasDefault) {
      if (hasDefault == null) {
        hasDefault = false;
      }
      if (this[attrname][name] != null) {
        return this[attrname][name];
      }
      if (this.parent != null) {
        return this.parent._get(name, attrname, errMsgOrDefault, hasDefault);
      }
      if (hasDefault) {
        return errMsgOrDefault;
      }
      throw new Error(errMsgOrDefault);
    };
    return Context;
  })();
  exports.AstNode = AstNode = (function() {
    __extends(AstNode, TreeNode);
    function AstNode() {
      AstNode.__super__.constructor.apply(this, arguments);
    }
    AstNode.prototype.lastNonComment = function(list) {
      var i;
      i = list.length;
      while (i--) {
        if (!(list[i] instanceof Comment)) {
          return list[i];
        }
      }
      return null;
    };
    AstNode.prototype.invert = function() {
      return new Op('!', this);
    };
    AstNode.prototype.unwrapAll = function() {
      var node;
      node = this;
      while (node !== (node = node.unwrap())) {
        continue;
      }
      return node;
    };
    AstNode.prototype.isStatement = NO;
    AstNode.prototype.isComplex = YES;
    AstNode.prototype.isChainable = NO;
    AstNode.prototype.isAssignable = NO;
    AstNode.prototype.unwrap = THIS;
    return AstNode;
  })();
  exports.Block = Block = (function() {
    __extends(Block, AstNode);
    function Block(statements) {
      this.statements = compact(flatten(statements || []));
    }
    Block.prototype.children = ['statements'];
    Block.prototype.push = function(node) {
      this.statements.push(node);
      return this;
    };
    Block.prototype.pop = function() {
      return this.statements.pop();
    };
    Block.prototype.unshift = function(node) {
      this.statements.unshift(node);
      return this;
    };
    Block.prototype.unwrap = function() {
      if (this.statements.length === 1) {
        return this.statements[0];
      } else {
        return this;
      }
    };
    Block.prototype.isEmpty = function() {
      return !this.statements.length;
    };
    Block.prototype.isStatement = function(o) {
      return true;
    };
    Block.wrap = function(nodes) {
      if (nodes.length === 1 && nodes[0] instanceof Block) {
        return nodes[0];
      }
      return new Block(nodes);
    };
    Block.prototype.replaceIncludes = function(load, traverseChildren) {
      var position, statement, _ref2;
      if (traverseChildren == null) {
        traverseChildren = true;
      }
      for (position = 0, _ref2 = this.statements.length; 0 <= _ref2 ? position <= _ref2 : position >= _ref2; 0 <= _ref2 ? position++ : position--) {
        statement = this.statements[position];
        if (statement instanceof Include || statement instanceof Use) {
          load(statement.path, __bind(function(loaded) {
            var args;
            if (statement instanceof Include) {
              loaded = loaded.statements;
            } else {
              loaded = loaded.getModuleDefinitions();
            }
            args = [position, 1].concat(loaded);
            return Array.prototype.splice.apply(this.statements, args);
          }, this));
        }
      }
      this.traverseChildren(function(node) {
        if (node instanceof Block) {
          return node.replaceIncludes(load, false);
        }
      });
      return this;
    };
    Block.prototype.getModuleDefinitions = function() {
      var modules;
      modules = [];
      this.eachChild(function(node) {
        if (node instanceof Module) {
          return modules.push(node);
        }
      });
      return modules;
    };
    Block.prototype.evaluate = function(ctx) {
      var children, statement, _i, _len, _ref2;
      children = [];
      _ref2 = this.statements;
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        statement = _ref2[_i];
        if (statement instanceof ModuleCall) {
          children.push(statement.evaluate(ctx));
        } else {
          statement.evaluate(ctx);
        }
      }
      return new csg.Union(children);
    };
    return Block;
  })();
  exports.Value = Value = (function() {
    __extends(Value, AstNode);
    function Value(base, props, tag) {
      if (!props && base instanceof Value) {
        return base;
      }
      this.base = base;
      this.properties = props || [];
      if (tag) {
        this[tag] = true;
      }
      return this;
    }
    Value.prototype.children = ['base', 'properties'];
    Value.prototype.push = function(prop) {
      this.properties.push(prop);
      return this;
    };
    Value.prototype.hasProperties = function() {
      return !!this.properties.length;
    };
    Value.prototype.isArray = function() {
      return !this.properties.length && this.base instanceof Arr;
    };
    Value.prototype.isComplex = function() {
      return this.hasProperties() || this.base.isComplex();
    };
    Value.prototype.isAssignable = function() {
      return this.hasProperties() || this.base.isAssignable();
    };
    Value.prototype.isAtomic = function() {
      var node, _i, _len, _ref2;
      _ref2 = this.properties.concat(this.base);
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        node = _ref2[_i];
        if (node instanceof Call) {
          return false;
        }
      }
      return true;
    };
    Value.prototype.isStatement = function(o) {
      return !this.properties.length && this.base.isStatement(o);
    };
    Value.prototype.isObject = function(onlyGenerated) {
      if (this.properties.length) {
        return false;
      }
      return (this.base instanceof Obj) && (!onlyGenerated || this.base.generated);
    };
    Value.prototype.unwrap = function() {
      if (this.properties.length) {
        return this;
      } else {
        return this.base;
      }
    };
    return Value;
  })();
  exports.Identifier = Identifier = (function() {
    __extends(Identifier, AstNode);
    function Identifier(name) {
      this.name = name;
    }
    Identifier.prototype.toString = function(idt, name) {
      if (idt == null) {
        idt = '';
      }
      if (name == null) {
        name = this.constructor.name;
      }
      return Identifier.__super__.toString.call(this, idt, name) + ' "' + this.name + '"';
    };
    return Identifier;
  })();
  exports.BaseValue = BaseValue = (function() {
    __extends(BaseValue, AstNode);
    function BaseValue(value) {
      this.value = value;
    }
    BaseValue.prototype.evaluate = function(ctx) {
      return this.value;
    };
    return BaseValue;
  })();
  exports.UndefinedValue = UndefinedValue = (function() {
    __extends(UndefinedValue, BaseValue);
    function UndefinedValue() {
      UndefinedValue.__super__.constructor.apply(this, arguments);
    }
    return UndefinedValue;
  })();
  exports.NumberValue = NumberValue = (function() {
    __extends(NumberValue, BaseValue);
    function NumberValue() {
      NumberValue.__super__.constructor.apply(this, arguments);
    }
    NumberValue.prototype.toString = function(idt, name) {
      if (idt == null) {
        idt = '';
      }
      if (name == null) {
        name = this.constructor.name;
      }
      return NumberValue.__super__.toString.call(this, idt, name) + ' ' + this.value + '';
    };
    return NumberValue;
  })();
  exports.StringValue = StringValue = (function() {
    __extends(StringValue, BaseValue);
    function StringValue(value) {
      this.value = value[{
        1: -1
      }];
    }
    StringValue.prototype.toString = function(idt, name) {
      if (idt == null) {
        idt = '';
      }
      if (name == null) {
        name = this.constructor.name;
      }
      return StringValue.__super__.toString.call(this, idt, name) + ' "' + this.value + '"';
    };
    return StringValue;
  })();
  exports.BooleanValue = BooleanValue = (function() {
    __extends(BooleanValue, BaseValue);
    function BooleanValue(value) {
      this.value = value === true || value === 'true';
    }
    BooleanValue.prototype.toString = function(idt, name) {
      var val;
      if (idt == null) {
        idt = '';
      }
      if (name == null) {
        name = this.constructor.name;
      }
      val = this.value === true ? 'true' : 'false';
      return BooleanValue.__super__.toString.call(this, idt, name) + ' ' + val;
    };
    return BooleanValue;
  })();
  exports.VectorValue = VectorValue = (function() {
    __extends(VectorValue, BaseValue);
    function VectorValue(objs) {
      this.objects = objs || [];
    }
    VectorValue.prototype.children = ['objects'];
    return VectorValue;
  })();
  exports.RangeValue = RangeValue = (function() {
    __extends(RangeValue, BaseValue);
    function RangeValue(from, step, to) {
      this.from = from;
      this.step = step;
      this.to = to;
    }
    RangeValue.prototype.children = ['from', 'step', 'to'];
    return RangeValue;
  })();
  exports.Comment = Comment = (function() {
    __extends(Comment, AstNode);
    function Comment(comment) {
      this.comment = comment;
    }
    Comment.prototype.isStatement = YES;
    Comment.prototype.toString = function(idt, name) {
      if (idt == null) {
        idt = '';
      }
      if (name == null) {
        name = this.constructor.name;
      }
      return '\n' + idt + name + ' "' + this.comment + '"';
    };
    return Comment;
  })();
  exports.Arguments = Arguments = (function() {
    __extends(Arguments, AstNode);
    Arguments.prototype.children = ['args'];
    function Arguments(args) {
      var arg, _i, _len, _ref2;
      this.args = args != null ? args : [];
      this.posArgs = [];
      this.keywordArgs = {};
      _ref2 = this.args;
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        arg = _ref2[_i];
        if (arg instanceof Assign) {
          this.keywordArgs[arg.variable.name] = arg.value;
        } else {
          this.posArgs.push(arg);
        }
      }
    }
    Arguments.prototype.evaluate = function(ctx, propNames) {
      var i, propName, val, _ref2, _results;
      _results = [];
      for (i = 0, _ref2 = propNames.length; 0 <= _ref2 ? i < _ref2 : i > _ref2; 0 <= _ref2 ? i++ : i--) {
        propName = propNames[i].name;
        if (i < this.posArgs.length) {
          val = this.posArgs[i];
        } else {
          if (this.keywordArgs[propName] != null) {
            val = this.keywordArgs[propName];
          } else {
            val = new UndefinedValue;
          }
        }
        _results.push(ctx.addVar(propName, val.evaluate(ctx)));
      }
      return _results;
    };
    return Arguments;
  })();
  exports.FunctionCall = FunctionCall = (function() {
    __extends(FunctionCall, AstNode);
    function FunctionCall(name, args) {
      this.name = name;
      this.args = args != null ? args : new Arguments;
      this.name = this.name.name;
    }
    FunctionCall.prototype.children = ['args'];
    return FunctionCall;
  })();
  exports.ModuleCall = ModuleCall = (function() {
    __extends(ModuleCall, AstNode);
    function ModuleCall(name, args, subModules, opts) {
      this.name = name;
      this.args = args != null ? args : new Arguments;
      this.subModules = subModules != null ? subModules : [];
      if (opts == null) {
        opts = {};
      }
      this.name = this.name ? this.name.name : "";
      this.isRoot = opts.isRoot || false;
      this.isHighlighted = opts.isHighlighted || false;
      this.isInBackground = opts.isInBackground || false;
      this.isIgnored = opts.isIgnored || false;
    }
    ModuleCall.prototype.children = ['args', 'subModules'];
    ModuleCall.prototype.setIsRoot = function(isRoot) {
      this.isRoot = isRoot;
      return this;
    };
    ModuleCall.prototype.setIsHighlighted = function(isHighlighted) {
      this.isHighlighted = isHighlighted;
      return this;
    };
    ModuleCall.prototype.setIsInBackground = function(isInBackground) {
      this.isInBackground = isInBackground;
      return this;
    };
    ModuleCall.prototype.setIsIgnored = function(isIgnored) {
      this.isIgnored = isIgnored;
      return this;
    };
    ModuleCall.prototype.toString = function(idt, name) {
      var m, modifiers, tree, _i, _len, _ref2;
      if (idt == null) {
        idt = '';
      }
      if (name == null) {
        name = this.constructor.name;
      }
      modifiers = [];
      _ref2 = ['isRoot', 'isHighlighted', 'isInBackground', 'isIgnored'];
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        m = _ref2[_i];
        if (this[m]) {
          modifiers.push(m.slice(2));
        }
      }
      modifiers = "(" + (modifiers.join(',')) + ")";
      tree = '\n' + idt + name + modifiers;
      this.eachChild(function(node) {
        return tree += node.toString(idt + TAB);
      });
      return tree;
    };
    ModuleCall.prototype.evaluate = function(ctx) {
      var child, childCalls, module;
      childCalls = (function() {
        var _i, _len, _ref2, _results;
        _ref2 = this.subModules;
        _results = [];
        for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
          child = _ref2[_i];
          _results.push(child.evaluate(ctx));
        }
        return _results;
      }).call(this);
      ctx = new Context(ctx);
      module = ctx.getModule(this.name);
      this.args.evaluate(ctx, module.params);
      return module.evaluate(ctx, childCalls);
    };
    return ModuleCall;
  })();
  exports.MemberAccess = MemberAccess = (function() {
    __extends(MemberAccess, AstNode);
    function MemberAccess(objectExpression, memberName) {
      this.objectExpression = objectExpression;
      this.memberName = memberName;
    }
    MemberAccess.prototype.children = ['objectExpression', 'memberName'];
    MemberAccess.prototype.isComplex = NO;
    return MemberAccess;
  })();
  exports.IndexAccess = IndexAccess = (function() {
    __extends(IndexAccess, AstNode);
    function IndexAccess(vectorExpression, indexExpression) {
      this.vectorExpression = vectorExpression;
      this.indexExpression = indexExpression;
    }
    IndexAccess.prototype.children = ['vectorExpression', 'indexExpression'];
    IndexAccess.prototype.isComplex = function() {
      return this.index.isComplex();
    };
    return IndexAccess;
  })();
  exports.Range = Range = (function() {
    __extends(Range, AstNode);
    Range.prototype.children = ['from', 'to'];
    function Range(from, to, tag) {
      this.from = from;
      this.to = to;
      this.exclusive = tag === 'exclusive';
      this.equals = this.exclusive ? '' : '=';
    }
    return Range;
  })();
  /* A module in the AST represents the 
  definition of a module, with a name, 
  a declaration of arguments, and a module block, or 
  body.
  */
  exports.Module = Module = (function() {
    __extends(Module, AstNode);
    function Module(name, params, body) {
      this.name = name;
      this.params = params != null ? params : [];
      this.body = body != null ? body : new Block;
    }
    Module.prototype.children = ['name', 'params', 'body'];
    return Module;
  })();
  exports.Assign = Assign = (function() {
    __extends(Assign, AstNode);
    function Assign(variable, value, context, options) {
      this.variable = variable;
      this.value = value;
      this.context = context;
      this.param = options && options.param;
    }
    Assign.prototype.children = ['variable', 'value'];
    return Assign;
  })();
  exports.Code = Code = (function() {
    __extends(Code, AstNode);
    function Code(name, params, expression) {
      this.name = name;
      this.expression = expression;
      this.params = params || [];
    }
    Code.prototype.children = ['name', 'params', 'expression'];
    Code.prototype.isStatement = function() {
      return !!this.ctor;
    };
    Code.prototype.traverseChildren = function(crossScope, func) {
      if (crossScope) {
        return Code.__super__.traverseChildren.call(this, crossScope, func);
      }
    };
    return Code;
  })();
  exports.Op = Op = (function() {
    __extends(Op, AstNode);
    function Op(op, first, second, flip) {
      this.operator = op;
      this.first = first;
      this.second = second;
      this.flip = !!flip;
      return this;
    }
    Op.prototype.children = ['first', 'second'];
    Op.prototype.toString = function(idt) {
      return Op.__super__.toString.call(this, idt, this.constructor.name + ' ' + this.operator);
    };
    return Op;
  })();
  exports.Use = Use = (function() {
    __extends(Use, AstNode);
    function Use(path) {
      this.path = path;
    }
    Use.prototype.toString = function(idt, name) {
      if (idt == null) {
        idt = '';
      }
      if (name == null) {
        name = this.constructor.name;
      }
      return Use.__super__.toString.call(this, idt, name) + ' "' + this.path + '"';
    };
    return Use;
  })();
  exports.Include = Include = (function() {
    __extends(Include, AstNode);
    function Include(path) {
      this.path = path;
    }
    Include.prototype.toString = function(idt, name) {
      if (idt == null) {
        idt = '';
      }
      if (name == null) {
        name = this.constructor.name;
      }
      return Include.__super__.toString.call(this, idt, name) + ' "' + this.path + '"';
    };
    return Include;
  })();
  exports.Conditional = Conditional = (function() {
    __extends(Conditional, AstNode);
    function Conditional(condition, trueExpression, falseExpression) {
      this.condition = condition;
      this.trueExpression = trueExpression;
      this.falseExpression = falseExpression;
    }
    Conditional.prototype.children = ['condition', 'trueExpression', 'falseExpression'];
    return Conditional;
  })();
  exports.If = If = (function() {
    __extends(If, AstNode);
    function If(condition, body, options) {
      this.condition = condition;
      this.body = body;
      if (options == null) {
        options = {};
      }
      this.elseBody = null;
      this.isChain = false;
    }
    If.prototype.children = ['condition', 'body', 'elseBody'];
    If.prototype.bodyNode = function() {
      var _ref2;
      return (_ref2 = this.body) != null ? _ref2.unwrap() : void 0;
    };
    If.prototype.elseBodyNode = function() {
      var _ref2;
      return (_ref2 = this.elseBody) != null ? _ref2.unwrap() : void 0;
    };
    If.prototype.addElse = function(elseBody) {
      if (this.isChain) {
        this.elseBodyNode().addElse(elseBody);
      } else {
        this.isChain = elseBody instanceof If;
        this.elseBody = this.ensureBlock(elseBody);
      }
      return this;
    };
    If.prototype.ensureBlock = function(node) {
      if (node instanceof Block) {
        return node;
      } else {
        return new Block([node]);
      }
    };
    return If;
  })();
  TAB = '  ';
  SIMPLENUM = /^[+-]?\d+$/;
  IS_STRING = /^['"]/;
}).call(this);

};require['./builtins'] = new function() {
  var exports = this;
  (function() {
  var CubeModule, UnimplementedModule, ast, csg;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  };
  csg = require('./csg');
  ast = require('./ast');
  exports.UnimplementedModule = UnimplementedModule = (function() {
    __extends(UnimplementedModule, ast.Module);
    function UnimplementedModule(name) {
      this.name = name;
    }
    UnimplementedModule.prototype.evaluate = function() {
      throw "'" + this.name + "' is not implemented.";
    };
    return UnimplementedModule;
  })();
  CubeModule = (function() {
    __extends(CubeModule, ast.Module);
    function CubeModule() {
      CubeModule.__super__.constructor.call(this, 'cube', [new ast.Identifier('size'), new ast.Identifier('center')]);
    }
    CubeModule.prototype.evaluate = function(ctx, submodules) {
      return new csg.Cube(ctx.getVar('size'), ctx.getVar('center'));
    };
    return CubeModule;
  })();
  exports.modules = {
    cube: new CubeModule(),
    cylinder: new UnimplementedModule('cylinder'),
    sphere: new UnimplementedModule('sphere'),
    polyhedron: new UnimplementedModule('polyhedron'),
    square: new UnimplementedModule('square'),
    circle: new UnimplementedModule('circle'),
    polygon: new UnimplementedModule('polygon'),
    union: new UnimplementedModule('union'),
    difference: new UnimplementedModule('difference'),
    intersection: new UnimplementedModule('intersection'),
    render: new UnimplementedModule('render')
  };
  exports.functions = {};
}).call(this);

};require['./scad'] = new function() {
  var exports = this;
  (function() {
  var Lexer, NefPolyhedron, Scad, astNodes, builtin, csgNodes, extend, lexer, parser;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  Lexer = require("./lexer").Lexer;
  parser = require("./parser").parser;
  extend = require("./helpers").extend;
  astNodes = require('./ast');
  csgNodes = require('./csg');
  NefPolyhedron = require('./geometry').NefPolyhedron;
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
    Scad.prototype.evalAst = function(ast) {
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
      Evaluate a CSG tree, yielding the final 3d output
      in the form of a NefPolyhedron object.
      */
    Scad.prototype.evalCsg = function(csgTree) {
      if (typeof csgTree === 'string' || !(csgTree instanceof csgNodes.CsgNode)) {
        csgTree = this.evalAst(csgTree);
      }
      return csgTree.evaluate();
    };
    Scad.prototype.render = function(nefPolyhedron) {
      if (typeof nefPolyhedron === 'string' || !(nefPolyhedron instanceof NefPolyhedron)) {
        return nefPolyhedron = this.evalCsg(nefPolyhedron);
      }
    };
    return Scad;
  })();
}).call(this);

};require['./render'] = new function() {
  var exports = this;
  (function() {
  var Scad, scad;
  Scad = require('./scad').Scad;
  scad = new Scad;
  exports.render = function(text) {
    var nefPoly;
    return nefPoly = scad.evalCsg(text);
  };
}).call(this);

};
  return require['./render']
})();