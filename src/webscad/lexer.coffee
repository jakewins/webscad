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
      i += @useOrIncludeToken() or
           @identifierToken()   or
           @commentToken()      or
           @whitespaceToken()   or
           @stringToken()       or
           @numberToken()       or
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

    forcedIdentifier = colon or
      (prev = last @tokens) and (prev[0] in ['.', '?.', '::'] or
      not prev.spaced and prev[0] is '@')
    tag = 'IDENTIFIER'

    if id in KEYWORDS
      tag = id.toUpperCase()

    unless forcedIdentifier
      tag = switch id
        when '==', '!='                           then 'COMPARE'
        when '&&', '||'                           then 'LOGIC'
        when 'true', 'false', 'null', 'undef'     then 'BOOL'
        when 'function'                           then 'FUNCTION'
        when 'module'                             then 'MODULE'
        else  tag

    @token tag, id
    @token ':', ':' if colon
    input.length

  useOrIncludeToken: ->
    return 0 unless match = INCLUDE_OR_USE.exec @chunk
    
    type = match[1]
    path = match[2]
    switch type
      when 'include' then @token 'INCLUDE', path
      when 'use' then @token 'USE', path
      else return 0
    match[0].length

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
        @token 'STRING', @escapeLines string
      else
        return 0
    @line += count string, '\n'
    string.length

  # Matches and consumes comments.
  commentToken: ->
    return 0 unless match = @chunk.match COMMENT
    [comment, block] = match
    if block
      @token 'COMMENT', @sanitizeBlockComment block,
        blockcomment: true, indent: Array(@indent + 1).join(' ')
    else
      @token 'COMMENT', comment.trim()[2..].trim()
    @line += count comment, '\n'
    comment.length


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
      @token 'TERMINATOR', ';'
    this

  # We treat all other single characters as a token. E.g.: `( ) , . !`
  # Multi-character operators are also literal tokens, so that Jison can assign
  # the proper order of operations. There are some symbols that we tag specially
  # here. `;` and newlines are both treated as a `TERMINATOR`, we distinguish
  # parentheses that indicate a method call from regular parentheses, and so on.
  literalToken: ->
    if match = OPERATOR.exec @chunk
      [value] = match
    else
      value = @chunk.charAt 0
    tag  = value
    prev = last @tokens
    if value is '=' and prev
      @assignmentError() if not prev[1].reserved and prev[1] in KEYWORDS
        
    if value is ';'
      @terminatorToken()
      return 1
    else if value is '\n'
      @line += 1
      return 1
    else if value in COMPARE         then tag = 'COMPARE'
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

  # Token Manipulators
  # ------------------

  # 
  sanitizeBlockComment: (doc, options) ->
    doc = doc.replace /// (\n\s|^)\* ///g, '\n'
    doc.trim()

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

# Keywords that cannot be assigned to
KEYWORDS = [
  'true', 'false', 'undef'
  'if', 'else', 'module', 'function'
]

# Matches include <some.path> and use <some.path>
INCLUDE_OR_USE = ///
  ^((?:use)|(?:include))
  \s < ([^>]*) >
///

# Token matching regexes.
IDENTIFIER = /// ^
  ( [$A-Za-z_\x7f-\uffff][$\w\x7f-\uffff]* )
  ( [^\n\S]* : (?!:) )?  # Is this a property name?
///

NUMBER     = ///
  ^ 0x[\da-f]+ |                              # hex
  ^ \d*\.?\d+ (?:e[+-]?\d+)?  # decimal
///i

OPERATOR   = /// ^ (
  ?: [-+*/%<>&|^!?=]=  # compound assign / compare
   | ([-+:])\1         # doubles
   | ([&|<>])\2=?      # logic / shift
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

SIMPLESTR  = /^'[^\\']*(?:\\.[^\\']*)*'/

# Token cleaning regexes.
MULTILINER      = /\n/g

ASSIGNED        = /^\s*@?([$A-Za-z_][$\w\x7f-\uffff]*|['"].*['"])[^\n\S]*?[:=][^:=>]/

LINE_CONTINUER  = /// ^ \s* (?: , | \??\.(?![.\d]) ) ///

TRAILING_SPACES = /\s+$/

NO_NEWLINE      = /// ^ (?:            # non-capturing group
  [-+*&|/%=<>!.\\][<>=&|]* |           # symbol operators
  and | or | is(?:nt)? | n(?:ot|ew) |  # word operators
  delete | typeof | instanceof
) $ ///

# Logical tokens.
LOGIC   = ['&&', '||']

# Comparison tokens.
COMPARE = ['==', '!=', '<', '>', '<=', '>=']

# Boolean tokens.
BOOL = ['TRUE', 'FALSE', 'UNDEF']

# Tokens which could legitimately be invoked or indexed. A opening
# parentheses or bracket following these tokens will be recorded as the start
# of a function invocation or indexing operation.
CALLABLE  = ['IDENTIFIER', 'STRING', ')', ']', 'CALL_END','INDEX_END']
INDEXABLE = CALLABLE.concat 'NUMBER', 'BOOL'

