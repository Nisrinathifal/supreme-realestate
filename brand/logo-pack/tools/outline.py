"""Outline the wordmark letters from Outfit (SIL OFL) into SVG path data.
Writes tools/glyphs.json: per weight, per letter {d, adv} in units where cap height = 100.
SUPREME uses Outfit interpolated between Regular and Bold (Medium-ish); tagline uses Regular.
Usage: python3 tools/outline.py [path/to/Outfit-Regular.ttf] [path/to/Outfit-Bold.ttf]
"""
import json, sys, os
from fontTools.ttLib import TTFont
from fontTools.pens.recordingPen import DecomposingRecordingPen

here = os.path.dirname(os.path.abspath(__file__))
fonts = os.path.expanduser("~/Library/Fonts")
reg_path = sys.argv[1] if len(sys.argv) > 1 else os.path.join(fonts, "Outfit-Regular.ttf")
bold_path = sys.argv[2] if len(sys.argv) > 2 else os.path.join(fonts, "Outfit-Bold.ttf")
reg, bold = TTFont(reg_path), TTFont(bold_path)

def record(font, ch):
    gs = font.getGlyphSet()
    name = font.getBestCmap()[ord(ch)]
    pen = DecomposingRecordingPen(gs)
    gs[name].draw(pen)
    return pen.value, gs[name].width

def segments(ops):
    """Split recorded ops into contours of segments between on-curve points.
    Each segment: ("L", p0, p3) or ("C", p0, c1, c2, p3); quadratic splines are refit as one cubic
    so Regular and Bold get the same structure and can be interpolated."""
    contours, cur, start, pos = [], [], None, None
    for op, pts in ops:
        if op == "moveTo":
            start = pos = pts[0]; cur = []
        elif op == "lineTo":
            cur.append(("L", pos, pts[0])); pos = pts[0]
        elif op == "curveTo":
            cur.append(("C", pos, *pts)); pos = pts[-1]
        elif op == "qCurveTo":
            cur.append(fit_quad_spline(pos, pts)); pos = pts[-1]
        elif op in ("closePath", "endPath"):
            if pos != start: cur.append(("L", pos, start))
            contours.append(cur)
    return contours

def quad_spline_points(p0, pts, n=24):
    *offs, end = pts
    ons = [p0] + [((offs[i][0] + offs[i + 1][0]) / 2, (offs[i][1] + offs[i + 1][1]) / 2) for i in range(len(offs) - 1)] + [end]
    out = []
    for i, c in enumerate(offs):
        a, b = ons[i], ons[i + 1]
        for k in range(n):
            u = k / n
            out.append(((1-u)**2*a[0] + 2*(1-u)*u*c[0] + u*u*b[0], (1-u)**2*a[1] + 2*(1-u)*u*c[1] + u*u*b[1]))
    out.append(end)
    return out

def fit_quad_spline(p0, pts):
    """Least-squares cubic with fixed endpoints and end tangents (Schneider)."""
    import math
    samples = quad_spline_points(p0, pts)
    p3 = pts[-1]
    def unit(v):
        l = math.hypot(*v) or 1
        return (v[0] / l, v[1] / l)
    t1 = unit((pts[0][0] - p0[0], pts[0][1] - p0[1]))
    t2 = unit((pts[-2][0] - p3[0], pts[-2][1] - p3[1]))
    # chord-length parametrisation
    d = [0.0]
    for i in range(1, len(samples)):
        d.append(d[-1] + math.hypot(samples[i][0] - samples[i-1][0], samples[i][1] - samples[i-1][1]))
    us = [x / d[-1] for x in d]
    C = [[0, 0], [0, 0]]; X = [0, 0]
    for (px, py), u in zip(samples, us):
        b0, b1, b2, b3 = (1-u)**3, 3*u*(1-u)**2, 3*u*u*(1-u), u**3
        A1 = (t1[0] * b1, t1[1] * b1); A2 = (t2[0] * b2, t2[1] * b2)
        C[0][0] += A1[0]*A1[0] + A1[1]*A1[1]; C[0][1] += A1[0]*A2[0] + A1[1]*A2[1]
        C[1][1] += A2[0]*A2[0] + A2[1]*A2[1]
        tx = px - (p0[0]*(b0+b1) + p3[0]*(b2+b3)); ty = py - (p0[1]*(b0+b1) + p3[1]*(b2+b3))
        X[0] += A1[0]*tx + A1[1]*ty; X[1] += A2[0]*tx + A2[1]*ty
    C[1][0] = C[0][1]
    det = C[0][0]*C[1][1] - C[0][1]*C[1][0]
    seg = math.hypot(p3[0]-p0[0], p3[1]-p0[1])
    if abs(det) < 1e-9:
        a1 = a2 = seg / 3
    else:
        a1 = (X[0]*C[1][1] - X[1]*C[0][1]) / det; a2 = (C[0][0]*X[1] - C[1][0]*X[0]) / det
        if a1 <= 0 or a2 <= 0: a1 = a2 = seg / 3
    return ("C", p0, (p0[0] + t1[0]*a1, p0[1] + t1[1]*a1), (p3[0] + t2[0]*a2, p3[1] + t2[1]*a2), p3)

def as_cubic(seg):
    if seg[0] == "C": return seg
    _, a, b = seg
    return ("C", a, (a[0] + (b[0]-a[0])/3, a[1] + (b[1]-a[1])/3), (a[0] + 2*(b[0]-a[0])/3, a[1] + 2*(b[1]-a[1])/3), b)

def lerp_ops(a, b, t):
    ca, cb = segments(a), segments(b)
    if len(ca) != len(cb) or any(len(x) != len(y) for x, y in zip(ca, cb)):
        return None
    L = lambda p, q: (p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t)
    ops = []
    for sa, sb in zip(ca, cb):
        ops.append(("moveTo", (L(sa[0][1], sb[0][1]),)))
        for x, y in zip(sa, sb):
            if x[0] == "L" and y[0] == "L":
                ops.append(("lineTo", (L(x[2], y[2]),)))
            else:
                x, y = as_cubic(x), as_cubic(y)
                ops.append(("curveTo", tuple(L(p, q) for p, q in zip(x[2:], y[2:]))))
        ops.append(("closePath", ()))
    return ops


def to_d(ops, scale, cap):
    f = lambda p: f"{p[0] * scale:.2f} {(cap - p[1]) * scale:.2f}"
    out = []
    for op, pts in ops:
        if op == "moveTo": out.append("M" + f(pts[0]))
        elif op == "lineTo": out.append("L" + f(pts[0]))
        elif op == "curveTo": out.append("C" + " ".join(f(p) for p in pts))
        elif op == "qCurveTo":
            # expand implied on-curve points of TrueType quadratic splines
            *offs, end = pts
            for i, c in enumerate(offs):
                nxt = end if i == len(offs) - 1 else ((c[0] + offs[i + 1][0]) / 2, (c[1] + offs[i + 1][1]) / 2)
                out.append("Q" + f(c) + " " + f(nxt))
        elif op in ("closePath", "endPath"): out.append("Z")
    return "".join(out)

cap = reg["OS/2"].sCapHeight
scale = 100 / cap
result = {"source": "Outfit (SIL Open Font License)", "capHeight": 100, "weights": {}}
for key, t in (("medium", 0.5), ("regular", 0.0)):
    glyphs = {}
    for ch in sorted(set("SUPREMEREALSTATE")):
        a, adv_a = record(reg, ch)
        b, adv_b = record(bold, ch)
        ops = lerp_ops(a, b, t)
        if ops is None:
            print(f"warning: {ch} not interpolation-compatible, using Regular", file=sys.stderr)
            ops, adv_b = a, adv_a
        adv = adv_a + (adv_b - adv_a) * t
        glyphs[ch] = {"d": to_d(ops, scale, cap), "adv": round(adv * scale, 2)}
    result["weights"][key] = glyphs
json.dump(result, open(os.path.join(here, "glyphs.json"), "w"), indent=1)
print("ok", list(result["weights"]["medium"].keys()))
