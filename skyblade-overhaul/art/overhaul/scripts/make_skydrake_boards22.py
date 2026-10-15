from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import json,hashlib
import numpy as np
root=Path(__file__).resolve().parents[3];review=root/'art/overhaul/skydrake22/review';out=review/'boards';out.mkdir(exist_ok=True);font=lambda n:ImageFont.truetype('C:/Windows/Fonts/arial.ttf',n);records=[]
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def canvas(w,h,title,subtitle):
 c=Image.new('RGB',(w,h),'#13232f');d=ImageDraw.Draw(c);d.text((24,18),title,font=font(34),fill='white');d.text((24,65),subtitle,font=font(21),fill='#afcadc');return c,d
def fit(c,p,box,crop=None):
 im=Image.open(p).convert('RGB');im=im.crop(crop) if crop else im
 if p.parent.name=='reference':
  ar=np.asarray(im).astype(int);mask=np.max(abs(ar-ar[0,0]),axis=2)>20;yy,xx=np.where(mask);im=im.crop((max(0,int(xx.min())-6),max(0,int(yy.min())-6),min(im.width,int(xx.max())+7),min(im.height,int(yy.max())+7)))
 x,y,w,h=box;s=min(w/im.width,h/im.height);im=im.resize((round(im.width*s),round(im.height*s)),Image.Resampling.LANCZOS);c.paste(im,(x+(w-im.width)//2,y+(h-im.height)//2))
def save(c,name,inputs,note):
 p=out/name;c.save(p);records.append({'board':name,'sha256':sha(p),'sources':[{'path':p.relative_to(root).as_posix(),'sha256':sha(p)} for p in dict.fromkeys(inputs)],'note':note})
c,d=canvas(1600,2320,'SKYDRAKE22 / LOCALIZED DEFORMATION REPAIR','Playable reduced mesh. Same rest geometry, rig, clips, texture, camera and authored clip times.');inputs=[]
for j,label in enumerate(['CANDIDATE21 / BEFORE','CANDIDATE22 / AFTER']):d.text((j*800+24,105),label,font=font(25),fill='#f6d48d')
for row,(folder,clip,label) in enumerate([('poses-c','attack','Attack 92.5%: regional peak stretch 4.18x -> 1.95x; neck 2.86x -> 1.67x'),('poses-c-clay','attackWindup','Windup 82.5%: skin-weight transitions smoothed; topology is unchanged'),('poses-c','tailWindup','Tail windup 100%: regional peak stretch 2.06x -> 1.98x')]):
 y=150+row*700;d.text((24,y),label,font=font(23),fill='white')
 for j,k in enumerate(['before','after']):
  p=review/folder/(k+'-'+clip+'.png');inputs.append(p);fit(c,p,(j*800+12,y+36,776,640))
d.text((24,2265),'Improved, not eliminated: elbow/hip creasing, texture seams and facial likeness still need authored refinement.',font=font(22),fill='#afcadc');save(c,'SkyDrake22-deformation-before-after.png',inputs,'Selected trial C reduced mesh. Metrics are maxima across all 41 samples in each clip, not necessarily the pictured instant.')
c,d=canvas(2700,2140,'SKYDRAKE22 / REFERENCE AND PRESERVED SILHOUETTE','Supplied illustration uses a different pose/projection. Only skin weights changed in this pass.');inputs=[root/'art/references/concept_skydrake.jpg']
for j,label in enumerate(['SUPPLIED TURNAROUND','CANDIDATE21','CANDIDATE22']):d.text((j*900+20,105),label,font=font(26),fill='#f6d48d')
for row,(view,crop) in enumerate([('front',(0,140,380,850)),('side',(380,140,770,850))]):
 y=155+row*930;fit(c,inputs[0],(12,y,876,850),crop)
 for j,k in enumerate(['before','after']):
  p=review/'reference'/(k+'-'+view+'.png');inputs.append(p);fit(c,p,((j+1)*900+12,y,876,850))
 d.text((24,y+886),view.upper(),font=font(24),fill='white')
d.text((24,2040),'Remaining likeness gaps: protruding eye whites, eyelid/muzzle shape, thin wing membranes, tail profile and surface detail.',font=font(22),fill='#afcadc');d.text((24,2080),'These require a deliberate sculpt/retopology and texture-bake pass; further weight diffusion will not repair them.',font=font(22),fill='#afcadc');save(c,'SkyDrake22-reference-comparison.png',inputs,'Reference crops are actual supplied pixels; render images are uniformly scaled, not warped.')
c,d=canvas(1600,2000,'SKYDRAKE22 / EXISTING GAMEPLAY CHECK','Production animation adapter and camera. Fixed scene/RNG; controlled invulnerable fixture, not a playthrough.');inputs=[]
for j,label in enumerate(['CANDIDATE21 ASSET','CANDIDATE22 ASSET']):d.text((j*800+24,105),label,font=font(25),fill='#f6d48d')
for row,(scenario,frame,label) in enumerate([('ground','048','Ground tail attack: same player, camera and action timing'),('flight','420','Air attack: same takeoff, windup and swoop sequence')]):
 y=145+row*610;d.text((24,y),label,font=font(23),fill='white')
 for j,k in enumerate(['before','after']):
  p=review/'combat-22'/(k+'-'+scenario+'-'+frame+'-atk.png');inputs.append(p);fit(c,p,(j*800+12,y+35,776,550))
p=review/'realtime-resumed-22.png';inputs.append(p);fit(c,p,(12,1400,1576,520));d.text((24,1360),'Normal frame loop: real keyboard movement, Pause and Resume; existing HUD retained.',font=font(23),fill='white');d.text((24,1955),'No physical controller/phone or hardware FPS claim. Candidate21 remains the tested rollback package.',font=font(22),fill='#afcadc');save(c,'SkyDrake22-gameplay-comparison.png',inputs,'Top rows are canvas-only matched review captures. Bottom is a full-page normal-loop screenshot; not a matched before/after scene.')
(out/'board-provenance-22.json').write_text(json.dumps(records,indent=2));print(json.dumps({'boards':len(records)}))
