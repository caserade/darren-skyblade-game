"""Local shoulder albedo decontamination. Preserve every non-image buffer view."""
from skydrake_glb22 import GLB, ROOT, smooth
from pathlib import Path
import ast, io, json, struct, hashlib
import numpy as np
from PIL import Image
dst=ROOT/'skydrake23'; src=GLB(ROOT/'skydrake22/export/skydrake-lod.glb')
lib=(ROOT/'skydrake12/source/sculpt_lib.py').read_text()
for fn in ast.parse(lib).body:
 if isinstance(fn,ast.FunctionDef) and fn.name=='raster':exec(ast.get_source_segment(lib,fn),globals())
g=src.g; oldbin=src.raw[src.offset:]; changes={}; results=[]
for pi in [0,11]:
 pr=g['meshes'][0]['primitives'][pi]; attrs=pr['attributes']; mat=g['materials'][pr['material']]
 ii=g['textures'][mat['pbrMetallicRoughness']['baseColorTexture']['index']]['source']; im=g['images'][ii]; vi=im['bufferView']; bv=g['bufferViews'][vi]
 original=np.array(Image.open(io.BytesIO(oldbin[bv['byteOffset']:bv['byteOffset']+bv['byteLength']])).convert('RGB'))
 color=original.astype(float)/255; n=color.shape[0]
 v=src.accessor(attrs['POSITION']); f=src.accessor(pr['indices']).reshape(-1,3); uv=src.accessor(attrs['TEXCOORD_0'])
 tid,bary=raster(f,uv,n); covered=tid>=0; p=(v[f[tid[covered]]]*bary[covered][...,None]).sum(1); x,y,z=p.T
 old=color[covered].copy()
 width=np.interp(y,[2.2,2.8,3.5],[.64,.35,.255])
 roi=smooth((y-2.12)/.25)*(1-smooth((y-3.20)/.35))*smooth((abs(x)-width-.03)/.09)*(1-smooth((abs(x)-1.15)/.30))
 # Pale contamination has elevated red/blue and green/blue ratios. Keep
 # deep blue scales, ventral plates and all pixels outside this shoulder band.
 pale=smooth((old[:,0]/np.maximum(old[:,2],.05)-.29)/.11)
 alpha=roi*pale
 blue=old.copy(); blue[:,2]=np.minimum(old[:,2],.65+.12*(old[:,2]-.65)); blue[:,0]=np.minimum(old[:,0],blue[:,2]*.31); blue[:,1]=np.minimum(old[:,1],blue[:,2]*.43)
 color[covered]=old*(1-alpha[:,None])+blue*alpha[:,None]
 # Extend only corrected edge texels into unused chart gutters; never paint
 # across another occupied UV island.
 delta=color-original/255; edited=np.any(abs(delta)>1e-8,axis=2); active=edited.copy()
 for _ in range(4):
  acc=np.zeros_like(delta); count=np.zeros(covered.shape)
  for dy,dx in [(1,0),(-1,0),(0,1),(0,-1)]:
   m=np.roll(np.roll(active,dy,0),dx,1); acc+=np.roll(np.roll(delta,dy,0),dx,1)*m[...,None]; count+=m
  grow=(~covered)&(~active)&(count>0); delta[grow]=acc[grow]/count[grow,None]; active|=grow
 output=np.clip(original.astype(float)+delta*255+.5,0,255).astype('uint8')
 name='skin-color.png' if pi==0 else 'shoulder-color.png'; Image.fromarray(output).save(dst/'source'/name)
 changes[vi]=(dst/'source'/name).read_bytes(); im['mimeType']='image/png'
 outside=~active; assert np.array_equal(output[outside],original[outside])
 results.append({'material':mat['name'],'changedPixels':int(np.any(output!=original,axis=2).sum()),'totalPixels':n*n,'outsideMaskExact':True})
newbin=bytearray()
for i,bv in enumerate(g['bufferViews']):
 payload=changes.get(i,oldbin[bv.get('byteOffset',0):bv.get('byteOffset',0)+bv['byteLength']]); newbin+=b'\0'*((-len(newbin))%4); bv['byteOffset']=len(newbin); bv['byteLength']=len(payload); newbin+=payload
newbin+=b'\0'*((-len(newbin))%4); g['buffers'][0]['byteLength']=len(newbin); jb=json.dumps(g,separators=(',',':')).encode(); jb+=b' '*((-len(jb))%4)
raw=struct.pack('<III',0x46546c67,2,28+len(jb)+len(newbin))+struct.pack('<II',len(jb),0x4e4f534a)+jb+struct.pack('<II',len(newbin),0x004e4942)+newbin
out=dst/'export/skydrake-lod.glb'; out.write_bytes(raw)
report={'baselineSha256':src.sha(),'candidateSha256':hashlib.sha256(raw).hexdigest(),'materials':results,'method':'Object-space feathered shoulder mask; remove pale color contamination while retaining blue variation. Lossless PNG. No normal/geometry/weight/animation changes.'}
(dst/'review/color-repair-23.json').write_text(json.dumps(report,indent=2));print(json.dumps(report))

