"""Independent byte and scope checks for a weights-only GLB repair."""
from pathlib import Path
import hashlib,json,struct
import numpy as np
root=Path(__file__).resolve().parents[1];reports=[]
def load(p):
 raw=p.read_bytes();n=struct.unpack_from('<I',raw,12)[0];g=json.loads(raw[20:20+n]);offset=28+n
 def ac(i):
  a=g['accessors'][i];v=g['bufferViews'][a['bufferView']];width={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4,'MAT4':16}[a['type']];dt=np.dtype({5121:'u1',5123:'<u2',5125:'<u4',5126:'<f4'}[a['componentType']]);start=offset+v.get('byteOffset',0)+a.get('byteOffset',0);stride=v.get('byteStride',width*dt.itemsize);return np.ndarray((a['count'],width),dtype=dt,buffer=raw,offset=start,strides=(stride,dt.itemsize)).copy(),(start,stride,width*dt.itemsize,a['count'])
 return raw,g,ac
for variant in ['candidate','lod']:
 p=root/'skydrake15/export'/('skydrake-'+variant+'.glb');old,og,oa=load(root/'skydrake14/export'/p.name);new,g,a=load(p);pr=next(x for x in g['meshes'][0]['primitives'] if g['materials'][x['material']]['name']=='skydrake_skin');at=pr['attributes'];pos,_=a(at['POSITION']);j,jr=a(at['JOINTS_0']);w,wr=a(at['WEIGHTS_0']);oj,_=oa(at['JOINTS_0']);ow,_=oa(at['WEIGHTS_0'])
 allowed=np.zeros(len(new),dtype=bool)
 for start,stride,width,count in [jr,wr]:
  for i in range(count):allowed[start+i*stride:start+i*stride+width]=True
 delta=np.frombuffer(old,dtype=np.uint8)!=np.frombuffer(new,dtype=np.uint8);changed=np.any(j!=oj,axis=1)|np.any(w!=ow,axis=1);x,y,z=pos.T;mask=(abs(x)<1.10001)&(y>.54999)&(y<1.75001)&(z>-1.60001)&(z<-.19999)
 checks={'sameByteLength':len(old)==len(new),'sameGLBJson':og==g,'onlyJointAndWeightBytesChanged':not np.any(delta&~allowed),'changesConfinedToHipTail':not np.any(changed&~mask),'finiteWeights':bool(np.isfinite(w).all()),'normalizedWeights':bool(np.max(abs(w.sum(axis=1)-1))<1e-6),'nonnegativeWeights':bool(w.min()>=0),'validBoneIndices':bool(j.max()<len(g['skins'][0]['joints'])),'fourInfluences':w.shape[1]==4,'geometryTexturesClipsAndRigBytePreserved':not np.any(delta&~allowed)}
 mapping=json.loads((root/'skydrake15/source'/('weights-'+variant+'.json')).read_text());names=[g['nodes'][i]['name'] for i in g['skins'][0]['joints']];bypos={tuple(round(v,5) for v in d['position']):d['weights'] for d in mapping};matched=True
 for i in np.flatnonzero(changed):
  expected=bypos[tuple(round(float(v),5) for v in pos[i])];actual={names[int(k)]:float(v) for k,v in zip(j[i],w[i]) if v>0};matched=matched and set(actual)==set(expected) and all(abs(v-expected[k])<1e-6 for k,v in actual.items())
 checks['sourceWeightMapMatchesExport']=matched
 reports.append({'variant':variant,'sha256':hashlib.sha256(new).hexdigest(),'changedBytes':int(delta.sum()),'changedExportVertices':int(changed.sum()),'checks':checks,'passed':all(checks.values())})
(root/'skydrake15/review/weight-contract-15.json').write_text(json.dumps(reports,indent=2));print(json.dumps(reports));assert all(x['passed'] for x in reports)
