// -------------------------------------------------------------
//
//!\file html.js
//!\brief HTML renderer for Codeglint token streams.
//!\author Colin J.D. Stewart
//
// -------------------------------------------------------------
//
//           Copyright (c) 2026. Colin J.D. Stewart.
//                   All rights reserved
//
// -------------------------------------------------------------

import { CodeglintError } from '../core/errors.js';
import { validateTokenStream, normaliseTokenType } from '../core/token.js';
import { escapeHtml } from './escape.js';

/**
 * @brief Render a validated token stream back into safe HTML.
 * @param {string} source Source code.
 * @param {Array<Token>} tokens Token list.
 * @param {{classPrefix?: string}} options Render options.
 * @returns {string} HTML output for the inner contents of a code element.
 */
export function renderHtml(source, tokens, options = {}) {
  const text = source === undefined || source === null ? '' : String(source);
  const validated = validateTokenStream(tokens, text.length);
  const prefix = options.classPrefix === undefined ? 'cg' : String(options.classPrefix);
  const parts = [];
  let cursor = 0;

  for (const token of validated) {
    const type = normaliseTokenType(token.type);
    const safeType = /^([a-z][a-z0-9_-]*)$/.test(type) ? type : 'plain';

    if (token.start > cursor) {
      parts.push(escapeHtml(text.slice(cursor, token.start)));
    }

    if (token.start >= token.end) {
      continue;
    }

    if (token.start < cursor) {
      throw new CodeglintError('Token ranges are not strictly ordered.');
    }

    parts.push(`<span class="${prefix}-${safeType}">${escapeHtml(text.slice(token.start, token.end))}</span>`);
    cursor = token.end;
  }

  if (cursor < text.length) {
    parts.push(escapeHtml(text.slice(cursor)));
  }

  return parts.join('');
}
