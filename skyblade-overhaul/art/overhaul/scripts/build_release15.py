"""Build isolated existing-content RC; never touch root dist or publish."""
from pathlib import Path
import shutil,json,hashlib
root=Path(__file__).resolve().parents[3]
release=root/'art/overhaul/skydrake15/release'
dist=release/'dist'
shutil.copytree(root/'dist',dist,dirs_exist_ok=True)
scripts=root/'art/overhaul/scripts'
for folder,stem,target in [('chomprex','chomprex','chomprex.glb'),('heavyweight','heavyweight','stormbelly-rc15.glb'),('skydrake15','skydrake','skydrake-rc15.glb')]:
 shutil.copy2(root/'art/overhaul'/folder/'export'/(stem+'-lod.glb'),dist/'assets'/target)
for source,target,old,new in [('heavyweight-local-adapter.js','stormbelly-rc15.js','/__heavyweight-candidate.glb','assets/stormbelly-rc15.glb'),('skydrake-local-adapter15.js','skydrake-rc15.js','/__skydrake-candidate.glb','assets/skydrake-rc15.glb'),('skyblade-camera15.js','camera-rc15.js','Local review only','Release candidate')]:
 (dist/'src'/target).write_text((scripts/source).read_text().replace(old,new),encoding='utf-8')
shutil.copy2(scripts/'mobile-ui15.css',dist/'mobile-ui15.css')
index=dist/'index.html'
index.write_text(index.read_text(encoding='utf-8').replace('</body>','<link rel="stylesheet" href="mobile-ui15.css"><script src="src/skydrake-rc15.js"></script><script src="src/stormbelly-rc15.js"></script><script src="src/camera-rc15.js"></script></body>'),encoding='utf-8')
(release/'.openai').mkdir(exist_ok=True)
shutil.copy2(root/'.openai/hosting.json',release/'.openai/hosting.json')
files={str(p.relative_to(release)).replace('\\','/'):hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(release.rglob('*')) if p.is_file() and p.name!='manifest.json'}
(release/'manifest.json').write_text(json.dumps({'project_id':'appgprj_6acf0e7886908191820064ec6fa5afa0','status':'LOCAL ONLY; no deployment or audience change','variant':'reduced trio','files':files},indent=2))
print(json.dumps({'files':len(files),'release':str(release)}))
