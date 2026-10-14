"""
Builds Dumpling's concept sheet and Hangar portraits from the in-game renders made by tests/dumpling_art.js.

    node tests/dumpling_art.js          (renders tests/shots/art_*.png from the real game model)
    python3 tools/make_dumpling_art.py  (writes docs/art/dumpling_concept.png, docs/art/*.png and
                                         assets/dumpling_art.js with the portraits)
Needs Pillow, and Node + playwright-core for laying out the sheet.
"""
import base64, io, json, pathlib, subprocess, sys
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
SH = ROOT / 'tests' / 'shots'
ART = ROOT / 'docs' / 'art'
ART.mkdir(parents=True, exist_ok=True)

def img(n):
    return Image.open(SH / f'art_{n}.png').convert('RGB')

# ---- Hangar portraits (small JPEGs inside a script so the one-file build keeps them)
port = {}
for k in ('trim', 'plump', 'round'):
    im = img('p_' + k).resize((320, 320), Image.LANCZOS)
    b = io.BytesIO()
    im.save(b, 'JPEG', quality=84, optimize=True, progressive=True)
    port[k] = 'data:image/jpeg;base64,' + base64.b64encode(b.getvalue()).decode()
(ROOT / 'assets' / 'dumpling_art.js').write_text(
    '/* Dumpling portraits for the Hangar, made by tools/make_dumpling_art.py from in-game renders */\n'
    'window.DUMPLING_ART = ' + json.dumps(port) + ';\n', encoding='utf-8')

# ---- individual art files for the docs
for n in ('turn_front', 'turn_34', 'turn_side', 'turn_back', 'w_0', 'w_1', 'w_2', 'w_3', 'w_4', 'w_5', 'w_6', 'w_stuffed',
          'x_face', 'x_eat', 'x_giggle', 'x_flop', 'x_float'):
    img(n).save(ART / f'dumpling_{n}.png', optimize=True)

# ---- the concept sheet, laid out in HTML and captured at 2400 px
D = json.loads(subprocess.run(['node', '-e', '''
global.window = { DARREN_DATA: { speakers: {}, adventure: { story: {} } } };
require(process.argv[1]);
console.log(JSON.stringify(window.DARREN_DATA.dumpling));
''', str(ROOT / 'data' / 'dumpling.js')], capture_output=True, text=True, check=True).stdout)
W = D['weight']
stage = lambda w: [s for s in W['stages'] if w >= s['at'] - 1e-6][-1]
lbs = lambda w: stage(w)['lbs']
tier = lambda w: stage(w)['name']
F = (ROOT / 'tools' / 'fonts').as_uri()
pal = [('#36a68c', 'Jade scales'), ('#1f7470', 'Deep jade back'), ('#f7bf80', 'Peach belly'), ('#d4874e', 'Belly plates'),
       ('#ff8a92', 'Cheek blush'), ('#ff7f4f', 'Sunset fins and nubs'), ('#f3ddb0', 'Horns and claws'),
       ('#3fa9f0', 'Neckerchief'), ('#ffb82e', 'Amber eyes')]
src = lambda n: (SH / f'art_{n}.png').as_uri()
stages = [('w_%d' % i, s['at'], 0) for i, s in enumerate(W['stages'])] + [('w_stuffed', 1, 1)]
html = f'''<!doctype html><html><head><meta charset="utf-8"><style>
@font-face {{ font-family: Lil; src: url({F}/lilita-one-latin-400-normal.woff2); }}
@font-face {{ font-family: Nun; font-weight: 600; src: url({F}/nunito-latin-600-normal.woff2); }}
@font-face {{ font-family: Nun; font-weight: 800; src: url({F}/nunito-latin-800-normal.woff2); }}
* {{ box-sizing: border-box; margin: 0; }}
body {{ width: 2400px; background: #f6efe2; color: #23302f; font: 600 22px/1.4 Nun, sans-serif; padding: 56px 64px 60px; }}
h1 {{ font: 400 104px/0.9 Lil; color: #1f7470; letter-spacing: 1px; }}
h1 small {{ display: block; font: 800 26px Nun; letter-spacing: 6px; color: #d4874e; text-transform: uppercase; margin-top: 14px; }}
.top {{ display: grid; grid-template-columns: 1fr 820px; gap: 40px; align-items: end; border-bottom: 4px solid #23302f; padding-bottom: 26px; }}
.lede {{ font-size: 25px; color: #3d4a48; }}
h2 {{ font: 400 40px Lil; color: #23302f; margin: 34px 0 14px; display: flex; gap: 16px; align-items: baseline; }}
h2 span {{ font: 800 18px Nun; letter-spacing: 4px; text-transform: uppercase; color: #8a948f; }}
.row {{ display: grid; gap: 18px; }}
.card {{ background: #fffaf2; border: 2px solid #e5dccb; border-radius: 6px; overflow: hidden; }}
.card img {{ display: block; width: 100%; }}
.cap {{ padding: 10px 14px 12px; font-size: 19px; }}
.cap b {{ font: 400 26px Lil; color: #1f7470; display: block; }}
.turn {{ grid-template-columns: repeat(4, 1fr); }}
.stage {{ grid-template-columns: repeat(8, 1fr); }}
.stage .cap {{ font-size: 16px; }} .stage .cap b {{ font-size: 21px; }}
.poses {{ grid-template-columns: 1.1fr 1fr 1fr 1fr 1fr; }}
.sq img {{ aspect-ratio: 1; object-fit: cover; }}
.bottom {{ display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 34px; margin-top: 10px; }}
.sw {{ display: grid; grid-template-columns: 54px 1fr; gap: 10px 14px; align-items: center; }}
.sw i {{ width: 54px; height: 54px; border-radius: 50%; border: 3px solid #23302f; }}
.sw code {{ font: 600 16px monospace; color: #8a948f; display: block; }}
ul {{ padding-left: 24px; }} li {{ margin-bottom: 8px; }}
.meter {{ height: 14px; background: #e5dccb; border-radius: 7px; margin: 8px 0 2px; overflow: hidden; }}
.meter em {{ display: block; height: 100%; background: linear-gradient(90deg, #36a68c, #ffb82e, #ff7f4f); }}
.foot {{ margin-top: 30px; padding-top: 16px; border-top: 2px solid #e5dccb; font-size: 18px; color: #8a948f; display: flex; justify-content: space-between; }}
</style></head><body>
<div class="top"><div><h1>Dumpling<small>Cloud drake baker · Skyforge Haven · Darren: Skyblade Hunt</small></h1></div>
<p class="lede">An original chubby cloud drake who bakes (and mostly taste-tests) in Cloud Utopia. Feed him snacks and he grows rounder:
his belly fills, digests into weight and wobbles on a spring. The heavier he gets, the harder his Belly Bounce
and the higher his trampoline. Too round to flap? He floats like a balloon.</p></div>

<h2>Turnaround <span>in-game model · starting weight</span></h2>
<div class="row turn">{''.join(f'<div class="card"><img src="{src(n)}"><div class="cap"><b>{t}</b></div></div>' for n, t in (('turn_front', 'Front'), ('turn_34', 'Three-quarter'), ('turn_side', 'Side'), ('turn_back', 'Back')))}</div>

<h2>Seven weight stages <span>Trim to Wobbly Wonder · stage 7 is his limit</span></h2>
<div class="row stage">{''.join(f'<div class="card"><img src="{src(n)}"><div class="cap"><b>{"Stuffed" if f else tier(w)}</b>{"full belly at the limit" if f else "Stage %d · %d lb" % (k + 1, lbs(w))}<div class="meter"><em style="width:{max(4, round(min(k, 6) / 6 * 100))}%"></em></div></div></div>' for k, (n, w, f) in enumerate(stages))}</div>

<h2>Expressions and moves</h2>
<div class="row poses">{''.join(f'<div class="card sq"><img src="{src(n)}"><div class="cap"><b>{t}</b>{c}</div></div>' for n, t, c in (('x_face', 'Face', 'Amber eyes, freckled blush, one cheeky tooth'), ('x_eat', 'Nom!', 'Happy squint while he chews'), ('x_giggle', 'It tickles', 'Belly wobble on a sword poke'), ('x_flop', 'Belly Bounce', 'Hop, then a shockwave flop'), ('x_float', 'Balloon float', 'Too round to flap: he floats')))}</div>

<div class="bottom">
<div><h2>Palette</h2><div class="sw">{''.join(f'<i style="background:{c}"></i><div>{n}<code>{c}</code></div>' for c, n in pal)}</div></div>
<div><h2>Design notes</h2><ul>
<li>Pear-shaped, low centre of gravity: a big round belly that sits forward of short, wide legs.</li>
<li>Peach belly plates curve upward at the sides; fine pebbly scales everywhere else.</li>
<li>Cloud drake signature: puffs of cloud on his head and tail tip.</li>
<li>Comically tiny wings: a fast bumblebee buzz when light, slow paddles while floating.</li>
<li>Curled cream horns, sunset ear fins, coral nubs down the back and tail.</li>
<li>Sky-blue polka-dot neckerchief that stretches as he gets rounder.</li></ul></div>
<div><h2>How weight plays</h2><ul>
<li><b>Seven stages:</b> snacks fill his belly, a full belly digests into weight, and every so much weight is a new stage. Stage 7 is the limit. Walking and flying burn it off, unless held.</li>
<li><b>Belly Bounce</b> (G): {D['bounce']['dmgLight']}–{D['bounce']['dmgHeavy']} damage, {D['bounce']['radiusLight']}–{D['bounce']['radiusHeavy']} m shockwave. Heavy knocks enemies down; light launches them.</li>
<li><b>Trampoline:</b> land on him for {D['trampoline']['light']}–{D['trampoline']['heavy']}× Darren's jump.</li>
<li><b>Jiggle:</b> a spring that gets slower and floppier with weight, plus a ripple across the belly.</li>
<li><b>Bake</b> snacks from Skyforge parts at his oven; spicy Ember Peppers make flaming bounces.</li></ul></div>
</div>
<div class="foot"><span>Concept sheet rendered from the real in-game model (three.js, sculpted with tools/sculpt_dumpling.py)</span><span>Darren: Skyblade Hunt 1.4</span></div>
</body></html>'''
page = SH / 'dumpling_sheet.html'
page.write_text(html, encoding='utf-8')
out = ART / 'dumpling_concept.png'
js = f'''
const {{ chromium }} = require('{(ROOT / 'node_modules' / 'playwright-core').as_posix()}');
(async () => {{
  const b = await chromium.launch({{ executablePath: '/opt/pw-browsers/chromium' }});
  const p = await b.newPage({{ viewport: {{ width: 2400, height: 1000 }} }});
  await p.goto('{page.as_uri()}');
  await p.waitForTimeout(800);
  await p.screenshot({{ path: '{out.as_posix()}', fullPage: true }});
  await b.close();
}})();'''
subprocess.run(['node', '-e', js], check=True)
im = Image.open(out)
im.convert('RGB').save(out, optimize=True)
print('wrote', out, im.size, 'and assets/dumpling_art.js')
