"""Fair skin weights only around the inherited hip/tail transition.
Preserve GLB JSON, geometry, textures, bones and animations byte-for-byte.
"""
from pathlib import Path
import json,struct,hashlib
import numpy as np
root=Path(__file__).resolve().parents[1];out=root/'skydrake15';reports=[]
def smooth(x):x=np.clip(x,0,1);return x*x*(3-2*x)
for variant in ['candidate','lod']:
 source=root/'skydrake14/export'/('skydrake-'+variant+'.glb');raw=bytearray(source.read_bytes());n=struct.unpack_from('<I',raw,12)[0];g=json.loads(raw[20:20+n]);offset=28+n
 def ac(i):
  a=g['accessors'][i];v=g['bufferViews'][a['bufferView']];width={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4,'MAT4':16}[a['type']];dt=np.dtype({5121:'u1',5123:'<u2',5125:'<u4',5126:'<f4'}[a['componentType']]);return np.ndarray((a['count'],width),dtype=dt,buffer=raw,offset=offset+v.get('byteOffset',0)+a.get('byteOffset',0),strides=(v.get('byteStride',width*dt.itemsize),dt.itemsize))
 p=next(p for p in g['meshes'][0]['primitives'] if g['materials'][p['material']]['name']=='skydrake_skin');a=p['attributes'];pos=ac(a['POSITION']).copy();j=ac(a['JOINTS_0']);w=ac(a['WEIGHTS_0']);ix=ac(p['indices']).reshape(-1,3)
 points,first,inv=np.unique(np.round(pos,5),axis=0,return_index=True,return_inverse=True);dense=np.zeros((len(pos),39));np.add.at(dense,(np.arange(len(pos))[:,None],j.astype(int)),w);original=dense[first].copy();weights=original.copy()
 edges=set()
 for tri in inv[ix]:
  for k in range(3):
   u,v=sorted([int(tri[k]),int(tri[(k+1)%3])]);
   if u!=v:edges.add((u,v))
 edges=np.array(list(edges));u=np.r_[edges[:,0],edges[:,1]];v=np.r_[edges[:,1],edges[:,0]];length=np.linalg.norm(points[u]-points[v],axis=1);factor=1/np.maximum(length,.01);sums=np.bincount(u,weights=factor,minlength=len(points))
 x,y,z=points.T;mask=smooth((y-.55)/.3)*smooth((1.75-y)/.35)*smooth((-.2-z)/.3)*smooth((z+1.6)/.4)*smooth((1.1-abs(x))/.3)
 iterations=72 if variant=='candidate' else 36
 for step in range(iterations):
  accum=np.zeros_like(weights);np.add.at(accum,u,weights[v]*factor[:,None]);mean=accum/np.maximum(sums[:,None],1e-10);weights+=.35*mask[:,None]*(mean-weights)
 # Keep the engine's four-influence contract.
 indices=np.argsort(weights,axis=1)[:,-4:][:,::-1];values=np.take_along_axis(weights,indices,axis=1);values/=values.sum(axis=1)[:,None]
 affected=np.flatnonzero(mask[inv]>0);oldj=j.copy();oldw=w.copy();j[affected]=indices[inv[affected]];w[affected]=values[inv[affected]].astype('<f4')
 names=[g['nodes'][i]['name'] for i in g['skins'][0]['joints']];mapping=[]
 for i in np.flatnonzero(mask>0):mapping.append({'position':pos[first[i]].tolist(),'weights':{names[int(k)]:float(v) for k,v in zip(indices[i],values[i]) if v>0}})
 target=out/'export'/('skydrake-'+variant+'.glb');target.write_bytes(raw);(out/'source'/('weights-'+variant+'.json')).write_text(json.dumps(mapping))
 delta=np.max(abs(weights-original),axis=1);reports.append({'variant':variant,'beforeSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'afterSha256':hashlib.sha256(raw).hexdigest(),'affectedWeldedVertices':len(mapping),'affectedExportVertices':len(affected),'maximumInfluenceDelta':float(delta.max()),'maskBounds':{'x':[-1.1,1.1],'y':[.55,1.75],'z':[-1.6,-.2]},'iterations':iterations,'factor':.35})
(out/'review/weight-repair-15.json').write_text(json.dumps(reports,indent=2));print(json.dumps(reports))
