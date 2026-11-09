// -------------------------------------------------------------
//
//!\file errors.js
//!\brief Shared validation errors for the Codeglint core.
//!\author Colin J.D. Stewart
//
// -------------------------------------------------------------
//
//           Copyright (c) 2026. Colin J.D. Stewart.
//                   All rights reserved
//
// -------------------------------------------------------------

/**
 * @brief Shared custom error for API misuse and validation failures.
 */
export class CodeglintError extends Error {
  /**
   * @param {string} message Error message.
   */
  constructor(message) {
    super(message);
    this.name = 'CodeglintError';
  }
}
