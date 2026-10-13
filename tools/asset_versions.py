#!/usr/bin/env python3
"""Validate cache-busted runtime asset versions across source and public pages."""

from __future__ import annotations

import re
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
ASSET_VERSIONS = {
    "styles.css": "20261013m",
    "article-loader.js": "20261013d",
    "academy-loader.js": "20261013c",
    "tools.js": "20261013a",
}


def page_paths() -> tuple[Path, ...]:
    return (ROOT / "index.html", ROOT / "404.html", *sorted((ROOT / "pages").glob("*.html")),
            ROOT / "public" / "index.html", ROOT / "public" / "404.html",
            *sorted((ROOT / "public" / "pages").glob("*.html")))


def expected_reference(asset: str, version: str) -> re.Pattern[str]:
    return re.compile(rf"{re.escape(asset)}\?v={re.escape(version)}(?:[\"'])")


def check() -> list[str]:
    errors: list[str] = []
    for page in page_paths():
        source = page.read_text(encoding="utf-8")
        for asset, version in ASSET_VERSIONS.items():
            if asset in source and not expected_reference(asset, version).search(source):
                errors.append(f"{page.relative_to(ROOT)}: {asset} debe usar v={version}")
    return errors


if __name__ == "__main__":
    failures = check()
    if failures:
        print("\n".join(failures))
        raise SystemExit(1)
    print("Asset versions are synchronized.")
