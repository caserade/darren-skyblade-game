from pathlib import Path
from PIL import Image,ImageDraw,ImageFont,ImageOps
root=Path(__file__).resolve().parents[3];review=root/'art/overhaul/skydrake11/review'
font=lambda size:ImageFont.truetype('C:/Windows/Fonts/arial.ttf',size)
im=Image.new('RGB',(1800,5350),'#f5f1e9');d=ImageDraw.Draw(im)
d.text((30,22),'SkyDrake | checkpoint 11 | LOCAL CANDIDATE',font=font(39),fill='#172c4c')
d.text((30,76),'Actual supplied art and rendered meshes. Unpublished; live private Site remains version 7.',font=font(24),fill='#31435b')
ref=Image.open(root/'art/references/concept_skydrake.jpg').convert('RGB').crop((0,130,1536,900));ref.thumbnail((1740,830));im.paste(ref,((1800-ref.width)//2,120))
d.text((30,960),'SUPPLIED CONCEPT | concept_skydrake.jpg | design authority',font=font(23),fill='#172c4c')
views=['front','side','back','three-quarter']
for row,(label,folder,kind) in enumerate([('BEFORE | checkpoint 10 | 11 draw calls / 42,617 triangles','comparison-11','before'),('AFTER | checkpoint 11 full | 11 draw calls / 43,057 triangles','comparison-11','after'),('AFTER | checkpoint 11 reduced | 11 draw calls / 24,541 triangles','comparison-11-lod','after')]):
 y=1010+row*500;d.rectangle((20,y,1780,y+42),fill='#172c4c');d.text((35,y+8),label,font=font(23),fill='white')
 for col,view in enumerate(views):
  shot=Image.open(review/folder/(kind+'-'+view+'.png')).convert('RGB').resize((440,440),Image.Resampling.LANCZOS);im.paste(shot,(20+col*440,y+45));d.text((30+col*440,y+463),view.upper(),font=font(19),fill='#172c4c')
for row,(clip,label) in enumerate([('walk','COMMON WALK CLIP | matching authored time; gait contact verified separately'),('attack','EXTREME ATTACK | shoulder/hip pulling improved, still an open close-up limit'),('tailWhip','TAIL WHIP | matching authored time and camera')]):
 y=2515+row*620;d.rectangle((20,y,1780,y+40),fill='#172c4c');d.text((35,y+8),label,font=font(23),fill='white')
 for col,(kind,title) in enumerate([('before','CHECKPOINT 10'),('after','CHECKPOINT 11 FULL'),('lod','CHECKPOINT 11 REDUCED')]):
  shot=Image.open(review/'pose-comparison-11'/f'{kind}-{clip}.png').convert('RGB');im.paste(shot.resize((540,540),Image.Resampling.LANCZOS),(45+col*590,y+43));d.text((45+col*590,y+590),title,font=font(21),fill='#172c4c')
y=4380;d.text((30,y),'GAME SCENE | existing lock-on camera (left) / flight diagnostic view (right)',font=font(24),fill='#172c4c')
for col,(folder,file,label) in enumerate([('player-camera-11/candidate-straight','game-gait-180.png','CONTROLLED PURSUIT | existing player / camera updates'),('game-motion-11-candidate','060-circle.png','FLIGHT | current full candidate')]):
 shot=ImageOps.contain(Image.open(review/folder/file).convert('RGB'),(860,605));im.paste(shot,(30+col*890,y+45));d.text((35+col*890,y+660),label,font=font(22),fill='#172c4c')
for i,line in enumerate(['Verified: improved torso/arm weight transitions; unified wing border; tapered dorsal-spine thickness.', 'Preserved: 39 bones / 14 clips / checkpoint-10 gait / gameplay timing / saves / other characters.', 'Open: extreme close-up pulling, broad belly plates, scale style and remaining organic shape approximations.']):d.text((30,5120+i*63),line,font=font(24),fill='#783c27' if i==2 else '#172c4c')
im.save(review/'SkyDrake-checkpoint-11-comparison.png');print(review/'SkyDrake-checkpoint-11-comparison.png')
sheet=Image.new('RGB',(1800,5050),'#f5f1e9');sd=ImageDraw.Draw(sheet)
for row,clip in enumerate(['idle','walk','flyIdle','land','attack','hit','tailWhip','death']):
 y=row*630;sd.text((20,y+3),clip+' | checkpoint 10 / checkpoint 11 full / checkpoint 11 reduced',font=font(22),fill='#172c4c')
 for col,kind in enumerate(['before','after','lod']):
  shot=Image.open(review/'pose-comparison-11'/f'{kind}-{clip}.png').convert('RGB');sheet.paste(shot.resize((600,600),Image.Resampling.LANCZOS),(col*600,y+30))
sheet.save(review/'SkyDrake-checkpoint-11-poses.png')
