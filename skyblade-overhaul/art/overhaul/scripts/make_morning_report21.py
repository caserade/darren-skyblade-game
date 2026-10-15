from pathlib import Path
import json
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
from reportlab.lib.colors import HexColor
root=Path(__file__).resolve().parents[3]; review=root/'art/overhaul/hud21/review'; v=json.loads((review/'final-verification-21.json').read_text()); assert v['passed']
out=root.parent/'Skyblade-Morning-Report21.pdf'; c=canvas.Canvas(str(out),pagesize=(612,792));c.setTitle('Darren: Skyblade Hunt - Candidate21 morning report')
def line(y,text,size=10,color='#263c4b'):
 c.setFillColor(HexColor(color));c.setFont('Helvetica',size);c.drawString(36,y,text)
line(750,'Darren: Skyblade Hunt',23);line(725,'Candidate21 | Final local repair package | 15 October 2026',12)
blocks=[('Verified repairs',[
'Landscape HUD separates status, targets, objectives and every existing touch action.',
'Safe-area offsets, 44px minimum buttons, scrollable long objectives, compact portrait.',
'Music/Pause receive taps; Hangar close fits at 320px. Resize releases held input',
'and resets the joystick. Keyboard, touch and gamepad hints follow active input.']),
('Preserved baseline',[
'Candidate20 accepted art: Chomp19, Stormbelly20 and SkyDrake15, byte-for-byte.',
'Only index.html, responsive-ui21.css and src/core.js differ from Candidate20.',
'Existing engine, content, save schema, project identity and private audience retained.',
'Candidate20 and earlier rollback archives remain intact. No hosting changes.']),
('Final-byte verification',[
'250 gameplay/repair checks; 340 repeated-flow checks; 320 startup/recovery checks.',
'243 resize/menu/input checks; 108 screenshots across 9 viewport configurations.',
'36 combat layout cases pass bounds, overlap, hit-target and resource-label checks.',
'All tests bind the 46-file manifest. The three boards include source-image hashes.']),
('Launch the included playable package',[
'1. Extract Skyblade-Final-Local-Candidate21.zip into a new folder.',
'2. With Node.js installed, open a terminal in that folder and run: node serve.cjs',
'3. Open http://127.0.0.1:4328/ in a separate browser profile for isolated saves.',
'Stop with Ctrl+C. Do not open index.html directly. Launcher is computer-local.']),
('Limits and publication',[
'Browser viewport/touch and CSS safe-area emulation; synthetic Gamepad API only.',
'No physical phone/controller, full-playthrough or performance benchmark claim.',
'Art remains approximate: facial proportions, eyes and jaw joins still differ from art.',
'Publication is held by instruction. Existing live Site has not received Candidate21.',
'Live: https://darren-skyblade-reach.gosplekaiju.chatgpt.site']),
('Exact source',[
'Base commit: '+v['baseCommit'],
'Source: art/overhaul/final-local-candidate21/release',
'Manifest SHA-256:',v['manifestSha256'],
'Final commit, ZIP hash and portable-launch result are in the checkpoint receipt.'])]
y=690
for title,lines in blocks:
 line(y,title,12);y-=18
 for t in lines:line(y,t,9);y-=13
 y-=13
c.showPage()
for title,name in [('Responsive HUD: Candidate20 / Candidate21','Skyblade21-HUD-before-after.png'),('Accepted Chomp19: reference / prior / accepted','Skyblade21-accepted-Chomp-before-after.png'),('Accepted Stormbelly20: reference / prior / accepted','Skyblade21-accepted-Stormbelly-before-after.png')]:
 line(758,title,13);im=ImageReader(str(review/'boards'/name));w,h=im.getSize();scale=min(560/w,700/h);c.drawImage(im,(612-w*scale)/2,30+(700-h*scale)/2,width=w*scale,height=h*scale);c.showPage()
c.save();print(out)
