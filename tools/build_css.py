#!/usr/bin/env python3
"""Build and verify the runtime stylesheet from the ordered CSS modules."""

from __future__ import annotations

import argparse
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
MODULES = (
    "00-fonts.css",
    "01-variables.css",
    "02-base.css",
    "03-layout.css",
    "04-components.css",
    "05-pages.css",
    "06-utilities.css",
    "07-courses.css",
)
OUTPUT = ROOT / "css" / "styles.css"


def build() -> str:
    """Return the deterministic bundle consumed by every public page."""
    modules_dir = ROOT / "css" / "modules"
    return "\n".join((modules_dir / name).read_text(encoding="utf-8").rstrip() for name in MODULES) + "\n"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="fail when css/styles.css is outdated")
    args = parser.parse_args()
    bundle = build()

    if args.check:
        if not OUTPUT.is_file() or OUTPUT.read_text(encoding="utf-8") != bundle:
            print("css/styles.css is not synchronized with css/modules/; run python3 tools/build_css.py")
            return 1
        print("css/styles.css is synchronized.")
        return 0

    OUTPUT.write_text(bundle, encoding="utf-8")
    print(f"Built {OUTPUT.relative_to(ROOT)}.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
