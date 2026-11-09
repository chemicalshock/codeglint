import assert from 'node:assert/strict';
import test from 'node:test';
import { Codeglint, plaintext, json, javascript } from '../../src/index.js';

test('registers default languages', () => {
  const glint = new Codeglint();
  assert.ok(glint.getLanguage('plaintext'));
  assert.ok(glint.getLanguage('json'));
  assert.ok(glint.getLanguage('javascript'));
});

test('resolves aliases and rejects duplicate ids', () => {
  const glint = new Codeglint();
  assert.equal(glint.getLanguage('text').id, 'plaintext');
  assert.throws(() => glint.registerLanguage({ id: 'plaintext', initialState() { return null; }, tokeniseLine() { return []; } }));
});
