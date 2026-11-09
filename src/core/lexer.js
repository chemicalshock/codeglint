// -------------------------------------------------------------
//
//!\file lexer.js
//!\brief Line-oriented tokenisation helpers for the Codeglint core.
//!\author Colin J.D. Stewart
//
// -------------------------------------------------------------
//
//           Copyright (c) 2026. Colin J.D. Stewart.
//                   All rights reserved
//
// -------------------------------------------------------------

import { CodeglintError } from './errors.js';
import { validateTokenStream, normaliseTokenType } from './token.js';

/**
 * @brief Convert line-relative tokens to absolute offsets.
 * @param {string} source Source code.
 * @param {Object} definition Lexer definition.
 * @param {{fallback?: boolean}} options Lookup options.
 * @returns {Array<Token>} Generated tokens.
 */
export function tokeniseSource(source, definition, options = {}) {
  if (!definition || typeof definition !== 'object') {
    throw new CodeglintError('A language definition is required.');
  }

  const text = source === undefined || source === null ? '' : String(source);
  const tokens = [];
  let state = typeof definition.initialState === 'function' ? definition.initialState() : null;
  let absoluteOffset = 0;
  let lineStart = 0;

  for (let index = 0; index <= text.length; index += 1) {
    const character = text[index];
    const isLineBreak = character === '\n' || character === '\r';
    if (!isLineBreak && index !== text.length) {
      continue;
    }

    const lineText = text.slice(lineStart, index);
    const rawResult = definition.tokeniseLine(lineText, state);
    const lineTokens = Array.isArray(rawResult) ? rawResult : rawResult && Array.isArray(rawResult.tokens) ? rawResult.tokens : [];
    const nextState = Array.isArray(rawResult) ? state : rawResult && Object.prototype.hasOwnProperty.call(rawResult, 'state') ? rawResult.state : state;

    for (const token of lineTokens) {
      if (!token || typeof token !== 'object') {
        throw new CodeglintError('Each token must be an object.');
      }

      const relativeStart = Number(token.start);
      const relativeEnd = Number(token.end);
      if (!Number.isInteger(relativeStart) || !Number.isInteger(relativeEnd)) {
        throw new CodeglintError('Token offsets must be integers.');
      }

      if (relativeStart < 0 || relativeEnd < 0 || relativeEnd < relativeStart) {
        throw new CodeglintError('Malformed token offsets found.');
      }

      tokens.push({
        ...token,
        type: normaliseTokenType(token.type),
        start: absoluteOffset + relativeStart,
        end: absoluteOffset + relativeEnd
      });
    }

    state = nextState;
    if (index < text.length) {
      const lf = text[index] === '\n';
      const crlf = text[index] === '\r' && text[index + 1] === '\n';
      if (crlf) {
        index += 1;
      }
      absoluteOffset += lineText.length + (crlf ? 2 : 1);
      lineStart = index + 1;
      if (index === text.length) {
        break;
      }
    } else {
      absoluteOffset += lineText.length;
      lineStart = index;
    }
  }

  if (options && options.strict !== false) {
    validateTokenStream(tokens, text.length);
  }

  return tokens;
}
