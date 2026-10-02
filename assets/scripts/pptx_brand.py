#!/usr/bin/env python3
"""
Decode a Google-Slides/PowerPoint template (.pptx) into web-usable brand data.

Subcommands
  theme    <deck.pptx>                      colour scheme, fonts, slide size, embedded fonts
  layouts  <deck.pptx> [--slides]           per-layout (or per-slide) shape summary in stage px
  shapes   <deck.pptx> --out <file.json|.ts> [--filter NAME ...]
                                            custGeom shapes -> SVG path strings in stage px
  preview  <shapes.json> --out <dir>        one SVG per shape group, for eyeballing (macOS: also PNG via qlmanage)

Stage coordinates: the slide is mapped onto a WIDTH-px stage (default 1600).
For a 16:9 deck (9144000 x 5143500 EMU) that is 1600x900, 1pt = 2.222px.

No third-party dependencies (zipfile + re only).
"""
import argparse, json, os, re, shutil, subprocess, sys, tempfile, zipfile

EMU_PER_INCH = 914400


def unzip(pptx):
    d = tempfile.mkdtemp(prefix="pptx_")
    with zipfile.ZipFile(pptx) as z:
        z.extractall(d)
    return d


def read(root, rel):
    with open(os.path.join(root, rel), encoding="utf-8", errors="replace") as f:
        return f.read()


def slide_size(root):
    x = read(root, "ppt/presentation.xml")
    cx = int(re.search(r'<p:sldSz[^>]*cx="(\d+)"', x).group(1))
    cy = int(re.search(r'<p:sldSz[^>]*cy="(\d+)"', x).group(1))
    return cx, cy


def rels(root, part):
    rp = os.path.join(root, os.path.dirname(part), "_rels", os.path.basename(part) + ".rels")
    d = {}
    if os.path.exists(rp):
        for m in re.finditer(r"<Relationship [^>]*>", open(rp).read()):
            i = re.search(r'Id="([^"]+)"', m.group(0))
            t = re.search(r'Target="([^"]+)"', m.group(0))
            if i and t:
                d[i.group(1)] = t.group(1)
    return d


def numbered(root, subdir, prefix):
    files = [f for f in os.listdir(os.path.join(root, "ppt", subdir)) if f.startswith(prefix) and f.endswith(".xml")]
    return sorted(files, key=lambda f: int(re.search(r"(\d+)", f).group(1)))


# ── theme ───────────────────────────────────────────────────────────────
def cmd_theme(a):
    root = unzip(a.pptx)
    cx, cy = slide_size(root)
    out = {"slide_size_emu": [cx, cy], "aspect": round(cx / cy, 4),
           "stage_px": [a.width, round(a.width * cy / cx)],
           "px_per_pt": round(a.width / (cx / EMU_PER_INCH * 72), 4)}
    themes = []
    for t in numbered(root, "theme", "theme"):
        x = read(root, "ppt/theme/" + t)
        cs = re.search(r'<a:clrScheme name="([^"]*)">(.*?)</a:clrScheme>', x, re.S)
        colours = {k: "#" + v for k, v in re.findall(r"<a:(\w+)><a:srgbClr val=\"([0-9A-Fa-f]{6})\"", cs.group(2))} if cs else {}
        fs = re.search(r"<a:fontScheme.*?</a:fontScheme>", x, re.S)
        major = re.search(r'<a:majorFont><a:latin typeface="([^"]*)"', fs.group(0)) if fs else None
        minor = re.search(r'<a:minorFont><a:latin typeface="([^"]*)"', fs.group(0)) if fs else None
        themes.append({"file": t, "scheme": cs.group(1) if cs else None, "colours": colours,
                       "theme_fonts": {"major": major and major.group(1), "minor": minor and minor.group(1)}})
    out["themes"] = themes
    fonts_dir = os.path.join(root, "ppt", "fonts")
    out["embedded_fonts"] = sorted(os.listdir(fonts_dir)) if os.path.isdir(fonts_dir) else []
    # Typefaces actually used on slides/layouts (the theme font is often a decoy like Arial).
    used = {}
    for sub, pre in (("slides", "slide"), ("slideLayouts", "slideLayout"), ("slideMasters", "slideMaster")):
        for f in numbered(root, sub, pre):
            for tf in re.findall(r'typeface="([^"]+)"', read(root, f"ppt/{sub}/{f}")):
                used[tf] = used.get(tf, 0) + 1
    out["typefaces_used"] = dict(sorted(used.items(), key=lambda kv: -kv[1]))
    srgb = {}
    for sub, pre in (("slides", "slide"), ("slideLayouts", "slideLayout")):
        for f in numbered(root, sub, pre):
            for c in re.findall(r'srgbClr val="([0-9A-Fa-f]{6})"', read(root, f"ppt/{sub}/{f}")):
                srgb["#" + c.upper()] = srgb.get("#" + c.upper(), 0) + 1
    out["srgb_colours_on_slides"] = dict(sorted(srgb.items(), key=lambda kv: -kv[1])[:30])
    sizes = {}
    for f in numbered(root, "slides", "slide"):
        for s in re.findall(r' sz="(\d+)"', read(root, "ppt/slides/" + f)):
            sizes[int(s) / 100] = sizes.get(int(s) / 100, 0) + 1
    out["font_sizes_pt_on_slides"] = {f"{k:g}pt (~{round(k*out['px_per_pt'])}px)": v
                                      for k, v in sorted(sizes.items(), key=lambda kv: -kv[1])[:15]}
    print(json.dumps(out, indent=2))
    shutil.rmtree(root)


# ── layouts / slides summary ────────────────────────────────────────────
def summarize_part(root, part, emu_per_px):
    x = read(root, part)
    r = rels(root, part)
    px = lambda v: round(int(v) / emu_per_px)
    name = re.search(r'<p:cSld(?: name="([^"]*)")?', x)
    bg = re.search(r"<p:bg>.*?</p:bg>", x, re.S)
    bgs = ""
    if bg:
        c = re.search(r'(?:srgbClr|schemeClr) val="([^"]+)"', bg.group(0))
        bgs = c.group(1) if c else "other"
    layout = [v for v in r.values() if "slideLayout" in v]
    lines = [f"## {os.path.basename(part)} name={name.group(1) if name else ''} bg={bgs} {('layout=' + layout[0]) if layout else ''}"]
    for m in re.finditer(r"<p:(sp|pic)>(.*?)</p:\1>", x, re.S):
        kind, body = m.group(1), m.group(2)
        nm = re.search(r'<p:cNvPr[^>]*name="([^"]*)"', body)
        off = re.search(r'<a:off x="(-?\d+)" y="(-?\d+)"/>\s*<a:ext cx="(\d+)" cy="(\d+)"', body)
        geo = f"@({px(off.group(1))},{px(off.group(2))}) {px(off.group(3))}x{px(off.group(4))}" if off else ""
        ph = re.search(r"<p:ph[^>]*/>", body)
        if kind == "pic":
            e = re.search(r'r:embed="([^"]+)"', body)
            lines.append(f"  PIC {nm.group(1) if nm else ''} {geo} -> {r.get(e.group(1), '?') if e else '?'}")
            continue
        geom = re.search(r'prst="([^"]+)"', body)
        geom = geom.group(1) if geom else ("custGeom" if "custGeom" in body else "")
        sp = re.search(r"<p:spPr>.*?</p:spPr>", body, re.S)
        fill = ""
        if sp:
            c = re.search(r'<a:solidFill>\s*<a:(?:srgbClr|schemeClr) val="([^"]+)"', sp.group(0))
            fill = c.group(1) if c else ""
        txt = " | ".join(re.findall(r"<a:t>([^<]*)</a:t>", body))[:80]
        szs = sorted(set(re.findall(r' sz="(\d+)"', body)))
        tf = sorted(set(re.findall(r'typeface="([^"]+)"', body)))
        col = sorted(set(re.findall(r'<a:solidFill>\s*<a:(?:srgbClr|schemeClr) val="([^"]+)"', body)))
        lines.append(f"  SP {nm.group(1) if nm else ''} {geo} {geom} fill={fill} {ph.group(0) if ph else ''} "
                     f"sz={szs} font={tf} col={col} '{txt}'")
    return "\n".join(lines)


def cmd_layouts(a):
    root = unzip(a.pptx)
    cx, _ = slide_size(root)
    emu_per_px = cx / a.width
    parts = ["ppt/slideMasters/" + f for f in numbered(root, "slideMasters", "slideMaster")]
    if a.slides:
        parts += ["ppt/slides/" + f for f in numbered(root, "slides", "slide")]
    else:
        parts += ["ppt/slideLayouts/" + f for f in numbered(root, "slideLayouts", "slideLayout")]
    for p in parts:
        print(summarize_part(root, p, emu_per_px))
    shutil.rmtree(root)


# ── custGeom → SVG ──────────────────────────────────────────────────────
def custgeom_to_svg(body, emu_per_px):
    off = re.search(r'<a:off x="(-?\d+)" y="(-?\d+)"/>\s*<a:ext cx="(\d+)" cy="(\d+)"', body)
    ox, oy, cx, cy = [int(v) for v in off.groups()]
    paths = []
    for pm in re.finditer(r"<a:path ([^>]*)>(.*?)</a:path>", body, re.S):
        attrs, inner = pm.group(1), pm.group(2)
        w = int(re.search(r'w="(\d+)"', attrs).group(1))
        h = int(re.search(r'h="(\d+)"', attrs).group(1))
        sx, sy = cx / w / emu_per_px, cy / h / emu_per_px
        d = []
        for cm in re.finditer(r"<a:(moveTo|lnTo|cubicBezTo|quadBezTo|close)(?:/>|>(.*?)</a:\1>)", inner, re.S):
            k, pts = cm.group(1), cm.group(2) or ""
            P = [(round(ox / emu_per_px + int(x) * sx, 1), round(oy / emu_per_px + int(y) * sy, 1))
                 for x, y in re.findall(r'x="(-?\d+)" y="(-?\d+)"', pts)]
            if k == "moveTo": d.append("M%s,%s" % P[0])
            elif k == "lnTo": d.append("L%s,%s" % P[0])
            elif k == "cubicBezTo": d.append("C" + " ".join("%s,%s" % p for p in P))
            elif k == "quadBezTo": d.append("Q" + " ".join("%s,%s" % p for p in P))
            elif k == "close": d.append("Z")
        paths.append(" ".join(d))
    box = [round(ox / emu_per_px), round(oy / emu_per_px), round(cx / emu_per_px), round(cy / emu_per_px)]
    return box, paths


def cmd_shapes(a):
    root = unzip(a.pptx)
    cx, cy = slide_size(root)
    emu_per_px = cx / a.width
    result = {"stage": [a.width, round(a.width * cy / cx)], "source": os.path.basename(a.pptx), "shapes": []}
    parts = ["ppt/slideLayouts/" + f for f in numbered(root, "slideLayouts", "slideLayout")]
    if a.slides:
        parts += ["ppt/slides/" + f for f in numbered(root, "slides", "slide")]
    for part in parts:
        x = read(root, part)
        lname = re.search(r'<p:cSld(?: name="([^"]*)")?', x)
        for m in re.finditer(r"<p:sp>(.*?)</p:sp>", x, re.S):
            body = m.group(1)
            if "custGeom" not in body or "<a:path " not in body:
                continue
            nm = re.search(r'<p:cNvPr[^>]*name="([^"]*)"', body)
            nm = nm.group(1) if nm else ""
            if a.filter and not any(f in f"{os.path.basename(part)}:{nm}" for f in a.filter):
                continue
            fill = re.search(r'<p:spPr>.*?<a:solidFill>\s*<a:(?:srgbClr|schemeClr) val="([^"]+)"', body, re.S)
            box, paths = custgeom_to_svg(body, emu_per_px)
            result["shapes"].append({"part": os.path.basename(part), "layout": lname.group(1) if lname else None,
                                     "name": nm, "fill": fill.group(1) if fill else None, "box": box, "paths": paths})
    shutil.rmtree(root)
    if a.out.endswith(".ts"):
        lines = [f"// Generated by pptx_brand.py shapes from {result['source']}.",
                 f"// Coordinates are stage px on a {result['stage'][0]}x{result['stage'][1]} slide; shapes may extend past the edge on purpose.", ""]
        for s in result["shapes"]:
            ident = re.sub(r"\W+", "_", f"{s['layout']}_{s['name']}").strip("_").upper()
            lines.append(f"/** {s['part']} {s['name']} fill={s['fill']} box(x,y,w,h)={s['box']} */")
            lines.append(f"export const {ident} = {json.dumps(s['paths'])};\n")
        open(a.out, "w").write("\n".join(lines))
    else:
        json.dump(result, open(a.out, "w"), indent=1)
    print(f"wrote {len(result['shapes'])} shapes -> {a.out}")


# ── preview ─────────────────────────────────────────────────────────────
def cmd_preview(a):
    data = json.load(open(a.shapes))
    W, H = data["stage"]
    os.makedirs(a.out, exist_ok=True)
    by_part = {}
    for s in data["shapes"]:
        by_part.setdefault(s["part"], []).append(s)
    palette = a.palette and json.load(open(a.palette)) or {}
    for part, shapes in by_part.items():
        body = "".join(f'<path d="{p}" fill="{palette.get(s["fill"], "#888")}" fill-opacity="0.85"/>'
                       for s in shapes for p in s["paths"])
        svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">'
               f'<rect width="{W}" height="{H}" fill="#eee"/>{body}</svg>')
        path = os.path.join(a.out, part.replace(".xml", ".svg"))
        open(path, "w").write(svg)
        if shutil.which("qlmanage"):
            subprocess.run(["qlmanage", "-t", "-s", str(W), "-o", a.out, path], capture_output=True)
    print(f"wrote previews for {len(by_part)} parts -> {a.out}")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    for name, fn in (("theme", cmd_theme), ("layouts", cmd_layouts), ("shapes", cmd_shapes)):
        p = sub.add_parser(name); p.add_argument("pptx"); p.add_argument("--width", type=int, default=1600); p.set_defaults(fn=fn)
        if name != "theme":
            p.add_argument("--slides", action="store_true", help="include/only real slides instead of layouts")
    sub.choices["shapes"].add_argument("--out", required=True, help=".json or .ts")
    sub.choices["shapes"].add_argument("--filter", nargs="*", help="substrings matched against 'part:shape name'")
    p = sub.add_parser("preview"); p.add_argument("shapes"); p.add_argument("--out", required=True)
    p.add_argument("--palette", help="JSON mapping scheme names (accent2…) / hex to CSS colours"); p.set_defaults(fn=cmd_preview)
    a = ap.parse_args()
    a.fn(a)


if __name__ == "__main__":
    main()
