"""Render a Sudan-flag ribbon (red/white/black bands, green triangle tip) over plate frames.
usage: python3 strip_render.py <in_frames_dir> <out_frames_dir> <fps>
Path is screen-space bezier with a depth factor for perspective width.
"""
import sys, os, math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

src, dst, fps = sys.argv[1], sys.argv[2], float(sys.argv[3])
os.makedirs(dst, exist_ok=True)
files = sorted(f for f in os.listdir(src) if f.endswith('.png'))
W, H = Image.open(os.path.join(src, files[0])).size

RED, WHITE, BLACK, GREEN = (206, 17, 38), (246, 242, 234), (14, 14, 14), (0, 114, 41)

# control points (x, y in 0-1 screen, depth d: 0 far .. 1 near)
P = np.array([[-0.08, 0.875, 0.05], [0.25, 0.80, 0.35], [0.30, 0.30, 1.0],
              [0.62, 0.18, 0.75], [0.95, 0.28, 0.55], [1.25, 0.40, 0.45]])

def bez(t):
    # Catmull-Rom through P for a smooth ribbon path
    n = len(P) - 1
    t = min(max(t, 0.0), 0.99999) * (n)
    i = int(t); u = t - i
    p0 = P[max(i - 1, 0)]; p1 = P[i]; p2 = P[min(i + 1, n)]; p3 = P[min(i + 2, n)]
    return 0.5 * ((2 * p1) + (-p0 + p2) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u * u + (-p0 + 3 * p1 - 3 * p2 + p3) * u ** 3)

def ease(x):
    x = min(max(x, 0.0), 1.0)
    return x * x * (3 - 2 * x)

T_TOTAL = 3.3          # seconds for head to travel the full path
LENGTH = 0.42          # ribbon length as fraction of path
BASE_W = 0.085 * H     # ribbon width at depth 1

def ribbon_layer(t):
    head = ease(t / T_TOTAL) * (1 + LENGTH)
    tail = head - LENGTH
    a, b = max(tail, 0.0), min(head, 1.0)
    img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    if b <= a + 1e-3:
        return img
    d = ImageDraw.Draw(img)
    N = 90
    pts = [bez(a + (b - a) * k / N) for k in range(N + 1)]
    xy = np.array([[p[0] * W, p[1] * H] for p in pts])
    depth = np.array([p[2] for p in pts])
    tang = np.gradient(xy, axis=0)
    tang /= (np.linalg.norm(tang, axis=1, keepdims=True) + 1e-6)
    nrm = np.stack([-tang[:, 1], tang[:, 0]], axis=1)
    # gentle twist: band width breathes along the length
    phase = np.linspace(0, 2.2 * math.pi, N + 1) + t * 3.0
    width = BASE_W * (0.25 + 0.75 * depth) * (0.72 + 0.28 * np.abs(np.cos(phase)))
    # taper the tail
    taper = np.clip(np.linspace(0, 1, N + 1) * 4, 0.15, 1.0)
    width *= taper
    bands = [(RED, -0.5, -1 / 6), (WHITE, -1 / 6, 1 / 6), (BLACK, 1 / 6, 0.5)]
    for col, o1, o2 in bands:
        for k in range(N):
            q = [tuple(xy[k] + nrm[k] * width[k] * o1), tuple(xy[k + 1] + nrm[k + 1] * width[k + 1] * o1),
                 tuple(xy[k + 1] + nrm[k + 1] * width[k + 1] * o2), tuple(xy[k] + nrm[k] * width[k] * o2)]
            d.polygon(q, fill=col + (255,))
    if head <= 1.0:  # green triangle tip leading the ribbon
        tip = xy[-1] + tang[-1] * width[-1] * 1.1
        d.polygon([tuple(xy[-1] + nrm[-1] * width[-1] * 0.5), tuple(tip),
                   tuple(xy[-1] - nrm[-1] * width[-1] * 0.5)], fill=GREEN + (255,))
    return img

rng = np.random.default_rng(7)
for i, f in enumerate(files):
    t = i / fps
    plate = Image.open(os.path.join(src, f)).convert('RGB')
    # motion blur: average 4 sub-frames
    subs = [np.asarray(ribbon_layer(t + s / (fps * 4)), dtype=np.float32) for s in range(4)]
    rib = np.mean(subs, axis=0)
    alpha = rib[..., 3:4] / 255.0
    col = rib[..., :3] / np.maximum(alpha, 1e-3)
    # match plate: warm golden light, slight lift, grain
    col = col * 0.88 + np.array([255, 190, 120]) * 0.10
    col += rng.normal(0, 6, col.shape)
    base = np.asarray(plate, dtype=np.float32)
    # soft shadow / spill under the ribbon
    sh = Image.fromarray((alpha[..., 0] * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(18))
    sh = np.roll(np.asarray(sh, dtype=np.float32) / 255.0, (14, 10), axis=(0, 1))[..., None]
    base = base * (1 - 0.22 * sh)
    out = base * (1 - alpha) + np.clip(col, 0, 255) * alpha
    Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)).save(os.path.join(dst, f))
print('rendered', len(files))
