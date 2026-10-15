from PIL import Image,ImageDraw,ImageFont
import numpy as np,json
from collections import deque
from pathlib import Path
root=Path(__file__).resolve().parents[1];r=root/'chomprex/review';ref=Image.open(root.parent/'references/concept_chomprex.jpg').convert('RGB')
def cut(im,reference):
 a=np.array(im);h=np.array(im.convert('HSV'));mask=((h[:,:,1]>40)&(h[:,:,2]<240))|(h[:,:,2]<95) if reference else np.max(np.abs(a.astype(int)-np.array([187,180,171])),axis=2)>40
 if reference:
  seen=np.zeros(mask.shape,dtype=bool);best=[]
  for yy,xx in zip(*np.where(mask)):
   if seen[yy,xx]:continue
   q=deque([(yy,xx)]);seen[yy,xx]=True;component=[]
   while q:
    y,x=q.popleft();component.append((y,x))
    for ny,nx in [(y-1,x),(y+1,x),(y,x-1),(y,x+1)]:
     if 0<=ny<mask.shape[0] and 0<=nx<mask.shape[1] and mask[ny,nx] and not seen[ny,nx]:seen[ny,nx]=True;q.append((ny,nx))
   if len(component)>len(best):best=component
  mask[:]=False
  for y,x in best:mask[y,x]=True
 yy,xx=np.where(mask);box=(int(xx.min()),int(yy.min()),int(xx.max()+1),int(yy.max()+1));m=Image.fromarray((mask*255).astype('uint8')).crop(box);im=im.crop(box);return im,m,box
report={};board=Image.new('RGB',(2200,1900),'#151a24');d=ImageDraw.Draw(board);font=lambda n:ImageFont.truetype('C:/Windows/Fonts/arial.ttf',n)
d.text((30,20),'CHOMP REX - HEIGHT-ALIGNED REFERENCE OVERLAYS',font=font(34),fill='white');d.text((30,70),'Magenta: supplied art silhouette. Cyan: exported model. Feet aligned; no nonuniform image scaling.',font=font(24),fill='#ffd188')
for row,(name,box) in enumerate([('front',(10,135,310,760)),('side',(310,135,950,760))]):
 inputs=[cut(ref.crop(box),True),cut(Image.open(r/('candidate-'+name+'.png')).convert('RGB'),False)];canvases=[];masks=[];stats=[]
 for im,mask,bbox in inputs:
  factor=650/im.height;w=round(im.width*factor);im=im.resize((w,650),Image.Resampling.LANCZOS);mask=mask.resize((w,650),Image.Resampling.NEAREST);a=np.array(mask)>0;ys,xs=np.where(a[585:]);foot=float(xs.mean()) if len(xs) else w/2;shift=int(500-foot)
  c=Image.new('RGB',(1100,740),'#e5dfd5');c.paste(im,(shift,30));m=Image.new('L',(1100,740));m.paste(mask,(shift,30));canvases.append(c);masks.append(np.array(m)/255)
  widths=[]
  for y in [.15,.30,.50,.70,.85]:
   xx=np.where(a[round(y*649)])[0];widths.append(round((int(xx.max())-int(xx.min()))/650,3) if len(xx) else 0)
  stats.append({'input_foreground_bbox':bbox,'width_height':round(w/650,3),'relative_widths_at_height_fraction_from_top':widths})
 over=np.zeros((740,1100,3),dtype=np.float32)+24;over+=masks[0][:,:,None]*np.array([150,20,100]);over+=masks[1][:,:,None]*np.array([20,140,150]);over=np.clip(over,0,255).astype('uint8')
 y=125+row*850;board.paste(canvases[0],(0,y));board.paste(Image.fromarray(over),(1100,y));d.text((30,y+748),name.upper()+' / supplied art',font=font(25),fill='white');d.text((1130,y+748),'silhouette overlay',font=font(25),fill='white');report[name]={'reference':stats[0],'candidate':stats[1]}
d.text((30,1830),'Alignment is a diagnostic aid. Reference poses/projection differ; inspect anatomy and expression separately.',font=font(24),fill='#ffd188')
board.save(r/'reference-overlay-current.png');(r/'reference-overlay-metrics.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))
