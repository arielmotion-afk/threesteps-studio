// Lettering for the title scenes. The words are drawn into masks with a real typeface, then baked
// with the rest of the scene, so they are lit, dithered and printed like everything else.
// The fonts must be loaded before a title scene is baked: await loadTitleFonts().

const SERIF = '"IM Fell English SC"', SIGN = '"Silkscreen"';
const loadTitleFonts = () => Promise.all([`400 64px ${SERIF}`, `700 32px ${SIGN}`].map((f) => document.fonts.load(f)));

// Coverage of a mask over one bake pixel (2 x 2 frame units), so thin strokes don't drop out.
const cover = (m, x, y) => (m(x - 0.5, y - 0.5) + m(x + 0.5, y - 0.5) + m(x - 0.5, y + 0.5) + m(x + 0.5, y + 0.5)) / 4;

// Words set straight, with their baseline centre at (x, y), turned by angle a and sheared by k;
// bold thickens the strokes (frame units); fit shrinks the size so the words are at most that wide.
function textAt(g, text, font, size, x, y, { a = 0, k = 0, sy = 1, track = 0, bold = 0, fit = 0 } = {}) {
  if (fit) { g.font = `${font.weight || 400} ${size}px ${font.family || font}`; const w = [...text].reduce((s, c) => s + g.measureText(c).width + track * size, -track * size); if (w > fit) size *= fit / w; }
  g.save();
  g.translate(x, y); g.rotate(a); g.transform(1, 0, k, sy, 0, 0);
  g.font = `${font.weight || 400} ${size}px ${font.family || font}`;
  g.textBaseline = "alphabetic";
  const chars = [...text], w = chars.reduce((s, c) => s + g.measureText(c).width + track * size, -track * size);
  let cx = -w / 2;
  g.lineWidth = bold; g.lineJoin = "miter";
  for (const c of chars) { g.fillText(c, cx, 0); if (bold) g.strokeText(c, cx, 0); cx += g.measureText(c).width + track * size; }
  g.restore();
}

// Words along a curve: pt(t) gives a point on it (t 0..1), letters stand upright on it,
// growing from size s0 at the start to s1 at the end (for curves seen in perspective).
// bold thickens the strokes (in frame units at size s0). tilt < 1 turns the letters only part of the way with the curve, so they stay readable.
function textOnCurve(g, text, font, pt, s0, s1, { from = 0, to = 1, track = 0.08, tilt = 1, bold = 0 } = {}) {
  const N = 400, len = [0];
  for (let i = 1; i <= N; i++) { const [x0, y0] = pt((i - 1) / N), [x1, y1] = pt(i / N); len.push(len[i - 1] + Math.hypot(x1 - x0, y1 - y0)); }
  const at = (s) => { let i = 1; while (i < N && len[i] < s) i++; const f = (s - len[i - 1]) / (len[i] - len[i - 1] || 1); return (i - 1 + f) / N; };
  const chars = [...text];
  g.font = `${font.weight || 400} 100px ${font.family || font}`;
  const adv = chars.map((c) => g.measureText(c).width / 100 + track);
  // sizes vary along the curve, so lay the letters out by walking it
  const L0 = len[Math.round(from * N)], L1 = len[Math.round(to * N)];
  let total = 0;
  for (let i = 0; i < chars.length; i++) total += adv[i] * lerp(s0, s1, (i + 0.5) / chars.length);
  let s = L0 + (L1 - L0 - total) / 2;
  for (let i = 0; i < chars.length; i++) {
    const size = lerp(s0, s1, (i + 0.5) / chars.length), w = adv[i] * size;
    const t = at(s + w / 2), [x, y] = pt(t), [xa, ya] = pt(Math.max(0, t - 0.01)), [xb, yb] = pt(Math.min(1, t + 0.01));
    g.save();
    g.translate(x, y); g.rotate(Math.atan2(yb - ya, xb - xa) * tilt);
    g.font = `${font.weight || 400} ${size}px ${font.family || font}`;
    const cx = -g.measureText(chars[i]).width / 2;
    g.fillText(chars[i], cx, 0);
    if (bold) { g.lineWidth = bold * (size / s0); g.lineJoin = "miter"; g.strokeText(chars[i], cx, 0); }
    g.restore();
    s += w;
  }
}

// A pine in silhouette: a short trunk and tiers of drooping, toothed boughs.
function pineShape(g, x, base, h, w, s) {
  g.fillRect(x - w * 0.025, base - h * 0.2, w * 0.05, h * 0.2 + 2);
  const tiers = Math.round(5 + h / 50);
  for (let k = 0; k < tiers; k++) {
    const t = k / tiers, y = base - h * 0.14 - t * h * 0.8, hw = (w / 2) * (1 - t * 0.92) * (0.75 + 0.4 * hash(k, s)), th = (h * 0.9) / tiers * 1.8;
    const teeth = Math.max(3, Math.round(hw / 7));
    g.beginPath(); g.moveTo(x + (hash(k, s + 3) - 0.5) * 4, y - th);
    for (let i = 0; i <= teeth; i++) { const u = i / teeth, px = x + hw * (u * 2 - 1), droop = th * 0.15 * Math.sin(u * Math.PI); g.lineTo(px, y + droop + (i % 2 ? -th * 0.22 : 0) + (hash(i, k + s) - 0.5) * 4); }
    g.closePath(); g.fill();
  }
  g.beginPath(); g.moveTo(x, base - h - 6); g.lineTo(x - 3, base - h * 0.88); g.lineTo(x + 3, base - h * 0.88); g.fill();
}

// Small serif capitals drawn pixel by pixel (7 rows tall), for words too small to set in a typeface
// on the scenes' grid: one cell is one screen pixel. Only the letters the titles need.
const PIXEL_CAPS = {
  R: ["XXXXX.", ".X...X", ".X...X", ".XXXX.", ".X..X.", ".X...X", "XXX..XX"],
  E: ["XXXXXX", ".X...X", ".X.X..", ".XXX..", ".X.X..", ".X...X", "XXXXXX"],
  A: ["..XX..", "..XX..", ".X..X.", ".X..X.", ".XXXX.", "X....X", "XX..XX"],
  D: ["XXXXX.", ".X...X", ".X...X", ".X...X", ".X...X", ".X...X", "XXXXX."],
  I: ["XXX", ".X.", ".X.", ".X.", ".X.", ".X.", "XXX"],
  N: ["XX..XX", ".XX..X", ".X.X.X", ".X.X.X", ".X..XX", ".X...X", "XXX..X"],
  G: [".XXXX.", "X....X", "X.....", "X..XXX", "X....X", "X....X", ".XXXX."],
  O: [".XXXX.", "X....X", "X....X", "X....X", "X....X", "X....X", ".XXXX."],
  M: ["XX...XX", ".XX.XX.", ".X.X.X.", ".X.X.X.", ".X...X.", ".X...X.", "XXX.XXX"],
  T: ["XXXXXX", "X.XX.X", "..XX..", "..XX..", "..XX..", "..XX..", ".XXXX."],
  H: ["XX..XX", ".X..X.", ".X..X.", ".XXXX.", ".X..X.", ".X..X.", "XX..XX"],
  P: ["XXXXX.", ".X...X", ".X...X", ".XXXX.", ".X....", ".X....", "XXX..."],
  S: [".XXXX.", "X....X", "X.....", ".XXXX.", ".....X", "X....X", ".XXXX."],
  W: ["XX...XX", ".X...X.", ".X...X.", ".X.X.X.", ".X.X.X.", "..X.X..", "..X.X.."],
  L: ["XXX...", ".X....", ".X....", ".X....", ".X....", ".X...X", "XXXXXX"],
  " ": ["...", "...", "...", "...", "...", "...", "..."],
};
// A smaller set, five rows tall, for small signs.
const PIXEL_CAPS_SMALL = {
  L: ["X...", "X...", "X...", "X...", "XXXX"],
  O: [".XX.", "X..X", "X..X", "X..X", ".XX."],
  N: ["X..X", "XX.X", "X.XX", "X..X", "X..X"],
  D: ["XXX.", "X..X", "X..X", "X..X", "XXX."],
  " ": ["..", "..", "..", "..", ".."],
};
// Lines of pixel capitals, centred, as a lookup: on(x, y) in cells, with (0, 0) the block's top left.
// slope (cells down per cell across; one number, or one per line) steps each whole letter along a slanted line, so the words
// follow a surface seen in perspective without any letter being sheared. skew shifts every pixel
// column instead (whole columns move, so upright strokes stay solid): the letters slant with it.
function pixelWords(lines, { gap = 2, lead = 5, slope = 0, skew = false, font = PIXEL_CAPS } = {}) {
  const rows = lines.map((t) => [...t].map((c) => font[c])), H = font.L ? font.L.length : 7;
  const widths = rows.map((r) => r.reduce((s, g) => s + g[0].length + gap, -gap));
  const w = Math.max(...widths), marks = [];
  rows.forEach((r, li) => {
    let x = Math.floor((w - widths[li]) / 2);
    const sl = Array.isArray(slope) ? slope[li] : slope;
    for (const g of r) {
      const dy = Math.round(sl * (x + g[0].length / 2 - w / 2));
      for (let y = 0; y < H; y++) for (let i = 0; i < g[y].length; i++) if (g[y][i] === "X") marks.push([x + i, li * (H + lead) + y + (skew ? Math.round(sl * (x + i - w / 2)) : dy)]);
      x += g[0].length + gap;
    }
  });
  const y0 = Math.min(...marks.map((m) => m[1])), h = Math.max(...marks.map((m) => m[1])) - y0 + 1, bits = new Uint8Array(w * h);
  for (const [x, y] of marks) bits[(y - y0) * w + x] = 1;
  return { w, h, on: (x, y) => x >= 0 && y >= 0 && x < w && y < h && bits[y * w + x] === 1 };
}

// Words in pixel capitals placed on the screen grid: at(px, py) for a bake pixel, with the block
// centred on (cx, cy), each cell scale x scale pixels, and every pixel column shifted by slope so
// the words lie along a slanted surface. Returns 1 on a letter, 2 on its carved shadow (down-right).
function pixelSign(lines, cx, cy, { scale = 1, slope = 0, gap = 2, lead = 5, font } = {}) {
  const W = pixelWords(lines, { gap, lead, font }), w = W.w * scale, h = W.h * scale, x0 = Math.round(cx - w / 2), y0 = Math.round(cy - h / 2);
  const on = (px, py) => { const x = px - x0, y = py - y0 - Math.round(slope * (x - w / 2)); return W.on(Math.floor(x / scale), Math.floor(y / scale)); };
  return (px, py) => (on(px, py) ? 1 : on(px - 1, py - 1) ? 2 : 0);
}
