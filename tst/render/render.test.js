import assert from 'node:assert/strict';
import test from 'node:test';
import { Codeglint } from '../../src/index.js';

test('renders HTML and escapes unsafe content', () => {
  const glint = new Codeglint();
  const html = glint.highlight('<script>alert(1)</script>', { language: 'plaintext' });
  assert.match(html, /&lt;script&gt;/);
  assert.doesNotMatch(html, /<script>/);
});

test('rejects unsafe token categories', () => {
  const glint = new Codeglint();
  assert.throws(() => glint.renderHtml('abc', [{ type: 'hacked', start: 0, end: 3 }]), /Unsafe token category|Token ranges/);
});
