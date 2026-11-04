"""v3: ONE flag colour per scene. Strip lives only in the sky (sky-key matte), so it
emerges from behind ridges/heads and passes behind people. Coloured light spill on subjects.
usage: python3 strip_render3.py <plate_dir> <out_dir> <fps> <colour> <t_start> <t_dur> <path>
path: semicolon list of x,y,depth  (0-1 screen)
"""
import sys, os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

src, dst, fps, colour, t0, tdur, path = sys.argv[1:8]
MODE = sys.argv[8] if len(sys.argv) > 8 else 'smooth'
fps, t0, tdur = float(fps), float(t0), float(tdur)
os.makedirs(dst, exist_ok=True)
files = sorted(f for f in os.listdir(src) if f.endswith('.png'))
W, H = Image.open(os.path.join(src, files[0])).size
COL = {'red': (206, 24, 40), 'white': (250, 246, 236), 'black': (14, 14, 16), 'green': (0, 140, 64)}[colour]
SPILL = {'red': (255, 60, 50), 'white': (255, 245, 225), 'black': (0, 0, 0), 'green': (40, 220, 110)}[colour]
P = np.array([[float(v) for v in p.split(',')] for p in path.split(';')])

def pt(t):
    n = len(P) - 1; t = min(max(t, 0.0), 0.99999) * n; i = int(t); u = t - i
    p0 = P[max(i - 1, 0)]; p1 = P[i]; p2 = P[min(i + 1, n)]; p3 = P[min(i + 2, n)]
    return 0.5 * ((2 * p1) + (-p0 + p2) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u * u + (-p0 + 3 * p1 - 3 * p2 + p3) * u ** 3)
def ease(x):
    x = min(max(x, 0.0), 1.0)
    if MODE == 'in': return x * x            # starts slow, leaves fast
    if MODE == 'lin': return x               # already moving, constant speed
    if MODE == 'out': return 1 - (1 - x) ** 2  # arrives fast, slows as it recedes
    return x * x * (3 - 2 * x)

LENGTH, N, BASE_W = 0.45, 140, 0.075 * H

def strip(t):
    img = Image.new('L', (W, H), 0)
    if t < t0: return img
    head = ease((t - t0) / tdur) * (1 + LENGTH); tail = head - LENGTH
    a, b = max(tail, 0.0), min(head, 1.0)
    if b <= a + 1e-3: return img
    pts = np.array([pt(a + (b - a) * k / N) for k in range(N + 1)])
    xy = pts[:, :2] * [W, H]; depth = pts[:, 2]
    tang = np.gradient(xy, axis=0); tang /= (np.linalg.norm(tang, axis=1, keepdims=True) + 1e-6)
    nrm = np.stack([-tang[:, 1], tang[:, 0]], 1)
    twist = 0.65 + 0.35 * np.abs(np.cos(np.linspace(0, 2.4 * np.pi, N + 1) + t * 1.2))
    width = BASE_W * (0.25 + 0.75 * depth) * twist * np.clip(np.linspace(0, 1, N + 1) * 4, 0.1, 1)
    d = ImageDraw.Draw(img)
    for k in range(N):
        q = [tuple(xy[k] + nrm[k] * width[k] / 2), tuple(xy[k + 1] + nrm[k + 1] * width[k + 1] / 2),
             tuple(xy[k + 1] - nrm[k + 1] * width[k + 1] / 2), tuple(xy[k] - nrm[k] * width[k] / 2)]
        d.polygon(q, fill=255)
    return img

rng = np.random.default_rng(5)
for i, f in enumerate(files):
    t = i / fps
    base = np.asarray(Image.open(os.path.join(src, f)).convert('RGB'), np.float32)
    r, g, b = base[..., 0], base[..., 1], base[..., 2]
    lum = base @ np.array([.299, .587, .114])
    sky = ((b > r + 8) & (lum > 95)).astype(np.float32)          # blue, bright = sky
    sky = np.asarray(Image.fromarray((sky * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(1.5)), np.float32) / 255
    m = np.mean([np.asarray(strip(t + s / (fps * 4)), np.float32) for s in range(4)], 0) / 255  # motion blur
    a = (m * sky)[..., None]
    # shading along the ribbon so it reads as a 3D band, not flat paint
    shade = 0.82 + 0.18 * np.asarray(Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(5)), np.float32)[..., None] / 255
    col = np.array(COL, np.float32) * shade
    out = base * (1 - a) + col * a
    # coloured light spill onto nearby subjects (non-sky), soft and weak
    glow = np.asarray(Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(60)), np.float32)[..., None] / 255
    if colour != 'black':
        out = out + (1 - sky[..., None]) * glow * 0.35 * (np.array(SPILL, np.float32) - out) * 0.6
    out += rng.normal(0, 3, out.shape)
    Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)).save(os.path.join(dst, f))
print('ok', len(files), colour)
