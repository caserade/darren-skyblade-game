"""Review boards from actual reference and renderer pixels; uniform image scaling."""
from pathlib import Path
from collections import deque
import hashlib,json
import numpy as np
from PIL import Image,ImageDraw,ImageFont
root=Path(__file__).resolve().parents[1];out=root/'chomp19/review';matched=out/'matched';boards=out/'boards';boards.mkdir(exist_ok=True)
reference=root.parent/'references/concept_chomprex.jpg';ref=Image.open(reference).convert('RGB');font=lambda n:ImageFont.truetype('C:/Windows/Fonts/arial.ttf',n)
def cut(image,isref):
 a=np.array(image);h=np.array(image.convert('HSV'))
 mask=((h[:,:,1]>40)&(h[:,:,2]<240))|(h[:,:,2]<95) if isref else np.max(abs(a.astype(int)-np.array([187,180,171])),axis=2)>18
 if isref:
  seen=np.zeros(mask.shape,dtype=bool);best=[]
  for yy,xx in zip(*np.where(mask)):
   if seen[yy,xx]:continue
   queue=deque([(yy,xx)]);seen[yy,xx]=True;component=[]
   while queue:
    y,x=queue.popleft();component.append((y,x))
    for y1,x1 in [(y-1,x),(y+1,x),(y,x-1),(y,x+1)]:
     if 0<=y1<mask.shape[0] and 0<=x1<mask.shape[1] and mask[y1,x1] and not seen[y1,x1]:seen[y1,x1]=True;queue.append((y1,x1))
   if len(component)>len(best):best=component
  mask[:]=False
  for y,x in best:mask[y,x]=True
 yy,xx=np.where(mask);box=(int(xx.min()),int(yy.min()),int(xx.max()+1),int(yy.max()+1));return image.crop(box),mask[box[1]:box[3],box[0]:box[2]],box
def fit(canvas,im,box):
 x,y,w,h=box;scale=min(w/im.width,h/im.height);im=im.resize((round(im.width*scale),round(im.height*scale)),Image.Resampling.LANCZOS);canvas.paste(im,(x+(w-im.width)//2,y+(h-im.height)//2))
face_ref={'front':(75,138,280,375),'side':(315,138,615,390),'three-quarter':(1420,138,1765,395)}
face_model={'front':(210,165,790,860),'side':(70,35,990,850),'three-quarter':(180,90,990,835)}
body_ref={'front':(20,135,335,755),'side':(315,135,945,755),'three-quarter':(1260,135,1765,755)}
metrics={};provenance=[]
for detail in ['face','body']:
 canvas=Image.new('RGB',(2100,2200),'#12212d');d=ImageDraw.Draw(canvas);d.text((30,24),'CHOMP REX / REFERENCE-LED MESH REFINEMENT 19',font=font(35),fill='white');d.text((30,76),'Local candidate only. Same rig, clips, textures and camera; reference pose/projection differs.',font=font(24),fill='#a5c5dc')
 for col,label in enumerate(['SUPPLIED TURNAROUND','CHOMP 18 BASELINE','CHOMP 19 CANDIDATE']):d.text((col*700+25,125),label,font=font(26),fill='#f4ce86')
 inputs=[reference]
 for row,view in enumerate(['front','side','three-quarter']):
  images=[ref.crop((face_ref if detail=='face' else body_ref)[view])]
  if detail=='body':images[0]=cut(images[0],True)[0]
  for kind in ['before','after']:
   p=matched/f'lod-{kind}-idle-{view}-{detail}.png';inputs.append(p);im=Image.open(p).convert('RGB');images.append(im.crop(face_model[view]) if detail=='face' else cut(im,False)[0])
  y=180+row*635
  for col,im in enumerate(images):fit(canvas,im,(col*700+20,y,660,570))
  d.text((30,y+580),view.upper(),font=font(23),fill='white')
 d.text((30,2110),'Uniform scaling only. Localized eyelid, cheek and crown refinement; broader facial proportions remain approximate.',font=font(23),fill='#a5c5dc')
 target=boards/f'Chomp19-{detail}-comparison.png';canvas.save(target)
 provenance.append({'board':target.name,'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'sources':[{'path':str(p.relative_to(root.parent.parent)).replace('\\','/'),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in inputs]})
for kind in ['reference','before','after']:
 im=ref.crop(body_ref['front']) if kind=='reference' else Image.open(matched/f'lod-{kind}-idle-front-body.png').convert('RGB');im,mask,bbox=cut(im,kind=='reference');height,width=mask.shape;a=np.array(im);yy=np.arange(height)[:,None];xx=np.arange(width)[None,:]
 iris=(a[:,:,0]>120)&(a[:,:,1]>70)&(a[:,:,2]<a[:,:,1]*.76)&(a[:,:,0]>a[:,:,1]*1.02)&(yy>height*.065)&(yy<height*.14)
 centers=[]
 for side in [xx<width/2,xx>=width/2]:
  ys,xs=np.where(iris&side);centers.append([float(xs.mean()),float(ys.mean())])
 profile={}
 for frac in [.10,.15,.25,.35,.50,.60,.70,.85]:
  xs=np.where(mask[round((height-1)*frac)])[0];profile[str(frac)]=float((xs.max()-xs.min()+1)/height) if len(xs) else 0
 metrics[kind]={'foregroundBoxInInput':bbox,'heightPixels':height,'widthPixels':width,'widthOverHeight':width/height,'frontWidthsByFractionFromTop':profile,'heuristicIrisCenters':centers,'irisCenterSeparationOverHeight':abs(centers[1][0]-centers[0][0])/height}
 metrics[kind]['irisPixels']=int(iris.sum())
metrics['method']='Largest connected saturated/dark reference foreground and difference-from-background model masks. Height-normalized front silhouette widths and heuristic gold-iris centers in upper 6.5%-14% of body height. Measurements are diagnostics, not a likeness score; pose, projection and lighting differ. Inspect the actual boards.'
(out/'reference-measurements-19.json').write_text(json.dumps(metrics,indent=2));(boards/'board-provenance-19.json').write_text(json.dumps(provenance,indent=2));print(json.dumps(metrics,indent=2))
