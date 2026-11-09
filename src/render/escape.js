// -------------------------------------------------------------
//
//!\file escape.js
//!\brief HTML escaping helpers for Codeglint output.
//!\author Colin J.D. Stewart
//
// -------------------------------------------------------------
//
//           Copyright (c) 2026. Colin J.D. Stewart.
//                   All rights reserved
//
// -------------------------------------------------------------

/**
 * @brief Escape HTML text so it can be inserted into the page safely.
 * @param {string} text Input text.
 * @returns {string} Escaped HTML fragment.
 */
export function escapeHtml(text) {
  const value = text === undefined || text === null ? '' : String(text);
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
