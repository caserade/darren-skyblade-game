"""Independent GLB contract checks for the shoulder-only full-mesh rebuild."""
from pathlib import Path
import json,struct,hashlib
import numpy as np
root=Path(__file__).resolve().parents[1];checks={}
def load(p):
 raw=p.read_bytes();n=struct.unpack_from('<I',raw,12)[0];g=json.loads(raw[20:20+n]);buf=raw[28+n:]
 def ac(i):
  a=g['accessors'][i];v=g['bufferViews'][a['bufferView']];w={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4,'MAT4':16}[a['type']];dt=np.dtype({5121:'u1',5123:'<u2',5125:'<u4',5126:'<f4'}[a['componentType']]);return np.ndarray((a['count'],w),dtype=dt,buffer=buf,offset=v.get('byteOffset',0)+a.get('byteOffset',0),strides=(v.get('byteStride',w*dt.itemsize),dt.itemsize)).copy()
 return g,ac,hashlib.sha256(raw).hexdigest()
def tracks(g,a):
 out={}
 for an in g['animations']:
  for ch in an['channels']:
   s=an['samplers'][ch['sampler']];out[(an['name'],g['nodes'][ch['target']['node']]['name'],ch['target']['path'])]=(a(s['input']),a(s['output']),s.get('interpolation','LINEAR'))
 return out
def primitives(g):return {g['materials'][p['material']]['name']:p for p in g['meshes'][0]['primitives']}
def corners(p,a):
 at=p['attributes'];ix=a(p['indices']).reshape(-1);pos=a(at['POSITION'])[ix];normal=a(at['NORMAL'])[ix];uv=a(at['TEXCOORD_0'])[ix] if 'TEXCOORD_0' in at else np.zeros((len(ix),2));j=a(at['JOINTS_0'])[ix];w=a(at['WEIGHTS_0'])[ix];dense=np.zeros((len(ix),39));np.add.at(dense,(np.arange(len(ix))[:,None],j.astype(int)),w)
 return pos,normal,uv,dense
def triangles(p,a):
 data=corners(p,a);out={}
 for i in range(0,len(data[0]),3):
  ix=sorted(range(i,i+3),key=lambda j:tuple(data[0][j]));key=tuple(tuple(np.round(data[0][j],6)) for j in ix);out[key]=np.concatenate([q[ix] for q in data[1:]],axis=1)
 return out
g0,a0,h0=load(root/'skydrake12/export/skydrake-candidate.glb');g1,a1,h1=load(root/'skydrake14/export/skydrake-candidate.glb');gl,al,hl=load(root/'skydrake14/export/skydrake-lod.glb');t0=tracks(g0,a0)
for name,g,a in [('full',g1,a1),('reduced',gl,al)]:
 t=tracks(g,a);checks[name+'_animation_names']=set(t)==set(t0);checks[name+'_animation_values']=all(np.array_equal(t[k][0],t0[k][0]) and np.array_equal(t[k][1],t0[k][1]) and t[k][2]==t0[k][2] for k in t0);checks[name+'_bind_matrices']=np.array_equal(a(g['skins'][0]['inverseBindMatrices']),a0(g0['skins'][0]['inverseBindMatrices']));checks[name+'_bone_names']=[g['nodes'][i]['name'] for i in g['skins'][0]['joints']]==[g0['nodes'][i]['name'] for i in g0['skins'][0]['joints']]
p0,p1=primitives(g0),primitives(g1)
def body_triangles(pr,a):
 data=corners(pr,a);out={}
 for i in range(0,len(data[0]),3):
  ix=sorted(range(i,i+3),key=lambda j:tuple(data[2][j]));key=tuple(tuple(np.round(data[2][j],6)) for j in ix);out[key]=np.concatenate([q[ix] for q in data],axis=1)
 return out
oldbody,newbody=body_triangles(p0['skydrake_skin'],a0),body_triangles(p1['skydrake_skin'],a1)
checks['retained_body_uv_triangles_are_original']=set(newbody)<=set(oldbody)
body_displacements=[];outside=[]
for k,value in newbody.items():
 oldvalue=oldbody[k]
 for a,b in zip(oldvalue,value):
  body_displacements.append(float(np.linalg.norm(a[:3]-b[:3])))
  x,y,z=a[:3]
  if not(abs(x)>.45 and 1.6<y<3.2 and -.65<z<.85):outside.append(np.allclose(a,b,atol=.002))
checks['retained_body_unchanged_outside_local_join']=all(outside)
checks['boundary_fairing_is_bounded']=max(body_displacements)<.15
for name in p0:
 if name=='skydrake_skin':continue
 old,new=triangles(p0[name],a0),triangles(p1[name],a1)
 checks[name+'_triangle_positions_unchanged']=set(new)==set(old)
 checks[name+'_uv_weights_unchanged']=all(np.array_equal(v[:,3:],old[k][:,3:]) for k,v in new.items())
 checks[name+'_normals_within_roundtrip_tolerance']=all(np.allclose(v[:,:3],old[k][:,:3],atol=.002) for k,v in new.items())
allpos=[];allweights=[];edges={}
for name in ['skydrake_skin','SkyDrake shoulder retopology']:
 pos,normal,uv,w=corners(p1[name],a1);allpos.extend(pos);allweights.extend(w)
 for tri in pos.reshape(-1,3,3):
  keys=[tuple(np.round(x,5)) for x in tri]
  for j in range(3):
   key=tuple(sorted([keys[j],keys[(j+1)%3]]));edges[key]=edges.get(key,0)+1
pos=np.array(allpos);w=np.array(allweights);_,inv=np.unique(np.round(pos,5),axis=0,return_inverse=True);lo=np.full((inv.max()+1,39),np.inf);hi=np.full_like(lo,-np.inf);np.minimum.at(lo,inv,w);np.maximum.at(hi,inv,w);error=float(np.max(hi-lo));checks['full_coincident_skin_patch_weights_match']=error<1e-4
patchpos=corners(p1['SkyDrake shoulder retopology'],a1)[0];patchkeys={tuple(np.round(x,5)) for x in patchpos};bad=[(k,v) for k,v in edges.items() if any(x in patchkeys for x in k) and v!=2];checks['full_patch_edges_closed']=len(bad)==0

# Independent reduced seam check after decimation and final export.
pl=primitives(gl);lod_edges={};lod_pos=[];lod_w=[]
for name in ['skydrake_skin','SkyDrake shoulder retopology']:
 pp,nn,uv,ww=corners(pl[name],al);lod_pos.extend(pp);lod_w.extend(ww)
 for tri in pp.reshape(-1,3,3):
  keys=[tuple(np.round(x,5)) for x in tri]
  for j in range(3):
   k=tuple(sorted([keys[j],keys[(j+1)%3]]));lod_edges[k]=lod_edges.get(k,0)+1
lp=np.array(lod_pos);lw=np.array(lod_w);_,li=np.unique(np.round(lp,5),axis=0,return_inverse=True);ll=np.full((li.max()+1,39),np.inf);lh=np.full_like(ll,-np.inf);np.minimum.at(ll,li,lw);np.maximum.at(lh,li,lw);lod_error=float(np.max(lh-ll))
checks['reduced_coincident_skin_patch_weights_match']=lod_error<1e-4
lod_keys={tuple(np.round(x,5)) for x in corners(pl['SkyDrake shoulder retopology'],al)[0]};lod_bad=[(k,v) for k,v in lod_edges.items() if any(x in lod_keys for x in k) and v!=2]
checks['reduced_patch_edges_closed']=len(lod_bad)==0
report={'baselineSha256':h0,'candidateSha256':h1,'reducedSha256':hl,'checks':checks,'passed':all(checks.values()),'maximumCoincidentWeightError':error,'badPatchEdgeCount':len(bad),'reducedMaximumCoincidentWeightError':lod_error,'reducedBadPatchEdgeCount':len(lod_bad),'authoredTracks':len(t0),'maximumRetainedBoundaryDisplacement':max(body_displacements),'scope':'Retained body UV triangles are original; positions/weights/normals protected outside the local join. Boundary fairing is bounded to 0.15 model units. Protected other materials retain UVs/weights exactly, normals within 0.002 Blender roundtrip tolerance. Both rig/clip exports. Visual quality is evaluated separately in matched clay/textured poses.'}
(root/'skydrake14/review/retopology-verification-14.json').write_text(json.dumps(report,indent=2));print(json.dumps(report));assert report['passed']
