# Portal SDK 2.1.1.0 — Linux / Godot 4.7

## Prerequisites

- **Godot 4.7** (`godot` on `PATH`).
- **Python 3 with `venv` + `pip`**, reachable as `python3`:
  - Debian/Ubuntu: `apt install python3 python3-venv` (`python3` alone is not enough).
  - Arch/Fedora: stock `python`/`python3` already bundles both.
  - macOS: any `python3` on `PATH` (python.org, Homebrew, or Xcode CLT).

## Install (overlay)

This repo is a patch set, not a full SDK: `docs/`, `python/` (Windows-only bundle), `FbExportData/` (level list, export data, thumbnails — required at runtime), `GodotProject/raw/` (editor-ignored source metadata), and `code/gdplugins/terrain_3d/` (dormant, unwired upstream staging) are pruned and must come from the official SDK. Extract pristine **2.1.1.0**, then point the installer at it — it refuses to install on a version mismatch unless forced:

```bash
./install.sh /path/to/PortalSDK-2.1.1.0
./install.sh /path/to/PortalSDK-2.1.1.0 --force
```

## Start

Open Godot 4.7's project manager, choose **Import**, and select the `GodotProject` folder. The first open runs a long initial scan/import — let it finish. Then open a scene under `GodotProject/levels` or `GodotProject/mods`; use the Portal Tools dock to export levels or create custom modes. Level exports go to `export/levels`, experience bundles to `export`.

From a terminal, the equivalent is:

```bash
godot --editor --path GodotProject
```

## Setup (before first export)

Opening the project needs no setup. Exporting levels or experience bundles does — both run through the Python environment. Press the Portal Tools dock's **Setup** button in the editor before exporting.

## Provenance and changes

Linux port originally developed against 1.3.2.0/1.3.3.0 and refined on 1.4.3.0, re-applied here onto pristine **2.1.1.0** (which retains its new carrier/community-map data, terrain_3d plugin, and bundle exporter schema — no older SDK files were substituted wholesale).

- Native setup and level export, with project-relative paths resolved to absolute paths (`portal_plugin.gd`: `read_config()` + `venv_python()`).
- Setup calls `python3 -m venv` / `pip` directly via `OS.execute` argv arrays — no shell strings, no helper scripts; existing environments are updated, not recursively deleted (`portal_tools_dock.gd`).
- Native cryptographic UUIDv4 generation for experience attachments, no Windows-Python subprocess (`attachment.gd`).
- Fixed experience export directory creation and write-error handling (`experience_exporter_export.gd`, also `.spatial.json` export-path lookup).
- Corrected gameplay resource capitalization in 89 supplied scenes (`tests/fix_resource_case.py`; originals under `.linux-port-backup/`, which is git-ignored and not committed).
- Fixed the detached object-library preview viewport leaking at shutdown (`scene_library.gd`).
- Matching plugin changes live in the single canonical copy at `GodotProject/addons` (the copy Godot loads; upstream's `code/gdplugins` staging duplicates are untracked — they had already drifted, e.g. stale `terrain_decal/bounds.json`).
- New: `tests/` (scene case-fix audit), `export/levels/`.
- Dropped bulk (overlay from the official SDK): `docs/`, `python/`, `FbExportData/`, `GodotProject/raw/`, `code/gdplugins/terrain_3d/`. Note this also drops Windows setup support — `python/` was the Windows interpreter bundle, and that path is untested here.

## Asset-cache caveat

This repo does **not** track `GodotProject/.godot/imported` (git-ignored), and the SDK ships no source `.glb` files in `GodotProject/raw/models` (only import metadata). On first editor launch Godot will import what it can; pre-existing cached models load if you reuse a `.godot` directory from a matching SDK copy. **Do not delete `.godot` to troubleshoot** unless you have first obtained the matching model sources. The Portal Tools model download remains available.

## Tracking future SDK updates

This repo tracks the official SDK as an overlay, so upstream changes stay visible as diffs. When a new SDK drops, sync its tracked subset over a clean checkout:

```bash
rsync -a --delete --exclude='.godot' --exclude='*.exe' --exclude='venv/' \
  --exclude='__pycache__/' --exclude='docs/' --exclude='python/' \
  --exclude='FbExportData/' --exclude='GodotProject/raw/' \
  --exclude='code/gdplugins/terrain_3d/' "/path/to/new/SDK/" .
git status  # review, then commit the pristine update first, port fixes second
```

Notes:

- Keep the commit discipline (pristine update, then Linux-port re-application, then docs) so the port stays rebaseable.
- `code/gdplugins/bf_portal/` and `code/gdplugins/scene-library/` are intentionally untracked. Diff the new SDK's copies of those trees against this repo's `GodotProject/addons/` before assuming they match — upstream lets them drift.
- Never commit `.godot/`, `venv/`, `export/` contents, `*.uid` noise, or validation logs (all ignored).
