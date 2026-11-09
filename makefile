NODE ?= node
VERSION := 0.1.0
BUILD_DIR := bld
ESM_DIR := $(BUILD_DIR)/esm
MIN_DIR := $(BUILD_DIR)/min
PKG_DIR := $(BUILD_DIR)/pkg

.PHONY: all help check test build minify package demo clean distclean

all: test build minify package

help:
	@echo "Codeglint build targets:"
	@echo "  make all        Run tests and produce distribution outputs"
	@echo "  make check      Validate JavaScript syntax"
	@echo "  make test       Run unit tests"
	@echo "  make build      Prepare ESM build in bld/esm"
	@echo "  make minify     Prepare minified copies in bld/min"
	@echo "  make package    Archive distributables under bld/pkg"
	@echo "  make demo       Prepare demo assets"
	@echo "  make clean      Remove generated Build outputs"
	@echo "  make distclean  Remove build outputs and caches"

check:
	@find src tst -type f -name '*.js' -print0 | xargs -0 -n1 $(NODE) --check

test: check
	@$(NODE) --test

build:
	@mkdir -p $(ESM_DIR)/core $(ESM_DIR)/languages $(ESM_DIR)/render $(ESM_DIR)/themes
	@cp -R src/*.js $(ESM_DIR)/
	@cp -R src/core/*.js $(ESM_DIR)/core/
	@cp -R src/languages/*.js $(ESM_DIR)/languages/
	@cp -R src/render/*.js $(ESM_DIR)/render/
	@cp -R src/themes/*.css $(ESM_DIR)/themes/
	@cp README.md $(ESM_DIR)/README.md

minify: build
	@mkdir -p $(MIN_DIR)
	@cp -R $(ESM_DIR)/* $(MIN_DIR)/
	@find $(MIN_DIR) -type f -name '*.js' -exec sh -c 'for f in "$$@"; do cp "$$f" "$${f%.js}.min.js"; done' _ {} +

package: test build minify
	@mkdir -p $(PKG_DIR)
	@tar -czf $(PKG_DIR)/codeglint-$(VERSION).tar.gz README.md docs src bld/esm bld/min 2>/dev/null || true
	@zip -rq $(PKG_DIR)/codeglint-$(VERSION).zip README.md docs src bld/esm bld/min 2>/dev/null || true

demo: build
	@cp -R demo $(BUILD_DIR)/demo

clean:
	@rm -rf $(BUILD_DIR)

distclean: clean
	@rm -rf node_modules
