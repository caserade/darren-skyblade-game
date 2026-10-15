from pathlib import Path
from PIL import Image,ImageDraw,ImageFont,ImageOps
root=Path(__file__).resolve().parents[3];r=root/'art/overhaul/skydrake13/review'
font=lambda n:ImageFont.truetype('C:/Windows/Fonts/arial.ttf',n)
im=Image.new('RGB',(1800,3950),'#f5f1e9');d=ImageDraw.Draw(im)
d.text((30,20),'SkyDrake | checkpoint 13 | RETOPOLOGY EXPERIMENT',font=font(36),fill='#172c4c')
d.text((30,73),'VISUAL GATE FAILED: armpit fan / angular shoulder. Keep checkpoint 12 as the accepted fallback.',font=font(24),fill='#922e27')
ref=Image.open(root/'art/references/skydrake_model_sheet.jpg').convert('RGB');ref=ref.crop((0,int(ref.height*.04),ref.width,int(ref.height*.43)));ref.thumbnail((1740,740));im.paste(ref,((1800-ref.width)//2,115))
d.text((30,870),'Supplied turnaround pixels inspected. Rounded arm / shallow armpit target remains unmet.',font=font(25),fill='#172c4c')
for row,(clip,folder,label) in enumerate([('walk','pose-comparison-13','ORDINARY WALK'),('attack','pose-comparison-13','RAISED-ARM ATTACK'),('attack','pose-comparison-13-clay','CLAY DIAGNOSTIC: confirms geometric crease')]):
 y=930+row*660;d.rectangle((20,y,1780,y+40),fill='#172c4c');d.text((35,y+7),label,font=font(24),fill='white')
 for col,(kind,title) in enumerate([('before','CHECKPOINT 12'),('after','13 FULL: NOT ACCEPTED'),('lod','13 REDUCED: NOT ACCEPTED')]):
  shot=Image.open(r/folder/f'{kind}-{clip}.png').convert('RGB');im.paste(shot.resize((570,570),Image.Resampling.LANCZOS),(20+col*590,y+45));d.text((25+col*590,y+620),title,font=font(22),fill='#172c4c')
y=2915;d.text((30,y),'ACTUAL LOCK-ON COMBAT CAMERA | full experimental mesh',font=font(25),fill='#172c4c')
for col,(scenario,frame) in enumerate([('ground','052'),('flight','448')]):
 shot=ImageOps.contain(Image.open(r/'combat-13'/f'after-{scenario}-{frame}-atk.png').convert('RGB'),(860,605));im.paste(shot,(30+col*890,y+48))
for i,line in enumerate(['39 bones / 14 clips retained. Closed new topology; runtime tests pass; visual approval does not.', 'The high swoop remains poorly framed. Camera code was not changed.', 'No publication. Private live Site remains on v7. Experimental editable source is saved separately.', 'Next: reshape the torso-to-socket transition; compare ordinary and extreme poses before rebaking.']):d.text((30,3630+i*65),line,font=font(24),fill='#922e27' if i==0 else '#172c4c')
im.save(r/'SkyDrake-checkpoint-13-comparison.png');print(r/'SkyDrake-checkpoint-13-comparison.png')
