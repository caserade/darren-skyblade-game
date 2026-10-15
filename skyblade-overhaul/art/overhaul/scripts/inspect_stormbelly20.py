from pathlib import Path
import json,struct,io
import numpy as np
from PIL import Image
root=Path(__file__).resolve().parents[1]
reports=[]
for variant in ['candidate','lod']:
 raw=(root/'heavyweight/export'/('heavyweight-'+variant+'.glb')).read_bytes();n=struct.unpack_from('<I',raw,12)[0];g=json.loads(raw[20:20+n]);buf=raw[n+28:]
 def ac(i):
  a=g['accessors'][i];v=g['bufferViews'][a['bufferView']];width={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4}[a['type']];dt=np.dtype({5121:'u1',5123:'<u2',5125:'<u4',5126:'<f4'}[a['componentType']]);return np.ndarray((a['count'],width),dtype=dt,buffer=buf,offset=v.get('byteOffset',0)+a.get('byteOffset',0),strides=(v.get('byteStride',width*dt.itemsize),dt.itemsize))
 p=g['meshes'][0]['primitives'][0];a=p['attributes'];pos=ac(a['POSITION']);uv=ac(a['TEXCOORD_0']);ix=ac(p['indices']).reshape(-1,3);w=ac(a['WEIGHTS_0']);j=ac(a['JOINTS_0']);names=[g['nodes'][i]['name'] for i in g['skins'][0]['joints']]
 points,inv=np.unique(np.round(pos,5),axis=0,return_inverse=True);tri=inv[ix];edges=np.vstack([tri[:,[0,1]],tri[:,[1,2]],tri[:,[2,0]]]);parent=list(range(len(points)))
 def find(i):
  while parent[i]!=i:parent[i]=parent[parent[i]];i=parent[i]
  return i
 for aa,bb in edges:
  aa,bb=find(int(aa)),find(int(bb))
  if aa!=bb:parent[bb]=aa
 _,labels=np.unique([find(i) for i in range(len(points))],return_inverse=True);count=int(labels.max())+1;label=labels[inv]
 texture=g['materials'][p['material']]['pbrMetallicRoughness']['baseColorTexture']['index'];image=g['images'][g['textures'][texture]['source']];v=g['bufferViews'][image['bufferView']];im=np.array(Image.open(io.BytesIO(buf[v.get('byteOffset',0):v.get('byteOffset',0)+v['byteLength']])).convert('RGB'));px=np.clip((uv*np.array([im.shape[1],im.shape[0]])).astype(int),0,[im.shape[1]-1,im.shape[0]-1]);colors=im[px[:,1],px[:,0]]
 features=[]
 for k in range(count):
  ids=np.flatnonzero(label==k);vertices=pos[ids];lo=vertices.min(axis=0);hi=vertices.max(axis=0)

  weights=np.zeros(len(names));np.add.at(weights,j[ids].reshape(-1),w[ids].reshape(-1));bone=names[int(weights.argmax())]
  color=np.median(colors[ids],axis=0);kind='jaw' if bone=='jaw' and len(ids)>500 else 'tusk' if bone=='jaw' else 'horn' if lo[1]>3.8 and hi[1]>4.4 and color[0]>100 and color[2]<80 else 'eye' if bone=='head' and lo[1]>3.78 and lo[2]>.6 and hi[2]<1.0 else 'other'
  features.append({'component':k,'vertices':len(ids),'bounds':[lo.tolist(),hi.tolist()],'center':vertices.mean(axis=0).tolist(),'bone':bone,'medianRGB':color.tolist(),'kind':kind,'indices':ids.tolist()})
 report={'variant':variant,'features':features};(root/'stormbelly20/source'/('features-'+variant+'.json')).write_text(json.dumps(report));reports.append({'variant':variant,'features':[{k:v for k,v in f.items() if k!='indices'} for f in features]})
(root/'stormbelly20/review/feature-inventory-20.json').write_text(json.dumps(reports,indent=2));print(json.dumps([{'variant':r['variant'],'facialComponents':len([f for f in r['features'] if f['kind']!='other']),'features':len(r['features'])} for r in reports]))
