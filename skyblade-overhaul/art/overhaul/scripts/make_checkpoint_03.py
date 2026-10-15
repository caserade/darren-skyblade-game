from PIL import Image,ImageDraw,ImageFont
from pathlib import Path
import json
root=Path(__file__).resolve().parents[1];r=root/'chomprex/review'
c=Image.new('RGB',(2000,2250),'#171923');d=ImageDraw.Draw(c)
def f(n):return ImageFont.truetype('C:/Windows/Fonts/arial.ttf',n)
def t(x,y,s,n=25,col='#ececf0'):d.text((x,y),s,font=f(n),fill=col)
def paste(im,box):
 im=im.convert('RGB');im.thumbnail((box[2],box[3]));c.paste(im,(box[0]+(box[2]-im.width)//2,box[1]+(box[3]-im.height)//2))
t(35,22,'CHOMP REX / CHECKPOINT 03',40);t(35,78,'Production-integrated review candidate. Live private v7 unchanged.',27,'#ffc875')
t(35,128,'SUPPLIED TURNAROUND ART (cropped only to remove title/labels)',23)
paste(Image.open(root.parent/'references/concept_chomprex.jpg').crop((10,130,1774,760)),(35,167,1930,690))
t(35,880,'EXPORTED GLB / SAME ORTHOGRAPHIC SCALE / GAME-BUNDLED THREE.JS r128',23)
for i,n in enumerate(['front','side','back','three-quarter']):paste(Image.open(r/('candidate-'+n+'.png')),(25+i*495,927,475,475));t(35+i*495,1412,n.upper(),21)
t(35,1460,'EXISTING GAME MODEL',24);t(1025,1460,'LOCAL CANDIDATE / SAME CAMERA AND ARENA',24)
paste(Image.open(r/'game-before.png'),(35,1505,940,610));paste(Image.open(r/'game-after.png'),(1025,1505,940,610))
t(35,2130,'One skinned draw call. 12 retained clips. Production fallback/retry and interrupted-save coverage.',22)
t(35,2172,'Likeness review remains open. Supplied art is the authority; this is not an artist-final sculpt.',22,'#ffc875')
c.save(r/'Skyblade-ChompRex-overhaul-checkpoint-03.png')
frames=[Image.open(p).convert('RGB').resize((700,700),Image.Resampling.LANCZOS) for p in sorted((r/'turntable').glob('*.png'))]
frames[0].save(r/'ChompRex-candidate-turntable.gif',save_all=True,append_images=frames[1:],duration=140,loop=0,optimize=False)
# Readable current inventory, including exact bytes and clip durations.
rep=json.loads((r/'candidate-three-report.json').read_text());inventory={'status':'review candidate; unpublished','animations':[{'name':a['name'],'seconds':a['duration']} for a in rep['clips']],'files':{str(p.relative_to(root)):p.stat().st_size for folder in ['source','textures','export'] for p in (root/'chomprex'/folder).iterdir() if p.is_file() and p.suffix!='.blend1'}}
(r/'candidate-inventory.json').write_text(json.dumps(inventory,indent=2))
