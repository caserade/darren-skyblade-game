"""
Shared sculpting pipeline for the Cloud Utopia monsters (used by tools/sculpt_cast.py).

A creature is a list of smooth signed-distance PARTS blended together, meshed with marching cubes, smoothed
(Taubin), decimated (pyfqmr) and then given:
  * skin weights for its bones (each part names the bones it may follow; within a part the nearest bone
    segment wins, and parts blend into each other where their surfaces meet),
  * a belly mask, a fat mask and a growth direction (for the 7 weight stages and the belly jiggle),
  * painted vertex colours (a per-creature paint function),
  * anchor points found on the surface (eyes, horns, spines, wings, teeth ...).
"""
import base64, json, math, os
import numpy as np
from scipy import sparse
from skimage import measure

# ------------------------------------------------------------------ distance helpers
def length(v):
    return np.sqrt((v * v).sum(-1))

def norm(v):
    return v / np.maximum(length(v), 1e-9)[..., None]

def sstep(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)

def smin(a, b, k):
    if k <= 0:
        return np.minimum(a, b)
    h = np.clip(0.5 + 0.5 * (b - a) / k, 0, 1)
    return b * (1 - h) + a * h - k * h * (1 - h)

def smax(a, b, k):
    return -smin(-a, -b, k)

def rot_x(p, a):  # rotate points by -a about x (so a shape built upright appears rotated by +a)
    c, s = math.cos(a), math.sin(a)
    y, z = p[..., 1], p[..., 2]
    return np.stack([p[..., 0], c * y + s * z, -s * y + c * z], -1)

def ellipsoid(c, r, tilt=0.0, squash=None):
    c = np.asarray(c, float); r = np.asarray(r, float)
    def f(p):
        q = p - c
        if tilt:
            q = rot_x(q, tilt)
        k0 = length(q / r)
        k1 = length(q / (r * r))
        return k0 * (k0 - 1.0) / np.maximum(k1, 1e-9)
    return f

def sphere(c, r):
    c = np.asarray(c, float)
    return lambda p: length(p - c) - r

def roundcone(a, b, r1, r2, sx=1.0, sy=1.0):
    """capsule from a to b with radius r1 -> r2. sx / sy squash it sideways / vertically (wedge snouts)."""
    a = np.asarray(a, float); b = np.asarray(b, float)
    S = np.array((sx, sy, 1.0))
    a2, b2 = a / S, b / S
    ba = b2 - a2; l2 = ba @ ba
    k = min(sx, sy)
    def f(p):
        q = p / S
        pa = q - a2
        t = np.clip((pa @ ba) / l2, 0, 1)
        r = r1 + (r2 - r1) * t
        return (length(pa - t[..., None] * ba) - r) * k
    return f

def chain(points, radii, sx=1.0, sy=1.0):
    """a smooth tube through several points (neck, tail)"""
    segs = [roundcone(points[i], points[i + 1], radii[i], radii[i + 1], sx, sy) for i in range(len(points) - 1)]
    return lambda p: np.minimum.reduce([s(p) for s in segs])

def seg_dist(p, a, b):
    a = np.asarray(a, float); b = np.asarray(b, float)
    ba = b - a; l2 = max(ba @ ba, 1e-9)
    t = np.clip(((p - a) @ ba) / l2, 0, 1)
    return length(p - a - t[..., None] * ba)

# ------------------------------------------------------------------ the creature
class Part:
    def __init__(self, name, fn, bones, k=0.1, group=None, sub=False):
        self.name, self.fn, self.bones, self.k, self.sub = name, fn, bones, k, sub
        self.group = group or name

class Creature:
    """parts are blended in order (each part's k is how softly it melts into what came before).
    sub=True parts are carved away instead (eye sockets, nostrils, the mouth)."""
    def __init__(self, name, parts, bones, lo, hi, step, tris):
        self.name, self.parts, self.bones, self.lo, self.hi, self.step, self.tris = name, parts, bones, np.array(lo), np.array(hi), step, tris
        self.detail = None  # optional f(p) -> extra distance (grooves); positive cuts in
        self.jaw_split = None  # optional f(v) -> 0..1, how much a head vertex follows the jaw

    def sdf(self, p, with_detail=True):
        d = None
        for P in self.parts:
            if P.sub:
                continue
            v = P.fn(p)
            d = v if d is None else smin(d, v, P.k)
        if with_detail and self.detail is not None:
            d = d + self.detail(p)
        for P in self.parts:
            if P.sub:
                d = smax(d, -P.fn(p), P.k)
        return d

def march(f, o, dirv, tmax=8.0):
    o = np.asarray(o, float); dirv = np.asarray(dirv, float); dirv = dirv / np.linalg.norm(dirv)
    t = 0.0
    for _ in range(600):
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

def vnormals(v, f):
    fn = np.cross(v[f[:, 1]] - v[f[:, 0]], v[f[:, 2]] - v[f[:, 0]])
    N = np.zeros_like(v)
    for k in range(3):
        np.add.at(N, f[:, k], fn)
    return norm(N)

def adjacency(n, faces):
    ii = np.concatenate([faces[:, 0], faces[:, 1], faces[:, 2], faces[:, 1], faces[:, 2], faces[:, 0]])
    jj = np.concatenate([faces[:, 1], faces[:, 2], faces[:, 0], faces[:, 0], faces[:, 1], faces[:, 2]])
    A = sparse.coo_matrix((np.ones(len(ii)), (ii, jj)), shape=(n, n)).tocsr()
    A.data[:] = 1
    return sparse.diags(1 / np.maximum(np.asarray(A.sum(1)).ravel(), 1)) @ A

def reproject(C, v, iters=2, k=0.85):
    """pull vertices back onto the true surface (keeps grooves, lips and plates crisp)"""
    eps = 1e-3
    for it in range(iters):
        d = C.sdf(v)
        g = norm(np.stack([(C.sdf(v + dv) - C.sdf(v - dv)) / (2 * eps) for dv in np.eye(3) * eps], -1))
        v = v - g * d[:, None] * k
    return v

def mesh(C, log=print):
    """marching cubes on a fine grid, Taubin smoothing, back onto the surface. Returns the full-res mesh."""
    lo, hi, st = C.lo, C.hi, C.step
    xs = np.arange(lo[0], hi[0] + st, st); ys = np.arange(lo[1], hi[1] + st, st); zs = np.arange(lo[2], hi[2] + st, st)
    YZ = np.stack(np.meshgrid(ys, zs, indexing='ij'), -1)
    vol = np.empty((len(xs), len(ys), len(zs)), np.float32)
    for i, x in enumerate(xs):
        p = np.concatenate([np.full(YZ.shape[:2] + (1,), x), YZ], -1)
        vol[i] = C.sdf(p)
    log('  grid', vol.shape, 'inside %.3f' % (vol < 0).mean())
    assert vol[0].min() > 0 and vol[-1].min() > 0 and vol[:, 0].min() > 0 and vol[:, -1].min() > 0 and vol[:, :, 0].min() > 0 and vol[:, :, -1].min() > 0, 'shape touches the grid edge: widen lo/hi'
    verts, faces, _, _ = measure.marching_cubes(vol, 0.0, spacing=(st, st, st))
    verts += lo
    faces = faces.astype(np.int64)
    log('  raw', len(verts), 'verts')
    W = adjacency(len(verts), faces)
    v = verts.copy()
    for it in range(10):
        v = v + 0.55 * (W @ v - v)
        v = v - 0.58 * (W @ v - v)
    return reproject(C, v), faces

def decimate(C, v, faces, tris, log=print):
    """quadric decimation (keeps detail where the surface bends), then a light relax + reproject"""
    import pyfqmr
    s = pyfqmr.Simplify()
    s.setMesh(v, faces)
    s.simplify_mesh(target_count=tris, aggressiveness=6, preserve_border=True, verbose=0)
    v2, f2, _ = s.getMesh()
    v2 = v2.astype(np.float64); f2 = f2.astype(np.int64)
    # drop degenerate / sliver triangles left by decimation
    a = length(np.cross(v2[f2[:, 1]] - v2[f2[:, 0]], v2[f2[:, 2]] - v2[f2[:, 0]]))
    f2 = f2[a > 1e-10]
    W = adjacency(len(v2), f2)
    for it in range(2):
        v2 = v2 + 0.4 * (W @ v2 - v2)
        v2 = v2 - 0.42 * (W @ v2 - v2)
    v2 = reproject(C, v2)
    log('  decimated', len(v2), 'verts', len(f2), 'tris')
    return v2, f2

def bake_ao(C, v, N, dists=(0.025, 0.06, 0.12, 0.22, 0.38)):
    """ambient occlusion from the distance field: how much the surface around each vertex closes in"""
    occ = np.zeros(len(v))
    for i, d in enumerate(dists):
        occ += np.clip((d - C.sdf(v + N * d)) / d, 0, 1) * (0.62 ** i)
    return np.clip(1 - occ * 0.62, 0.3, 1)

def shift_y(obj, dy):
    """move every [x, y, z] in an anchor tree up by dy"""
    if isinstance(obj, dict):  # directions (n, d, ...N) are not moved
        return {k: (x if (k in ('n', 'd') or k.endswith('N')) else shift_y(x, dy)) for k, x in obj.items()}
    if isinstance(obj, list):
        if len(obj) == 3 and all(isinstance(t, (int, float)) for t in obj):
            return [obj[0], round(obj[1] + dy, 5), obj[2]]
        return [shift_y(x, dy) for x in obj]
    return obj

def bone_world(bones):
    return {b[0]: np.array(b[2], float) for b in bones}

def bone_end(bones, name):
    """a bone's segment: from its position to its first child (or its own 'end')"""
    for b in bones:
        if b[0] == name and len(b) > 3 and b[3] is not None:
            return np.array(b[3], float)
    for b in bones:
        if b[1] == name:
            return np.array(b[2], float)
    p = [b for b in bones if b[0] == name][0]
    return np.array(p[2], float) + np.array((0, 0.05, 0))

def skin(C, v, faces, tau=0.035, sigma=0.09, smooth=18):
    """bone weights. Each part follows its own bones (nearest bone segment, soft at joints); parts blend
    where their surfaces meet; then the weights are relaxed over the mesh so joints bend smoothly.
    Returns the full weight matrix (vertices x bones) and the part-group ownership."""
    BI = {b[0]: i for i, b in enumerate(C.bones)}
    BW = bone_world(C.bones)
    parts = [P for P in C.parts if not P.sub]
    D = np.stack([P.fn(v) for P in parts])
    dmin = D.min(0)
    Wb = np.zeros((len(v), len(C.bones)))
    gw = {}
    for P, d in zip(parts, D):
        own = np.exp(-np.maximum(d - dmin, 0) / tau)
        gw[P.group] = gw.get(P.group, 0) + own
        sd = np.stack([seg_dist(v, BW[b], bone_end(C.bones, b)) for b in P.bones])
        bw = np.exp(-(sd - sd.min(0)) / sigma)
        bw /= bw.sum(0)
        for b, w in zip(P.bones, bw):
            Wb[:, BI[b]] += own * w
    Wb /= np.maximum(Wb.sum(1, keepdims=True), 1e-9)
    W = adjacency(len(v), faces)
    # harmonic relax: vertices clearly inside one part keep their weights, the blend zones between parts
    # are diffused over the surface, so joints get wide, smooth falloffs instead of sharp seams
    fixed = Wb.max(1) > 0.72  # clearly one bone: keep it
    W0 = Wb.copy()
    for it in range(smooth):
        Wb = Wb * 0.35 + (W @ Wb) * 0.65
        Wb[fixed] = W0[fixed] * 0.6 + Wb[fixed] * 0.4
    # the jaw: a clean split along the mouth line (so opening the mouth never drags the upper lip)
    if C.jaw_split is not None and 'jaw' in BI and 'head' in BI:
        j = np.clip(C.jaw_split(v), 0, 1)
        h = Wb[:, BI['head']] + Wb[:, BI['jaw']]
        Wb[:, BI['jaw']] = h * j
        Wb[:, BI['head']] = h * (1 - j)
    tot = sum(gw.values())
    return Wb, {k: g / tot for k, g in gw.items()}

def finalize_weights(Wb, prune=0.05):
    """at most 4 influences per vertex, tiny weights dropped, renormalised, packed to bytes"""
    Wb = np.where(Wb < prune, 0, Wb)
    Wb /= np.maximum(Wb.sum(1, keepdims=True), 1e-9)
    order = np.argsort(-Wb, 1)[:, :4]
    top = np.take_along_axis(Wb, order, 1)
    top /= np.maximum(top.sum(1, keepdims=True), 1e-9)
    w8 = np.round(top * 255).astype(int)
    w8[:, 0] += 255 - w8.sum(1)
    order = np.where(w8 > 0, order, order[:, :1])  # unused slots point at the main bone with weight 0
    return order.astype(np.uint8), w8.astype(np.uint8)

def grow_dirs(v, faces, N, belly, core_fn, belly_c):
    """direction each vertex moves when the creature gains weight: smoothed normals blended with the
    direction out from the body core, and straight out from the belly centre on the belly"""
    W = adjacency(len(v), faces)
    Ns = N.copy()
    for it in range(40):
        Ns = W @ Ns
    Ns = norm(Ns)
    rad = norm(v - core_fn(v))
    brad = norm(v - np.asarray(belly_c))
    f = Ns * 0.45 + rad * 0.55
    f = f * (1 - belly[:, None] * 0.7) + brad * (belly[:, None] * 0.7)
    for it in range(10):
        f = W @ f
    return norm(f), np.clip(W @ (W @ belly), 0, 1)

def hexc(h):
    return np.array([int(h[i:i + 2], 16) / 255 for i in (1, 3, 5)])

def mix(C, col, m):
    m = np.clip(m, 0, 1)[:, None]
    return C * (1 - m) + hexc(col) * m if isinstance(col, str) else C * (1 - m) + col * m

def encode(C, v, faces, colors, skI, skW, belly, fat, fdir, anchors, extra=None, dy=0.0):
    v = v + np.array((0, dy, 0))
    lo = v.min(0); hi = v.max(0)
    q = np.round((v - lo) / (hi - lo) * 65535).astype(np.uint16)
    idx = faces.astype(np.uint16 if len(v) < 65536 else np.uint32)
    b64 = lambda a: base64.b64encode(np.ascontiguousarray(a).tobytes()).decode()
    lin = np.clip(colors, 0, 1) ** 2.2
    out = dict(
        v=1, count=len(v), lo=lo.round(5).tolist(), hi=hi.round(5).tolist(), pos=b64(q), idx=b64(idx),
        idx32=bool(idx.dtype == np.uint32), col=b64(np.round(lin * 255).astype(np.uint8)), skI=b64(skI), skW=b64(skW),
        belly=b64(np.round(belly * 255).astype(np.uint8)), fat=b64(np.round(fat * 255).astype(np.uint8)),
        fdir=b64(np.round(fdir * 127).astype(np.int8)),
        bones=[dict(name=b[0], parent=[x[0] for x in C.bones].index(b[1]) if b[1] else -1, pos=[round(float(b[2][0]), 5), round(float(b[2][1] + (dy if b[1] else 0)), 5), round(float(b[2][2]), 5)]) for b in C.bones],
        anchors=shift_y(anchors, dy),
    )
    if extra:
        out.update(extra)
    return out

def r5(a):
    return np.round(np.asarray(a, float), 4).tolist()

def clearance(C, a_groups, b_groups, step=0.03):
    """smallest gap (m) between the surfaces of two sets of parts. Negative = they are fused together,
    which makes skin weights bleed (an arm that touches the belly drags the belly along)."""
    A = [P for P in C.parts if not P.sub and P.group in a_groups]
    B = [P for P in C.parts if not P.sub and P.group in b_groups]
    if not A or not B:
        return None
    xs = np.arange(C.lo[0], C.hi[0], step); ys = np.arange(C.lo[1], C.hi[1], step); zs = np.arange(C.lo[2], C.hi[2], step)
    best = 9.0
    for x in xs:
        g = np.stack(np.meshgrid([x], ys, zs, indexing='ij'), -1).reshape(-1, 3)
        da = np.minimum.reduce([P.fn(g) for P in A])
        on = np.abs(da) < step
        if not on.any():
            continue
        db = np.minimum.reduce([P.fn(g[on]) for P in B])
        best = min(best, float(db.min()))
    return best

def wedge(z0, z1, w0, w1, ylo0, ylo1, yhi0, yhi1, r):
    """a rounded box that tapers from the back (z0) to the front (z1): half-width w, bottom ylo, top yhi.
    Good for angular snouts and jaws with flat lip planes."""
    def f(p):
        x, y, z = p[..., 0], p[..., 1], p[..., 2]
        t = np.clip((z - z0) / (z1 - z0), 0, 1)
        hw = w0 + (w1 - w0) * t
        lo = ylo0 + (ylo1 - ylo0) * t
        hi = yhi0 + (yhi1 - yhi0) * t
        cy = (lo + hi) / 2; hh = (hi - lo) / 2
        cz = (z0 + z1) / 2; hz = (z1 - z0) / 2
        q = np.stack([np.abs(x) - hw + r, np.abs(y - cy) - hh + r, np.abs(z - cz) - hz + r], -1)
        return length(np.maximum(q, 0)) + np.minimum(q.max(-1), 0) - r
    return f
