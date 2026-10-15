from pathlib import Path
from PIL import Image,ImageDraw,ImageFont,ImageOps
root=Path(__file__).resolve().parents[3];review=root/'art/overhaul/skydrake12/review'
font=lambda size:ImageFont.truetype('C:/Windows/Fonts/arial.ttf',size)
im=Image.new('RGB',(1800,5700),'#f5f1e9');d=ImageDraw.Draw(im)
d.text((30,22),'SkyDrake | checkpoint 12 | LOCAL SURFACE CANDIDATE',font=font(35),fill='#172c4c')
d.text((30,76),'Belly / scale improvement. Shoulder correction NOT resolved. Unpublished; private Site remains v7.',font=font(23),fill='#783c27')
ref=Image.open(root/'art/references/concept_skydrake.jpg').convert('RGB').crop((0,130,1536,900));ref.thumbnail((1740,830));im.paste(ref,((1800-ref.width)//2,120))
d.text((30,960),'SUPPLIED CONCEPT | concept_skydrake.jpg | design authority',font=font(23),fill='#172c4c')
views=['front','side','back','three-quarter']
for row,(label,folder,kind) in enumerate([('BEFORE | checkpoint 11 full | 43,057 triangles','comparison-12','before'),('AFTER | checkpoint 12 full | 43,057 triangles','comparison-12','after'),('AFTER | checkpoint 12 reduced | 24,542 triangles | own surface bake','comparison-12-lod','after')]):
 y=1010+row*500;d.rectangle((20,y,1780,y+42),fill='#172c4c');d.text((35,y+8),label,font=font(23),fill='white')
 for col,view in enumerate(views):
  shot=Image.open(review/folder/(kind+'-'+view+'.png')).convert('RGB').resize((440,440),Image.Resampling.LANCZOS);im.paste(shot,(20+col*440,y+45));d.text((30+col*440,y+463),view.upper(),font=font(19),fill='#172c4c')
for row,(clip,label) in enumerate([('walk','COMMON WALK | matched authored pose; original gait retained'),('attack','RAISED-ARM ATTACK | cleaner surface; original shoulder bridge remains')]):
 y=2515+row*620;d.rectangle((20,y,1780,y+40),fill='#172c4c');d.text((35,y+8),label,font=font(23),fill='white')
 for col,(kind,title) in enumerate([('before','CHECKPOINT 11'),('after','CHECKPOINT 12 FULL'),('lod','CHECKPOINT 12 REDUCED')]):
  shot=Image.open(review/'pose-comparison-12'/f'{kind}-{clip}.png').convert('RGB');im.paste(shot.resize((540,540),Image.Resampling.LANCZOS),(45+col*590,y+43));d.text((45+col*590,y+590),title,font=font(21),fill='#172c4c')
for row,(scenario,frame,label) in enumerate([('ground','052','GROUND TAIL ATTACK | actual existing lock-on camera'),('flight','448','LATE SWOOP | actual existing lock-on camera; high swoop framing remains limited')]):
 y=3780+row*720;d.rectangle((20,y,1780,y+40),fill='#172c4c');d.text((35,y+8),label,font=font(23),fill='white')
 for col,kind in enumerate(['before','after']):
  shot=ImageOps.contain(Image.open(review/'combat-12'/f'{kind}-{scenario}-{frame}-atk.png').convert('RGB'),(860,605));im.paste(shot,(30+col*890,y+48));d.text((35+col*890,y+665),'CHECKPOINT 11' if kind=='before' else 'CHECKPOINT 12 FULL',font=font(22),fill='#172c4c')
for i,line in enumerate(['Retained: broad curved plates, welded surface / normals, restrained haunch scales; separate reduced bake.', 'Preserved: 39 bones / 14 clips / full-mesh body weights / gait / wings / spines / gameplay / saves / other characters.', 'Rejected: shoulder weight / recess trials; the raised-arm pinch was unacceptable and fully reverted.', 'Open: shoulder joint topology, lower-belly facets, individually shaped scales and high-swoop camera framing.', 'Quality gate remains partial. This sheet records improvement and limits; it is not publication approval.']):d.text((30,5250+i*75),line,font=font(23),fill='#783c27' if i>1 else '#172c4c')
im.save(review/'SkyDrake-checkpoint-12-comparison.png');print(review/'SkyDrake-checkpoint-12-comparison.png')
sheet=Image.new('RGB',(1800,5050),'#f5f1e9');sd=ImageDraw.Draw(sheet)
for row,clip in enumerate(['idle','walk','flyIdle','land','attack','hit','tailWhip','death']):
 y=row*630;sd.text((20,y+3),clip+' | checkpoint 11 / checkpoint 12 full / checkpoint 12 reduced',font=font(22),fill='#172c4c')
 for col,kind in enumerate(['before','after','lod']):
  shot=Image.open(review/'pose-comparison-12'/f'{kind}-{clip}.png').convert('RGB');sheet.paste(shot.resize((600,600),Image.Resampling.LANCZOS),(col*600,y+30))
sheet.save(review/'SkyDrake-checkpoint-12-poses.png')
