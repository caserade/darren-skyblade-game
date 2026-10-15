from pathlib import Path
import json
from PIL import Image,ImageDraw,ImageFont,ImageOps
root=Path(__file__).resolve().parents[3];review=root/'art/overhaul/skydrake10/review'
font=lambda size:ImageFont.truetype('C:/Windows/Fonts/arial.ttf',size)
im=Image.new('RGB',(1800,4300),'#f5f1e9');d=ImageDraw.Draw(im)
d.text((30,22),'SkyDrake | checkpoint 10 | LOCAL CANDIDATE',font=font(39),fill='#172c4c')
d.text((30,76),'Actual supplied art and rendered meshes. Live private Site remains version 7.',font=font(24),fill='#31435b')
ref=Image.open(root/'art/references/concept_skydrake.jpg').convert('RGB').crop((0,130,1536,900));ref.thumbnail((1740,830));im.paste(ref,((1800-ref.width)//2,120))
d.text((30,960),'SUPPLIED CONCEPT: concept_skydrake.jpg (turnaround detail)',font=font(23),fill='#172c4c')
views=['front','side','back','three-quarter']
for row,(label,folder,kind) in enumerate([('BEFORE | checkpoint 09 | 11 draw calls / 42,458 triangles','comparison-10','before'),('AFTER | checkpoint 10 full | 11 draw calls / 42,617 triangles','comparison-10','after'),('AFTER | checkpoint 10 reduced | 11 draw calls / 24,290 triangles','comparison-10-lod','after')]):
 y=1010+row*500;d.rectangle((20,y,1780,y+42),fill='#172c4c');d.text((35,y+8),label,font=font(23),fill='white')
 for col,view in enumerate(views):
  shot=Image.open(review/folder/(kind+'-'+view+'.png')).convert('RGB').resize((440,440),Image.Resampling.LANCZOS);im.paste(shot,(20+col*440,y+45));d.text((30+col*440,y+463),view.upper(),font=font(19),fill='#172c4c')
d.text((30,2520),'ACTUAL GAMEPLAY | existing Gale Spires | isolated profile | full candidate',font=font(25),fill='#172c4c')
for col,name in enumerate(['060-circle.png','468-land.png']):
 shot=Image.open(review/'game-motion-10-candidate'/name).convert('RGB');shot=ImageOps.contain(shot,(860,530));im.paste(shot,(30+col*890,2570));d.text((35+col*890,3108),'FLIGHT' if col==0 else 'LANDING / FOOT CLEARANCE',font=font(21),fill='#172c4c')
d.text((30,3150),'GROUND PURSUIT | same 1-second sample / camera | diagnostic game view',font=font(25),fill='#172c4c')
for col,folder in enumerate(['gait-baseline09-straight','gait-10/candidate-straight']):
 shot=Image.open(review/folder/'game-gait-060.png').convert('RGB');shot=ImageOps.contain(shot,(860,605));im.paste(shot,(30+col*890,3200));d.text((35+col*890,3820),'BEFORE | checkpoint 09' if col==0 else 'AFTER | checkpoint 10',font=font(23),fill='#172c4c')
for i,text in enumerate([
 'Verified: travel-driven planted gait; ground / turn / stop / attack / stagger / takeoff transitions.',
 'Reference-led changes: broader feet and haunches, narrower forward belly, shorter horns, solid tail arrow.',
 '39 bones and 14 authored clips retained. Gameplay position, speed, collision, attack timing and saves unchanged.',
 'Open art gates: broad belly plates, fine scales, more organic wing folds and extreme shoulder/hip deformation.',
 'Local review only. Not a physical controller, phone, full-playthrough or final art sign-off.'
]):d.text((30,3900+i*64),text,font=font(24),fill='#783c27' if i>=3 else '#172c4c')
im.save(review/'SkyDrake-checkpoint-10-comparison.png')
print(review/'SkyDrake-checkpoint-10-comparison.png')
sheet=Image.new('RGB',(1600,3520),'#f5f1e9');sd=ImageDraw.Draw(sheet)
clips=['idle','takeoff','flyIdle','attackWindup','attack','land','stagger','tailWindup','tailWhip','death']
for row,clip in enumerate(clips):
 sd.text((12,row*352+3),clip+' | 0 / 25 / 50 / 75 / 100 percent',font=font(20),fill='#172c4c')
 for col,phase in enumerate([0,25,50,75,100]):
  shot=Image.open(review/'motion-10'/f'{clip}-full-{phase:03}.png').convert('RGB');sheet.paste(ImageOps.contain(shot,(320,320)),(col*320,row*352+30))
sheet.save(review/'SkyDrake-checkpoint-10-motion.png')
