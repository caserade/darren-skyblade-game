"""Build one self-contained HTML file from the project (for sharing, or for the Claude artifact).

    python tools/build_single.py            -> dist/DarrenSkyblade.html  (full page, double-click to play)
    python tools/build_single.py --artifact -> dist/artifact.html        (page body only, for claude.ai)
    python tools/build_single.py --test     -> dist/test.html            (uses a local three.js, for automated tests)

Nothing here changes the game; it only inlines index.html's local CSS and scripts.
"""
import re, sys, pathlib, subprocess

ROOT = pathlib.Path(__file__).resolve().parent.parent
THREE_CDN = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"
LOADER_CDN = "https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js"


def build(mode):
    html = (ROOT / "index.html").read_text(encoding="utf-8")
    html = html.replace('<link rel="stylesheet" href="src/style.css">',
                        "<style>\n" + (ROOT / "src/style.css").read_text(encoding="utf-8") + "\n</style>")
    code = []
    for src in re.findall(r'<script src="([^"]+)"></script>', html):
        if src.startswith("http"):
            continue
        code.append((src, (ROOT / src).read_text(encoding="utf-8")))
    # syntax-check the game code (skips the big base64 asset files)
    joined = "\n".join(c for s, c in code if not s.startswith("assets/"))
    chk = ROOT / "dist" / "_check.js"
    chk.parent.mkdir(exist_ok=True)
    chk.write_text(joined, encoding="utf-8")
    try:
        r = subprocess.run(["node", "--check", str(chk)], capture_output=True, text=True)
        if r.returncode:
            print(r.stderr)
            sys.exit(1)
    except FileNotFoundError:
        pass
    finally:
        chk.unlink(missing_ok=True)
    first = True
    for src, c in code:
        tag = '<script src="%s"></script>' % src
        repl = "<script>\n/* ---- %s ---- */\n%s\n</script>" % (src, c.replace("</script", "<\\/script"))
        html = html.replace(tag, repl)
    if mode == "test":
        html = html.replace(THREE_CDN, "../node_modules/three/build/three.min.js").replace(LOADER_CDN, "../node_modules/three/examples/js/loaders/GLTFLoader.js")
    if mode == "artifact":
        # the artifact host wraps the page itself: keep <title>, styles and body content only
        head = html[html.index("<head>") + 6:html.index("</head>")]
        body = html[html.index("<body>") + 6:html.index("</body>")]
        head = re.sub(r"<meta[^>]*>\n?", "", head)
        html = head.strip() + "\n" + body.strip() + "\n"
    out = ROOT / "dist" / {"full": "DarrenSkyblade.html", "artifact": "artifact.html", "test": "test.html"}[mode]
    out.write_text(html, encoding="utf-8")
    print("built", out, round(len(html) / 1e6, 2), "MB")


if __name__ == "__main__":
    mode = "artifact" if "--artifact" in sys.argv else "test" if "--test" in sys.argv else "full"
    build(mode)
