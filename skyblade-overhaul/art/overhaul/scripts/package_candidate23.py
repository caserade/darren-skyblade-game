from pathlib import Path
import json,hashlib,zipfile
from PIL import Image,ImageDraw,ImageFont
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
root=Path(__file__).resolve().parents[3]; art=root/'art/overhaul'; review=art/'skydrake23/review'; release=art/'final-local-candidate23/release'; out=root.parent
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
assert json.loads((review/'color-contract-23.json').read_text())['passed']
assert json.loads((review/'source-sync-23.json').read_text())['passed']
assert json.loads((review/'release-package-tests-23.json').read_text())['passed']
assert json.loads((review/'realtime-smoke-23.json').read_text())['passed']
assert json.loads((review/'combat-23/combat-review.json').read_text())['passed']
m=json.loads((release/'manifest.json').read_text());old=json.loads((art/'final-local-candidate22/release/manifest.json').read_text());delta=[p for p,h in m['files'].items() if old['files'][p]!=h];assert delta==['dist/assets/skydrake-rc15.glb']
assert len(m['files'])==46 and all(sha(release/p)==h for p,h in m['files'].items())
board=Image.new('RGB',(1600,2040),'#13232f');d=ImageDraw.Draw(board);font=lambda n:ImageFont.truetype('C:/Windows/Fonts/arial.ttf',n)
d.text((22,20),'SKYDRAKE23 / SHOULDER COLOR REPAIR',font=font(32),fill='white');d.text((22,68),'Candidate22 before / Candidate23 after. Matched poses, camera and lighting.',font=font(22),fill='#b8d2df')
inputs=[]
for j,t in enumerate(['CANDIDATE22','CANDIDATE23']):d.text((j*800+20,112),t,font=font(26),fill='#efd38a')
for row,(a,b,label) in enumerate([('diagnose-idle-original.png','trial-idle-original.png','Idle shoulder close-up'),('opposite-before-attack-original.png','opposite-after-attack-original.png','Opposite side during attack'),('combat-23/before-ground-048-atk.png','combat-23/after-ground-048-atk.png','Existing gameplay; controlled ground attack fixture')]):
 y=155+row*610;d.text((22,y),label,font=font(22),fill='white')
 for j,n in enumerate([a,b]):
  p=review/n;inputs.append({'path':p.relative_to(root).as_posix(),'sha256':sha(p)});im=Image.open(p);im.thumbnail((776,560));board.paste(im,(j*800+(800-im.width)//2,y+36))
d.text((22,2002),'No mesh, normal map, rig, animation, gameplay or save changes. Shoulder softness remains.',font=font(21),fill='#b8d2df')
bp=review/'SkyDrake23-before-after.png';board.save(bp)
(review/'visual-acceptance-23.json').write_text(json.dumps({'accepted':True,'reason':'Pale shoulder blotches reduced in matched idle/attack views from both sides and production gameplay; pale ventral plates retained. Some soft surface transition remains.','inspected':['diagnose-idle-original.png','diagnose-idle-albedo.png','diagnose-idle-clay.png','trial-idle-original.png','trial-idle-albedo.png','trial-attack-original.png','trial-attack-albedo.png','opposite-after-idle-original.png','opposite-after-attack-original.png','combat-23/before-ground-048-atk.png','combat-23/after-ground-048-atk.png','combat-23/after-flight-420-atk.png'],'boardSources':inputs,'reference':'art/references/concept_skydrake.jpg','referenceSha256':sha(root/'art/references/concept_skydrake.jpg')},indent=2))
handoff='''Darren: Skyblade Hunt - accepted local Candidate23

Decision: accept the bounded shoulder-color repair, then stop automated art edits.
Candidate22 remains the rollback. Publication is held. No Site changes were made.
This is an incremental repair; the creatures do not fully match the supplied art.

Diagnosis and repair
The pale shoulder blotches persisted in unlit albedo and disappeared in clay.
They were baked color contamination, not a reason to repeat skin-weight trials.
An object-space feathered mask corrects two existing color maps. The chest plates
and all decoded pixels outside the local mask/gutters are preserved exactly.
All 1,239 GLB accessors, 14 clips and every non-color buffer view are byte-identical.
The lossless PNG maps add 819,076 bytes (about 0.78 MiB); no FPS benefit is claimed.
Blender 5.2.2 LTS saved and reopened the editable source with exact packed images
and unchanged weights. The original Candidate22 source/export were not modified.

Verification of Candidate23
250 runtime/repair checks in fresh desktop and touch-emulated profiles passed.
Four deterministic ground/flight combat runs passed 16 checks; 132 captures saved.
Eight normal-frame keyboard/movement/pause/resume checks passed.
The 46-file release manifest is exact; only the SkyDrake GLB changed vs Candidate22.
This is not a physical-controller/phone test, full playthrough or GPU benchmark.
Candidate22's larger recovery/soak/deformation suite remains baseline evidence;
it was not rerun or counted as fresh Candidate23 coverage.

Concrete authored-art handoff
SkyDrake: white eye globes protrude beyond the lids; muzzle/eyelid contours remain
rounder and less angular than the turnaround. Membranes are thin planar panels,
and the tail is straighter/more horizontal. Elbow/hip compression and the soft
shoulder material transition remain. Fixing those requires deliberate surface
and joint-loop edits plus a consistent color/normal bake, followed by pose review.
The full-resolution Candidate22 A/B/C experiments are rejected; do not promote
them or repeat broad weight diffusion. Use accepted full-resolution SkyDrake15.
Chomp19: broad muzzle/forehead, wrinkles and tooth spacing remain approximate.
Stormbelly20: eye expression, lower jaw/lip and surface grooves remain approximate.

Blender is installed and sufficient for all of that work; no missing tool or
missing reference blocks it. The remaining constraint is authored shape quality
and validation, not approval. No new character design decision is needed: the
supplied turnarounds remain the target. Recommended next separate art session:
manually reshape SkyDrake's eye sockets/lids and muzzle against front/side views,
accept those silhouettes early, then address joint topology and rebake. Preserve
the rig/clip contract and retest all 14 clips before replacing the playable asset.
Do not combine that larger sculpt with another blind weight/texture sweep.

Editable sources, relative to skyblade-current
art/overhaul/skydrake23/source/skydrake-lod.blend (accepted reduced texture repair)
art/overhaul/skydrake15/source/skydrake-candidate.blend (accepted full-resolution)
art/overhaul/chomp19/source/chomprex-candidate.blend and chomprex-lod.blend
art/overhaul/stormbelly20/source/heavyweight-candidate.blend and heavyweight-lod.blend
art/references/ (original supplied turnarounds; present, not invented)
art/overhaul/skydrake23/review/SkyDrake23-before-after.png (current repair)
art/overhaul/skydrake22/review/boards/SkyDrake22-reference-comparison.png
  (unchanged silhouette defects; its shoulder color predates Candidate23)

Local play: extract this ZIP into a new folder, run node serve.cjs with Node.js
installed, then open http://127.0.0.1:4330/ in a separate browser profile for saves.
The server binds only locally; stop with Ctrl+C. Do not open index.html directly.
Existing live URL: https://darren-skyblade-reach.gosplekaiju.chatgpt.site
Exact project: appgprj_6acf0e7886908191820064ec6fa5afa0. No publication in this pass.
'''
(review/'HANDOFF-23.txt').write_text(handoff)
pdf=out/'Skyblade-Candidate23-Report.pdf';c=canvas.Canvas(str(pdf),pagesize=(612,792));c.setTitle('Skyblade Candidate23 - texture repair and authored-art handoff')
lines=handoff.splitlines()
split=lines.index('Concrete authored-art handoff')
for chunk in [lines[:split],lines[split:]]:
 c.setFont('Helvetica',9);t=c.beginText(30,760);t.setLeading(12)
 for line in chunk:t.textLine(line)
 c.drawText(t);c.showPage()
for path in [bp,art/'skydrake22/review/boards/SkyDrake22-reference-comparison.png']:
 im=Image.open(path);w,h=im.size;s=min(572/w,752/h);c.drawImage(ImageReader(im),(612-w*s)/2,(792-h*s)/2,w*s,h*s);c.showPage()
c.save()
receipt={'passed':True,'baselineCommit':'6b81733468018f58605379038f97a361a9180944','manifestSha256':sha(release/'manifest.json'),'assetSha256':sha(release/'dist/assets/skydrake-rc15.glb'),'changedFiles':delta,'freshChecks':274,'publication':'held; no write','reportSha256':sha(pdf)}
(review/'final-verification-23.json').write_text(json.dumps(receipt,indent=2))
zpath=out/'Skyblade-Final-Local-Candidate23.zip';launcher=(art/'scripts/serve_final_candidate23.cjs').read_text().replace("'../final-local-candidate23/release/dist'","'dist'")
with zipfile.ZipFile(zpath,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for p in sorted(release.rglob('*')):
  if p.is_file():z.write(p,p.relative_to(release).as_posix())
 z.writestr('serve.cjs',launcher);z.writestr('README.txt',handoff);z.write(pdf,pdf.name)
 for n in ['SkyDrake23-before-after.png','color-contract-23.json','color-repair-23.json','source-sync-23.json','visual-acceptance-23.json','release-package-tests-23.json','combat-23/combat-review.json','realtime-smoke-23.json','final-verification-23.json']:
  z.write(review/n,'review/'+n)
with zipfile.ZipFile(zpath) as z:assert all(hashlib.sha256(z.read(p)).hexdigest()==h for p,h in m['files'].items())
receipt['zipSha256']=sha(zpath);receipt['zip']=str(zpath);(out/'Skyblade-Final23-package-receipt.json').write_text(json.dumps(receipt,indent=2));print(json.dumps(receipt))

