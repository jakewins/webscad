(function() {
  var Parser, alt, alternatives, grammar, name, o, operators, token, tokens, unwrap;
  Parser = require('jison').Parser;
  unwrap = /^function\s*\(\)\s*\{\s*return\s*([\s\S]*);\s*\}/;
  o = function(patternString, action, options) {
    var match;
    patternString = patternString.replace(/\s{2,}/g, ' ');
    if (!action) {
      return [patternString, '$$ = $1;', options];
    }
    action = (match = unwrap.exec(action)) ? match[1] : "(" + action + "())";
    action = action.replace(/\bnew /g, '$&yy.');
    action = action.replace(/\b(?:Block\.wrap|extend)\b/g, 'yy.$&');
    return [patternString, "$$ = " + action + ";", options];
  };
  grammar = {
    Root: [
      o('', function() {
        return new Block;
      }), o('Body'), o('Block'), o('Block TERMINATOR')
    ],
    Block: [
      o('{ }', function() {
        return new Block;
      }), o('{ TERMINATOR }', function() {
        return new Block;
      }), o('{ Body }', function() {
        return $2;
      }), o('{ TERMINATOR Body }', function() {
        return $3;
      })
    ],
    Body: [
      o('Statement', function() {
        return Block.wrap([$1]);
      }), o('Body TERMINATOR Statement', function() {
        return $1.push($3);
      }), o('Body TERMINATOR')
    ],
    Statement: [o('Module'), o('ModuleInvocation'), o('Assign'), o('Code'), o('If'), o('Comment'), o('Include')],
    Expression: [o('Value'), o('Invocation'), o('Operation'), o('Conditional')],
    Identifier: [
      o('IDENTIFIER', function() {
        return new Identifier($1);
      })
    ],
    Assign: [
      o('Assignable = Expression', function() {
        return new Assign($1, $3);
      })
    ],
    Comment: [
      o('COMMENT', function() {
        return new Comment($1);
      })
    ],
    Code: [
      o('FUNCTION Identifier PARAM_START ParamList PARAM_END = Expression', function() {
        return new Code($2, $4, $7);
      })
    ],
    OptComma: [o(''), o(',')],
    ParamList: [
      o('', function() {
        return [];
      }), o('Identifier', function() {
        return [$1];
      }), o('ParamList , Identifier', function() {
        return $1.concat($3);
      })
    ],
    Assignable: [
      o('Identifier'), o('BasicValue IndexAccess', function() {
        return new IndexAccess($1, $2);
      }), o('BasicValue MemberAccess', function() {
        return new MemberAccess($1, $2);
      })
    ],
    BasicValue: [
      o('Assignable'), o('NUMBER', function() {
        return new NumberValue($1);
      }), o('STRING', function() {
        return new StringValue($1);
      }), o('BOOL', function() {
        if ($1 === 'undef') {
          return new UndefinedValue;
        } else {
          return new BooleanValue($1);
        }
      }), o('Range'), o('Vector')
    ],
    Value: [
      o('BasicValue'), o('Invocation IndexAccess', function() {
        return new IndexAccess($1, $2);
      }), o('Invocation MemberAccess', function() {
        return new MemberAccess($1, $2);
      })
    ],
    IndexAccess: [
      o('INDEX_START Expression INDEX_END', function() {
        return $2;
      })
    ],
    MemberAccess: [
      o('.  Identifier', function() {
        return $2;
      })
    ],
    Include: [
      o('INCLUDE', function() {
        return new Include($1);
      }), o('USE', function() {
        return new Use($1);
      })
    ],
    Module: [
      o('MODULE Identifier PARAM_START ParamList PARAM_END Block', function() {
        return new Module($2, $4, $6);
      })
    ],
    ModuleInvocation: [
      o('Identifier Arguments', function() {
        return new ModuleCall($1, $2);
      }), o('! ModuleInvocation', function() {
        return $2.setIsRoot(true);
      }), o('# ModuleInvocation', function() {
        return $2.setIsHighlighted(true);
      }), o('% ModuleInvocation', function() {
        return $2.setIsInBackground(true);
      }), o('* ModuleInvocation', function() {
        return $2.setIsIgnored(true);
      }), o('Identifier Arguments ModuleInvocations', function() {
        return new ModuleCall($1, $2, $3);
      })
    ],
    ModuleInvocations: [
      o('ModuleInvocation', function() {
        return [$1];
      }), o('{ ModuleInvocationList }', function() {
        return $2;
      })
    ],
    ModuleInvocationList: [
      o('', function() {
        return [];
      }), o('ModuleInvocation', function() {
        return [$1];
      }), o('ModuleInvocationList TERMINATOR ModuleInvocation', function() {
        return $1.concat($3);
      }), o('ModuleInvocationList TERMINATOR', function() {
        return $1;
      })
    ],
    Invocation: [
      o('Identifier Arguments', function() {
        return new FunctionCall($1, $2);
      })
    ],
    Arguments: [
      o('CALL_START CALL_END', function() {
        return [];
      }), o('CALL_START ArgList OptComma CALL_END', function() {
        return $2;
      })
    ],
    Vector: [
      o('[ ]', function() {
        return new VectorValue([]);
      }), o('[ ArgList OptComma ]', function() {
        return new VectorValue($2);
      })
    ],
    Range: [
      o('[ Expression : Expression ]', function() {
        return new RangeValue($2, new NumberValue(1), $4);
      }), o('[ Expression : Expression : Expression ]', function() {
        return new RangeValue($2, $4, $6);
      })
    ],
    ArgList: [
      o('Arg', function() {
        return [$1];
      }), o('ArgList , Arg', function() {
        return $1.concat($3);
      }), o('ArgList OptComma TERMINATOR Arg', function() {
        return $1.concat($4);
      })
    ],
    Arg: [o('Expression'), o('Assign')],
    Conditional: [
      o('Expression ? Expression : Expression', function() {
        return new Conditional($1, $3, $5);
      })
    ],
    IfBlock: [
      o('IF ( Expression ) ModuleInvocations', function() {
        return new If($3, $5);
      }), o('IfBlock ELSE IF ( Expression ) ModuleInvocations', function() {
        return $1.addElse(new If($5, $7));
      })
    ],
    If: [
      o('IfBlock'), o('IfBlock ELSE ModuleInvocations', function() {
        return $1.addElse($3);
      })
    ],
    Operation: [
      o('! Expression', function() {
        return new Op('!', $2);
      }), o('- Expression', (function() {
        return new Op('-', $2);
      })), o('+ Expression', (function() {
        return new Op('+', $2);
      })), o('Expression +  Expression', function() {
        return new Op('+', $1, $3);
      }), o('Expression -  Expression', function() {
        return new Op('-', $1, $3);
      }), o('Expression *  Expression', function() {
        return new Op('*', $1, $3);
      }), o('Expression /  Expression', function() {
        return new Op('/', $1, $3);
      }), o('Expression %  Expression', function() {
        return new Op('%', $1, $3);
      }), o('Expression COMPARE  Expression', function() {
        return new Op($2, $1, $3);
      }), o('Expression LOGIC    Expression', function() {
        return new Op($2, $1, $3);
      })
    ]
  };
  operators = [['left', '.'], ['left', 'CALL_START', 'CALL_END'], ['nonassoc', '++', '--'], ['right', '!'], ['left', '*', '/', '%'], ['left', '+', '-'], ['left', 'COMPARE'], ['left', 'LOGIC'], ['left', '?'], ['right', '=', 'COMPOUND_ASSIGN'], ['right', 'IF', 'ELSE', 'MODULE'], ['right', 'POST_IF']];
  tokens = [];
  for (name in grammar) {
    alternatives = grammar[name];
    grammar[name] = (function() {
      var _i, _j, _len, _len2, _ref, _results;
      _results = [];
      for (_i = 0, _len = alternatives.length; _i < _len; _i++) {
        alt = alternatives[_i];
        _ref = alt[0].split(' ');
        for (_j = 0, _len2 = _ref.length; _j < _len2; _j++) {
          token = _ref[_j];
          if (!grammar[token]) {
            tokens.push(token);
          }
        }
        if (name === 'Root') {
          alt[1] = "return " + alt[1];
        }
        _results.push(alt);
      }
      return _results;
    })();
  }
  exports.parser = new Parser({
    tokens: tokens.join(' '),
    bnf: grammar,
    operators: operators.reverse(),
    startSymbol: 'Root'
  });
}).call(this);
