(function() {
  var ASSIGNED, BOOL, CALLABLE, CODE, COFFEE_ALIASES, COFFEE_ALIAS_MAP, COFFEE_KEYWORDS, COMMENT, COMPARE, HEREDOC, HEREDOC_ILLEGAL, HEREDOC_INDENT, HEREGEX, HEREGEX_OMIT, IDENTIFIER, INDEXABLE, JS_FORBIDDEN, JS_KEYWORDS, LINE_BREAK, LINE_CONTINUER, LOGIC, Lexer, MATH, MULTILINER, MULTI_DENT, NOT_REGEX, NOT_SPACED_REGEX, NO_NEWLINE, NUMBER, OPERATOR, REGEX, RELATION, RESERVED, SHIFT, SIMPLESTR, TRAILING_SPACES, UNARY, WHITESPACE, compact, count, key, last, starts, _ref;
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
        i += this.identifierToken() || this.commentToken() || this.whitespaceToken() || this.lineToken() || this.heredocToken() || this.stringToken() || this.numberToken() || this.literalToken();
      }
      return this.tokens;
    };
    Lexer.prototype.identifierToken = function() {
      var colon, forcedIdentifier, id, input, match, prev, tag, _ref2, _ref3;
      if (!(match = IDENTIFIER.exec(this.chunk))) {
        return 0;
      }
      input = match[0], id = match[1], colon = match[2];
      if (id === 'own' && this.tag() === 'FOR') {
        this.token('OWN', id);
        return id.length;
      }
      forcedIdentifier = colon || (prev = last(this.tokens)) && (((_ref2 = prev[0]) === '.' || _ref2 === '?.' || _ref2 === '::') || !prev.spaced && prev[0] === '@');
      tag = 'IDENTIFIER';
      if (__indexOf.call(JS_KEYWORDS, id) >= 0 || !forcedIdentifier && __indexOf.call(COFFEE_KEYWORDS, id) >= 0) {
        tag = id.toUpperCase();
        if (tag === 'WHEN' && (_ref3 = this.tag(), __indexOf.call(LINE_BREAK, _ref3) >= 0)) {
          tag = 'LEADING_WHEN';
        } else if (tag === 'FOR') {
          this.seenFor = true;
        } else if (tag === 'UNLESS') {
          tag = 'IF';
        } else if (__indexOf.call(UNARY, tag) >= 0) {
          tag = 'UNARY';
        } else if (__indexOf.call(RELATION, tag) >= 0) {
          if (tag !== 'INSTANCEOF' && this.seenFor) {
            tag = 'FOR' + tag;
            this.seenFor = false;
          } else {
            tag = 'RELATION';
            if (this.value() === '!') {
              this.tokens.pop();
              id = '!' + id;
            }
          }
        }
      }
      if (__indexOf.call(JS_FORBIDDEN, id) >= 0) {
        if (forcedIdentifier) {
          tag = 'IDENTIFIER';
          id = new String(id);
          id.reserved = true;
        } else if (__indexOf.call(RESERVED, id) >= 0) {
          this.identifierError(id);
        }
      }
      if (!forcedIdentifier) {
        if (__indexOf.call(COFFEE_ALIASES, id) >= 0) {
          id = COFFEE_ALIAS_MAP[id];
        }
        tag = (function() {
          switch (id) {
            case '!':
              return 'UNARY';
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
          if (0 < string.indexOf('#{', 1)) {
            this.interpolateString(string.slice(1, -1));
          } else {
            this.token('STRING', this.escapeLines(string));
          }
          break;
        default:
          return 0;
      }
      this.line += count(string, '\n');
      return string.length;
    };
    Lexer.prototype.heredocToken = function() {
      var doc, heredoc, match, quote;
      if (!(match = HEREDOC.exec(this.chunk))) {
        return 0;
      }
      heredoc = match[0];
      quote = heredoc.charAt(0);
      doc = this.sanitizeHeredoc(match[2], {
        quote: quote,
        indent: null
      });
      if (quote === '"' && 0 <= doc.indexOf('#{')) {
        this.interpolateString(doc, {
          heredoc: true
        });
      } else {
        this.token('STRING', this.makeString(doc, quote, true));
      }
      this.line += count(heredoc, '\n');
      return heredoc.length;
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
    Lexer.prototype.lineToken = function() {
      var indent, match;
      if (!(match = MULTI_DENT.exec(this.chunk))) {
        return 0;
      }
      indent = match[0];
      return indent.length;
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
    Lexer.prototype.suppressNewlines = function() {
      if (this.value() === '\\') {
        this.tokens.pop();
      }
      return this;
    };
    Lexer.prototype.literalToken = function() {
      var match, prev, tag, tok, twoTagsBack, value, _ref2, _ref3, _ref4;
      if (match = OPERATOR.exec(this.chunk)) {
        value = match[0];
        if (CODE.test(value)) {
          this.tagParameters();
        }
      } else {
        value = this.chunk.charAt(0);
      }
      tag = value;
      prev = last(this.tokens);
      if (value === '=' && prev) {
        if (!prev[1].reserved && (_ref2 = prev[1], __indexOf.call(JS_FORBIDDEN, _ref2) >= 0)) {
          this.assignmentError();
        }
      }
      if (value === ';' || value === '\n') {
        this.terminatorToken();
        return 1;
      } else if (__indexOf.call(MATH, value) >= 0) {
        tag = 'MATH';
      } else if (__indexOf.call(COMPARE, value) >= 0) {
        tag = 'COMPARE';
      } else if (__indexOf.call(UNARY, value) >= 0) {
        tag = 'UNARY';
      } else if (__indexOf.call(SHIFT, value) >= 0) {
        tag = 'SHIFT';
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
    Lexer.prototype.sanitizeBlockComment = function(doc, options) {
      doc = doc.replace(/(\n\s|^)\*/g, '\n');
      return doc.trim();
    };
    Lexer.prototype.tagParameters = function() {
      var i, stack, tok, tokens;
      if (this.tag() !== ')') {
        return this;
      }
      stack = [];
      tokens = this.tokens;
      i = tokens.length;
      tokens[--i][0] = 'PARAM_END';
      while (tok = tokens[--i]) {
        switch (tok[0]) {
          case ')':
            stack.push(tok);
            break;
          case '(':
          case 'CALL_START':
            if (stack.length) {
              stack.pop();
            } else if (tok[0] === '(') {
              tok[0] = 'PARAM_START';
              return this;
            } else {
              return this;
            }
        }
      }
      return this;
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
    Lexer.prototype.interpolateString = function(str, options) {
      var expr, heredoc, i, inner, interpolated, len, letter, nested, pi, regex, tag, tokens, value, _len, _ref2, _ref3, _ref4;
      if (options == null) {
        options = {};
      }
      heredoc = options.heredoc, regex = options.regex;
      tokens = [];
      pi = 0;
      i = -1;
      while (letter = str.charAt(i += 1)) {
        if (letter === '\\') {
          i += 1;
          continue;
        }
        if (!(letter === '#' && str.charAt(i + 1) === '{' && (expr = this.balancedString(str.slice(i + 1), '}')))) {
          continue;
        }
        if (pi < i) {
          tokens.push(['NEOSTRING', str.slice(pi, i)]);
        }
        inner = expr.slice(1, -1);
        if (inner.length) {
          nested = new Lexer().tokenize(inner, {
            line: this.line,
            rewrite: false
          });
          nested.pop();
          if (((_ref2 = nested[0]) != null ? _ref2[0] : void 0) === 'TERMINATOR') {
            nested.shift();
          }
          if (len = nested.length) {
            if (len > 1) {
              nested.unshift(['(', '(']);
              nested.push([')', ')']);
            }
            tokens.push(['TOKENS', nested]);
          }
        }
        i += expr.length;
        pi = i + 1;
      }
      if ((i > pi && pi < str.length)) {
        tokens.push(['NEOSTRING', str.slice(pi)]);
      }
      if (regex) {
        return tokens;
      }
      if (!tokens.length) {
        return this.token('STRING', '""');
      }
      if (tokens[0][0] !== 'NEOSTRING') {
        tokens.unshift(['', '']);
      }
      if (interpolated = tokens.length > 1) {
        this.token('(', '(');
      }
      for (i = 0, _len = tokens.length; i < _len; i++) {
        _ref3 = tokens[i], tag = _ref3[0], value = _ref3[1];
        if (i) {
          this.token('+', '+');
        }
        if (tag === 'TOKENS') {
          (_ref4 = this.tokens).push.apply(_ref4, value);
        } else {
          this.token('STRING', this.makeString(value, '"', heredoc));
        }
      }
      if (interpolated) {
        this.token(')', ')');
      }
      return tokens;
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
  JS_KEYWORDS = ['true', 'false', 'null', 'this', 'new', 'delete', 'typeof', 'in', 'instanceof', 'return', 'throw', 'break', 'continue', 'debugger', 'if', 'else', 'switch', 'for', 'while', 'do', 'try', 'catch', 'finally', 'class', 'extends', 'super'];
  COFFEE_KEYWORDS = ['undef'];
  COFFEE_ALIAS_MAP = {
    and: '&&',
    or: '||',
    is: '==',
    isnt: '!=',
    not: '!',
    yes: 'true',
    no: 'false',
    on: 'true',
    off: 'false'
  };
  COFFEE_ALIASES = (function() {
    var _results;
    _results = [];
    for (key in COFFEE_ALIAS_MAP) {
      _results.push(key);
    }
    return _results;
  })();
  COFFEE_KEYWORDS = COFFEE_KEYWORDS.concat(COFFEE_ALIASES);
  RESERVED = [];
  JS_FORBIDDEN = JS_KEYWORDS.concat(RESERVED);
  exports.RESERVED = RESERVED.concat(JS_KEYWORDS).concat(COFFEE_KEYWORDS);
  IDENTIFIER = /^([$A-Za-z_\x7f-\uffff][$\w\x7f-\uffff]*)([^\n\S]*:(?!:))?/;
  NUMBER = /^0x[\da-f]+|^\d*\.?\d+(?:e[+-]?\d+)?/i;
  HEREDOC = /^("""|''')([\s\S]*?)(?:\n[^\n\S]*)?\1/;
  OPERATOR = /^(?:[-=]>|[-+*\/%<>&|^!?=]=|>>>=?|([-+:])\1|([&|<>])\2=?|\?\.|\.{2,3})/;
  WHITESPACE = /^[^\n\S]+/;
  COMMENT = /^\/\*((?:(?!\*\/)[\n\s\S])*)(?:\*\/[^\n\S]*|(?:\*\/)?$)|^(?:\s*\/\/.*)+/;
  CODE = /^\)\s+=/;
  MULTI_DENT = /^(?:\n[^\n\S]*)+/;
  SIMPLESTR = /^'[^\\']*(?:\\.[^\\']*)*'/;
  REGEX = /^\/(?![\s=])[^[\/\n\\]*(?:(?:\\[\s\S]|\[[^\]\n\\]*(?:\\[\s\S][^\]\n\\]*)*])[^[\/\n\\]*)*\/[imgy]{0,4}(?!\w)/;
  HEREGEX = /^\/{3}([\s\S]+?)\/{3}([imgy]{0,4})(?!\w)/;
  HEREGEX_OMIT = /\s+(?:#.*)?/g;
  MULTILINER = /\n/g;
  HEREDOC_INDENT = /\n+([^\n\S]*)/g;
  HEREDOC_ILLEGAL = /\*\//;
  ASSIGNED = /^\s*@?([$A-Za-z_][$\w\x7f-\uffff]*|['"].*['"])[^\n\S]*?[:=][^:=>]/;
  LINE_CONTINUER = /^\s*(?:,|\??\.(?![.\d])|::)/;
  TRAILING_SPACES = /\s+$/;
  NO_NEWLINE = /^(?:[-+*&|\/%=<>!.\\][<>=&|]*|and|or|is(?:nt)?|n(?:ot|ew)|delete|typeof|instanceof)$/;
  UNARY = ['!', '~', 'NEW', 'TYPEOF', 'DELETE', 'DO'];
  LOGIC = ['&&', '||', '&', '|', '^'];
  SHIFT = ['<<', '>>', '>>>'];
  COMPARE = ['==', '!=', '<', '>', '<=', '>='];
  MATH = ['*', '/', '%'];
  RELATION = ['IN', 'OF', 'INSTANCEOF'];
  BOOL = ['TRUE', 'FALSE', 'NULL', 'UNDEF'];
  NOT_REGEX = ['NUMBER', 'REGEX', 'BOOL', '++', '--', ']'];
  NOT_SPACED_REGEX = NOT_REGEX.concat(')', '}', 'THIS', 'IDENTIFIER', 'STRING');
  CALLABLE = ['IDENTIFIER', 'STRING', 'REGEX', ')', ']', '}', '?', '::', '@', 'THIS', 'SUPER', 'CALL_END', 'INDEX_END'];
  INDEXABLE = CALLABLE.concat('NUMBER', 'BOOL');
  LINE_BREAK = ['INDENT', 'OUTDENT', 'TERMINATOR'];
}).call(this);
