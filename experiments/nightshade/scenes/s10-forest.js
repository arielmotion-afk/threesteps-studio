// 10 · forest_night: the pine forest at night. One path winds in from the bottom left and away
// to the right, toward a lantern between the trunks; two sets of small footprints run along it
// side by side. Far off on the left, through the trees, the greenhouse glows pink: the orchid
// is opening. (No fork in the path: the choice is the dark on the left, the light on the right.)
// Moves: the lantern sways and flickers, the greenhouse glow breathes, mist drifts, fireflies of dust.

const LANTERN10 = { x: 1004, y: 398 }, GLASS10 = { x: 330, y: 330 };

function pathAt(s) {
  const e = s * s * (3 - 2 * s);
  return { x: lerp(330, 990, e) + 70 * Math.sin(s * Math.PI * 1.1), y: 720 - 300 * Math.pow(s, 0.62), w: 170 * Math.pow(1 - s, 1.3) + 10 };
}

SCENES.push({
  id: "forest_night",
  caption: "Two sets of small footprints lead into the pine forest. Two people went out, not one.",
  sway: 4,
  uniforms: {},
  bake() {
    const path = makeMask((g) => {
      g.beginPath();
      const L = [], R = [];
      for (let k = 0; k <= 60; k++) { const p = pathAt(k / 60); L.push([p.x - p.w, p.y]); R.push([p.x + p.w, p.y]); }
      g.moveTo(...L[0]); for (const q of L) g.lineTo(...q); for (const q of R.reverse()) g.lineTo(...q); g.closePath(); g.fill();
    });
    const prints = makeMask((g) => {
      for (let k = 0; k < 34; k++) {
        const s = 0.04 + k * 0.026, p = pathAt(s), sc = Math.pow(1 - s, 1.2) * 1.1 + 0.08;
        for (const side of [-1, 1]) {
          const step = (k + (side > 0 ? 0 : 1)) % 2 ? 1 : -1, x = p.x + side * p.w * 0.32 + step * 7 * sc, y = p.y + (side > 0 ? 6 * sc : 0);
          g.beginPath(); g.ellipse(x, y, 5 * sc, 9 * sc * 0.5, 0.3, 0, TAU); g.fill();
        }
      }
    });
    const glass = makeMask((g) => {
      const { x, y } = GLASS10;
      g.beginPath(); g.moveTo(x - 30, y + 22); g.lineTo(x - 30, y - 1); g.lineTo(x - 13, y - 15); g.lineTo(x + 17, y - 15); g.lineTo(x + 34, y - 1); g.lineTo(x + 34, y + 22); g.closePath(); g.fill();
    });
    const glassBars = makeMask((g) => { const { x, y } = GLASS10; g.lineWidth = 1.3; for (let k = -30; k <= 34; k += 7) { g.beginPath(); g.moveTo(x + k, y + 22); g.lineTo(x + k, y - 15 + Math.max(0, Math.abs(k - 2) - 15) * 0.85); g.stroke(); } g.beginPath(); g.moveTo(x - 30, y + 8); g.lineTo(x + 34, y + 8); g.moveTo(x - 30, y - 1); g.lineTo(x + 34, y - 1); g.stroke(); });
    const near = makeVolume((g) => {
      for (const [x, w] of [[90, 130], [700, 46], [1150, 92], [1262, 60], [560, 34]]) { g.beginPath(); g.moveTo(x - w / 2 - w * 0.2, 740); g.quadraticCurveTo(x - w / 2, 560, x - w * 0.45, -10); g.lineTo(x + w * 0.45, -10); g.quadraticCurveTo(x + w / 2, 560, x + w / 2 + w * 0.2, 740); g.fill(); }
    }, 10, 5);
    const midL = Array.from({ length: 16 }, (_, i) => [hash(i, 71) * 1280, 16 + hash(i, 72) * 22]).filter(([x]) => Math.abs(x - GLASS10.x) > 70);
    const mid = makeMask((g) => { for (const [x, w] of midL) { g.fillRect(x - w / 2, -10, w, 470); for (let k = 0; k < 5; k++) { const y = 30 + k * 34 + hash(x, k) * 16, len = 30 + k * 12; g.lineWidth = 2; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (k % 2 ? 1 : -1) * len, y + len * 0.4); g.stroke(); } } });
    const far = makeMask((g) => { for (let i = 0; i < 46; i++) { const x = hash(i, 81) * 1280, w = 4 + hash(i, 82) * 10; if (Math.abs(x - GLASS10.x) < 60 && hash(i, 83) > 0.3) continue; g.fillRect(x - w / 2, -10, w, 445); } });
    const ferns = makeMask((g) => {
      for (let k = 0; k < 9; k++) fern(g, -20 + k * 32, 740, 170 + hash(k, 1) * 110, -Math.PI / 2 + 0.3 + k * 0.1, k);
      for (let k = 0; k < 9; k++) fern(g, 1300 - k * 32, 740, 160 + hash(k, 2) * 110, -Math.PI / 2 - 0.3 - k * 0.1, k + 30);
      for (const [x, y, s] of [[640, 560, 0.6], [790, 500, 0.45], [200, 560, 0.6], [880, 470, 0.35], [470, 500, 0.4]])
        for (let k = 0; k < 7; k++) fern(g, x + (k - 3) * 9 * s, y, 150 * s, -Math.PI / 2 + (k - 3) * 0.32, k + x);
    });
    const HZ = 430;
    const sky = (x, y) => {
      const mist = Math.exp(-(((y - 400) / 90) ** 2)) * (0.6 + 0.4 * Math.exp(-(((x - 640) / 600) ** 2)));
      return 0.03 + 0.3 * mist + 0.1 * Math.exp(-(((y - 160) / 160) ** 2)) * Math.exp(-(((x - 520) / 400) ** 2));
    };
    const pinkAt = (x, y) => Math.exp(-((Math.hypot((x - GLASS10.x) / 1.3, y - GLASS10.y) / 42) ** 2));
    return bakeGrid(640, 360, (x, y, o) => {
      const [wx, wy] = warp(x, y, 1.5), S = sky(x, y), pk = pinkAt(x, y);
      if (ferns(wx, wy) > 0.5) { o.C = 0.1 + 0.28 * noise(x * 0.04, y * 0.04) * (y / 720); o.K = 0.4; o.D = 1; }
      else if (near.at(wx, wy) > 0.5) {
        const ms = near.shade(wx, wy, 0.3, -1), ls = near.shade(wx, wy, LANTERN10.x > x ? 1 : -1, 0), ridges = noise(x * 0.08, y * 0.006);
        o.C = 0.02 + 0.12 * ms ** 3 * (0.4 + ridges) + 0.03 * ridges + 0.04 * Math.exp(-(((y - 400) / 120) ** 2)); o.K = 1.5 * ls ** 3 * (0.4 + ridges); o.D = 0.85;
      } else if (y > HZ) {
        const gp = ground(x, y, HZ, 640), onPath = path(wx, wy) > 0.5;
        const litter = noise((x * 0.05) / (0.3 + gp.t), (y * 0.15) / (0.3 + gp.t)), speck = hash(x >> 1, y >> 1) > 0.85 ? 1 : 0;
        const haze = Math.exp(-(y - HZ) / 40);
        o.C = onPath ? 0.12 + 0.12 * litter + 0.1 * haze + 0.05 * speck : 0.03 + 0.05 * litter + 0.25 * haze + 0.04 * speck;
        if (prints(wx, wy) > 0.5) o.C *= 0.25;
        o.K = (0.6 + 0.4 * litter) * (onPath ? 1 : 0.7); o.D = 0.3 + 0.6 * gp.t; o.B = 0.5 * pk;
      } else if (glass(wx, wy) > 0.5) {
        const bar = glassBars(wx, wy) > 0.5;
        o.C = bar ? 0.08 : 0.2 + 0.2 * noise(x * 0.2, y * 0.2); o.B = bar ? 0.4 : 1; o.D = 0.1;
      } else if (mid(wx, wy) > 0.5) { o.C = S * 0.35 + 0.02 * noise(x * 0.2, y * 0.02); o.K = 0.3; o.D = 0.3; o.B = 0.6 * pk; }
      else if (far(wx, wy) > 0.5) { o.C = S * 0.62; o.K = 0.1; o.D = 0.15; o.B = 0.6 * pk; }
      else { o.C = S; o.D = 0.05; o.B = 0.7 * pk; o.K = 0.05; }
    });
  },
  glsl: `
const vec2 LAN = vec2(${LANTERN10.x.toFixed(1)}, ${LANTERN10.y.toFixed(1)});
void scene(vec2 sp, vec4 b, vec4 a, float t, inout float C, inout float W) {
  // The lantern swings a little as it moves between the trunks.
  float sw = sin(t * 1.3) * 0.12;
  vec2 lp = LAN + vec2(sin(sw) * 40.0, (1.0 - cos(sw)) * 40.0);
  float flick = 0.82 + 0.18 * noise(vec2(t * 5.0, 2.0));
  float glow = flick * (g2(sp, lp, 20.0) + 0.4 * g2(sp, lp, 70.0) + 0.12 * g2(sp, lp, 160.0));
  W = b.g * 2.0 * glow;
  // The greenhouse: pink, breathing slowly.
  float bloom = 0.8 + 0.2 * sin(t * 0.7);
  if (b.b > 0.95) { gPink = 1.0; W = 0.9 * bloom; C = 0.25; }
  else if (b.b > 0.02) { float pw = b.b * 0.45 * bloom; if (pw > W) gPink = 1.0; W += pw; }
  // The lantern itself: a small frame around a flame.
  vec2 q = sp - lp;
  if (abs(q.x) < 7.0 && q.y > -12.0 && q.y < 10.0) { bool frame = abs(q.x) > 5.0 || q.y < -10.0 || q.y > 8.0; W = frame ? 0.15 : 1.3 * flick; C = frame ? 0.02 : 0.45; gPink = 0.0; }
  if (abs(q.x) < 1.0 && q.y > -22.0 && q.y < -12.0) { C = 0.03; W = 0.1; }
  // Mist drifting low between the trees.
  if (b.a < 0.5) C += 0.06 * exp(-pow((sp.y - 430.0) / 40.0, 2.0)) * (noise(vec2((sp.x - t * 12.0) * 0.005, 3.0)) - 0.3);
}`,
});
