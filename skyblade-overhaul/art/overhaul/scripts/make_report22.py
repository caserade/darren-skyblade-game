from pathlib import Path
import json
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from reportlab.lib.colors import HexColor
root=Path(__file__).resolve().parents[3];review=root/'art/overhaul/skydrake22/review';v=json.loads((review/'final-verification-22.json').read_text());assert v['passed'];out=root.parent/'Skyblade-Candidate22-Report.pdf';c=canvas.Canvas(str(out),pagesize=(612,792));c.setTitle('Skyblade Hunt - SkyDrake22 repair checkpoint')
def line(y,text,size=9):c.setFillColor(HexColor('#233c4b'));c.setFont('Helvetica',size);c.drawString(32,y,text)
line(756,'Skyblade Hunt / SkyDrake22',22);line(733,'Verified reduced-mesh repair; Candidate21 remains the rollback package.',11)
blocks=[('What improved',[
'Localized neck, chest and shoulder skin weights reduce pinching during existing clips.',
'Playable attack-region peak edge stretch: 4.18x to 1.95x; neck: 2.86x to 1.67x.',
'All 14 playable clips improve local maximum, neck maximum and local P99 stretch.',
'No increase in peak counts of triangles compressed below 10% of their rest area.',
'This is improved deformation, not perfect likeness or an absence of all creasing.']),
('What is preserved',[
'Only dist/assets/skydrake-rc15.glb differs from Candidate21 in the 46-file package.',
'Only joint/weight accessor bytes change inside the localized body/shoulder mask.',
'Rest geometry, normals, UVs, textures, 39 bones and 14 clips are byte-identical.',
'Chomp19, Stormbelly20, gameplay, HUD, controls, save keys and hosting identity remain.']),
('Verification',[
'Exact package: 250 gameplay/repair, 340 repeated-flow and 320 startup/recovery checks.',
'Normal frame-loop keyboard/pause/resume smoke: 8 checks. Portable launch checked separately.',
'18 gait scenarios / 162 checks and 6 combat runs / 24 checks include both trial variants.',
'1,148 after-pose samples, 1,148 baseline samples; 198 matched gameplay screenshots.',
'Editable reduced Blender source reopens with packed images and matching weights.']),
('Rejected full-resolution trial',[
'Full trial A adds one compressed stagger triangle (peak 2 versus 1 baseline).',
'Full trial C adds a compressed turn triangle. Neither is promoted as accepted full art.',
'The playable reduced mesh uses trial C; accepted high-resolution fallback remains SkyDrake15.',
'Unaccepted full files and metrics are clearly retained as experiments, not package assets.']),
('Remaining art work and practical limit',[
'SkyDrake: eye whites/eyelids, muzzle, wing/tail profiles, texture seams and extreme hip creases.',
'Chomp: rounded muzzle/forehead, wrinkles and tooth spacing still approximate the supplied art.',
'Stormbelly: eye expression, lower jaw/lip shape and surface grooves remain approximate.',
'A sculptor-led silhouette/face pass, joint-aware retopology and rebaked textures are the next',
'useful step. Further broad weight diffusion trades one pose defect for another.']),
('Run / delivery',[
'Extract Skyblade-Final-Local-Candidate22.zip; with Node.js installed run: node serve.cjs',
'Open http://127.0.0.1:4329/ in a separate browser profile. Stop with Ctrl+C.',
'Publication remains held. No physical phone/controller, full playthrough or FPS claim.',
'Library helper was unavailable at checkpoint21; no bypass or unchanged retry in this pass.']),
('Exact identity',[
'Base commit: '+v['baseCommit'],
'Source: art/overhaul/final-local-candidate22/release',
'Manifest SHA-256: '+v['manifestSha256'],
'Final commit, ZIP hash and portable launch result: Skyblade-checkpoint22-receipt.json.'])]
y=704
for title,lines in blocks:
 line(y,title,11);y-=16
 for t in lines:line(y,t,8.5);y-=12
 y-=9
c.showPage()
for title,name in [('Deformation before / after','SkyDrake22-deformation-before-after.png'),('Supplied reference / preserved silhouette','SkyDrake22-reference-comparison.png'),('Existing gameplay / normal frame loop','SkyDrake22-gameplay-comparison.png')]:
 line(758,title,13);im=ImageReader(str(review/'boards'/name));w,h=im.getSize();scale=min(568/w,706/h);c.drawImage(im,(612-w*scale)/2,28+(706-h*scale)/2,width=w*scale,height=h*scale);c.showPage()
c.save();print(out)
