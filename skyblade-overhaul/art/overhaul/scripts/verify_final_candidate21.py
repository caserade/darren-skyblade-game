from pathlib import Path
import json,hashlib,subprocess,ast
root=Path(__file__).resolve().parents[3]; review=root/'art/overhaul/hud21/review'; release=root/'art/overhaul/final-local-candidate21/release'; base=root/'art/overhaul/final-local-candidate20/release'
def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def read(p): return json.loads(p.read_text())
m=read(release/'manifest.json'); mh=sha(release/'manifest.json'); checks={}
checks['exact46FileManifest']=sorted(p.relative_to(release).as_posix() for p in release.rglob('*') if p.is_file())==sorted([*m['files'],'manifest.json']) and len(m['files'])==46 and all(sha(release/p)==h for p,h in m['files'].items())
changed=sorted(p for p in m['files'] if not (base/p).exists() or (release/p).read_bytes()!=(base/p).read_bytes())
checks['onlyThreeUIFilesChanged']=changed==['dist/index.html','dist/responsive-ui21.css','dist/src/core.js']
checks['acceptedArtExact']=all(sha(root/a['source'])==a['sha256'] for a in m['accepted_assets'].values()) and all((release/p).read_bytes()==(base/p).read_bytes() for p in m['files'] if p.startswith('dist/assets/'))
checks['projectIdentityPreserved']=m['project_id']=='appgprj_6acf0e7886908191820064ec6fa5afa0' and (release/'.openai/hosting.json').read_bytes()==(base/'.openai/hosting.json').read_bytes()
a=read(review/'release-package-tests-21.json'); s=read(review/'soak-final-21/soak-report.json'); t=read(review/'startup/startup-matrix-21.json'); l=read(review/'layout/layout-review-21.json'); i=read(review/'interaction-tests-21.json')
checks['aggregate250']=a['passed'] and sum(r['total'] for r in a['results'])==250
checks['soak340']=s['passed'] and sum(len(c['checks']) for p in s['profiles'] for c in p['cycles'])==340
checks['startup320']=t['passed'] and len(t['results'])==28 and sum(len(r['checks']) for r in t['results'])==320
checks['layout108Screens']=l['passed'] and len(l['rows'])==108
checks['interaction243']=i['passed'] and len(i['checks'])==243
checks['allTestsExactManifest']=all(r['packageManifestSha256']==mh for r in [a,s,l,i]) and t['manifestSha256']==mh
b=read(review/'boards/board-provenance-21.json'); checks['threeBoardsExactProvenance']=len(b)==3 and all(sha(review/'boards'/x['board'])==x['sha256'] and all(sha(root/p['path'])==p['sha256'] for p in x['sources']) for x in b)
fallbacks={'Skyblade-Final-Local-Candidate20.zip':'be6794889e992204a4613d3e363b0e6a44db3d12f127fcc2ca4c778a71735d48','Skyblade-Chomp19-local.zip':'4cca92a9403bf98d3ece1c58b3b72e384c8de212603835a936de0730c74f694a','Skyblade-Chomp18-local.zip':'7c12f4b79270364748dea6458c9bb3394e1b52857dda08e0cd9333bfc0ebc20a','Skyblade-RC16-local.zip':'109e422ee8da7354b7f7206f7ce302d30c82689c95a194339870a76713e40a2b'}
checks['fallbackArchivesUnchanged']=all(sha(root.parent/p)==h for p,h in fallbacks.items())
git='C:/Users/caser/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/git/cmd/git.exe'
checks['priorSourceTreesUnchanged']=not subprocess.check_output([git,'diff','--name-only',m['base_app_commit'],'--','dist','.openai','tests','art/references','art/overhaul/chomp19','art/overhaul/stormbelly20','art/overhaul/skydrake15','art/overhaul/final-local-candidate20'],cwd=root,text=True).strip()
for p in (root/'art/overhaul/scripts').glob('*21.*'):
 if p.suffix=='.py': ast.parse(p.read_text())
 elif p.suffix=='.cjs': subprocess.run(['node','--check',str(p)],check=True,capture_output=True)
subprocess.run(['node','--check',str(release/'dist/src/core.js')],check=True,capture_output=True)
checks['syntax']=True
report={'passed':all(checks.values()),'manifestSha256':mh,'baseCommit':m['base_app_commit'],'changedFiles':changed,'checks':checks,'acceptedAssets':m['accepted_assets'],'scope':'UI repair only; no publication. Browser-emulated touch/safe areas and synthetic Gamepad API; no physical hardware/full playthrough claim.'}
(review/'final-verification-21.json').write_text(json.dumps(report,indent=2));print(json.dumps(report));assert report['passed']
