from PIL import Image,ImageDraw,ImageFont,ImageOps
from pathlib import Path
import numpy as np,json
root=Path(__file__).resolve().parents[3];out=root/'art/overhaul/heavyweight/review';src=out/'comparison-08'
ref=Image.open(root/'art/references/concept_heavyweight.jpg').convert('RGB');a=np.array(ref);mask=(a[:,:,0]<220)&(np.indices(a.shape[:2])[0]>125)&(np.indices(a.shape[:2])[0]<760)
items=[]
for seed in [(220,450),(610,450),(1080,450),(1540,450)]:
 flood=Image.fromarray((mask*255).astype('uint8')).copy();ImageDraw.floodfill(flood,seed,128);component=Image.fromarray((np.array(flood)==128).astype('uint8')*255);bbox=component.getbbox();assert bbox
 roi=component.crop(bbox);outside=ImageOps.expand(ImageOps.invert(roi),border=1,fill=255);ImageDraw.floodfill(outside,(0,0),128);holes=np.array(outside)[1:-1,1:-1]==255
 filled=np.maximum(np.array(roi),holes.astype('uint8')*255);cut=ref.crop(bbox).convert('RGBA');cut.putalpha(Image.fromarray(filled));items.append((bbox[0],cut,bbox))
items.sort(key=lambda q:q[0]);assert len(items)==4
font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',28);small=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',20);tiny=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',17)
board=Image.new('RGB',(1880,2150),'#eee9df');d=ImageDraw.Draw(board);d.text((30,22),'STORMBELLY / HEAVYWEIGHT | CHECKPOINT 08',font=font,fill='#18374a')
d.text((30,65),'Actual supplied turnaround pixels, private-v7 model, checkpoint 07 and current local candidate.',font=small,fill='#34505e')
for j,view in enumerate(['FRONT','SIDE','BACK','THREE-QUARTER']):d.text((j*460+160,108),view,font=small,fill='#18374a')
rows=[('SUPPLIED REFERENCE',150),('EXISTING GAME MODEL — PRIVATE v7',610),('CHECKPOINT 07 — PREVIOUS LOCAL CANDIDATE',1110),('CHECKPOINT 08 — CURRENT LOCAL CANDIDATE',1610)]
for title,y in rows:d.text((24,y),title,font=small,fill='#18374a')
for j,(x,im,bbox) in enumerate(items):
 im.thumbnail((420,308));board.paste(im,(j*460+30+(420-im.width)//2,190+(400-im.height)//2),im)
for kind,y,folder in [('before',650,src),('after',1150,out/'comparison-07'),('after',1650,src)]:
 for j,view in enumerate(['front','side','back','three-quarter']):
  im=Image.open(folder/f'{kind}-{view}.png').convert('RGB');im=im.resize((440,440));board.paste(im,(j*460+20,y))
d.text((28,2115),'Identical review cameras and lights for game models. Local candidates are unpublished; fine sculpt and exact markings remain approximations.',font=tiny,fill='#34505e')
board.save(out/'Skyblade-Stormbelly-comparison-08.png');json.dump({'reference_component_bboxes':[list(map(int,q[2])) for q in items]},open(out/'comparison-reference-crops.json','w'),indent=2)
print(out/'Skyblade-Stormbelly-comparison-08.png')
