from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import json,hashlib,numpy as np
root=Path(__file__).resolve().parents[3];r=root/'art/overhaul/stormbelly20/review';board=r/'boards';font=lambda n:ImageFont.truetype('C:/Windows/Fonts/arial.ttf',n);provenance=[]
for clip in ['stompWindup','stagger','death']:
 c=Image.new('RGB',(2100,1620),'#12212d');d=ImageDraw.Draw(c);d.text((24,20),'STORMBELLY 20 / MATCHED '+clip.upper()+' EXPRESSION SEQUENCE',font=font(30),fill='white');inputs=[]
 for row,(kind,view) in enumerate([('before','front'),('after','front'),('before','three-quarter'),('after','three-quarter')]):
  y=80+row*380;d.text((15,y),('Checkpoint08' if kind=='before' else 'Stormbelly20')+' '+view,font=font(21),fill='#f4ce86')
  for col,t in enumerate([0,200,400,600,800,999]):
   p=r/'expression'/f'lod-{kind}-{clip}-{t:03d}-{view}-face.png';inputs.append(p);im=Image.open(p).crop((200,200,850,850));im.thumbnail((330,330));c.paste(im,(col*350+10,y+30));d.text((col*350+10,y+350),f'{t/10:.1f}%',font=font(18),fill='white')
 d.text((24,1600),'Same preserved clip, time, mesh topology, camera and lighting. Review samples are not proof against all intersections.',font=font(18),fill='#a5c5dc');target=board/f'Stormbelly20-expression-{clip}.png';c.save(target);provenance.append({'board':target.name,'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'sources':[{'path':p.relative_to(root).as_posix(),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in inputs]})
(board/'expression-board-provenance-20.json').write_text(json.dumps(provenance,indent=2))
