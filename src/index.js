// -------------------------------------------------------------
//
//!\file index.js
//!\brief Public entry point for Codeglint.
//!\author Colin J.D. Stewart
//
// -------------------------------------------------------------
//
//           Copyright (c) 2026. Colin J.D. Stewart.
//                   All rights reserved
//
// -------------------------------------------------------------

import { CodeglintError } from './core/errors.js';
import { tokeniseSource } from './core/lexer.js';
import { defaultRegistry, registerLanguage, getLanguage, listLanguages } from './core/registry.js';
import { renderHtml } from './render/html.js';
import { plaintext } from './languages/plaintext.js';
import { json } from './languages/json.js';
import { javascript } from './languages/javascript.js';
import { cpp } from './languages/cpp.js';
import { ziron } from './languages/ziron.js';
import { fracture } from './languages/fracture.js';

/**
 * @brief Core Codeglint API.
 */
export class Codeglint {
  constructor(registry = defaultRegistry) {
    this.registry = registry;
    if (!this.registry.hasLanguage('plaintext')) {
      this.registerLanguage(plaintext);
    }
    if (!this.registry.hasLanguage('json')) {
      this.registerLanguage(json);
    }
    if (!this.registry.hasLanguage('javascript')) {
      this.registerLanguage(javascript);
    }
    if (!this.registry.hasLanguage('cpp')) {
      this.registerLanguage(cpp);
    }
    if (!this.registry.hasLanguage('ziron')) {
      this.registerLanguage(ziron);
    }
    if (!this.registry.hasLanguage('fracture')) {
      this.registerLanguage(fracture);
    }
  }
  
  /**
   * @brief Register a language definition.
   * @param {Object} definition Language definition.
   * @returns {Object} Registered definition.
   */
  registerLanguage(definition) {
    return this.registry.registerLanguage(definition);
  }

  /**
   * @brief Get a language definition.
   * @param {string} id Identifier.
   * @param {{fallback?: boolean}} options Lookup options.
   * @returns {Object} Language definition.
   */
  getLanguage(id, options = {}) {
    return this.registry.getLanguage(id, options);
  }

  /**
   * @brief List known languages.
   * @returns {Array<string>} Canonical language ids.
   */
  listLanguages() {
    return this.registry.listLanguages();
  }

  /**
   * @brief Tokenise source using a registered language.
   * @param {string} source Source code.
   * @param {{language?: string, fallback?: boolean}} options Tokenisation options.
   * @returns {Array<Token>} Absolute-range tokens.
   */
  tokenise(source, options = {}) {
    const language = this.getLanguage(options.language || 'plaintext', { fallback: options.fallback === true });
    return tokeniseSource(source, language, { strict: true });
  }

  /**
   * @brief Render a token stream as HTML.
   * @param {string} source Source code.
   * @param {Array<Token>} tokens Tokens to render.
   * @param {{classPrefix?: string}} options Rendering options.
   * @returns {string} HTML string for the inner contents of a code element.
   */
  renderHtml(source, tokens, options = {}) {
    return renderHtml(source, tokens, options);
  }

  /**
   * @brief Convenience method to tokenise and render source.
   * @param {string} source Source code.
   * @param {{language?: string, fallback?: boolean, classPrefix?: string}} options Highlight options.
   * @returns {string} HTML string.
   */
  highlight(source, options = {}) {
    const languageId = options.language || 'plaintext';
    const tokens = this.tokenise(source, {
      language: languageId,
      fallback: options.fallback === true
    });
    return this.renderHtml(source, tokens, { classPrefix: options.classPrefix || 'cg' });
  }
}

export const defaultRegistrySingleton = defaultRegistry;
export { registerLanguage, getLanguage, listLanguages, plaintext, json, javascript, cpp, ziron, fracture };
export default Codeglint;
export { renderHtml };

if (!globalThis.Codeglint) {
  globalThis.Codeglint = Codeglint;
}
