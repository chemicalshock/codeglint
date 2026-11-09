// -------------------------------------------------------------
//
//!\file registry.js
//!\brief Registry and language registration for Codeglint.
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
 * @brief Normalise a language identifier.
 * @param {string} value Language identifier.
 * @returns {string} Lower-case ASCII identifier.
 */
export function normaliseLanguageId(value) {
  if (value === undefined || value === null) {
    return 'plaintext';
  }

  return String(value).trim().toLowerCase();
}

/**
 * @class LanguageRegistry
 * @brief Stores language definitions and aliases.
 */
export class LanguageRegistry {
  constructor() {
    this.languages = new Map();
    this.aliases = new Map();
  }

  /**
   * @brief Register a language definition.
   * @param {Object} definition Definition containing id, aliases, tokeniseLine, initialState.
   * @returns {Object} Registered definition.
   */
  registerLanguage(definition) {
    if (!definition || typeof definition !== 'object') {
      throw new CodeglintError('Language definition must be an object.');
    }

    const id = normaliseLanguageId(definition.id || definition.name);
    if (!id || id.length === 0) {
      throw new CodeglintError('Language definition requires an id.');
    }

    if (typeof definition.initialState !== 'function') {
      throw new CodeglintError(`Language '${id}' must provide initialState().`);
    }

    if (typeof definition.tokeniseLine !== 'function') {
      throw new CodeglintError(`Language '${id}' must provide tokeniseLine().`);
    }

    if (this.languages.has(id)) {
      throw new CodeglintError(`Language '${id}' already registered.`);
    }

    const aliases = Array.isArray(definition.aliases) ? definition.aliases : [];
    for (const alias of aliases) {
      const key = normaliseLanguageId(alias);
      if (key === id) {
        continue;
      }
      if (this.languages.has(key) || this.aliases.has(key)) {
        const existingId = this.aliases.get(key) || key;
        if (existingId !== id) {
          throw new CodeglintError(`Duplicate alias '${alias}' for language '${id}'.`);
        }
        continue;
      }
      this.aliases.set(key, id);
    }

    this.languages.set(id, definition);
    return definition;
  }

  /**
   * @brief Check whether a language definition is present.
   * @param {string} id Language identifier.
   * @returns {boolean} True when it is known.
   */
  hasLanguage(id) {
    const key = normaliseLanguageId(id || 'plaintext');
    return this.languages.has(key) || this.aliases.has(key);
  }

  /**
   * @brief Resolve a language identifier.
   * @param {string} id Language identifier.
   * @param {{fallback?: boolean}} options Optional lookup options.
   * @returns {Object} Language definition.
   */
  getLanguage(id, options = {}) {
    const key = normaliseLanguageId(id || 'plaintext');
    const language = this.languages.get(key) || this.languages.get(this.aliases.get(key));
    if (language) {
      return language;
    }

    if (options.fallback === true || key === 'plaintext') {
      const fallback = this.languages.get('plaintext');
      if (fallback) {
        return fallback;
      }
    }

    throw new CodeglintError(`Unknown language '${id}'.`);
  }

  /**
   * @brief Return every registered canonical language name.
   * @returns {Array<string>} List of ids.
   */
  listLanguages() {
    return [...this.languages.keys()].sort();
  }
}

export const defaultRegistry = new LanguageRegistry();

export function registerLanguage(definition) {
  return defaultRegistry.registerLanguage(definition);
}

export function getLanguage(id, options = {}) {
  return defaultRegistry.getLanguage(id, options);
}

export function listLanguages() {
  return defaultRegistry.listLanguages();
}
