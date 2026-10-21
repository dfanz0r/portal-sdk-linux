"""Audit resource-path case; --fix applies exact-case corrections with backups."""
import argparse
from pathlib import Path
import re
import shutil

ROOT = Path(__file__).resolve().parents[1]
PROJECT = ROOT / "GodotProject"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--fix", action="store_true")
    args = parser.parse_args()
    paths = {}
    for folder in ("objects", "scripts", "static", "addons", "levels", "mods"):
        for path in (PROJECT / folder).rglob("*"):
            if path.is_file():
                relative = path.relative_to(PROJECT).as_posix()
                paths.setdefault(relative.lower(), []).append(relative)
    changed = 0
    for base in (PROJECT, ROOT / "unsupported"):
        for path in base.rglob("*.tscn"):
            original = path.read_text(encoding="utf-8")

            def correct(match):
                relative = match[1]
                if (PROJECT / relative).exists():
                    return match[0]
                candidates = paths.get(relative.lower(), [])
                if len(candidates) == 1:
                    return 'path="res://' + candidates[0] + '"'
                return match[0]

            fixed = re.sub(r'path="res://([^"]+)"', correct, original)
            if fixed != original:
                changed += 1
                print(path.relative_to(ROOT))
                if args.fix:
                    backup = ROOT / ".linux-port-backup" / path.relative_to(ROOT)
                    backup.parent.mkdir(parents=True, exist_ok=True)
                    if not backup.exists():
                        shutil.copy2(path, backup)
                    path.write_text(fixed, encoding="utf-8")
    print(f"{changed} scenes {'fixed' if args.fix else 'need correction'}")
    return 0 if args.fix or changed == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
