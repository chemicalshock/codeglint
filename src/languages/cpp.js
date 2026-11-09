// -------------------------------------------------------------
//
//!/file cpp.js
//!/brief C/C++ lexer for Codeglint.
//!/author Colin J.D. Stewart
//
// -------------------------------------------------------------
//
//           Copyright (c) 2026. Colin J.D. Stewart.
//                   All rights reserved
//
// -------------------------------------------------------------

const CPP_KEYWORDS = new Set([
  'auto', 'break', 'case', 'char', 'constexpr', 'const', 'continue', 'default', 'do', 'double',
  'else', 'enum', 'extern', 'float', 'for', 'goto', 'if', 'inline', 'int', 'long', 'register',
  'return', 'short', 'signed', 'sizeof', 'static', 'struct', 'switch', 'typedef', 'union',
  'unsigned', 'void', 'volatile', 'while', 'bool', 'class', 'namespace', 'public', 'protected',
  'private', 'virtual', 'friend', 'override', 'final', 'template', 'typename', 'using', 'new',
  'delete', 'throw', 'try', 'catch', 'operator', 'explicit', 'mutable', 'noexcept', 'decltype'
]);

const CPP_TYPES = new Set([
  'size_t', 'ptrdiff_t', 'uint8_t', 'uint16_t', 'uint32_t', 'uint64_t', 'int8_t', 'int16_t', 'int32_t', 'int64_t'
]);

/**
 * @brief Tokenise a C/C++ line.
 * @param {string} line Source line.
 * @param {*} state Previous scanner state.
 * @returns {{ tokens: Array<Token>, state: * }} Token list and next state.
 */
export function tokeniseCppLine(line, state = null) {
  const tokens = [];
  let index = 0;
  
  let stringQuote = state && state.inString ? state.stringQuote : null;
  let inBlockComment = state && state.inBlockComment ? true : false;

  if (inBlockComment) {
    const end = line.indexOf('*/');
    if (end === -1) {
      tokens.push({ type: 'comment', start: index, end: line.length });
      return { tokens, state: { inBlockComment: true } };
    } else {
      tokens.push({ type: 'comment', start: index, end: end + 2 });
      index = end + 2;
      inBlockComment = false;
    }
  }

  while (index < line.length) {
    const character = line[index];
    const next = line[index + 1];

    if (stringQuote) {
      const start = index;
      let end = index;
      let escaped = false;
      while (end < line.length) {
        const current = line[end];
        if (escaped) {
          escaped = false;
          end += 1;
          continue;
        }
        if (current === '\\') {
          escaped = true;
          end += 1;
          continue;
        }
        if (current === stringQuote) {
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
      const end = line.indexOf('*/', index + 2);
      if (end === -1) {
        tokens.push({ type: 'comment', start: index, end: line.length });
        return { tokens, state: { inBlockComment: true } };
      }
      tokens.push({ type: 'comment', start: index, end: end + 2 });
      index = end + 2;
      continue;
    }

    if (character === '"' || character === '\'') {
      stringQuote = character;
      const start = index;
      let end = index + 1;
      let escaped = false;
      while (end < line.length) {
        const current = line[end];
        if (escaped) {
          escaped = false;
          end += 1;
          continue;
        }
        if (current === '\\') {
          escaped = true;
          end += 1;
          continue;
        }
        if (current === stringQuote) {
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

    if (character === '#') {
      let end = index + 1;
      while (end < line.length && !/\s/.test(line[end])) {
        end += 1;
      }
      tokens.push({ type: 'keyword', start: index, end: end });
      index = end;
      continue;
    }

    if (/\s/.test(character)) {
      index += 1;
      continue;
    }

    if (/[A-Za-z_]/.test(character)) {
      let end = index + 1;
      while (end < line.length && /[A-Za-z0-9_]/.test(line[end])) {
        end += 1;
      }
      const word = line.slice(index, end);
      if (CPP_KEYWORDS.has(word)) {
        tokens.push({ type: 'keyword', start: index, end: end });
      } else if (CPP_TYPES.has(word)) {
        tokens.push({ type: 'type', start: index, end: end });
      } else {
        tokens.push({ type: 'identifier', start: index, end: end });
      }
      index = end;
      continue;
    }

    if (/[0-9]/.test(character)) {
      let end = index + 1;
      while (end < line.length && /[0-9A-Fa-f.xXpP]/.test(line[end])) {
        end += 1;
      }
      tokens.push({ type: 'number', start: index, end: end });
      index = end;
      continue;
    }

    if ('{}[](),.;:'.includes(character)) {
      tokens.push({ type: 'punctuation', start: index, end: index + 1 });
      index += 1;
      continue;
    }

    if ('+-*/%=<>!&|?^~'.includes(character)) {
      tokens.push({ type: 'operator', start: index, end: index + 1 });
      index += 1;
      continue;
    }

    tokens.push({ type: 'identifier', start: index, end: index + 1 });
    index += 1;
  }

  const nextState = {};
  if (stringQuote) {
    nextState.inString = true;
    nextState.stringQuote = stringQuote;
  }
  if (inBlockComment) {
    nextState.inBlockComment = true;
  }
  
  return { tokens, state: Object.keys(nextState).length > 0 ? nextState : null };
}

export const cpp = {
  id: 'cpp',
  aliases: ['c', 'cpp', 'c++'],
  initialState() {
    return null;
  },
  tokeniseLine(line, state) {
    return tokeniseCppLine(line, state);
  }
};

export default cpp;
