// -------------------------------------------------------------
//
//!\file fracture.test.js
//!\brief Fracture lexer regression checks.
//!\author Colin J.D. Stewart
//
// -------------------------------------------------------------
//
//           Copyright (c) 2026. Colin J.D. Stewart.
//                   All rights reserved
//
// -------------------------------------------------------------

import assert from 'node:assert/strict';
import test from 'node:test';
import { Codeglint, fracture } from '../../src/index.js';

test('highlights Fracture calls, ranges, declarations and literals', () => {
  const glint = new Codeglint();
  assert.equal(glint.getLanguage('frac').id, fracture.id);

  const source = [
    'import math;',
    'f::sample [n] -> int { ret n; }',
    'for [i in 1..3] do { [i] print; }',
    'let result = [2, 3] math::pow;',
    'let task = [name = "Compile", enabled = true, next = null];',
    '[task.name, 12.5e-2, false] print;',
    '[2] items:contains >> print;'
  ].join('\r\n');
  const classified = glint.tokenise(source, { language: 'frac' })
    .map(({ type, start, end }) => [type, source.slice(start, end)]);

  for (const [type, value] of [
    ['keyword', 'import'], ['keyword', 'f::'], ['function', 'sample'], ['type', 'int'],
    ['number', '1'], ['operator', '..'], ['number', '3'], ['operator', '->'],
    ['punctuation', '::'], ['function', 'pow'], ['property', 'name'],
    ['number', '12.5e-2'], ['boolean', 'true'], ['boolean', 'false'], ['constant', 'null'],
    ['function', 'contains'], ['operator', '>>'], ['function', 'print']
  ]) {
    assert.ok(classified.some(([actualType, actualValue]) => actualType === type && actualValue === value), value);
  }
});

test('keeps multiline comments and escaped strings intact and escapes HTML', () => {
  const source = '#!/usr/bin/env fracture\n/* if\n*/ ["<tag>\\" // text\ncontinued"] print;';
  const glint = new Codeglint();
  const classified = glint.tokenise(source, { language: 'fracture' })
    .map(({ type, start, end }) => [type, source.slice(start, end)]);
  assert.deepEqual(classified.filter(([type]) => ['comment', 'string'].includes(type)), [
    ['comment', '#!/usr/bin/env fracture'], ['comment', '/* if'], ['comment', '*/'],
    ['string', '"<tag>\\" // text'], ['string', 'continued"']
  ]);
  const html = glint.highlight(source, { language: 'fracture' });
  assert.match(html, /&lt;tag&gt;/);
  assert.doesNotMatch(html, /<tag>/);
});
