from pathlib import Path
import json,struct,hashlib,copy
import numpy as np
root=Path(__file__).resolve().parents[1];out=root/'stormbelly20';reports=[]
def load(path):
 raw=path.read_bytes();n=struct.unpack_from('<I',raw,12)[0];g=json.loads(raw[20:20+n]);return g,raw[n+28:]
def ac(g,b,i):
 a=g['accessors'][i];v=g['bufferViews'][a['bufferView']];w={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4,'MAT4':16}[a['type']];dt=np.dtype({5121:'u1',5123:'<u2',5125:'<u4',5126:'<f4'}[a['componentType']]);return np.ndarray((a['count'],w),dtype=dt,buffer=b,offset=v.get('byteOffset',0)+a.get('byteOffset',0),strides=(v.get('byteStride',w*dt.itemsize),dt.itemsize))
for variant in ['candidate','lod']:
 old=root/'heavyweight/export'/('heavyweight-'+variant+'.glb');new=out/'export'/old.name;g,b=load(old);h,c=load(new);a=g['meshes'][0]['primitives'][0]['attributes'];p=ac(g,b,a['POSITION']);q=ac(h,c,a['POSITION']);norm=ac(h,c,a['NORMAL']);ix=ac(g,b,g['meshes'][0]['primitives'][0]['indices']).reshape(-1,3)
 ignored={g['accessors'][a[n]]['bufferView'] for n in ['POSITION','NORMAL']};checks={}
 checks['onlyPositionBoundsMetadataChanged']=all(g[k]==h[k] for k in g if k!='accessors') and all(x==y or i==a['POSITION'] and {k:v for k,v in x.items() if k not in ['min','max']}=={k:v for k,v in y.items() if k not in ['min','max']} for i,(x,y) in enumerate(zip(g['accessors'],h['accessors'])))
 checks['allOtherBufferViewsIdentical']=all(b[v.get('byteOffset',0):v.get('byteOffset',0)+v['byteLength']]==c[v.get('byteOffset',0):v.get('byteOffset',0)+v['byteLength']] for i,v in enumerate(g['bufferViews']) if i not in ignored)
 checks['rigClipsWeightsUvIndicesMaterialsTexturesIdentical']=g['animations']==h['animations'] and g['skins']==h['skins'] and g['nodes']==h['nodes'] and g['materials']==h['materials'] and checks['allOtherBufferViewsIdentical']
 op=p[ix];np_=q[ix];on=np.cross(op[:,1]-op[:,0],op[:,2]-op[:,0]);nn=np.cross(np_[:,1]-np_[:,0],np_[:,2]-np_[:,0]);ol=np.linalg.norm(on,axis=1);nl=np.linalg.norm(nn,axis=1);cos=(on*nn).sum(axis=1)/np.maximum(ol*nl,1e-30)
 checks['finitePositionsAndUnitNormals']=bool(np.isfinite(q).all() and np.isfinite(norm).all() and np.max(abs(np.linalg.norm(norm,axis=1)-1))<1e-4)
 checks['noCollapsedOrReversedRestTriangles']=bool(nl.min()>1e-12 and cos.min()>0)
 checks['groundUnchanged']=abs(float(q[:,1].min()-p[:,1].min()))<1e-7
 reports.append({'variant':variant,'sha256':hashlib.sha256(new.read_bytes()).hexdigest(),'checks':checks,'passed':all(checks.values()),'triangles':len(ix),'bones':len(g['skins'][0]['joints']),'clips':len(g['animations']),'minimumTriangleAreaRatio':float((nl/ol).min()),'minimumRestNormalCosine':float(cos.min()),'maximumNormalLengthError':float(np.max(abs(np.linalg.norm(norm,axis=1)-1))),'reversedTriangles':[{'index':int(i),'center':op[i].mean(axis=0).tolist(),'cosine':float(cos[i]),'oldArea':float(ol[i]/2)} for i in np.flatnonzero(cos<=0)]})
(out/'review/mesh-audit-20.json').write_text(json.dumps(reports,indent=2));print(json.dumps(reports));assert all(r['passed'] for r in reports)
