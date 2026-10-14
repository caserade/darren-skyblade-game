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

def mesh(C, log=print):
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
    for it in range(12):
        v = v + 0.55 * (W @ v - v)
        v = v - 0.58 * (W @ v - v)
    for it in range(2):  # pull back onto the true surface (keeps grooves crisp)
        d = C.sdf(v)
        eps = 1e-3
        g = norm(np.stack([(C.sdf(v + dv) - C.sdf(v - dv)) / (2 * eps) for dv in np.eye(3) * eps], -1))
        v = v - g * d[:, None] * 0.8
    import pyfqmr
    s = pyfqmr.Simplify()
    s.setMesh(v, faces)
    s.simplify_mesh(target_count=C.tris, aggressiveness=5, preserve_border=True, verbose=0)
    v, faces, _ = s.getMesh()
    v = v.astype(np.float64); faces = faces.astype(np.int64)
    log('  decimated', len(v), 'verts', len(faces), 'tris')
    return v, faces

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

def skin(C, v, tau=0.035, sigma=0.09):
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
    order = np.argsort(-Wb, 1)[:, :4]
    top = np.take_along_axis(Wb, order, 1)
    top /= top.sum(1, keepdims=True)
    w8 = np.round(top * 255).astype(int)
    w8[:, 0] += 255 - w8.sum(1)
    tot = sum(gw.values())
    return order.astype(np.uint8), w8.astype(np.uint8), {k: g / tot for k, g in gw.items()}

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

def encode(C, v, faces, colors, skI, skW, belly, fat, fdir, anchors, extra=None):
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
        bones=[dict(name=b[0], parent=[x[0] for x in C.bones].index(b[1]) if b[1] else -1, pos=[round(float(t), 5) for t in b[2]]) for b in C.bones],
        anchors=anchors,
    )
    if extra:
        out.update(extra)
    return out

def r5(a):
    return np.round(np.asarray(a, float), 4).tolist()
