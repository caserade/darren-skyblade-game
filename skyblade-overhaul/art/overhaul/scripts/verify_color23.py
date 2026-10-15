from skydrake_glb22 import GLB,ROOT
import json,copy,hashlib,shutil
before=GLB(ROOT/'skydrake22/export/skydrake-lod.glb');after=GLB(ROOT/'skydrake23/export/skydrake-lod.glb')
changed=[]
for i,(a,b) in enumerate(zip(before.g['bufferViews'],after.g['bufferViews'])):
 aa=before.raw[before.offset+a.get('byteOffset',0):before.offset+a.get('byteOffset',0)+a['byteLength']];bb=after.raw[after.offset+b.get('byteOffset',0):after.offset+b.get('byteOffset',0)+b['byteLength']]
 if aa!=bb:changed.append(i)
expected=[before.g['images'][before.g['textures'][m['pbrMetallicRoughness']['baseColorTexture']['index']]['source']]['bufferView'] for m in before.g['materials'] if m['name'] in ['skydrake_skin','SkyDrake shoulder retopology']]
assert sorted(changed)==sorted(expected)
def normalized(g):
 g=copy.deepcopy(g);g['buffers'][0].pop('byteLength')
 for v in g['bufferViews']:v.pop('byteOffset',None);v.pop('byteLength')
 for im in g['images']:im.pop('mimeType',None)
 return g
assert normalized(before.g)==normalized(after.g)
assert all((before.accessor(i)==after.accessor(i)).all() for i in range(len(before.g['accessors'])))
r={'passed':True,'changedBufferViews':changed,'onlyBaseColorImagesChanged':True,'allAccessorsExact':len(before.g['accessors']),'allOtherMetadataExact':True,'clipsUnchanged':len(before.g['animations']),'baselineSha256':before.sha(),'assetSha256':after.sha(),'bytesBefore':len(before.raw),'bytesAfter':len(after.raw)}
(ROOT/'skydrake23/review/color-contract-23.json').write_text(json.dumps(r,indent=2));print(json.dumps(r))
release=ROOT/'final-local-candidate23/release';shutil.copytree(ROOT/'final-local-candidate22/release',release,dirs_exist_ok=True);shutil.copy2(ROOT/'skydrake23/export/skydrake-lod.glb',release/'dist/assets/skydrake-rc15.glb')
m=json.loads((release/'manifest.json').read_text());m['status']='FINAL LOCAL CANDIDATE23; publication held; art remains approximate';m['base_app_commit']='6b81733468018f58605379038f97a361a9180944';m['variant']='Candidate22 plus local SkyDrake shoulder color correction';m['files']['dist/assets/skydrake-rc15.glb']=after.sha()
for key in list(m['accepted_assets']):
 if key.startswith('SkyDrake'):
  del m['accepted_assets'][key];m['accepted_assets']['SkyDrake23']={'source':'art/overhaul/skydrake23/export/skydrake-lod.glb','sha256':after.sha()}
(release/'manifest.json').write_text(json.dumps(m,indent=2))
assert all(hashlib.sha256((release/p).read_bytes()).hexdigest()==h for p,h in m['files'].items())
