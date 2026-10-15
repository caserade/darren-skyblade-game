"""Localized Stormbelly eye/jaw/horn study over accepted checkpoint08 GLBs."""
from pathlib import Path
import json,struct,hashlib
import numpy as np
root=Path(__file__).resolve().parents[1];out=root/'stormbelly20'
def smooth(t):
 t=np.clip(t,0,1);return t*t*(3-2*t)
def bump(t):return np.maximum(1-t*t,0)**3
reports=[]
for variant in ['candidate','lod']:
 source=root/'heavyweight/export'/('heavyweight-'+variant+'.glb');raw=source.read_bytes();n=struct.unpack_from('<I',raw,12)[0];g=json.loads(raw[20:20+n]);buf=bytearray(raw[n+28:])
 def ac(i):
  a=g['accessors'][i];v=g['bufferViews'][a['bufferView']];width={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4,'MAT4':16}[a['type']];dt=np.dtype({5121:'u1',5123:'<u2',5125:'<u4',5126:'<f4'}[a['componentType']]);return np.ndarray((a['count'],width),dtype=dt,buffer=buf,offset=v.get('byteOffset',0)+a.get('byteOffset',0),strides=(v.get('byteStride',width*dt.itemsize),dt.itemsize))
 attrs=g['meshes'][0]['primitives'][0]['attributes'];pos=ac(attrs['POSITION']);before=pos.copy();norm=ac(attrs['NORMAL']);oldnorm=norm.copy();features=json.loads((out/'source'/('features-'+variant+'.json')).read_text())['features'];body=max(features,key=lambda f:f['vertices']);masks={k:np.zeros(len(pos),dtype=bool) for k in ['body','jaw','tusk','horn','eye']};masks['body'][body['indices']]=True
 for f in features:
  if f['kind'] in masks and f['kind']!='body':masks[f['kind']][f['indices']]=True
 assert sum(f['kind']=='horn' for f in features)==2 and sum(f['kind']=='eye' for f in features)==8 and sum(f['kind']=='jaw' for f in features)==1
 def deform(p):
  x,y,z=p.T;q=p.astype(float).copy()
  # The sockets stay fixed; local lid surfaces cover more of the ivory eye.
  upper=bump((abs(x)-.30)/.22)*bump((y-3.94)/.15)*bump((z-.84)/.25)*masks['body']
  lower=bump((abs(x)-.30)/.21)*bump((y-3.77)/.12)*bump((z-.85)/.23)*masks['body']
  q[:,1]-=.028*upper;q[:,1]+=.012*lower;q[:,2]+=.009*(upper+lower)
  ids=np.flatnonzero(masks['eye']);center=np.column_stack([np.sign(x[ids])*.2944,np.full(len(ids),3.85),np.full(len(ids),.82)])
  q[ids]=center+(p[ids]-center)*np.array([.92,.88,.88]);q[ids,2]-=.012
  # Round and shorten the existing pale chin, leaving its rear hinge anchored.
  jaw=masks['jaw']|masks['tusk'];forward=smooth((z-.55)/.75)*jaw
  q[:,2]-=.085*forward
  q[:,1]+=.075*smooth((3.38-y)/.40)*forward
  q[:,0]+=x*.12*smooth((3.36-y)/.36)*forward
  # Distal-only horn sweep: existing roots, topology and head attachment preserved.
  sweep=smooth((abs(x)-.30)/.44)*smooth((y-4.00)/.23)*masks['horn']
  q[:,0]+=np.sign(x)*-.025*sweep;q[:,1]-=.090*sweep;q[:,2]-=.220*sweep
  return q
 after=deform(before);jac=np.empty((len(before),3,3));eps=1e-4
 for axis in range(3):
  p=before.astype(float).copy();m=p.copy();p[:,axis]+=eps;m[:,axis]-=eps;jac[:,:,axis]=(deform(p)-deform(m))/(2*eps)
 normals=np.einsum('nij,nj->ni',np.linalg.inv(jac).transpose(0,2,1),oldnorm);normals/=np.linalg.norm(normals,axis=1)[:,None];changed=np.linalg.norm(after-before,axis=1)>1e-7;pos[:]=after;norm[changed]=normals[changed]
 g['accessors'][attrs['POSITION']]['min']=pos.min(axis=0).tolist();g['accessors'][attrs['POSITION']]['max']=pos.max(axis=0).tolist();js=json.dumps(g,separators=(',',':')).encode();js+=b' '*((-len(js))%4);result=struct.pack('<III',0x46546c67,2,28+len(js)+len(buf))+struct.pack('<II',len(js),0x4e4f534a)+js+struct.pack('<II',len(buf),0x004e4942)+buf;target=out/'export'/source.name;target.write_bytes(result)
 (out/'source'/('positions-'+variant+'.json')).write_text(json.dumps([{'before':p.tolist(),'after':q.tolist()} for p,q,c in zip(before,pos,changed) if c],separators=(',',':')))
 bodyids=np.array(body['indices']);below=bodyids[before[bodyids,1]<3.64]
 reports.append({'variant':variant,'sourceSha256':hashlib.sha256(raw).hexdigest(),'candidateSha256':hashlib.sha256(result).hexdigest(),'changedVertices':int(changed.sum()),'bodyBelowFaceUnchanged':bool(np.array_equal(before[below],pos[below])),'maximumDisplacement':float(np.linalg.norm(after-before,axis=1).max()),'minimumJacobianDeterminant':float(np.linalg.det(jac).min()),'boundsBefore':[before.min(axis=0).tolist(),before.max(axis=0).tolist()],'boundsAfter':[pos.min(axis=0).tolist(),pos.max(axis=0).tolist()]})
(out/'review/mesh-study-20.json').write_text(json.dumps(reports,indent=2));print(json.dumps(reports))
