// -------------------------------------------------------------
//
//!\file token.js
//!\brief Token validation and CSS-safe category helpers.
//!\author Colin J.D. Stewart
//
// -------------------------------------------------------------
//
//           Copyright (c) 2026. Colin J.D. Stewart.
//                   All rights reserved
//
// -------------------------------------------------------------

import { CodeglintError } from './errors.js';

/**
 * @typedef {Object} Token
 * @property {string} type Token category.
 * @property {number} start Inclusive source offset.
 * @property {number} end Exclusive source offset.
 * @property {string[]=} modifiers Optional future token modifiers.
 */

export const SAFE_TOKEN_CATEGORIES = new Set([
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

/**
 * @brief Normalise a token category for safe class generation.
 * @param {string} value Token category.
 * @returns {string} Safe CSS token category.
 */
export function normaliseTokenType(value) {
  const type = String(value ?? 'plain').trim();
  if (type.length === 0) {
    return 'plain';
  }

  const normalised = type
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-');

  if (!/^[a-z][a-z0-9_-]*$/.test(normalised)) {
    return 'plain';
  }

  return normalised;
}

/**
 * @brief Validate a token stream before rendering.
 * @param {Array<Token>} tokens Token list.
 * @param {number} sourceLength Source length.
 * @returns {Array<Token>} Validated tokens.
 */
export function validateTokenStream(tokens, sourceLength) {
  if (!Array.isArray(tokens)) {
    throw new CodeglintError('Token stream must be an array.');
  }

  for (const token of tokens) {
    if (!token || typeof token !== 'object') {
      throw new CodeglintError('Each token must be an object.');
    }

    const type = normaliseTokenType(token.type);
    if (!SAFE_TOKEN_CATEGORIES.has(type)) {
      throw new CodeglintError(`Unsafe token category: ${String(token.type)}`);
    }

    const start = Number(token.start);
    const end = Number(token.end);

    if (!Number.isInteger(start) || !Number.isInteger(end)) {
      throw new CodeglintError('Token offsets must be integers.');
    }

    if (start < 0 || end < 0 || start > sourceLength || end > sourceLength) {
      throw new CodeglintError('Token offsets are out of bounds.');
    }

    if (end <= start) {
      throw new CodeglintError('Token lengths must be positive.');
    }
  }

  for (let index = 1; index < tokens.length; index += 1) {
    const previous = tokens[index - 1];
    const current = tokens[index];
    if (current.start < previous.end) {
      throw new CodeglintError('Token ranges overlap.');
    }
    if (current.start < previous.start) {
      throw new CodeglintError('Tokens must be sorted by start offset.');
    }
  }

  return tokens;
}
