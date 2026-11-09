// -------------------------------------------------------------
//
//!\file plaintext.js
//!\brief Plaintext fallback lexer with no syntax colouring.
//!\author Colin J.D. Stewart
//
// -------------------------------------------------------------
//
//           Copyright (c) 2026. Colin J.D. Stewart.
//                   All rights reserved
//
// -------------------------------------------------------------

/**
 * @brief Plaintext lexer definition.
 */
export const plaintext = {
  id: 'plaintext',
  aliases: ['text', 'plain', 'txt'],
  initialState() {
    return null;
  },
  tokeniseLine(line) {
    return [];
  }
};

export default plaintext;
