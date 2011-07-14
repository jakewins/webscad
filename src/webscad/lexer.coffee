# The CoffeeScript Lexer. Uses a series of token-matching regexes to attempt
# matches against the beginning of the source code. When a match is found,
# a token is produced, we consume the match, and start again. Tokens are in the
# form:
#
#     [tag, value, lineNumber]
#
# Which is a format that can be fed directly into [Jison](http://github.com/zaach/jison).

# Import the helpers we need.
{count, starts, compact, last} = require './helpers'

# The Lexer Class
# ---------------

# The Lexer class reads a stream of CoffeeScript and divvies it up into tagged
# tokens. Some potential ambiguity in the grammar has been avoided by
# pushing some extra smarts into the Lexer.
exports.Lexer = class Lexer

  # **tokenize** is the Lexer's main method. Scan by attempting to match tokens
  # one at a time, using a regular expression anchored at the start of the
  # remaining code, or a custom recursive token-matching method
  # (for interpolations). When the next token has been recorded, we move forward
  # within the code past the token, and begin again.
  #
  # Each tokenizing method is responsible for returning the number of characters
  # it has consumed.
  #
  # Before returning the token stream, run it through the [Rewriter](rewriter.html)
  # unless explicitly asked not to.
  tokenize: (code, opts = {}) ->
    code     = "\n#{code}" if WHITESPACE.test code
    code     = code.replace(/\r/g, '').replace TRAILING_SPACES, ''

    @code    = code           # The remainder of the source code.
    @line    = opts.line or 0 # The current line.
    @indent  = 0              # The current indentation level.
    @indebt  = 0              # The over-indentation at the current level.
    @outdebt = 0              # The under-outdentation at the current level.
    @indents = []             # The stack of all current indentation levels.
    @tokens  = []             # Stream of parsed tokens in the form `['TYPE', value, line]`.

    # At every position, run through this list of attempted matches,
    # short-circuiting if any of them succeed. Their order determines precedence:
    # `@literalToken` is the fallback catch-all.
    i = 0
    while @chunk = code.slice i
      i += @identifierToken() or
           @commentToken()    or
           @whitespaceToken() or
           @lineToken()       or
           @heredocToken()    or
           @stringToken()     or
           @numberToken()     or
           @literalToken()

    return @tokens

  # Tokenizers
  # ----------

  # Matches identifying literals: variables, keywords, method names, etc.
  # Check to ensure that JavaScript reserved words aren't being used as
  # identifiers. Because CoffeeScript reserves a handful of keywords that are
  # allowed in JavaScript, we're careful not to tag them as keywords when
  # referenced as property names here, so you can still do `jQuery.is()` even
  # though `is` means `===` otherwise.
  identifierToken: ->
    return 0 unless match = IDENTIFIER.exec @chunk
    [input, id, colon] = match

    if id is 'own' and @tag() is 'FOR'
      @token 'OWN', id
      return id.length
    forcedIdentifier = colon or
      (prev = last @tokens) and (prev[0] in ['.', '?.', '::'] or
      not prev.spaced and prev[0] is '@')
    tag = 'IDENTIFIER'

    if id in JS_KEYWORDS or
       not forcedIdentifier and id in COFFEE_KEYWORDS
      tag = id.toUpperCase()
      if tag is 'WHEN' and @tag() in LINE_BREAK
        tag = 'LEADING_WHEN'
      else if tag is 'FOR'
        @seenFor = yes
      else if tag is 'UNLESS'
        tag = 'IF'
      else if tag in UNARY
        tag = 'UNARY'
      else if tag in RELATION
        if tag isnt 'INSTANCEOF' and @seenFor
          tag = 'FOR' + tag
          @seenFor = no
        else
          tag = 'RELATION'
          if @value() is '!'
            @tokens.pop()
            id = '!' + id

    if id in JS_FORBIDDEN
      if forcedIdentifier
        tag = 'IDENTIFIER'
        id  = new String id
        id.reserved = yes
      else if id in RESERVED
        @identifierError id

    unless forcedIdentifier
      id  = COFFEE_ALIAS_MAP[id] if id in COFFEE_ALIASES
      tag = switch id
        when '!'                                  then 'UNARY'
        when '==', '!='                           then 'COMPARE'
        when '&&', '||'                           then 'LOGIC'
        when 'true', 'false', 'null', 'undef'     then 'BOOL'
        when 'function'                           then 'FUNCTION'
        when 'module'                             then 'MODULE'
        else  tag

    @token tag, id
    @token ':', ':' if colon
    input.length

  # Matches numbers, including decimals, hex, and exponential notation.
  # Be careful not to interfere with ranges-in-progress.
  numberToken: ->
    return 0 unless match = NUMBER.exec @chunk
    number = match[0]
    @token 'NUMBER', number
    number.length

  # Matches strings, including multi-line strings. Ensures that quotation marks
  # are balanced within the string's contents, and within nested interpolations.
  stringToken: ->
    switch @chunk.charAt 0
      when "'"
        return 0 unless match = SIMPLESTR.exec @chunk
        @token 'STRING', (string = match[0]).replace MULTILINER, '\\\n'
      when '"'
        return 0 unless string = @balancedString @chunk, '"'
        if 0 < string.indexOf '#{', 1
          @interpolateString string.slice 1, -1
        else
          @token 'STRING', @escapeLines string
      else
        return 0
    @line += count string, '\n'
    string.length

  # Matches heredocs, adjusting indentation to the correct level, as heredocs
  # preserve whitespace, but ignore indentation to the left.
  heredocToken: ->
    return 0 unless match = HEREDOC.exec @chunk
    heredoc = match[0]
    quote = heredoc.charAt 0
    doc = @sanitizeHeredoc match[2], quote: quote, indent: null
    if quote is '"' and 0 <= doc.indexOf '#{'
      @interpolateString doc, heredoc: yes
    else
      @token 'STRING', @makeString doc, quote, yes
    @line += count heredoc, '\n'
    heredoc.length

  # Matches and consumes comments.
  commentToken: ->
    return 0 unless match = @chunk.match COMMENT
    [comment, block] = match
    if block
      @token 'COMMENT', @sanitizeBlockComment block,
        blockcomment: true, indent: Array(@indent + 1).join(' ')
      @token 'TERMINATOR', '\n'
    else
      @token 'COMMENT', comment.trim()[2..].trim()
      @token 'TERMINATOR', '\n'
    @line += count comment, '\n'
    comment.length

  
  # Matches newlines, indents, and outdents, and determines which is which.
  # If we can detect that the current line is continued onto the the next line,
  # then the newline is suppressed:
  #
  #     elements
  #       .each( ... )
  #       .map( ... )
  #
  # Keeps track of the level of indentation, because a single outdent token
  # can close multiple indents, so we need to know how far in we happen to be.
  lineToken: ->
    return 0 unless match = MULTI_DENT.exec @chunk
    indent = match[0]
    indent.length

  # Matches and consumes non-meaningful whitespace. Tag the previous token
  # as being "spaced", because there are some cases where it makes a difference.
  whitespaceToken: ->
    return 0 unless (match = WHITESPACE.exec @chunk) or
                    (nline = @chunk.charAt(0) is '\n')
    prev = last @tokens
    prev[if match then 'spaced' else 'newLine'] = true if prev
    if match then match[0].length else 0

  # Generate a newline token. Consecutive newlines get merged together.
  terminatorToken: ->
    if @tag() isnt 'TERMINATOR' and @tokens.length > 0
      @token 'TERMINATOR', '\n'
    this

  # Use a `\` at a line-ending to suppress the newline.
  # The slash is removed here once its job is done.
  suppressNewlines: ->
    @tokens.pop() if @value() is '\\'
    this

  # We treat all other single characters as a token. E.g.: `( ) , . !`
  # Multi-character operators are also literal tokens, so that Jison can assign
  # the proper order of operations. There are some symbols that we tag specially
  # here. `;` and newlines are both treated as a `TERMINATOR`, we distinguish
  # parentheses that indicate a method call from regular parentheses, and so on.
  literalToken: ->
    if match = OPERATOR.exec @chunk
      [value] = match
      @tagParameters() if CODE.test value
    else
      value = @chunk.charAt 0
    tag  = value
    prev = last @tokens
    if value is '=' and prev
      @assignmentError() if not prev[1].reserved and prev[1] in JS_FORBIDDEN
        
    if value in [';','\n']
      @terminatorToken()
      return 1
    else if value in MATH            then tag = 'MATH'
    else if value in COMPARE         then tag = 'COMPARE'
    else if value in UNARY           then tag = 'UNARY'
    else if value in SHIFT           then tag = 'SHIFT'
    else if value in LOGIC           then tag = 'LOGIC'
    else if prev and not prev.spaced
      if value is '('
        if @tokens.length > 1
          twoTagsBack = @tokens[@tokens.length-2][0]
        if twoTagsBack in ['FUNCTION','MODULE']
          tag = 'PARAM_START'
        else if prev[0] in CALLABLE
          tag = 'CALL_START'
      if value is ')'
        tok = @backtrackToOpeningTokenFor('(',')')
        if tok[0] is 'CALL_START' then tag = 'CALL_END'
        else if tok[0] is 'PARAM_START' then tag = 'PARAM_END'
        else tag = ')'
      else if value is '[' and prev[0] in INDEXABLE
        tag = 'INDEX_START'
      else if value is ']'
        tok = @backtrackToOpeningTokenFor('[',']')
        if tok[0] is 'INDEX_START' then tag = 'INDEX_END'
        else tag = ']'
    @token tag, value
    value.length
    
  backtrackToOpeningTokenFor : (openingSign, closingSign) ->
    stack = []
    i = @tokens.length
    while tok = @tokens[--i]
      switch tok[1]
        when closingSign
          stack.push tok
        when openingSign
          if stack.length then stack.pop()
          else
            return tok
    return null

  # Token Manipulators
  # ------------------

  # 
  sanitizeBlockComment: (doc, options) ->
    doc = doc.replace /// (\n\s|^)\* ///g, '\n'
    doc.trim()

  # A source of ambiguity in our grammar used to be parameter lists in function
  # definitions versus argument lists in function calls. Walk backwards, tagging
  # parameters specially in order to make things easier for the parser.
  tagParameters: ->
    return this if @tag() isnt ')'
    stack = []
    {tokens} = this
    i = tokens.length
    tokens[--i][0] = 'PARAM_END'
    while tok = tokens[--i]
      switch tok[0]
        when ')'
          stack.push tok
        when '(', 'CALL_START'
          if stack.length then stack.pop()
          else if tok[0] is '('
            tok[0] = 'PARAM_START'
            return this
          else return this
    this

  # The error for when you try to use a forbidden word in JavaScript as
  # an identifier.
  identifierError: (word) ->
    throw SyntaxError "Reserved word \"#{word}\" on line #{@line + 1}"

  # The error for when you try to assign to a reserved word in JavaScript,
  # like "function" or "default".
  assignmentError: ->
    throw SyntaxError "Reserved word \"#{@value()}\" on line #{@line + 1} can't be assigned"

  # Matches a balanced group such as a single or double-quoted string. Pass in
  # a series of delimiters, all of which must be nested correctly within the
  # contents of the string. This method allows us to have strings within
  # interpolations within strings, ad infinitum.
  balancedString: (str, end) ->
    stack = [end]
    for i in [1...str.length]
      switch letter = str.charAt i
        when '\\'
          i++
          continue
        when end
          stack.pop()
          unless stack.length
            return str.slice 0, i + 1
          end = stack[stack.length - 1]
          continue
      if end is '}' and letter in ['"', "'"]
        stack.push end = letter
      else if end is '}' and letter is '{'
        stack.push end = '}'
      else if end is '"' and prev is '#' and letter is '{'
        stack.push end = '}'
      prev = letter
    throw new Error "missing #{ stack.pop() }, starting on line #{ @line + 1 }"


  # Expand variables and expressions inside double-quoted strings using
  # Ruby-like notation for substitution of arbitrary expressions.
  #
  #     "Hello #{name.capitalize()}."
  #
  # If it encounters an interpolation, this method will recursively create a
  # new Lexer, tokenize the interpolated contents, and merge them into the
  # token stream.
  interpolateString: (str, options = {}) ->
    {heredoc, regex} = options
    tokens = []
    pi = 0
    i  = -1
    while letter = str.charAt i += 1
      if letter is '\\'
        i += 1
        continue
      unless letter is '#' and str.charAt(i+1) is '{' and
             (expr = @balancedString str.slice(i + 1), '}')
        continue
      tokens.push ['NEOSTRING', str.slice(pi, i)] if pi < i
      inner = expr.slice(1, -1)
      if inner.length
        nested = new Lexer().tokenize inner, line: @line, rewrite: off
        nested.pop()
        nested.shift() if nested[0]?[0] is 'TERMINATOR'
        if len = nested.length
          if len > 1
            nested.unshift ['(', '(']
            nested.push    [')', ')']
          tokens.push ['TOKENS', nested]
      i += expr.length
      pi = i + 1
    tokens.push ['NEOSTRING', str.slice pi] if i > pi < str.length
    return tokens if regex
    return @token 'STRING', '""' unless tokens.length
    tokens.unshift ['', ''] unless tokens[0][0] is 'NEOSTRING'
    @token '(', '(' if interpolated = tokens.length > 1
    for [tag, value], i in tokens
      @token '+', '+' if i
      if tag is 'TOKENS'
        @tokens.push value...
      else
        @token 'STRING', @makeString value, '"', heredoc
    @token ')', ')' if interpolated
    tokens

  # Helpers
  # -------

  # Add a token to the results, taking note of the line number.
  token: (tag, value) ->
    @tokens.push [tag, value, @line]

  # Peek at a tag in the current token stream.
  tag: (index, tag) ->
    (tok = last @tokens, index) and if tag then tok[0] = tag else tok[0]

  # Peek at a value in the current token stream.
  value: (index, val) ->
    (tok = last @tokens, index) and if val then tok[1] = val else tok[1]

  # Are we in the midst of an unfinished expression?
  unfinished: ->
    LINE_CONTINUER.test(@chunk) or
    (prev = last @tokens, 1) and prev[0] isnt '.' and
      (value = @value()) and not value.reserved and
      NO_NEWLINE.test(value) and not CODE.test(value) and not ASSIGNED.test(@chunk)

  # Converts newlines for string literals.
  escapeLines: (str, heredoc) ->
    str.replace MULTILINER, if heredoc then '\\n' else ''

  # Constructs a string token by escaping quotes and newlines.
  makeString: (body, quote, heredoc) ->
    return quote + quote unless body
    body = body.replace /\\([\s\S])/g, (match, contents) ->
      if contents in ['\n', quote] then contents else match
    body = body.replace /// #{quote} ///g, '\\$&'
    quote + @escapeLines(body, heredoc) + quote

# Constants
# ---------

# Keywords that CoffeeScript shares in common with JavaScript.
JS_KEYWORDS = [
  'true', 'false', 'null', 'this'
  'new', 'delete', 'typeof', 'in', 'instanceof'
  'return', 'throw', 'break', 'continue', 'debugger'
  'if', 'else', 'switch', 'for', 'while', 'do', 'try', 'catch', 'finally'
  'class', 'extends', 'super'
]

# CoffeeScript-only keywords.
COFFEE_KEYWORDS = ['undef']

COFFEE_ALIAS_MAP =
  and  : '&&'
  or   : '||'
  is   : '=='
  isnt : '!='
  not  : '!'
  yes  : 'true'
  no   : 'false'
  on   : 'true'
  off  : 'false'

COFFEE_ALIASES  = (key for key of COFFEE_ALIAS_MAP)
COFFEE_KEYWORDS = COFFEE_KEYWORDS.concat COFFEE_ALIASES

# List of words that can never be used.
RESERVED = []

# The superset of both JavaScript keywords and reserved words, none of which may
# be used as identifiers or properties.
JS_FORBIDDEN = JS_KEYWORDS.concat RESERVED

exports.RESERVED = RESERVED.concat(JS_KEYWORDS).concat(COFFEE_KEYWORDS)

# Token matching regexes.
IDENTIFIER = /// ^
  ( [$A-Za-z_\x7f-\uffff][$\w\x7f-\uffff]* )
  ( [^\n\S]* : (?!:) )?  # Is this a property name?
///

NUMBER     = ///
  ^ 0x[\da-f]+ |                              # hex
  ^ \d*\.?\d+ (?:e[+-]?\d+)?  # decimal
///i

HEREDOC    = /// ^ ("""|''') ([\s\S]*?) (?:\n[^\n\S]*)? \1 ///

OPERATOR   = /// ^ (
  ?: [-=]>             # function
   | [-+*/%<>&|^!?=]=  # compound assign / compare
   | >>>=?             # zero-fill right shift
   | ([-+:])\1         # doubles
   | ([&|<>])\2=?      # logic / shift
   | \?\.              # soak access
   | \.{2,3}           # range or splat
) ///

WHITESPACE = /^[^\n\S]+/

COMMENT    = /// 
  ^ /\*                         # Block comment (/* Blah */)
   ( (?: (?!\*/) [\n\s\S] )* )  # Block comment content
   (?:\*/[^\n\S]* | (?:\*/)?$ ) # End block comment
  |                             # OR
  ^ (?:\s* // .*)+              # Line comment (// Blah)
///

CODE       = /^\)\s+=/

MULTI_DENT = /^(?:\n[^\n\S]*)+/

SIMPLESTR  = /^'[^\\']*(?:\\.[^\\']*)*'/

# Regex-matching-regexes.
REGEX = /// ^
  / (?! [\s=] )       # disallow leading whitespace or equals signs
  [^ [ / \n \\ ]*  # every other thing
  (?:
    (?: \\[\s\S]   # anything escaped
      | \[         # character class
           [^ \] \n \\ ]*
           (?: \\[\s\S] [^ \] \n \\ ]* )*
         ]
    ) [^ [ / \n \\ ]*
  )*
  / [imgy]{0,4} (?!\w)
///

HEREGEX      = /// ^ /{3} ([\s\S]+?) /{3} ([imgy]{0,4}) (?!\w) ///

HEREGEX_OMIT = /\s+(?:#.*)?/g

# Token cleaning regexes.
MULTILINER      = /\n/g

HEREDOC_INDENT  = /\n+([^\n\S]*)/g

HEREDOC_ILLEGAL = /\*\//

ASSIGNED        = /^\s*@?([$A-Za-z_][$\w\x7f-\uffff]*|['"].*['"])[^\n\S]*?[:=][^:=>]/

LINE_CONTINUER  = /// ^ \s* (?: , | \??\.(?![.\d]) | :: ) ///

TRAILING_SPACES = /\s+$/

NO_NEWLINE      = /// ^ (?:            # non-capturing group
  [-+*&|/%=<>!.\\][<>=&|]* |           # symbol operators
  and | or | is(?:nt)? | n(?:ot|ew) |  # word operators
  delete | typeof | instanceof
) $ ///

# Unary tokens.
UNARY   = ['!', '~', 'NEW', 'TYPEOF', 'DELETE', 'DO']

# Logical tokens.
LOGIC   = ['&&', '||', '&', '|', '^']

# Bit-shifting tokens.
SHIFT   = ['<<', '>>', '>>>']

# Comparison tokens.
COMPARE = ['==', '!=', '<', '>', '<=', '>=']

# Mathematical tokens.
MATH    = ['*', '/', '%']

# Relational tokens that are negatable with `not` prefix.
RELATION = ['IN', 'OF', 'INSTANCEOF']

# Boolean tokens.
BOOL = ['TRUE', 'FALSE', 'NULL', 'UNDEF']

# Tokens which a regular expression will never immediately follow, but which
# a division operator might.
#
# See: http://www.mozilla.org/js/language/js20-2002-04/rationale/syntax.html#regular-expressions
#
# Our list is shorter, due to sans-parentheses method calls.
NOT_REGEX = ['NUMBER', 'REGEX', 'BOOL', '++', '--', ']']

# If the previous token is not spaced, there are more preceding tokens that
# force a division parse:
NOT_SPACED_REGEX = NOT_REGEX.concat ')', '}', 'THIS', 'IDENTIFIER', 'STRING'

# Tokens which could legitimately be invoked or indexed. A opening
# parentheses or bracket following these tokens will be recorded as the start
# of a function invocation or indexing operation.
CALLABLE  = ['IDENTIFIER', 'STRING', 'REGEX', ')', ']', '}', '?', '::', '@', 'THIS', 'SUPER','CALL_END','INDEX_END']
INDEXABLE = CALLABLE.concat 'NUMBER', 'BOOL'

# Tokens that, when immediately preceding a `WHEN`, indicate that the `WHEN`
# occurs at the start of a line. We disambiguate these from trailing whens to
# avoid an ambiguity in the grammar.
LINE_BREAK = ['INDENT', 'OUTDENT', 'TERMINATOR']
