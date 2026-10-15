import bpy, json, math, os
from mathutils import Vector
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT=os.path.join(ROOT,"chomprex")
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=os.path.join(OUT,"source","supplied-chomprex.glb"))
arm=next(o for o in bpy.data.objects if o.type=="ARMATURE")
arm.data.pose_position='REST'
meshes=[o for o in bpy.data.objects if o.type=='MESH']
audit={"blender":bpy.app.version_string,"meshes":[],"bones":[],"actions":[],"images":[]}
for o in meshes:
 bbox=[o.matrix_world@Vector(v) for v in o.bound_box]
 audit["meshes"].append({"name":o.name,"verts":len(o.data.vertices),"triangles":sum(len(p.vertices)-2 for p in o.data.polygons),"groups":len(o.vertex_groups),"materials":[m.name for m in o.data.materials],"bounds":[[min(v[i] for v in bbox) for i in range(3)],[max(v[i] for v in bbox) for i in range(3)]],"parent":o.parent.name if o.parent else None,"parent_bone":o.parent_bone})
for bone in arm.data.bones:
 audit["bones"].append({"name":bone.name,"head":list(arm.matrix_world@bone.head_local),"tail":list(arm.matrix_world@bone.tail_local),"parent":bone.parent.name if bone.parent else None})
for a in bpy.data.actions:
 audit["actions"].append({"name":a.name,"frames":list(a.frame_range),"slots":[s.identifier for s in a.slots]})
for im in bpy.data.images:audit["images"].append({"name":im.name,"size":list(im.size),"packed":bool(im.packed_file)})
json.dump(audit,open(os.path.join(OUT,"source","import-audit.json"),"w"),indent=2)
bpy.ops.file.pack_all()
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT,"source","supplied-chomprex-import.blend"))
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=16
scene.render.resolution_x=800;scene.render.resolution_y=800;scene.render.resolution_percentage=100
scene.world=bpy.data.worlds.new('Review World');scene.world.color=(.25,.25,.25)
scene.view_settings.view_transform='AgX'
def area(name,pos,energy,size):
 bpy.ops.object.light_add(type='AREA',location=pos);o=bpy.context.object;o.name=name;o.data.energy=energy;o.data.shape='DISK';o.data.size=size;o.rotation_euler=(Vector((0,0,2))-o.location).to_track_quat('-Z','Y').to_euler()
area('Key',(4,-6,8),1000,5);area('Fill',(-5,-2,4),650,5);area('Rim',(2,5,6),1100,4)
bpy.ops.mesh.primitive_plane_add(size=200);plane=bpy.context.object;plane.location.z=-.03
m=bpy.data.materials.new('Review Ground');m.diffuse_color=(.16,.19,.22,1);plane.data.materials.append(m)
bpy.ops.object.camera_add();cam=bpy.context.object;scene.camera=cam;cam.data.type='ORTHO';cam.data.ortho_scale=9.6
target=Vector((0,.7,2.2))
for name,pos in [('front',(0,-14,3)),('side',(-14,.7,3)),('back',(0,14,3)),('three-quarter',(10,-13,7))]:
 cam.location=pos;cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler()
 scene.render.filepath=os.path.join(OUT,'review','supplied-'+name+'.png');bpy.ops.render.render(write_still=True)
print('AUDIT_COMPLETE',json.dumps({"bones":len(audit["bones"]),"triangles":sum(x["triangles"] for x in audit["meshes"]),"actions":len(audit["actions"])}))
