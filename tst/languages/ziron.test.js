// -------------------------------------------------------------
//
//!\file ziron.test.js
//!\brief Ziron lexer regression checks.
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
import { Codeglint } from '../../src/index.js';

test('recognizes Ziron declarations and assembly without changing offsets', () => {
  const source = "#include 'x.zir';\r\nConst Value: DWORD = 0x64;\r\n@again: MOV AH, r10d // ret";
  const tokens = new Codeglint().tokenise(source, { language: 'zir' });
  const classified = tokens.map(({ type, start, end }) => [type, source.slice(start, end)]);
  for (const token of [
    ['preprocessor', '#include'], ['string', "'x.zir'"], ['keyword', 'Const'], ['type', 'DWORD'],
    ['number', '0x64'], ['attribute', '@again'], ['function', 'MOV'], ['constant', 'AH'],
    ['constant', 'r10d'], ['comment', '// ret']
  ]) {
    assert.ok(classified.some(pair => pair.join() === token.join()), token.join());
  }
});

test('protects strings, multiline comments, and HTML-like source', () => {
  const glint = new Codeglint();
  const source = "/* mov\nrax */ $echo '<script>// text</script>';\nret";
  const tokens = glint.tokenise(source, { language: 'ziron' });
  const classified = tokens.map(({ type, start, end }) => [type, source.slice(start, end)]);
  assert.deepEqual(classified.slice(0, 4), [
    ['comment', '/* mov'], ['comment', 'rax */'], ['preprocessor', '$echo'], ['string', "'<script>// text</script>'"]
  ]);
  const html = glint.highlight(source, { language: 'ziron' });
  assert.match(html, /&lt;script&gt;/);
  assert.doesNotMatch(html, /<script>/);
});
