from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import hashlib,json
root=Path(__file__).resolve().parents[3];r=root/'art/overhaul/stormbelly20/review';font=lambda n:ImageFont.truetype('C:/Windows/Fonts/arial.ttf',n);records=[]
for variant in ['candidate','lod']:
 c=Image.new('RGB',(2800,1560),'#12212d');d=ImageDraw.Draw(c);d.text((20,15),'STORMBELLY20 / HORN ORBIT / '+variant.upper(),font=font(32),fill='white');inputs=[]
 for row,(kind,elevation) in enumerate([('before','level'),('after','level'),('before','above'),('after','above')]):
  y=75+row*360;d.text((15,y),kind.upper()+' / '+elevation,font=font(24),fill='#f4ce86')
  for col,angle in enumerate(range(0,360,45)):
   p=r/'horn-orbit'/f'{variant}-{kind}-idle-{angle}-{elevation}.png';inputs.append(p);im=Image.open(p);im.thumbnail((340,310));c.paste(im,(col*350+5,y+32));d.text((col*350+10,y+332),str(angle)+' degrees',font=font(18),fill='white')
 d.text((20,1530),'Same existing mesh, idle pose, light and cameras. Review of anchored roots, swept tips and shading; no universal intersection claim.',font=font(20),fill='#a5c5dc')
 target=r/'boards'/f'Stormbelly20-horn-orbit-{variant}.png';c.save(target);records.append({'board':target.name,'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'sources':[{'path':p.relative_to(root).as_posix(),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in inputs]})
(r/'boards/horn-board-provenance-20.json').write_text(json.dumps(records,indent=2))
