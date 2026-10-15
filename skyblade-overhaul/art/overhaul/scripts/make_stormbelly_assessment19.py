from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import json,hashlib,numpy as np
root=Path(__file__).resolve().parents[3];r=root/'art/overhaul/chomp19/review';out=r/'boards';refpath=root/'art/references/concept_heavyweight.jpg';ref=Image.open(refpath).convert('RGB');font=lambda n:ImageFont.truetype('C:/Windows/Fonts/arial.ttf',n)
body={'front':(8,132,435,738),'side':(440,130,930,738),'three-quarter':(1260,130,1768,745)};face={'front':(140,137,305,325),'side':(452,135,680,332),'three-quarter':(1435,135,1750,350)};records=[]
for detail in ['body','face']:
 c=Image.new('RGB',(1800,1500),'#12212d');d=ImageDraw.Draw(c);d.text((25,25),'STORMBELLY / READ-ONLY REFERENCE ASSESSMENT 19',font=font(32),fill='white');d.text((25,75),'Current accepted checkpoint08 reduced mesh; no Stormbelly changes. Illustration pose/projection differs.',font=font(22),fill='#a5c5dc');inputs=[refpath]
 for col,view in enumerate(['front','side','three-quarter']):
  d.text((col*600+20,120),view.upper(),font=font(25),fill='#f4ce86')
  for row in [0,1]:
   if row==0:im=ref.crop((body if detail=='body' else face)[view])
   else:
    p=r/'stormbelly'/f'lod-current-idle-{view}-{detail}.png';inputs.append(p);im=Image.open(p).convert('RGB')
    if detail=='body':
     a=np.array(im);mask=np.max(abs(a.astype(int)-np.array([187,180,171])),axis=2)>18;y,x=np.where(mask);im=im.crop((x.min(),y.min(),x.max()+1,y.max()+1))
   scale=min(560/im.width,565/im.height);im=im.resize((round(im.width*scale),round(im.height*scale)),Image.Resampling.LANCZOS);c.paste(im,(col*600+20+(560-im.width)//2,175+row*640+(565-im.height)//2))
 d.text((25,750),'SUPPLIED TURNAROUND ABOVE / CURRENT REDUCED EXPORT BELOW',font=font(24),fill='#f4ce86');d.text((25,1450),'Uniform image scaling. These inspection renders do not replace production gait/contact regression tests.',font=font(21),fill='#a5c5dc');p=out/f'Stormbelly19-assessment-{detail}.png';c.save(p);records.append({'board':p.name,'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'sources':[{'path':p.relative_to(root).as_posix(),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in inputs]})
(out/'stormbelly-board-provenance-19.json').write_text(json.dumps(records,indent=2));print('Saved body and face assessment boards')
