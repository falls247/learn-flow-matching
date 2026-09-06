#!/usr/bin/env python3
"""Validate the static GitHub Pages site without third-party dependencies."""

from __future__ import annotations

from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlparse
import sys

ROOT = Path(__file__).resolve().parents[1]
INDEX = ROOT / "index.html"

REQUIRED_SECTIONS = {
    "overview",
    "chunk",
    "horizon",
    "flow",
    "training",
    "inference",
    "dit",
    "backbone",
    "embodiment",
    "rtc",
    "end-to-end",
    "industrial",
    "misconceptions",
    "glossary",
}


class SiteParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.ids: set[str] = set()
        self.refs: list[tuple[str, str]] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attr_map = dict(attrs)
        element_id = attr_map.get("id")
        if element_id:
            self.ids.add(element_id)
        for key in ("href", "src"):
            value = attr_map.get(key)
            if value:
                self.refs.append((key, value))


def main() -> int:
    errors: list[str] = []

    if not INDEX.exists():
        print("ERROR: index.html not found", file=sys.stderr)
        return 1

    parser = SiteParser()
    parser.feed(INDEX.read_text(encoding="utf-8"))

    missing_sections = sorted(REQUIRED_SECTIONS - parser.ids)
    if missing_sections:
        errors.append(f"missing required section ids: {', '.join(missing_sections)}")

    for kind, raw_ref in parser.refs:
        ref = raw_ref.strip()
        parsed = urlparse(ref)

        if parsed.scheme in {"http", "https", "mailto", "tel", "data"} or ref.startswith("//"):
            continue

        if ref.startswith("#"):
            target = unquote(ref[1:])
            if target and target not in parser.ids:
                errors.append(f"broken internal anchor: {ref}")
            continue

        if ref.startswith("/"):
            errors.append(
                f"root-absolute {kind} is unsafe for project Pages base path: {ref}"
            )
            continue

        local_path = unquote(parsed.path)
        if not local_path:
            continue
        resolved = (ROOT / local_path).resolve()
        try:
            resolved.relative_to(ROOT.resolve())
        except ValueError:
            errors.append(f"reference escapes repository root: {ref}")
            continue
        if not resolved.exists():
            errors.append(f"missing local asset: {ref}")

        if parsed.fragment and parsed.fragment not in parser.ids and resolved == INDEX.resolve():
            errors.append(f"broken local fragment: {ref}")

    required_assets = [ROOT / "assets/styles.css", ROOT / "assets/app.js", ROOT / ".nojekyll"]
    for asset in required_assets:
        if not asset.exists():
            errors.append(f"missing required file: {asset.relative_to(ROOT)}")

    if errors:
        print("Static site validation FAILED:", file=sys.stderr)
        for error in errors:
            print(f" - {error}", file=sys.stderr)
        return 1

    print(
        f"Static site validation OK: {len(parser.ids)} ids, "
        f"{len(parser.refs)} href/src references, project-base-safe assets."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
