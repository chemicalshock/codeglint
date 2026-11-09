(function () {
  'use strict';

  function CodeglintError(message) {
    this.name = 'CodeglintError';
    this.message = message;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CodeglintError);
    }
  }
  CodeglintError.prototype = Object.create(Error.prototype);
  CodeglintError.prototype.constructor = CodeglintError;

  var SAFE_TOKEN_CATEGORIES = new Set([
    'keyword',
    'type',
    'identifier',
    'function',
    'number',
    'string',
    'comment',
    'operator',
    'punctuation',
    'preprocessor',
    'attribute',
    'boolean',
    'constant',
    'tag',
    'property',
    'escape',
    'plain',
    'text'
  ]);

  function normaliseLanguageId(value) {
    if (value === undefined || value === null) {
      return 'plaintext';
    }
    return String(value).trim().toLowerCase();
  }

  function normaliseTokenType(value) {
    var type = String(value === undefined || value === null ? 'plain' : value).trim();
    if (type.length === 0) {
      return 'plain';
    }
    var normalised = type.toLowerCase().replace(/[^a-z0-9_-]+/g, '-');
    if (!/^[a-z][a-z0-9_-]*$/.test(normalised)) {
      return 'plain';
    }
    return normalised;
  }

  function validateTokenStream(tokens, sourceLength) {
    if (!Array.isArray(tokens)) {
      throw new CodeglintError('Token stream must be an array.');
    }
    for (var index = 0; index < tokens.length; index += 1) {
      var token = tokens[index];
      if (!token || typeof token !== 'object') {
        throw new CodeglintError('Each token must be an object.');
      }
      var type = normaliseTokenType(token.type);
      if (!SAFE_TOKEN_CATEGORIES.has(type)) {
        throw new CodeglintError('Unsafe token category: ' + String(token.type));
      }
      var start = Number(token.start);
      var end = Number(token.end);
      if (!Number.isInteger(start) || !Number.isInteger(end)) {
        throw new CodeglintError('Token offsets must be integers.');
      }
      if (start < 0 || end < 0 || start > sourceLength || end > sourceLength) {
        throw new CodeglintError('Token offsets are out of bounds.');
      }
      if (end <= start) {
        throw new CodeglintError('Token lengths must be positive.');
      }
      if (index > 0) {
        var previous = tokens[index - 1];
        if (start < previous.end) {
          throw new CodeglintError('Token ranges overlap.');
        }
      }
    }
    return tokens;
  }

  function escapeHtml(text) {
    var value = text === undefined || text === null ? '' : String(text);
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function renderHtml(source, tokens, options) {
    options = options || {};
    var text = source === undefined || source === null ? '' : String(source);
    var validated = validateTokenStream(tokens, text.length);
    var prefix = options.classPrefix === undefined ? 'cg' : String(options.classPrefix);
    var parts = [];
    var cursor = 0;

    for (var i = 0; i < validated.length; i += 1) {
      var token = validated[i];
      var type = normaliseTokenType(token.type);
      if (token.start > cursor) {
        parts.push(escapeHtml(text.slice(cursor, token.start)));
      }
      if (token.start >= token.end) {
        continue;
      }
      if (token.start < cursor) {
        throw new CodeglintError('Token ranges are not strictly ordered.');
      }
      parts.push('<span class="' + prefix + '-' + type + '">' + escapeHtml(text.slice(token.start, token.end)) + '</span>');
      cursor = token.end;
    }

    if (cursor < text.length) {
      parts.push(escapeHtml(text.slice(cursor)));
    }

    return parts.join('');
  }

  function createLanguageRegistry() {
    return {
      languages: new Map(),
      aliases: new Map(),
      registerLanguage: function (definition) {
        if (!definition || typeof definition !== 'object') {
          throw new CodeglintError('Language definition must be an object.');
        }
        var id = normaliseLanguageId(definition.id || definition.name);
        if (!id || id.length === 0) {
          throw new CodeglintError('Language definition requires an id.');
        }
        if (typeof definition.initialState !== 'function') {
          throw new CodeglintError("Language '" + id + "' must provide initialState().");
        }
        if (typeof definition.tokeniseLine !== 'function') {
          throw new CodeglintError("Language '" + id + "' must provide tokeniseLine().");
        }
        if (this.languages.has(id)) {
          return this.languages.get(id);
        }
        var aliases = Array.isArray(definition.aliases) ? definition.aliases : [];
        for (var i = 0; i < aliases.length; i += 1) {
          var alias = aliases[i];
          var key = normaliseLanguageId(alias);
          if (key === id) {
            continue;
          }
          if (this.languages.has(key) || this.aliases.has(key)) {
            var existingId = this.aliases.get(key) || key;
            if (existingId !== id) {
              throw new CodeglintError("Duplicate alias '" + alias + "' for language '" + id + "'.");
            }
            continue;
          }
          this.aliases.set(key, id);
        }
        this.languages.set(id, definition);
        return definition;
      },
      hasLanguage: function (id) {
        var key = normaliseLanguageId(id || 'plaintext');
        return this.languages.has(key) || this.aliases.has(key);
      },
      getLanguage: function (id, options) {
        options = options || {};
        var key = normaliseLanguageId(id || 'plaintext');
        var language = this.languages.get(key) || this.languages.get(this.aliases.get(key));
        if (language) {
          return language;
        }
        if (options.fallback === true || key === 'plaintext') {
          var fallback = this.languages.get('plaintext');
          if (fallback) {
            return fallback;
          }
        }
        throw new CodeglintError("Unknown language '" + id + "'.");
      },
      listLanguages: function () {
        var ids = [];
        this.languages.forEach(function (_, key) {
          ids.push(key);
        });
        return ids.sort();
      }
    };
  }

  function readNumber(line, start) {
    var index = start;
    if (line[index] === '-') {
      index += 1;
    }
    if (line[index] === '0') {
      index += 1;
    }
    while (index < line.length && /[0-9]/.test(line[index])) {
      index += 1;
    }
    if (line[index] === '.') {
      index += 1;
      while (index < line.length && /[0-9]/.test(line[index])) {
        index += 1;
      }
    }
    if (line[index] === 'e' || line[index] === 'E') {
      index += 1;
      if (line[index] === '+' || line[index] === '-') {
        index += 1;
      }
      while (index < line.length && /[0-9]/.test(line[index])) {
        index += 1;
      }
    }
    return { value: line.slice(start, index), end: index };
  }

  function tokeniseJsonLine(line, state) {
    state = state || null;
    var tokens = [];
    var index = 0;
    var pendingString = state && state.pendingString ? state.pendingString : null;
    if (pendingString) {
      var quote = pendingString.quote;
      var escaped = false;
      while (index < line.length) {
        var character = line[index];
        if (escaped) {
          escaped = false;
          index += 1;
          continue;
        }
        if (character === '\\') {
          escaped = true;
          index += 1;
          continue;
        }
        if (character === quote) {
          tokens.push({ type: 'string', start: pendingString.offset, end: pendingString.offset + line.length });
          pendingString = null;
          break;
        }
        index += 1;
      }
      if (pendingString) {
        return { tokens: tokens, state: { pendingString: pendingString } };
      }
    }

    while (index < line.length) {
      var current = line[index];
      var previous = line[index - 1];
      if (/\s/.test(current)) {
        index += 1;
        continue;
      }
      if (current === '"') {
        var end = index + 1;
        var stringEscaped = false;
        while (end < line.length) {
          var nextChar = line[end];
          if (stringEscaped) {
            stringEscaped = false;
            end += 1;
            continue;
          }
          if (nextChar === '\\') {
            stringEscaped = true;
            end += 1;
            continue;
          }
          if (nextChar === '"') {
            end += 1;
            break;
          }
          end += 1;
        }
        var open = index;
        var close = end;
        var value = line.slice(open, close);
        var isKey = previous === '{' || previous === ',' || /\s/.test(previous || '');
        var kind = isKey && value.endsWith('"') && value.indexOf(':') === -1 ? 'property' : 'string';
        tokens.push({ type: kind, start: open, end: close });
        index = close;
        continue;
      }
      if (current === '{' || current === '}' || current === '[' || current === ']' || current === ':') {
        tokens.push({ type: 'punctuation', start: index, end: index + 1 });
        index += 1;
        continue;
      }
      if (current === ',' || current === ';') {
        tokens.push({ type: 'punctuation', start: index, end: index + 1 });
        index += 1;
        continue;
      }
      if (current === '-' || /[0-9]/.test(current)) {
        var number = readNumber(line, index);
        tokens.push({ type: 'number', start: index, end: number.end });
        index = number.end;
        continue;
      }
      if (/[A-Za-z_]/.test(current)) {
        var wordEnd = index + 1;
        while (wordEnd < line.length && /[A-Za-z0-9_]/.test(line[wordEnd])) {
          wordEnd += 1;
        }
        var word = line.slice(index, wordEnd);
        if (word === 'null') {
          tokens.push({ type: 'constant', start: index, end: wordEnd });
        } else if (word === 'true' || word === 'false') {
          tokens.push({ type: 'boolean', start: index, end: wordEnd });
        } else {
          tokens.push({ type: 'identifier', start: index, end: wordEnd });
        }
        index = wordEnd;
        continue;
      }
      if (current === '\\') {
        tokens.push({ type: 'escape', start: index, end: index + 1 });
        index += 1;
        continue;
      }
      tokens.push({ type: 'operator', start: index, end: index + 1 });
      index += 1;
    }

    return { tokens: tokens, state: null };
  }

  function tokeniseJavaScriptLine(line, state) {
    state = state || null;
    var tokens = [];
    var index = 0;
    var stringQuote = state && state.stringQuote ? state.stringQuote : null;
    var JS_KEYWORDS = new Set(['break', 'case', 'catch', 'class', 'const', 'continue', 'debugger', 'default', 'delete', 'do', 'else', 'export', 'extends', 'finally', 'for', 'function', 'if', 'import', 'in', 'instanceof', 'let', 'new', 'return', 'super', 'switch', 'this', 'throw', 'try', 'typeof', 'var', 'void', 'while', 'with', 'yield', 'async', 'await', 'of', 'from', 'true', 'false', 'null']);
    var JS_TYPES = new Set(['Array', 'Boolean', 'Date', 'Error', 'Function', 'Map', 'Number', 'Object', 'Promise', 'RegExp', 'Set', 'String', 'Symbol', 'WeakMap', 'WeakSet']);

    while (index < line.length) {
      var character = line[index];
      var next = line[index + 1];
      if (stringQuote) {
        var start = index;
        var end = index;
        var escaped = false;
        while (end < line.length) {
          var literal = line[end];
          if (escaped) {
            escaped = false;
            end += 1;
            continue;
          }
          if (literal === '\\') {
            escaped = true;
            end += 1;
            continue;
          }
          if (literal === stringQuote) {
            tokens.push({ type: 'string', start: start, end: end + 1 });
            index = end + 1;
            stringQuote = null;
            break;
          }
          end += 1;
        }
        if (stringQuote) {
          tokens.push({ type: 'string', start: start, end: line.length });
          index = line.length;
        }
        continue;
      }
      if (character === '/' && next === '/') {
        tokens.push({ type: 'comment', start: index, end: line.length });
        break;
      }
      if (character === '/' && next === '*') {
        var commentEnd = line.indexOf('*/', index + 2);
        if (commentEnd === -1) {
          tokens.push({ type: 'comment', start: index, end: line.length });
          break;
        }
        tokens.push({ type: 'comment', start: index, end: commentEnd + 2 });
        index = commentEnd + 2;
        continue;
      }
      if (character === '"' || character === "'") {
        stringQuote = character;
        tokens.push({ type: 'string', start: index, end: index + 1 });
        index += 1;
        continue;
      }
      if (character === '`') {
        var templateEnd = index + 1;
        while (templateEnd < line.length) {
          if (line[templateEnd] === '`') {
            tokens.push({ type: 'string', start: index, end: templateEnd + 1 });
            index = templateEnd + 1;
            break;
          }
          if (line[templateEnd] === '\\') {
            templateEnd += 2;
            continue;
          }
          templateEnd += 1;
        }
        if (index <= line.length && index === templateEnd) {
          tokens.push({ type: 'string', start: index, end: line.length });
          index = line.length;
        }
        continue;
      }
      if (/\s/.test(character)) {
        index += 1;
        continue;
      }
      if (/[A-Za-z_$]/.test(character)) {
        var wordIndex = index + 1;
        while (wordIndex < line.length && /[A-Za-z0-9_$]/.test(line[wordIndex])) {
          wordIndex += 1;
        }
        var word = line.slice(index, wordIndex);
        if (JS_KEYWORDS.has(word)) {
          tokens.push({ type: 'keyword', start: index, end: wordIndex });
        } else if (JS_TYPES.has(word)) {
          tokens.push({ type: 'type', start: index, end: wordIndex });
        } else {
          tokens.push({ type: 'identifier', start: index, end: wordIndex });
        }
        index = wordIndex;
        continue;
      }
      if (/[0-9]/.test(character) || (character === '.' && /[0-9]/.test(next || ''))) {
        var numberEnd = index + 1;
        while (numberEnd < line.length && /[0-9A-Za-z_.]/.test(line[numberEnd])) {
          numberEnd += 1;
        }
        tokens.push({ type: 'number', start: index, end: numberEnd });
        index = numberEnd;
        continue;
      }
      if ('{}[](),.;:'.indexOf(character) !== -1) {
        tokens.push({ type: 'punctuation', start: index, end: index + 1 });
        index += 1;
        continue;
      }
      if ('+-*/%=<>!&|?:'.indexOf(character) !== -1) {
        tokens.push({ type: 'operator', start: index, end: index + 1 });
        index += 1;
        continue;
      }
      tokens.push({ type: 'identifier', start: index, end: index + 1 });
      index += 1;
    }

    return { tokens: tokens, state: stringQuote ? { stringQuote: stringQuote } : null };
  }

  function tokeniseSource(source, languageDefinition) {
    var text = source === undefined || source === null ? '' : String(source);
    var tokens = [];
    var state = languageDefinition && typeof languageDefinition.initialState === 'function' ? languageDefinition.initialState() : null;
    var absoluteOffset = 0;
    var lineStart = 0;

    for (var i = 0; i <= text.length; i += 1) {
      var character = text[i];
      var isLineBreak = character === '\n' || character === '\r';
      if (!isLineBreak && i !== text.length) {
        continue;
      }

      var lineText = text.slice(lineStart, i);
      var result = languageDefinition.tokeniseLine(lineText, state);
      var lineTokens = Array.isArray(result) ? result : result && Array.isArray(result.tokens) ? result.tokens : [];
      var nextState = Array.isArray(result) ? state : result && Object.prototype.hasOwnProperty.call(result, 'state') ? result.state : state;

      for (var j = 0; j < lineTokens.length; j += 1) {
        var token = lineTokens[j];
        if (!token || typeof token !== 'object') {
          throw new CodeglintError('Each token must be an object.');
        }
        var relativeStart = Number(token.start);
        var relativeEnd = Number(token.end);
        if (!Number.isInteger(relativeStart) || !Number.isInteger(relativeEnd)) {
          throw new CodeglintError('Token offsets must be integers.');
        }
        if (relativeStart < 0 || relativeEnd < 0 || relativeEnd < relativeStart) {
          throw new CodeglintError('Malformed token offsets found.');
        }
        tokens.push({
          type: normaliseTokenType(token.type),
          start: absoluteOffset + relativeStart,
          end: absoluteOffset + relativeEnd
        });
      }

      state = nextState;
      if (i < text.length) {
        var isCrLf = text[i] === '\r' && text[i + 1] === '\n';
        if (isCrLf) {
          i += 1;
        }
        absoluteOffset += lineText.length + (isCrLf ? 2 : 1);
        lineStart = i + 1;
        if (i === text.length) {
          break;
        }
      } else {
        absoluteOffset += lineText.length;
        lineStart = i;
      }
    }

    validateTokenStream(tokens, text.length);
    return tokens;
  }

  var plaintext = {
    id: 'plaintext',
    aliases: ['text', 'plain', 'txt'],
    initialState: function () { return null; },
    tokeniseLine: function () { return []; }
  };

  var json = {
    id: 'json',
    aliases: ['javascriptobjectnotation', 'json5'],
    initialState: function () { return null; },
    tokeniseLine: function (line, state) { return tokeniseJsonLine(line, state); }
  };

  var javascript = {
    id: 'javascript',
    aliases: ['js', 'ecmascript'],
    initialState: function () { return null; },
    tokeniseLine: function (line, state) { return tokeniseJavaScriptLine(line, state); }
  };

  function Codeglint(registry) {
    registry = registry || createLanguageRegistry();
    this.registry = registry;
    if (!this.registry.hasLanguage('plaintext')) {
      this.registry.registerLanguage(plaintext);
    }
    if (!this.registry.hasLanguage('json')) {
      this.registry.registerLanguage(json);
    }
    if (!this.registry.hasLanguage('javascript')) {
      this.registry.registerLanguage(javascript);
    }
  }

  Codeglint.prototype.registerLanguage = function (definition) {
    return this.registry.registerLanguage(definition);
  };

  Codeglint.prototype.getLanguage = function (id, options) {
    return this.registry.getLanguage(id, options || {});
  };

  Codeglint.prototype.listLanguages = function () {
    return this.registry.listLanguages();
  };

  Codeglint.prototype.tokenise = function (source, options) {
    options = options || {};
    var language = this.getLanguage(options.language || 'plaintext', { fallback: options.fallback === true });
    return tokeniseSource(source, language);
  };

  Codeglint.prototype.renderHtml = function (source, tokens, options) {
    return renderHtml(source, tokens, options || {});
  };

  Codeglint.prototype.highlight = function (source, options) {
    options = options || {};
    var tokens = this.tokenise(source, {
      language: options.language || 'plaintext',
      fallback: options.fallback === true
    });
    return this.renderHtml(source, tokens, { classPrefix: options.classPrefix || 'cg' });
  };

  var exported = {
    Codeglint: Codeglint,
    plaintext: plaintext,
    json: json,
    javascript: javascript,
    renderHtml: renderHtml,
    escapeHtml: escapeHtml
  };

  if (typeof window !== 'undefined') {
    window.Codeglint = Codeglint;
    window.codeglint = exported;
  }

  if (typeof globalThis !== 'undefined') {
    globalThis.Codeglint = Codeglint;
    globalThis.codeglint = exported;
  }
})();
