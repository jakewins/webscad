(function() {
  var Assign, Base, BaseValue, Block, BooleanValue, Code, Comment, Conditional, FunctionCall, IDENTIFIER, IDENTIFIER_STR, IS_STRING, Identifier, If, Include, IndexAccess, LEVEL_ACCESS, LEVEL_COND, LEVEL_LIST, LEVEL_OP, LEVEL_PAREN, LEVEL_TOP, Literal, METHOD_DEF, MemberAccess, Module, ModuleCall, NEGATE, NO, NumberValue, Op, Range, RangeValue, Return, SIMPLENUM, StringValue, TAB, THIS, UndefinedValue, Use, Value, VectorValue, YES, compact, del, ends, extend, flatten, last, merge, multident, starts, utility, _ref;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  };
  _ref = require('./helpers'), compact = _ref.compact, flatten = _ref.flatten, extend = _ref.extend, merge = _ref.merge, del = _ref.del, starts = _ref.starts, ends = _ref.ends, last = _ref.last;
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
  exports.Base = Base = (function() {
    function Base() {}
    Base.prototype.makeReturn = function() {
      return new Return(this);
    };
    Base.prototype.contains = function(pred) {
      var contains;
      contains = false;
      this.traverseChildren(false, function(node) {
        if (pred(node)) {
          contains = true;
          return false;
        }
      });
      return contains;
    };
    Base.prototype.containsType = function(type) {
      return this instanceof type || this.contains(function(node) {
        return node instanceof type;
      });
    };
    Base.prototype.lastNonComment = function(list) {
      var i;
      i = list.length;
      while (i--) {
        if (!(list[i] instanceof Comment)) {
          return list[i];
        }
      }
      return null;
    };
    Base.prototype.toString = function(idt, name) {
      var tree;
      if (idt == null) {
        idt = '';
      }
      if (name == null) {
        name = this.constructor.name;
      }
      tree = '\n' + idt + name;
      this.eachChild(function(node) {
        return tree += node.toString(idt + TAB);
      });
      return tree;
    };
    Base.prototype.eachChild = function(func) {
      var attr, child, _i, _j, _len, _len2, _ref2, _ref3;
      if (!this.children) {
        return this;
      }
      _ref2 = this.children;
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        attr = _ref2[_i];
        if (this[attr]) {
          _ref3 = flatten([this[attr]]);
          for (_j = 0, _len2 = _ref3.length; _j < _len2; _j++) {
            child = _ref3[_j];
            if (func(child) === false) {
              return this;
            }
          }
        }
      }
      return this;
    };
    Base.prototype.traverseChildren = function(crossScope, func) {
      return this.eachChild(function(child) {
        if (func(child) === false) {
          return false;
        }
        return child.traverseChildren(crossScope, func);
      });
    };
    Base.prototype.invert = function() {
      return new Op('!', this);
    };
    Base.prototype.unwrapAll = function() {
      var node;
      node = this;
      while (node !== (node = node.unwrap())) {
        continue;
      }
      return node;
    };
    Base.prototype.children = [];
    Base.prototype.isStatement = NO;
    Base.prototype.jumps = NO;
    Base.prototype.isComplex = YES;
    Base.prototype.isChainable = NO;
    Base.prototype.isAssignable = NO;
    Base.prototype.unwrap = THIS;
    Base.prototype.assigns = NO;
    return Base;
  })();
  exports.Block = Block = (function() {
    __extends(Block, Base);
    function Block(nodes) {
      this.statements = compact(flatten(nodes || []));
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
    Block.prototype.jumps = function(o) {
      var st, _i, _len, _ref2;
      _ref2 = this.statements;
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        st = _ref2[_i];
        if (st.jumps(o)) {
          return st;
        }
      }
    };
    Block.wrap = function(nodes) {
      if (nodes.length === 1 && nodes[0] instanceof Block) {
        return nodes[0];
      }
      return new Block(nodes);
    };
    Block.prototype.replaceIncludes = function(load, traverseChildren) {
      var args, loaded, position, statement, _ref2;
      if (traverseChildren == null) {
        traverseChildren = true;
      }
      for (position = 0, _ref2 = this.statements.length; 0 <= _ref2 ? position <= _ref2 : position >= _ref2; 0 <= _ref2 ? position++ : position--) {
        statement = this.statements[position];
        if (statement instanceof Include || statement instanceof Use) {
          loaded = load(statement.path);
          if (statement instanceof Include) {
            loaded = loaded.statements;
          } else {
            loaded = loaded.getModuleDefinitions();
          }
          args = [position, 1].concat(loaded);
          Array.prototype.splice.apply(this.statements, args);
        }
      }
      this.traverseChildren(true, function(node) {
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
    return Block;
  })();
  exports.Literal = Literal = (function() {
    __extends(Literal, Base);
    function Literal(value) {
      this.value = value;
    }
    Literal.prototype.makeReturn = function() {
      if (this.isStatement()) {
        return this;
      } else {
        return new Return(this);
      }
    };
    Literal.prototype.isAssignable = function() {
      return IDENTIFIER.test(this.value);
    };
    Literal.prototype.isStatement = function() {
      var _ref2;
      return (_ref2 = this.value) === 'break' || _ref2 === 'continue' || _ref2 === 'debugger';
    };
    Literal.prototype.isComplex = NO;
    Literal.prototype.assigns = function(name) {
      return name === this.value;
    };
    Literal.prototype.jumps = function(o) {
      if (!this.isStatement()) {
        return false;
      }
      if (!(o && (o.loop || o.block && (this.value !== 'continue')))) {
        return this;
      } else {
        return false;
      }
    };
    Literal.prototype.toString = function() {
      return ' "' + this.value + '"';
    };
    return Literal;
  })();
  exports.Return = Return = (function() {
    __extends(Return, Base);
    function Return(expr) {
      if (expr && !expr.unwrap().isUndefined) {
        this.expression = expr;
      }
    }
    Return.prototype.children = ['expression'];
    Return.prototype.isStatement = YES;
    Return.prototype.makeReturn = THIS;
    Return.prototype.jumps = THIS;
    return Return;
  })();
  exports.Value = Value = (function() {
    __extends(Value, Base);
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
    Value.prototype.isSimpleNumber = function() {
      return this.base instanceof Literal && SIMPLENUM.test(this.base.value);
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
    Value.prototype.assigns = function(name) {
      return !this.properties.length && this.base.assigns(name);
    };
    Value.prototype.jumps = function(o) {
      return !this.properties.length && this.base.jumps(o);
    };
    Value.prototype.isObject = function(onlyGenerated) {
      if (this.properties.length) {
        return false;
      }
      return (this.base instanceof Obj) && (!onlyGenerated || this.base.generated);
    };
    Value.prototype.isSplice = function() {
      return last(this.properties) instanceof Slice;
    };
    Value.prototype.makeReturn = function() {
      if (this.properties.length) {
        return Value.__super__.makeReturn.call(this);
      } else {
        return this.base.makeReturn();
      }
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
    __extends(Identifier, Base);
    function Identifier(name) {
      this.name = name;
    }
    Identifier.prototype.isAssignable = function() {
      return IDENTIFIER.test(this.name);
    };
    Identifier.prototype.assigns = function(name) {
      return name === this.name;
    };
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
    __extends(BaseValue, Base);
    function BaseValue(value) {
      this.value = value;
    }
    BaseValue.prototype.isAssignable = function() {
      return IDENTIFIER.test(this.value);
    };
    BaseValue.prototype.assigns = function(name) {
      return name === this.value;
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
    VectorValue.prototype.assigns = function(name) {
      var obj, _i, _len, _ref2;
      _ref2 = this.objects;
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        obj = _ref2[_i];
        if (obj.assigns(name)) {
          return true;
        }
      }
      return false;
    };
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
    RangeValue.prototype.assigns = function(name) {
      var obj, _i, _len, _ref2;
      _ref2 = [this.from, this.step, this.to];
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        obj = _ref2[_i];
        if (obj.assigns(name)) {
          return true;
        }
      }
      return false;
    };
    return RangeValue;
  })();
  exports.Comment = Comment = (function() {
    __extends(Comment, Base);
    function Comment(comment) {
      this.comment = comment;
    }
    Comment.prototype.isStatement = YES;
    Comment.prototype.makeReturn = THIS;
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
  exports.FunctionCall = FunctionCall = (function() {
    __extends(FunctionCall, Base);
    function FunctionCall(variable, args) {
      this.variable = variable;
      this.args = args != null ? args : [];
    }
    FunctionCall.prototype.children = ['variable', 'args'];
    return FunctionCall;
  })();
  exports.ModuleCall = ModuleCall = (function() {
    __extends(ModuleCall, Base);
    function ModuleCall(name, args, subModules, opts) {
      this.name = name;
      this.args = args != null ? args : [];
      this.subModules = subModules != null ? subModules : [];
      if (opts == null) {
        opts = {};
      }
      this.isRoot = opts.isRoot || false;
      this.isHighlighted = opts.isHighlighted || false;
      this.isInBackground = opts.isInBackground || false;
      this.isIgnored = opts.isIgnored || false;
    }
    ModuleCall.prototype.children = ['name', 'args', 'subModules'];
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
    return ModuleCall;
  })();
  exports.MemberAccess = MemberAccess = (function() {
    __extends(MemberAccess, Base);
    function MemberAccess(objectExpression, memberName) {
      this.objectExpression = objectExpression;
      this.memberName = memberName;
    }
    MemberAccess.prototype.children = ['objectExpression', 'memberName'];
    MemberAccess.prototype.isComplex = NO;
    return MemberAccess;
  })();
  exports.IndexAccess = IndexAccess = (function() {
    __extends(IndexAccess, Base);
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
    __extends(Range, Base);
    Range.prototype.children = ['from', 'to'];
    function Range(from, to, tag) {
      this.from = from;
      this.to = to;
      this.exclusive = tag === 'exclusive';
      this.equals = this.exclusive ? '' : '=';
    }
    return Range;
  })();
  exports.Module = Module = (function() {
    __extends(Module, Base);
    function Module(name, args, body) {
      this.name = name;
      this.args = args;
      this.body = body != null ? body : new Block;
    }
    Module.prototype.children = ['name', 'args', 'body'];
    return Module;
  })();
  exports.Assign = Assign = (function() {
    __extends(Assign, Base);
    function Assign(variable, value, context, options) {
      this.variable = variable;
      this.value = value;
      this.context = context;
      this.param = options && options.param;
    }
    Assign.prototype.children = ['variable', 'value'];
    Assign.prototype.assigns = function(name) {
      return this[this.context === 'object' ? 'value' : 'variable'].assigns(name);
    };
    return Assign;
  })();
  exports.Code = Code = (function() {
    __extends(Code, Base);
    function Code(name, params, expression) {
      this.name = name;
      this.expression = expression;
      this.params = params || [];
    }
    Code.prototype.children = ['name', 'params', 'expression'];
    Code.prototype.isStatement = function() {
      return !!this.ctor;
    };
    Code.prototype.jumps = NO;
    Code.prototype.traverseChildren = function(crossScope, func) {
      if (crossScope) {
        return Code.__super__.traverseChildren.call(this, crossScope, func);
      }
    };
    return Code;
  })();
  exports.Op = Op = (function() {
    __extends(Op, Base);
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
    __extends(Use, Base);
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
    __extends(Include, Base);
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
    __extends(Conditional, Base);
    function Conditional(condition, trueExpression, falseExpression) {
      this.condition = condition;
      this.trueExpression = trueExpression;
      this.falseExpression = falseExpression;
    }
    Conditional.prototype.children = ['condition', 'trueExpression', 'falseExpression'];
    return Conditional;
  })();
  exports.If = If = (function() {
    __extends(If, Base);
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
    If.prototype.isStatement = function(o) {
      var _ref2;
      return (o != null ? o.level : void 0) === LEVEL_TOP || this.bodyNode().isStatement(o) || ((_ref2 = this.elseBodyNode()) != null ? _ref2.isStatement(o) : void 0);
    };
    If.prototype.jumps = function(o) {
      var _ref2;
      return this.body.jumps(o) || ((_ref2 = this.elseBody) != null ? _ref2.jumps(o) : void 0);
    };
    If.prototype.makeReturn = function() {
      this.body && (this.body = new Block([this.body.makeReturn()]));
      this.elseBody && (this.elseBody = new Block([this.elseBody.makeReturn()]));
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
  LEVEL_TOP = 1;
  LEVEL_PAREN = 2;
  LEVEL_LIST = 3;
  LEVEL_COND = 4;
  LEVEL_OP = 5;
  LEVEL_ACCESS = 6;
  TAB = '  ';
  IDENTIFIER_STR = "[$A-Za-z_\\x7f-\\uffff][$\\w\\x7f-\\uffff]*";
  IDENTIFIER = RegExp("^" + IDENTIFIER_STR + "$");
  SIMPLENUM = /^[+-]?\d+$/;
  METHOD_DEF = RegExp("^(?:(" + IDENTIFIER_STR + ")\\.prototype(?:\\.(" + IDENTIFIER_STR + ")|\\[(\"(?:[^\\\\\"\\r\\n]|\\\\.)*\"|'(?:[^\\\\'\\r\\n]|\\\\.)*')\\]|\\[(0x[\\da-fA-F]+|\\d*\\.?\\d+(?:[eE][+-]?\\d+)?)\\]))|(" + IDENTIFIER_STR + ")$");
  IS_STRING = /^['"]/;
  utility = function(name) {
    var ref;
    ref = "__" + name;
    Scope.root.assign(ref, UTILITIES[name]);
    return ref;
  };
  multident = function(code, tab) {
    return code.replace(/\n/g, '$&' + tab);
  };
}).call(this);
