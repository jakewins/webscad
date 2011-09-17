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
