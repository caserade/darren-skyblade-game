from pathlib import Path
import hashlib,json,subprocess,sys
root=Path(__file__).resolve().parents[3];git='C:/Users/caser/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/git/cmd/git.exe';revision=sys.argv[1] if len(sys.argv)>1 else ''
def blob(p):return subprocess.check_output([git,'show',revision+':'+p],cwd=root)
paths=subprocess.check_output([git,'diff','--cached','--name-only'],cwd=root,text=True).splitlines() if not revision else subprocess.check_output([git,'diff-tree','--no-commit-id','--name-only','-r',revision],cwd=root,text=True).splitlines()
checked=[];mismatch=[]
for p in paths:
 if p in ['art/overhaul/.gitignore','art/overhaul/.gitattributes']:continue
 raw=(root/p).read_bytes();saved=blob(p)
 if raw!=saved:mismatch.append(p)
 checked.append(p)
manifest=json.loads((root/'art/overhaul/skydrake16/release/manifest.json').read_text())
for p,h in manifest['files'].items():
 if hashlib.sha256(blob('art/overhaul/skydrake16/release/'+p)).hexdigest()!=h:mismatch.append('manifest:'+p)
print(json.dumps({'revision':revision or 'index','filesCompared':len(checked),'manifestFiles':len(manifest['files']),'mismatches':mismatch,'passed':not mismatch}));assert not mismatch

