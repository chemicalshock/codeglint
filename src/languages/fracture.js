// -------------------------------------------------------------
//
//!\file fracture.js
//!\brief Fracture lexer for Codeglint.
//!\author Colin J.D. Stewart
//
// -------------------------------------------------------------
//
//           Copyright (c) 2026. Colin J.D. Stewart.
//                   All rights reserved
//
// -------------------------------------------------------------

const KEYWORDS = new Set(['do', 'else', 'for', 'foreach', 'forever', 'if', 'import', 'let', 'ret', 'while']);
const TYPES = new Set(['array', 'bool', 'float', 'int', 'string', 'void']);
const CALL_PREFIXES = new Set([':', '::', ']', '>>', 'f::']);
const TOKEN = new RegExp([
  /(?<space>\s+)/,
  /(?<lineComment>\/\/[^\r\n]*)/,
  /(?<declaration>f::)/,
  /(?<word>[A-Za-z_][A-Za-z0-9_]*)/,
  /(?<number>\d+(?:\.(?!\.)\d*)?(?:[eE][+-]?\d+)?)/,
  /(?<operator>>>|->|\.\.|==|!=|<=|>=|&&|\|\||--|[+\-*/%=<>!&|])/,
  /(?<punctuation>::|[{}[\](),.;:])/,
  /./
].map(pattern => pattern.source).join('|'), 'uy');
const STRING_TAIL = /(?:\\[\s\S]|[^"\\])*("|\\?$)/y;

/**
 * @brief Classify a word using Fracture keywords and call syntax.
 * @param {string} word Identifier text.
 * @param {string} previous The preceding significant token.
 * @returns {string} The token category.
 */
function classifyWord(word, previous) {
  if (KEYWORDS.has(word)) return 'keyword';
  if (TYPES.has(word)) return 'type';
  if (word === 'in') return 'operator';
  if (word === 'true' || word === 'false') return 'boolean';
  if (word === 'null') return 'constant';
  if (previous === '.') return 'property';
  if (CALL_PREFIXES.has(previous)) return 'function';
  return 'identifier';
}

/**
 * @brief Tokenise one Fracture line, preserving open comments and strings.
 * @param {string} line Source line.
 * @param {Object} state State carried from the preceding line.
 * @returns {Object} Line-relative tokens and the next scanner state.
 */
export function tokeniseFractureLine(line, state = {}) {
  let { continuation, previous } = state;
  if (state.firstLine && line.startsWith('#!')) {
    return { tokens: [{ type: 'comment', start: 0, end: line.length }], state: {} };
  }

  const tokens = [];
  let index = 0;
  while (index < line.length) {
    const start = index;
    let type;
    if (continuation === 'comment' || line.startsWith('/*', index)) {
      const close = line.indexOf('*/', index + (continuation ? 0 : 2));
      index = close === -1 ? line.length : close + 2;
      continuation = close === -1 ? 'comment' : undefined;
      type = 'comment';
    } else if (continuation === 'string' || line[index] === '"') {
      STRING_TAIL.lastIndex = index + (continuation ? 0 : 1);
      const tail = STRING_TAIL.exec(line);
      index = STRING_TAIL.lastIndex;
      continuation = tail[1] === '"' ? undefined : 'string';
      type = 'string';
    } else {
      TOKEN.lastIndex = index;
      const match = TOKEN.exec(line);
      const { space, lineComment, declaration, word, number, operator, punctuation } = match.groups;
      index = TOKEN.lastIndex;
      if (space) continue;
      if (word) type = classifyWord(word, previous);
      else if (lineComment) type = 'comment';
      else if (declaration) type = 'keyword';
      else if (number) type = 'number';
      else if (operator) type = 'operator';
      else type = punctuation ? 'punctuation' : 'plain';
    }

    tokens.push({ type, start, end: index });
    if (type !== 'comment') previous = line.slice(start, index);
  }

  return { tokens, state: { continuation, previous } };
}

export const fracture = {
  id: 'fracture',
  aliases: ['frac'],
  initialState() {
    return { firstLine: true };
  },
  tokeniseLine: tokeniseFractureLine
};

export default fracture;
