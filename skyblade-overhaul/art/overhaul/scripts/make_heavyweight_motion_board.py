from PIL import Image,ImageDraw,ImageFont
from pathlib import Path
p=Path(__file__).resolve().parents[1]/'heavyweight/review';src=p/'motion-08'
font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',22);small=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',17)
board=Image.new('RGB',(1500,2020),'#eee9df');d=ImageDraw.Draw(board);d.text((25,20),'STORMBELLY | Existing actions on the rebuilt candidate',font=font,fill='#18374a')
for row,clip in enumerate(['stompWindup','stompImpact','stompRecovery','heavyWalk','stagger','death']):
 y=65+row*325;d.text((15,y),clip,font=font,fill='#18374a')
 for col,n in enumerate([0,25,50,75,100]):
  img=Image.open(src/f'{clip}-full-{n:03}.png').convert('RGB');img.thumbnail((290,290));board.paste(img,(col*300+5,y+27));d.text((col*300+12,y+32),str(n)+'%',font=small,fill='#18374a')
board.save(p/'Skyblade-Stormbelly-motion-checkpoint-08.png')
print(p/'Skyblade-Stormbelly-motion-checkpoint-08.png')
