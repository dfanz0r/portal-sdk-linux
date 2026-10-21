#!/usr/bin/env bash
# Install this Linux-port overlay onto an official PortalSDK extract.
#
# Usage: ./install.sh /path/to/PortalSDK-2.1.1.0 [--force]
#
# Refuses to install when the target's sdk.version.json does not match this
# repo's, unless --force is given.
set -euo pipefail

repo="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
target="${1:-}"
force=0
if [ "${2:-}" = "--force" ]; then
	force=1
fi

if [ -z "$target" ]; then
	echo "Usage: $0 /path/to/PortalSDK [-force]" >&2
	echo "       $0 /path/to/PortalSDK --force" >&2
	exit 2
fi

for f in "sdk.version.json" "GodotProject/project.godot" "FbExportData/level_info.json"; do
	if [ ! -f "$target/$f" ]; then
		echo "Not a PortalSDK: missing $target/$f" >&2
		exit 1
	fi
done

expected="$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["version"])' "$repo/sdk.version.json")"
actual="$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["version"])' "$target/sdk.version.json")"
if [ "$expected" != "$actual" ]; then
	echo "Version mismatch: repo targets $expected, target SDK is $actual" >&2
	if [ "$force" -eq 0 ]; then
		echo "Re-run with --force to install anyway." >&2
		exit 1
	fi
	echo "Continuing with --force." >&2
fi

rsync -a \
	--exclude='/.git/' \
	--exclude='/.godot/' \
	--exclude='/venv/' \
	--exclude='/export/' \
	--exclude='__pycache__/' \
	"$repo/" "$target/"
mkdir -p "$target/export/levels"

revision="$(git -C "$repo" rev-parse --short HEAD 2>/dev/null || echo unknown)"
echo "Installed Linux port ($revision, SDK $expected) into $target"
