from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import json,hashlib,shutil
root=Path(__file__).resolve().parents[3];review=root/'art/overhaul/hud21/review';out=review/'boards';out.mkdir(exist_ok=True);font=lambda n:ImageFont.truetype('C:/Windows/Fonts/arial.ttf',n)
def fit(c,p,box):
 im=Image.open(p).convert('RGB');x,y,w,h=box;scale=min(w/im.width,h/im.height);im=im.resize((round(im.width*scale),round(im.height*scale)),Image.Resampling.LANCZOS);c.paste(im,(x+(w-im.width)//2,y+(h-im.height)//2))
c=Image.new('RGB',(2000,2250),'#12212d');d=ImageDraw.Draw(c);d.text((28,20),'SKYBLADE HUNT / RESPONSIVE HUD REPAIR',font=font(42),fill='white');inputs=[]
for col,kind in enumerate(['before','after']):
 d.text((col*1000+25,85),'CANDIDATE20 / BEFORE' if kind=='before' else 'CANDIDATE21 / AFTER',font=font(28),fill='#f4ce86')
 for name,state,box in [('landscape','combat',(col*1000+15,145,970,450)),('narrow-landscape','boss',(col*1000+15,650,970,545)),('safe-portrait','combat',(col*1000+15,1250,970,870))]:
  p=review/'layout'/f'{kind}-{name}-{state}.png';inputs.append(p);fit(c,p,box)
for y,label in [(605,'844 x 390 landscape / status, target, objective and all touch actions'),(1205,'568 x 320 narrow landscape / boss bar and readable resource labels'),(2140,'390 x 844 portrait / simulated 44px top and 34px bottom safe areas')]:d.text((25,y),label,font=font(25),fill='white')
d.text((25,2200),'Same accepted character assets and camera. Browser viewport/touch and CSS inset emulation; no physical-device claim.',font=font(23),fill='#a5c5dc')
target=out/'Skyblade21-HUD-before-after.png';c.save(target)
records=[{'board':target.name,'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'sources':[{'path':p.relative_to(root).as_posix(),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in inputs]}]
for src,name in [(root/'art/overhaul/chomp19/review/boards/Chomp19-face-comparison.png','Skyblade21-accepted-Chomp-before-after.png'),(root/'art/overhaul/stormbelly20/review/boards/Stormbelly20-face-comparison.png','Skyblade21-accepted-Stormbelly-before-after.png')]:
 dst=out/name;shutil.copy2(src,dst);records.append({'board':name,'sha256':hashlib.sha256(dst.read_bytes()).hexdigest(),'sources':[{'path':src.relative_to(root).as_posix(),'sha256':hashlib.sha256(src.read_bytes()).hexdigest()}],'note':'Previously accepted art evidence, preserved unchanged in Candidate21; not a new character change.'})
(out/'board-provenance-21.json').write_text(json.dumps(records,indent=2));print(json.dumps({'boards':len(records)}))
