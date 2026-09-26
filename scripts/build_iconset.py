#!/usr/bin/env python3
"""Build Egern icon gallery subscriptions from the reviewed catalog."""

import csv
import json
from pathlib import Path
from urllib.parse import quote


ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "iconset" / "catalog.tsv"
SOURCES = {
    "luestr": ("luestr/IconResource", "173d41fe13f74590ab9449ee1ae1feb7be2f2b5b", "App_icon/120px"),
    "qure": ("Koolson/Qure", "b16b260625f873266f6a6a9b88710132774997b8", "IconSet/Color"),
    "local": ("shengrui123/Egern-YouTube-Plugin", "main", "iconset/png"),
}


def main():
    groups = {"all": [], "china": [], "global": []}
    seen_names = set()
    with CATALOG.open(encoding="utf-8", newline="") as file:
        for row in csv.DictReader(file, delimiter="\t"):
            region, name, source, filename = (row[key].strip() for key in ("region", "name", "source", "filename"))
            if region not in ("china", "global") or source not in SOURCES or not filename.endswith(".png"):
                raise ValueError(f"Invalid catalog row: {row}")
            if source == "local" and not (ROOT / "iconset" / "png" / filename).is_file():
                raise ValueError(f"Missing local icon: {filename}")
            if name.casefold() in seen_names:
                raise ValueError(f"Duplicate icon name: {name}")
            seen_names.add(name.casefold())
            repo, revision, directory = SOURCES[source]
            url = f"https://raw.githubusercontent.com/{repo}/{revision}/{directory}/{quote(filename)}"
            item = {"name": name, "url": url}
            groups[region].append(item)
            groups["all"].append(item)

    for key, title in (("all", "常用国内外 App 与网站"), ("china", "常用国内 App 与网站"), ("global", "常用海外 App 与网站")):
        path = ROOT / "iconset" / f"Egern-Icons-{key.title()}.json"
        path.write_text(json.dumps({"name": title, "icons": groups[key]}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"{path.relative_to(ROOT)}: {len(groups[key])} icons")


if __name__ == "__main__":
    main()
