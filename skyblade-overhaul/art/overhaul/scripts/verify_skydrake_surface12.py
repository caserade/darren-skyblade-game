"""Verify the targeted edit against checkpoint 11, independent of its builder."""
from pathlib import Path
import json,struct,hashlib
import numpy as np
root=Path(__file__).resolve().parents[1];checks={}
def load(p):
 raw=p.read_bytes();n=struct.unpack_from('<I',raw,12)[0];g=json.loads(raw[20:20+n]);buf=raw[28+n:]
 def ac(i):
  a=g['accessors'][i];v=g['bufferViews'][a['bufferView']];w={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4,'MAT4':16}[a['type']];dt=np.dtype({5121:'u1',5123:'<u2',5125:'<u4',5126:'<f4'}[a['componentType']]);return np.ndarray((a['count'],w),dtype=dt,buffer=buf,offset=v.get('byteOffset',0)+a.get('byteOffset',0),strides=(v.get('byteStride',w*dt.itemsize),dt.itemsize)).copy()
 return g,ac,hashlib.sha256(raw).hexdigest()
g0,a0,h0=load(root/'skydrake11/export/skydrake-candidate.glb');g1,a1,h1=load(root/'skydrake12/export/skydrake-candidate.glb')
def tracks(g,ac):
 out={}
 for anim in g['animations']:
  for ch in anim['channels']:
   sm=anim['samplers'][ch['sampler']];key=(anim['name'],g['nodes'][ch['target']['node']]['name'],ch['target']['path']);out[key]=(ac(sm['input']),ac(sm['output']),sm.get('interpolation','LINEAR'))
 return out
t0,t1=tracks(g0,a0),tracks(g1,a1);checks['animation_track_names_unchanged']=set(t0)==set(t1);checks['all_authored_animation_values_unchanged']=all(np.array_equal(t0[k][0],t1[k][0]) and np.array_equal(t0[k][1],t1[k][1]) and t0[k][2]==t1[k][2] for k in t0)
checks['bind_matrices_unchanged']=np.array_equal(a0(g0['skins'][0]['inverseBindMatrices']),a1(g1['skins'][0]['inverseBindMatrices']))
checks['bone_names_unchanged']=[g0['nodes'][i]['name'] for i in g0['skins'][0]['joints']]==[g1['nodes'][i]['name'] for i in g1['skins'][0]['joints']]
p0=g0['meshes'][0]['primitives'];p1=g1['meshes'][0]['primitives']
for k in range(1,len(p0)):
 name=g0['materials'][p0[k]['material']]['name'];checks[name+'_geometry_and_weights_unchanged']=all(np.array_equal(a0(p0[k]['attributes'][n]),a1(p1[k]['attributes'][n])) for n in ['POSITION','NORMAL','WEIGHTS_0','JOINTS_0']) and np.array_equal(a0(p0[k]['indices']),a1(p1[k]['indices']))
def feet(g,ac):
 p=g['meshes'][0]['primitives'][0];a=p['attributes'];v=ac(a['POSITION']);w=ac(a['WEIGHTS_0']);j=ac(a['JOINTS_0']);d={}
 for i in np.where(v[:,1]<.65)[0]:
  row=np.zeros(39);np.add.at(row,j[i].astype(int),w[i]);d[tuple(np.round(v[i],6))]=row
 return d
f0,f1=feet(g0,a0),feet(g1,a1);checks['lower_legs_positions_unchanged']=set(f0)==set(f1);checks['lower_legs_weights_unchanged']=set(f0)==set(f1) and all(np.allclose(f0[k],f1[k],atol=1e-6) for k in f0)
# UV chart duplication must not cause cracks after smoothing.
a=p1[0]['attributes'];v=a1(a['POSITION']);ix=a1(p1[0]['indices']).reshape(-1,3);checks['body_positions_finite']=bool(np.isfinite(v).all())
oldv=a0(p0[0]['attributes']['POSITION']);oldix=a0(p0[0]['indices']).reshape(-1,3)
# Same triangle-corner UVs permit unambiguous seam correspondence despite vertex packing.
oldcorner=oldv[oldix].reshape(-1,3);newcorner=v[ix].reshape(-1,3)
checks['same_body_triangle_corner_count']=len(oldcorner)==len(newcorner)
oldj=a0(p0[0]['attributes']['JOINTS_0']);oldw=a0(p0[0]['attributes']['WEIGHTS_0']);newj=a1(p1[0]['attributes']['JOINTS_0']);neww=a1(p1[0]['attributes']['WEIGHTS_0'])
checks['all_body_weights_retain_checkpoint11']=np.array_equal(oldj[oldix],newj[ix]) and np.array_equal(oldw[oldix],neww[ix])
region=(abs(oldcorner[:,0])>.65)&(oldcorner[:,1]>1.8)&(oldcorner[:,1]<2.8)&(oldcorner[:,2]<.4)
checks['posterolateral_shoulder_geometry_unchanged']=np.array_equal(oldcorner[region],newcorner[region])
bake=json.loads((root/'skydrake12/review/surface-bake-12.json').read_text());uv=a1(a['TEXCOORD_0'])
checks['bake_matches_exact_final_geometry']=hashlib.sha256(v.tobytes()+ix.astype('<u4').tobytes()+uv.tobytes()).hexdigest()==bake['inputGeometrySha256']

_,inv=np.unique(np.round(oldcorner,5),axis=0,return_inverse=True);lo=np.full((inv.max()+1,3),np.inf);hi=np.full_like(lo,-np.inf);np.minimum.at(lo,inv,newcorner);np.maximum.at(hi,inv,newcorner);seam=float(np.max(np.linalg.norm(hi-lo,axis=1)));checks['no_new_uv_seam_separation']=seam<1e-5
gl,al,hl=load(root/'skydrake12/export/skydrake-lod.glb');lp=gl['meshes'][0]['primitives'][0];la=lp['attributes'];lv=al(la['POSITION']);li=al(lp['indices']).reshape(-1,3);lu=al(la['TEXCOORD_0']);lb=json.loads((root/'skydrake12/review/surface-bake-lod-12.json').read_text())
checks['reduced_bake_matches_exact_final_geometry']=hashlib.sha256(lv.tobytes()+li.astype('<u4').tobytes()+lu.tobytes()).hexdigest()==lb['inputGeometrySha256']
report={'baselineSha256':h0,'candidateSha256':h1,'reducedSha256':hl,'checks':checks,'passed':all(checks.values()),'oldCoincidentCornerMaximumSeparation':seam,'lowerLegUniqueVertices':len(f0),'authoredTracks':len(t0),'scope':'Full mesh strict unchanged submeshes, authored animation data, bind matrices and lower-leg geometry/weights; seam correspondence. Reduced mesh separately structure- and runtime-tested.'}
(root/'skydrake12/review/surface-verification-12.json').write_text(json.dumps(report,indent=2));print(json.dumps(report));assert report['passed']
