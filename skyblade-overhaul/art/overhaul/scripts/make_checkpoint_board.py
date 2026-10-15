from PIL import Image,ImageDraw,ImageFont
from pathlib import Path
root=Path(__file__).resolve().parents[1];review=root/'chomprex/review'
canvas=Image.new('RGB',(2000,1590),'#171923');d=ImageDraw.Draw(canvas)
def font(n):return ImageFont.truetype('C:/Windows/Fonts/arial.ttf',n)
def txt(pos,s,n=26,c='#ececf0'):d.text(pos,s,font=font(n),fill=c)
txt((35,22),'CHOMP REX / MESH OVERHAUL CHECKPOINT 01',38)
txt((35,73),'WORK IN PROGRESS  |  Actual supplied reference and Blender renders  |  Live v7 unchanged',25,'#ffc875')
ref=Image.open(root.parent/'references/concept_chomprex.jpg').convert('RGB');ref.thumbnail((1930,600));canvas.paste(ref,((2000-ref.width)//2,120))
txt((35,740),'Supplied concept above. Current geometry review below: front / side / back / three-quarter.',26)
for i,name in enumerate(['front','side','back','three-quarter']):
 im=Image.open(review/('geometry-'+name+'.png')).convert('RGB');im.thumbnail((475,475));canvas.paste(im,(35+i*490,790));txt((35+i*490,1278),name.upper(),23)
txt((35,1335),'Completed this checkpoint: editable Blender mesh rebuild, articulated jaw, teeth, eye/nostril cavities.',25)
txt((35,1373),'Retained source: 29-bone rig and 12 clips. New mesh animation/deformation validation is still pending.',25)
txt((35,1411),'Remaining: expression/jaw/plates, UV textures, deformation cleanup, final GLB and engine tests.',25)
txt((35,1460),'Different reference lighting and poses; this is a progress comparison, not a final visual-match claim.',23,'#ffc875')
canvas.save(review/'Skyblade-ChompRex-overhaul-checkpoint-01.png')
