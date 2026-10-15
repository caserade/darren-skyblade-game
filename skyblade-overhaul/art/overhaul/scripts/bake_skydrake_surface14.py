"""Bake a continuous object-space surface into existing UV charts; never move UV seams."""
from pathlib import Path
import json,struct,io,hashlib,sys
import numpy as np
from PIL import Image
root=Path(__file__).resolve().parents[1]/'skydrake14'
variant=sys.argv[1] if len(sys.argv)>1 else 'candidate'
assert variant in ['candidate','lod']
suffix='-lod' if variant=='lod' else ''
sys.path.insert(0,str(root/'source'))
import ast
lib=(root.parent/'skydrake12/source/sculpt_lib.py').read_text();tree=ast.parse(lib)
for fn in tree.body:
 if isinstance(fn,ast.FunctionDef) and fn.name in ['raster','dilate']:exec(ast.get_source_segment(lib,fn),globals())
raw=(root/'export'/('skydrake-'+variant+'.glb')).read_bytes();n=struct.unpack_from('<I',raw,12)[0];g=json.loads(raw[20:20+n]);buf=raw[28+n:]
def accessor(i):
 a=g['accessors'][i];v=g['bufferViews'][a['bufferView']];w={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4}[a['type']];dt=np.dtype({5121:'u1',5123:'<u2',5125:'<u4',5126:'<f4'}[a['componentType']]);return np.ndarray((a['count'],w),dtype=dt,buffer=buf,offset=v.get('byteOffset',0)+a.get('byteOffset',0),strides=(v.get('byteStride',w*dt.itemsize),dt.itemsize)).copy()
pr=g['meshes'][0]['primitives'][0];a=pr['attributes'];v=accessor(a['POSITION']);f=accessor(pr['indices']).reshape(-1,3);uv=accessor(a['TEXCOORD_0']);res=1024
tid,bary=raster(f,uv,res);mask=tid>=0;tri=f[tid[mask]];p=(v[tri]*bary[mask][...,None]).sum(1)
def ss(a,b,q):
 t=np.clip((q-a)/(b-a),0,1);return t*t*(3-2*t)
orig=(root.parent/'skydrake11/export/skydrake-candidate.glb').read_bytes();on=struct.unpack_from('<I',orig,12)[0];og=json.loads(orig[20:20+on]);ob=orig[28+on:]
def image_data(index):
 im=og['images'][index];bv=og['bufferViews'][im['bufferView']];data=ob[bv.get('byteOffset',0):bv.get('byteOffset',0)+bv['byteLength']];return np.array(Image.open(io.BytesIO(data)).convert('RGB')).astype(float)/255
mat=g['materials'][pr['material']];ci=g['textures'][mat['pbrMetallicRoughness']['baseColorTexture']['index']]['source'];ni=g['textures'][mat['normalTexture']['index']]['source']
color=image_data(ci);normal=image_data(ni);old=color[mask].copy();on=normal[mask].copy();x,y,z=p.T
# A single coordinate field is evaluated for every chart, with no displacement
# and no per-island normal-dependent mask. This prevents chart-shaped paint edges.
# Cubic smoothstep interpolation avoids polygonal changes in the plate boundary.
keys=np.array([.65,1.,1.5,2.2,2.8,3.5,4.18]);values=np.array([.18,.61,.80,.64,.35,.255,.215])
seg=np.clip(np.searchsorted(keys,y)-1,0,len(keys)-2);t=np.clip((y-keys[seg])/(keys[seg+1]-keys[seg]),0,1)
slopes=np.gradient(values,keys);h=keys[seg+1]-keys[seg]
width=(2*t**3-3*t**2+1)*values[seg]+(t**3-2*t**2+t)*h*slopes[seg]+(-2*t**3+3*t**2)*values[seg+1]+(t**3-t**2)*h*slopes[seg+1]
front=ss(.12,.36,z)*ss(.65,.82,y)*(1-ss(4.10,4.22,y))
vent=(1-ss(width-.02,width+.04,abs(x)))*front
roi=ss(.05,.32,z)*ss(.65,.83,y)*(1-ss(4.10,4.22,y))*(1-ss(width+.18,width+.32,abs(x)))
# Plate height grows toward the abdomen. Lower edges curve upward at the sides.
oldpale=ss(.53,.72,old[:,1]/np.maximum(old[:,2],.05))
roi=np.maximum(roi,oldpale*ss(.05,.3,z)*ss(.65,.83,y)*(1-ss(4.10,4.22,y)))
phase=np.interp(y,[.65,1.1,1.65,2.2,2.8,3.4,4.2],[0,1,2,3.2,5,7.3,10.8])-.16*(x/np.maximum(width,.15))**2
dist=np.abs((phase+.5)%1-.5);groove=1-ss(.012,.040,dist)
pale=np.array([.46,.59,.73])[None,:]*(1-.115*groove[:,None])
blue=np.tile(np.array([.185,.255,.635]),(len(p),1))
# Retain the supplied blue outside the repainted ventral strip. The new blue
# region is a feathered boundary, not a replacement for the complete skin.
paint=blue*(1-vent[:,None])+pale*vent[:,None]
new=old*(1-roi[:,None])+paint*roi[:,None]
flat=np.array([.5,.5,1.]);newnorm=on*(1-roi[:,None])+flat*roi[:,None]
# Reference scale clusters: overlapping curved rows on the outer haunches.
# Object-space cylindrical coordinates cross UV chart boundaries continuously.
cluster=ss(.72,.95,abs(x))*ss(1.03,1.33,y)*(1-ss(1.70,1.93,y))*ss(-.45,-.15,z)*(1-vent)
u=np.arctan2(z,abs(x)-.72)*.60/.125;row=np.floor(y/.125);du=((u+.5*(row%2)+.5)%1)-.5;dv=(y/.125)%1
arc=np.sqrt((du/.52)**2+((dv-.08)/.92)**2)
edge=np.exp(-((arc-1)/.045)**2)*ss(.12,.25,dv)
scalecolor=np.tile([.205,.278,.706],(len(p),1));scalecolor*=1-.10*edge[:,None];scalecolor+=.008*(1-dv[:,None])
new=new*(1-cluster[:,None])+scalecolor*cluster[:,None]
newnorm=newnorm*(1-.7*cluster[:,None])+flat*(.7*cluster[:,None])
color[mask]=new;normal[mask]=newnorm
color=dilate(color,mask,8);normal=dilate(normal,mask,8)
for name,arr in [('skydrake'+suffix+'-surface-color',color),('skydrake'+suffix+'-surface-normal',normal)]:
 im=Image.fromarray(np.clip(arr*255+.5,0,255).astype('uint8'));im.save(root/'source'/(name+'.png'));im.save(root/'source'/(name+'.jpg'),quality=96,subsampling=0)
report={'method':'Barycentric object-space paint over original UV charts, 1024px, 8px dilation; no geometry displacement; normal flattening over same continuous region.', 'inputSha256':hashlib.sha256(raw).hexdigest(),'inputGeometrySha256':hashlib.sha256(v.tobytes()+f.astype('<u4').tobytes()+uv.tobytes()).hexdigest(),'deliveryEncoding':'JPEG quality 96, 4:4:4; lossless PNG masters retained. Outside-region equality applies to pre-encoding color samples.','coveredTexels':int(mask.sum()),'repaintedTexels':int((roi>.01).sum()),'finite':bool(np.isfinite(color).all() and np.isfinite(normal).all()),'platePhaseRange':[0,10.8],'preservedOutsideRegion':bool(np.max(abs(new[(roi==0)&(cluster==0)]-old[(roi==0)&(cluster==0)]))==0)}
(root/'review'/('surface-bake'+suffix+'-14.json')).write_text(json.dumps(report,indent=2));print(json.dumps(report))
