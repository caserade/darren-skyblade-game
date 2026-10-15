"""Bounded mesh-only Chomp study. RC16 and all accepted exports stay untouched."""
from pathlib import Path
import json, struct, hashlib
import numpy as np

root=Path(__file__).resolve().parents[1]
out=root/'chomp18'
for folder in ['export','source','review']: (out/folder).mkdir(parents=True,exist_ok=True)
def smooth(t):
    t=np.clip(t,0,1); return t*t*(3-2*t)
def deform(p,head,jaw,leg):
    x,y,z=p.T; q=p.astype(np.float64).copy()
    # The reference eye centers sit substantially closer to the centerline.
    eye=smooth((y-3.95)/.29)*smooth((z-.25)/.50)*head
    # Translate the eye/brow region inward instead of scaling its dense inner
    # crease. This preserves local rest-edge spacing at the animated brow seam.
    q[:,0]-=np.sign(x)*.060*smooth((abs(x)-.20)/.24)*eye
    # Develop cheek breadth behind the muzzle, rather than widening the snout tip.
    cheek=np.exp(-((y-3.88)/.23)**2-((z-.70)/.42)**2)*head
    q[:,0]+=x*.08*cheek
    # Keep nostrils/teeth/jaw coherent while slightly shortening the foremost muzzle.
    front=smooth((z-1.35)/.7)*(head+jaw)
    q[:,2]-=.075*front
    # The supplied grin wraps around a narrower nose, rather than sitting inside it.
    q[:,0]-=x*.16*smooth((z-1.15)/.65)*head
    q[:,0]+=x*.13*smooth((z-.80)/.70)*jaw
    # Close the lower jaw toward the reference grin, with zero motion at the hinge.
    q[:,1]+=.105*smooth((z-.78)/.70)*jaw
    # A modest upper-haunch change; feet, ankle and rig centers are untouched.
    thigh=np.exp(-((y-1.75)/.50)**2)*smooth((abs(x)-.35)/.30)*smooth((.55-z)/.25)*smooth((z+.80)/.45)
    q[:,0]+=x*.045*thigh
    q[:,1]+=.06*thigh*smooth((y-.85)/.45)
    # Round the abdomen slightly forward without altering ground clearance.
    belly=np.exp(-((y-1.92)/.62)**4)*smooth((z-.18)/.45)*smooth((.68-abs(x))/.25)
    q[:,0]+=x*.055*belly
    q[:,2]+=.075*belly
    return q
reports=[]
for variant in ['candidate','lod']:
    source=root/'chomprex/export'/('chomprex-'+variant+'.glb')
    raw=source.read_bytes(); n=struct.unpack_from('<I',raw,12)[0]; g=json.loads(raw[20:20+n]); buf=bytearray(raw[n+28:])
    def ac(i):
        a=g['accessors'][i]; v=g['bufferViews'][a['bufferView']]; width={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4,'MAT4':16}[a['type']];dt=np.dtype({5121:'u1',5123:'<u2',5125:'<u4',5126:'<f4'}[a['componentType']]);return np.ndarray((a['count'],width),dtype=dt,buffer=buf,offset=v.get('byteOffset',0)+a.get('byteOffset',0),strides=(v.get('byteStride',width*dt.itemsize),dt.itemsize))
    prim=g['meshes'][0]['primitives'][0]; attrs=prim['attributes']; pos=ac(attrs['POSITION']); before=pos.copy(); normals=ac(attrs['NORMAL']); oldnorm=normals.copy();j=ac(attrs['JOINTS_0']);w=ac(attrs['WEIGHTS_0'])
    names=[g['nodes'][i]['name'] for i in g['skins'][0]['joints']]
    def weight(selected): return np.sum(w*np.isin(j,[names.index(s) for s in selected]),axis=1)
    head=weight(['head','browL','browR']); jaw=weight(['jaw']); leg=weight(['thighL','thighR'])
    after=deform(before,head,jaw,leg)
    jac=np.empty((len(before),3,3));eps=1e-4
    for axis in range(3):
        plus=before.astype(float).copy();minus=plus.copy();plus[:,axis]+=eps;minus[:,axis]-=eps
        jac[:,:,axis]=(deform(plus,head,jaw,leg)-deform(minus,head,jaw,leg))/(2*eps)
    newnorm=np.einsum('nij,nj->ni',np.linalg.inv(jac).transpose(0,2,1),oldnorm)
    features=json.loads((out/'source'/('features-'+variant+'.json')).read_text())['features']
    teeth=[f for f in features if f['kind']=='tooth'];assert len(teeth)==30
    for f in teeth:
        ids=np.array(f['indices']);center=after[ids].mean(axis=0)
        if f['bone']=='jaw':
            # Keep lower teeth inside the wider gold lip, not protruding over it.
            after[ids,0]-=before[ids,0]*.13*smooth((before[ids,2]-.80)/.70)
            center=after[ids].mean(axis=0);scale=np.array([.95,1.15,.95])
        else:
            # Slightly broader crowns reduce gaps in the reference's continuous grin.
            scale=np.array([1.06,1,1.08])
        after[ids]=center+(after[ids]-center)*scale
        newnorm[ids]/=scale
    newnorm/=np.linalg.norm(newnorm,axis=1)[:,None]
    changed=np.linalg.norm(after-before,axis=1)>1e-7;pos[:]=after;normals[changed]=newnorm[changed]
    g['accessors'][attrs['POSITION']]['min']=pos.min(axis=0).tolist();g['accessors'][attrs['POSITION']]['max']=pos.max(axis=0).tolist()
    js=json.dumps(g,separators=(',',':')).encode();js+=b' '*((-len(js))%4)
    result=struct.pack('<III',0x46546c67,2,28+len(js)+len(buf))+struct.pack('<II',len(js),0x4e4f534a)+js+struct.pack('<II',len(buf),0x004e4942)+buf
    target=out/'export'/('chomprex-'+variant+'.glb');target.write_bytes(result)
    mapping=[{'before':p.tolist(),'after':q.tolist()} for p,q,c in zip(before,pos,changed) if c]
    (out/'source'/('positions-'+variant+'.json')).write_text(json.dumps(mapping,separators=(',',':')))
    reports.append({'variant':variant,'sourceSha256':hashlib.sha256(raw).hexdigest(),'candidateSha256':hashlib.sha256(result).hexdigest(),'changedVertices':int(changed.sum()),'maximumDisplacement':float(np.linalg.norm(after-before,axis=1).max()),'minimumJacobianDeterminant':float(np.linalg.det(jac).min()),'boundsBefore':[before.min(axis=0).tolist(),before.max(axis=0).tolist()],'boundsAfter':[pos.min(axis=0).tolist(),pos.max(axis=0).tolist()]})
(out/'review/mesh-study-18.json').write_text(json.dumps(reports,indent=2));print(json.dumps(reports))
