"""Build one self-contained HTML file from the project (for sharing, or for the Claude artifact).

    python tools/build_single.py            -> dist/DarrenSkyblade.html  (full page, works offline: three.js, fonts and images inlined)
    python tools/build_single.py --artifact -> dist/artifact.html        (page body only, for claude.ai: three.js and fonts from their CDNs)
    python tools/build_single.py --test     -> dist/test.html            (same as full, for automated tests)

Nothing here changes the game; it only inlines index.html's local CSS, scripts, fonts and images.
"""
import re, sys, pathlib, subprocess, base64

ROOT = pathlib.Path(__file__).resolve().parent.parent
THREE_CDN = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"
EXAMPLES_CDN = "https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/"
VENDOR_CDN = {
    "vendor/three.min.js": THREE_CDN,
    "vendor/GLTFLoader.js": EXAMPLES_CDN + "loaders/GLTFLoader.js",
    "vendor/CopyShader.js": EXAMPLES_CDN + "shaders/CopyShader.js",
    "vendor/LuminosityHighPassShader.js": EXAMPLES_CDN + "shaders/LuminosityHighPassShader.js",
    "vendor/EffectComposer.js": EXAMPLES_CDN + "postprocessing/EffectComposer.js",
    "vendor/RenderPass.js": EXAMPLES_CDN + "postprocessing/RenderPass.js",
    "vendor/ShaderPass.js": EXAMPLES_CDN + "postprocessing/ShaderPass.js",
    "vendor/UnrealBloomPass.js": EXAMPLES_CDN + "postprocessing/UnrealBloomPass.js",
}
GOOGLE_FONTS = '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@500;700&family=Lilita+One&family=Nunito:wght@600;800&display=swap">'
# images the code loads by path; single-file builds carry them as data URIs
IMAGES = ["assets/textures/weathered-limestone.webp", "assets/stormglass-concept.webp"]


def data_uri(path, mime):
    return "data:%s;base64,%s" % (mime, base64.b64encode((ROOT / path).read_bytes()).decode())


def fonts_css():
    css = (ROOT / "assets/fonts/fonts.css").read_text(encoding="utf-8")
    return re.sub(r"url\(([^)]+\.ttf)\)", lambda m: "url(%s)" % data_uri("assets/fonts/" + m.group(1), "font/ttf"), css)


def build(mode):
    html = (ROOT / "index.html").read_text(encoding="utf-8")
    html = html.replace('<link rel="stylesheet" href="src/style.css">',
                        "<style>\n" + (ROOT / "src/style.css").read_text(encoding="utf-8") + "\n</style>")
    fonts_tag = '<link rel="stylesheet" href="assets/fonts/fonts.css">'
    html = html.replace(fonts_tag, GOOGLE_FONTS if mode == "artifact" else "<style>\n" + fonts_css() + "\n</style>")
    if mode == "artifact":
        for local, cdn in VENDOR_CDN.items():
            html = html.replace('<script src="%s"></script>' % local, '<script src="%s"></script>' % cdn)
    code = []
    for src in re.findall(r'<script src="([^"]+)"></script>', html):
        if src.startswith("http"):
            continue
        text = (ROOT / src).read_text(encoding="utf-8")
        for img in IMAGES:
            if img in text:
                text = text.replace(img, data_uri(img, "image/webp"))
        code.append((src, text))
    # syntax-check the game code (skips the big base64 asset files and the bundled libraries)
    joined = "\n".join(c for s, c in code if not s.startswith(("assets/", "vendor/")))
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
