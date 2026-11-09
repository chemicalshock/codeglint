// -------------------------------------------------------------
//
//!\file json.js
//!\brief JSON lexer for Codeglint.
//!\author Colin J.D. Stewart
//
// -------------------------------------------------------------
//
//           Copyright (c) 2026. Colin J.D. Stewart.
//                   All rights reserved
//
// -------------------------------------------------------------

const JSON_KEYWORDS = new Set(['true', 'false', 'null']);

/**
 * @brief Determine if text is a quoted JSON key.
 * @param {string} value Value to inspect.
 * @returns {boolean} True when the value is a property name.
 */
function isPropertyName(value) {
  return value.length > 0 && /^"(?:[^"\\]|\\.)*"$/.test(value);
}

/**
 * @brief Extract a JSON number token.
 * @param {string} line Source line.
 * @param {number} start Offset.
 * @returns {{value: string, end: number}} Parsed number details.
 */
function readNumber(line, start) {
  let index = start;
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

/**
 * @brief Tokenise a single JSON line.
 * @param {string} line Source line without its terminator.
 * @param {*} state Previous lexer state.
 * @returns {{ tokens: Array<Token>, state: * }} Token list and next state.
 */
export function tokeniseJsonLine(line, state = null) {
  const tokens = [];
  let index = 0;
  let pendingString = state && state.pendingString ? state.pendingString : null;

  if (pendingString) {
    const { quote } = pendingString;
    let start = 0;
    let escaped = false;
    while (index < line.length) {
      const character = line[index];
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
      return { tokens, state: { pendingString } };
    }
  }

  while (index < line.length) {
    const character = line[index];
    const previous = line[index - 1];

    if (/\s/.test(character)) {
      index += 1;
      continue;
    }

    if (character === '"') {
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
        if (current === '"') {
          end += 1;
          break;
        }
        end += 1;
      }

      const open = index;
      const close = end;
      const value = line.slice(open, close);
      const isKey = previous === '{' || previous === ',' || /\s/.test(previous ?? '');
      const kind = isKey && value.endsWith('"') && value.includes(':') === false ? 'property' : 'string';
      tokens.push({ type: kind, start: open, end: close });
      index = close;
      continue;
    }

    if (character === '{' || character === '}' || character === '[' || character === ']' || character === ':') {
      tokens.push({ type: 'punctuation', start: index, end: index + 1 });
      index += 1;
      continue;
    }

    if (character === ',' || character === ';') {
      tokens.push({ type: 'punctuation', start: index, end: index + 1 });
      index += 1;
      continue;
    }

    if (character === '-' || /[0-9]/.test(character)) {
      const number = readNumber(line, index);
      tokens.push({ type: 'number', start: index, end: number.end });
      index = number.end;
      continue;
    }

    if (/[A-Za-z_]/.test(character)) {
      let end = index + 1;
      while (end < line.length && /[A-Za-z0-9_]/.test(line[end])) {
        end += 1;
      }
      const word = line.slice(index, end);
      const type = JSON_KEYWORDS.has(word) ? 'boolean' : 'identifier';
      if (word === 'null') {
        tokens.push({ type: 'constant', start: index, end: end });
      } else if (word === 'true' || word === 'false') {
        tokens.push({ type: 'boolean', start: index, end: end });
      } else {
        tokens.push({ type: type, start: index, end: end });
      }
      index = end;
      continue;
    }

    if (character === '\\') {
      const escapeStart = index;
      tokens.push({ type: 'escape', start: escapeStart, end: index + 1 });
      index += 1;
      continue;
    }

    tokens.push({ type: 'operator', start: index, end: index + 1 });
    index += 1;
  }

  return { tokens, state: null };
}

export const json = {
  id: 'json',
  aliases: ['javascriptobjectnotation', 'json5'],
  initialState() {
    return null;
  },
  tokeniseLine(line, state) {
    return tokeniseJsonLine(line, state);
  }
};

export default json;
