from pathlib import Path
import hashlib,json,shutil
root=Path(__file__).resolve().parents[3];base=root/'art/overhaul/final-local-candidate21/release';out=root/'art/overhaul/final-local-candidate22/release';asset=root/'art/overhaul/skydrake22/export/skydrake-lod.glb'
shutil.copytree(base,out,dirs_exist_ok=True);shutil.copy2(asset,out/'dist/assets/skydrake-rc15.glb')
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
files={p.relative_to(out).as_posix():sha(p) for p in sorted(out.rglob('*')) if p.is_file() and p.name!='manifest.json'};changed=[p for p in files if (out/p).read_bytes()!=(base/p).read_bytes()];assert changed==['dist/assets/skydrake-rc15.glb']
m=json.loads((base/'manifest.json').read_text());m.update({'status':'FINAL LOCAL CANDIDATE22; publication held; art remains approximate','base_app_commit':'1e1975ffe83fb636dab097553ee662c00a324eff','variant':'Candidate21 app, Chomp19 and Stormbelly20; SkyDrake22 localized neck/chest weights','changed_files_from_candidate21':changed,'files':files});m['accepted_assets'].pop('SkyDrake15');m['accepted_assets']['SkyDrake22']={'source':asset.relative_to(root).as_posix(),'sha256':sha(asset)};m.pop('changed_files_from_candidate20',None);(out/'manifest.json').write_text(json.dumps(m,indent=2));print(json.dumps({'files':len(files),'changed':changed,'manifestSha256':sha(out/'manifest.json')}))
