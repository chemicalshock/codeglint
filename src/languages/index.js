// -------------------------------------------------------------
//
//!\file index.js
//!\brief Language exports for Codeglint.
//!\author Colin J.D. Stewart
//
// -------------------------------------------------------------
//
//           Copyright (c) 2026. Colin J.D. Stewart.
//                   All rights reserved
//
// -------------------------------------------------------------

export { plaintext } from './plaintext.js';
export { json } from './json.js';
export { javascript } from './javascript.js';
export { cpp } from './cpp.js';
export { ziron } from './ziron.js';

export const languages = {
  plaintext: (await import('./plaintext.js')).plaintext,
  json: (await import('./json.js')).json,
  javascript: (await import('./javascript.js')).javascript,
  cpp: (await import('./cpp.js')).cpp,
  ziron: (await import('./ziron.js')).ziron
};
