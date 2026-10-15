from pathlib import Path
import json,hashlib
import numpy as np
from PIL import Image,ImageDraw,ImageFont
root=Path(__file__).resolve().parents[1];review=root/'chomp18/review';boards=review/'boards';font=lambda n:ImageFont.truetype('C:/Windows/Fonts/arial.ttf',n)
def fit(c,im,box):
 x,y,w,h=box;f=min(w/im.width,h/im.height);im=im.resize((round(im.width*f),round(im.height*f)),Image.Resampling.LANCZOS);c.paste(im,(x+(w-im.width)//2,y+(h-im.height)//2))
c=Image.new('RGB',(1800,2150),'#12212d');d=ImageDraw.Draw(c);d.text((25,25),'CHOMP REX / ACTUAL GAMEPLAY COMPARISON',font=font(35),fill='white');sources=[]
for col,kind in enumerate(['before','after']):
 d.text((col*900+25,85),'SEALED RC16' if kind=='before' else 'CHOMP 18 CANDIDATE',font=font(28),fill='#f4ce86')
 for name,frame,box in [('desktop','000',(col*900+15,140,870,550)),('portrait','060',(col*900+15,730,870,850)),('landscape-touch','110',(col*900+15,1645,870,410))]:
  p=review/'gameplay'/f'{kind}-{name}-{frame}.png';sources.append(p);fit(c,Image.open(p).convert('RGB'),box)
d.text((25,695),'Desktop / matching idle frame and normal gameplay camera',font=font(22),fill='white');d.text((25,1605),'Portrait / matching warning frame; touch emulation',font=font(22),fill='white');d.text((25,2080),'Landscape HUD crowding is present before and after. This pass changes only Chomp geometry.',font=font(22),fill='#a5c5dc')
target=boards/'Chomp18-gameplay-comparison.png';c.save(target)
record={'board':target.name,'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'sources':[{'path':str(p.relative_to(root.parent.parent)).replace('\\','/'),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in sources]};(boards/'gameplay-board-provenance-18.json').write_text(json.dumps(record,indent=2))
clips=['idle','walk','turn','biteWindup','bite','chargeWindup','charge','hit','stagger','recover','recovery','death'];c=Image.new('RGB',(1800,1550),'#12212d');d=ImageDraw.Draw(c);d.text((25,25),'CHOMP 18 / UNCHANGED CLIPS - REDUCED MESH POSES',font=font(30),fill='white')
for i,clip in enumerate(clips):
 x=(i%4)*450;y=90+(i//4)*470;fit(c,Image.open(review/'motion'/f'lod-{clip}.png'),(x+10,y,430,430));d.text((x+20,y+435),clip,font=font(24),fill='white')
d.text((25,1500),'All 12 clips sampled at 25 times in both variants; these are representative actual rendered poses.',font=font(22),fill='#a5c5dc');c.save(boards/'Chomp18-motion-contact.png')
motionboard=boards/'Chomp18-motion-contact.png';record={'board':motionboard.name,'sha256':hashlib.sha256(motionboard.read_bytes()).hexdigest(),'sources':[{'path':str((review/'motion'/f'lod-{clip}.png').relative_to(root.parent.parent)).replace('\\','/'),'sha256':hashlib.sha256((review/'motion'/f'lod-{clip}.png').read_bytes()).hexdigest()} for clip in clips]};(boards/'motion-board-provenance-18.json').write_text(json.dumps(record,indent=2))
# Fixed image-space mouth region, same camera and idle time before/after.
counts={}
for kind in ['before','after']:
 im=Image.open(review/'matched'/f'lod-{kind}-idle-front-face.png').convert('RGB');a=np.array(im.crop((300,690,720,810)));mask=(a[:,:,0]<125)&(a[:,:,1]<75)&(a[:,:,2]<115)&(a[:,:,0]>a[:,:,1]*1.2);counts[kind]=int(mask.sum())
report={'fixedRoi':[300,690,720,810],'darkMouthPixels':counts,'reductionFraction':1-counts['after']/counts['before'],'limit':'Heuristic dark burgundy mask in a fixed rendered mouth crop, under identical camera/light/idle time. It measures reduced dark opening, not tooth contact or reference likeness.'};(review/'grin-measurement-18.json').write_text(json.dumps(report,indent=2));print(json.dumps(report))
