#!/usr/bin/env bash
set -euo pipefail

echo "Checking environment: node, cargo, uv"

command -v node >/dev/null 2>&1 || { echo "node not found."; }
command -v cargo >/dev/null 2>&1 || { echo "cargo not found."; }
command -v uv >/dev/null 2>&1 || { echo "uv not found."; }

echo "Done. Please install missing tools as needed."
