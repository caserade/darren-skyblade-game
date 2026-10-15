from pathlib import Path
import json,shutil,hashlib
root=Path(__file__).resolve().parents[1];out=root/'skydrake22';reports=[]
for variant in ['candidate','lod']:
 trial='a' if variant=='candidate' else 'c'
 for name in ['skydrake-'+variant+'.glb','weights-'+variant+'.json']:
  target=out/('export' if name.endswith('.glb') else 'source')/name;shutil.copy2(out/'trials'/trial/name,target)
 before=json.loads((out/'review/motion'/('before-'+variant+'.json')).read_text());after=json.loads((out/'review/motion'/(trial+'-'+variant+'.json')).read_text());clips=[]
 for b,a in zip(before['clips'],after['clips']):
  clips.append({'clip':b['clip'],**{k:{'before':max(s[k]['max'] for s in b['samples']),'after':max(s[k]['max'] for s in a['samples'])} for k in ['all','local','neck']},'localP99':{'before':max(s['local']['p99'] for s in b['samples']),'after':max(s['local']['p99'] for s in a['samples'])},'collapsedTriangles':{'before':max(s['collapsedTriangles'] for s in b['samples']),'after':max(s['collapsedTriangles'] for s in a['samples'])}})
 reports.append({'variant':variant,'selectedTrial':trial,'acceptedForRelease':variant=='lod','assetSha256':after['assetSha256'],'clips':clips})
(out/'review/trial-selection-22.json').write_text(json.dumps({'decision':'Select trial C for the playable reduced mesh: all local/neck peak and local P99 stretch measures improve across all 14 clips. Retain full trial A as an UNACCEPTED working experiment only: it improves local stretch but introduces an extra compressed stagger triangle (peak 2 versus 1 baseline) and a 0.12% neck-stretch increase in tailWhip. Full C also introduces a compressed turn triangle. Preserve SkyDrake15 full as the accepted full-resolution fallback. Trial B is rejected. Raw poses reviewed separately.','variants':reports},indent=2));print(json.dumps(reports))
