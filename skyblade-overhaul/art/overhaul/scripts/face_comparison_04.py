from PIL import Image,ImageDraw,ImageFont
from pathlib import Path
import numpy as np,json,runpy,contextlib,io
root=Path(__file__).resolve().parents[1];r=root/'chomprex/review';ref=Image.open(root.parent/'references/concept_chomprex.jpg').convert('RGB')
c=Image.new('RGB',(2100,2000),'#171923');d=ImageDraw.Draw(c);f=lambda n:ImageFont.truetype('C:/Windows/Fonts/arial.ttf',n)
d.text((25,20),'CHOMP REX / FOCUSED LIKENESS CHECKPOINT 04',font=f(34),fill='white')
for x,label in [(25,'SUPPLIED ART'),(725,'CHECKPOINT 03'),(1425,'CHECKPOINT 04')]:d.text((x,78),label,font=f(25),fill='#ffd188')
views=[('front',(12,138,305,390),(385,140,620,395)),('side',(330,140,650,395),(100,140,480,395)),('back',(950,138,1245,410),(385,140,620,420)),('three-quarter',(1440,140,1774,390),(490,160,790,475))]
for row,(name,rb,cb) in enumerate(views):
 y=125+row*440
 for col,im in enumerate([ref.crop(rb),Image.open(r/f'checkpoint03-{name}.png').crop(cb),Image.open(r/f'candidate-{name}.png').crop(cb)]):
  im=im.convert('RGB');factor=min(650/im.width,385/im.height);im=im.resize((round(im.width*factor),round(im.height*factor)),Image.Resampling.LANCZOS);c.paste(im,(col*700+(700-im.width)//2,y))
 d.text((25,y+392),name.upper(),font=f(22),fill='white')
d.text((25,1910),'Actual crops, uniform scaling only. Reference projection/pose differs. Review both shape and transitions.',font=f(23),fill='#ffd188')
c.save(r/'Skyblade-ChompRex-face-comparison-04.png')
with contextlib.redirect_stdout(io.StringIO()):m=runpy.run_path(str(root/'scripts/reference_overlay.py'))
metrics={}
for name,im,isref in [('reference',ref.crop((10,135,310,760)),True),('checkpoint03',Image.open(r/'checkpoint03-front.png').convert('RGB'),False),('checkpoint04',Image.open(r/'candidate-front.png').convert('RGB'),False)]:
 a=np.array(m['cut'](im,isref)[1])>0;h,w=a.shape;profile={}
 for frac in [.28,.30,.32,.34,.36,.38,.40,.42,.44,.46]:
  xs=np.where(a[round(frac*(h-1))])[0];profile[str(frac)]=round((xs[-1]-xs[0])/h,3)
 pixels=np.array(im);mask=(pixels[:,:,0]>pixels[:,:,1]*1.25)&(pixels[:,:,2]>pixels[:,:,1]*1.1)&(pixels[:,:,0]>70)&(pixels[:,:,0]<210)&(pixels[:,:,1]>30)
 metrics[name]={'normalized_front_width_profile':profile,'heuristic_plum_median_rgb':np.median(pixels[mask],axis=0).tolist()}
metrics['limitations']='Width profiles depend on reference pose/projection. Color masks are heuristic and lighting differs; neither is a likeness score.'
(r/'visual-metrics-04.json').write_text(json.dumps(metrics,indent=2));print(json.dumps(metrics,indent=2))
