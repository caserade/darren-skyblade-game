"""
Sculpts the three Cloud Utopia monsters from Michael's approved concept sheets (docs/art/cast/):
  A  skydrake     Stormbelly / Sky Drake    tall S-neck, wedge snout, gold zigzag horns, big hanging belly, bat wings
  B  heavyweight  Stormbelly / Heavyweight  low broad trapezoid, enormous belly, short neck, tiny wings, spade tail
  C  chomprex     Chomp Rex / Grin          plum T-rex, golden underside, huge wedge head and toothy grin, 2 fingers
and writes assets/cast_models.js (window.CAST_MODELS). Each body is one seamless skinned surface; the small
parts (eyes, lids, horns, back spines, wings, teeth, claws) are built in src/cast.js at the anchors found here.

Run:  python3 tools/sculpt_cast.py [skydrake heavyweight chomprex]      (numpy, scipy, scikit-image, pyfqmr)
Units are metres, +y up, +z is the creature's front, +x its left.
"""
import json, math, os, sys
import numpy as np
from sculpt_lib import *

OUT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'cast_models.js')
LR = ((1, 'L'), (-1, 'R'))

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

def dorsal(C, f, pts, outs, sizes, bones):
    """back spines: march onto the surface from outside along each 'out' direction"""
    res = []
    for p, o, sz, b in zip(pts, outs, sizes, bones):
        o = np.array(o, float); o /= np.linalg.norm(o)
        h = march(f, np.array(p) + o * 3.0, -o)
        if h is None:
            continue
        n = grad(f, h)
        res.append(dict(p=r5(h), n=r5(n), s=round(float(sz), 3), b=b))
    return res

def lerp_pts(a, b, n):
    a = np.array(a, float); b = np.array(b, float)
    return [tuple(a + (b - a) * (i + 0.5) / n) for i in range(n)]

# =========================================================================== A: Stormbelly / Sky Drake
def skydrake():
    bones = [
        ('root', None, (0, 0, 0)), ('hips', 'root', (0, 1.6, -0.15)), ('spine', 'hips', (0, 2.3, 0.0)),
        ('chest', 'spine', (0, 2.72, 0.06)), ('neck1', 'chest', (0, 2.95, 0.1)), ('neck2', 'neck1', (0, 3.38, 0.18)),
        ('neck3', 'neck2', (0, 3.8, 0.04)), ('head', 'neck3', (0, 4.16, 0.2), (0, 4.24, 1.2)),
        ('jaw', 'head', (0, 4.13, 0.52), (0, 4.05, 1.12)),
        ('tail1', 'hips', (0, 1.45, -0.65)), ('tail2', 'tail1', (0, 1.0, -1.5)), ('tail3', 'tail2', (0.2, 0.6, -2.35)),
        ('tail4', 'tail3', (0.6, 0.38, -3.15)), ('tail5', 'tail4', (1.0, 0.42, -3.7), (1.3, 0.44, -4.15)),
    ]
    bones += limb_bones(['thigh', 'shin', 'ankle', 'toe'], [(0.62, 1.5, -0.05), (0.67, 0.95, -0.1), (0.68, 0.4, -0.38), (0.7, 0.12, 0.06)], 'hips', [None, None, None, (0.72, 0.08, 0.5)])
    bones += limb_bones(['arm', 'forearm', 'hand'], [(0.6, 2.6, 0.12), (0.95, 2.12, 0.38), (0.97, 1.76, 0.68)], 'chest', [None, None, (0.98, 1.5, 0.95)])
    bones += limb_bones(['wing1', 'wing2', 'wing3'], [(0.36, 2.86, -0.4), (1.15, 3.4, -0.72), (2.0, 3.2, -0.86)], 'chest', [None, None, (2.55, 2.45, -0.9)])
    P = [
        Part('torso', ellipsoid((0, 2.05, 0.05), (0.85, 1.0, 0.75)), ['hips', 'spine'], 0),
        Part('belly', ellipsoid((0, 1.6, 0.3), (0.94, 0.98, 0.84)), ['hips', 'spine'], 0.32, 'belly'),
        Part('lowbelly', ellipsoid((0, 1.22, 0.38), (0.8, 0.62, 0.7)), ['hips'], 0.3, 'belly'),
        Part('bum', ellipsoid((0, 1.5, -0.38), (0.74, 0.66, 0.6)), ['hips'], 0.25, 'torso'),
        Part('chest', ellipsoid((0, 2.68, 0.08), (0.58, 0.52, 0.5)), ['spine', 'chest'], 0.3, 'torso'),
        Part('neck', chain([(0, 2.85, 0.1), (0, 3.35, 0.2), (0, 3.8, 0.02), (0, 4.12, 0.12), (0, 4.24, 0.36)], [0.46, 0.34, 0.28, 0.25, 0.24]), ['chest', 'neck1', 'neck2', 'neck3', 'head'], 0.2, 'neck'),
        Part('head', ellipsoid((0, 4.3, 0.42), (0.3, 0.3, 0.36)), ['head'], 0.12, 'head'),
        Part('snout', roundcone((0, 4.31, 0.62), (0, 4.22, 1.22), 0.21, 0.12, 1.25, 0.8), ['head'], 0.1, 'head'),
        Part('nose', ellipsoid((0, 4.25, 1.2), (0.15, 0.09, 0.09)), ['head'], 0.05, 'head'),
        Part('jaw', roundcone((0, 4.12, 0.5), (0, 4.06, 1.1), 0.15, 0.085, 1.35, 0.8), ['jaw'], 0.05, 'jaw'),
    ]
    for s, side in LR:
        P += [
            Part('brow' + side, ellipsoid((s * 0.15, 4.47, 0.62), (0.12, 0.065, 0.14), tilt=-0.35), ['head'], 0.05, 'head'),
            Part('cheek' + side, ellipsoid((s * 0.2, 4.19, 0.55), (0.13, 0.12, 0.16)), ['head'], 0.07, 'head'),
            Part('thigh' + side, ellipsoid((s * 0.66, 1.25, -0.02), (0.48, 0.62, 0.55)), ['thigh' + side], 0.18, 'thigh'),
            Part('shin' + side, roundcone((s * 0.67, 0.95, -0.1), (s * 0.68, 0.4, -0.38), 0.3, 0.17), ['thigh' + side, 'shin' + side], 0.1, 'leg'),
            Part('ankle' + side, roundcone((s * 0.68, 0.4, -0.38), (s * 0.7, 0.13, 0.06), 0.16, 0.14), ['ankle' + side], 0.07, 'leg'),
            Part('uarm' + side, roundcone((s * 0.6, 2.6, 0.12), (s * 0.95, 2.12, 0.38), 0.18, 0.13), ['arm' + side], 0.1, 'arm'),
            Part('farm' + side, roundcone((s * 0.95, 2.12, 0.38), (s * 0.97, 1.78, 0.68), 0.13, 0.1), ['forearm' + side], 0.05, 'arm'),
            Part('hand' + side, ellipsoid((s * 0.97, 1.72, 0.72), (0.11, 0.1, 0.1)), ['hand' + side], 0.04, 'hand'),
        ]
        for ox in (-0.13, 0.0, 0.13):
            P.append(Part('toe' + side, roundcone((s * 0.7 + ox, 0.12, 0.08), (s * 0.7 + ox * 1.7, 0.075, 0.46), 0.085, 0.055), ['toe' + side], 0.04, 'toe'))
        for fx in (-0.06, 0.0, 0.06):
            P.append(Part('finger' + side, roundcone((s * (0.97 + fx), 1.7, 0.76), (s * (0.97 + fx * 1.5), 1.5, 0.9), 0.045, 0.03), ['hand' + side], 0.02, 'finger'))
    P.append(Part('tail', chain([(0, 1.45, -0.65), (0, 1.0, -1.5), (0.2, 0.6, -2.35), (0.6, 0.38, -3.15), (1.0, 0.42, -3.7), (1.18, 0.44, -3.98)], [0.5, 0.36, 0.24, 0.14, 0.07, 0.05]), ['tail1', 'tail2', 'tail3', 'tail4', 'tail5'], 0.25, 'tail'))
    tip_dir = math.atan2(0.3, -0.45)
    def arrow(p):  # flat diamond at the tail tip, turned to follow the tail
        q = p - np.array((1.28, 0.44, -4.12))
        c, s = math.cos(tip_dir), math.sin(tip_dir)
        x = c * q[..., 0] - s * q[..., 2]; z = s * q[..., 0] + c * q[..., 2]
        d2 = (np.abs(x) / 0.2 + np.abs(z) / 0.32) - 1.0
        return smax(d2 * 0.18, np.abs(q[..., 1]) - 0.045, 0.03)
    P.append(Part('arrow', arrow, ['tail5'], 0.04, 'tail'))
    C = Creature('skydrake', P, bones, (-1.45, -0.2, -4.5), (1.75, 4.78, 1.55), 0.026, 34000)
    def detail(p):
        # pale segmented underside: soft grooves across the front of the belly and up the throat
        x, y, z = p[..., 0], p[..., 1], p[..., 2]
        ph = np.abs(((y + 0.18 * x * x) % 0.21) - 0.105)
        g = (1 - sstep(0.0, 0.026, ph)) * 0.011
        front = sstep(0.05, 0.4, z - 0.15 * (y - 2)) * (1 - sstep(0.45, 0.62, np.abs(x)))
        neckf = sstep(-0.1, 0.12, z - (0.1 + 0.08 * np.sin((y - 2.8) * 2.2))) * sstep(2.6, 2.9, y) * (1 - sstep(3.9, 4.1, y)) * (1 - sstep(0.18, 0.3, np.abs(x)))
        return g * np.maximum(front * sstep(0.7, 1.0, y) * (1 - sstep(2.8, 3.0, y)), neckf)
    C.detail = detail
    base = lambda p: C.sdf(p, False)
    anch = {}
    for s, side in LR:
        e = march(base, (s * 0.165, 4.38, 3), (0, 0, -1))
        anch['eye' + side] = r5(e + np.array((0, 0, -0.035)))
        anch['eyeN' + side] = r5(grad(base, e))
        hb = march(base, (s * 0.13, 6, 0.38), (0, -1, 0))
        anch['horn' + side] = r5(hb)
        anch['fang' + side] = r5(march(base, (s * 0.12, 4.12, 3), (0, 0, -1)) + np.array((0, -0.01, -0.05)))
    anch['nose'] = r5(march(base, (0, 4.27, 3), (0, 0, -1)))
    neck_pts = lerp_pts((0, 2.95, 0.1), (0, 3.4, 0.18), 3) + lerp_pts((0, 3.4, 0.18), (0, 3.8, 0.04), 3) + lerp_pts((0, 3.8, 0.04), (0, 4.2, 0.2), 2)
    back_pts = lerp_pts((0, 2.75, 0.05), (0, 1.6, -0.25), 5)
    tail_pts = lerp_pts((0, 1.45, -0.65), (0, 1.0, -1.5), 3) + lerp_pts((0, 1.0, -1.5), (0.2, 0.6, -2.35), 3) + lerp_pts((0.2, 0.6, -2.35), (0.6, 0.38, -3.15), 3) + lerp_pts((0.6, 0.38, -3.15), (1.0, 0.42, -3.7), 2)
    pts = neck_pts + back_pts + tail_pts
    outs = [(0, 0.1, -1)] * len(neck_pts) + [(0, 0.15, -1)] * len(back_pts) + [(0, 1, -0.25)] * len(tail_pts)
    sizes = [0.13, 0.15, 0.17, 0.18, 0.18, 0.17, 0.16, 0.14] + [0.2, 0.22, 0.23, 0.22, 0.2] + [0.2, 0.19, 0.18, 0.16, 0.15, 0.13, 0.11, 0.1, 0.08, 0.07, 0.06]
    bn = ['neck1'] * 3 + ['neck2'] * 3 + ['neck3'] * 2 + ['chest', 'spine', 'spine', 'hips', 'hips'] + ['tail1'] * 3 + ['tail2'] * 3 + ['tail3'] * 3 + ['tail4'] * 2
    anch['spines'] = dorsal(C, base, pts, outs, sizes, bn)
    anch['spineCol'] = '#1f2a6b'
    for s, side in LR:
        C.parts.append(Part('socket', sphere(anch['eye' + side], 0.082), [], 0.025, sub=True))
        C.parts.append(Part('nostril', sphere(np.array(anch['nose']) + np.array((s * 0.065, 0.03, -0.01)), 0.025), [], 0.012, sub=True))
        C.parts.append(Part('mouth', roundcone((0, 4.155, 1.24), (s * 0.23, 4.2, 0.62), 0.02, 0.016), [], 0.014, sub=True))
    def paint(v, N, gw):
        y, z, x = v[:, 1], v[:, 2], v[:, 0]
        Cc = np.tile(hexc('#3447b4'), (len(v), 1))
        back = sstep(0.1, -0.6, N[:, 2]) * (1 - gw.get('belly', 0) * 0.5)
        Cc = mix(Cc, '#263687', back * 0.75)
        # pale cloudy-blue underside, continuous from the chin down the belly and under the tail
        ven = (gw.get('belly', 0) + gw.get('torso', 0) * 0.8) * sstep(-0.05, 0.35, N[:, 2] + 0.15 - np.abs(x) * 0.5) * sstep(0.55, 0.9, y)
        ven += gw.get('neck', 0) * sstep(0.1, 0.45, N[:, 2]) * (1 - sstep(0.15, 0.3, np.abs(x)))
        ven += gw.get('jaw', 0) * sstep(-0.1, -0.5, N[:, 1])
        ven += gw.get('tail', 0) * sstep(-0.1, -0.55, N[:, 1])
        Cc = mix(Cc, '#9bb2e0', np.clip(ven, 0, 1))
        ph = np.abs(((y + 0.18 * x * x) % 0.21) - 0.105)
        Cc = mix(Cc, '#8fa7d6', (1 - sstep(0, 0.03, ph)) * np.clip(ven, 0, 1) * (y > 0.7) * 0.8)
        # restrained scale clusters on the thighs and shoulders
        nz = np.sin(x * 31) * np.sin(y * 29 + 1) * np.sin(z * 27 + 2)
        Cc = mix(Cc, '#2c3d9c', sstep(0.45, 0.6, nz) * (gw.get('thigh', 0) + gw.get('arm', 0) * 0.6) * 0.6)
        claw = gw.get('toe', 0) * sstep(0.36, 0.44, z) + gw.get('finger', 0) * sstep(1.62, 1.55, y)
        Cc = mix(Cc, '#1b2050', claw)
        return Cc
    def masks(v, N, gw):
        bc = np.array((0, 1.5, 0.1))
        dv = norm(v - bc)
        bl = sstep(-0.4, 0.75, dv @ norm(np.array((0, -0.25, 1.0)))) * sstep(0.7, 1.1, v[:, 1]) * (1 - sstep(2.2, 2.6, v[:, 1]))
        bl *= np.clip(gw.get('belly', 0) * 1.3 + gw.get('torso', 0) * 0.6, 0, 1)
        dome = np.exp(-((v - np.array((0, 1.45, 0.95))) ** 2 / np.array((0.8, 0.75, 1.2)) ** 2).sum(1))
        bl *= 0.3 + 0.7 * dome
        fat = np.clip(gw.get('belly', 0) + gw.get('torso', 0) * 0.85 + gw.get('thigh', 0) * 0.7 + gw.get('neck', 0) * 0.3 * (v[:, 1] < 3.2) + gw.get('arm', 0) * 0.3 + gw.get('tail', 0) * np.clip(1 - (-0.6 - v[:, 2]) / 1.2, 0, 0.6), 0, 1)
        core = lambda q: np.stack([np.zeros(len(q)), np.clip(q[:, 1], 1.2, 2.6), np.full(len(q), -0.05)], -1)
        return bl, fat, core, (0, 1.55, 0.0)
    return C, anch, paint, masks

# =========================================================================== B: Stormbelly / Heavyweight
def heavyweight():
    bones = [
        ('root', None, (0, 0, 0)), ('hips', 'root', (0, 1.0, -0.1)), ('spine', 'hips', (0, 1.65, -0.05)),
        ('chest', 'spine', (0, 2.15, 0.0)), ('neck', 'chest', (0, 2.38, 0.15)), ('head', 'neck', (0, 2.72, 0.35), (0, 2.75, 1.25)),
        ('jaw', 'head', (0, 2.56, 0.55), (0, 2.45, 1.15)),
        ('tail1', 'hips', (0, 0.9, -0.75)), ('tail2', 'tail1', (0, 0.55, -1.6)), ('tail3', 'tail2', (0.1, 0.28, -2.4)),
        ('tail4', 'tail3', (0.2, 0.16, -2.95), (0.3, 0.12, -3.5)),
    ]
    bones += limb_bones(['thigh', 'shin', 'foot'], [(0.78, 0.95, 0.0), (0.81, 0.52, 0.03), (0.83, 0.16, 0.12)], 'hips', [None, None, (0.84, 0.1, 0.72)])
    bones += limb_bones(['arm', 'forearm', 'hand'], [(1.05, 2.2, 0.0), (1.35, 1.5, 0.18), (1.32, 0.98, 0.42)], 'chest', [None, None, (1.3, 0.72, 0.62)])
    bones += limb_bones(['wing1', 'wing2'], [(0.55, 2.38, -0.6), (1.0, 2.8, -0.8)], 'chest', [None, (1.5, 2.55, -0.85)])
    P = [
        Part('belly', ellipsoid((0, 1.36, 0.4), (1.18, 1.04, 0.96)), ['hips', 'spine'], 0, 'belly'),
        Part('lowbelly', ellipsoid((0, 1.0, 0.5), (0.98, 0.56, 0.8)), ['hips'], 0.32, 'belly'),
        Part('back', ellipsoid((0, 1.55, -0.2), (1.12, 1.05, 0.85)), ['hips', 'spine'], 0.35, 'torso'),
        Part('chest', ellipsoid((0, 2.08, 0.05), (0.98, 0.56, 0.64)), ['spine', 'chest'], 0.3, 'torso'),
        Part('neck', roundcone((0, 2.28, 0.1), (0, 2.66, 0.32), 0.62, 0.5), ['chest', 'neck', 'head'], 0.25, 'neck'),
        Part('head', ellipsoid((0, 2.86, 0.45), (0.5, 0.42, 0.48)), ['head'], 0.14, 'head'),
        Part('snout', ellipsoid((0, 2.78, 0.93), (0.45, 0.26, 0.37)), ['head'], 0.12, 'head'),
        Part('nose', ellipsoid((0, 2.82, 1.18), (0.3, 0.16, 0.15)), ['head'], 0.06, 'head'),
        Part('jaw', ellipsoid((0, 2.5, 0.86), (0.45, 0.17, 0.4)), ['jaw'], 0.07, 'jaw'),
    ]
    for s, side in LR:
        P += [
            Part('shoulder' + side, ellipsoid((s * 0.95, 2.2, 0.0), (0.46, 0.43, 0.43)), ['chest', 'arm' + side], 0.22, 'torso'),
            Part('brow' + side, ellipsoid((s * 0.2, 3.08, 0.82), (0.18, 0.07, 0.15), tilt=-0.25), ['head'], 0.06, 'head'),
            Part('cheek' + side, ellipsoid((s * 0.36, 2.68, 0.7), (0.22, 0.2, 0.24)), ['head'], 0.1, 'head'),
            Part('uarm' + side, roundcone((s * 1.05, 2.2, 0.0), (s * 1.35, 1.5, 0.18), 0.36, 0.27), ['arm' + side], 0.12, 'arm'),
            Part('bicep' + side, ellipsoid((s * 1.22, 1.85, 0.1), (0.3, 0.38, 0.3)), ['arm' + side], 0.1, 'arm'),
            Part('farm' + side, roundcone((s * 1.35, 1.5, 0.18), (s * 1.32, 1.02, 0.42), 0.25, 0.21), ['forearm' + side], 0.06, 'arm'),
            Part('hand' + side, ellipsoid((s * 1.32, 0.92, 0.48), (0.2, 0.18, 0.19)), ['hand' + side], 0.05, 'hand'),
            Part('thigh' + side, ellipsoid((s * 0.8, 0.78, 0.0), (0.52, 0.6, 0.56)), ['thigh' + side], 0.2, 'thigh'),
            Part('shin' + side, roundcone((s * 0.8, 0.55, 0.02), (s * 0.83, 0.18, 0.08), 0.4, 0.34), ['thigh' + side, 'shin' + side], 0.1, 'leg'),
            Part('foot' + side, ellipsoid((s * 0.84, 0.13, 0.28), (0.38, 0.14, 0.46)), ['foot' + side], 0.08, 'leg'),
        ]
        for ox in (-0.2, 0.0, 0.2):
            P.append(Part('toe' + side, sphere((s * 0.84 + ox, 0.11, 0.66), 0.115), ['foot' + side], 0.04, 'toe'))
        for fx in (-0.09, 0.0, 0.09):
            P.append(Part('finger' + side, roundcone((s * (1.32 + fx), 0.86, 0.58), (s * (1.32 + fx * 1.3), 0.74, 0.66), 0.06, 0.045), ['hand' + side], 0.03, 'finger'))
    P.append(Part('tail', chain([(0, 0.9, -0.75), (0, 0.55, -1.6), (0.1, 0.28, -2.4), (0.2, 0.16, -2.95), (0.25, 0.13, -3.2)], [0.62, 0.42, 0.25, 0.12, 0.06]), ['tail1', 'tail2', 'tail3', 'tail4'], 0.3, 'tail'))
    def spade(p):
        q = p - np.array((0.29, 0.12, -3.42))
        d2 = (np.abs(q[..., 0]) / 0.34 + np.abs(q[..., 2] + 0.05) / 0.36) - 1.0
        d3 = length(np.stack([q[..., 0] / 0.36, (q[..., 2] - 0.1) / 0.3], -1)) - 1.0
        return smax(np.minimum(d2, d3) * 0.2, np.abs(q[..., 1]) - 0.055, 0.03)
    P.append(Part('spade', spade, ['tail4'], 0.04, 'tail'))
    C = Creature('heavyweight', P, bones, (-1.85, -0.2, -3.95), (1.85, 3.45, 1.55), 0.024, 34000)
    def detail(p):  # a few soft belly folds
        x, y, z = p[..., 0], p[..., 1], p[..., 2]
        ph = np.abs(((y + 0.12 * x * x) % 0.3) - 0.15)
        g = (1 - sstep(0.0, 0.05, ph)) * 0.014
        return g * sstep(0.1, 0.5, z) * (1 - sstep(0.75, 0.95, np.abs(x))) * sstep(0.4, 0.6, y) * (1 - sstep(1.9, 2.05, y))
    C.detail = detail
    base = lambda p: C.sdf(p, False)
    anch = {}
    for s, side in LR:
        e = march(base, (s * 0.25, 2.97, 3), (0, 0, -1))
        anch['eye' + side] = r5(e + np.array((0, 0, -0.04)))
        anch['eyeN' + side] = r5(grad(base, e))
        anch['horn' + side] = r5(march(base, (s * 0.32, 5, 0.32), (0, -1, 0)))
        anch['fang' + side] = r5(march(base, (s * 0.3, 2.62, 3), (0, 0, -1)) + np.array((0, 0.02, -0.04)))
    anch['nose'] = r5(march(base, (0, 2.86, 3), (0, 0, -1)))
    pts = lerp_pts((0, 3.2, 0.3), (0, 2.6, -0.2), 3) + lerp_pts((0, 2.4, -0.25), (0, 1.0, -0.75), 6) + lerp_pts((0, 0.9, -0.75), (0, 0.55, -1.6), 3) + lerp_pts((0, 0.55, -1.6), (0.1, 0.28, -2.4), 3) + lerp_pts((0.1, 0.28, -2.4), (0.2, 0.16, -2.95), 2)
    outs = [(0, 1, -0.4)] * 3 + [(0, 0.3, -1)] * 6 + [(0, 1, -0.2)] * 8
    sizes = [0.13, 0.15, 0.17, 0.2, 0.21, 0.22, 0.22, 0.21, 0.2, 0.19, 0.17, 0.15, 0.13, 0.11, 0.1, 0.08, 0.07]
    bn = ['head', 'neck', 'neck', 'chest', 'chest', 'spine', 'spine', 'hips', 'hips'] + ['tail1'] * 3 + ['tail2'] * 3 + ['tail3'] * 2
    anch['spines'] = dorsal(C, base, pts, outs, sizes, bn)
    anch['spineCol'] = '#1d3260'
    for s, side in LR:
        C.parts.append(Part('socket', sphere(anch['eye' + side], 0.09), [], 0.03, sub=True))
        C.parts.append(Part('nostril', sphere(np.array(anch['nose']) + np.array((s * 0.12, 0.03, -0.02)), 0.035), [], 0.015, sub=True))
        C.parts.append(Part('mouth', roundcone((0, 2.6, 1.3), (s * 0.44, 2.6, 0.74), 0.024, 0.02), [], 0.016, sub=True))
    def paint(v, N, gw):
        x, y, z = v[:, 0], v[:, 1], v[:, 2]
        Cc = np.tile(hexc('#2e6694'), (len(v), 1))
        back = sstep(0.1, -0.6, N[:, 2])
        Cc = mix(Cc, '#22507a', back * 0.6)
        ven = (gw.get('belly', 0)) * sstep(-0.1, 0.3, N[:, 2] + 0.2 - np.abs(x) * 0.35) * sstep(0.25, 0.5, y)
        ven += gw.get('jaw', 0) * sstep(-0.1, -0.5, N[:, 1]) + gw.get('neck', 0) * sstep(0.2, 0.6, N[:, 2]) * (1 - sstep(0.3, 0.45, np.abs(x)))
        ven += gw.get('tail', 0) * sstep(-0.1, -0.55, N[:, 1])
        ven = np.clip(ven, 0, 1)
        Cc = mix(Cc, '#a9bccb', ven)
        ph = np.abs(((y + 0.12 * x * x) % 0.3) - 0.15)
        Cc = mix(Cc, '#8ea3b6', (1 - sstep(0, 0.05, ph)) * ven * (y > 0.45) * (y < 2.0) * 0.7)
        # cobalt freckles everywhere but the belly
        nz = np.sin(x * 13 + 0.7) * np.sin(y * 11.5 + 0.2) * np.sin(z * 12.5 + 1.6) + 0.35 * np.sin(x * 23 + y * 19 + z * 7)
        Cc = mix(Cc, '#1c3a66', sstep(0.48, 0.58, nz) * (1 - ven) * (1 - gw.get('toe', 0)) * 0.85)
        Cc = mix(Cc, '#2a2a35', gw.get('finger', 0) * sstep(0.85, 0.78, y) + gw.get('toe', 0) * sstep(0.7, 0.78, z))
        return Cc
    def masks(v, N, gw):
        bc = np.array((0, 1.15, 0.2))
        dv = norm(v - bc)
        bl = sstep(-0.45, 0.75, dv @ norm(np.array((0, -0.2, 1.0)))) * sstep(0.2, 0.55, v[:, 1]) * (1 - sstep(1.8, 2.15, v[:, 1]))
        bl *= np.clip(gw.get('belly', 0) * 1.3 + gw.get('torso', 0) * 0.5, 0, 1)
        dome = np.exp(-((v - np.array((0, 1.1, 1.25))) ** 2 / np.array((0.95, 0.85, 1.2)) ** 2).sum(1))
        bl *= 0.3 + 0.7 * dome
        fat = np.clip(gw.get('belly', 0) + gw.get('torso', 0) * 0.85 + gw.get('thigh', 0) * 0.7 + gw.get('neck', 0) * 0.7 + gw.get('arm', 0) * 0.4 + gw.get('head', 0) * 0.12 + gw.get('jaw', 0) * 0.5 + gw.get('tail', 0) * np.clip(1 - (-0.7 - v[:, 2]) / 1.2, 0, 0.6), 0, 1)
        core = lambda q: np.stack([np.zeros(len(q)), np.clip(q[:, 1], 0.8, 2.0), np.full(len(q), -0.1)], -1)
        return bl, fat, core, (0, 1.2, -0.05)
    return C, anch, paint, masks

# =========================================================================== C: Chomp Rex / Grin
def chomprex():
    bones = [
        ('root', None, (0, 0, 0)), ('hips', 'root', (0, 2.1, -0.35)), ('spine', 'hips', (0, 2.45, 0.45)),
        ('chest', 'spine', (0, 2.72, 1.05)), ('neck', 'chest', (0, 3.0, 1.35)), ('head', 'neck', (0, 3.55, 1.75), (0, 3.6, 3.05)),
        ('jaw', 'head', (0, 3.28, 1.78), (0, 3.18, 2.9)),
        ('tail1', 'hips', (0, 2.32, -0.95)), ('tail2', 'tail1', (0, 2.2, -2.0)), ('tail3', 'tail2', (0, 2.05, -3.0)),
        ('tail4', 'tail3', (0, 1.96, -3.85), (0, 1.99, -4.6)),
    ]
    bones += limb_bones(['thigh', 'shin', 'ankle', 'toe'], [(0.56, 2.05, -0.3), (0.62, 1.4, -0.42), (0.63, 0.74, -0.72), (0.64, 0.15, -0.32)], 'hips', [None, None, None, (0.65, 0.08, 0.28)])
    bones += limb_bones(['arm', 'forearm', 'hand'], [(0.55, 2.6, 1.35), (0.65, 2.35, 1.6), (0.58, 2.22, 1.84)], 'chest', [None, None, (0.57, 2.1, 2.0)])
    P = [
        Part('torso', ellipsoid((0, 2.45, 0.35), (0.78, 0.86, 1.32), tilt=-0.28), ['hips', 'spine', 'chest'], 0, 'torso'),
        Part('belly', ellipsoid((0, 2.2, 0.6), (0.72, 0.72, 1.0), tilt=-0.3), ['hips', 'spine'], 0.3, 'belly'),
        Part('chest', ellipsoid((0, 2.78, 1.0), (0.62, 0.62, 0.6)), ['spine', 'chest'], 0.3, 'torso'),
        Part('neck', roundcone((0, 2.86, 1.15), (0, 3.38, 1.66), 0.6, 0.5), ['chest', 'neck', 'head'], 0.25, 'neck'),
        Part('skull', ellipsoid((0, 3.7, 1.9), (0.56, 0.5, 0.72)), ['head'], 0.15, 'head'),
        Part('snout', roundcone((0, 3.66, 2.2), (0, 3.56, 2.96), 0.44, 0.34, 1.12, 0.74), ['head'], 0.12, 'head'),
        Part('jaw', roundcone((0, 3.24, 1.85), (0, 3.17, 2.82), 0.34, 0.26, 1.16, 0.68), ['jaw'], 0.08, 'jaw'),
        Part('chin', ellipsoid((0, 3.1, 2.55), (0.3, 0.13, 0.3)), ['jaw'], 0.07, 'jaw'),
        Part('tail', chain([(0, 2.35, -0.9), (0, 2.22, -2.0), (0, 2.05, -3.0), (0, 1.96, -3.85), (0, 1.99, -4.5)], [0.66, 0.45, 0.28, 0.14, 0.05]), ['tail1', 'tail2', 'tail3', 'tail4'], 0.3, 'tail'),
    ]
    for s, side in LR:
        P += [
            Part('haunch' + side, ellipsoid((s * 0.55, 2.05, -0.3), (0.48, 0.82, 0.75)), ['thigh' + side], 0.25, 'thigh'),
            Part('shin' + side, roundcone((s * 0.6, 1.55, -0.38), (s * 0.63, 0.76, -0.72), 0.32, 0.18), ['thigh' + side, 'shin' + side], 0.12, 'leg'),
            Part('meta' + side, roundcone((s * 0.63, 0.76, -0.72), (s * 0.64, 0.17, -0.34), 0.17, 0.14), ['ankle' + side], 0.08, 'leg'),
            Part('brow' + side, ellipsoid((s * 0.3, 4.06, 2.2), (0.21, 0.085, 0.24), tilt=0.3), ['head'], 0.05, 'head'),
            Part('cheek' + side, ellipsoid((s * 0.42, 3.45, 2.05), (0.2, 0.25, 0.3)), ['head'], 0.1, 'head'),
            Part('uarm' + side, roundcone((s * 0.55, 2.6, 1.35), (s * 0.65, 2.35, 1.6), 0.13, 0.1), ['arm' + side], 0.06, 'arm'),
            Part('farm' + side, roundcone((s * 0.65, 2.35, 1.6), (s * 0.58, 2.22, 1.84), 0.1, 0.08), ['forearm' + side], 0.04, 'arm'),
            Part('hand' + side, sphere((s * 0.58, 2.2, 1.88), 0.075), ['hand' + side], 0.03, 'hand'),
        ]
        for ox in (-0.14, 0.0, 0.14):
            P.append(Part('toe' + side, roundcone((s * 0.64 + ox, 0.16, -0.3), (s * 0.64 + ox * 1.7, 0.085, 0.24), 0.105, 0.07), ['toe' + side], 0.04, 'toe'))
        for fx in (-0.035, 0.035):
            P.append(Part('finger' + side, roundcone((s * (0.58 + fx), 2.18, 1.92), (s * (0.58 + fx), 2.05, 2.02), 0.03, 0.02), ['hand' + side], 0.015, 'finger'))
    C = Creature('chomprex', P, bones, (-1.25, -0.2, -4.75), (1.25, 4.42, 3.48), 0.026, 34000)
    base = lambda p: C.sdf(p, False)
    anch = {}
    # the grin: a curved line between snout and jaw, wide at the corners
    grin = []
    for i in range(17):
        u = -1 + 2 * i / 16
        x = u * 0.46
        zz = 3.0 - 0.95 * u * u
        yy = 3.38 + 0.12 * u * u
        h = march(base, (x * 1.5, yy, zz + 0.8) if abs(u) < 0.6 else (x * 3.5, yy, zz), (-(x * 0.5), 0, -1) if abs(u) < 0.6 else (-np.sign(x), 0, -0.4))
        grin.append(r5(h))
    anch['grin'] = grin
    for s, side in LR:
        e = march(base, (s * 0.31, 3.86, 4.5), (0, 0, -1))
        anch['eye' + side] = r5(e + np.array((0, 0, -0.045)))
        anch['eyeN' + side] = r5(grad(base, e))
    anch['nose'] = r5(march(base, (0, 3.72, 4.5), (0, 0, -1)))
    pts = lerp_pts((0, 4.1, 1.75), (0, 3.6, 1.2), 3) + lerp_pts((0, 3.3, 1.0), (0, 2.6, -0.3), 5) + lerp_pts((0, 2.4, -0.9), (0, 2.22, -2.0), 3) + lerp_pts((0, 2.22, -2.0), (0, 2.05, -3.0), 3) + lerp_pts((0, 2.05, -3.0), (0, 1.96, -3.85), 3)
    outs = [(0, 1, -0.35)] * 3 + [(0, 1, -0.3)] * 5 + [(0, 1, 0)] * 9
    sizes = [0.12, 0.15, 0.17, 0.19, 0.21, 0.22, 0.22, 0.21, 0.2, 0.19, 0.17, 0.15, 0.13, 0.11, 0.09, 0.08, 0.06]
    bn = ['head', 'neck', 'neck', 'chest', 'chest', 'spine', 'spine', 'hips'] + ['tail1'] * 3 + ['tail2'] * 3 + ['tail3'] * 3
    anch['spines'] = dorsal(C, base, pts, outs, sizes, bn)
    anch['spineCol'] = '#2a1f2a'
    for s, side in LR:
        C.parts.append(Part('socket', sphere(anch['eye' + side], 0.085), [], 0.03, sub=True))
        C.parts.append(Part('nostril', sphere(np.array(anch['nose']) + np.array((s * 0.13, 0.02, -0.02)), 0.04), [], 0.015, sub=True))
    # the mouth: carve a gap along the grin so the teeth sit in it
    for i in range(len(grin) - 1):
        C.parts.append(Part('mouth', roundcone(np.array(grin[i]) - np.array((0, 0, 0.02)), np.array(grin[i + 1]) - np.array((0, 0, 0.02)), 0.045, 0.045), [], 0.02, sub=True))
    def paint(v, N, gw):
        x, y, z = v[:, 0], v[:, 1], v[:, 2]
        Cc = np.tile(hexc('#6b3560'), (len(v), 1))
        back = sstep(0.0, 0.7, N[:, 1]) * (1 - gw.get('head', 0) * 0.4)
        Cc = mix(Cc, '#4f2347', back * 0.6)
        ven = (gw.get('belly', 0) + gw.get('torso', 0) * 0.7 + gw.get('neck', 0) * 0.8) * sstep(-0.05, -0.5, N[:, 1] - 0.45 * N[:, 2]) * (z > -0.9)
        ven += gw.get('jaw', 0) * sstep(0.05, -0.35, N[:, 1])
        ven += gw.get('tail', 0) * sstep(-0.15, -0.6, N[:, 1])
        ven += gw.get('head', 0) * sstep(-0.2, -0.6, N[:, 1]) * (y < 3.5)
        ven = np.clip(ven, 0, 1)
        Cc = mix(Cc, '#d9a24c', ven)
        nz = np.sin(x * 9 + 0.7) * np.sin(y * 8.5 + 0.2) * np.sin(z * 9.5 + 1.6) + 0.3 * np.sin(x * 21 + y * 17 + z * 5)
        Cc = mix(Cc, '#4e2147', sstep(0.5, 0.6, nz) * (1 - ven) * (1 - gw.get('toe', 0)) * 0.85)
        Cc = mix(Cc, '#2a1f2a', gw.get('toe', 0) * sstep(0.12, 0.2, z) + gw.get('finger', 0) * sstep(2.1, 2.06, y))
        # inside the grin: dark plum gums
        gd = np.min(np.stack([seg_dist(v, np.array(anch['grin'][i]), np.array(anch['grin'][i + 1])) for i in range(len(anch['grin']) - 1)]), 0)
        Cc = mix(Cc, '#4a1626', sstep(0.07, 0.035, gd))
        return Cc
    def masks(v, N, gw):
        bc = np.array((0, 2.25, 0.4))
        dv = norm(v - bc)
        bl = sstep(-0.3, 0.8, dv @ norm(np.array((0, -1.0, 0.25)))) * np.clip(gw.get('belly', 0) * 1.2 + gw.get('torso', 0) * 0.4, 0, 1)
        fat = np.clip(gw.get('belly', 0) * 0.8 + gw.get('torso', 0) * 0.6, 0, 1)
        core = lambda q: np.stack([np.zeros(len(q)), np.full(len(q), 2.4), np.clip(q[:, 2], -0.8, 1.2)], -1)
        return bl, fat, core, (0, 2.4, 0.4)
    return C, anch, paint, masks

CREATURES = dict(skydrake=skydrake, heavyweight=heavyweight, chomprex=chomprex)

def build(name):
    print(name)
    C, anch, paint, masks = CREATURES[name]()
    v, f = mesh(C)
    N = vnormals(v, f)
    skI, skW, gw = skin(C, v)
    bl, fat, core, bc = masks(v, N, gw)
    fdir, bl = grow_dirs(v, f, N, bl, core, bc)
    col = paint(v, N, gw)
    return encode(C, v, f, col, skI, skW, bl, fat, fdir, anch, dict(tris=len(f)))

if __name__ == '__main__':
    names = sys.argv[1:] or list(CREATURES)
    old = {}
    if os.path.exists(OUT):
        t = open(OUT).read()
        old = json.loads(t[t.index('{'):t.rindex('}') + 1])
    for n in names:
        old[n] = build(n)
    with open(OUT, 'w') as fh:
        fh.write('/* Cloud Utopia monsters: sculpted skinned bodies, written by tools/sculpt_cast.py (do not edit by hand) */\n')
        fh.write('window.CAST_MODELS = ' + json.dumps(old, separators=(',', ':')) + ';\n')
    print('wrote', OUT, '%.0f KB' % (os.path.getsize(OUT) / 1024))
