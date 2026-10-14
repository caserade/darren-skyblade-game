"""
Sculpts the three Cloud Utopia monsters from Michael's approved concept sheets (docs/art/cast/), version 2:
  A  skydrake     Stormbelly / Sky Drake    long S-neck, long wedge snout, heavy angry brow, gold zigzag horns,
                                            big hanging pear belly, huge thighs, digitigrade legs, bat wings
  B  heavyweight  Stormbelly / Heavyweight  low broad trapezoid, enormous folded belly, muscular arms, short
                                            neck, jutting underbite with tusks, small wings, spade tail
  C  chomprex     Chomp Rex / Grin          plum T-rex, golden underside, huge wedge head, open toothy grin,
                                            tiny 2-fingered arms, big haunches, 3-clawed digitigrade feet
and writes assets/cast_models.js (window.CAST_MODELS): for each, a game mesh (lod0) and a light one (lod1).

Each body is one seamless skinned surface. Per vertex it carries bone weights (relaxed over the mesh, max 4,
with a clean jaw split along the mouth), a belly mask, a fat mask and growth direction (weight stages), and
vertex colours with baked ambient occlusion. Small parts are built in src/cast.js at the anchors found here:
eyes and lids, horns, back spines, wings, claws (one per toe and finger), teeth, fangs and tusks.

Run:  python3 tools/sculpt_cast.py [skydrake heavyweight chomprex]      (numpy, scipy, scikit-image, pyfqmr, xatlas, Pillow)
Units are metres, +y up, +z is the creature's front, +x its left. Feet stand on y = 0.
"""
import base64, json, math, os, sys
import numpy as np
from sculpt_lib import *

OUT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'cast_models.js')
LR = ((1, 'L'), (-1, 'R'))
LOD = (30000, 10000)  # triangles for the game mesh and the light mesh
TEX = (1024, 512)  # baked texture size for each
SCALES = dict(skydrake=19.0, heavyweight=17.0, chomprex=15.0)  # scales per metre

def mirror(s, p):
    return (s * p[0], p[1], p[2])

def limb_bones(names, pts, parent, ends=None):
    out = []
    for s, side in LR:
        prev = parent
        for i, (n, p) in enumerate(zip(names, pts)):
            end = mirror(s, ends[i]) if ends and ends[i] is not None else None
            out.append((n + side, prev, mirror(s, p), end))
            prev = n + side
    return out

def pair_bones(name, p, parent, end):
    return [(name + side, parent, mirror(s, p), mirror(s, end)) for s, side in LR]

def dorsal(f, pts, outs, sizes, bones):
    """back spines: march onto the surface from outside along each 'out' direction"""
    res = []
    for p, o, sz, b in zip(pts, outs, sizes, bones):
        o = np.array(o, float); o /= np.linalg.norm(o)
        h = march(f, np.array(p) + o * 3.0, -o)
        if h is None:
            continue
        res.append(dict(p=r5(h), n=r5(grad(f, h)), s=round(float(sz), 3), b=b))
    return res

def lerp_pts(a, b, n):
    a = np.array(a, float); b = np.array(b, float)
    return [tuple(a + (b - a) * (i + 0.5) / n) for i in range(n)]

def claw(f, tip, d, size, bone):
    """a claw: from the surface at the end of a toe/finger, pointing along d"""
    d = np.array(d, float); d /= np.linalg.norm(d)
    h = march(f, np.array(tip) + d * 1.0, -d)
    return dict(p=r5(h - d * size * 0.25), d=r5(d), s=round(size, 3), b=bone)

def mouth_line(f, centre, y_up, y_lo, angles, radius=2.5):
    """points along the mouth: for each angle around the head, the upper-lip and lower-lip surface"""
    up, lo = [], []
    c = np.array(centre, float)
    for a in angles:
        d = np.array((math.sin(a), 0, math.cos(a)))
        hu = march(f, np.array((c[0], y_up, c[2])) + d * radius, -d)
        hl = march(f, np.array((c[0], y_lo, c[2])) + d * radius, -d)
        up.append(dict(p=r5(hu), d=r5(d)))
        lo.append(dict(p=r5(hl), d=r5(d)))
    return up, lo

# =========================================================================== A: Stormbelly / Sky Drake
def skydrake():
    neck = [(0, 2.8, 0.12), (0, 3.3, 0.06), (0, 3.76, -0.08), (0, 4.16, 0.02), (0, 4.4, 0.24)]
    tail = [(0, 1.45, -0.62), (0, 1.0, -1.5), (0.2, 0.62, -2.35), (0.6, 0.4, -3.1), (1.0, 0.42, -3.65), (1.2, 0.44, -3.95)]
    bones = [
        ('root', None, (0, 0, 0)), ('hips', 'root', (0, 1.55, -0.12)), ('spine', 'hips', (0, 2.2, 0.0)),
        ('chest', 'spine', (0, 2.62, 0.08)), ('neck1', 'chest', neck[0]), ('neck2', 'neck1', neck[1]),
        ('neck3', 'neck2', neck[2]), ('neck4', 'neck3', neck[3]), ('head', 'neck4', (0, 4.38, 0.26), (0, 4.4, 1.3)),
        ('jaw', 'head', (0, 4.3, 0.42), (0, 4.18, 1.18)),
        ('belly', 'hips', (0, 1.55, 0.75), (0, 1.35, 1.2)),
    ]
    bones += [('tail%d' % (i + 1), 'hips' if i == 0 else 'tail%d' % i, tail[i], (1.32, 0.45, -4.15) if i == 5 else None) for i in range(6)]
    bones += pair_bones('brow', (0.15, 4.63, 0.58), 'head', (0.17, 4.66, 0.72))
    bones += limb_bones(['thigh', 'shin', 'ankle', 'toe'], [(0.66, 1.5, -0.04), (0.72, 0.88, 0.12), (0.72, 0.36, -0.3), (0.72, 0.11, 0.12)], 'hips', [None, None, None, (0.72, 0.07, 0.52)])
    bones += limb_bones(['arm', 'forearm', 'hand'], [(0.6, 2.6, 0.12), (1.12, 2.15, 0.2), (1.18, 1.84, 0.62)], 'chest', [None, None, (1.2, 1.56, 0.87)])
    bones += limb_bones(['wing1', 'wing2', 'wing3'], [(0.36, 2.86, -0.4), (1.15, 3.4, -0.72), (2.0, 3.2, -0.86)], 'chest', [None, None, (2.55, 2.45, -0.9)])
    P = [
        Part('torso', ellipsoid((0, 2.1, 0.05), (0.86, 1.0, 0.72)), ['hips', 'spine'], 0),
        Part('belly', ellipsoid((0, 1.62, 0.32), (0.97, 1.0, 0.87)), ['hips', 'spine'], 0.32, 'belly'),
        Part('lowbelly', ellipsoid((0, 1.22, 0.42), (0.82, 0.62, 0.72)), ['hips'], 0.3, 'belly'),
        Part('bum', ellipsoid((0, 1.48, -0.38), (0.76, 0.66, 0.6)), ['hips'], 0.25, 'torso'),
        Part('chest', ellipsoid((0, 2.66, 0.1), (0.6, 0.52, 0.5)), ['spine', 'chest'], 0.3, 'torso'),
        Part('neck', chain(neck, [0.5, 0.42, 0.36, 0.32, 0.29]), ['chest', 'neck1', 'neck2', 'neck3', 'neck4', 'head'], 0.2, 'neck'),
        Part('skull', ellipsoid((0, 4.48, 0.32), (0.3, 0.29, 0.36)), ['head'], 0.12, 'head'),
        Part('snout', roundcone((0, 4.47, 0.55), (0, 4.36, 1.32), 0.22, 0.12, 1.2, 0.78), ['head'], 0.1, 'head'),
        Part('nose', ellipsoid((0, 4.385, 1.3), (0.14, 0.085, 0.1)), ['head'], 0.05, 'head'),
        Part('jaw', roundcone((0, 4.21, 0.48), (0, 4.18, 1.16), 0.13, 0.08, 1.3, 0.75), ['jaw'], 0.03, 'jaw'),
    ]
    for s, side in LR:
        P += [
            Part('browIn' + side, ellipsoid((s * 0.09, 4.62, 0.64), (0.085, 0.06, 0.13), tilt=-0.2), ['brow' + side], 0.04, 'brow'),
            Part('browOut' + side, ellipsoid((s * 0.2, 4.69, 0.5), (0.1, 0.06, 0.14), tilt=-0.35), ['brow' + side], 0.04, 'brow'),
            Part('cheek' + side, ellipsoid((s * 0.21, 4.33, 0.52), (0.13, 0.13, 0.17)), ['head'], 0.08, 'head'),
            Part('jawhinge' + side, ellipsoid((s * 0.2, 4.25, 0.42), (0.1, 0.12, 0.12)), ['jaw', 'head'], 0.06, 'head'),
            Part('shoulder' + side, ellipsoid((s * 0.55, 2.62, 0.1), (0.24, 0.24, 0.24)), ['chest', 'arm' + side], 0.12, 'torso'),
            Part('thigh' + side, ellipsoid((s * 0.7, 1.22, -0.02), (0.53, 0.66, 0.58)), ['thigh' + side], 0.18, 'thigh'),
            Part('knee' + side, sphere((s * 0.72, 0.86, 0.14), 0.24), ['thigh' + side, 'shin' + side], 0.1, 'leg'),
            Part('shin' + side, roundcone((s * 0.72, 0.86, 0.1), (s * 0.72, 0.36, -0.32), 0.25, 0.16), ['shin' + side], 0.08, 'leg'),
            Part('foot' + side, roundcone((s * 0.72, 0.36, -0.32), (s * 0.72, 0.11, 0.12), 0.15, 0.14), ['ankle' + side], 0.07, 'leg'),
            Part('uarm' + side, roundcone((s * 0.6, 2.6, 0.12), (s * 1.12, 2.15, 0.2), 0.19, 0.14), ['arm' + side], 0.1, 'arm'),
            Part('elbow' + side, sphere((s * 1.13, 2.15, 0.19), 0.14), ['arm' + side, 'forearm' + side], 0.05, 'farm'),
            Part('farm' + side, roundcone((s * 1.12, 2.15, 0.2), (s * 1.18, 1.86, 0.62), 0.135, 0.1), ['forearm' + side], 0.05, 'farm'),
            Part('hand' + side, ellipsoid((s * 1.2, 1.8, 0.66), (0.12, 0.1, 0.11)), ['hand' + side], 0.04, 'hand'),
        ]
        for ox in (-0.17, -0.055, 0.06, 0.17):
            P.append(Part('toe' + side, roundcone((s * 0.72 + ox * 0.6, 0.11, 0.14), (s * 0.72 + s * ox * 1.1 if False else s * 0.72 + ox * 1.25, 0.07, 0.5), 0.075, 0.05), ['toe' + side], 0.04, 'toe'))
        for fx in (-0.06, 0.0, 0.06):
            P.append(Part('finger' + side, roundcone((s * (1.2 + fx), 1.77, 0.71), (s * (1.2 + fx * 1.5), 1.56, 0.87), 0.045, 0.03), ['hand' + side], 0.02, 'finger'))
    P.append(Part('tail', chain(tail, [0.5, 0.37, 0.25, 0.15, 0.08, 0.05]), ['tail1', 'tail2', 'tail3', 'tail4', 'tail5', 'tail6'], 0.25, 'tail'))
    tip_dir = math.atan2(0.3, -0.45)
    def arrow(p):  # flat diamond at the tail tip, turned to follow the tail
        q = p - np.array((1.3, 0.44, -4.12))
        c, s = math.cos(tip_dir), math.sin(tip_dir)
        x = c * q[..., 0] - s * q[..., 2]; z = s * q[..., 0] + c * q[..., 2]
        d2 = (np.abs(x) / 0.21 + np.abs(z) / 0.34) - 1.0
        return smax(d2 * 0.18, np.abs(q[..., 1]) - 0.045, 0.03)
    P.append(Part('arrow', arrow, ['tail6'], 0.04, 'tail'))
    C = Creature('skydrake', P, bones, (-1.55, -0.2, -4.5), (1.8, 4.95, 1.62), 0.019, LOD[0])
    def detail(p):
        x, y, z = p[..., 0], p[..., 1], p[..., 2]
        ph = np.abs(((y + 0.18 * x * x) % 0.21) - 0.105)
        g = (1 - sstep(0.0, 0.026, ph)) * 0.012
        front = sstep(0.05, 0.4, z - 0.15 * (y - 2)) * (1 - sstep(0.45, 0.62, np.abs(x)))
        neckf = sstep(-0.12, 0.12, z - (0.1 + 0.1 * np.sin((y - 2.8) * 2.0))) * sstep(2.6, 2.9, y) * (1 - sstep(4.05, 4.25, y)) * (1 - sstep(0.18, 0.3, np.abs(x)))
        return g * np.maximum(front * sstep(0.7, 1.0, y) * (1 - sstep(2.8, 3.0, y)), neckf)
    C.detail = detail
    ym = lambda z: 4.3 - 0.05 * np.clip((z - 0.5) / 0.75, 0, 1)
    C.jaw_split = lambda v: sstep(ym(v[:, 2]) + 0.025, ym(v[:, 2]) - 0.025, v[:, 1]) * sstep(0.3, 0.45, v[:, 2]) * sstep(3.95, 4.1, v[:, 1])
    base = lambda p: C.sdf(p, False)
    anch = {}
    for s, side in LR:
        e = march(base, (s * 0.165, 4.54, 3), (0, 0, -1))
        anch['eye' + side] = r5(e + np.array((0, 0, -0.035)))
        anch['eyeN' + side] = r5(grad(base, e))
        anch['horn' + side] = r5(march(base, (s * 0.14, 6, 0.3), (0, -1, 0)))
        anch['fang' + side] = r5(march(base, (s * 0.12, 4.3, 3), (0, 0, -1)) + np.array((0, -0.01, -0.05)))
    anch['nose'] = r5(march(base, (0, 4.39, 3), (0, 0, -1)))
    neck_pts = lerp_pts(neck[0], neck[1], 3) + lerp_pts(neck[1], neck[2], 3) + lerp_pts(neck[2], neck[3], 3) + lerp_pts(neck[3], (0, 4.5, 0.2), 2)
    back_pts = lerp_pts((0, 2.75, 0.05), (0, 1.6, -0.25), 5)
    tail_pts = lerp_pts(tail[0], tail[1], 3) + lerp_pts(tail[1], tail[2], 3) + lerp_pts(tail[2], tail[3], 3) + lerp_pts(tail[3], tail[4], 2) + lerp_pts(tail[4], tail[5], 1)
    pts = neck_pts + back_pts + tail_pts
    outs = [(0, 0.15, -1)] * len(neck_pts) + [(0, 0.15, -1)] * len(back_pts) + [(0, 1, -0.25)] * len(tail_pts)
    sizes = [0.16, 0.18, 0.2, 0.22, 0.23, 0.23, 0.22, 0.2, 0.19, 0.17, 0.15] + [0.25, 0.27, 0.28, 0.27, 0.25] + [0.24, 0.23, 0.22, 0.2, 0.18, 0.16, 0.13, 0.11, 0.09, 0.07, 0.06, 0.05]
    bn = ['neck1'] * 3 + ['neck2'] * 3 + ['neck3'] * 3 + ['neck4'] * 2 + ['chest', 'spine', 'spine', 'hips', 'hips'] + ['tail1'] * 3 + ['tail2'] * 3 + ['tail3'] * 3 + ['tail4'] * 2 + ['tail5']
    anch['spines'] = dorsal(base, pts, outs, sizes, bn)
    anch['spineCol'] = '#1f2a6b'
    claws = []
    for s, side in LR:
        for ox in (-0.17, -0.055, 0.06, 0.17):
            claws.append(claw(base, (s * 0.72 + ox * 1.25, 0.07, 0.5), (s * ox * 0.6, -0.35, 1), 0.11, 'toe' + side))
        for fx in (-0.06, 0.0, 0.06):
            claws.append(claw(base, (s * (1.2 + fx * 1.5), 1.56, 0.87), (s * fx, -1, 0.45), 0.075, 'hand' + side))
    anch['claws'] = claws
    anch['clawCol'] = '#1b2050'
    for s, side in LR:
        C.parts.append(Part('socket', sphere(anch['eye' + side], 0.082), [], 0.025, sub=True))
        C.parts.append(Part('nostril', sphere(np.array(anch['nose']) + np.array((s * 0.065, 0.03, -0.01)), 0.025), [], 0.012, sub=True))
        C.parts.append(Part('mouth', roundcone((0, 4.27, 1.25), (s * 0.22, 4.3, 0.5), 0.018, 0.014), [], 0.012, sub=True))
    def paint(v, N, gw):
        y, z, x = v[:, 1], v[:, 2], v[:, 0]
        Cc = np.tile(hexc('#3447b4'), (len(v), 1))
        back = sstep(0.1, -0.6, N[:, 2]) * (1 - gw.get('belly', 0) * 0.5)
        Cc = mix(Cc, '#24358f', back * 0.75)
        ven = (gw.get('belly', 0) + gw.get('torso', 0) * 0.8) * sstep(-0.05, 0.35, N[:, 2] + 0.15 - np.abs(x) * 0.5) * sstep(0.55, 0.9, y)
        ven += gw.get('neck', 0) * sstep(0.1, 0.45, N[:, 2]) * (1 - sstep(0.15, 0.3, np.abs(x)))
        ven += gw.get('jaw', 0) * sstep(-0.1, -0.5, N[:, 1])
        ven += gw.get('tail', 0) * sstep(-0.1, -0.55, N[:, 1])
        ven = np.clip(ven, 0, 1)
        Cc = mix(Cc, '#9bb2e0', ven)
        ph = np.abs(((y + 0.18 * x * x) % 0.21) - 0.105)
        Cc = mix(Cc, '#7690c6', (1 - sstep(0, 0.03, ph)) * ven * (y > 0.7) * 0.8)
        # restrained scale clusters on the thighs, shoulders, arms and tail
        nz = np.sin(x * 31) * np.sin(y * 29 + 1) * np.sin(z * 27 + 2)
        Cc = mix(Cc, '#2a3a98', sstep(0.42, 0.6, nz) * (gw.get('thigh', 0) + gw.get('arm', 0) * 0.6 + gw.get('torso', 0) * 0.3) * (1 - ven) * 0.7)
        Cc = mix(Cc, '#1b2050', gw.get('toe', 0) * sstep(0.4, 0.47, z) + gw.get('finger', 0) * sstep(1.64, 1.58, y))
        # the brow is a touch darker, the inside of the mouth dark red
        Cc = mix(Cc, '#28388f', gw.get('brow', 0) * 0.5)
        m = (np.abs(y - ym(z)) < 0.03) * (z > 0.45) * (gw.get('head', 0) + gw.get('jaw', 0))
        Cc = mix(Cc, '#4a1630', m * 0.8)
        return Cc, ven
    def masks(v, N, gw):
        bc = np.array((0, 1.5, 0.1))
        dv = norm(v - bc)
        bl = sstep(-0.4, 0.75, dv @ norm(np.array((0, -0.25, 1.0)))) * sstep(0.7, 1.1, v[:, 1]) * (1 - sstep(2.2, 2.6, v[:, 1]))
        bl *= np.clip(gw.get('belly', 0) * 1.3 + gw.get('torso', 0) * 0.6, 0, 1)
        bl *= 0.3 + 0.7 * np.exp(-((v - np.array((0, 1.45, 0.95))) ** 2 / np.array((0.8, 0.75, 1.2)) ** 2).sum(1))
        fat = np.clip(gw.get('belly', 0) + gw.get('torso', 0) * 0.85 + gw.get('thigh', 0) * 0.7 + gw.get('neck', 0) * 0.3 * (v[:, 1] < 3.2) + gw.get('arm', 0) * 0.3 + gw.get('tail', 0) * np.clip(1 - (-0.6 - v[:, 2]) / 1.2, 0, 0.6), 0, 1)
        core = lambda q: np.stack([np.zeros(len(q)), np.clip(q[:, 1], 1.2, 2.6), np.full(len(q), -0.05)], -1)
        return bl, fat, core, (0, 1.55, 0.0)
    return C, anch, paint, masks

# =========================================================================== B: Stormbelly / Heavyweight
def heavyweight():
    tail = [(0, 0.95, -0.75), (0, 0.58, -1.6), (0.1, 0.3, -2.35), (0.2, 0.17, -2.9), (0.25, 0.13, -3.2)]
    bones = [
        ('root', None, (0, 0, 0)), ('hips', 'root', (0, 1.05, -0.1)), ('spine', 'hips', (0, 1.68, -0.05)),
        ('chest', 'spine', (0, 2.15, 0.0)), ('neck', 'chest', (0, 2.38, 0.15)), ('head', 'neck', (0, 2.74, 0.36), (0, 2.78, 1.28)),
        ('jaw', 'head', (0, 2.56, 0.5), (0, 2.5, 1.25)),
        ('belly', 'hips', (0, 1.3, 0.95), (0, 1.1, 1.4)),
    ]
    bones += [('tail%d' % (i + 1), 'hips' if i == 0 else 'tail%d' % i, tail[i], (0.3, 0.12, -3.5) if i == 4 else None) for i in range(5)]
    bones += pair_bones('brow', (0.2, 3.07, 0.8), 'head', (0.22, 3.1, 0.95))
    bones += limb_bones(['thigh', 'shin', 'foot', 'toe'], [(0.8, 0.98, 0.0), (0.83, 0.55, 0.03), (0.85, 0.17, 0.12), (0.85, 0.11, 0.52)], 'hips', [None, None, None, (0.85, 0.09, 0.82)])
    bones += limb_bones(['arm', 'forearm', 'hand'], [(1.05, 2.22, 0.0), (1.62, 1.55, 0.0), (1.72, 1.05, 0.28)], 'chest', [None, None, (1.74, 0.76, 0.52)])
    bones += limb_bones(['wing1', 'wing2'], [(0.55, 2.38, -0.6), (1.0, 2.8, -0.8)], 'chest', [None, (1.5, 2.55, -0.85)])
    P = [
        Part('belly', ellipsoid((0, 1.33, 0.42), (1.18, 0.98, 0.97)), ['hips', 'spine'], 0, 'belly'),
        Part('lowbelly', ellipsoid((0, 1.0, 0.52), (0.98, 0.56, 0.8)), ['hips'], 0.32, 'belly'),
        Part('back', ellipsoid((0, 1.58, -0.2), (1.12, 1.05, 0.85)), ['hips', 'spine'], 0.35, 'torso'),
        Part('chest', ellipsoid((0, 2.1, 0.06), (0.98, 0.56, 0.64)), ['spine', 'chest'], 0.3, 'torso'),
        Part('neck', roundcone((0, 2.3, 0.1), (0, 2.68, 0.32), 0.63, 0.51), ['chest', 'neck', 'head'], 0.25, 'neck'),
        Part('skull', ellipsoid((0, 2.9, 0.45), (0.5, 0.42, 0.48)), ['head'], 0.14, 'head'),
        Part('snout', ellipsoid((0, 2.82, 0.92), (0.45, 0.23, 0.37)), ['head'], 0.12, 'head'),
        Part('nose', ellipsoid((0, 2.86, 1.18), (0.31, 0.15, 0.15)), ['head'], 0.06, 'head'),
        # a sagging, jutting lower jaw (underbite)
        Part('jaw', ellipsoid((0, 2.55, 0.97), (0.47, 0.16, 0.42)), ['jaw'], 0.035, 'jaw'),
        Part('chin', ellipsoid((0, 2.53, 1.03), (0.37, 0.11, 0.28)), ['jaw'], 0.06, 'jaw'),
    ]
    for s, side in LR:
        P += [
            Part('deltoid' + side, ellipsoid((s * 0.98, 2.24, 0.0), (0.46, 0.43, 0.44)), ['chest', 'arm' + side], 0.22, 'torso'),
            Part('browIn' + side, ellipsoid((s * 0.13, 3.04, 0.85), (0.13, 0.07, 0.14), tilt=-0.2), ['brow' + side], 0.05, 'brow'),
            Part('browOut' + side, ellipsoid((s * 0.3, 3.11, 0.74), (0.14, 0.07, 0.15), tilt=-0.3), ['brow' + side], 0.05, 'brow'),
            Part('cheek' + side, ellipsoid((s * 0.37, 2.66, 0.7), (0.23, 0.21, 0.25)), ['head', 'jaw'], 0.1, 'head'),
            Part('uarm' + side, roundcone((s * 1.05, 2.22, 0.0), (s * 1.62, 1.55, 0.0), 0.36, 0.27), ['arm' + side], 0.12, 'arm'),
            Part('bicep' + side, ellipsoid((s * 1.38, 1.92, 0.04), (0.3, 0.38, 0.3)), ['arm' + side], 0.1, 'arm'),
            Part('farm' + side, roundcone((s * 1.62, 1.55, 0.0), (s * 1.72, 1.08, 0.28), 0.27, 0.21), ['forearm' + side], 0.06, 'farm'),
            Part('fbulge' + side, ellipsoid((s * 1.69, 1.38, 0.1), (0.24, 0.3, 0.25)), ['forearm' + side], 0.08, 'farm'),
            Part('hand' + side, ellipsoid((s * 1.74, 0.97, 0.34), (0.19, 0.17, 0.2)), ['hand' + side], 0.05, 'hand'),
            Part('thigh' + side, ellipsoid((s * 0.82, 0.8, 0.0), (0.52, 0.6, 0.56)), ['thigh' + side], 0.2, 'thigh'),
            Part('shin' + side, roundcone((s * 0.82, 0.6, 0.02), (s * 0.85, 0.2, 0.08), 0.4, 0.34), ['thigh' + side, 'shin' + side], 0.1, 'leg'),
            Part('foot' + side, ellipsoid((s * 0.85, 0.13, 0.3), (0.38, 0.14, 0.47)), ['foot' + side, 'toe' + side], 0.08, 'leg'),
        ]
        for ox in (-0.2, 0.0, 0.2):
            P.append(Part('toe' + side, ellipsoid((s * 0.85 + ox, 0.11, 0.66), (0.11, 0.1, 0.13)), ['toe' + side], 0.04, 'toe'))
        for fx in (-0.1, 0.0, 0.1):
            P.append(Part('finger' + side, roundcone((s * (1.74 + fx), 0.9, 0.44), (s * (1.74 + fx * 1.3), 0.77, 0.54), 0.062, 0.046), ['hand' + side], 0.03, 'finger'))
    P.append(Part('tail', chain(tail, [0.62, 0.42, 0.25, 0.12, 0.06]), ['tail1', 'tail2', 'tail3', 'tail4', 'tail5'], 0.3, 'tail'))
    def spade(p):
        q = p - np.array((0.29, 0.12, -3.42))
        d2 = (np.abs(q[..., 0]) / 0.34 + np.abs(q[..., 2] + 0.05) / 0.36) - 1.0
        d3 = length(np.stack([q[..., 0] / 0.36, (q[..., 2] - 0.1) / 0.3], -1)) - 1.0
        return smax(np.minimum(d2, d3) * 0.2, np.abs(q[..., 1]) - 0.055, 0.03)
    P.append(Part('spade', spade, ['tail5'], 0.04, 'tail'))
    C = Creature('heavyweight', P, bones, (-2.2, -0.2, -3.95), (2.2, 3.5, 1.6), 0.018, LOD[0])
    def detail(p):  # deep, soft belly folds
        x, y, z = p[..., 0], p[..., 1], p[..., 2]
        ph = np.abs(((y + 0.12 * x * x) % 0.3) - 0.15)
        g = (1 - sstep(0.0, 0.055, ph)) * 0.02
        return g * sstep(0.1, 0.5, z) * (1 - sstep(0.75, 0.95, np.abs(x))) * sstep(0.5, 0.7, y) * (1 - sstep(1.95, 2.1, y))
    C.detail = detail
    ym = lambda z: 2.665 - 0.03 * np.clip((z - 0.6) / 0.6, 0, 1)
    C.jaw_split = lambda v: sstep(ym(v[:, 2]) + 0.03, ym(v[:, 2]) - 0.03, v[:, 1]) * sstep(0.4, 0.58, v[:, 2]) * sstep(2.2, 2.35, v[:, 1])
    base = lambda p: C.sdf(p, False)
    anch = {}
    for s, side in LR:
        e = march(base, (s * 0.25, 2.97, 3), (0, 0, -1))
        anch['eye' + side] = r5(e + np.array((0, 0, -0.04)))
        anch['eyeN' + side] = r5(grad(base, e))
        anch['horn' + side] = r5(march(base, (s * 0.34, 5, 0.3), (0, -1, 0)))
        # tusks grow up out of the jutting jaw, near its front corners
        anch['fang' + side] = r5(march(base, (s * 0.3, 2.7, 3), (0, 0, -1)) + np.array((0, -0.02, -0.06)))
    anch['nose'] = r5(march(base, (0, 2.9, 3), (0, 0, -1)))
    pts = lerp_pts((0, 3.25, 0.3), (0, 2.6, -0.2), 3) + lerp_pts((0, 2.4, -0.25), (0, 1.0, -0.75), 6) + lerp_pts(tail[0], tail[1], 3) + lerp_pts(tail[1], tail[2], 3) + lerp_pts(tail[2], tail[3], 2)
    outs = [(0, 1, -0.4)] * 3 + [(0, 0.3, -1)] * 6 + [(0, 1, -0.2)] * 8
    sizes = [0.15, 0.17, 0.19, 0.23, 0.24, 0.25, 0.25, 0.24, 0.23, 0.21, 0.19, 0.17, 0.15, 0.13, 0.11, 0.09, 0.08]
    bn = ['head', 'neck', 'neck', 'chest', 'chest', 'spine', 'spine', 'hips', 'hips'] + ['tail1'] * 3 + ['tail2'] * 3 + ['tail3'] * 2
    anch['spines'] = dorsal(base, pts, outs, sizes, bn)
    anch['spineCol'] = '#1d3260'
    claws = []
    for s, side in LR:
        for ox in (-0.2, 0.0, 0.2):
            claws.append(claw(base, (s * 0.85 + ox, 0.09, 0.78), (s * ox * 0.5, -0.3, 1), 0.14, 'toe' + side))
        for fx in (-0.1, 0.0, 0.1):
            claws.append(claw(base, (s * (1.74 + fx * 1.3), 0.75, 0.56), (s * fx * 0.6, -1, 0.5), 0.09, 'hand' + side))
    anch['claws'] = claws
    anch['clawCol'] = '#26262f'
    for s, side in LR:
        C.parts.append(Part('socket', sphere(anch['eye' + side], 0.09), [], 0.03, sub=True))
        C.parts.append(Part('nostril', sphere(np.array(anch['nose']) + np.array((s * 0.12, 0.03, -0.02)), 0.035), [], 0.015, sub=True))
        C.parts.append(Part('mouth', roundcone((0, 2.64, 1.36), (s * 0.45, 2.665, 0.66), 0.022, 0.018), [], 0.016, sub=True))
    def paint(v, N, gw):
        x, y, z = v[:, 0], v[:, 1], v[:, 2]
        Cc = np.tile(hexc('#2e6694'), (len(v), 1))
        Cc = mix(Cc, '#22507a', sstep(0.1, -0.6, N[:, 2]) * 0.6)
        ven = gw.get('belly', 0) * sstep(-0.1, 0.3, N[:, 2] + 0.2 - np.abs(x) * 0.35) * sstep(0.3, 0.55, y)
        ven += gw.get('jaw', 0) * sstep(-0.1, -0.5, N[:, 1]) + gw.get('neck', 0) * sstep(0.2, 0.6, N[:, 2]) * (1 - sstep(0.3, 0.45, np.abs(x)))
        ven += gw.get('tail', 0) * sstep(-0.1, -0.55, N[:, 1])
        ven = np.clip(ven, 0, 1)
        Cc = mix(Cc, '#a9bccb', ven)
        ph = np.abs(((y + 0.12 * x * x) % 0.3) - 0.15)
        Cc = mix(Cc, '#8399ad', (1 - sstep(0, 0.055, ph)) * ven * (y > 0.5) * (y < 2.0) * 0.7)
        nz = np.sin(x * 13 + 0.7) * np.sin(y * 11.5 + 0.2) * np.sin(z * 12.5 + 1.6) + 0.35 * np.sin(x * 23 + y * 19 + z * 7)
        Cc = mix(Cc, '#1c3a66', sstep(0.48, 0.58, nz) * (1 - ven) * (1 - gw.get('toe', 0)) * 0.85)
        Cc = mix(Cc, '#26262f', gw.get('finger', 0) * sstep(0.83, 0.77, y) + gw.get('toe', 0) * sstep(0.72, 0.8, z))
        Cc = mix(Cc, '#1f4a72', gw.get('brow', 0) * 0.5)
        m = (np.abs(y - ym(z)) < 0.035) * (z > 0.55) * (gw.get('head', 0) + gw.get('jaw', 0))
        Cc = mix(Cc, '#3c1426', m * 0.85)
        return Cc, ven
    def masks(v, N, gw):
        bc = np.array((0, 1.25, 0.2))
        dv = norm(v - bc)
        bl = sstep(-0.45, 0.75, dv @ norm(np.array((0, -0.2, 1.0)))) * sstep(0.3, 0.6, v[:, 1]) * (1 - sstep(1.85, 2.2, v[:, 1]))
        bl *= np.clip(gw.get('belly', 0) * 1.3 + gw.get('torso', 0) * 0.5, 0, 1)
        bl *= 0.3 + 0.7 * np.exp(-((v - np.array((0, 1.2, 1.25))) ** 2 / np.array((0.95, 0.85, 1.2)) ** 2).sum(1))
        fat = np.clip(gw.get('belly', 0) + gw.get('torso', 0) * 0.85 + gw.get('thigh', 0) * 0.7 + gw.get('neck', 0) * 0.7 + gw.get('arm', 0) * 0.4 + gw.get('head', 0) * 0.12 + gw.get('jaw', 0) * 0.5 + gw.get('tail', 0) * np.clip(1 - (-0.7 - v[:, 2]) / 1.2, 0, 0.6), 0, 1)
        core = lambda q: np.stack([np.zeros(len(q)), np.clip(q[:, 1], 0.8, 2.0), np.full(len(q), -0.1)], -1)
        return bl, fat, core, (0, 1.3, -0.05)
    return C, anch, paint, masks

# =========================================================================== C: Chomp Rex / Grin
# Chomp Rex head wedges: (z0, z1, half-width back, front, bottom back, front, top back, front, rounding)
RX_UP = (1.72, 3.06, 0.43, 0.31, 3.4, 3.4, 4.0, 3.8, 0.14)
RX_LO = (1.7, 2.96, 0.41, 0.29, 2.92, 3.02, 3.24, 3.24, 0.12)

def grin_teeth():
    """exact tooth positions around the lip outline of the two wedges (sides and front), evenly spaced"""
    rows = {}
    for name, W, y, inset in (('teethUp', RX_UP, RX_UP[4], 0.075), ('teethLo', RX_LO, RX_LO[6], 0.11)):
        z0, z1, w0, w1 = W[0], W[1], W[2], W[3]
        hw = lambda z: w0 + (w1 - w0) * (z - z0) / (z1 - z0) - inset
        zf = z1 - inset - 0.03
        path = []
        for z in np.linspace(1.98, zf, 9):
            path.append((-hw(z), z))
        for x in np.linspace(-hw(zf), hw(zf), 7)[1:-1]:
            path.append((x, zf + 0.02 * (1 - (x / hw(zf)) ** 2)))
        for z in np.linspace(zf, 1.98, 9):
            path.append((hw(z), z))
        out = []
        for i, (x, z) in enumerate(path):
            a = path[max(0, i - 1)]; b = path[min(len(path) - 1, i + 1)]
            tx, tz = b[0] - a[0], b[1] - a[1]
            l = math.hypot(tx, tz) or 1
            nx, nz = tz / l, -tx / l  # outward normal (path runs clockwise seen from above)
            front = 1 - min(1, abs(x) / 0.25) if z > zf - 0.05 else 0
            out.append(dict(p=r5((x, y, z)), d=r5((nx, 0, nz)), w=round(min(0.11, l * 0.46), 3), h=round(0.105 + 0.02 * front, 3)))
        rows[name] = out
    return rows

def chomprex():
    tail = [(0, 2.35, -0.9), (0, 2.22, -2.0), (0, 2.08, -3.0), (0, 2.02, -3.8), (0, 2.12, -4.4), (0, 2.3, -4.8)]
    bones = [
        ('root', None, (0, 0, 0)), ('hips', 'root', (0, 2.1, -0.35)), ('spine', 'hips', (0, 2.45, 0.45)),
        ('chest', 'spine', (0, 2.72, 1.05)), ('neck', 'chest', (0, 3.0, 1.35)), ('head', 'neck', (0, 3.6, 1.68), (0, 3.7, 3.05)),
        ('jaw', 'head', (0, 3.3, 1.7), (0, 3.12, 2.95)),
        ('belly', 'hips', (0, 1.8, 0.7), (0, 1.6, 1.0)),
    ]
    bones += [('tail%d' % (i + 1), 'hips' if i == 0 else 'tail%d' % i, tail[i], tail[5] if i == 4 else None) for i in range(5)]
    bones += pair_bones('brow', (0.3, 4.1, 2.15), 'head', (0.32, 4.12, 2.4))
    bones += limb_bones(['thigh', 'shin', 'ankle', 'toe'], [(0.56, 2.05, -0.3), (0.62, 1.42, -0.42), (0.64, 0.74, -0.72), (0.64, 0.15, -0.3)], 'hips', [None, None, None, (0.65, 0.08, 0.3)])
    bones += limb_bones(['arm', 'forearm', 'hand'], [(0.55, 2.62, 1.38), (0.74, 2.42, 1.7), (0.72, 2.3, 1.98)], 'chest', [None, None, (0.72, 2.15, 2.12)])
    P = [
        Part('torso', ellipsoid((0, 2.45, 0.35), (0.8, 0.88, 1.33), tilt=-0.28), ['hips', 'spine', 'chest'], 0, 'torso'),
        Part('belly', ellipsoid((0, 2.18, 0.6), (0.74, 0.74, 1.02), tilt=-0.3), ['hips', 'spine'], 0.3, 'belly'),
        Part('chest', ellipsoid((0, 2.78, 1.0), (0.64, 0.64, 0.62)), ['spine', 'chest'], 0.3, 'torso'),
        Part('neck', roundcone((0, 2.86, 1.15), (0, 3.4, 1.66), 0.62, 0.52), ['chest', 'neck', 'head'], 0.25, 'neck'),
        # an angular wedge head (flat lip planes) with a clenched grin between snout and jaw
        Part('skull', ellipsoid((0, 3.76, 1.72), (0.56, 0.5, 0.58)), ['head'], 0.15, 'head'),
        Part('snout', wedge(*RX_UP), ['head'], 0.14, 'head'),
        Part('nose', ellipsoid((0, 3.83, 2.98), (0.27, 0.13, 0.13)), ['head'], 0.07, 'head'),
        Part('jaw', wedge(*RX_LO), ['jaw'], 0.02, 'jaw'),
        Part('chin', ellipsoid((0, 3.02, 2.62), (0.3, 0.12, 0.28)), ['jaw'], 0.06, 'jaw'),
        Part('tail', chain(tail, [0.66, 0.46, 0.3, 0.17, 0.08, 0.04]), ['tail1', 'tail2', 'tail3', 'tail4', 'tail5'], 0.3, 'tail'),
    ]
    for s, side in LR:
        P += [
            Part('haunch' + side, ellipsoid((s * 0.56, 2.05, -0.3), (0.52, 0.86, 0.78)), ['thigh' + side], 0.25, 'thigh'),
            Part('shin' + side, roundcone((s * 0.62, 1.55, -0.38), (s * 0.64, 0.76, -0.72), 0.33, 0.18), ['thigh' + side, 'shin' + side], 0.12, 'leg'),
            Part('meta' + side, roundcone((s * 0.64, 0.76, -0.72), (s * 0.64, 0.17, -0.32), 0.17, 0.14), ['ankle' + side], 0.08, 'leg'),
            Part('browIn' + side, ellipsoid((s * 0.19, 4.02, 2.24), (0.14, 0.07, 0.19), tilt=0.25), ['brow' + side], 0.06, 'brow'),
            Part('browOut' + side, ellipsoid((s * 0.37, 4.07, 2.04), (0.14, 0.07, 0.2), tilt=0.4), ['brow' + side], 0.06, 'brow'),
            # cheeks bridge the jaw hinge so the corners of the grin are closed
            Part('cheek' + side, ellipsoid((s * 0.42, 3.36, 1.8), (0.19, 0.28, 0.26)), ['head', 'jaw'], 0.1, 'head'),
            Part('uarm' + side, roundcone((s * 0.55, 2.62, 1.38), (s * 0.74, 2.42, 1.7), 0.13, 0.1), ['arm' + side], 0.06, 'arm'),
            Part('farm' + side, roundcone((s * 0.74, 2.42, 1.7), (s * 0.72, 2.3, 1.98), 0.1, 0.08), ['forearm' + side], 0.04, 'farm'),
            Part('hand' + side, sphere((s * 0.72, 2.28, 2.01), 0.075), ['hand' + side], 0.03, 'hand'),
        ]
        for ox in (-0.15, 0.0, 0.15):
            P.append(Part('toe' + side, roundcone((s * 0.64 + ox * 0.6, 0.16, -0.28), (s * 0.64 + ox * 1.8, 0.085, 0.26), 0.11, 0.075), ['toe' + side], 0.04, 'toe'))
        for fx in (-0.035, 0.035):
            P.append(Part('finger' + side, roundcone((s * (0.72 + fx), 2.26, 2.05), (s * (0.72 + fx), 2.13, 2.14), 0.03, 0.02), ['hand' + side], 0.015, 'finger'))
    C = Creature('chomprex', P, bones, (-1.25, -0.2, -5.0), (1.25, 4.45, 3.5), 0.019, LOD[0])
    ym = lambda z: 3.32 + 0 * z
    C.jaw_split = lambda v: sstep(3.35, 3.29, v[:, 1]) * sstep(1.5, 1.72, v[:, 2]) * sstep(2.7, 2.85, v[:, 1])
    base = lambda p: C.sdf(p, False)
    anch = {}
    # the grin: upper-lip and lower-lip edges around the snout, front and sides
    anch.update(grin_teeth())
    for s, side in LR:
        e = march(base, (s * 0.33, 3.97, 4.5), (0, 0, -1))
        anch['eye' + side] = r5(e + np.array((0, 0, -0.045)))
        anch['eyeN' + side] = r5(grad(base, e))
    anch['nose'] = r5(march(base, (0, 3.84, 4.5), (0, 0, -1)))
    pts = lerp_pts((0, 4.15, 1.75), (0, 3.6, 1.2), 3) + lerp_pts((0, 3.3, 1.0), (0, 2.6, -0.3), 5) + lerp_pts(tail[0], tail[1], 3) + lerp_pts(tail[1], tail[2], 3) + lerp_pts(tail[2], tail[3], 3) + lerp_pts(tail[3], tail[4], 2)
    outs = [(0, 1, -0.35)] * 3 + [(0, 1, -0.3)] * 5 + [(0, 1, 0)] * 11
    sizes = [0.14, 0.17, 0.2, 0.22, 0.24, 0.25, 0.25, 0.24, 0.23, 0.21, 0.19, 0.17, 0.15, 0.13, 0.11, 0.1, 0.08, 0.07, 0.06]
    bn = ['head', 'neck', 'neck', 'chest', 'chest', 'spine', 'spine', 'hips'] + ['tail1'] * 3 + ['tail2'] * 3 + ['tail3'] * 3 + ['tail4'] * 2
    anch['spines'] = dorsal(base, pts, outs, sizes, bn)
    anch['spineCol'] = '#2a1f2a'
    claws = []
    for s, side in LR:
        for ox in (-0.15, 0.0, 0.15):
            claws.append(claw(base, (s * 0.64 + ox * 1.8, 0.085, 0.26), (s * ox * 0.6, -0.3, 1), 0.2, 'toe' + side))
        for fx in (-0.035, 0.035):
            claws.append(claw(base, (s * (0.72 + fx), 2.13, 2.14), (0, -1, 0.6), 0.06, 'hand' + side))
    anch['claws'] = claws
    anch['clawCol'] = '#221a22'
    for s, side in LR:
        C.parts.append(Part('socket', sphere(anch['eye' + side], 0.085), [], 0.03, sub=True))
        C.parts.append(Part('nostril', sphere(np.array(anch['nose']) + np.array((s * 0.13, 0.02, -0.02)), 0.04), [], 0.015, sub=True))
    # dark throat at the back of the grin so the gap reads as a mouth
    C.parts.append(Part('throat', ellipsoid((0, 3.32, 2.1), (0.3, 0.05, 0.5)), [], 0.03, sub=True))
    def paint(v, N, gw):
        x, y, z = v[:, 0], v[:, 1], v[:, 2]
        Cc = np.tile(hexc('#6b3560'), (len(v), 1))
        Cc = mix(Cc, '#4f2347', sstep(0.0, 0.7, N[:, 1]) * (1 - gw.get('head', 0) * 0.4) * 0.6)
        ven = (gw.get('belly', 0) + gw.get('torso', 0) * 0.7 + gw.get('neck', 0) * 0.8) * sstep(-0.05, -0.5, N[:, 1] - 0.45 * N[:, 2]) * (z > -0.9)
        ven += gw.get('jaw', 0) * sstep(0.05, -0.35, N[:, 1])
        ven += gw.get('tail', 0) * sstep(-0.15, -0.6, N[:, 1])
        ven = np.clip(ven, 0, 1)
        Cc = mix(Cc, '#d9a24c', ven)
        # big round spots, like the concept
        nz = np.sin(x * 7 + 0.7) * np.sin(y * 6.5 + 0.2) * np.sin(z * 7.5 + 1.6) + 0.25 * np.sin(x * 17 + y * 13 + z * 5)
        Cc = mix(Cc, '#3f1a3a', sstep(0.5, 0.58, nz) * (1 - ven) * (1 - gw.get('toe', 0)) * 0.85)
        Cc = mix(Cc, '#221a22', gw.get('toe', 0) * sstep(0.12, 0.2, z) + gw.get('finger', 0) * sstep(2.18, 2.14, y))
        Cc = mix(Cc, '#55284d', gw.get('brow', 0) * 0.6)
        # gums and the inside of the grin
        inner = (np.abs(y - 3.32) < 0.12) * (z > 1.6) * ((gw.get('head', 0) * (N[:, 1] < -0.55)) + (gw.get('jaw', 0) * (N[:, 1] > 0.55)))
        Cc = mix(Cc, '#5a1a2c', np.clip(inner, 0, 1))
        return Cc, ven
    def masks(v, N, gw):
        bc = np.array((0, 2.25, 0.4))
        dv = norm(v - bc)
        bl = sstep(-0.3, 0.8, dv @ norm(np.array((0, -1.0, 0.25)))) * np.clip(gw.get('belly', 0) * 1.2 + gw.get('torso', 0) * 0.4, 0, 1)
        fat = np.clip(gw.get('belly', 0) * 0.8 + gw.get('torso', 0) * 0.6, 0, 1)
        core = lambda q: np.stack([np.zeros(len(q)), np.full(len(q), 2.4), np.clip(q[:, 2], -0.8, 1.2)], -1)
        return bl, fat, core, (0, 2.4, 0.4)
    return C, anch, paint, masks

CREATURES = dict(skydrake=skydrake, heavyweight=heavyweight, chomprex=chomprex)

def attributes(C, v, f, anch, paint, masks):
    N = vnormals(v, f)
    Wb, gw = skin(C, v, f)
    bl, fat, core, bc = masks(v, N, gw)
    fdir, bl = grow_dirs(v, f, N, bl, core, bc)
    # the belly bone carries the belly (secondary motion in the exported clips)
    BI = {b[0]: i for i, b in enumerate(C.bones)}
    if 'belly' in BI:
        take = np.clip(bl * 0.7, 0, 0.7)
        for b in ('hips', 'spine'):
            if b in BI:
                Wb[:, BI['belly']] += Wb[:, BI[b]] * take
                Wb[:, BI[b]] *= 1 - take
    skI, skW = finalize_weights(Wb)
    col, _ = paint(v, N, gw)
    ao = bake_ao(C, v, N)
    col = col * (0.42 + 0.58 * ao)[:, None]
    return skI, skW, bl, fat, fdir, col, N

def build(name):
    print(name)
    C, anch, paint, masks = CREATURES[name]()
    vf, ff = mesh(C)
    dy = -float(vf[:, 1].min())  # stand on y = 0
    out = None
    for i, tris in enumerate(LOD):
        v, f = decimate(C, vf, ff, tris)
        skI, skW, bl, fat, fdir, col, N = attributes(C, v, f, anch, paint, masks)
        # UV-unwrap the game mesh and bake colour + normal maps from the true surface
        res = TEX[i]
        vm, f2, uv = unwrap(v, f, res)
        print('  unwrapped: %d -> %d verts (UV seams)' % (len(v), len(vm)))
        cmap, nmap = bake(C, v[vm], f2, uv, N[vm], paint, res, SCALES[name])
        e = encode(C, v[vm], f2, col[vm], skI[vm], skW[vm], bl[vm], fat[vm], fdir[vm], anch, dict(tris=len(f2)), dy=dy)
        e['uv'] = base64.b64encode(np.round(np.clip(uv, 0, 1) * 65535).astype(np.uint16).tobytes()).decode()
        e['nrm'] = base64.b64encode(np.round(N[vm] * 127).astype(np.int8).tobytes()).decode()
        e['tex'] = dict(map=img_uri(cmap, q=88), normal=img_uri(nmap * 0.5 + 0.5, q=92), size=res)
        if i == 0:
            out = e
        else:
            out['lod1'] = {k: e[k] for k in ('count', 'lo', 'hi', 'pos', 'idx', 'idx32', 'col', 'skI', 'skW', 'belly', 'fat', 'fdir', 'tris', 'uv', 'nrm', 'tex')}
    out['dy'] = round(dy, 5)
    print('  stands at +%.3f m' % dy)
    return out

if __name__ == '__main__':
    names = sys.argv[1:] or list(CREATURES)
    old = {}
    if os.path.exists(OUT):
        t = open(OUT).read()
        old = json.loads(t[t.index('{'):t.rindex('}') + 1])
    for n in names:
        old[n] = build(n)
    with open(OUT, 'w') as fh:
        fh.write('/* Cloud Utopia monsters: sculpted skinned bodies (lod0 + lod1), written by tools/sculpt_cast.py (do not edit by hand) */\n')
        fh.write('window.CAST_MODELS = ' + json.dumps(old, separators=(',', ':')) + ';\n')
    print('wrote', OUT, '%.0f KB' % (os.path.getsize(OUT) / 1024))
