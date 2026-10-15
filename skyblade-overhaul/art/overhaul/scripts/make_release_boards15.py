from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import json,hashlib,textwrap
root=Path(__file__).resolve().parents[3];review=root/'art/overhaul/skydrake15/review';out=review/'boards';out.mkdir(exist_ok=True)
fonts={n:ImageFont.truetype('C:/Windows/Fonts/segoeui.ttf',n) for n in [22,26,32,48]}
budgets=json.loads((review/'asset-budgets-15.json').read_text());receipts=[]
for key,title,ref,notes in [
 ('chomprex','Chomp Rex','concept_chomprex.jpg','Accepted checkpoint 05 mesh; no further shape changes in checkpoint 15. Plum/gold palette, grin, dark spines and heavy thighs follow supplied turnaround. Fine facial wrinkles and tooth spacing remain approximations.'),
 ('stormbelly','Stormbelly','concept_heavyweight.jpg','Accepted checkpoint 08 mesh; no further shape changes in checkpoint 15. Blue spotted body, pale broad belly, short wings and horn/tusk silhouette follow supplied turnaround. Belly grooves, muzzle and subtle surface detail remain approximations.'),
 ('skydrake','SkyDrake','concept_skydrake.jpg','Checkpoint 15 preserves accepted 14 shoulder repair and rest silhouette. Local hip/tail weights soften attack/flight creasing; full hip attack stretch 4.70x to 3.38x. Extreme poses still crease; neck/chest deformation and fine facial likeness remain limitations.')]:
 canvas=Image.new('RGB',(1800,3000),'#101d2b');d=ImageDraw.Draw(canvas);sources=[]
 def label(text,x,y,size=26,color='#e5edf7'):d.text((x,y),text,font=fonts[size],fill=color)
 def picture(p,box):
  image=Image.open(p).convert('RGB');image.thumbnail((box[2]-box[0],box[3]-box[1]),Image.Resampling.LANCZOS);canvas.paste(image,(box[0]+(box[2]-box[0]-image.width)//2,box[1]+(box[3]-box[1]-image.height)//2));sources.append({'file':str(p.relative_to(root)).replace('\\','/'),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
 label('SKYBLADE HUNT  /  '+title.upper(),36,22,48);label('Local release candidate 15  |  Existing content only  |  Not published',38,85,26,'#9bbbd8')
 label('SUPPLIED TURNAROUND — original reference pixels',38,135,26);picture(root/'art/references'/ref,(36,178,1764,855))
 before='Existing procedural model' if key!='skydrake' else 'Original supplied game GLB'
 for row,views in enumerate([['front','side'],['back','three-quarter']]):
  y=905+row*475
  for j,view in enumerate(views):
   for k,kind in enumerate(['before','after']):
    x=36+(j*2+k)*438;label(('BEFORE' if kind=='before' else 'RC15 REDUCED')+' / '+view,x,y,22)
    picture(review/'character-comparisons'/f'{key}-lod-{kind}-{view}.png',(x,y+38,x+414,y+452))
 label('BEFORE: '+before+'  |  Matched cameras, lighting and existing game scale.',38,1853,22,'#9bbbd8')
 label('ACTUAL GAMEPLAY / desktop',38,1900,26);label('PORTRAIT TOUCH EMULATION',1390,1900,22)
 frame='060' if key=='skydrake' else '420'
 picture(review/'gameplay-cast-15'/f'lod-desktop-{key}-{frame}.png',(36,1942,1356,2767));picture(review/'gameplay-cast-15'/f'lod-portrait-{key}-{frame}.png',(1390,1942,1764,2767))
 a=next(a for a in budgets['assets'] if a['creature']==title and a['variant']=='lod')
 label(f"Reduced mesh: {a['triangles']:,} triangles  |  {a['bytes']/1048576:.2f} MiB  |  SHA256 {a['sha256'][:16]}…",38,2795,26)
 for i,line in enumerate(textwrap.wrap(notes,134)):label(line,38,2840+i*30,22)
 label('Screenshots use isolated profiles and controlled encounters. No physical-device or full-playthrough claim.',38,2954,22,'#9bbbd8')
 p=out/f'Skyblade-RC15-{title.replace(" ","-")}-review.png';canvas.save(p);receipts.append({'file':str(p),'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'sources':sources,'notes':notes})
(out/'board-provenance.json').write_text(json.dumps(receipts,indent=2));print(json.dumps([{'file':x['file'],'sha256':x['sha256']} for x in receipts]))
