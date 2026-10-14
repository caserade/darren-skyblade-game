"""
Blender helper (NOT run by Claude: no Blender in its workspace; run it on your PC).
Imports the rigged monsters from models/*.glb and saves an editable .blend next to each one.

    blender --background --python tools/blender_import_cast.py
    (or open Blender > Scripting > open this file > Run Script)

Each .glb holds: the skinned body (vertex colours, the _belly mask as a colour attribute),
wing membranes, eyes, lids, horns, spines and teeth parented to bones, a 25-34 bone armature
and the named animation clips listed in models/cast_animations.json (they import as NLA actions).
+Y up in glTF becomes +Z up in Blender; the creatures face +Z in glTF (-Y in Blender).
"""
import os
import bpy

HERE = os.path.dirname(os.path.abspath(__file__))
MODELS = os.path.join(HERE, '..', 'models')

for name in ('skydrake', 'heavyweight', 'chomprex'):
    src = os.path.join(MODELS, name + '.glb')
    if not os.path.exists(src):
        print('missing', src)
        continue
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=src)
    # show vertex colours in the viewport material preview
    for ob in bpy.data.objects:
        if ob.type == 'MESH':
            ob.data.update()
    out = os.path.join(MODELS, name + '.blend')
    bpy.ops.wm.save_as_mainfile(filepath=out)
    print('saved', out)
