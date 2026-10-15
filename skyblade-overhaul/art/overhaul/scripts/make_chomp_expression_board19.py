from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import json,hashlib,numpy as np
root=Path(__file__).resolve().parents[3];r=root/'art/overhaul/chomp19/review';board=r/'boards';font=lambda n:ImageFont.truetype('C:/Windows/Fonts/arial.ttf',n);provenance=[]
for clip in ['biteWindup','bite','stagger']:
 c=Image.new('RGB',(2100,1620),'#12212d');d=ImageDraw.Draw(c);d.text((24,20),'CHOMP 19 / MATCHED '+clip.upper()+' EXPRESSION SEQUENCE',font=font(30),fill='white');inputs=[]
 for row,(kind,view) in enumerate([('before','front'),('after','front'),('before','three-quarter'),('after','three-quarter')]):
  y=80+row*380;d.text((15,y),('Chomp18' if kind=='before' else 'Chomp19')+' '+view,font=font(21),fill='#f4ce86')
  for col,t in enumerate([0,200,400,600,800,999]):
   p=r/'expression'/f'lod-{kind}-{clip}-{t:03d}-{view}-face.png';inputs.append(p);im=Image.open(p).crop((200,200,850,850));im.thumbnail((330,330));c.paste(im,(col*350+10,y+30));d.text((col*350+10,y+350),f'{t/10:.1f}%',font=font(18),fill='white')
 d.text((24,1600),'Same preserved clip, time, mesh topology, camera and lighting. Review samples are not proof against all intersections.',font=font(18),fill='#a5c5dc');target=board/f'Chomp19-expression-{clip}.png';c.save(target);provenance.append({'board':target.name,'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'sources':[{'path':p.relative_to(root).as_posix(),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in inputs]})
(board/'expression-board-provenance-19.json').write_text(json.dumps(provenance,indent=2))
metrics={}
for view,box in [('front',(280,320,730,445)),('side',(315,330,510,440)),('three-quarter',(380,340,620,445))]:
 counts={}
 for kind in ['before','after']:
  p=r/'matched'/f'lod-{kind}-idle-{view}-face.png';a=np.array(Image.open(p).convert('RGB').crop(box)).astype(float);mask=(a[:,:,0]>170)&(a[:,:,1]>165)&(a[:,:,2]>130)&(a[:,:,2]>a[:,:,1]*.75)&(np.max(a,axis=2)-np.min(a,axis=2)<75);counts[kind]=int(mask.sum())
 metrics[view]={'roi':box,'ivoryEyePixels':counts,'reductionFraction':1-counts['after']/max(counts['before'],1)}
(r/'eye-coverage-19.json').write_text(json.dumps({'views':metrics,'method':'Fixed same-camera idle crops; thresholded ivory eye-white pixels only. This measures visible coverage under fixed lighting, not socket anatomy or likeness. Eye/iris component vertex positions themselves are unchanged.'},indent=2));print(json.dumps(metrics))
