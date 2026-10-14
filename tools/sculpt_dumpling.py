"""
Sculpts DUMPLING, the chubby cloud drake of Skyforge Haven, and writes assets/dumpling_model.js.

The body is one seamless surface: smooth signed-distance shapes (belly, torso, head, cheeks, legs, arms, tail,
belly plates, back nubs) blended together and meshed with marching cubes, then smoothed. Every vertex also gets
  * bone skin weights (16 bones) so the game can animate it,
  * a belly mask   (how much it swells when he eats and wobbles when he jiggles),
  * a fat mask and direction (how much it grows when he gains weight, and which way),
  * a painted colour (jade scales, peach belly plates, blush, freckles, spots, toe claws).
Small parts (eyes, horns, ear fins, wings, cloud tufts, scarf) are built in the game (src/dumpling.js) at the
anchor points this script finds on the surface.

Run:  python3 tools/sculpt_dumpling.py        (needs numpy, scipy, scikit-image)
Edit the SHAPE numbers below to change his look, then run it again.
"""
import base64, json, math, os
import numpy as np
from scipy import sparse
from skimage import measure

OUT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'dumpling_model.js')
STEP = 0.0125  # grid spacing in metres (smaller = more detail)
TARGET_TRIS = 44000  # triangles after decimation (bigger = smoother, bigger file)

# ---------------------------------------------------------------- distance helpers
def length(v):
    return np.sqrt((v * v).sum(-1))

def sd_ellipsoid(p, c, r):
    q = (p - c) / r
    k0 = length(q)
    k1 = length((p - c) / (np.asarray(r) ** 2))
    return k0 * (k0 - 1.0) / np.maximum(k1, 1e-9)

def sd_sphere(p, c, r):
    return length(p - c) - r

def sd_roundcone(p, a, b, r1, r2):
    a = np.asarray(a, float); b = np.asarray(b, float)
    ba = b - a; l2 = ba @ ba
    pa = p - a
    t = np.clip((pa @ ba) / l2, 0, 1)
    r = r1 + (r2 - r1) * t
    return length(pa - t[..., None] * ba) - r

def smin(a, b, k):
    h = np.clip(0.5 + 0.5 * (b - a) / k, 0, 1)
    return b * (1 - h) + a * h - k * h * (1 - h)

def smax(a, b, k):
    return -smin(-a, -b, k)

def sstep(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)

# ---------------------------------------------------------------- the shape (metres, +z is his front, +x his left)
S = dict(
    torso=((0, 0.82, 0.0), (0.60, 0.66, 0.56)),
    belly=((0, 0.72, 0.16), (0.56, 0.56, 0.52)),
    chest=((0, 1.20, 0.0), (0.42, 0.38, 0.38)),
    bum=((0, 0.58, -0.16), (0.56, 0.42, 0.48)),
    head=((0, 1.80, 0.14), (0.36, 0.33, 0.34)),
    skull=((0, 1.87, 0.03), (0.30, 0.28, 0.28)),
    muzzle=((0, 1.72, 0.40), (0.25, 0.18, 0.22)),
    snout=((0, 1.745, 0.55), (0.17, 0.13, 0.10)),
    jaw=((0, 1.60, 0.33), (0.21, 0.10, 0.19)),
)
TAIL = [((0, 0.42, -0.50), 0.26), ((0.05, 0.26, -0.88), 0.17), ((0.16, 0.14, -1.15), 0.10), ((0.30, 0.115, -1.33), 0.055)]

def prims():
    """List of (name, group, distance function). Order does not matter for weights; compose() blends them."""
    L = []
    for k in ('torso', 'belly', 'chest', 'bum'):
        c, r = S[k]; L.append((k, 'torso', lambda p, c=c, r=r: sd_ellipsoid(p, np.array(c), np.array(r))))
    L.append(('neck', 'neck', lambda p: sd_roundcone(p, (0, 1.30, 0.02), (0, 1.56, 0.10), 0.27, 0.22)))
    for k in ('head', 'skull', 'muzzle', 'snout', 'jaw'):
        c, r = S[k]; L.append((k, 'jaw' if k == 'jaw' else 'head', lambda p, c=c, r=r: sd_ellipsoid(p, np.array(c), np.array(r))))
    for s in (1, -1):
        L.append(('cheek', 'cheek', lambda p, s=s: sd_sphere(p, np.array((s * 0.235, 1.675, 0.30)), 0.155)))
        L.append(('brow', 'head', lambda p, s=s: sd_ellipsoid(p, np.array((s * 0.145, 1.955, 0.355)), np.array((0.115, 0.05, 0.075)))))
        side = 'L' if s > 0 else 'R'
        L.append(('thigh' + side, 'thigh', lambda p, s=s: sd_ellipsoid(p, np.array((s * 0.36, 0.40, 0.10)), np.array((0.25, 0.28, 0.27)))))
        L.append(('shin' + side, 'foot', lambda p, s=s: sd_roundcone(p, (s * 0.38, 0.32, 0.12), (s * 0.40, 0.11, 0.18), 0.17, 0.15)))
        L.append(('foot' + side, 'foot', lambda p, s=s: sd_ellipsoid(p, np.array((s * 0.40, 0.075, 0.25)), np.array((0.19, 0.08, 0.245)))))
        for i, ox in enumerate((-0.095, 0, 0.095)):
            L.append(('toe' + side, 'toe', lambda p, s=s, ox=ox: sd_sphere(p, np.array((s * 0.40 + ox, 0.058, 0.455 - abs(ox) * 0.35)), 0.062)))
        L.append(('uarm' + side, 'arm', lambda p, s=s: sd_roundcone(p, (s * 0.40, 1.22, 0.10), (s * 0.52, 1.02, 0.30), 0.115, 0.088)))
        L.append(('farm' + side, 'hand', lambda p, s=s: sd_roundcone(p, (s * 0.52, 1.02, 0.30), (s * 0.43, 0.95, 0.50), 0.088, 0.082)))
        L.append(('hand' + side, 'hand', lambda p, s=s: sd_ellipsoid(p, np.array((s * 0.41, 0.935, 0.535)), np.array((0.095, 0.085, 0.09)))))
        for i, (fx, fy) in enumerate(((0.05, -0.03), (0.0, -0.06), (-0.05, -0.05))):
            L.append(('finger' + side, 'finger', lambda p, s=s, fx=fx, fy=fy: sd_sphere(p, np.array((s * (0.41 + fx), 0.935 + fy, 0.60)), 0.036)))
    for i in range(len(TAIL) - 1):
        (a, ra), (b, rb) = TAIL[i], TAIL[i + 1]
        L.append(('tail%d' % i, 'tail', lambda p, a=a, b=b, ra=ra, rb=rb: sd_roundcone(p, a, b, ra, rb)))
    return L

def compose(p, nubs=None, detail=True):
    P = {n: f(p) for n, g, f in prims_cache}
    # body mass
    d = smin(P['torso'], P['belly'], 0.16)
    d = smin(d, P['bum'], 0.14)
    d = smin(d, P['chest'], 0.16)
    if detail:
        # belly plates: soft horizontal grooves across the front, curving up at the sides
        y2 = p[..., 1] + 0.32 * p[..., 0] ** 2
        sp = 0.118
        ph = np.abs(((y2 - 0.3) % sp) - sp / 2)
        groove = (1 - sstep(0.0, 0.016, ph)) * 0.0065
        front = sstep(0.05, 0.42, p[..., 2] - 0.05 + 0.0 * p[..., 1]) * sstep(0.22, 0.34, p[..., 1]) * (1 - sstep(1.18, 1.32, p[..., 1]))
        front *= 1 - sstep(0.30, 0.46, np.abs(p[..., 0]))
        d = d + groove * front
    d = smin(d, P['neck'], 0.13)
    h = smin(P['head'], P['skull'], 0.1)
    h = smin(h, P['muzzle'], 0.1)
    h = smin(h, P['snout'], 0.06)
    h = smin(h, P['jaw'], 0.08)
    ch = np.minimum.reduce([f(p) for n, g, f in prims_cache if n == 'cheek'])
    br = np.minimum.reduce([f(p) for n, g, f in prims_cache if n == 'brow'])
    h = smin(h, ch, 0.07)
    h = smin(h, br, 0.05)
    d = smin(d, h, 0.11)
    for side in 'LR':
        leg = smin(P['thigh' + side], P['shin' + side], 0.07)
        leg = smin(leg, P['foot' + side], 0.07)
        toes = np.minimum.reduce([f(p) for n, g, f in prims_cache if n == 'toe' + side])
        leg = smin(leg, toes, 0.035)
        d = smin(d, leg, 0.1)
        arm = smin(P['uarm' + side], P['farm' + side], 0.04)
        arm = smin(arm, P['hand' + side], 0.04)
        fing = np.minimum.reduce([f(p) for n, g, f in prims_cache if n == 'finger' + side])
        arm = smin(arm, fing, 0.02)
        # shoulder blends into the chest, the hand only kisses the belly
        d = smin(d, arm, 0.045)
    t = np.minimum.reduce([P['tail%d' % i] for i in range(len(TAIL) - 1)])
    d = smin(d, t, 0.12)
    if nubs is not None:
        for (c, r) in nubs:
            d = smin(d, sd_ellipsoid(p, np.array(c), np.array(r)), 0.035)
    if detail and cuts is not None:
        for (c, r, k) in cuts:
            d = smax(d, -sd_sphere(p, np.array(c), r), k)
        for (a, b, r) in grooves:
            d = smax(d, -sd_roundcone(p, a, b, r, r), 0.012)
    return d

prims_cache = prims()
cuts = None
grooves = []

def march(o, dirv, f, tmax=3.0):
    o = np.asarray(o, float); dirv = np.asarray(dirv, float); dirv /= np.linalg.norm(dirv)
    t = 0.0
    for _ in range(400):
        d = float(f((o + dirv * t)[None])[0])
        if d < 1e-4:
            return o + dirv * t
        t += max(d * 0.7, 1e-4)
        if t > tmax:
            return None
    return o + dirv * t

def grad(f, p, e=1e-3):
    p = np.asarray(p, float)
    g = np.array([float(f((p + dv)[None])[0] - f((p - dv)[None])[0]) for dv in np.eye(3) * e])
    return g / np.linalg.norm(g)

# ---------------------------------------------------------------- anchors, nubs, cuts
base = lambda p: compose(p, None, detail=False)

# back nubs: march from behind at several heights, and along the top of the tail
nubs = []
for y, sz in ((1.64, 0.06), (1.5, 0.075), (1.33, 0.09), (1.14, 0.095), (0.95, 0.095), (0.76, 0.09), (0.6, 0.075)):
    hit = march((0, y, -2.0), (0, 0, 1), base)
    if hit is not None:
        n = grad(base, hit)
        c = hit - n * 0.02
        nubs.append((tuple(c), (0.055, sz, 0.08)))
for i in range(len(TAIL) - 1):
    (a, ra), (b, rb) = TAIL[i], TAIL[i + 1]
    for tt in (0.35, 0.8):
        c = np.array(a) * (1 - tt) + np.array(b) * tt
        r = ra * (1 - tt) + rb * tt
        hit = march(c + np.array((0, 1.0, 0)), (0, -1, 0), base)
        if hit is not None and r > 0.07:
            nubs.append((tuple(hit - np.array((0, 0.015, 0))), (0.035, 0.045 * r / 0.2 + 0.02, 0.05 * r / 0.2 + 0.02)))
with_nubs = lambda p: compose(p, nubs, detail=False)

anch = {}
for s, side in ((1, 'L'), (-1, 'R')):
    e = march((s * 0.15, 1.875, 1.5), (0, 0, -1), with_nubs)
    anch['eye' + side] = (e + np.array((0, 0, -0.045))).tolist()
    nn = march((s * 0.068, 1.79, 1.5), (0, -0.1, -1), with_nubs)
    anch['nostril' + side] = nn.tolist()
    hb = march((s * 0.17, 2.6, 0.02), (0, -1, 0), with_nubs)
    anch['horn' + side] = hb.tolist(); anch['hornN' + side] = grad(with_nubs, hb).tolist()
    eb = march((s * 1.2, 1.87, -0.04), (-s, 0, 0), with_nubs)
    anch['ear' + side] = eb.tolist(); anch['earN' + side] = grad(with_nubs, eb).tolist()
    wb = march((s * 0.24, 1.22, -2.0), (0, 0, 1), with_nubs)
    anch['wing' + side] = wb.tolist(); anch['wingN' + side] = grad(with_nubs, wb).tolist()
anch['tuft'] = march((0, 2.6, 0.08), (0, -1, 0), with_nubs).tolist()
anch['tailTip'] = list(TAIL[-1][0])
# scarf ring around the neck
ring = []
for i in range(16):
    a = i / 16 * 2 * math.pi
    dv = np.array((math.sin(a), 0, math.cos(a)))
    yy = 1.44 - 0.05 * math.cos(a)  # dips a little at the front
    h = march(np.array((0, yy, 0.05)) + dv * 1.0, -dv, with_nubs)
    ring.append(h.tolist())
anch['scarf'] = ring

# eye sockets, nostrils and a smile
cuts = []
for side in 'LR':
    cuts.append((anch['eye' + side], 0.098, 0.03))
    cuts.append((anch['nostril' + side], 0.027, 0.012))
sm = []
for i in range(13):
    x = -0.2 + 0.4 * i / 12
    y = 1.636 + 1.1 * x * x
    h = march((x, y, 1.2), (0, 0, -1), with_nubs)
    sm.append(h - np.array((0, 0, 0.004)))
grooves = [(tuple(sm[i]), tuple(sm[i + 1]), 0.0105) for i in range(len(sm) - 1)]
anch['tooth'] = (sm[8] + np.array((0, -0.004, -0.004))).tolist()
final = lambda p: compose(p, nubs, detail=True)

# ---------------------------------------------------------------- mesh it
lo = np.array((-0.72, -0.04, -1.45)); hi = np.array((0.72, 2.18, 0.74))
xs = np.arange(lo[0], hi[0] + STEP, STEP); ys = np.arange(lo[1], hi[1] + STEP, STEP); zs = np.arange(lo[2], hi[2] + STEP, STEP)
G = np.stack(np.meshgrid(xs, ys, zs, indexing='ij'), -1)
vol = np.empty(G.shape[:3], np.float32)
for i in range(G.shape[0]):
    vol[i] = final(G[i])
print('grid', vol.shape, 'inside fraction %.3f' % (vol < 0).mean())
verts, faces, _, _ = measure.marching_cubes(vol, 0.0, spacing=(STEP, STEP, STEP))
verts += lo
# skimage already winds the triangles outward for a negative-inside distance field
print('raw verts', len(verts), 'tris', len(faces))

# weld + Taubin smoothing (removes the marching-cubes stair steps without shrinking)
n = len(verts)
ii = np.concatenate([faces[:, 0], faces[:, 1], faces[:, 2], faces[:, 1], faces[:, 2], faces[:, 0]])
jj = np.concatenate([faces[:, 1], faces[:, 2], faces[:, 0], faces[:, 0], faces[:, 1], faces[:, 2]])
A = sparse.coo_matrix((np.ones(len(ii)), (ii, jj)), shape=(n, n)).tocsr()
A.data[:] = 1
deg = np.asarray(A.sum(1)).ravel()
Wm = sparse.diags(1 / np.maximum(deg, 1)) @ A
v = verts.copy()
for it in range(14):
    v = v + 0.55 * (Wm @ v - v)
    v = v - 0.58 * (Wm @ v - v)
# project back toward the true surface a little (keeps grooves crisp)
for it in range(2):
    d = final(v)
    eps = 1e-3
    g = np.stack([(final(v + dv) - final(v - dv)) / (2 * eps) for dv in np.eye(3) * eps], -1)
    g /= np.maximum(length(g), 1e-9)[:, None]
    v = v - g * d[:, None] * 0.8
verts = v
# reduce the triangle count where the surface is smooth (keeps detail in the face, hands and plates)
try:
    import pyfqmr
    simp = pyfqmr.Simplify()
    simp.setMesh(verts, faces)
    simp.simplify_mesh(target_count=TARGET_TRIS, aggressiveness=5, preserve_border=True, verbose=0)
    verts, faces, _ = simp.getMesh()
    verts = verts.astype(np.float64); faces = faces.astype(np.int64)
    print('decimated to', len(verts), 'verts', len(faces), 'tris')
except ImportError:
    print('pyfqmr not installed: keeping the full mesh (pip install pyfqmr)')

def vnormals(v, f):
    fn = np.cross(v[f[:, 1]] - v[f[:, 0]], v[f[:, 2]] - v[f[:, 0]])
    N = np.zeros_like(v)
    for k in range(3):
        np.add.at(N, f[:, k], fn)
    return N / np.maximum(length(N), 1e-9)[:, None]
N = vnormals(verts, faces)

# ---------------------------------------------------------------- bones and skin weights
BONES = [
    ('root', -1, (0, 0, 0)), ('hips', 0, (0, 0.62, -0.05)), ('spine', 1, (0, 1.05, 0.0)), ('neck', 2, (0, 1.38, 0.04)),
    ('head', 3, (0, 1.62, 0.12)), ('tail1', 1, TAIL[0][0]), ('tail2', 5, TAIL[1][0]), ('tail3', 6, TAIL[2][0]),
    ('thighL', 1, (0.36, 0.52, 0.08)), ('footL', 8, (0.39, 0.20, 0.15)), ('thighR', 1, (-0.36, 0.52, 0.08)),
    ('footR', 10, (-0.39, 0.20, 0.15)), ('armL', 2, (0.40, 1.22, 0.10)), ('handL', 12, (0.52, 1.02, 0.30)),
    ('armR', 2, (-0.40, 1.22, 0.10)), ('handR', 14, (-0.52, 1.02, 0.30)),
]
BI = {b[0]: i for i, b in enumerate(BONES)}
y = verts[:, 1]; x = verts[:, 0]; z = verts[:, 2]
side = np.where(x >= 0, 'L', 'R')

def bone_split(name, p):
    """for one primitive: (bone index arrays, weights) over the vertices"""
    yv = p[:, 1]
    if name in ('torso', 'belly', 'bum'):
        s = sstep(0.85, 1.25, yv); return [('hips', 1 - s), ('spine', s)]
    if name == 'chest':
        s = sstep(0.95, 1.2, yv); return [('hips', (1 - s) * 0.5), ('spine', 1 - (1 - s) * 0.5)]
    if name == 'neck':
        s = sstep(1.32, 1.62, yv); return [('spine', 1 - s), ('neck', s * 0.6 + 0.0), ('head', s * 0.4)]
    if name in ('head', 'skull', 'muzzle', 'snout', 'cheek', 'brow', 'jaw'):
        return [('head', np.ones(len(p)))]
    return None

pw = []
for nm, grp, f in prims_cache:
    pw.append((nm, grp, f(verts)))
dmin = np.min(np.stack([d for _, _, d in pw]), 0)
Wb = np.zeros((len(verts), len(BONES)))
group_w = {}
for nm, grp, d in pw:
    w = np.exp(-(np.maximum(d - dmin, 0)) / 0.028)
    group_w[grp] = group_w.get(grp, 0) + w
    spl = bone_split(nm, verts)
    if spl is None:
        sd = nm[-1]
        if nm.startswith('thigh'):
            s = sstep(0.36, 0.22, verts[:, 1]); spl = [('thigh' + sd, 1 - s), ('foot' + sd, s)]
        elif nm.startswith('shin') or nm.startswith('foot') or nm.startswith('toe'):
            s = sstep(0.34, 0.26, verts[:, 1]); spl = [('thigh' + sd, 1 - s), ('foot' + sd, s)]
        elif nm.startswith('uarm'):
            t = np.clip(((verts - np.array((0.40 if sd == 'L' else -0.40, 1.22, 0.10))) @ np.array((0.12, -0.2, 0.2))) / 0.0944, 0, 1)
            s = sstep(0.75, 1.0, t); spl = [('arm' + sd, 1 - s), ('hand' + sd, s)]
        elif nm.startswith('farm') or nm.startswith('hand') or nm.startswith('finger'):
            spl = [('hand' + sd, np.ones(len(verts)))]
        elif nm.startswith('tail'):
            i = int(nm[4]); bn = ['tail1', 'tail2', 'tail3'][i]
            spl = [(bn, np.ones(len(verts)))]
    for bn, bw in spl:
        Wb[:, BI[bn]] += w * bw
# shoulders: keep the top of the chest on the spine
Wb /= np.maximum(Wb.sum(1, keepdims=True), 1e-9)
order = np.argsort(-Wb, 1)[:, :4]
topw = np.take_along_axis(Wb, order, 1)
topw /= topw.sum(1, keepdims=True)
skI = order.astype(np.uint8)
skW = np.round(topw * 255).astype(int)
skW[:, 0] += 255 - skW.sum(1)
skW = skW.astype(np.uint8)
gtot = sum(group_w.values())
gw = {k: v / gtot for k, v in group_w.items()}

# ---------------------------------------------------------------- belly / fat masks
bc = np.array((0, 0.74, 0.0))
dv = verts - bc
dv /= np.maximum(length(dv), 1e-9)[:, None]
fwd = np.array((0, -0.12, 1.0)); fwd /= np.linalg.norm(fwd)
belly = sstep(-0.45, 0.75, dv @ fwd)  # strongest at the front, fading round the sides
belly *= sstep(-0.02, 0.4, y) * (1 - sstep(1.08, 1.34, y))  # between the hips and the chest
belly *= np.clip(gw.get('torso', 0) * 1.25, 0, 1)
# dome profile: grows most at the middle of the belly so it swells into a ball, not a barrel
dome = np.exp(-((verts - np.array((0, 0.7, 0.62))) ** 2 / np.array((0.5, 0.42, 0.9)) ** 2).sum(1))
belly *= 0.3 + 0.7 * dome
belly = np.clip(belly, 0, 1)
fat = (gw.get('torso', 0) * 1.0 + gw.get('neck', 0) * 0.9 + gw.get('thigh', 0) * 0.85 + gw.get('arm', 0) * 0.55 +
       gw.get('cheek', 0) * 0.65 + gw.get('jaw', 0) * 0.7 + gw.get('head', 0) * 0.12 + gw.get('foot', 0) * 0.2 +
       gw.get('hand', 0) * 0.12 + gw.get('tail', 0) * np.clip(1.0 - (-0.5 - z) / 0.7, 0.05, 0.8))
fat = np.clip(fat, 0, 1)
# growth direction: a heavily smoothed normal (so belly plates and creases do not split apart when he swells),
# blended with the direction out from his spine / belly centre for the body
n_ = len(verts)
ii = np.concatenate([faces[:, 0], faces[:, 1], faces[:, 2], faces[:, 1], faces[:, 2], faces[:, 0]])
jj = np.concatenate([faces[:, 1], faces[:, 2], faces[:, 0], faces[:, 0], faces[:, 1], faces[:, 2]])
A2 = sparse.coo_matrix((np.ones(len(ii)), (ii, jj)), shape=(n_, n_)).tocsr()
A2.data[:] = 1
W2 = sparse.diags(1 / np.maximum(np.asarray(A2.sum(1)).ravel(), 1)) @ A2
Ns = N.copy()
for it in range(40):
    Ns = W2 @ Ns
Ns /= np.maximum(length(Ns), 1e-9)[:, None]
core = np.stack([np.zeros_like(y), np.clip(y, 0.5, 1.3), np.full_like(y, -0.02)], -1)
rad = verts - core
rad /= np.maximum(length(rad), 1e-9)[:, None]
brad = verts - np.array((0, 0.78, -0.05))
brad /= np.maximum(length(brad), 1e-9)[:, None]
tw = np.clip(gw.get('torso', 0) + gw.get('neck', 0), 0, 1)
fdir = Ns * (1 - tw[:, None] * 0.6) + rad * (tw[:, None] * 0.6)
fdir = fdir * (1 - belly[:, None] * 0.7) + brad * (belly[:, None] * 0.7)
for it in range(10):
    fdir = W2 @ fdir
fdir /= np.maximum(length(fdir), 1e-9)[:, None]
belly = np.clip(W2 @ (W2 @ belly), 0, 1)

# ---------------------------------------------------------------- paint
def hexc(h):
    c = np.array([int(h[i:i + 2], 16) / 255 for i in (1, 3, 5)])
    return c

JADE, JADE_D, SPOT, CREAM, PLATE, MINT, BLUSH, FRECK, PAD, CLAW, CORAL, CORAL_D = map(hexc, (
    '#36a68c', '#1f7470', '#1b6463', '#f7bf80', '#d4874e', '#a8e3c4', '#ff8a92', '#1f6f66', '#ee9c86', '#fff1dc',
    '#ff7f4f', '#e8553a'))
C = np.tile(JADE, (len(verts), 1))
back = sstep(0.15, -0.55, N[:, 2]) * (1 - gw.get('foot', 0) - gw.get('toe', 0) * 0)
C = C * (1 - back[:, None] * 0.7) + JADE_D * (back[:, None] * 0.7)
# soft spots on the back and tail
nz = (np.sin(x * 23 + 1.3) * np.sin(y * 19 + 0.4) * np.sin(z * 21 + 2.1) + np.sin(x * 37 + y * 11) * 0.35)
spot = sstep(0.42, 0.55, nz) * back * (1 - gw.get('head', 0) * 0.7)
C = C * (1 - spot[:, None] * 0.7) + SPOT * spot[:, None] * 0.7
# peach belly, throat and chin
ven = np.clip(gw.get('torso', 0) + gw.get('neck', 0) + gw.get('jaw', 0) * 0.9 + gw.get('thigh', 0) * 0.4, 0, 1)
vz = sstep(-0.08, 0.34, N[:, 2] + 0.18 - np.abs(x) * 0.55) * ven
vz *= sstep(0.16, 0.3, y)
# stop the belly colour at the arms
C = C * (1 - vz[:, None]) + CREAM * vz[:, None]
y2 = y + 0.32 * x ** 2
ph = np.abs(((y2 - 0.3) % 0.118) - 0.059)
pl = (1 - sstep(0.0, 0.02, ph)) * vz * (y < 1.3)
C = C * (1 - pl[:, None] * 0.75) + PLATE * pl[:, None] * 0.75
# muzzle front lighter
mz = gw.get('head', 0) * sstep(0.42, 0.6, z) * sstep(0.2, 0.7, N[:, 2])
C = C * (1 - mz[:, None] * 0.55) + MINT * mz[:, None] * 0.55
# blush and freckles
for s in (1, -1):
    cc = np.array((s * 0.30, 1.675, 0.37))
    b = sstep(0.15, 0.03, length(verts - cc)) * np.clip(gw.get('cheek', 0) * 1.5, 0, 1)
    C = C * (1 - b[:, None] * 0.8) + BLUSH * b[:, None] * 0.8
    for (fx, fy) in ((0.0, 0.02), (0.035, -0.012), (-0.03, -0.015)):
        fc = cc + np.array((s * fx, fy, 0.02))
        fr = sstep(0.016, 0.009, length(verts - fc)) * gw.get('cheek', 0)
        C = C * (1 - fr[:, None]) + FRECK * fr[:, None]
# toes and finger tips: cream claws; soles: pink pads
claw = np.clip(gw.get('toe', 0) * sstep(0.47, 0.51, z) + gw.get('finger', 0) * sstep(0.6, 0.64, z), 0, 1)
C = C * (1 - claw[:, None]) + CLAW * claw[:, None]
sole = sstep(-0.3, -0.85, N[:, 1]) * (gw.get('foot', 0) + gw.get('toe', 0)) * (y < 0.08)
C = C * (1 - sole[:, None]) + PAD * sole[:, None]
# back nubs coral (they are the last few primitives: find vertices near them)
nubm = np.zeros(len(verts))
for (c, r) in nubs:
    nubm = np.maximum(nubm, sstep(0.01, -0.006, sd_ellipsoid(verts, np.array(c), np.array(r) * 1.05)))
C = C * (1 - nubm[:, None]) + (CORAL * (1 - sstep(0.4, 1.6, y))[:, None] + CORAL_D * sstep(0.4, 1.6, y)[:, None]) * nubm[:, None]
# nostrils and smile darker
for side_ in 'LR':
    nd = sstep(0.04, 0.02, length(verts - np.array(anch['nostril' + side_])))
    C = C * (1 - nd[:, None] * 0.6) + np.array((0.12, 0.3, 0.28)) * nd[:, None] * 0.6
smd = np.min(np.stack([sd_roundcone(verts, a, b, 0.0, 0.0) for a, b, _ in grooves]), 0)
smk = sstep(0.02, 0.008, smd)
C = C * (1 - smk[:, None] * 0.75) + np.array((0.16, 0.36, 0.33)) * smk[:, None] * 0.75
C = np.clip(C, 0, 1) ** 2.2  # sRGB -> linear for three.js vertex colours

# ---------------------------------------------------------------- write
lo2 = verts.min(0); hi2 = verts.max(0)
qpos = np.round((verts - lo2) / (hi2 - lo2) * 65535).astype(np.uint16)
idx = faces.astype(np.uint16 if len(verts) < 65536 else np.uint32)
b64 = lambda a: base64.b64encode(np.ascontiguousarray(a).tobytes()).decode()
data = dict(
    v=1, count=len(verts), lo=lo2.round(5).tolist(), hi=hi2.round(5).tolist(),
    pos=b64(qpos), idx=b64(idx), idx32=bool(idx.dtype == np.uint32),
    col=b64(np.round(C * 255).astype(np.uint8)), skI=b64(skI), skW=b64(skW),
    belly=b64(np.round(belly * 255).astype(np.uint8)), fat=b64(np.round(fat * 255).astype(np.uint8)),
    fdir=b64(np.round(fdir * 127).astype(np.int8)),
    bones=[dict(name=b[0], parent=b[1], pos=list(b[2])) for b in BONES],
    anchors={k: (np.round(np.asarray(v_), 5).tolist()) for k, v_ in anch.items()},
)
with open(OUT, 'w') as fh:
    fh.write('/* Dumpling the cloud drake: sculpted body mesh, written by tools/sculpt_dumpling.py (do not edit by hand) */\n')
    fh.write('window.DUMPLING_MODEL = ' + json.dumps(data, separators=(',', ':')) + ';\n')
print('verts', len(verts), 'tris', len(faces), 'file %.0f KB' % (os.path.getsize(OUT) / 1024))
