import json,struct,hashlib,io
from pathlib import Path
import numpy as np
from PIL import Image
root=Path(__file__).resolve().parents[1]/'chomprex'
expected={'bite':.3,'biteWindup':.45,'charge':.5,'chargeWindup':.8,'death':2.2,'hit':.45,'idle':2.4,'recover':.8,'recovery':1.2,'stagger':1.6,'turn':1,'walk':1.2}
reports=[]
for name in ['candidate','lod']:
 p=root/'export'/('chomprex-'+name+'.glb');raw=p.read_bytes();jlen=struct.unpack_from('<I',raw,12)[0];g=json.loads(raw[20:20+jlen]);off=20+jlen;blen=struct.unpack_from('<I',raw,off)[0];buf=raw[off+8:off+8+blen]
 def accessor(i):
  a=g['accessors'][i];v=g['bufferViews'][a['bufferView']];width={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4,'MAT4':16}[a['type']];typ={5120:'i1',5121:'u1',5122:'<i2',5123:'<u2',5125:'<u4',5126:'<f4'}[a['componentType']];dt=np.dtype(typ);pos=v.get('byteOffset',0)+a.get('byteOffset',0);stride=v.get('byteStride',width*dt.itemsize)
  x=np.ndarray((a['count'],width),dtype=dt,buffer=buf,offset=pos,strides=(stride,dt.itemsize)).copy()
  if a.get('normalized'):x=x.astype(float)/np.iinfo(dt).max
  return x
 checks={};prims=[p for m in g['meshes'] for p in m['primitives']];checks['one_draw_primitive']=len(prims)==1;triangles=0;weight_error=0
 for prim in prims:
  attrs=prim['attributes'];pos=accessor(attrs['POSITION']);norm=accessor(attrs['NORMAL']);uv=accessor(attrs['TEXCOORD_0']);w=accessor(attrs['WEIGHTS_0']);j=accessor(attrs['JOINTS_0']);ix=accessor(prim['indices']);triangles+=len(ix)//3;weight_error=max(weight_error,float(np.max(np.abs(w.sum(axis=1)-1))))
  checks.update({'finite_positions_normals_uv_weights':all(np.isfinite(a).all() for a in [pos,norm,uv,w]),'indices_in_range':int(ix.max())<len(pos),'weights_normalized':weight_error<1e-4,'at_most_four_influences':w.shape[1]==4,'joints_valid':int(j.max())<len(g['skins'][0]['joints']),'uv_within_atlas':float(uv.min())>=-1e-6 and float(uv.max())<=1.000001})
  tri=pos[ix.reshape(-1,3)];area=np.linalg.norm(np.cross(tri[:,1]-tri[:,0],tri[:,2]-tri[:,0]),axis=1)*.5
  checks['no_zero_area_triangles']=bool((area>1e-12).all());checks['unit_vertex_normals']=bool((np.abs(np.linalg.norm(norm,axis=1)-1)<1e-3).all())
  tuv=uv[ix.reshape(-1,3)];a=tuv[:,1]-tuv[:,0];b=tuv[:,2]-tuv[:,0];checks['nonzero_uv_triangle_area']=bool((np.abs(a[:,0]*b[:,1]-a[:,1]*b[:,0])>1e-14).all())
 durations={a['name']:max(float(accessor(s['input']).max()) for s in a['samplers']) for a in g['animations']};checks['all_12_source_clips']=set(durations)==set(expected);checks['source_durations_preserved']=all(abs(durations[k]-v)<1e-6 for k,v in expected.items())
 images=[];decoded=[]
 for im in g['images']:
  v=g['bufferViews'][im['bufferView']];b=buf[v.get('byteOffset',0):v.get('byteOffset',0)+v['byteLength']];image=Image.open(io.BytesIO(b));image.load();images.append({'name':im.get('name'),'size':image.size,'format':image.format,'bytes':len(b)});decoded.append(np.array(image.convert('RGBA')))
 coverage=[]
 for prim in prims:
  uv=accessor(prim['attributes']['TEXCOORD_0']);ix=accessor(prim['indices']).reshape(-1,3);t=uv[ix];ti=g['materials'][prim['material']]['pbrMetallicRoughness']['baseColorTexture']['index'];im=decoded[g['textures'][ti]['source']]
  counts=[]
  for bary in [(1/3,1/3,1/3),(.8,.1,.1),(.1,.8,.1),(.1,.1,.8)]:
   sample=np.sum(t*np.array(bary)[None,:,None],axis=1);pixel=np.clip((sample*np.array([im.shape[1],im.shape[0]])).astype(int),0,[im.shape[1]-1,im.shape[0]-1]);rgba=im[pixel[:,1],pixel[:,0]];blank=(rgba[:,3]<128)|(rgba[:,:3].max(axis=1)==0);counts.append(int(blank.sum()))
  coverage.append({'triangles':len(ix),'sample_locations_per_triangle':4,'blank_samples_by_location':counts})
 checks['no_blank_atlas_samples']=all(sum(c['blank_samples_by_location'])==0 for c in coverage)
 checks['three_embedded_2048_textures']=len(images)==3 and all(im['size']==(2048,2048) for im in images)
 reports.append({'file':p.name,'bytes':len(raw),'sha256':hashlib.sha256(raw).hexdigest(),'triangles':triangles,'bones':len(g['skins'][0]['joints']),'max_weight_sum_error':weight_error,'images':images,'atlas_coverage':coverage,'durations':durations,'checks':checks,'passed':all(checks.values())})
(root/'review/glb-validation.json').write_text(json.dumps(reports,indent=2));print(json.dumps(reports,indent=2));assert all(r['passed'] for r in reports)
