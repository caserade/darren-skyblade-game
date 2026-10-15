"""Localized weight diffusion across the existing neck/chest/shoulder surface.
No topology, rest shape, material, rig or clip edits. Each trial starts at accepted15.
"""
from skydrake_glb22 import *
import sys
trial=sys.argv[1] if len(sys.argv)>1 else 'a';out=ROOT/'skydrake22';reports=[]
for d in ['export','source','review','trials/'+trial]:(out/d).mkdir(parents=True,exist_ok=True)
for variant in ['candidate','lod']:
 g=GLB(ROOT/'skydrake15/export'/('skydrake-'+variant+'.glb'));oldsha=g.sha();parts=[];allp=[];allw=[];alli=[];offset=0
 names=[g.g['nodes'][i]['name'] for i in g.g['skins'][0]['joints']]
 for p in g.g['meshes'][0]['primitives']:
  mat=g.g['materials'][p['material']]['name']
  if mat not in ['skydrake_skin','SkyDrake shoulder retopology']:continue
  at=p['attributes'];pos=g.accessor(at['POSITION']);j=g.accessor(at['JOINTS_0']);w=g.accessor(at['WEIGHTS_0']);dense=np.zeros((len(pos),len(names)));np.add.at(dense,(np.arange(len(pos))[:,None],j.astype(int)),w)
  allp.append(pos.copy());allw.append(dense);alli.append(g.accessor(p['indices']).reshape(-1,3)+offset);parts.append((mat,j,w,offset,len(pos)));offset+=len(pos)
 positions=np.concatenate(allp);dense=np.concatenate(allw);triangles=np.concatenate(alli);points,first,inv=np.unique(np.round(positions,5),axis=0,return_index=True,return_inverse=True);original=dense[first].copy();weights=original.copy()
 es=inv[triangles];edges=np.unique(np.sort(np.concatenate([es[:,[0,1]],es[:,[1,2]],es[:,[2,0]]]),axis=1),axis=0);edges=edges[edges[:,0]!=edges[:,1]];u=np.r_[edges[:,0],edges[:,1]];v=np.r_[edges[:,1],edges[:,0]];length=np.linalg.norm(points[u]-points[v],axis=1);factor=1/np.maximum(length,.01);sums=np.bincount(u,weights=factor,minlength=len(points))
 x,y,z=points.T;mask=smooth((y-1.8)/.45)*smooth((4.05-y)/.45)*smooth((1.45-abs(x))/.45)*smooth((z+.6)/.25)*smooth((.85-z)/.25)
 # Remove only upper-neck arm contamination; fade the edit out below the neck.
 neck=smooth((y-2.85)/.35)*smooth((.85-abs(x))/.25)*smooth((z+.6)/.2)*smooth((.8-z)/.2)*smooth((4.05-y)/.3)
 arms=[names.index(n) for n in ['armL','armR','forearmL','forearmR','handL','handR']]
 removed=weights[:,arms]*neck[:,None];weights[:,arms]-=removed;weights[:,names.index('chest')]+=removed.sum(axis=1)
 iterations={'a':36,'b':72,'c':18}[trial]*(2 if variant=='candidate' else 1)
 for step in range(iterations):
  accum=np.zeros_like(weights);np.add.at(accum,u,weights[v]*factor[:,None]);mean=accum/np.maximum(sums[:,None],1e-10);weights+=.35*mask[:,None]*(mean-weights)
 indices=np.argsort(weights,axis=1)[:,-4:][:,::-1];values=np.take_along_axis(weights,indices,axis=1);values/=values.sum(axis=1)[:,None];affected=(mask>0)|(neck>0);mapping=[]
 for mat,j,w,start,count in parts:
  ids=np.arange(start,start+count);take=np.flatnonzero(affected[inv[ids]]);j[take]=indices[inv[ids[take]]];w[take]=values[inv[ids[take]]].astype('<f4')
 for i in np.flatnonzero(affected):mapping.append({'position':positions[first[i]].tolist(),'weights':{names[int(k)]:float(v) for k,v in zip(indices[i],values[i]) if v>0}})
 target=out/'trials'/trial/('skydrake-'+variant+'.glb');target.write_bytes(g.raw);(out/'trials'/trial/('weights-'+variant+'.json')).write_text(json.dumps(mapping));reports.append({'trial':trial,'variant':variant,'beforeSha256':oldsha,'afterSha256':g.sha(),'affectedWeldedPositions':int(affected.sum()),'iterations':iterations,'materials':['skydrake_skin','SkyDrake shoulder retopology'],'maskBounds':{'x':[-1.45,1.45],'y':[1.8,4.05],'z':[-.6,.85]}})
(out/'trials'/trial/'recipe-report.json').write_text(json.dumps(reports,indent=2));print(json.dumps(reports))
