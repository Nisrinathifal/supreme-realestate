# Registers the night still to the day film's first frame (scale and shift on edge maps) and writes the aligned
# media/src/hero-night-01.png, so the scroll crossfade never doubles the facades. python3 scripts/align-night.py

import numpy as np
from PIL import Image, ImageFilter
W, H = 1920, 1080
day = Image.open("media/src/hero-still-03.png").convert("L")
night_src = Image.open("media/src/hero-night-01.webp").convert("RGB")
def cover(img, s):
    # scale night to cover W×H times s, centred, anchored top (like the CSS crop)
    k = max(W / img.width, H / img.height) * s
    im = img.resize((round(img.width * k), round(img.height * k)), Image.LANCZOS)
    left = (im.width - W) // 2
    return im.crop((left, 0, left + W, H))
def edges(img, f=4):
    g = img.filter(ImageFilter.FIND_EDGES).resize((W // f, H // f), Image.BOX)
    a = np.asarray(g, dtype=np.float32)
    a -= a.mean(); a /= (a.std() + 1e-6)
    return a
# houses band only (rows 30–80%), ignore sky and water
def band(a): return a[int(a.shape[0]*0.30):int(a.shape[0]*0.80)]
D = band(edges(day))
best = (-1, None)
for s in np.arange(0.94, 1.081, 0.01):
    nd = cover(night_src, s).convert("L")
    N = edges(nd)
    for dy in range(-14, 15):
        for dx in range(-14, 15):
            Ns = np.roll(np.roll(N, dy, axis=0), dx, axis=1)
            c = float((band(Ns) * D).mean())
            if c > best[0]: best = (c, (round(float(s), 3), dx * 4, dy * 4))
print("best corr", round(best[0], 4), "scale, dx, dy (full-res px):", best[1])
s, dx, dy = best[1]
# refine offset at full res around the coarse result
nd = cover(night_src, s).convert("L")
Nf = np.asarray(nd.filter(ImageFilter.FIND_EDGES), dtype=np.float32); Nf -= Nf.mean(); Nf /= Nf.std() + 1e-6
Df = np.asarray(day.filter(ImageFilter.FIND_EDGES), dtype=np.float32); Df -= Df.mean(); Df /= Df.std() + 1e-6
Db = Df[324:864]
bestf = (-1, (dx, dy))
for ddy in range(dy - 4, dy + 5):
    for ddx in range(dx - 4, dx + 5):
        c = float((np.roll(np.roll(Nf, ddy, axis=0), ddx, axis=1)[324:864] * Db).mean())
        if c > bestf[0]: bestf = (c, (ddx, ddy))
dx, dy = bestf[1]
print("refined corr", round(bestf[0], 4), "dx, dy:", dx, dy)
# write the aligned night: covered at scale s, shifted by (dx, dy), edges filled by the image itself (clamp)
al = cover(night_src, s)
out = Image.new("RGB", (W, H))
out.paste(al, (dx, dy))
# fill any uncovered strip by stretching the nearest edge row/column
a = np.asarray(out).copy()
if dy > 0: a[:dy] = a[dy]
if dy < 0: a[H + dy:] = a[H + dy - 1]
if dx > 0: a[:, :dx] = a[:, dx:dx + 1]
if dx < 0: a[:, W + dx:] = a[:, W + dx - 1:W + dx]
Image.fromarray(a).save("media/src/hero-night-01.png")
print("wrote media/src/hero-night-01.png")
