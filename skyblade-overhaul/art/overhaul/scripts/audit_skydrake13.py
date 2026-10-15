import json,struct,hashlib,io
from pathlib import Path
import numpy as np
from PIL import Image
root=Path(__file__).resolve().parents[1]/'skydrake13'
expected={'idle':2.4,'walk':1.2,'turn':1,'hit':.45,'stagger':1.6,'recover':.8,'death':2.2,'flyIdle':.8,'takeoff':1,'land':.6,'attackWindup':.9,'attack':.6,'tailWindup':.7,'tailWhip':.5}
reports=[]
for name in ['candidate','lod']:
 p=root/'export'/('skydrake-'+name+'.glb');raw=p.read_bytes();n=struct.unpack_from('<I',raw,12)[0];g=json.loads(raw[20:20+n]);buf=raw[28+n:]
 def accessor(i):
  a=g['accessors'][i];v=g['bufferViews'][a['bufferView']];w={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4,'MAT4':16}[a['type']];dt=np.dtype({5120:'i1',5121:'u1',5122:'<i2',5123:'<u2',5125:'<u4',5126:'<f4'}[a['componentType']]);x=np.ndarray((a['count'],w),dtype=dt,buffer=buf,offset=v.get('byteOffset',0)+a.get('byteOffset',0),strides=(v.get('byteStride',w*dt.itemsize),dt.itemsize)).copy()
  return x.astype(float)/np.iinfo(dt).max if a.get('normalized') else x
 checks={};details=[];prims=[p for m in g['meshes'] for p in m['primitives']]
 for k,prim in enumerate(prims):
  a=prim['attributes'];pos=accessor(a['POSITION']);normal=accessor(a['NORMAL']);weights=accessor(a['WEIGHTS_0']);joints=accessor(a['JOINTS_0']);indices=accessor(prim['indices']).reshape(-1,3);uv=accessor(a['TEXCOORD_0']) if 'TEXCOORD_0' in a else None;tri=pos[indices];area=np.linalg.norm(np.cross(tri[:,1]-tri[:,0],tri[:,2]-tri[:,0]),axis=1)*.5
  c={'finite':all(np.isfinite(v).all() for v in [pos,normal,weights]),'valid_indices':int(indices.max())<len(pos),'valid_joints':int(joints.max())<39,'normalized_weights':float(np.max(np.abs(weights.sum(axis=1)-1)))<1e-4,'unit_normals':bool((np.abs(np.linalg.norm(normal,axis=1)-1)<1e-3).all()),'positive_area':bool((area>1e-13).all())}
  if k==0:
   dense=np.zeros((len(pos),39));np.add.at(dense,(np.arange(len(pos))[:,None],joints.astype(int)),weights);_,inverse=np.unique(np.round(pos,5),axis=0,return_inverse=True);low=np.full((int(inverse.max())+1,39),np.inf);high=np.full_like(low,-np.inf);np.minimum.at(low,inverse,dense);np.maximum.at(high,inverse,dense);seam_error=float(np.max(high-low));c['coincident_seam_weights_match']=seam_error<1e-4
  if k==0:c['atlas_uv_finite_in_range']=uv is not None and bool(np.isfinite(uv).all()) and float(uv.min())>=-1e-6 and float(uv.max())<=1.000001;c['atlas_not_double_tinted']='COLOR_0' not in a
  details.append({'primitive':k,'material':g['materials'][prim['material']]['name'],'triangles':len(indices),'vertices':len(pos),'checks':c})
  checks.update({f'primitive_{k}_{key}':bool(v) for key,v in c.items()})
 durations={a['name']:max(float(accessor(s['input']).max()) for s in a['samplers']) for a in g['animations']};checks['39_bones']=len(g['skins'][0]['joints'])==39;checks['14_original_clips']=set(durations)==set(expected);checks['original_durations']=all(abs(durations[k]-v)<1e-6 for k,v in expected.items());checks['12_draw_primitives']=len(prims)==12
 images=[]
 for im in g['images']:
  v=g['bufferViews'][im['bufferView']];data=buf[v.get('byteOffset',0):v.get('byteOffset',0)+v['byteLength']];im2=Image.open(io.BytesIO(data));im2.load();images.append({'name':im['name'],'size':list(im2.size),'sha256':hashlib.sha256(data).hexdigest()})
 checks['two_1024_maps_one_512_patch']=len(images)==3 and sorted(i['size'] for i in images)==[[512,512],[1024,1024],[1024,1024]]
 reports.append({'file':p.name,'bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest(),'triangles':sum(d['triangles'] for d in details),'bones':39,'durations':durations,'images':images,'primitives':details,'checks':checks,'passed':all(checks.values())})
(root/'review/glb-validation-13.json').write_text(json.dumps(reports,indent=2));print(json.dumps([{k:r[k] for k in ['file','bytes','sha256','triangles','bones','passed']} for r in reports]));assert all(r['passed'] for r in reports)
