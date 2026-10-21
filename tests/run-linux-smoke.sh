#!/usr/bin/env bash
set -euo pipefail
root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$root"
python3 tests/fix_resource_case.py
log="$(mktemp)"
trap 'rm -f "$log"' EXIT
"${GODOT_BIN:-godot}" --headless --path "$root/GodotProject" --script "$root/tests/linux_smoke.gd" > "$log" 2>&1 || { tee /dev/stderr < "$log"; exit 1; }
tee < "$log"
# Godot can return zero even after script/resource errors.
if grep -Eq 'SCRIPT ERROR:|ERROR:|LINUX SMOKE: FAIL' "$log"; then
    exit 1
fi
grep -q 'LINUX SMOKE: PASS' "$log"
