"""Verify the exported change stays in heavyWalk, retaining geometry/textures."""
import json,struct,hashlib,subprocess
from pathlib import Path
import numpy as np
root=Path(__file__).resolve().parents[3]
git=r'C:\Users\caser\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\git\cmd\git.exe'
previous='9f05e88658d59d12be7ba7b8b65c251ecada176b'
asset='art/overhaul/heavyweight/export/heavyweight-candidate.glb'
def read(raw):
 n=struct.unpack_from('<I',raw,12)[0];g=json.loads(raw[20:20+n]);buf=raw[28+n:]
 def acc(i):
  a=g['accessors'][i];v=g['bufferViews'][a['bufferView']];w={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4,'MAT4':16}[a['type']];dt=np.dtype({5121:'u1',5123:'<u2',5125:'<u4',5126:'<f4'}[a['componentType']]);return np.ndarray((a['count'],w),dtype=dt,buffer=buf,offset=v.get('byteOffset',0)+a.get('byteOffset',0),strides=(v.get('byteStride',w*dt.itemsize),dt.itemsize)).copy()
 channels={}
 for a in g['animations']:
  channels[a['name']]={}
  for c in a['channels']:
   s=a['samplers'][c['sampler']];key=g['nodes'][c['target']['node']]['name']+'/'+c['target']['path'];channels[a['name']][key]=(acc(s['input']),acc(s['output']))
 geometry={}
 for i,m in enumerate(g['meshes']):
  for j,p in enumerate(m['primitives']):
   for key,a in dict(p['attributes'],indices=p['indices']).items():geometry[f'{i}/{j}/{key}']=hashlib.sha256(acc(a).tobytes()).hexdigest()
 images={}
 for im in g['images']:
  v=g['bufferViews'][im['bufferView']];off=v.get('byteOffset',0);images[im['name']]=hashlib.sha256(buf[off:off+v['byteLength']]).hexdigest()
 return channels,geometry,images
old=read(subprocess.check_output([git,'show',previous+':'+asset],cwd=root));new=read((root/asset).read_bytes());changes={}
for name,channels in old[0].items():
 diff=[]
 for key,(times,values) in channels.items():
  t,v=new[0][name][key]
  if not np.array_equal(t,times) or not np.array_equal(v,values):diff.append({'channel':key,'sameTimes':bool(np.array_equal(t,times)),'maximumValueDifference':float(np.max(np.abs(v-values))) if v.shape==values.shape else None})
 changes[name]=diff
result={'baselineCommit':previous,'assetSha256':hashlib.sha256((root/asset).read_bytes()).hexdigest(),'geometryAccessorsIdentical':old[1]==new[1],'textureBytesIdentical':old[2]==new[2],'changedChannels':changes,'otherTwelveActionsIdentical':all(not v for k,v in changes.items() if k!='heavyWalk')}
(root/'art/overhaul/heavyweight/review/scope-08.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(result,indent=2));assert result['geometryAccessorsIdentical'] and result['textureBytesIdentical'] and result['otherTwelveActionsIdentical']
