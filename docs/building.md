# Building and running Codeglint

## Prerequisites

- Node.js 18+ or a compatible runtime
- GNU Make

## Local workflow

```bash
make test
make build
make demo
```

For a local browser preview without a server, open the demo directly from disk:

```bash
file:///home/colin/projects/colin/codeglint/demo/index.html
```

This uses the standalone browser bundle in `demo/codeglint-standalone.js`, which avoids module-import restrictions from `file://` pages and still renders safely.

To serve the demo over HTTP instead:

```bash
cd demo
python3 -m http.server 8000
```

Then open `http://localhost:8000/` in a browser.

## Distribution outputs

The build workflow creates ESM output under `bld/esm/`, a minified copy under `bld/min/` and packaged archives under `bld/pkg/`.

When running the repo in a fresh checkout, use:

```bash
make clean && make all && make package
```
