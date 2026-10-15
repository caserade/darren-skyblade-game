from PIL import Image,ImageDraw,ImageFont
from pathlib import Path
import json
root=Path(__file__).resolve().parents[1];r=root/'chomprex/review';f=lambda n:ImageFont.truetype('C:/Windows/Fonts/arial.ttf',n)
c=Image.new('RGB',(2000,1450),'#171923');d=ImageDraw.Draw(c)
d.text((30,20),'CHOMP / DARK-SEAM ROOT CAUSE',font=f(34),fill='white')
d.text((30,74),'Same mesh, camera and lighting. Only UV atlas preparation changed in this isolation test.',font=f(24),fill='#ffd188')
for x,name,label in [(25,'before/default.png','CHECKPOINT 04'),(1025,'uv-only-repaired.png','UV REPAIR / GEOMETRY UNCHANGED')]:
 im=Image.open(r/'root-cause-05'/name);im.thumbnail((950,950));c.paste(im,(x,150));d.text((x,115),label,font=f(24),fill='white')
d.text((30,1130),'Ray samples: eye, shoulder, jaw and hand read RGBA [0,0,0,0] before.',font=f(27),fill='white')
d.text((30,1180),'After: the same points read valid plum/gold pixels. Flat-white and normal-only surfaces are clean.',font=f(25),fill='white')
d.text((30,1230),'Cause: 343 islands were under 2 pixels wide. The sampled dark triangles had no baked texels.',font=f(25),fill='white')
d.text((30,1280),'Fix: enlarge narrow islands before packing, bake stable triangles, and test atlas coverage per triangle.',font=f(25),fill='#ffd188')
d.text((30,1340),'The final candidate also changes smile geometry. See the separate final reference comparison.',font=f(25),fill='#ffd188')
c.save(r/'Skyblade-ChompRex-seam-repair-05.png')
meta=json.loads((r/'motion-05/motion-review.json').read_text())
c=Image.new('RGB',(1800,2480),'#171923');d=ImageDraw.Draw(c)
d.text((25,15),'CHOMP / FINAL CANDIDATE MOTION REVIEW',font=f(30),fill='white')
for i,s in enumerate(meta['shots']):
 col=i%5;row=i//5;x=col*360;y=80+row*390
 im=Image.open(r/'motion-05'/s['file']).resize((350,350),Image.Resampling.LANCZOS);c.paste(im,(x+5,y))
 d.text((x+8,y+352),s['clip']+' / '+str(round(s['fraction']*100))+'%',font=f(18),fill='#ffd188')
d.text((25,2440),'Rows: bite side; bite quarter; bite windup; charge windup side; stagger; death. Actual retained clips.',font=f(20),fill='white')
c.save(r/'Skyblade-ChompRex-motion-review-05.png')

