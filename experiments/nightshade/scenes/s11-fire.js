// 11 · folly_midnight: close on the fire in the hollow, in its ring of stones. Big trunks on
// both sides, mist between the far trees, needles on the ground catching the light.
// Moves: flames, flicker on everything, embers, smoke, mist drifting, a slow camera sway.

const FIRE11 = { x: 728, y: 540 };

SCENES.push({
  id: "folly_midnight",
  caption: "Her silk-gloved hands are holding something over the flames: the other gardening glove.",
  sway: 4,
  bake() {
    const stoneList = [[548, 592, 50, 32], [652, 628, 48, 30], [790, 630, 52, 30], [884, 590, 46, 34], [896, 536, 36, 26], [828, 496, 32, 20], [632, 498, 32, 20], [455, 660, 62, 38], [720, 694, 70, 34], [960, 668, 62, 38], [330, 694, 56, 32]];
    const stones = makeVolume((g) => { for (const [x, y, rx, ry] of stoneList) { g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, TAU); g.fill(); } }, 6, 7);
    const near = makeVolume((g) => {
      const T = TOPY();
      g.beginPath(); g.moveTo(150, T); g.lineTo(330, T); g.lineTo(330, -10); g.quadraticCurveTo(340, 420, 420, 610); g.lineTo(60, 640); g.quadraticCurveTo(160, 420, 150, -10); g.closePath(); g.fill();
      g.beginPath(); g.moveTo(1080, T); g.lineTo(1290, T); g.lineTo(1290, 620); g.lineTo(1010, 600); g.quadraticCurveTo(1090, 420, 1080, -10); g.closePath(); g.fill();
    }, 14, 5);
    const mid = makeMask((g) => { for (let i = 0; i < 9; i++) { const x = 380 + hash(i, 61) * 640, w = 26 + hash(i, 62) * 34; g.fillRect(x - w / 2, TOPY(), w, 410 - TOPY()); } });
    const far = makeMask((g) => { for (let i = 0; i < 26; i++) { const x = 300 + hash(i, 51) * 800, w = 6 + hash(i, 52) * 14; g.fillRect(x - w / 2, TOPY(), w, 385 - TOPY()); } });
    const boughs = makeMask((g) => { g.lineWidth = 1.6; for (let i = 0; i < 9; i++) { const x = 380 + hash(i, 61) * 640; for (let k = 0; k < 5; k++) { const y = 20 + k * 40 + hash(i, k) * 20, len = 40 + hash(k, i) * 50, d = hash(i, k + 9) > 0.5 ? 1 : -1; g.beginPath(); g.moveTo(x, y); g.lineTo(x + d * len, y + len * 0.35); g.stroke(); for (let n = 0; n < len; n += 4) { g.beginPath(); g.moveTo(x + d * n, y + n * 0.35); g.lineTo(x + d * (n + 3), y + n * 0.35 + 9); g.stroke(); } } } });
    const needles = makeMask((g) => {
      g.lineWidth = 1.5;
      for (let i = 0; i < 2600; i++) { const x = hash(i, 3) * 1280, y = 470 + hash(i, 4) ** 0.7 * 260, a = hash(i, 5) * Math.PI, l = 6 + hash(i, 6) * 12 * (y / 600); g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l * 0.5); g.stroke(); }
    });
    const ferns = makeMask((g) => {
      for (let k = 0; k < 8; k++) fern(g, -30 + k * 40, 740, 180 + hash(k, 1) * 120, -Math.PI / 2 + 0.3 + k * 0.1, k);
      for (let k = 0; k < 6; k++) fern(g, 1300 - k * 40, 740, 160 + hash(k, 2) * 100, -Math.PI / 2 - 0.3 - k * 0.12, k + 30);
      if (FRAME.view) { // the tall window's own bottom corners
        const [vx, vy, vs] = FRAME.view, B = vy + 1280 * vs + 30, R = vx + 720 * vs;
        for (let k = 0; k < 8; k++) fern(g, vx - 40 + k * 34, B, 260 + hash(k, 5) * 140, -Math.PI / 2 + 0.35 + k * 0.09, k + 90);
        for (let k = 0; k < 8; k++) fern(g, R + 40 - k * 34, B, 240 + hash(k, 6) * 140, -Math.PI / 2 - 0.35 - k * 0.09, k + 120);
      }
      for (let k = 0; k < 6; k++) fern(g, 300 + k * 20, 520, 110 + hash(k, 3) * 50, -Math.PI / 2 - 0.9 + k * 0.3, k + 60);
    });
    // The logs the fire burns from: charred, ember-lit along the edges (B = 1 marks them for the shader).
    const logs = makeVolume((g) => { g.lineCap = "round"; for (const [x0, y0, x1, y1, w] of [[668, 580, 792, 556, 17], [684, 552, 784, 584, 15], [700, 570, 760, 548, 12], [742, 588, 806, 572, 11]]) { g.lineWidth = w; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); } }, 5, 4);
    const toward = (px, py) => { const ax = FIRE11.x - px, ay = FIRE11.y - py, l = Math.hypot(ax, ay) || 1; return [ax / l, ay / l]; };
    const sky = (x, y) => 0.04 + 0.42 * Math.exp(-(((y - 275) / 85) ** 2)) * Math.exp(-(((x - 660) / 460) ** 2)) + 0.04 * (noise(x * 0.006, y * 0.03) - 0.5);
    return bakeGrid(...FRAME.grid, (x, y, o) => {
      const [wx, wy] = warp(x, y, 1.5), S = sky(x, y);
      const [fx, fy] = toward(x, y);
      if (logs.at(wx, wy) > 0.5) {
        const top = logs.shade(wx, wy, 0, -1), bark = noise(x * 0.3, y * 0.08);
        o.C = 0.02 + 0.05 * top * bark; o.K = 0.3 + 0.9 * top ** 2 * bark; o.B = 1; o.D = 0.72;
      } else if (stones.at(wx, wy) > 0.5) {
        const fs = stones.shade(wx, wy, fx, fy), top = stones.shade(wx, wy, 0.3, -1);
        const rim = stones.at(wx, wy + 5) < 0.5 || stones.at(wx - 5, wy) < 0.5 || stones.at(wx + 5, wy) < 0.5 ? 0.35 : 1, grit = 0.6 + 0.7 * noise(x * 0.12, y * 0.12) * hash(x >> 1, y >> 1);
        o.C = 0.025 + 0.14 * top ** 3 * grit; o.K = (0.1 + 1.25 * fs ** 3) * rim * grit; o.D = 0.7 + 0.25 * (y / 720);
      } else if (ferns(wx, wy) > 0.5) {
        o.C = 0.12 + 0.26 * noise(x * 0.04, y * 0.04); o.K = 0.45; o.D = 1;
      } else if (near.at(wx, wy) > 0.5) {
        const ms = near.shade(wx, wy, x < 640 ? 1 : -1, -0.3), fs = near.shade(wx, wy, fx, fy), ridges = noise(x * 0.07, y * 0.006);
        o.C = 0.02 + 0.16 * ms ** 3 * (0.3 + ridges) + 0.04 * ridges; o.K = 1.5 * fs ** 3 * (0.4 + ridges); o.D = 0.95;
      } else if (y > 385) {
        const gp = ground(x, y, 385, 640), litter = noise((x * 0.05) / (0.3 + gp.t), (y * 0.16) / (0.3 + gp.t));
        const n = needles(wx, wy) > 0.5 ? 1 : 0, haze = Math.exp(-(y - 385) / 50) * Math.exp(-(((x - 660) / 500) ** 2));
        o.C = 0.025 + 0.2 * haze + 0.06 * litter + 0.05 * n; o.K = (0.4 + 0.4 * litter + 0.6 * n) * (0.15 + 0.85 * gp.t); o.D = 0.3 + 0.6 * gp.t; o.B = 0.5;
      } else if (mid(wx, wy) > 0.5 || boughs(wx, wy) > 0.5) {
        o.C = S * 0.3 + 0.02 * noise(x * 0.2, y * 0.02); o.K = 0.25; o.D = 0.3;
      } else if (far(wx, wy) > 0.5) {
        o.C = S * 0.6; o.K = 0.08; o.D = 0.15;
      } else { o.C = S; o.K = 0.06; o.D = 0.05; }
    });
  },
  glsl: `
const vec2 F11 = vec2(${FIRE11.x.toFixed(1)}, ${FIRE11.y.toFixed(1)});
void scene(vec2 sp, vec4 b, vec4 a, float t, inout float C, inout float W) {
  float flick = 0.78 + 0.22 * noise(vec2(t * 6.0, 1.0)) + 0.05 * sin(t * 23.0);
  vec2 f = F11 + (vec2(noise(vec2(t * 3.0, 5.0)), noise(vec2(t * 3.0, 9.0))) - 0.5) * 6.0;
  vec2 gq = b.b > 0.25 && b.b < 0.75 ? vec2(sp.x, f.y + (sp.y - f.y) * 2.2) : sp;
  float glow = flick * (0.9 * g2(gq, f, 44.0) + 0.5 * g2(gq, f, 140.0) + 0.16 * g2(gq, f, 300.0));
  W = b.g * 2.0 * glow;
  // Mist drifting between the far trunks.
  if (b.a < 0.4) C += 0.07 * exp(-pow((sp.y - 330.0) / 50.0, 2.0)) * (noise(vec2((sp.x + t * 14.0) * 0.005, 2.0)) - 0.35);
  // Smoke.
  float px = sp.x - f.x - (f.y - sp.y) * 0.1 - sin(t * 0.45 + sp.y * 0.012) * 22.0, rise = clamp((f.y - 150.0 - sp.y) / 380.0, 0.0, 1.0);
  if (sp.y < f.y - 150.0 && b.a < 0.7) C += 0.1 * exp(-px * px / 2400.0) * (1.0 - rise) * noise(vec2(sp.x * 0.015, sp.y * 0.01 + t * 0.35));
  // The logs: embers creeping along the cracks.
  bool log = b.b > 0.9;
  if (log) { float e = noise(vec2(sp.x * 0.12, sp.y * 0.2 + t * 0.6)); if (e > 0.62) { W = 0.7 + 0.5 * flick * (e - 0.62) / 0.38; C = e > 0.8 ? 0.2 : 0.0; gPink = 0.0; } }
  // Flames, rising out of the logs (the front logs stay in front of their base).
  vec2 dq = sp - f;
  float fl = log && sp.y > f.y + 8.0 ? 0.0 : flame(vec2(dq.x / 72.0, (f.y + 30.0 - sp.y) / (190.0 * (0.85 + 0.3 * flick))), t, 1.0);
  if (fl > 0.5) { W = fl > 1.5 ? 1.45 : 0.95; C = fl > 1.5 ? 0.32 : 0.0; gPink = 0.0; }
  // Embers.
  for (int i = 0; i < 44; i++) {
    float fi = float(i), life = fract(t * 0.2 + hash(vec2(fi, 1.0)));
    vec2 e = f + vec2((hash(vec2(fi, 2.0)) - 0.5) * 140.0 * life + sin(t * 1.6 + fi) * 18.0 * life, -60.0 - life * (300.0 + hash(vec2(fi, 3.0)) * 200.0));
    if (life < 0.85 && length(sp - e) < 3.0 * (1.0 - life * 0.5)) { W = 1.0 - life * 0.5; C = 0.0; }
  }
}`,
});

// Mobile: centred on the fire in its ring of stones, the near trunks rising on both sides out of the
// top of the frame, the embers going up between them.
SCENES.push(mobile(SCENES.find((s) => s.id === "folly_midnight"), { view: [314, -150, 1.15] }));
