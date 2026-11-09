import assert from 'node:assert/strict';
import test from 'node:test';
import { Codeglint } from '../../src/index.js';

test('tokenises JSON source and preserves offsets', () => {
  const glint = new Codeglint();
  const tokens = glint.tokenise('{"enabled": true, "count": 3, "name": "alpha"}', { language: 'json' });
  assert.ok(tokens.length > 0);
  const hasString = tokens.some((token) => token.type === 'string' || token.type === 'property');
  const hasBoolean = tokens.some((token) => token.type === 'boolean');
  const hasNumber = tokens.some((token) => token.type === 'number');
  assert.equal(hasString, true);
  assert.equal(hasBoolean, true);
  assert.equal(hasNumber, true);
  assert.ok(tokens.every((token) => token.start >= 0 && token.end > token.start));
});
