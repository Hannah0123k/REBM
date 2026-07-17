"""Print a Figma node subtree with frame-relative coordinates, from the local cache.

Reads figma-data/<frame>.json (written by figma-extract.mjs) so it costs no API
calls — Figma rate-limits both the MCP (6/month on Starter) and the REST API.

Coordinates are absoluteBoundingBox minus the frame origin. The raw x/y in the
MCP metadata dump are NOT trustworthy for nested nodes: they mix frame- and
parent-relative values, and some exceed the frame bounds entirely. This is the
reliable path.

Usage:
  python3 scripts/tree.py 95-2 95:22          # subtree of one node
  python3 scripts/tree.py 95-2 --top          # direct children of the frame
  python3 scripts/tree.py 95-2 --find hero    # nodes whose name matches
"""

import json
import sys
from pathlib import Path

cache = Path(__file__).parent.parent / "figma-data" / f"{sys.argv[1]}.json"
data = json.loads(cache.read_text())
root = data["document"]
ORIGIN = root["absoluteBoundingBox"]
OX, OY = ORIGIN["x"], ORIGIN["y"]


def fmt(n, depth=0):
    b = n.get("absoluteBoundingBox") or {}
    x = round(b.get("x", 0) - OX, 2)
    y = round(b.get("y", 0) - OY, 2)
    s = n.get("style") or {}
    typ = (
        f"  [{s.get('fontPostScriptName')} {s['fontSize']}/{round(s.get('lineHeightPx', 0), 1)}]"
        if s.get("fontSize")
        else ""
    )
    fills = n.get("fills") or []
    col = ""
    if fills and fills[0].get("type") == "SOLID":
        c = fills[0]["color"]
        a = fills[0].get("opacity", 1) * (n.get("opacity", 1) or 1)
        col = "  %s%s" % (
            "#%02X%02X%02X" % (round(c["r"] * 255), round(c["g"] * 255), round(c["b"] * 255)),
            "" if a >= 0.999 else f"@{round(a, 3)}",
        )
    ch = n.get("characters", "")
    ch = "\n" + "  " * (depth + 1) + "  " + repr(ch[:90]) if ch else ""
    return (
        f"{'  ' * depth}{n['id']:9} {n['type']:9} {n['name'][:22]:24} "
        f"x={x:<8} y={y:<9} {round(b.get('width', 0), 1)}×{round(b.get('height', 0), 1)}{typ}{col}{ch}"
    )


def walk(n, depth=0):
    print(fmt(n, depth))
    for c in n.get("children", []):
        walk(c, depth + 1)


def find(n, needle, out):
    if needle.lower() in n["name"].lower():
        out.append(n)
    for c in n.get("children", []):
        find(c, needle, out)


def locate(n, nid):
    if n["id"] == nid:
        return n
    for c in n.get("children", []):
        hit = locate(c, nid)
        if hit:
            return hit
    return None


arg = sys.argv[2]
if arg == "--top":
    print(fmt(root))
    for c in root.get("children", []):
        print(fmt(c, 1))
elif arg == "--find":
    hits = []
    find(root, sys.argv[3], hits)
    for h in hits:
        print(fmt(h))
else:
    for nid in sys.argv[2:]:
        node = locate(root, nid)
        if node:
            walk(node)
            print()
        else:
            print(f"! {nid} not found in {cache.name}")
