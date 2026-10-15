from pathlib import Path
from PIL import Image,ImageDraw,ImageOps
import numpy as np,json,hashlib
root=Path(__file__).resolve().parents[3];out=root/'art/overhaul/heavyweight/review'
ref=Image.open(root/'art/references/concept_heavyweight.jpg').convert('RGB');a=np.array(ref);yy=np.indices(a.shape[:2])[0];mask=(a[:,:,0]<220)&(yy>125)&(yy<760)
im=Image.fromarray((mask*255).astype('uint8')).copy();ImageDraw.floodfill(im,(220,450),128);refmask=np.array(im)==128
def metrics(m):
 ys,xs=np.where(m);x0,x1=xs.min(),xs.max()+1;y0,y1=ys.min(),ys.max()+1;h=y1-y0
 widths={}
 for f in [.18,.30,.50,.80]:
  row=m[max(y0,int(y0+h*f)-2):min(y1,int(y0+h*f)+3)].any(axis=0);indices=np.where(row)[0];widths[str(f)]=float((indices.max()-indices.min()+1)/h)
 return {'bbox':[int(x0),int(y0),int(x1),int(y1)],'width_over_height':float((x1-x0)/h),'row_width_over_height':widths}
report={'reference':metrics(refmask),'notes':'Silhouette ratios are diagnostic only. Supplied art is not a calibrated orthographic camera.'}
for kind in ['before','after']:
 im=Image.open(out/'comparison-07'/f'{kind}-front.png').convert('RGB');a=np.array(im).astype(int);m=np.max(np.abs(a-a[0,0]),axis=2)>12;report[kind]=metrics(m)
for file in ['concept_heavyweight.jpg','heavyweight_model_sheet.jpg']:report[file+'_sha256']=hashlib.sha256((root/'art/references'/file).read_bytes()).hexdigest()
(out/'reference-measurements.json').write_text(json.dumps(report,indent=2));print(json.dumps(report))
