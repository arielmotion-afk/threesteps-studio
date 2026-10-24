// Night prints: the riso logic at 1280 x 720, full-bleed and darker.
// Each shot is a light field: per pixel, L (cool light, 0 dark .. 1 bare paper) and W (warm
// light: fire, lamp, lilies; or the orchid's pink). The renderer prints three inks over paper,
// each a halftone at its own angle and a little out of register:
//   midnight  the deepest dark      blue  the night      warm  fire / lamps / lilies
// Shapes are drawn once into masks, then sampled through a small noise warp.

const RW = 1280, RH = 720, TAU = Math.PI * 2;
const ORANGE = "#ff6a33", PINK = "#ff4f9e";
const PAPER = [239, 231, 212], MIDNIGHT = [27, 33, 80], BLUE = [58, 95, 208];

const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, x) => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const g2 = (x, y, cx, cy, r) => Math.exp(-((x - cx) ** 2 + (y - cy) ** 2) / (2 * r * r));
function hash(x, y) {
  let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function noise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
// Woodblock grain: long soft bands plus fine streaks, for the printed blue areas.
const grain = (x, y) => (noise(x * 0.003, y * 0.02) - 0.5) * 0.09 + (noise(x * 0.35, y * 0.012) - 0.5) * 0.05;
// Shared warp: every mask lookup in a pixel uses the same slightly wandering coordinate.
const warp = (x, y, a = 2.5) => [x + (noise(x * 0.025, y * 0.025) - 0.5) * 2 * a, y + (noise(x * 0.025 + 40, y * 0.025) - 0.5) * 2 * a];
// Kasumi: a flat band of mist with rounded ends, wavering a little.
const kasumi = (x, y, x0, x1, yc, hh) => {
  const yy = yc + Math.sin(x * 0.004 + yc) * hh * 0.4;
  if (Math.abs(y - yy) > hh) return false;
  const r = hh, dx = x < x0 + r ? x0 + r - x : x > x1 - r ? x - (x1 - r) : 0;
  return dx * dx + (y - yy) ** 2 <= r * r;
};
// Lancet arch: tall pointed window.
function lancet(x, y, cx, w, spring, bottom, r) {
  if (x < cx - w / 2 || x >= cx + w / 2 || y >= bottom) return false;
  if (y >= spring) return true;
  const lc = cx - w / 2 + r, rc = cx + w / 2 - r;
  return (x - lc) ** 2 + (y - spring) ** 2 <= r * r && (x - rc) ** 2 + (y - spring) ** 2 <= r * r;
}

function makeMask(draw) {
  const c = document.createElement("canvas");
  c.width = RW;
  c.height = RH;
  const g = c.getContext("2d", { willReadFrequently: true });
  g.fillStyle = g.strokeStyle = "#fff";
  g.lineCap = g.lineJoin = "round";
  draw(g);
  const d = g.getImageData(0, 0, RW, RH).data;
  return (x, y) => {
    x = Math.round(x); y = Math.round(y);
    return x < 0 || y < 0 || x >= RW || y >= RH ? 0 : d[(y * RW + x) * 4 + 3] / 255;
  };
}

// ── Shapes ──────────────────────────────────────

// A flat pad of pine needles, the way woodblock prints draw them.
function pinePad(g, x, y, w, h, s) {
  const n = Math.max(4, Math.round(w / 16));
  g.beginPath();
  for (let k = 0; k <= n; k++) {
    const px = x - w / 2 + (k / n) * w;
    const ph = h * (0.5 + 0.5 * Math.sin((k / n) * Math.PI)) * (0.7 + 0.3 * hash(k, s));
    g.moveTo(px + w / n, y);
    g.ellipse(px, y - ph * 0.3, (w / n) * 0.95, ph * 0.55, 0, 0, TAU);
  }
  g.fill();
  g.lineWidth = 1.6;
  g.beginPath();
  for (let k = 0; k < w / 3; k++) {
    const px = x - w / 2 + k * 3 + hash(k, s) * 2;
    const top = y - h * 0.45 * (0.55 + 0.45 * Math.sin(((px - x + w / 2) / w) * Math.PI));
    g.moveTo(px, top + 5);
    g.lineTo(px + (hash(k, s + 1) - 0.5) * 7, top - 5 - hash(k, s + 2) * 9);
  }
  g.stroke();
}

// A tapering trunk along a list of points.
function trunk(g, pts, w0, w1) {
  for (let i = 0; i < pts.length - 1; i++) {
    g.lineWidth = lerp(w0, w1, i / (pts.length - 1));
    g.beginPath(); g.moveTo(...pts[i]); g.lineTo(...pts[i + 1]); g.stroke();
  }
}

// Higanbana, the red spider lily: recurved petals and long stamens, on a bare stem.
function lily(gw, gd, x, y, s, k) {
  gd.lineWidth = Math.max(1.6, s * 0.08);
  gd.beginPath(); gd.moveTo(x, y); gd.quadraticCurveTo(x + (hash(k, 1) - 0.5) * s, y + s * 2, x + (hash(k, 2) - 0.5) * s * 0.6, y + s * 5); gd.stroke();
  gw.lineWidth = Math.max(1.6, s * 0.16);
  gw.beginPath();
  for (let p = 0; p < 6; p++) {
    const a = -Math.PI / 2 + (p - 2.5) * 0.55 + (hash(k, p) - 0.5) * 0.3;
    gw.moveTo(x, y);
    gw.quadraticCurveTo(x + Math.cos(a) * s * 0.7, y + Math.sin(a) * s * 0.6 - s * 0.2, x + Math.cos(a) * s * 0.9, y + Math.sin(a) * s * 0.4 + s * 0.15);
  }
  gw.stroke();
  gw.lineWidth = Math.max(1, s * 0.05);
  gw.beginPath();
  for (let p = 0; p < 7; p++) {
    const a = -Math.PI / 2 + (p - 3) * 0.32;
    gw.moveTo(x, y);
    gw.quadraticCurveTo(x + Math.cos(a) * s * 0.9, y + Math.sin(a) * s * 1.1, x + Math.cos(a) * s * 1.5, y + Math.sin(a) * s * 1.5 - s * 0.2);
  }
  gw.stroke();
}

// Grass blades rising from the bottom edge.
function grass(g, x0, x1, hMin, hMax, n, s, base = RH + 6) {
  g.lineWidth = 2.2;
  g.beginPath();
  for (let i = 0; i < n; i++) {
    const x = lerp(x0, x1, hash(i, s)), h = lerp(hMin, hMax, hash(i, s + 1)), bend = (hash(i, s + 2) - 0.5) * h * 0.5;
    g.moveTo(x, base); g.quadraticCurveTo(x + bend * 0.3, base - h * 0.6, x + bend, base - h);
  }
  g.stroke();
}

// ── People ──────────────────────────────────

function mirror(fn) { fn(1); fn(-1); }

// Period silhouettes (B's shape, without the kimono): sloping shoulders, a fitted waist, long
// skirts with a trailing hem; the men in long coats over boots.
// variant "mantle": a short cape over the shoulders, hands below it.
// variant "bell":   long sleeves that widen to the wrist.
function period(G, x, base, h, c, variant) {
  const { b, p, l } = G, hr = h * 0.062, top = base - h, sw = h * 0.2 * (c.broad || 1);
  const waistY = top + h * 0.43, waist = sw * (c.male ? 0.38 : 0.28);
  b.beginPath(); b.ellipse(x, top + hr, hr * 0.8, hr, 0, 0, TAU); b.fill();
  if (c.hair) {
    b.beginPath();
    b.moveTo(x - hr * 1.05, top + hr * 0.7); b.quadraticCurveTo(x - hr * 1.7, top + h * 0.3, x - hr * 1.5, top + h * 0.64);
    b.lineTo(x + hr * 1.5, top + h * 0.64); b.quadraticCurveTo(x + hr * 1.7, top + h * 0.3, x + hr * 1.05, top + hr * 0.7);
    b.fill();
  }
  b.beginPath();
  b.moveTo(x - hr * 0.4, top + hr * 1.8); b.lineTo(x + hr * 0.4, top + hr * 1.8); b.lineTo(x + sw / 2, top + hr * 2.9);
  b.lineTo(x + waist, waistY);
  if (c.male) {
    b.lineTo(x + sw * 0.44, base - h * 0.16); b.lineTo(x - sw * 0.44, base - h * 0.16);
  } else {
    b.lineTo(x + sw * 0.5, base - h * 0.03); b.quadraticCurveTo(x + sw * 0.62, base - h * 0.005, x + sw * 0.8, base);
    b.lineTo(x - sw * 0.52, base); b.lineTo(x - sw * 0.5, base - h * 0.03);
  }
  b.lineTo(x - waist, waistY); b.lineTo(x - sw / 2, top + hr * 2.9);
  b.fill();
  if (c.male) { // boots below the coat
    b.lineWidth = h * 0.045;
    b.beginPath(); b.moveTo(x - sw * 0.17, base - h * 0.17); b.lineTo(x - sw * 0.19, base - 2); b.moveTo(x + sw * 0.17, base - h * 0.17); b.lineTo(x + sw * 0.2, base - 2); b.stroke();
  }
  let hand;
  if (variant === "mantle") {
    b.beginPath();
    b.moveTo(x - hr * 0.5, top + hr * 1.9); b.lineTo(x + hr * 0.5, top + hr * 1.9);
    b.quadraticCurveTo(x + sw * 0.56, top + hr * 2.3, x + sw * 0.56, top + h * 0.33);
    b.quadraticCurveTo(x + sw * 0.28, top + h * 0.35, x, top + h * 0.34);
    b.quadraticCurveTo(x - sw * 0.28, top + h * 0.35, x - sw * 0.56, top + h * 0.33);
    b.quadraticCurveTo(x - sw * 0.56, top + hr * 2.3, x - hr * 0.5, top + hr * 1.9);
    b.fill();
    b.lineWidth = h * 0.032;
    b.beginPath(); mirror((s) => { b.moveTo(x + s * sw * 0.44, top + h * 0.32); b.lineTo(x + s * sw * 0.46, top + h * 0.48); }); b.stroke();
    hand = (s) => [x + s * sw * 0.46, top + h * 0.48];
  } else {
    mirror((s) => {
      b.beginPath();
      b.moveTo(x + s * sw * 0.4, top + hr * 3); b.lineTo(x + s * sw * 0.56, top + hr * 3.6);
      b.lineTo(x + s * sw * 0.76, top + h * 0.5); b.quadraticCurveTo(x + s * sw * 0.6, top + h * 0.54, x + s * sw * 0.45, top + h * 0.5);
      b.lineTo(x + s * sw * 0.34, top + hr * 4);
      b.fill();
    });
    hand = (s) => [x + s * sw * 0.6, top + h * 0.54];
  }
  if (c.feltHat) {
    b.beginPath(); b.ellipse(x, top + hr * 0.45, hr * 2.3, hr * 0.42, -0.06, 0, TAU); b.fill();
    b.beginPath(); b.moveTo(x - hr * 0.9, top + hr * 0.4); b.quadraticCurveTo(x - hr * 0.9, top - hr * 1.1, x, top - hr * 1.1); b.quadraticCurveTo(x + hr * 0.9, top - hr * 1.1, x + hr * 0.9, top + hr * 0.4); b.fill();
  }
  if (c.topHat) { b.fillRect(x - hr * 0.75, top - hr * 1.9, hr * 1.5, hr * 2.1); b.fillRect(x - hr * 1.4, top - hr * 0.05, hr * 2.8, hr * 0.4); }
  if (c.cap) { b.beginPath(); b.ellipse(x, top + hr * 0.15, hr * 1.25, hr * 0.85, 0, 0, TAU); b.fill(); b.beginPath(); b.ellipse(x, top + hr * 0.75, hr * 1.4, hr * 0.3, 0, 0, TAU); b.fill(); }
  if (c.shawl) { b.beginPath(); b.moveTo(x - hr * 0.6, top + hr * 1.8); b.lineTo(x + hr * 0.6, top + hr * 1.8); b.lineTo(x + sw * 0.7, top + h * 0.3); b.lineTo(x, top + h * 0.4); b.lineTo(x - sw * 0.7, top + h * 0.3); b.fill(); }
  if (c.gloves) mirror((s) => {
    // Long silk evening gloves: pale from the edge of the cape down the forearm, then a hand.
    const [hx, hy] = hand(s), ex = x + s * sw * 0.44, ey = top + h * 0.34;
    p.lineWidth = h * 0.03; p.beginPath(); p.moveTo(ex, ey); p.lineTo(hx, hy); p.stroke();
    p.beginPath(); p.ellipse(hx, hy + hr * 0.3, hr * 0.3, hr * 0.42, 0, 0, TAU); p.fill();
    p.lineWidth = Math.max(1.5, hr * 0.13);
    p.beginPath();
    for (const f of [-1, 0, 1]) { p.moveTo(hx + f * hr * 0.16, hy + hr * 0.5); p.lineTo(hx + f * hr * 0.2, hy + hr * 1.05); }
    p.moveTo(hx - s * hr * 0.25, hy + hr * 0.25); p.lineTo(hx - s * hr * 0.5, hy + hr * 0.7); // thumb, turned inward
    p.stroke();
  });
  if (c.apron) {
    // A small apron in mid-tone: a little bib and a panel to the knee. Tells you it's the Cook
    // without becoming a white dress.
    const m = G.m || p;
    m.beginPath();
    m.moveTo(x - waist * 0.45, top + h * 0.3); m.lineTo(x + waist * 0.45, top + h * 0.3); m.lineTo(x + waist * 0.55, waistY);
    m.lineTo(x + sw * 0.3, top + h * 0.7); m.quadraticCurveTo(x, top + h * 0.72, x - sw * 0.3, top + h * 0.7); m.lineTo(x - waist * 0.55, waistY);
    m.fill();
  }
  if (c.glasses) {
    // Spectacles catching the light: two small pale rings.
    p.lineWidth = Math.max(1.4, hr * 0.12);
    p.beginPath(); p.arc(x - hr * 0.32, top + hr * 1.0, hr * 0.24, 0, TAU); p.moveTo(x + hr * 0.56, top + hr * 1.0); p.arc(x + hr * 0.32, top + hr * 1.0, hr * 0.24, 0, TAU); p.stroke();
    p.beginPath(); p.moveTo(x - hr * 0.08, top + hr * 0.98); p.lineTo(x + hr * 0.08, top + hr * 0.98); p.stroke();
  }
  if (c.sketchbook) {
    // The illustrator's white sketchbook, held at the side.
    const [hx, hy] = hand(-1);
    p.save(); p.translate(hx - hr * 0.2, hy - h * 0.05); p.rotate(-0.12);
    p.fillRect(-h * 0.05, -h * 0.07, h * 0.1, h * 0.13);
    p.restore();
  }
  if (c.lantern) return lantern(G, ...hand(1), h * 0.075);
}

// A hand lantern hanging from (hx, hy): handle ring, cap, glowing glass with frame bars, base.
// The glass goes in the l context; the metal in b. Returns the glass centre.
function lantern(G, hx, hy, s) {
  const { b, l } = G, gx = hx + s * 0.05, top = hy + s * 0.55, gh = s * 1.1, gw = s * 0.72;
  b.lineWidth = Math.max(1.5, s * 0.08);
  b.beginPath(); b.ellipse(hx, hy + s * 0.25, s * 0.22, s * 0.28, 0, 0, TAU); b.stroke(); // handle ring
  b.beginPath(); b.moveTo(gx - gw * 0.62, top + s * 0.12); b.lineTo(gx + gw * 0.62, top + s * 0.12); b.lineTo(gx + gw * 0.2, top - s * 0.1); b.lineTo(gx - gw * 0.2, top - s * 0.1); b.fill(); // cap
  b.fillRect(gx - gw * 0.6, top + s * 0.12 + gh, gw * 1.2, s * 0.16); // base
  l.beginPath(); l.roundRect(gx - gw / 2, top + s * 0.12, gw, gh, s * 0.12); l.fill();
  l.save(); l.globalCompositeOperation = "destination-out";
  const bar = Math.max(1.2, s * 0.07);
  for (const fx of [-0.5, 0, 0.5]) l.fillRect(gx + fx * gw - bar / 2, top + s * 0.12, bar, gh);
  l.restore();
  for (const fx of [-0.5, 0, 0.5]) b.fillRect(gx + fx * gw - Math.max(1.2, s * 0.07) / 2, top + s * 0.12, Math.max(1.2, s * 0.07), gh); // frame bars
  return [gx, top + s * 0.12 + gh / 2];
}

// The household, as period silhouettes. Pale details tell them apart.
const PEOPLE = {
  niece: { hair: true, gloves: true },
  keeper: { feltHat: true, lantern: true, broad: 1.15, male: true },
  cook: { cap: true, shawl: true, apron: true, broad: 1.3 },
  rival: { topHat: true, glasses: true, stoop: 0.1, male: true },
  illustrator: { sketchbook: true, male: true },
};

// Draw one person in the mantle into contexts G = { b, p, l }, with their stoop.
// Returns the lantern's centre if they carry one.
function person(G, x, base, h, c) {
  const ctxs = [...new Set(Object.values(G))];
  for (const g of ctxs) { g.save(); g.translate(x, base); g.transform(1, 0, -(c.stoop || 0), 1, 0, 0); g.translate(-x, -base); }
  const lan = period(G, x, base, h, c, "mantle");
  for (const g of ctxs) g.restore();
  return lan && [lan[0] + (c.stoop || 0) * (base - lan[1]), lan[1]];
}

// Several masks drawn together (e.g. body, pale details, lantern).
function makeMasks(names, draw) {
  const G = {}, data = {};
  for (const n of names) {
    const c = document.createElement("canvas");
    c.width = RW; c.height = RH;
    const g = c.getContext("2d", { willReadFrequently: true });
    g.fillStyle = g.strokeStyle = "#fff";
    g.lineCap = g.lineJoin = "round";
    G[n] = g;
  }
  draw(G);
  const out = {};
  for (const n of names) {
    const d = G[n].getImageData(0, 0, RW, RH).data;
    out[n] = (x, y) => { x = Math.round(x); y = Math.round(y); return x < 0 || y < 0 || x >= RW || y >= RH ? 0 : d[(y * RW + x) * 4 + 3] / 255; };
  }
  return out;
}

// ── Depth helpers ───────────────────────────────

// A shape with volume: coverage, plus a soft normal from a blurred copy, so it can be lit
// from a direction (lx, ly) pointing toward the light. shade() is 0 (away) .. 1 (facing).
function makeVolume(draw, blur = 6, k = 4) {
  const c = document.createElement("canvas"), b = document.createElement("canvas");
  c.width = b.width = RW; c.height = b.height = RH;
  const g = c.getContext("2d", { willReadFrequently: true });
  g.fillStyle = g.strokeStyle = "#fff"; g.lineCap = g.lineJoin = "round";
  draw(g);
  const bg = b.getContext("2d", { willReadFrequently: true });
  bg.filter = `blur(${blur}px)`; bg.drawImage(c, 0, 0);
  const d = g.getImageData(0, 0, RW, RH).data, hd = bg.getImageData(0, 0, RW, RH).data;
  const H = (x, y) => { x = clamp(Math.round(x), 0, RW - 1); y = clamp(Math.round(y), 0, RH - 1); return hd[(y * RW + x) * 4 + 3] / 255; };
  return {
    at: (x, y) => { x = Math.round(x); y = Math.round(y); return x < 0 || y < 0 || x >= RW || y >= RH ? 0 : d[(y * RW + x) * 4 + 3] / 255; },
    shade: (x, y, lx, ly) => clamp(0.5 + ((H(x - 2, y) - H(x + 2, y)) * lx + (H(x, y - 2) - H(x, y + 2)) * ly) * k),
  };
}

// A trailing vine of heart-shaped leaves, with small berry clusters (the nightshade).
function vine(g, x0, y0, len, sway, leaf, s, berries = true) {
  const pt = (t) => [x0 + sway * Math.sin(t * Math.PI * 0.9) + (hash(s, 7) - 0.5) * sway * t, y0 + len * t];
  g.lineWidth = Math.max(1.5, leaf * 0.12);
  g.beginPath(); g.moveTo(...pt(0)); for (let k = 1; k <= 30; k++) g.lineTo(...pt(k / 30)); g.stroke();
  const n = Math.max(3, Math.round((len / leaf) * 0.9));
  for (let k = 1; k <= n; k++) {
    const t = k / n, [x, y] = pt(t), side = k % 2 ? 1 : -1, sz = leaf * (0.7 + 0.5 * hash(k, s));
    g.beginPath(); g.ellipse(x + side * sz * 0.55, y + sz * 0.15, sz * 0.55, sz * 0.32, side * (0.6 + hash(k, s + 1) * 0.5), 0, TAU); g.fill();
    if (berries && k % 5 === 3) for (let b = 0; b < 4; b++) { g.beginPath(); g.arc(x + (b - 1.5) * leaf * 0.22, y + leaf * (0.45 + (b % 2) * 0.2), leaf * 0.16, 0, TAU); g.fill(); }
  }
}

// A fern frond: a curving spine with leaflets that shrink toward the tip.
function fern(g, x, y, len, angle, s) {
  const n = 22, pts = [];
  let px = x, py = y, a = angle;
  const bend = (hash(s, 1) - 0.5) * 0.08;
  for (let k = 0; k <= n; k++) { pts.push([px, py, a]); px += (Math.cos(a) * len) / n; py += (Math.sin(a) * len) / n; a += bend; }
  g.lineWidth = Math.max(1.5, len * 0.012);
  g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (const [qx, qy] of pts) g.lineTo(qx, qy); g.stroke();
  for (let k = 1; k < n; k++) {
    const [qx, qy, qa] = pts[k], sz = len * 0.13 * (1 - k / n) + 2;
    for (const side of [1, -1]) {
      const pa = qa + side * (Math.PI / 2 - 0.5);
      g.beginPath(); g.ellipse(qx + Math.cos(pa) * sz * 0.55, qy + Math.sin(pa) * sz * 0.55, sz * 0.6, sz * 0.17, pa, 0, TAU); g.fill();
    }
  }
}

// Ground plane: for a screen point below the horizon, depth t (0 at the horizon, 1 at the
// bottom edge) and a lateral world coordinate u. Textures sampled in (u, 1/t) shrink with distance.
function ground(x, y, hz, vpx) {
  const t = Math.max(0.004, (y - hz) / (RH - hz));
  return { t, u: (x - vpx) / t, z: 1 / t };
}
// Grass tufts on a ground plane, finer with distance: 1 inside a tuft shadow, 0 outside.
const tufts = (gp, s = 0) => smooth(0.58, 0.66, noise(gp.u * 0.012 + s, gp.z * 0.9));

// Tree trunks for one depth layer, drawn as tapered columns with a few branches.
function trunks(g, list, top = -20, bottom = RH + 20) {
  for (const [x, w] of list) {
    g.beginPath(); g.moveTo(x - w / 2, bottom); g.lineTo(x - w * 0.4, top); g.lineTo(x + w * 0.4, top); g.lineTo(x + w / 2, bottom); g.fill();
    g.lineWidth = Math.max(2, w * 0.18);
    g.beginPath();
    const y1 = lerp(top, bottom, 0.25 + hash(x, 1) * 0.2), y2 = lerp(top, bottom, 0.45 + hash(x, 2) * 0.15);
    g.moveTo(x, y1); g.lineTo(x + (hash(x, 3) > 0.5 ? 1 : -1) * w * 2.2, y1 - w * 1.4);
    g.moveTo(x, y2); g.lineTo(x + (hash(x, 4) > 0.5 ? 1 : -1) * w * 1.8, y2 - w);
    g.stroke();
  }
}
// Bark: vertical streaks.
const bark = (x, y) => (noise(x * 0.35, y * 0.012) - 0.5) * 0.12;

// ── Printing ────────────────────────────────────

// px > 1 prints at a lower resolution for visible square pixels; the deepest ink then becomes
// a Bayer pixel dither while blue and the warm ink stay halftone dots.
const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
function print(canvas, field, { warm = ORANGE, cell = 4.8, px = 1 } = {}) {
  const PW = RW / px, PH = RH / px;
  canvas.width = PW;
  canvas.height = PH;
  const ctx = canvas.getContext("2d");
  const img = ctx.createImageData(PW, PH), d = img.data;
  const L = new Float32Array(PW * PH), W = new Float32Array(PW * PH);
  const o = { L: 0, W: 0 };
  for (let y = 0; y < PH; y++) for (let x = 0; x < PW; x++) {
    field(x * px + px / 2, y * px + px / 2, o);
    L[y * PW + x] = clamp(o.L);
    W[y * PW + x] = clamp(o.W);
  }
  cell = Math.max(2.6, cell / px);
  const inks = [
    { c: MIDNIGHT, angle: 45, dx: 1, dy: 1, amount: (l, w) => Math.pow(clamp(1 - l / 0.17), 0.85) * (1 - clamp(w * 1.6)) },
    { c: BLUE, angle: 15, dx: 0, dy: 0, amount: (l, w) => clamp((0.82 - l) / 0.62) * (1 - clamp(w * 1.1)) },
    { c: rgb(warm), angle: 75, dx: 3, dy: -1, amount: (l, w) => clamp(w * 1.4) },
  ].map((s) => ({ ...s, ca: Math.cos((s.angle * Math.PI) / 180), sa: Math.sin((s.angle * Math.PI) / 180) }));
  for (let y = 0; y < PH; y++) {
    for (let x = 0; x < PW; x++) {
      const fibre = 0.93 + 0.05 * noise(x * 0.9 * px, y * 0.12 * px) + 0.02 * hash(x, y);
      let r = PAPER[0] / 255, gg = PAPER[1] / 255, b = PAPER[2] / 255;
      for (const s of inks) {
        const dx = px > 1 ? Math.round(s.dx / px) : s.dx, dy = px > 1 ? Math.round(s.dy / px) : s.dy;
        const k = clamp(y - dy, 0, PH - 1) * PW + clamp(x - dx, 0, PW - 1);
        let th;
        if (px > 1 && s.c === MIDNIGHT) th = BAYER4[(y & 3) * 4 + (x & 3)];
        else {
          const u = (x * s.ca + y * s.sa) / cell, v = (-x * s.sa + y * s.ca) / cell;
          const fu = u - Math.floor(u) - 0.5, fv = v - Math.floor(v) - 0.5;
          th = Math.sqrt(fu * fu + fv * fv) / 0.7071;
        }
        // In pixel mode the deepest dark prints solid, so only the mid-darks dither.
        const amt = px > 1 && s.c === MIDNIGHT ? Math.min(1, s.amount(L[k], W[k]) * 1.35) : s.amount(L[k], W[k]);
        if (amt > th) { r *= s.c[0] / 255; gg *= s.c[1] / 255; b *= s.c[2] / 255; }
      }
      const j = (y * PW + x) * 4;
      d[j] = r * 255 * fibre; d[j + 1] = gg * 255 * fibre; d[j + 2] = b * 255 * fibre; d[j + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
}
