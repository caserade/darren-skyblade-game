"""Independent scope and fixed-camera facial checks for the retained candidate."""
from pathlib import Path
import json,struct,hashlib
import numpy as np
from PIL import Image
root=Path(__file__).resolve().parents[3];out=root/'art/overhaul/chomp19';rows=[]
def load(p):
 raw=p.read_bytes();n=struct.unpack_from('<I',raw,12)[0];g=json.loads(raw[20:20+n]);b=raw[n+28:];attrs=g['meshes'][0]['primitives'][0]['attributes'];a=g['accessors'][attrs['POSITION']];v=g['bufferViews'][a['bufferView']];pos=np.ndarray((a['count'],3),dtype='<f4',buffer=b,offset=v.get('byteOffset',0)+a.get('byteOffset',0)).copy();return pos
for variant in ['candidate','lod']:
 p=root/'art/overhaul/chomp18/export'/f'chomprex-{variant}.glb';q=out/'export'/p.name;before=load(p);after=load(q);f=json.loads((out/'source'/f'features-{variant}.json').read_text())['features'];body=max(f,key=lambda x:x['vertices']);eyes=[x for x in f if x['kind']!='tooth' and x['bone']=='head' and x['center'][1]>4.2 and x['center'][2]>1.1];rear=[x for x in f if x['kind']=='tooth' and x['center'][2]<=1.4];unchanged=lambda ids:bool(np.array_equal(before[ids],after[ids]));bodyids=np.array(body['indices']);below=bodyids[before[bodyids,1]<=3.76]
 checks={'bodyBelowFaceUnchanged':unchanged(below),'eyeIrisPupilCatchlightComponentsUnchanged':len(eyes)==8 and all(unchanged(x['indices']) for x in eyes),'rearCrownsUnchanged':len(rear)==14 and all(unchanged(x['indices']) for x in rear),'allChangedVerticesWithinFace':bool(np.all(before[np.any(before!=after,axis=1),1]>3.3))}
 rows.append({'variant':variant,'assetSha256':hashlib.sha256(q.read_bytes()).hexdigest(),'checks':checks,'unchangedRearCrowns':len(rear),'unchangedEyeComponents':len(eyes),'passed':all(checks.values())})
counts={}
for kind in ['before','after']:
 p=out/'review/expression'/f'lod-{kind}-biteWindup-999-front-face.png';a=np.array(Image.open(p).convert('RGB'));result=[]
 for box in [(300,445,370,585),(630,445,705,585)]:
  x,y,x1,y1=box;c=a[y:y1,x:x1].astype(float);white=(c[:,:,0]>190)&(c[:,:,1]>180)&(c[:,:,2]>160)&(c[:,:,2]>c[:,:,1]*.80);result.append({'roi':box,'ivoryPixels':int(white.sum())})
 counts[kind]=result
report={'variants':rows,'openMouthCheekPixelCheck':counts,'scope':'Rear 14 crowns and all eight eye components remain exactly Chomp18. Body below face unchanged. Fixed maximum-windup front gold-cheek crops check the regression caught in study C; this is not an exhaustive intersection test.','passed':all(r['passed'] for r in rows) and sum(r['ivoryPixels'] for r in counts['after'])<=sum(r['ivoryPixels'] for r in counts['before'])};(out/'review/facial-scope-19.json').write_text(json.dumps(report,indent=2));print(json.dumps(report));assert report['passed']
