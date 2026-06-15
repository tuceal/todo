#!/bin/bash
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

if ! command -v pipx >/dev/null 2>&1; then
  python3 -m pip install --user pipx
  python3 -m pipx ensurepath
  export PATH="$HOME/.local/bin:$PATH"
fi

if ! command -v markitdown-mcp >/dev/null 2>&1; then
  pipx install git+https://github.com/trsdn/markitdown-mcp.git
fi

pipx inject markitdown-mcp 'markitdown[all]' openpyxl xlrd pandas pymupdf pdfplumber

echo "export PATH=\"$HOME/.local/bin:\$PATH\"" >> "$CLAUDE_ENV_FILE"
