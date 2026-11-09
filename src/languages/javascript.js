// -------------------------------------------------------------
//
//!\file javascript.js
//!\brief JavaScript lexer for Codeglint.
//!\author Colin J.D. Stewart
//
// -------------------------------------------------------------
//
//           Copyright (c) 2026. Colin J.D. Stewart.
//                   All rights reserved
//
// -------------------------------------------------------------

const JS_KEYWORDS = new Set([
  'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger', 'default', 'delete',
  'do', 'else', 'export', 'extends', 'finally', 'for', 'function', 'if', 'import', 'in',
  'instanceof', 'let', 'new', 'return', 'super', 'switch', 'this', 'throw', 'try', 'typeof',
  'var', 'void', 'while', 'with', 'yield', 'async', 'await', 'of', 'from', 'true', 'false', 'null'
]);

const JS_TYPES = new Set(['Array', 'Boolean', 'Date', 'Error', 'Function', 'Map', 'Number', 'Object', 'Promise', 'RegExp', 'Set', 'String', 'Symbol', 'WeakMap', 'WeakSet']);

/**
 * @brief Tokenise a JavaScript line.
 * @param {string} line Source line.
 * @param {*} state Previous scanner state.
 * @returns {{ tokens: Array<Token>, state: * }} Token list and next state.
 */
export function tokeniseJavaScriptLine(line, state = null) {
  const tokens = [];
  let index = 0;
  const inString = state && state.inString ? state : null;
  let stringQuote = inString && inString.stringQuote ? inString.stringQuote : null;

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
        break;
      }
      tokens.push({ type: 'comment', start: index, end: end + 2 });
      index = end + 2;
      continue;
    }

    if (character === '"' || character === "'") {
      stringQuote = character;
      tokens.push({ type: 'string', start: index, end: index + 1 });
      index += 1;
      continue;
    }

    if (character === '`') {
      let end = index + 1;
      while (end < line.length) {
        if (line[end] === '`') {
          tokens.push({ type: 'string', start: index, end: end + 1 });
          index = end + 1;
          break;
        }
        if (line[end] === '\\') {
          end += 2;
          continue;
        }
        end += 1;
      }
      if (index <= line.length && index === end) {
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
      let end = index + 1;
      while (end < line.length && /[A-Za-z0-9_$]/.test(line[end])) {
        end += 1;
      }
      const word = line.slice(index, end);
      if (JS_KEYWORDS.has(word)) {
        tokens.push({ type: 'keyword', start: index, end: end });
      } else if (JS_TYPES.has(word)) {
        tokens.push({ type: 'type', start: index, end: end });
      } else {
        tokens.push({ type: 'identifier', start: index, end: end });
      }
      index = end;
      continue;
    }

    if (/[0-9]/.test(character) || (character === '.' && /[0-9]/.test(next || ''))) {
      let end = index + 1;
      while (end < line.length && /[0-9A-Za-z_.]/.test(line[end])) {
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

    if ('+-*/%=<>!&|?:'.includes(character)) {
      tokens.push({ type: 'operator', start: index, end: index + 1 });
      index += 1;
      continue;
    }

    tokens.push({ type: 'identifier', start: index, end: index + 1 });
    index += 1;
  }

  return { tokens, state: stringQuote ? { inString: true, stringQuote } : null };
}

export const javascript = {
  id: 'javascript',
  aliases: ['js', 'ecmascript'],
  initialState() {
    return null;
  },
  tokeniseLine(line, state) {
    return tokeniseJavaScriptLine(line, state);
  }
};

export default javascript;
