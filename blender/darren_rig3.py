# Darren (Tripo model) -> rigged game asset, Blender 5.x  (v3: mesh repair, masked weights, quality report)
# Keeps the original mesh untouched (hidden) and builds: Darren_Game (2 m tall, centred), Darren_Rig (game skeleton),
# automatic skinning with clean-up, and one action per move of the browser game (same pose data the game uses).
import bpy, os, time, math, traceback
from mathutils import Matrix, Vector, Euler, Quaternion

LOG = []
QUALITY = {}
SRC = "dragon 3d model"
Y_SHIFT = 0.42            # model sits forward of the origin; bring the pelvis over it
# landmarks in metres AFTER normalising (2.0 tall, facing -Y, +X = Darren's left, pelvis over origin)
L = dict(pelvis=(0, .02, .48), hips_len=.14, neck=(0, -.02, 1.04), head_top=(0, -.03, 1.72),
         shoulder=(.17, -.05, .97), hand=(.62, -.05, .97), hip=(.2, -.06, .52), ankle=(.22, -.08, .13), toe=(.24, -.25, .04),
         wing_root=(.12, .12, 1.05), wing_wrist=(.52, .09, 1.58), wing_tip=(1.0, .10, .95),
         tail=[(-.02, .2, .52), (-.09, .5, .56), (-.12, .8, .58), (-.04, 1.08, .57), (.18, 1.23, .55), (.5, 1.26, .5)])

# ---------------------------------------------------------------- pose data shared with the browser game (60 fps)
BASE = dict(by=0, bp=0, byw=0, br=0, hp=0, hy=0, aRx=-.35, aRy=0, aRz=-.28, aLx=.1, aLy=0, aLz=.3, lL=0, lR=0, wing=.55, wf=0, tail=.13, ty=0)
POSE = {
 'slashR': [dict(aRx=-.5, aRy=-.9, aRz=-1.8, byw=-.6, bp=-.05), dict(aRx=.15, aRy=1.5, aRz=-1.1, byw=.85, bp=.18, wing=.9), dict(aRx=.1, aRy=1.6, aRz=-.9, byw=.6, bp=.1)],
 'slashL': [dict(aRy=1.5, aRz=-1.2, aRx=0, byw=.85), dict(aRy=-.9, aRz=-1.55, aRx=0, byw=-.7, bp=.15, wing=.9), dict(aRy=-.8, aRz=-1.4, aRx=0, byw=-.6)],
 'spin': [dict(aRz=-1.5, aRy=.4, aRx=0, aLz=1.4, wing=.1, by=.06), dict(aRz=-1.5, aRy=.4, aRx=0, aLz=1.4, wing=.05, by=.08), dict(aRz=-1.1, aRy=.7, aRx=0, aLz=.8)],
 'slam': [dict(by=.55, aRx=-2.3, aRz=-.35, aLx=-2.2, aLz=.35, bp=-.3, wing=0, wf=.9, lL=-.5, lR=-.5, tail=.35), dict(by=-.1, aRx=-.95, aLx=-.9, aRz=-.1, bp=.6, wing=.8, wf=-.4), dict(by=-.08, aRx=-.8, aLx=-.6, aRz=-.1, bp=.45)],
 'rise': [dict(by=-.2, bp=.4, aRx=.7, aRz=-.4, lL=.3, lR=.3), dict(by=.3, bp=-.35, aRx=-2.3, aRz=-.45, wing=0, wf=.9), dict(by=.15, bp=-.2, aRx=-2.15, aRz=-.45, wing=.2)],
 'thrust': [dict(byw=-.8, aRx=-.3, aRz=-.9, aRy=-.7, bp=.2, by=-.1), dict(byw=.35, aRx=-1.5, aRz=0, aRy=0, bp=.5, wing=1.0, lL=.6, lR=-.3), dict(byw=.2, aRx=-1.3, aRz=0, bp=.3)],
 'wheel': [dict(by=.25, aRx=-2.25, aLx=-2.25, aRz=-.4, aLz=.4, lL=-1, lR=-1, wing=1.1), dict(by=.25, aRx=-2.25, aLx=-2.25, aRz=-.4, aLz=.4, lL=-1, lR=-1, wing=1.1), dict(by=0, aRx=-.8)],
 'breath': [dict(bp=-.3, hp=-.35, aRx=.5, aLx=.5, wing=0, wf=.8), dict(bp=.3, hp=.12, aRx=.6, aLx=.6, wing=.2, wf=.2, by=-.05), dict()],
 'nova': [dict(by=.4, aRz=-1.5, aRy=.4, aRx=0, aLz=1.5, wing=0, wf=.5), dict(by=.7, aRz=-1.5, aRy=.4, aRx=0, aLz=1.5, wing=0, wf=.5), dict(by=0)],
 'land': [dict(), dict(by=-.2, bp=.5, aRx=-.9, lL=-.4, lR=-.4), dict(by=-.12, bp=.3, aRx=-.7)],
}
# name: (startup, active, recovery, pose, spin(from,to,turns) or None, flip or None, in_air)
ATK = {
 'Atk_1_EmberSlash': (6, 4, 14, 'slashR', None, None, False), 'Atk_2_BackhandCut': (7, 4, 16, 'slashL', None, None, False),
 'Atk_3_TwinSpin': (8, 8, 18, 'spin', (6, 20, 2), None, False), 'Atk_4_TailWhipSlam': (12, 5, 26, 'slam', (0, 11, 1), None, False),
 'Atk_Launcher_SkywardFlare': (10, 5, 22, 'rise', None, None, False), 'Atk_Charged_DragonFang': (3, 6, 28, 'thrust', None, None, False),
 'Air_1_Slash': (5, 4, 10, 'slashR', None, None, True), 'Air_2_Slash': (5, 4, 10, 'slashL', None, None, True), 'Air_3_Spin': (5, 6, 10, 'spin', (3, 13, 1), None, True),
 'Atk_Dash_WingLunge': (6, 6, 16, 'thrust', None, None, False), 'Atk_Counter_FlickerFang': (4, 5, 14, 'slashR', None, None, False),
 'Skill_BlazeWheel': (8, 20, 18, 'wheel', None, (6, 30, 3), False), 'Skill_FlameBreath': (12, 30, 20, 'breath', None, None, False),
 'Skill_ShoyruSupernova': (10, 40, 24, 'nova', (4, 54, 6), None, False), 'Dive_Land': (0, 1, 20, 'land', None, None, False),
}
STATES = {  # single held poses
 'Charge': dict(by=-.2, bp=.3, byw=-.8, aRz=-1.0, aRy=-1.0, aRx=-.1, lL=.3, lR=-.3, wing=.2, wf=.3),
 'WingDash': dict(bp=.85, wing=1.25, wf=-.1, aRx=.7, aLx=.7, aRz=-.3, lL=.9, lR=.7, tail=.02, by=-.1, hp=-.5),
 'MeteorDive': dict(bp=1.25, aRx=-1.75, aRz=0, aLx=.6, wing=1.2, lL=.9, lR=.9, tail=.02, hp=-.6),
 'Hit': dict(bp=-.5, hp=-.35, aRx=-1.3, aLx=-1.3, aLz=.7, wing=.1, by=-.05),
 'Glide': dict(lL=.8, lR=.7, aLz=.9, aRz=-.9, aRx=-.5, tail=.05, wing=0, wf=.22, bp=.55),
}
WING_REST = .3
PIVOT = .8


def smooth(t): t = max(0.0, min(1.0, t)); return t * t * (3 - 2 * t)


def gq(x, y, z):
    """three.js Euler(x,y,z,'XYZ') in game axes (x left, y up, z forward) -> quaternion in Blender axes (x left, y back, z up)."""
    q = Euler((x, y, z), 'ZYX').to_quaternion()     # matrix Rx*Ry*Rz, same as three.js XYZ
    return Quaternion((q.w, q.x, -q.z, q.y))


RZP = gq(0, 0, math.pi / 2); RZN = gq(0, 0, -math.pi / 2)


def pose_bones(cp, t=0.0, ntail=5):
    """Same mapping as the game's applySkin(): pose parameters -> one model-space rotation per bone."""
    r = {'spine': gq(cp['bp'], cp['byw'], cp['br']), 'head': gq(cp['hp'] - cp['bp'] * .45, cp['hy'] - cp['byw'] * .5, 0),
         'arm_R': gq(cp['aRx'], cp['aRy'], cp['aRz']) @ RZP, 'arm_L': gq(cp['aLx'], cp['aLy'], cp['aLz']) @ RZN,
         'leg_L': gq(cp['lL'], 0, 0), 'leg_R': gq(cp['lR'], 0, 0)}
    wg = cp['wing'] - WING_REST
    r['wing_L'] = gq(0, wg, cp['wf']); r['wing_R'] = gq(0, -wg, -cp['wf'])
    r['wingtip_L'] = gq(0, wg * .35, cp['wf'] * .5); r['wingtip_R'] = gq(0, -wg * .35, -cp['wf'] * .5)
    for i in range(ntail):
        r['tail_%d' % (i + 1)] = gq((cp['tail'] - .13) * (1 + i * .15) + (-cp['bp'] * .5 if i == 0 else 0) + math.sin(t * 3 - i * .7) * .04, cp['ty'] * .4 + math.sin(t * 2.4 - i * .6) * .05, 0)
    return r


# ---------------------------------------------------------------- build
def repair(me):
    """Pass 1 fixes: weld, drop degenerate slivers, fill small holes (copying UVs from neighbours),
    split fin edges shared by 3+ faces, make winding consistent, keep eye/brow decals facing forward."""
    import bmesh
    bm = bmesh.new(); bm.from_mesh(me); uv = bm.loops.layers.uv.active
    rep = {}
    rep['welded'] = len(bm.verts); bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5); rep['welded'] -= len(bm.verts)
    n0 = len(bm.faces); bmesh.ops.dissolve_degenerate(bm, edges=bm.edges, dist=0.0015); rep['slivers_removed'] = n0 - len(bm.faces)
    fins = [e for e in bm.edges if len(e.link_faces) > 2]; rep['fin_edges_split'] = len(fins)
    if fins: bmesh.ops.split_edges(bm, edges=fins)
    bnd = [e for e in bm.edges if e.is_boundary]
    res = bmesh.ops.holes_fill(bm, edges=bnd, sides=8); new = res.get('faces', []); rep['holes_filled'] = len(new)
    if uv:
        for f in new:
            for lp in f.loops:
                src = next((l for l in lp.vert.link_loops if l.face not in new), None)
                if src: lp[uv].uv = src[uv].uv
    # shells
    bm.faces.ensure_lookup_table(); seen = set(); shells = []
    for f in bm.faces:
        if f.index in seen: continue
        st = [f]; seen.add(f.index); fs = []
        while st:
            x = st.pop(); fs.append(x)
            for e in x.edges:
                for y in e.link_faces:
                    if y.index not in seen: seen.add(y.index); st.append(y)
        shells.append(fs)
    flipped = 0
    for fs in shells:
        if len(fs) > 150:
            before = [f.normal.copy() for f in fs]; bmesh.ops.recalc_face_normals(bm, faces=fs)
            flipped += sum(1 for f, n in zip(fs, before) if f.normal.dot(n) < 0)
        else:   # open decals (eyes, brows): make them face the front (-Y)
            avg = sum((f.normal for f in fs), Vector())
            if avg.y > 0:
                bmesh.ops.reverse_faces(bm, faces=fs); flipped += len(fs)
    rep['faces_reoriented'] = flipped; rep['shells'] = len(shells)
    rep['boundary_edges_left'] = sum(1 for e in bm.edges if e.is_boundary)
    bm.to_mesh(me); bm.free(); me.update()
    return rep


def build_mesh():
    src = bpy.data.objects.get(SRC) or next(o for o in bpy.data.objects if o.type == 'MESH' and o.name not in ("Darren_Game",))
    for n in ("Darren_Game", "Darren_Rig"):
        o = bpy.data.objects.get(n)
        if o: bpy.data.objects.remove(o, do_unlink=True)
    src.hide_set(False)
    dg = bpy.context.evaluated_depsgraph_get(); dg.update()
    me = bpy.data.meshes.new_from_object(src.evaluated_get(dg), preserve_all_data_layers=True, depsgraph=dg); me.transform(src.matrix_world)
    g = bpy.data.objects.new("Darren_Game", me); me.name = "Darren_Game"
    col = bpy.data.collections.get("Darren_Game") or bpy.data.collections.new("Darren_Game")
    if col.name not in [c.name for c in bpy.context.scene.collection.children]: bpy.context.scene.collection.children.link(col)
    col.objects.link(g)
    zs = [v.co.z for v in me.vertices]; zmin, zmax = min(zs), max(zs); s = 2.0 / (zmax - zmin)
    me.transform(Matrix.Translation((0, Y_SHIFT, 0)) @ Matrix.Scale(s, 4) @ Matrix.Translation((0, 0, -zmin)))
    rep = repair(me); QUALITY['mesh_repair'] = rep
    for p in me.polygons: p.use_smooth = True
    me.update(); src.hide_set(True); src.hide_render = True
    for slot in g.material_slots:          # toy-plastic gloss instead of Tripo's matte 0.9 roughness
        m = slot.material
        if m and m.node_tree:
            for n in m.node_tree.nodes:
                if n.type == 'BSDF_PRINCIPLED':
                    n.inputs['Roughness'].default_value = .32
                    if 'Coat Weight' in n.inputs: n.inputs['Coat Weight'].default_value = .6; n.inputs['Coat Roughness'].default_value = .12
    LOG.append("mesh: %d verts, %d tris, source height %.3f -> 2.0; repair %s" % (len(me.vertices), sum(len(p.vertices) - 2 for p in me.polygons), zmax - zmin, rep))
    return g, src


def build_armature():
    arm = bpy.data.armatures.new("Darren_Rig"); ao = bpy.data.objects.new("Darren_Rig", arm)
    bpy.data.collections["Darren_Game"].objects.link(ao)
    bpy.ops.object.select_all(action='DESELECT'); ao.select_set(True); bpy.context.view_layer.objects.active = ao
    bpy.ops.object.mode_set(mode='EDIT'); eb = arm.edit_bones
    V = Vector; mir = lambda p: Vector((-p[0], p[1], p[2]))

    def bone(name, head, tail, parent=None, deform=True):
        b = eb.new(name); b.head = V(head); b.tail = V(tail); b.roll = 0; b.use_deform = deform
        if parent: b.parent = eb[parent]
    pel = V(L['pelvis']); mid = pel + Vector((0, 0, L['hips_len']))
    bone('root', (0, 0, 0), (0, .25, 0), None, False)
    bone('hips', pel, mid, 'root'); bone('spine', mid, L['neck'], 'hips'); bone('head', L['neck'], L['head_top'], 'spine')
    for s, f in (('L', V), ('R', mir)):
        sh, hd = f(L['shoulder']), f(L['hand']); d = (hd - sh).normalized()
        bone('arm_' + s, sh, hd, 'spine'); bone('hand_' + s, hd, hd + d * .08, 'arm_' + s, False)
        bone('leg_' + s, f(L['hip']), f(L['ankle']), 'hips'); bone('foot_' + s, f(L['ankle']), f(L['toe']), 'leg_' + s)
        bone('wing_' + s, f(L['wing_root']), f(L['wing_wrist']), 'spine'); bone('wingtip_' + s, f(L['wing_wrist']), f(L['wing_tip']), 'wing_' + s)
    pts = [V(p) for p in L['tail']]; par = 'hips'
    for i in range(len(pts) - 1): bone('tail_%d' % (i + 1), pts[i], pts[i + 1], par); par = 'tail_%d' % (i + 1)
    bpy.ops.object.mode_set(mode='OBJECT'); ao.show_in_front = True
    return ao


def seg_dist(p, a, b):
    ab = b - a; t = max(0, min(1, (p - a).dot(ab) / max(ab.length_squared, 1e-9))); return (p - (a + ab * t)).length


SEED_R = {'hips': .2, 'spine': .2, 'head': .27, 'arm': .1, 'leg': .15, 'foot': .1, 'wing': .08, 'wingtip': .07, 'tail': .12}
SIGMA_B = {'hips': .12, 'spine': .12, 'head': .05, 'arm': .035, 'leg': .08, 'foot': .04, 'wing': .06, 'wingtip': .06, 'tail': .07}
TAIL = ['tail_%d' % i for i in range(1, 6)]


def region_allowed(p, side):
    """Anatomical mask for the main body shell: which bones may influence a vertex at p."""
    a = {'hips', 'spine'}
    if p.z > .9: a.add('head')
    if abs(p.x) > .13 and .75 < p.z < 1.2 and p.y < .15: a.add('arm_' + side)
    if p.z < .66 and abs(p.x) > .03 and p.y < .22:
        a.add('leg_' + side)
        if p.z < .22: a.add('foot_' + side)
    if p.y > .02 and p.z < .9: a.update(TAIL)
    return a


def skin(ob, ao):
    """Pass 2 skinning: per-shell + anatomical masks, geodesic blend with per-joint softness, crotch seam to hips."""
    import heapq
    ob.parent = ao
    if not any(m.type == 'ARMATURE' for m in ob.modifiers): m = ob.modifiers.new("Armature", 'ARMATURE'); m.object = ao
    me = ob.data; bones = {b.name: (b.head_local.copy(), b.tail_local.copy()) for b in ao.data.bones if b.use_deform}
    key = {}; vid = []
    for v in me.vertices:
        k = (round(v.co.x, 4), round(v.co.y, 4), round(v.co.z, 4)); vid.append(key.setdefault(k, len(key)))
    n = len(key); pos = [None] * n
    for v in me.vertices: pos[vid[v.index]] = v.co.copy()
    adj = [[] for _ in range(n)]
    for e in me.edges:
        a, b = vid[e.vertices[0]], vid[e.vertices[1]]
        if a != b: d = (pos[a] - pos[b]).length; adj[a].append((b, d)); adj[b].append((a, d))
    comp = [-1] * n; comps = []
    for i in range(n):
        if comp[i] >= 0: continue
        st = [i]; comp[i] = len(comps); c = []
        while st:
            a = st.pop(); c.append(a)
            for b, _ in adj[a]:
                if comp[b] < 0: comp[b] = comp[i]; st.append(b)
        comps.append(c)
    kind = []
    for c in comps:
        ctr = sum((pos[i] for i in c), Vector()) / len(c)
        if len(c) > 2000: kind.append(('main', None))
        elif len(c) > 300 and abs(ctr.x) > .25 and ctr.z > .85: kind.append(('wing', 'L' if ctr.x > 0 else 'R'))
        else: kind.append(('rigid', ctr))
    wroot = {s: Vector(L['wing_root']) * (Vector((1, 1, 1)) if s == 'L' else Vector((-1, 1, 1))) for s in 'LR'}
    allowed = [None] * n
    for i in range(n):
        k, s = kind[comp[i]]; p = pos[i]; side = 'L' if p.x >= 0 else 'R'
        if k == 'main': allowed[i] = region_allowed(p, side)
        elif k == 'wing':
            allowed[i] = {'wing_' + s, 'wingtip_' + s}
            if (p - wroot[s]).length < .12: allowed[i].add('spine')
        else: allowed[i] = set()
    INF = 1e9; dist = {}
    for name, (h, t) in bones.items():
        r = SEED_R[name.split('_')[0]]; d = [INF] * n; pq = []
        for i in range(n):
            if name in allowed[i] and (seg_dist(pos[i], h, t) < r or (name == 'spine' and kind[comp[i]][0] == 'wing')):
                d[i] = 0.0 if not (name == 'spine' and kind[comp[i]][0] == 'wing') else (pos[i] - wroot[kind[comp[i]][1]]).length * 3
                pq.append((d[i], i))
        heapq.heapify(pq)
        while pq:
            da, a = heapq.heappop(pq)
            if da > d[a] or da > 1.2: continue
            for b, w in adj[a]:
                if name in allowed[b] and da + w < d[b]: d[b] = da + w; heapq.heappush(pq, (da + w, b))
        dist[name] = d
    W = [dict() for _ in range(n)]
    for i in range(n):
        ds = {nm: dist[nm][i] for nm in bones if dist[nm][i] < INF}
        if not ds: continue
        m0 = min(ds.values())
        W[i] = {nm: math.exp(-(dd - m0) / SIGMA_B[nm.split('_')[0]]) for nm, dd in ds.items() if dd - m0 < .4}
    for i in range(n):                                    # crotch seam: centre line belongs to the hips
        p = pos[i]
        if kind[comp[i]][0] == 'main' and p.z < .66:
            f = smooth((abs(p.x) - .02) / .09)
            for nm in list(W[i]):
                if nm.startswith('leg_') or nm.startswith('foot_'): W[i][nm] *= f
            W[i]['hips'] = W[i].get('hips', 0) + (1 - f) * .5
    for _ in range(3):                                    # surface smoothing inside each vertex's mask
        W2 = []
        for i in range(n):
            acc = dict(W[i]); k = 1.0
            for b, _ in adj[i]:
                for nm, w in W[b].items():
                    if nm in allowed[i]: acc[nm] = acc.get(nm, 0) + w * .5
                k += .5
            W2.append({nm: w / k for nm, w in acc.items()})
        W = W2
    lost = 0; rigid = 0
    for ci, c in enumerate(comps):
        k, ctr = kind[ci]
        if k != 'rigid': continue
        rigid += 1
        for i in c: W[i] = {'head': 1.0}
    for i in range(n):
        if not W[i]:
            lost += 1; cand = [nm for nm in bones if nm in (allowed[i] or bones)]; W[i] = {min(cand, key=lambda nm: seg_dist(pos[i], *bones[nm])): 1.0}
    for g in list(ob.vertex_groups): ob.vertex_groups.remove(g)
    grp = {nm: ob.vertex_groups.new(name=nm) for nm in bones}
    for v in me.vertices:
        ws = W[vid[v.index]]; top = sorted(ws.items(), key=lambda kv: -kv[1])[:4]; tot = sum(w for _, w in top)
        for nm, w in top:
            if w / tot > .01: grp[nm].add([v.index], w / tot, 'REPLACE')
    bpy.ops.object.select_all(action='DESELECT'); ob.select_set(True); bpy.context.view_layer.objects.active = ob
    bpy.ops.object.vertex_group_normalize_all(group_select_mode='ALL', lock_active=False)
    QUALITY['skin'] = dict(verts=len(me.vertices), shells=[k for k, _ in kind], rigid_shells=rigid, unreached=lost)
    LOG.append("skin: %d verts, shells %s, %d rigid decals, %d unreached" % (len(me.vertices), [k for k, _ in kind], rigid, lost))


# ---------------------------------------------------------------- animation
def set_pose(ao, cp, frame, t=0.0, spin=0.0, flip=0.0, ntail=5, air=0.0):
    rots = pose_bones(cp, t, ntail)
    for name, q in rots.items():
        pb = ao.pose.bones.get(name)
        if not pb: continue
        rest = pb.bone.matrix_local.to_quaternion(); pb.rotation_quaternion = rest.inverted() @ q @ rest; pb.keyframe_insert('rotation_quaternion', frame=frame)
    hp = ao.pose.bones['hips']; hp.location = hp.bone.matrix_local.to_quaternion().inverted() @ Vector((0, 0, cp['by'])); hp.keyframe_insert('location', frame=frame)
    rb = ao.pose.bones['root']; R = gq(flip, spin, 0); piv = Vector((0, 0, PIVOT)); loc = piv - R @ piv + Vector((0, 0, air))
    rest = rb.bone.matrix_local.to_quaternion(); rb.rotation_quaternion = rest.inverted() @ R @ rest; rb.location = rest.inverted() @ loc
    rb.keyframe_insert('rotation_quaternion', frame=frame); rb.keyframe_insert('location', frame=frame)


def make_actions(ao):
    ao.animation_data_create(); made = []; nt = len(L['tail']) - 1
    ours = set(['Idle', 'Run', 'Jump', 'Knockdown'] + list(STATES) + list(ATK))
    for a in list(bpy.data.actions):
        if a.name.split('.')[0] in ours: bpy.data.actions.remove(a)
    for pb in ao.pose.bones: pb.rotation_mode = 'QUATERNION'

    def start(name):
        for pb in ao.pose.bones: pb.rotation_quaternion = (1, 0, 0, 0); pb.location = (0, 0, 0)
        act = bpy.data.actions.new(name); act.use_fake_user = True; ao.animation_data.action = act; made.append(act)
    P = lambda **k: dict(BASE, **k)
    start("Idle")
    for f in range(1, 122, 6):
        t = (f - 1) / 60.0; w = math.tau * (f - 1) / 120.0
        set_pose(ao, P(by=math.sin(w * 2) * .018, wf=math.sin(w * 2) * .14, ty=math.sin(w) * .28, hy=math.sin(w) * .12, hp=math.sin(w * 2) * .04), f, 0, ntail=nt)
    start("Run")
    for f in range(1, 26, 2):
        ph = math.tau * (f - 1) / 24.0; sn = math.sin(ph)
        set_pose(ao, P(lL=sn * .95, lR=-sn * .95, by=abs(math.cos(ph)) * .08, bp=.24, aLx=-sn * .75, aRx=-.55 + sn * .3, wing=.95, wf=math.sin(ph * 2) * .18, tail=.1, ty=sn * .22, br=sn * .05), f, ntail=nt)
    start("Jump")
    for f, air, cp in ((1, 0, P(by=-.15, bp=.2)), (5, .5, P(lL=.55, lR=-.35, aLz=.9, aRz=-.9, aRx=-.5, wing=.2, wf=.7, bp=-.12)), (12, 1.6, P(lL=.55, lR=-.35, aLz=.9, aRz=-.9, aRx=-.5, wing=.2, wf=-.7, bp=-.05)),
                       (20, 2.0, P(lL=.55, lR=-.35, aLz=.9, aRz=-.9, aRx=-.5, wing=.2, wf=.7, bp=.1)), (30, .9, P(lL=.55, lR=-.35, aLz=.9, aRz=-.9, aRx=-.5, wing=.2, wf=-.5, bp=.2)), (36, 0, P(by=-.18, bp=.25)), (44, 0, P())):
        set_pose(ao, cp, f, air=air, ntail=nt)
    for name, cp in STATES.items():
        start(name); air = .8 if name in ('MeteorDive', 'Glide') else 0
        set_pose(ao, P(), 1, air=air, ntail=nt); set_pose(ao, P(**cp), 7, air=air, ntail=nt); set_pose(ao, P(**cp), 22, air=air, ntail=nt); set_pose(ao, P(), 30, air=air, ntail=nt)
    start("Knockdown")
    for f, flip, air in ((1, 0, 0), (8, -.9, .5), (18, -1.45, 0), (52, -1.45, 0), (64, 0, 0)):
        set_pose(ao, P(aRx=-1.6, aLx=-1.6, aLz=.8, aRz=-.8, wing=0, lL=-.4, lR=.3) if 1 < f < 64 else P(), f, flip=flip, air=air + (.28 * -flip * .28 if flip else 0), ntail=nt)
    for name, (st, ac, rc, pose, spin, flip, in_air) in ATK.items():
        start(name); end = st + ac + rc; air = .9 if in_air else 0; legs = dict(lL=.7, lR=.35) if in_air else {}
        keys = sorted(set([0, max(1, round(st * .75)), st + 1, st + ac, st + ac + round(rc * .45), end] + (list(range(0, end + 1, 2)) if (spin or flip) else [])))
        for f in keys:
            if f == 0 or f == end: cp = P(**legs)
            elif f < st + 1: cp = P(**dict(POSE[pose][0], **legs))
            elif f <= st + ac: cp = P(**dict(POSE[pose][1], **legs))
            else: cp = P(**dict(POSE[pose][2], **legs))
            sp = math.tau * spin[2] * smooth((f - spin[0]) / (spin[1] - spin[0])) if spin else 0
            fl = math.tau * flip[2] * smooth((f - flip[0]) / (flip[1] - flip[0])) if flip else 0
            set_pose(ao, cp, f + 1, spin=sp, flip=fl, air=air, ntail=nt)
    for act in made:
        tr = ao.animation_data.nla_tracks.new(); tr.name = act.name; tr.strips.new(act.name, 1, act); tr.mute = True
    ao.animation_data.action = bpy.data.actions["Idle"]
    LOG.append("%d actions: %s" % (len(made), ", ".join(a.name for a in made)))


def rest_pose(ao):
    act = ao.animation_data.action if ao.animation_data else None
    if ao.animation_data: ao.animation_data.action = None
    for pb in ao.pose.bones: pb.rotation_quaternion = (1, 0, 0, 0); pb.location = (0, 0, 0); pb.scale = (1, 1, 1)
    bpy.context.view_layer.update(); return act


def desktop_dir():
    try:
        import winreg
        k = winreg.OpenKey(winreg.HKEY_CURRENT_USER, r"Software\Microsoft\Windows\CurrentVersion\Explorer\User Shell Folders")
        p = os.path.expandvars(winreg.QueryValueEx(k, "Desktop")[0])
        if os.path.isdir(p): return p
    except Exception: pass
    for p in (os.path.join(os.path.expanduser("~"), "OneDrive", "Desktop"), os.path.join(os.path.expanduser("~"), "Desktop")):
        if os.path.isdir(p): return p
    return os.path.expanduser("~")


def finish(ob, ao, extra_dir=None):
    sc = bpy.context.scene; sc.frame_start = 1; sc.frame_end = 121; sc.render.fps = 60; sc.frame_set(1)
    for im in bpy.data.images:
        if im.source == 'FILE' and not im.packed_file and im.filepath:
            try: im.pack()
            except Exception: pass
    desk = desktop_dir(); blend = os.path.join(desk, "darren game asset.blend")
    bpy.ops.object.select_all(action='DESELECT'); ob.select_set(True); ao.select_set(True); bpy.context.view_layer.objects.active = ao
    bpy.ops.wm.save_as_mainfile(filepath=blend, compress=True); LOG.append("saved " + blend)
    try:
        bpy.ops.export_scene.fbx(filepath=os.path.join(desk, "darren game asset.fbx"), use_selection=True, object_types={'ARMATURE', 'MESH'}, add_leaf_bones=False,
                                 bake_anim=True, bake_anim_use_nla_strips=True, bake_anim_use_all_actions=False, mesh_smooth_type='FACE', path_mode='COPY', embed_textures=True)
        LOG.append("exported fbx")
    except Exception as e: LOG.append("fbx export failed: %s" % e)
    try:
        bpy.ops.export_scene.gltf(filepath=os.path.join(desk, "darren game asset.glb"), export_format='GLB', use_selection=True, export_yup=True, export_skins=True,
                                  export_animations=True, export_animation_mode='NLA_TRACKS', export_def_bones=False, export_image_format='JPEG', export_image_quality=90)
        LOG.append("exported glb with animations")
    except Exception as e: LOG.append("glb(anim) export failed: %s" % e)
    if extra_dir:   # light bind-pose copy for the browser game: 2k texture copies, no clips; the .blend keeps the 4k originals
        act = rest_pose(ao); swaps = []
        for m in bpy.data.materials:
            if not m.node_tree: continue
            for n in m.node_tree.nodes:
                if n.type == 'TEX_IMAGE' and n.image and max(n.image.size) > 2048:
                    small = n.image.copy(); small.scale(2048, 2048); swaps.append((n, n.image, small)); n.image = small
        try:
            bpy.ops.export_scene.gltf(filepath=os.path.join(extra_dir, "darren.glb"), export_format='GLB', use_selection=True, export_yup=True, export_skins=True,
                                      export_animations=False, export_def_bones=False, export_image_format='JPEG', export_image_quality=88)
            LOG.append("exported game glb")
        finally:
            for n, big, small in swaps: n.image = big; bpy.data.images.remove(small)
            ao.animation_data.action = act
    bpy.ops.wm.save_mainfile(compress=True)


def run(extra_dir=None, log_path=None):
    QUALITY.clear(); LOG.clear()
    try:
        if bpy.context.object and bpy.context.object.mode != 'OBJECT': bpy.ops.object.mode_set(mode='OBJECT')
        ob, src = build_mesh(); ao = build_armature(); skin(ob, ao); make_actions(ao); finish(ob, ao, extra_dir); LOG.append("OK")
    except Exception:
        LOG.append("ERROR\n" + traceback.format_exc())
    if log_path:
        open(log_path, "w").write("\n".join(LOG))
        import json; open(log_path.replace('.txt', '_quality.json'), 'w').write(json.dumps(QUALITY, indent=1, default=str))
    return LOG
