import assert from 'node:assert/strict';
import test from 'node:test';
import { Codeglint } from '../../src/index.js';

test('tokenises C++ source and preserves offsets', () => {
  const glint = new Codeglint();
  const code = '#include <iostream>\n\nint main() {\n  std::cout << "Hello World" << std::endl;\n  return 0;\n}';
  const tokens = glint.tokenise(code, { language: 'cpp' });
  
  assert.ok(tokens.length > 0);
  const hasKeyword = tokens.some((token) => token.type === 'keyword');
  const hasString = tokens.some((token) => token.type === 'string');
  const hasNumber = tokens.some((token) => token.type === 'number');
  const hasPunctuation = tokens.some((token) => token.type === 'punctuation');
  const hasOperator = tokens.some((token) => token.type === 'operator');
  
  assert.equal(hasKeyword, true, 'Should have keywords');
  assert.equal(hasString, true, 'Should have strings');
  assert.equal(hasNumber, true, 'Should have numbers');
  assert.equal(hasPunctuation, true, 'Should have punctuation');
  assert.equal(hasOperator, true, 'Should have operators');
  assert.ok(tokens.every((token) => token.start >= 0 && token.end > token.start));
});

test('tokenises C source', () => {
  const glint = new Codeglint();
  const code = 'void main() { printf("Hello"); }';
  const tokens = glint.tokenise(code, { language: 'c' });
  
  assert.ok(tokens.length > 0);
  assert.ok(tokens.some((token) => token.type === 'keyword'));
});

test('handles block comments', () => {
  const glint = new Codeglint();
  const code = 'int x = 1; /* start comment \n still in comment \n end comment */ int y = 2;';
  const tokens = glint.tokenise(code, { language: 'cpp' });
  
  const comments = tokens.filter(t => t.type === 'comment');
  assert.ok(comments.length > 0);
  assert.ok(tokens.some(t => t.type === 'number'));
});
