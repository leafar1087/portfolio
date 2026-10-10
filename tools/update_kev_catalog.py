#!/usr/bin/env python3
"""Create the local, publishable CISA KEV snapshot used by the CVE explorer."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from urllib.request import Request, urlopen


ROOT = Path(__file__).resolve().parent.parent
SOURCE_URL = "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json"
OUTPUT = ROOT / "data" / "cisa-kev.json"


def read_catalog(input_path: Path | None) -> dict:
    if input_path:
        return json.loads(input_path.read_text(encoding="utf-8"))
    request = Request(SOURCE_URL, headers={"User-Agent": "rafaelperezllorca-portfolio/1.0"})
    with urlopen(request, timeout=30) as response:
        return json.load(response)


def compact(catalog: dict) -> dict:
    vulnerabilities = []
    for item in catalog.get("vulnerabilities", []):
        cve_id = item.get("cveID", "")
        if not cve_id.startswith("CVE-"):
            continue
        vulnerabilities.append({
            "cveId": cve_id,
            "vendor": item.get("vendorProject", ""),
            "product": item.get("product", ""),
            "name": item.get("vulnerabilityName", ""),
            "dateAdded": item.get("dateAdded", ""),
            "dueDate": item.get("dueDate", ""),
            "ransomware": item.get("knownRansomwareCampaignUse", "Unknown"),
            "description": item.get("shortDescription", ""),
            "cwes": item.get("cwes", []),
        })
    vulnerabilities.sort(key=lambda item: (item["dateAdded"], item["cveId"]), reverse=True)
    return {
        "source": {
            "name": "CISA Known Exploited Vulnerabilities Catalog",
            "url": SOURCE_URL,
            "catalogVersion": catalog.get("catalogVersion", ""),
            "dateReleased": catalog.get("dateReleased", ""),
        },
        "vulnerabilities": vulnerabilities,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, help="existing CISA KEV JSON; avoids a network request")
    parser.add_argument("--output", type=Path, default=OUTPUT)
    args = parser.parse_args()
    snapshot = compact(read_catalog(args.input))
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(snapshot, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    print(f"Wrote {len(snapshot['vulnerabilities'])} CISA KEV records to {args.output}.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
