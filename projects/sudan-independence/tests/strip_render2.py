"""v2: slower flag strip, occluded by dark foreground (mast, ropes), two looks.
usage: python3 strip_render2.py <plate_dir> <out_dir> <fps> <look: threads|ribbon> <dominant: white|red|green|black|all>
"""
import sys, os, math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

src, dst, fps, look, dom = sys.argv[1], sys.argv[2], float(sys.argv[3]), sys.argv[4], sys.argv[5]
os.makedirs(dst, exist_ok=True)
files = sorted(f for f in os.listdir(src) if f.endswith('.png'))
W, H = Image.open(os.path.join(src, files[0])).size
COL = {'red': (214, 28, 44), 'white': (255, 250, 238), 'black': (16, 16, 18), 'green': (0, 150, 70)}

# path: born on the horizon at left, rises, passes BEHIND the mast (far), loops IN FRONT (near), exits right
P = np.array([[-0.08, 0.875, 0.05], [0.18, 0.84, 0.15], [0.42, 0.55, 0.35], [0.56, 0.36, 0.40],
              [0.40, 0.22, 0.85], [0.70, 0.16, 1.0], [1.20, 0.30, 0.7]])
def pt(t):
    n = len(P) - 1; t = min(max(t, 0.0), 0.99999) * n; i = int(t); u = t - i
    p0 = P[max(i - 1, 0)]; p1 = P[i]; p2 = P[min(i + 1, n)]; p3 = P[min(i + 2, n)]
    return 0.5 * ((2 * p1) + (-p0 + p2) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u * u + (-p0 + 3 * p1 - 3 * p2 + p3) * u ** 3)
def ease(x):
    x = min(max(x, 0.0), 1.0); return x * x * (3 - 2 * x)

T_TOTAL, LENGTH, N = 5.2, 0.5, 140      # slower than v1 (3.3s)
BASE_W = 0.09 * H

def geometry(t):
    head = ease(t / T_TOTAL) * (1 + LENGTH); tail = head - LENGTH
    a, b = max(tail, 0.0), min(head, 1.0)
    if b <= a + 1e-3: return None
    pts = np.array([pt(a + (b - a) * k / N) for k in range(N + 1)])
    xy = pts[:, :2] * [W, H]; depth = pts[:, 2]
    tang = np.gradient(xy, axis=0); tang /= (np.linalg.norm(tang, axis=1, keepdims=True) + 1e-6)
    nrm = np.stack([-tang[:, 1], tang[:, 0]], 1)
    width = BASE_W * (0.2 + 0.8 * depth) * np.clip(np.linspace(0, 1, N + 1) * 4, 0.12, 1)
    return xy, depth, nrm, width, head <= 1.0, tang

def strands():
    # (colour, offset across width -0.5..0.5, thickness factor)
    base = {'all': ['red'] * 4 + ['white'] * 4 + ['black'] * 3 + ['green'] * 3}
    order = {'white': ['white'] * 7 + ['red'] * 2 + ['green'] * 2 + ['black'] * 2,
             'red': ['red'] * 7 + ['white'] * 2 + ['green'] * 2 + ['black'] * 2,
             'green': ['green'] * 7 + ['white'] * 2 + ['red'] * 2 + ['black'] * 2,
             'black': ['black'] * 6 + ['white'] * 3 + ['red'] * 2 + ['green'] * 2}.get(dom, base['all'])
    rng = np.random.default_rng(3); rng.shuffle(order)
    return [(c, -0.5 + (i + 0.5) / len(order), 0.8 + 0.6 * rng.random()) for i, c in enumerate(order)]
STR = strands()

def draw(t, front):
    g = geometry(t)
    img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    if g is None: return img
    xy, depth, nrm, width, has_tip, tang = g
    d = ImageDraw.Draw(img)
    keep = depth >= 0.6 if front else depth < 0.6
    if look == 'ribbon':
        bands = [('red', -0.5, -1 / 6), ('white', -1 / 6, 1 / 6), ('black', 1 / 6, 0.5)]
        for c, o1, o2 in bands:
            for k in range(N):
                if not keep[k]: continue
                q = [tuple(xy[k] + nrm[k] * width[k] * o1), tuple(xy[k + 1] + nrm[k + 1] * width[k + 1] * o1),
                     tuple(xy[k + 1] + nrm[k + 1] * width[k + 1] * o2), tuple(xy[k] + nrm[k] * width[k] * o2)]
                d.polygon(q, fill=COL[c] + (255,))
        if has_tip and keep[-1]:
            tip = xy[-1] + tang[-1] * width[-1] * 1.1
            d.polygon([tuple(xy[-1] + nrm[-1] * width[-1] * .5), tuple(tip), tuple(xy[-1] - nrm[-1] * width[-1] * .5)], fill=COL['green'] + (255,))
    else:
        for c, off, th in STR:
            wob = off + 0.06 * np.sin(np.linspace(0, 6, N + 1) + t * 1.5 + off * 9)
            line = xy + nrm * (width * 1.6 * wob)[:, None]
            for k in range(N):
                if not keep[k]: continue
                w = max(1, int(th * (1 + 2.2 * depth[k])))
                d.line([tuple(line[k]), tuple(line[k + 1])], fill=COL[c] + (255,), width=w)
    return img

def comp(base, layer, glow):
    a = np.asarray(layer, np.float32); al = a[..., 3:4] / 255.0
    col = a[..., :3]
    out = base * (1 - al) + col * al
    if glow and look == 'threads':
        lit = Image.fromarray(np.clip(col * al * (1 - (col.sum(-1, keepdims=True) < 90)), 0, 255).astype(np.uint8))
        g1 = np.asarray(lit.filter(ImageFilter.GaussianBlur(6)), np.float32)
        g2 = np.asarray(lit.filter(ImageFilter.GaussianBlur(22)), np.float32)
        out = out + 0.55 * g1 + 0.35 * g2   # glow only on lit colours, black stays ink
    return out

rng = np.random.default_rng(7)
for i, f in enumerate(files):
    t = i / fps
    plate = Image.open(os.path.join(src, f)).convert('RGB')
    base = np.asarray(plate, np.float32)
    # foreground matte: pixels clearly darker than their row's sky level (mast, ropes, gull, cloth)
    lum = base @ np.array([0.299, 0.587, 0.114])
    ref = np.percentile(lum, 70, axis=1, keepdims=True)
    fg = (lum < ref - 28).astype(np.float32)
    fg[int(H * 0.86):, :] = 0
    fg = np.asarray(Image.fromarray((fg * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2)), np.float32)[..., None] / 255
    back = Image.new('RGBA', (W, H), (0, 0, 0, 0)); front = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    subs_b = [np.asarray(draw(t + s / (fps * 4), False), np.float32) for s in range(4)]
    subs_f = [np.asarray(draw(t + s / (fps * 4), True), np.float32) for s in range(4)]
    lb = Image.fromarray(np.mean(subs_b, 0).astype(np.uint8)); lf = Image.fromarray(np.mean(subs_f, 0).astype(np.uint8))
    behind = comp(base, lb, True)
    out = behind * (1 - fg) + base * fg          # mast/ropes stay in front of the far part
    out = comp(out, lf, True)                    # near part passes in front
    out = out * 0.97 + rng.normal(0, 3.5, out.shape)
    Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)).save(os.path.join(dst, f))
print('rendered', len(files), look, dom)
