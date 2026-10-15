from pathlib import Path
import json
from PIL import Image,ImageDraw,ImageFont,ImageOps
root=Path(__file__).resolve().parents[3];review=root/'art/overhaul/skydrake/review'
font=lambda size:ImageFont.truetype('C:/Windows/Fonts/arial.ttf',size)
im=Image.new('RGB',(1800,3190),'#f5f1e9');d=ImageDraw.Draw(im)
d.text((30,22),'SkyDrake | checkpoint 09 | LOCAL CANDIDATE',font=font(39),fill='#172c4c')
d.text((30,76),'Actual supplied art and rendered meshes. Live private Site remains version 7.',font=font(24),fill='#31435b')
ref=Image.open(root/'art/references/concept_skydrake.jpg').convert('RGB').crop((0,130,1536,900));ref.thumbnail((1740,830));im.paste(ref,((1800-ref.width)//2,120))
d.text((30,960),'SUPPLIED CONCEPT: concept_skydrake.jpg (turnaround detail)',font=font(23),fill='#172c4c')
views=['front','side','back','three-quarter']
for row,(label,folder,kind) in enumerate([('BEFORE | current private v7 runtime | 68 draw calls / 30,599 triangles','comparison-09','before'),('AFTER | full candidate | 11 draw calls / 42,458 triangles','comparison-09','after'),('AFTER | reduced candidate | 11 draw calls / 24,201 triangles','comparison-09-lod','after')]):
 y=1010+row*500;d.rectangle((20,y,1780,y+42),fill='#172c4c');d.text((35,y+8),label,font=font(23),fill='white')
 for col,view in enumerate(views):
  shot=Image.open(review/folder/(kind+'-'+view+'.png')).convert('RGB').resize((440,440),Image.Resampling.LANCZOS);im.paste(shot,(20+col*440,y+45));d.text((30+col*440,y+463),view.upper(),font=font(19),fill='#172c4c')
d.text((30,2520),'ACTUAL GAMEPLAY | existing Gale Spires | isolated profile | full candidate',font=font(25),fill='#172c4c')
for col,name in enumerate(['060-circle.png','468-land.png']):
 shot=Image.open(review/'game-motion-09-candidate'/name).convert('RGB');shot=ImageOps.contain(shot,(860,530));im.paste(shot,(30+col*890,2570));d.text((35+col*890,3108),'FLIGHT' if col==0 else 'LANDING / FOOT CLEARANCE',font=font(21),fill='#172c4c')
d.text((30,3150),'Open art gates: fine scales / broad belly plates / wing shape / extreme skin deformation / planted ground gait.',font=font(21),fill='#783c27')
im.save(review/'SkyDrake-checkpoint-09-comparison.png')
print(review/'SkyDrake-checkpoint-09-comparison.png')
