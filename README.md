# Codeglint

Codeglint is a lightweight, read-only code highlighter for web pages and JavaScript applications. It tokenises source code into safe HTML fragments without executing the source, and it keeps tokenisation, rendering and theme styling separate.

## Quick start

```js
import { Codeglint } from './src/index.js';

const glint = new Codeglint();
const html = glint.highlight('{"enabled": true, "count": 3}', { language: 'json' });
console.log(html);
```

The default registry includes the `plaintext`, `json` and `javascript` language definitions.

## Browser usage

```html
<link rel="stylesheet" href="./src/themes/base.css" />
<link rel="stylesheet" href="./src/themes/light.css" />
<pre><code class="codeglint" id="output"></code></pre>
<script type="module">
  import { Codeglint } from './src/index.js';
  const glint = new Codeglint();
  const result = glint.highlight('const value = 42;', { language: 'javascript' });
  document.getElementById('output').innerHTML = result;
</script>
```

## Build and test

The authoritative build interface is GNU Make:

```bash
make test
make build
make minify
make package
```

The repository is intentionally dependency-free at runtime and uses the native Node.js test runner for validation.
