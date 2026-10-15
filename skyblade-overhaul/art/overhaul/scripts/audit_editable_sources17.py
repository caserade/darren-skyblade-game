"""Read-only Blender inspection of the six accepted editable runtime sources."""
import bpy, hashlib, json, struct
from pathlib import Path

root = Path(__file__).resolve().parents[3]
items = [
    ('chomprex/source/chomprex-runtime-candidate.blend', 'chomprex/export/chomprex-candidate.glb'),
    ('chomprex/source/chomprex-lod.blend', 'chomprex/export/chomprex-lod.glb'),
    ('heavyweight/source/heavyweight-runtime-candidate.blend', 'heavyweight/export/heavyweight-candidate.glb'),
    ('heavyweight/source/heavyweight-lod.blend', 'heavyweight/export/heavyweight-lod.glb'),
    ('skydrake15/source/skydrake-candidate.blend', 'skydrake15/export/skydrake-candidate.glb'),
    ('skydrake15/source/skydrake-lod.blend', 'skydrake15/export/skydrake-lod.glb'),
]
rows = []
for source, export in items:
    src = root / 'art/overhaul' / source
    glb = root / 'art/overhaul' / export
    before = hashlib.sha256(src.read_bytes()).hexdigest()
    bpy.ops.wm.open_mainfile(filepath=str(src))
    raw = glb.read_bytes()
    size = struct.unpack_from('<I', raw, 12)[0]
    model = json.loads(raw[20:20+size])
    clips = [a['name'] for a in model.get('animations', [])]
    actions = [a.name for a in bpy.data.actions]
    images = [{'name': i.name, 'size': list(i.size), 'packed': bool(i.packed_file or i.packed_files)} for i in bpy.data.images if i.type == 'IMAGE']
    armatures = [{'name': o.name, 'bones': len(o.data.bones)} for o in bpy.data.objects if o.type == 'ARMATURE']
    row = {'source': str(src.relative_to(root)).replace('\\', '/'), 'sourceSha256': before,
           'export': str(glb.relative_to(root)).replace('\\', '/'), 'exportSha256': hashlib.sha256(raw).hexdigest(),
           'armatures': armatures, 'meshObjects': len([o for o in bpy.data.objects if o.type == 'MESH']),
           'sourceActions': actions, 'exportClips': clips, 'missingSourceActions': sorted(set(clips)-set(actions)),
           'images': images, 'sourceBytesUnchanged': before == hashlib.sha256(src.read_bytes()).hexdigest()}
    row['passed'] = bool(armatures and row['meshObjects'] and clips and not row['missingSourceActions'] and images and all(i['packed'] for i in images) and row['sourceBytesUnchanged'])
    rows.append(row)
    print(json.dumps({'source': source, 'passed': row['passed'], 'armatures': armatures, 'actions': len(actions), 'clips': len(clips), 'images': len(images), 'missingSourceActions': row['missingSourceActions']}))
report = {'method': 'Blender 5.2 read-only reopen; no save/export. Compare named actions to accepted GLB clips, inspect rigs and packed images. This is continuity validation, not a claim of byte-identical regeneration after arbitrary edits.', 'sources': rows, 'passed': all(r['passed'] for r in rows)}
(root/'art/overhaul/skydrake17/review/editable-sources-17.json').write_text(json.dumps(report, indent=2))
assert report['passed']
