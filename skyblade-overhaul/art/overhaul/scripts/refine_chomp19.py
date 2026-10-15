"""Localized facial candidate over accepted Chomp18; topology/rig/textures untouched."""
from pathlib import Path
import json, struct, hashlib
import numpy as np
root=Path(__file__).resolve().parents[1];out=root/'chomp19'
def smooth(t):
 t=np.clip(t,0,1);return t*t*(3-2*t)
def bump(t):return np.maximum(1-t*t,0)**3
reports=[]
for variant in ['candidate','lod']:
 source=root/'chomp18/export'/('chomprex-'+variant+'.glb');raw=source.read_bytes();n=struct.unpack_from('<I',raw,12)[0];g=json.loads(raw[20:20+n]);buf=bytearray(raw[n+28:])
 def ac(i):
  a=g['accessors'][i];v=g['bufferViews'][a['bufferView']];width={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4,'MAT4':16}[a['type']];dt=np.dtype({5121:'u1',5123:'<u2',5125:'<u4',5126:'<f4'}[a['componentType']]);return np.ndarray((a['count'],width),dtype=dt,buffer=buf,offset=v.get('byteOffset',0)+a.get('byteOffset',0),strides=(v.get('byteStride',width*dt.itemsize),dt.itemsize))
 attrs=g['meshes'][0]['primitives'][0]['attributes'];pos=ac(attrs['POSITION']);before=pos.copy();normals=ac(attrs['NORMAL']);oldnorm=normals.copy()
 features=json.loads((out/'source'/('features-'+variant+'.json')).read_text())['features'];body=max(features,key=lambda f:f['vertices']);jaw=max([f for f in features if f['bone']=='jaw'],key=lambda f:f['vertices'])
 masks={name:np.zeros(len(before),dtype=bool) for name in ['body','jaw','brow']}
 masks['body'][body['indices']]=True;masks['jaw'][jaw['indices']]=True
 for f in features:
  if f['bone'] in ['browL','browR']:masks['brow'][f['indices']]=True
 tooth_ops=[]
 for f in features:
  if f['kind']!='tooth':continue
  ids=np.array(f['indices']);p=before[ids];lo=p[:,1].min();hi=p[:,1].max();mid=p.mean(axis=0);coeff=np.polyfit(p[:,1]-mid[1],p[:,[0,2]],1)
  tooth_ops.append((ids,lo,hi,mid,coeff,f['bone']=='jaw'))
 def deform(p):
  x,y,z=p.T;q=p.astype(float).copy()
  # Compact support: no body vertex below Y=3.67 can move.
  lid=bump((abs(x)-.40)/.22)*bump((y-4.145)/.115)*bump((z-1.16)/.29)*masks['body']
  q[:,1]+=.045*lid;q[:,2]+=.012*lid
  cheek=bump((abs(x)-.59)/.22)*bump((y-3.99)/.23)*bump((z-1.03)/.32)*masks['body']
  q[:,0]+=np.sign(x)*.038*cheek;q[:,1]+=.014*cheek
  gold=bump((y-3.79)/.30)*bump((z-1.18)/.42)*bump((abs(x)-.43)/.22)*masks['jaw']
  q[:,0]+=np.sign(x)*.027*gold
  # Thicken the existing upper eyelid strand, retaining its slanted centerline.
  for f in features:
   if f['bone'] not in ['browL','browR']:continue
   ids=np.array(f['indices']);c=np.array(f['center']);taper=smooth((abs(p[ids,0])-.20)/.10)*smooth((p[ids,2]-1.12)/.10);q[ids,1]=p[ids,1]+(p[ids,1]-c[1])*.10*taper;q[ids,2]=p[ids,2]+(p[ids,2]-c[2])*.05*taper
  # Broaden the rounded crown near its tip, with roots and row centers fixed.
  for ids,lo,hi,mid,coeff,lower in tooth_ops:
   t=(p[ids,1]-lo)/(hi-lo);depth=t if lower else 1-t
   line=(p[ids,1,None]-mid[1])*coeff[0]+coeff[1]
   front=smooth((mid[2]-1.40)/.35)
   scale=1+(.12 if lower else .22)*smooth(depth)*front
   q[np.ix_(ids,[0,2])]=line+(p[np.ix_(ids,[0,2])]-line)*scale[:,None]
   if lower:q[ids,1]=lo+(p[ids,1]-lo)*(1+.34*front)
  return q
 after=deform(before);jac=np.empty((len(before),3,3));eps=1e-4
 for axis in range(3):
  plus=before.astype(float).copy();minus=plus.copy();plus[:,axis]+=eps;minus[:,axis]-=eps;jac[:,:,axis]=(deform(plus)-deform(minus))/(2*eps)
 newnorm=np.einsum('nij,nj->ni',np.linalg.inv(jac).transpose(0,2,1),oldnorm);newnorm/=np.linalg.norm(newnorm,axis=1)[:,None]
 changed=np.linalg.norm(after-before,axis=1)>1e-7;pos[:]=after;normals[changed]=newnorm[changed]
 g['accessors'][attrs['POSITION']]['min']=pos.min(axis=0).tolist();g['accessors'][attrs['POSITION']]['max']=pos.max(axis=0).tolist()
 js=json.dumps(g,separators=(',',':')).encode();js+=b' '*((-len(js))%4);result=struct.pack('<III',0x46546c67,2,28+len(js)+len(buf))+struct.pack('<II',len(js),0x4e4f534a)+js+struct.pack('<II',len(buf),0x004e4942)+buf
 target=out/'export'/source.name;target.write_bytes(result);mapping=[{'before':p.tolist(),'after':q.tolist()} for p,q,c in zip(before,pos,changed) if c];(out/'source'/('positions-'+variant+'.json')).write_text(json.dumps(mapping,separators=(',',':')))
 reports.append({'variant':variant,'sourceSha256':hashlib.sha256(raw).hexdigest(),'candidateSha256':hashlib.sha256(result).hexdigest(),'changedVertices':int(changed.sum()),'changedBounds':[before[changed].min(axis=0).tolist(),before[changed].max(axis=0).tolist()],'maximumDisplacement':float(np.linalg.norm(after-before,axis=1).max()),'minimumJacobianDeterminant':float(np.linalg.det(jac).min()),'bodyBelowFaceIdentical':bool(np.array_equal(before[before[:,1]<3.1],pos[before[:,1]<3.1]))})
(out/'review/mesh-study-19.json').write_text(json.dumps(reports,indent=2));print(json.dumps(reports))
