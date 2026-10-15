"""Bind final audit evidence to immutable RC16 package and accepted art/source files."""
from pathlib import Path
import hashlib, json, subprocess, zipfile

root = Path(__file__).resolve().parents[3]
git = 'C:/Users/caser/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/git/cmd/git.exe'
commit = 'af98739877d97a021e3afc7feda137f1ec5865bc'
release = root/'art/overhaul/skydrake16/release'
review = root/'art/overhaul/skydrake17/review'
archive = root.parent/'Skyblade-RC16-local.zip'
def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def read(p): return json.loads(p.read_text())
def saved(p): return subprocess.check_output([git, 'show', commit+':'+p], cwd=root)
manifest = read(release/'manifest.json')
checks = {}
actual = sorted(p.relative_to(release).as_posix() for p in release.rglob('*') if p.is_file())
checks['exactPackageInventory'] = actual == sorted(list(manifest['files'])+['manifest.json'])
checks['manifestMatchesDisk'] = all(sha(release/p) == h for p,h in manifest['files'].items())
checks['everyPackageFileMatchesAppCommit'] = all(saved('art/overhaul/skydrake16/release/'+p) == (release/p).read_bytes() for p in actual)
checks['manifestIdentity'] = sha(release/'manifest.json') == '7fea972be4e412486901e9400c6888bbc47e909bd95a778f8938a17f19e0b598'
checks['zipUnchanged'] = sha(archive) == '109e422ee8da7354b7f7206f7ce302d30c82689c95a194339870a76713e40a2b'
with zipfile.ZipFile(archive) as z:
    names = sorted(n for n in z.namelist() if not n.endswith('/'))
    package_names = [n for n in names if n.startswith('dist/') or n.startswith('.openai/') or n == 'manifest.json']
    checks['zipPackageInventoryExact'] = package_names == actual
    checks['zipPackageBytesExact'] = all(z.read(p) == (release/p).read_bytes() for p in actual)
    extras = {
        'CHECKPOINT-16.md': 'art/overhaul/CHECKPOINT-16.md',
        'review/original-RC15-startup-failure.json': 'art/overhaul/skydrake15/review/aggregate-intermittent-collision-15.json',
        **{'review/'+n: 'art/overhaul/skydrake15/review/boards/'+n for n in ['Skyblade-RC15-Chomp-Rex-review.png','Skyblade-RC15-SkyDrake-review.png','Skyblade-RC15-Stormbelly-review.png','board-provenance.json']},
        **{'review/'+n: 'art/overhaul/skydrake16/review/'+n for n in ['release-package-tests-16.json','startup-causal-reproduction-16.json','startup-matrix-16.json','verification-summary-16.json']},
    }
    checks['zipOnlyExpectedReviewExtras'] = names == sorted(actual+list(extras)+['README.txt']) and all(z.read(n)==(root/p).read_bytes() for n,p in extras.items())
    checks['zipNoExperimentalOrEditableAssets'] = not any(n.lower().endswith(('.blend','.blend1','.py','.cjs')) or '/tests/' in n.lower() for n in names)
    readme = z.read('README.txt').decode('utf-8')
    checks['portableLaunchInstructions'] = 'python -m http.server 4324 --bind 127.0.0.1 --directory dist' in readme
accepted = {
 'dist/assets/chomprex.glb': 'art/overhaul/chomprex/export/chomprex-lod.glb',
 'dist/assets/stormbelly-rc15.glb': 'art/overhaul/heavyweight/export/heavyweight-lod.glb',
 'dist/assets/skydrake-rc15.glb': 'art/overhaul/skydrake15/export/skydrake-lod.glb',
 'dist/assets/skydrake.glb': 'dist/assets/skydrake.glb',
}
checks['onlyAcceptedTrioAndExistingFallbackGlbs'] = sorted(p for p in actual if p.endswith('.glb')) == sorted(accepted) and all((release/p).read_bytes() == (root/e).read_bytes() for p,e in accepted.items())
aggregate = read(review/'release-package-tests-17.json')
soak = read(review/'soak-final-17/soak-report.json')
checks['aggregate250'] = aggregate['passed'] and sum(r['total'] for r in aggregate['results']) == 250 and all(r['passed']==r['total'] and not r['errors'] for r in aggregate['results'])
cycles = [c for p in soak['profiles'] for c in p['cycles']]
checks['repeatedFlows340'] = soak['passed'] and len(cycles)==20 and sum(len(c['checks']) for c in cycles)==340 and all(c['pass'] for r in cycles for c in r['checks']) and all(not p['errors'] for p in soak['profiles'])
checks['testsBoundToFinalPackage'] = all(r['appCommit']==commit and r['packageManifestSha256']==sha(release/'manifest.json') for r in [aggregate,soak])
sources = read(review/'editable-sources-17.json')
checks['sixEditableSourcesReopened'] = sources['passed'] and len(sources['sources'])==6
checks['sourceAndExportsMatchCommittedBytes'] = all(saved(r[k]) == (root/r[k]).read_bytes() for r in sources['sources'] for k in ['source','export'])
boards = read(root/'art/overhaul/skydrake15/review/boards/board-provenance.json')
checks['threeBoardsAndAllReferenceInputsMatchProvenance'] = len(boards)==3 and all(sha(Path(b['file']))==b['sha256'] and all(sha(root/s['file'])==s['sha256'] for s in b['sources']) for b in boards)
checks['protectedFilesUnchangedSinceAppCommit'] = not subprocess.check_output([git,'diff','--name-only',commit,'--','dist','.openai','tests','art/references','art/overhaul/chomprex','art/overhaul/heavyweight','art/overhaul/skydrake15','art/overhaul/skydrake16'],cwd=root,text=True).strip()
report = {'appCommit':commit, 'manifestSha256':sha(release/'manifest.json'), 'zipSha256':sha(archive), 'checks':checks, 'passed':all(checks.values()), 'packageFiles':actual, 'zipFiles':names, 'acceptedAssets':accepted, 'aggregateChecks':250,'repeatedFlowChecks':340,'sourcesReportSha256':sha(review/'editable-sources-17.json'), 'aggregateReportSha256':sha(review/'release-package-tests-17.json'), 'soakReportSha256':sha(review/'soak-final-17/soak-report.json'), 'limits':'Source continuity validated by read-only reopening; no regeneration or export. Tests use isolated profiles and controlled accelerated simulation, not physical devices or a full playthrough. Publication remains held.'}
(review/'final-audit-17.json').write_text(json.dumps(report,indent=2))
print(json.dumps({'passed':report['passed'],'checks':checks,'packageFiles':len(actual),'zipFiles':len(names)}))
assert report['passed']
