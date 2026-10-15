"""Transfer checkpoint12 skin color to the new shoulder loops by nearest surface UV."""
from pathlib import Path
import ast,json
import numpy as np
from PIL import Image
p=Path(__file__).resolve().parents[1]/'skydrake14'
data=np.load(p/'source/shoulder-projection.npz');mask=data['mask'];uv=data['source_uv']
original=np.asarray(Image.open(p.parent/'skydrake12/source/skydrake-surface-color.jpg').convert('RGB'),dtype=float)
x=np.clip(uv[:,0],0,1)*(original.shape[1]-1);y=(1-np.clip(uv[:,1],0,1))*(original.shape[0]-1)
x0=x.astype(int);y0=y.astype(int);x1=np.minimum(x0+1,original.shape[1]-1);y1=np.minimum(y0+1,original.shape[0]-1);fx=(x-x0)[:,None];fy=(y-y0)[:,None]
samples=(original[y0,x0]*(1-fx)+original[y0,x1]*fx)*(1-fy)+(original[y1,x0]*(1-fx)+original[y1,x1]*fx)*fy
out=np.zeros((*mask.shape,3));out[mask]=samples
lib=(p.parent/'skydrake12/source/sculpt_lib.py').read_text()
for fn in ast.parse(lib).body:
 if isinstance(fn,ast.FunctionDef) and fn.name=='dilate':exec(ast.get_source_segment(lib,fn),globals())
out=dilate(out,mask,8);im=Image.fromarray(np.flipud(np.clip(out,0,255).astype('uint8')))
im.save(p/'source/shoulder-color.png');im.save(p/'source/shoulder-color.jpg',quality=96,subsampling=0)
report={'resolution':512,'source':'checkpoint12 skydrake-surface-color.jpg','coveredTexels':int(mask.sum()),'projectionDistanceMean':float(data['distance'].mean()),'projectionDistanceMax':float(data['distance'].max())}
(p/'review/shoulder-bake-14.json').write_text(json.dumps(report,indent=2));print(report)
