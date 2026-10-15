"""Actual 60Hz game simulation: fixed crops, time labels, 10fps real-time replays."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import json
p=Path(__file__).resolve().parents[1]/'heavyweight/review'
font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',24)
small=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',19)
board=Image.new('RGB',(1880,1900),'#eee9df');d=ImageDraw.Draw(board)
d.text((25,20),'STORMBELLY | CHECKPOINT 08 - ACTUAL GAME PURSUIT',font=font,fill='#18374a')
d.text((25,58),'Same 1.65 m/s movement. Existing 33 bones / 13 clips. Full and reduced meshes tested in isolated profiles.',font=small,fill='#34505e')
rows=[('Checkpoint 07 - foot glide','gait-07',[0,30,60,90]),('Checkpoint 08 - distance-matched planted steps','gait-08/candidate-straight',[0,30,60,90]),('Stop, settle, idle, resume','gait-08/candidate-stop-resume',[60,72,90,126]),('Two pursuit turns at unchanged gameplay turning speed','gait-08/candidate-turn',[60,90,120,150])]
for row,(title,folder,frames) in enumerate(rows):
 y=110+row*405;d.text((25,y),title,font=font,fill='#18374a')
 for col,frame in enumerate(frames):
  im=Image.open(p/folder/f'game-gait-{frame:03}.png').convert('RGB').crop((430,260,990,710)).resize((450,350))
  board.paste(im,(20+col*465,y+38));d.text((30+col*465,y+45),f'{frame/60:.2f} s',font=small,fill='#ffffff')
d.text((25,1745),'Straight planted claw p95 <0.000002 m/s; both turn scenarios remain below that threshold.',font=small,fill='#18374a')
d.text((25,1780),'Near-ground swing samples still move; the planted-contact metric does not pretend otherwise.',font=small,fill='#34505e')
d.text((25,1815),'All sampled game vertices stay above the floor. 3-second scenarios at 60Hz; screenshots every 0.1s.',font=small,fill='#34505e')
d.text((25,1850),'No full-playthrough, physical-controller, phone or hardware-FPS claim. Local candidate; private live v7 unchanged.',font=small,fill='#34505e')
board.save(p/'Skyblade-Stormbelly-gait-comparison-08.png')
reference_board=Image.open(p/'Skyblade-Stormbelly-comparison-08.png').convert('RGB')
combined=Image.new('RGB',(1880,reference_board.height+board.height),'#eee9df')
combined.paste(reference_board,(0,0));combined.paste(board,(0,reference_board.height))
combined.save(p/'Skyblade-Stormbelly-review-08.png')
for scenario in ['straight','stop-resume','turn','stationary-turn']:
 frames=[]
 for frame in range(0,180,6):
  im=Image.open(p/'gait-08'/('candidate-'+scenario)/f'game-gait-{frame:03}.png').convert('RGB').resize((896,630))
  dr=ImageDraw.Draw(im);dr.rectangle((0,0,896,36),fill='#18374a');dr.text((12,6),f'{scenario} | actual game time {frame/60:.1f}s | 1.65 m/s chase speed',font=small,fill='white');frames.append(im)
 frames[0].save(p/f'Stormbelly-{scenario}-08.gif',save_all=True,append_images=frames[1:],duration=100,loop=0,optimize=False)
print('Saved gait comparison and four 3-second, 10fps timing-calibrated replays.')
