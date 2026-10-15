from pathlib import Path
from PIL import Image,ImageDraw,ImageFont,ImageOps
root=Path(__file__).resolve().parents[3];r=root/'art/overhaul/skydrake14/review'
font=lambda n:ImageFont.truetype('C:/Windows/Fonts/arial.ttf',n)
im=Image.new('RGB',(1800,2400),'#f5f1e9');d=ImageDraw.Draw(im)
d.text((25,20),'Skyblade checkpoint 14 | HIGH-FLIGHT CAMERA',font=font(36),fill='#172c4c')
d.text((25,75),'Same final mesh, scene, gameplay updates and frame. Local camera overlay only.',font=font(25),fill='#172c4c')
for col,kind in enumerate(['before','after']):
 d.text((25+col*900,130),'EXISTING CAMERA' if col==0 else 'ELEVATED LOCK FRAMING',font=font(25),fill='#172c4c')
 shot=ImageOps.contain(Image.open(r/'camera-14'/f'candidate-landscape-{kind}-300.png').convert('RGB'),(875,616));im.paste(shot,(15+col*900,175))
for col,kind in enumerate(['before','after']):
 shot=ImageOps.contain(Image.open(r/'camera-14'/f'candidate-portrait-{kind}-420.png').convert('RGB'),(580,1044));im.paste(shot,(160+col*900,825))
for i,line in enumerate(['Full + reduced, landscape + portrait: 41/41 elevated samples contain both meshes.', 'Existing camera contains the full dragon in 0/41 elevated samples; Darren remains in view.', 'Actual skinned vertices sampled every 10 frames through one controlled 10-second flight cycle.', 'Pause / dialogue / orbit input / unlock / death / landing / synthetic obstacle checks pass.', 'Camera does not change sampled encounter paths, player health or save storage.', 'Limits: small takeoff/ground framing crop remains; no physical phone/controller or full playthrough.', 'No publication. Separate local preview: ?cast=1&camera=1 (add &variant=full for full meshes).']):
 d.text((25,1920+i*60),line,font=font(24),fill='#172c4c')
im.save(r/'Skyblade-camera-14-comparison.png')
im=Image.new('RGB',(1800,2350),'#f5f1e9');d=ImageDraw.Draw(im)
d.text((25,20),'Skyblade checkpoint 14 | INTEGRATED CAST REVIEW',font=font(36),fill='#172c4c')
d.text((25,75),'Chomp 05 + Stormbelly 08 + SkyDrake 14 + existing Darren. Existing game scales.',font=font(25),fill='#172c4c')
for row,pose in enumerate(['idle','walk','stagger']):
 for col,variant in enumerate(['candidate','lod']):
  y=130+row*660;d.text((25+col*900,y),('FULL' if col==0 else 'REDUCED STORMBELLY / SKYDRAKE')+' | '+pose.upper(),font=font(23),fill='#172c4c')
  shot=ImageOps.contain(Image.open(r/'cast-14'/f'{variant}-{pose}.png').convert('RGB'),(875,547));im.paste(shot,(15+col*900,y+45))
for i,line in enumerate(['Inspection camera and posed lineup; no new encounter placement is saved.', 'Separate six-second runtime runs reach warning / attack / recovery for all three creatures.', 'Four recreate cycles keep resource counts stable. Existing roster and save storage remain unchanged.', 'Chomp and Stormbelly files are unchanged. Detail and exact reference likeness remain approximations.']):d.text((25,2130+i*48),line,font=font(23),fill='#172c4c')
im.save(r/'Skyblade-cast-14-comparison.png')
