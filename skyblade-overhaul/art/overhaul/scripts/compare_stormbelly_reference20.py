from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import hashlib,json,numpy as np
root=Path(__file__).resolve().parents[3];out=root/'art/overhaul/stormbelly20/review';boards=out/'boards';boards.mkdir(exist_ok=True);refpath=root/'art/references/concept_heavyweight.jpg';ref=Image.open(refpath).convert('RGB');font=lambda n:ImageFont.truetype('C:/Windows/Fonts/arial.ttf',n)
refs={'face':{'front':(137,136,310,327),'side':(450,135,683,334),'three-quarter':(1430,134,1750,350)},'body':{'front':(8,132,435,738),'side':(440,130,930,738),'three-quarter':(1260,130,1768,745)}};records=[]
def fit(canvas,im,box):
 x,y,w,h=box;scale=min(w/im.width,h/im.height);im=im.resize((round(im.width*scale),round(im.height*scale)),Image.Resampling.LANCZOS);canvas.paste(im,(x+(w-im.width)//2,y+(h-im.height)//2))
def trim(im):
 a=np.array(im);mask=np.max(abs(a.astype(int)-np.array([187,180,171])),axis=2)>18;y,x=np.where(mask);return im.crop((x.min(),y.min(),x.max()+1,y.max()+1))
for detail in ['face','body']:
 c=Image.new('RGB',(2100,2200),'#12212d');d=ImageDraw.Draw(c);d.text((25,24),'STORMBELLY / LOCALIZED FACIAL REFINEMENT 20',font=font(35),fill='white');d.text((25,78),'Same rig, clips, textures, camera and lighting; supplied illustration pose/projection differs.',font=font(24),fill='#a5c5dc');inputs=[refpath]
 for col,label in enumerate(['SUPPLIED TURNAROUND','ACCEPTED CHECKPOINT08','STORMBELLY20 CANDIDATE']):d.text((col*700+20,130),label,font=font(25),fill='#f4ce86')
 for row,view in enumerate(['front','side','three-quarter']):
  ims=[ref.crop(refs[detail][view])]
  for kind in ['before','after']:
   p=out/'matched'/f'lod-{kind}-idle-{view}-{detail}.png';inputs.append(p);im=Image.open(p).convert('RGB');ims.append(trim(im) if detail=='body' else im)
  for col,im in enumerate(ims):fit(c,im,(col*700+20,180+row*635,660,570))
  d.text((25,760+row*635),view.upper(),font=font(23),fill='white')
 d.text((25,2120),'Only existing eye/lid, jaw/tusk and horn geometry changes. No broad body warp; reference likeness remains approximate.',font=font(22),fill='#a5c5dc');target=boards/f'Stormbelly20-{detail}-comparison.png';c.save(target);records.append({'board':target.name,'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'sources':[{'path':p.relative_to(root).as_posix(),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in inputs]})
(boards/'board-provenance-20.json').write_text(json.dumps(records,indent=2));print('Saved face/body reference boards')
