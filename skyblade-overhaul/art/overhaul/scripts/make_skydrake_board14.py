from pathlib import Path
from PIL import Image,ImageDraw,ImageFont,ImageOps
root=Path(__file__).resolve().parents[3];r=root/'art/overhaul/skydrake14/review'
font=lambda n:ImageFont.truetype('C:/Windows/Fonts/arial.ttf',n)
im=Image.new('RGB',(1800,3950),'#f5f1e9');d=ImageDraw.Draw(im)
d.text((30,20),'SkyDrake | checkpoint 14 | SHOULDER SUPPORT REPAIR',font=font(36),fill='#172c4c')
d.text((30,73),'SCOPED GATE PASSED: sharp fan and socket notch removed. Soft armpit fold remains.',font=font(24),fill='#27633b')
ref=Image.open(root/'art/references/skydrake_model_sheet.jpg').convert('RGB');ref=ref.crop((0,int(ref.height*.04),ref.width,int(ref.height*.43)));ref.thumbnail((1740,740));im.paste(ref,((1800-ref.width)//2,115))
d.text((30,870),'Supplied turnaround pixels inspected. Supplied rounded-arm silhouette guides the local shoulder repair.',font=font(25),fill='#172c4c')
for row,(clip,folder,label) in enumerate([('walk','pose-comparison-14','ORDINARY WALK'),('attack','pose-comparison-14','RAISED-ARM ATTACK'),('attack','pose-comparison-14-clay','CLAY DIAGNOSTIC: continuous rounded transition')]):
 y=930+row*660;d.rectangle((20,y,1780,y+40),fill='#172c4c');d.text((35,y+7),label,font=font(24),fill='white')
 for col,(kind,title) in enumerate([('before','CHECKPOINT 12'),('after','14 FULL'),('lod','14 REDUCED')]):
  shot=Image.open(r/folder/f'{kind}-{clip}.png').convert('RGB');im.paste(shot.resize((570,570),Image.Resampling.LANCZOS),(20+col*590,y+45));d.text((25+col*590,y+620),title,font=font(22),fill='#172c4c')
y=2915;d.text((30,y),'ACTUAL LOCK-ON COMBAT CAMERA | final full mesh, existing camera',font=font(25),fill='#172c4c')
for col,(scenario,frame) in enumerate([('ground','052'),('flight','448')]):
 shot=ImageOps.contain(Image.open(r/'combat-14'/f'after-{scenario}-{frame}-atk.png').convert('RGB'),(860,605));im.paste(shot,(30+col*890,y+48))
for i,line in enumerate(['39 bones / 14 clips / all 1,638 tracks retained exactly. Full and reduced seams closed.', 'High-swoop framing repair is reviewed separately in the camera comparison board.', 'No publication. Private live Site remains on v7. Editable checkpoint 14 source is saved separately.', 'Soft armpit fold and fine surface/likeness differences remain; this is a scoped repair.']):d.text((30,3630+i*65),line,font=font(24),fill='#27633b' if i==0 else '#172c4c')
im.save(r/'SkyDrake-checkpoint-14-comparison.png');print(r/'SkyDrake-checkpoint-14-comparison.png')
