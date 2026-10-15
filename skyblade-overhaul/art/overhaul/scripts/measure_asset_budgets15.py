from pathlib import Path
import json,struct,hashlib,io
from PIL import Image
root=Path(__file__).resolve().parents[1];rows=[]
for creature,folder,stem in [('Chomp Rex','chomprex','chomprex'),('Stormbelly','heavyweight','heavyweight'),('SkyDrake','skydrake15','skydrake')]:
 for variant in ['candidate','lod']:
  p=root/folder/'export'/(stem+'-'+variant+'.glb');raw=p.read_bytes();n=struct.unpack_from('<I',raw,12)[0];g=json.loads(raw[20:20+n]);buf=raw[28+n:];pr=[p for m in g['meshes'] for p in m['primitives']];images=[]
  for im in g.get('images',[]):
   bv=g['bufferViews'][im['bufferView']];data=buf[bv.get('byteOffset',0):bv.get('byteOffset',0)+bv['byteLength']];image=Image.open(io.BytesIO(data));images.append({'size':list(image.size),'encoding':image.format,'bytes':len(data),'decodedRgbaBytes':image.width*image.height*4})
  rows.append({'creature':creature,'variant':variant,'file':str(p.relative_to(root.parent.parent)),'sha256':hashlib.sha256(raw).hexdigest(),'bytes':len(raw),'triangles':sum(g['accessors'][p['indices']]['count']//3 for p in pr),'drawPrimitives':len(pr),'bones':len(g['skins'][0]['joints']),'clips':len(g['animations']),'images':images,'decodedRgbaBytes':sum(i['decodedRgbaBytes'] for i in images)})
report={'assets':rows,'totals':{v:{'triangles':sum(r['triangles'] for r in rows if r['variant']==v),'bytes':sum(r['bytes'] for r in rows if r['variant']==v),'drawPrimitives':sum(r['drawPrimitives'] for r in rows if r['variant']==v),'decodedRgbaBytes':sum(r['decodedRgbaBytes'] for r in rows if r['variant']==v)} for v in ['candidate','lod']},'scope':'Per-character GLB asset budgets. Draw primitives exclude shadows and world/UI passes; decoded RGBA estimate excludes mipmaps, driver copies and retained fallback assets. Not a hardware GPU/FPS measurement.'};(root/'skydrake15/review/asset-budgets-15.json').write_text(json.dumps(report,indent=2));print(json.dumps(report['totals']))
