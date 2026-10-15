from pathlib import Path
import json,hashlib
import numpy as np
from PIL import Image,ImageDraw,ImageFont
root=Path(__file__).resolve().parents[1];review=root/'stormbelly20/review';boards=review/'boards';font=lambda n:ImageFont.truetype('C:/Windows/Fonts/arial.ttf',n)
def fit(c,im,box):
 x,y,w,h=box;f=min(w/im.width,h/im.height);im=im.resize((round(im.width*f),round(im.height*f)),Image.Resampling.LANCZOS);c.paste(im,(x+(w-im.width)//2,y+(h-im.height)//2))
c=Image.new('RGB',(1800,2150),'#12212d');d=ImageDraw.Draw(c);d.text((25,25),'STORMBELLY / ACTUAL GAMEPLAY COMPARISON',font=font(35),fill='white');sources=[]
for col,kind in enumerate(['before','after']):
 d.text((col*900+25,85),'CHECKPOINT08 BASELINE' if kind=='before' else 'STORMBELLY20 CANDIDATE',font=font(28),fill='#f4ce86')
 for name,frame,box in [('desktop','000',(col*900+15,140,870,550)),('portrait','060',(col*900+15,730,870,850)),('landscape-touch','110',(col*900+15,1645,870,410))]:
  p=review/'gameplay'/f'{kind}-{name}-{frame}.png';sources.append(p);fit(c,Image.open(p).convert('RGB'),box)
d.text((25,695),'Desktop / matching idle frame and normal gameplay camera',font=font(22),fill='white');d.text((25,1605),'Portrait / matching warning frame; touch emulation',font=font(22),fill='white');d.text((25,2080),'Landscape HUD crowding is present before and after. This pass changes only Stormbelly geometry.',font=font(22),fill='#a5c5dc')
target=boards/'Stormbelly20-gameplay-comparison.png';c.save(target)
record={'board':target.name,'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'sources':[{'path':str(p.relative_to(root.parent.parent)).replace('\\','/'),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in sources]};(boards/'gameplay-board-provenance-20.json').write_text(json.dumps(record,indent=2))
