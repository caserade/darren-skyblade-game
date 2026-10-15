from skydrake_glb22 import *
reports=[];out=ROOT/'skydrake22'
for variant in ['candidate','lod']:
 old=GLB(ROOT/'skydrake15/export'/('skydrake-'+variant+'.glb'));new=GLB(out/'export'/('skydrake-'+variant+'.glb'));allowed=np.zeros(len(new.raw),dtype=bool);allchanged=[];checks={'sameLength':len(old.raw)==len(new.raw),'sameJson':old.g==new.g};names=[new.g['nodes'][i]['name'] for i in new.g['skins'][0]['joints']];mapping=json.loads((out/'source'/('weights-'+variant+'.json')).read_text());bypos={tuple(round(v,5) for v in d['position']):d['weights'] for d in mapping};matched=True;outside=0;seams={};seamdelta=0;weightmax=0;minimum=1;badj=0;changedcount=0
 for p in new.g['meshes'][0]['primitives']:
  mat=new.g['materials'][p['material']]['name'];a=p['attributes'];pos=new.accessor(a['POSITION']);j=new.accessor(a['JOINTS_0']);w=new.accessor(a['WEIGHTS_0']);oj=old.accessor(a['JOINTS_0']);ow=old.accessor(a['WEIGHTS_0']);changed=np.any(j!=oj,axis=1)|np.any(w!=ow,axis=1);changedcount+=int(changed.sum())
  weightmax=max(weightmax,float(np.max(abs(w.sum(axis=1)-1))));minimum=min(minimum,float(w.min()));badj+=int((j>=39).sum());x,y,z=pos.T;mask=(abs(x)<1.45001)&(y>1.79999)&(y<4.05001)&(z>-.60001)&(z<.85001);outside+=int((changed&~mask).sum())
  if mat in ['skydrake_skin','SkyDrake shoulder retopology']:
   for key in ['JOINTS_0','WEIGHTS_0']:
    start,stride,width,count=new.range(a[key])
    for i in range(count):allowed[start+i*stride:start+i*stride+width]=True
  for i in np.flatnonzero(changed):
   key=tuple(round(float(v),5) for v in pos[i]);actual={names[int(k)]:float(v) for k,v in zip(j[i],w[i]) if v>0};expected=bypos[key];matched=matched and set(actual)==set(expected) and all(abs(v-expected[k])<1e-6 for k,v in actual.items())
   if key in seams:seamdelta=max(seamdelta,max(abs(actual.get(k,0)-seams[key].get(k,0)) for k in set(actual)|set(seams[key])))
   seams[key]=actual
 delta=np.frombuffer(old.raw,dtype='u1')!=np.frombuffer(new.raw,dtype='u1');checks.update({'onlyTwoMaterialsJointWeightBytes':not np.any(delta&~allowed),'changesInsideMask':outside==0,'finiteWeights':all(np.isfinite(new.accessor(p['attributes']['WEIGHTS_0'])).all() for p in new.g['meshes'][0]['primitives']),'normalized':weightmax<1e-6,'nonnegative':minimum>=0,'valid39BoneIndices':badj==0,'sourceMapMatches':matched,'weldedSeamsContinuous':seamdelta<1e-6,'allRestGeometryNormalsUVsTexturesRigAndClipsByteIdentical':not np.any(delta&~allowed)})
 reports.append({'variant':variant,'sha256':new.sha(),'beforeSha256':old.sha(),'changedBytes':int(delta.sum()),'changedExportVertices':changedcount,'maximumNormalizationError':weightmax,'maximumSeamWeightDelta':seamdelta,'checks':checks,'passed':all(checks.values())})
(out/'review/weight-contract-22.json').write_text(json.dumps(reports,indent=2));print(json.dumps(reports));assert all(r['passed'] for r in reports)
