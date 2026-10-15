"""Isolated Chomp18-derived package; only reduced Chomp geometry changes."""
from pathlib import Path
import hashlib,json,shutil
root=Path(__file__).resolve().parents[3];base=root/'art/overhaul/chomp18/release';out=root/'art/overhaul/chomp19/release'
shutil.copytree(base,out,dirs_exist_ok=True)
shutil.copy2(out.parent/'export/chomprex-lod.glb',out/'dist/assets/chomprex.glb')
files={p.relative_to(out).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(out.rglob('*')) if p.is_file() and p.name!='manifest.json'}
changed=[p for p in files if (base/p).read_bytes()!=(out/p).read_bytes()];assert changed==['dist/assets/chomprex.glb']
(out/'manifest.json').write_text(json.dumps({'project_id':'appgprj_6acf0e7886908191820064ec6fa5afa0','status':'LOCAL ONLY; publication held','base_app_commit':'f1245351718970aca44732cc284777070c91e65a','variant':'Chomp18 with localized Chomp19 facial geometry only','changed_files':changed,'files':files},indent=2))
print(json.dumps({'files':len(files),'changed':changed,'manifestSha256':hashlib.sha256((out/'manifest.json').read_bytes()).hexdigest()}))
