"""Isolated RC16-derived package, replacing only the accepted reduced Chomp GLB."""
from pathlib import Path
import hashlib,json,shutil
root=Path(__file__).resolve().parents[3];base=root/'art/overhaul/skydrake16/release';out=root/'art/overhaul/chomp18/release';scripts=root/'art/overhaul/scripts'
shutil.copytree(base,out,dirs_exist_ok=True)
shutil.copy2(out.parent/'export/chomprex-lod.glb',out/'dist/assets/chomprex.glb')
files={p.relative_to(out).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(out.rglob('*')) if p.is_file() and p.name!='manifest.json'}
changed=[p for p in files if not (base/p).exists() or (base/p).read_bytes()!=(out/p).read_bytes()];assert changed==['dist/assets/chomprex.glb']
(out/'manifest.json').write_text(json.dumps({'project_id':'appgprj_6acf0e7886908191820064ec6fa5afa0','status':'LOCAL ONLY; publication held','base_app_commit':'af98739877d97a021e3afc7feda137f1ec5865bc','variant':'RC16 with Chomp18 reduced mesh only','changed_files':changed,'files':files},indent=2))
server=(scripts/'serve_release16.cjs').read_text().replace('../skydrake16/release/dist','../chomp18/release/dist').replace('4324','4325');(scripts/'serve_chomp18.cjs').write_text(server)
for source,target in [('test_package_aggregate17.cjs','test_chomp_release18.cjs'),('test_package_soak17.cjs','test_chomp_soak18.cjs')]:
 text=(scripts/source).read_text().replace('art/overhaul/skydrake17/review','art/overhaul/chomp18/review').replace('art/overhaul/skydrake16/release','art/overhaul/chomp18/release').replace('serve_release16.cjs','serve_chomp18.cjs').replace('4324','4325').replace('release-package-tests-17','release-package-tests-18').replace('soak-final-17','soak-final-18').replace('qa.audit17','qa.chomp18').replace("appCommit:","candidate:'Chomp18-local',baseAppCommit:").replace('exact RC16 reduced-trio','RC16-derived Chomp18 reduced-trio')
 (scripts/target).write_text(text.rstrip()+'\n')
print(json.dumps({'files':len(files),'changed':changed,'manifestSha256':hashlib.sha256((out/'manifest.json').read_bytes()).hexdigest()}))
