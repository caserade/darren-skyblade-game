from pathlib import Path
import json,struct,hashlib
import numpy as np
root=Path(__file__).resolve().parents[1];out=root/'stormbelly20';reports=[]
def positions(path):
 raw=path.read_bytes();n=struct.unpack_from('<I',raw,12)[0];g=json.loads(raw[20:20+n]);a=g['accessors'][g['meshes'][0]['primitives'][0]['attributes']['POSITION']];v=g['bufferViews'][a['bufferView']]
 return np.ndarray((a['count'],3),dtype='<f4',buffer=raw,offset=n+28+v.get('byteOffset',0)+a.get('byteOffset',0),strides=(v.get('byteStride',12),4))
for variant in ['candidate','lod']:
 old=root/'heavyweight/export'/('heavyweight-'+variant+'.glb');new=out/'export'/old.name;p=positions(old);q=positions(new);delta=np.linalg.norm(q-p,axis=1);features=json.loads((out/'source'/('features-'+variant+'.json')).read_text())['features'];body=max(features,key=lambda f:f['vertices']);checks={};detail=[]
 allowed=np.zeros(len(p),bool);body_ids=np.array(body['indices']);face=body_ids[(p[body_ids,1]>=3.64)&(p[body_ids,1]<=4.10)&(abs(p[body_ids,0])<=.53)&(p[body_ids,2]>=.58)&(p[body_ids,2]<=1.10)];allowed[face]=True
 for f in features:
  ids=np.array(f['indices']);kind=f['kind'];changed=int(np.count_nonzero(delta[ids]>0))
  if kind in ['eye','jaw','tusk','horn']:allowed[ids]=True
  if f is not body and kind=='other':checks['otherComponent'+str(f.get('id',len(detail)))+'Unchanged']=changed==0
  if kind=='horn':
   anchor=ids[(p[ids,1]<=4.0)|(abs(p[ids,0])<=.30)];checks['hornAnchor'+str(len(detail))]=len(anchor)>0 and np.array_equal(p[anchor],q[anchor])
  if kind=='jaw':
   anchor=ids[p[ids,2]<=.55];checks['jawRearHingeAnchored']=len(anchor)>0 and np.array_equal(p[anchor],q[anchor])
  detail.append({'kind':kind,'vertices':len(ids),'changedVertices':changed,'maximumDisplacement':float(delta[ids].max())})
 checks['allChangesInsideFacialScope']=not np.any(delta[~allowed]>0)
 checks['eightExistingEyeComponents']=sum(f['kind']=='eye' for f in features)==8
 checks['twoExistingHorns']=sum(f['kind']=='horn' for f in features)==2
 checks['belowFaceBodyUnchanged']=np.array_equal(p[body_ids[p[body_ids,1]<3.64]],q[body_ids[p[body_ids,1]<3.64]])
 reports.append({'variant':variant,'assetSha256':hashlib.sha256(new.read_bytes()).hexdigest(),'checks':checks,'components':detail,'passed':all(checks.values())})
report={'scope':'Exact position comparison against accepted checkpoint08 connected components. Existing eye/jaw/tusk/horn components plus a bounded body-mesh eyelid region only. Non-facial components, horn roots and rear jaw hinge remain byte-identical. Does not certify all self-intersections.','variants':reports,'passed':all(r['passed'] for r in reports)}
(out/'review/facial-scope-20.json').write_text(json.dumps(report,indent=2));print(json.dumps({'passed':report['passed'],'variants':[{'variant':r['variant'],'failed':[k for k,v in r['checks'].items() if not v]} for r in reports]}));assert report['passed']
