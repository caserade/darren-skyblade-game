"""Derive RC16 from immutable tested RC15; no publication or root-dist mutation."""
from pathlib import Path
import shutil,json,hashlib,re
root=Path(__file__).resolve().parents[3];base=root/'art/overhaul/skydrake15/release';release=root/'art/overhaul/skydrake16/release'
shutil.copytree(base,release,dirs_exist_ok=True);dist=release/'dist';index=dist/'index.html'
html=index.read_text(encoding='utf-8');scripts=re.findall(r'<script src="([^"]+)"></script>',html)
assert len(scripts)==31
html=re.sub(r'<script src="[^"]+"></script>','',html)
html=html.replace('<div id="game">','<div id="game" inert>')
overlay='''<div id="startup16" role="status" data-state="loading" style="position:fixed;inset:0;z-index:200000;display:grid;place-content:center;text-align:center;gap:18px;padding:24px;background:#13232d;color:#fff;font:18px system-ui,sans-serif">
<p id="startupMessage16">Loading Darren: Skyblade Hunt…</p><button id="startupRetry16" type="button" hidden onclick="location.reload()" style="padding:14px 24px;justify-self:center;font:700 18px system-ui,sans-serif">Retry</button></div>'''
preload=''.join('<link rel="preload" as="script" href="'+p+'">' for p in scripts)
fallback="document.getElementById('startup16').dataset.state='error';document.getElementById('startupMessage16').textContent='The game could not finish loading. Please retry.';document.getElementById('startupRetry16').hidden=false"
html=html.replace('</body>',overlay+preload+'<script id="startupModules16" type="application/json">'+json.dumps(scripts)+'</script><script src="src/boot16.js" onerror="'+fallback+'"></script></body>')
index.write_text(html,encoding='utf-8');shutil.copy2(root/'art/overhaul/scripts/boot16.js',dist/'src/boot16.js')
level=dist/'src/level.js';text=level.read_text(encoding='utf-8');old='if (!window.__manual) tick(rdt);';assert text.count(old)==1;level.write_text(text.replace(old,'if (!window.__manual && !window.__skybladeBoot?.pending) tick(rdt);'),encoding='utf-8')
files={str(p.relative_to(release)).replace('\\','/'):hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(release.rglob('*')) if p.is_file() and p.name!='manifest.json'}
(release/'manifest.json').write_text(json.dumps({'project_id':'appgprj_6acf0e7886908191820064ec6fa5afa0','status':'LOCAL ONLY; no deployment or audience change','base_commit':'2ebeccb146f674bdb5e4e0118460ba547581dcd6','variant':'unchanged RC15 reduced trio; required-script startup gate','files':files},indent=2))
changed=[]
for p in dist.rglob('*'):
 if p.is_file() and (not (base/'dist'/p.relative_to(dist)).exists() or p.read_bytes()!=(base/'dist'/p.relative_to(dist)).read_bytes()):changed.append(str(p.relative_to(dist)).replace('\\','/'))
print(json.dumps({'files':len(files),'scripts':len(scripts),'changed':changed}));assert sorted(changed)==['index.html','src/boot16.js','src/level.js']
