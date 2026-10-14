"""
Builds a model sheet per monster (docs/art/cast/<type>_model_sheet.png): Michael's approved concept on top, the
in-game model below it (front, side, back, three-quarter), its weight stages and key poses.

    node tests/cast_view.js cv          (renders tests/shots/cv_<type>_*.png)
    python3 tools/make_cast_sheets.py
"""
import json, pathlib, subprocess, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SH = ROOT / 'tests' / 'shots'
OUT = ROOT / 'docs' / 'art' / 'cast'
F = (ROOT / 'tools' / 'fonts').as_uri()
TAG = sys.argv[1] if len(sys.argv) > 1 else 'cv'
INFO = {
    'skydrake': ('A — Stormbelly / Sky Drake', 'Gale Spires · flies, circles and swoops; tail whip on the ground', [('pose_takeoff', 'Takeoff'), ('pose_attackWindup', 'Swoop wind-up'), ('pose_tailWindup', 'Tail wind-up')]),
    'heavyweight': ('B — Stormbelly / Heavyweight', 'Sparkstone Mesa · 1.1 s stomp wind-up, shockwave, long recovery', [('pose_stompWindup', 'Stomp wind-up'), ('pose_stompRecovery', 'Stomp recovery'), ('pose_stagger', 'Stagger')]),
    'chomprex': ('C — Chomp Rex / Grin', 'Thorn Wastes · 0.8 s scrape, charge, bite', [('pose_chargeWindup', 'Charge wind-up'), ('pose_biteWindup', 'Bite wind-up'), ('pose_charge', 'Charge')]),
}
man = json.loads((ROOT / 'models' / 'cast_animations.json').read_text()) if (ROOT / 'models' / 'cast_animations.json').exists() else {'creatures': {}}
for t, (title, sub, poses) in INFO.items():
    img = lambda n: (SH / f'{TAG}_{t}_{n}.png').as_uri()
    card = lambda n, cap: f'<div class="c"><img src="{img(n)}"><p>{cap}</p></div>'
    views = ''.join(card(n, c) for n, c in (('front', 'Front'), ('side', 'Side'), ('back', 'Back'), ('34', 'Three-quarter')))
    extra = ''
    if t != 'chomprex':
        extra = '<h2>Weight stages <span>7 stages, the 7th is the limit · they swell by eating snack bushes</span></h2><div class="g g3">' + ''.join(
            card(n, c) for n, c in (('34', 'Stage 1'), ('stage4', 'Stage 4'), ('stage7', 'Stage 7 (limit)'))) + '</div>'
    m = man['creatures'].get(t, {})
    v = m.get('validation', {})
    l1 = m.get('lod1', {}).get('validation', {})
    stats = (f"{v.get('triangles', '?')} triangles (LOD1 {l1.get('triangles', '?')}) · {v.get('bones', '?')} bones · "
             f"{len(v.get('clips', []))} clips · max {v.get('maxInfluences', 4)} weights per vertex · "
             f"{round(m.get('bytes', 0) / 1024)} KB .glb") if v else ''
    html = f'''<!doctype html><meta charset="utf-8"><style>
@font-face {{ font-family: Lil; src: url({F}/lilita-one-latin-400-normal.woff2); }}
@font-face {{ font-family: Nun; font-weight: 600; src: url({F}/nunito-latin-600-normal.woff2); }}
* {{ box-sizing: border-box; margin: 0; }}
body {{ width: 2200px; background: #f6efe2; color: #23302f; font: 600 21px Nun, sans-serif; padding: 44px 54px; }}
h1 {{ font: 400 76px Lil; color: #1d2a5a; }} .sub {{ font-size: 24px; color: #5b6663; margin: 6px 0 20px; }}
h2 {{ font: 400 36px Lil; margin: 26px 0 12px; }} h2 span {{ font: 600 17px Nun; letter-spacing: 3px; text-transform: uppercase; color: #8a948f; margin-left: 12px; }}
.ref {{ width: 100%; border: 2px solid #e5dccb; border-radius: 6px; display: block; }}
.g {{ display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }} .g3 {{ grid-template-columns: repeat(3, 1fr); }}
.c {{ background: #fffaf2; border: 2px solid #e5dccb; border-radius: 6px; overflow: hidden; }} .c img {{ width: 100%; display: block; }}
.c p {{ font: 400 24px Lil; color: #1d2a5a; padding: 8px 12px; }}
.foot {{ margin-top: 24px; color: #8a948f; font-size: 18px; display: flex; justify-content: space-between; }}
</style><h1>{title}</h1><p class="sub">{sub}</p>
<h2>Approved concept <span>design authority</span></h2><img class="ref" src="{(OUT / f'concept_{t}.jpg').as_uri()}">
<h2>In-game model <span>sculpted, skinned, vertex-painted · {stats}</span></h2><div class="g">{views}</div>{extra}
<h2>Key poses <span>baked into models/{t}.glb</span></h2><div class="g g3">{''.join(card(n, c) for n, c in poses)}</div>
<div class="foot"><span>Rendered from the real in-game model (three.js r128)</span><span>Darren: Skyblade Hunt 1.4</span></div>'''
    page = SH / f'sheet_{t}.html'
    page.write_text(html, encoding='utf-8')
    out = OUT / f'{t}_model_sheet.png'
    js = f'''const {{ chromium }} = require('{(ROOT / 'node_modules' / 'playwright-core').as_posix()}');
(async () => {{ const b = await chromium.launch({{ executablePath: '/opt/pw-browsers/chromium' }});
  const p = await b.newPage({{ viewport: {{ width: 2200, height: 1000 }} }});
  await p.goto('{page.as_uri()}'); await p.waitForTimeout(700);
  await p.screenshot({{ path: '{out.as_posix()}', fullPage: true, type: 'png' }}); await b.close(); }})();'''
    subprocess.run(['node', '-e', js], check=True)
    from PIL import Image
    im = Image.open(out).convert('RGB')
    jpg = out.with_suffix('.jpg')
    im.save(jpg, quality=88)
    out.unlink()
    print('wrote', jpg, im.size)
