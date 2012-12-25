// Generated by CoffeeScript 1.4.0
(function() {
  var Arguments, Assign, AstNode, BaseValue, Block, BooleanValue, Code, Comment, Conditional, Context, FunctionCall, IS_STRING, Identifier, If, Include, IndexAccess, MemberAccess, Module, ModuleCall, NEGATE, NO, NumberValue, Op, Range, RangeValue, SIMPLENUM, StringValue, TAB, THIS, TreeNode, UndefinedValue, Use, Value, VectorValue, YES, compact, del, ends, extend, flatten, last, merge, starts, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  _ref = require('./helpers'), compact = _ref.compact, flatten = _ref.flatten, extend = _ref.extend, merge = _ref.merge, del = _ref.del, starts = _ref.starts, ends = _ref.ends, last = _ref.last;

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

  exports.AstNode = AstNode = (function(_super) {

    __extends(AstNode, _super);

    function AstNode() {
      return AstNode.__super__.constructor.apply(this, arguments);
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

    AstNode.prototype.evaluate = function() {
      throw new Error(this + " does not yet have an evaluate method :(");
    };

    AstNode.prototype.isStatement = NO;

    AstNode.prototype.isComplex = YES;

    AstNode.prototype.isChainable = NO;

    AstNode.prototype.isAssignable = NO;

    AstNode.prototype.unwrap = THIS;

    return AstNode;

  })(TreeNode);

  exports.Block = Block = (function(_super) {

    __extends(Block, _super);

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
      var position, statement, _i, _ref1,
        _this = this;
      if (traverseChildren == null) {
        traverseChildren = true;
      }
      for (position = _i = 0, _ref1 = this.statements.length; 0 <= _ref1 ? _i <= _ref1 : _i >= _ref1; position = 0 <= _ref1 ? ++_i : --_i) {
        statement = this.statements[position];
        if (statement instanceof Include || statement instanceof Use) {
          load(statement.path, function(loaded) {
            var args;
            if (statement instanceof Include) {
              loaded = loaded.statements;
            } else {
              loaded = loaded.getModuleDefinitions();
            }
            args = [position, 1].concat(loaded);
            return Array.prototype.splice.apply(_this.statements, args);
          });
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
      var children, statement, _i, _len, _ref1;
      children = [];
      _ref1 = this.statements;
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        statement = _ref1[_i];
        if (statement instanceof ModuleCall) {
          children.push(statement);
        } else {
          statement.evaluate(ctx);
        }
      }
      return new ModuleCall({
        name: 'union'
      }, new Arguments, children).evaluate(ctx);
    };

    return Block;

  })(AstNode);

  exports.Value = Value = (function(_super) {

    __extends(Value, _super);

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
      var node, _i, _len, _ref1;
      _ref1 = this.properties.concat(this.base);
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        node = _ref1[_i];
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

  })(AstNode);

  exports.Identifier = Identifier = (function(_super) {

    __extends(Identifier, _super);

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

    Identifier.prototype.evaluate = function(ctx) {
      return ctx.getVar(this.name);
    };

    return Identifier;

  })(AstNode);

  exports.BaseValue = BaseValue = (function(_super) {

    __extends(BaseValue, _super);

    function BaseValue(value) {
      this.value = value;
    }

    BaseValue.prototype.evaluate = function(ctx) {
      return this.value;
    };

    return BaseValue;

  })(AstNode);

  exports.UndefinedValue = UndefinedValue = (function(_super) {

    __extends(UndefinedValue, _super);

    function UndefinedValue() {
      return UndefinedValue.__super__.constructor.apply(this, arguments);
    }

    return UndefinedValue;

  })(BaseValue);

  exports.NumberValue = NumberValue = (function(_super) {

    __extends(NumberValue, _super);

    function NumberValue() {
      return NumberValue.__super__.constructor.apply(this, arguments);
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

  })(BaseValue);

  exports.StringValue = StringValue = (function(_super) {

    __extends(StringValue, _super);

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

  })(BaseValue);

  exports.BooleanValue = BooleanValue = (function(_super) {

    __extends(BooleanValue, _super);

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

  })(BaseValue);

  exports.VectorValue = VectorValue = (function(_super) {

    __extends(VectorValue, _super);

    function VectorValue(objs) {
      this.objects = objs || [];
    }

    VectorValue.prototype.children = ['objects'];

    VectorValue.prototype.evaluate = function(ctx) {
      var obj, _i, _len, _ref1, _results;
      _ref1 = this.objects;
      _results = [];
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        obj = _ref1[_i];
        _results.push(obj.evaluate(ctx));
      }
      return _results;
    };

    return VectorValue;

  })(BaseValue);

  exports.RangeValue = RangeValue = (function(_super) {

    __extends(RangeValue, _super);

    function RangeValue(from, step, to) {
      this.from = from;
      this.step = step;
      this.to = to;
    }

    RangeValue.prototype.children = ['from', 'step', 'to'];

    return RangeValue;

  })(BaseValue);

  exports.Comment = Comment = (function(_super) {

    __extends(Comment, _super);

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

    Comment.prototype.evaluate = function() {};

    return Comment;

  })(AstNode);

  exports.Arguments = Arguments = (function(_super) {

    __extends(Arguments, _super);

    Arguments.prototype.children = ['args'];

    function Arguments(args) {
      var arg, _i, _len, _ref1;
      this.args = args != null ? args : [];
      this.posArgs = [];
      this.keywordArgs = {};
      _ref1 = this.args;
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        arg = _ref1[_i];
        if (arg instanceof Assign) {
          this.keywordArgs[arg.variable.name] = arg.value;
        } else {
          this.posArgs.push(arg);
        }
      }
    }

    Arguments.prototype.evaluate = function(ctx, propNames) {
      var i, propName, val, _i, _ref1, _results;
      _results = [];
      for (i = _i = 0, _ref1 = propNames.length; 0 <= _ref1 ? _i < _ref1 : _i > _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
        propName = propNames[i];
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

  })(AstNode);

  exports.FunctionCall = FunctionCall = (function(_super) {

    __extends(FunctionCall, _super);

    function FunctionCall(name, args) {
      this.name = name;
      this.args = args != null ? args : new Arguments;
      this.name = this.name.name;
    }

    FunctionCall.prototype.children = ['args'];

    return FunctionCall;

  })(AstNode);

  exports.ModuleCall = ModuleCall = (function(_super) {

    __extends(ModuleCall, _super);

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
      var m, modifiers, tree, _i, _len, _ref1;
      if (idt == null) {
        idt = '';
      }
      if (name == null) {
        name = this.constructor.name;
      }
      modifiers = [];
      _ref1 = ['isRoot', 'isHighlighted', 'isInBackground', 'isIgnored'];
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        m = _ref1[_i];
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
      var child, childCalls, module, _ref1;
      ctx = new Context(ctx);
      module = ctx.getModule(this.name);
      this.args.evaluate(ctx, module.params);
      childCalls = (function() {
        var _i, _len, _ref1, _results;
        _ref1 = this.subModules;
        _results = [];
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          child = _ref1[_i];
          _results.push(child.evaluate(ctx));
        }
        return _results;
      }).call(this);
      childCalls = (_ref1 = []).concat.apply(_ref1, childCalls);
      return module(ctx, childCalls);
    };

    return ModuleCall;

  })(AstNode);

  exports.MemberAccess = MemberAccess = (function(_super) {

    __extends(MemberAccess, _super);

    function MemberAccess(objectExpression, memberName) {
      this.objectExpression = objectExpression;
      this.memberName = memberName;
    }

    MemberAccess.prototype.children = ['objectExpression', 'memberName'];

    MemberAccess.prototype.isComplex = NO;

    return MemberAccess;

  })(AstNode);

  exports.IndexAccess = IndexAccess = (function(_super) {

    __extends(IndexAccess, _super);

    function IndexAccess(vectorExpression, indexExpression) {
      this.vectorExpression = vectorExpression;
      this.indexExpression = indexExpression;
    }

    IndexAccess.prototype.children = ['vectorExpression', 'indexExpression'];

    IndexAccess.prototype.isComplex = function() {
      return this.index.isComplex();
    };

    return IndexAccess;

  })(AstNode);

  exports.Range = Range = (function(_super) {

    __extends(Range, _super);

    Range.prototype.children = ['from', 'to'];

    function Range(from, to, tag) {
      this.from = from;
      this.to = to;
      this.exclusive = tag === 'exclusive';
      this.equals = this.exclusive ? '' : '=';
    }

    return Range;

  })(AstNode);

  /* A module in the AST represents the 
  definition of a module, with a name, 
  a declaration of arguments, and a module block, or 
  body.
  */


  exports.Module = Module = (function(_super) {

    __extends(Module, _super);

    function Module(name, params, body) {
      this.name = name;
      this.params = params != null ? params : [];
      this.body = body != null ? body : new Block;
    }

    Module.prototype.children = ['name', 'params', 'body'];

    Module.prototype.evaluate = function(ctx) {
      var body, func, param;
      body = this.body;
      func = function(runtimeCtx, subModules) {
        return body.evaluate(runtimeCtx);
      };
      func.params = (function() {
        var _i, _len, _ref1, _results;
        _ref1 = this.params;
        _results = [];
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          param = _ref1[_i];
          _results.push(param.name);
        }
        return _results;
      }).call(this);
      return ctx.addModule(this.name.name, func);
    };

    return Module;

  })(AstNode);

  exports.Assign = Assign = (function(_super) {

    __extends(Assign, _super);

    function Assign(variable, value, context, options) {
      this.variable = variable;
      this.value = value;
      this.context = context;
      this.param = options && options.param;
    }

    Assign.prototype.children = ['variable', 'value'];

    return Assign;

  })(AstNode);

  exports.Code = Code = (function(_super) {

    __extends(Code, _super);

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

  })(AstNode);

  exports.Op = Op = (function(_super) {

    __extends(Op, _super);

    Op.OPERATORS = {
      '-': {
        applyTo: function(val1, val2) {
          return val1 - val2;
        },
        applyToSingleValue: function(val) {
          return -1 * val;
        }
      },
      '+': function(val1, val2) {
        return val1 + val2;
      },
      '*': function(val1, val2) {
        return val1 * val2;
      },
      '/': function(val1, val2) {
        return val1 / val2;
      },
      '%': function(val1, val2) {
        return val1 % val2;
      },
      '>': function(val1, val2) {
        return val1 > val2;
      },
      '<': function(val1, val2) {
        return val1 < val2;
      },
      '<=': function(val1, val2) {
        return val1 <= val2;
      },
      '>=': function(val1, val2) {
        return val1 >= val2;
      },
      '==': function(val1, val2) {
        return val1 === val2;
      },
      '!=': function(val1, val2) {
        return val1 !== val2;
      },
      '||': function(val1, val2) {
        return val1 || val2;
      },
      '&&': function(val1, val2) {
        return val1 && val2;
      },
      '!': {
        applyTo: function() {
          throw new Error("'!' cannot be applied to a two values, it needs a single value to work on.");
        },
        applyToSingleValue: function(val) {
          return !!val;
        }
      }
    };

    function Op(op, first, second) {
      var operator;
      if (!(Op.OPERATORS[op] != null)) {
        throw new Error("Unknown operator: " + op);
      }
      operator = Op.OPERATORS[op];
      if (operator.applyToSingleValue != null) {
        this._applyToSingleValue = operator.applyToSingleValue;
        this._applyTo = operator.applyTo;
      } else {
        this._applyToSingleValue = function() {
          throw new Error("'" + op + "' cannot be applied to a single value, it needs two values to work.");
        };
        this._applyTo = operator;
      }
      this.first = first;
      this.second = second;
      return this;
    }

    Op.prototype.children = ['first', 'second'];

    Op.prototype.toString = function(idt) {
      return Op.__super__.toString.call(this, idt, this.constructor.name + ' ' + this.operator);
    };

    Op.prototype.evaluate = function(ctx) {
      if (this.second != null) {
        return this._applyTo(this.first.evaluate(ctx), this.second.evaluate(ctx));
      } else {
        return this._applyToSingleValue(this.first.evaluate(ctx));
      }
    };

    return Op;

  })(AstNode);

  exports.Use = Use = (function(_super) {

    __extends(Use, _super);

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

  })(AstNode);

  exports.Include = Include = (function(_super) {

    __extends(Include, _super);

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

  })(AstNode);

  exports.Conditional = Conditional = (function(_super) {

    __extends(Conditional, _super);

    function Conditional(condition, trueExpression, falseExpression) {
      this.condition = condition;
      this.trueExpression = trueExpression;
      this.falseExpression = falseExpression;
    }

    Conditional.prototype.children = ['condition', 'trueExpression', 'falseExpression'];

    return Conditional;

  })(AstNode);

  exports.If = If = (function(_super) {

    __extends(If, _super);

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
      var _ref1;
      return (_ref1 = this.body) != null ? _ref1.unwrap() : void 0;
    };

    If.prototype.elseBodyNode = function() {
      var _ref1;
      return (_ref1 = this.elseBody) != null ? _ref1.unwrap() : void 0;
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

  })(AstNode);

  TAB = '  ';

  SIMPLENUM = /^[+-]?\d+$/;

  IS_STRING = /^['"]/;

}).call(this);