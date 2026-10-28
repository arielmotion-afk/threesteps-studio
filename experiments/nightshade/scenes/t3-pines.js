// Title · the pines: lying on the forest floor, looking straight up. Trunks rise from the edges
// and close in toward a ragged gap in the canopy with a thin moon. An old signpost, seen from
// below, reaches across the frame: THE WOODS, carved and painted white. A fire burns just out of
// frame at the bottom: its light catches the underside of the sign and the foot of every trunk.
// Moves: the firelight flickers, sparks and embers rise toward the canopy.

const FIRE_T3 = { x: 640, y: 900 };

SCENES.push({
  id: "title_pines",
  title: "THE WOODS",
  sway: 0, // no camera drift: it sweeps bands across the trunks and ground
  lift: 0.2,
  bake() {
    // Looking straight up: every trunk leans toward one point far above the frame. Three depths:
    // near (dark, cutting in from the sides), middle, far (paler, in the moonlit haze).
    const VP = [640, -1100], BOT = 780, sAt = (y) => (y - VP[1]) / (BOT - VP[1]);
    const T = [];
    // each tree ends at its own top: the ones near the middle end lower, so the sky opens where they meet
    const add = (bx, w, layer) => { const id = T.length, c = Math.min(1, Math.abs(bx - VP[0]) / 900); T.push({ bx, w, layer, side: bx < VP[0] ? 1 : -1, id, top: layer === 0 ? -100 : layer === 1 ? lerp(230, -40, c) + 40 * hash(id, 9) : 170 + 90 * hash(id, 9) }); };
    for (let i = 0; i < 11; i++) add(200 + hash(i, 1) * 880, 16 + hash(i, 2) * 20, 2);
    for (const [bx, w] of [[-60, 90], [250, 70], [470, 55], [830, 60], [1080, 80], [1360, 100], [-380, 110], [1700, 120]]) add(bx, w, 1);
    for (const [bx, w] of [[-420, 260], [60, 150], [1560, 200], [1950, 300]]) add(bx, w, 0);
    if (FRAME.view) for (const [bx, w] of [[300, 300], [1290, 330]]) add(bx, w, 0); // a near pair framing the tall window
    const trunkAt = (x, y, layer) => {
      const s = sAt(y);
      for (const t of T) { if (t.layer !== layer || y < t.top - 70) continue; const xc = VP[0] + (t.bx - VP[0]) * s, hw = (t.w * s * (0.5 + 0.5 * s)) / 2 * smooth(t.top - 70, t.top + 90, y); if (Math.abs(x - xc) < hw) return [t, (x - xc) / hw, s]; } // trunks taper as they rise
      return null;
    };
    // the sky shows wherever nothing covers it: brightest around the moon, fading out gradually
    const skyGlow = (x, y) => Math.exp(-(((x - 630) / 400) ** 2) - (((y + 10) / 340) ** 2));
    const moon = (x, y) => Math.hypot(x - 618, y - 70) < 17 && Math.hypot(x - 625, y - 64) > 15;
    // the signpost: the post on the right, leaning in a little; the arm reaching left, seen from below
    const post = makeMask((g) => { g.beginPath(); g.moveTo(930, 740); g.lineTo(1062, 740); g.lineTo(986, 226); g.lineTo(910, 234); g.closePath(); g.fill(); g.beginPath(); g.moveTo(904, 238); g.lineTo(920, 214); g.lineTo(994, 208); g.lineTo(990, 230); g.fill(); });
    const A = { t0: [1000, 334], t1: [536, 420], b0: [1004, 406], b1: [520, 488], tip: [492, 456] };
    const arm = makeMask((g) => { g.beginPath(); g.moveTo(...A.t0); g.lineTo(...A.t1); g.lineTo(...A.tip); g.lineTo(...A.b1); g.lineTo(...A.b0); g.closePath(); g.fill(); });
    const under = makeMask((g) => { g.beginPath(); g.moveTo(...A.b0); g.lineTo(...A.b1); g.lineTo(A.b1[0] + 6, A.b1[1] + 12); g.lineTo(A.b0[0], A.b0[1] + 18); g.closePath(); g.fill(); });
    const slope = (A.t1[1] - A.t0[1]) / (A.t1[0] - A.t0[0]);
    const sign = pixelSign(["THE WOODS"], 370, 207, { scale: 2, slope, gap: 2 });
    const nails = (x, y) => Math.hypot(x - 958, y - 356) < 6 || Math.hypot(x - 962, y - 392) < 6; // bolts through the arm into the post
    const ferns = makeMask((g) => {
      for (let k = 0; k < 7; k++) fern(g, -60 + k * 40, 770, 260 + hash(k, 1) * 120, -Math.PI / 2 + 0.6 - k * 0.08, k);
      for (let k = 0; k < 6; k++) fern(g, 1340 - k * 40, 770, 230 + hash(k, 2) * 110, -Math.PI / 2 - 0.6 + k * 0.09, k + 30);
    });
    // the crowns: each trunk grows branches (stiff sprays of needles) out to the sides and up, more of
    // them and longer toward the top, so the canopy builds up gradually instead of starting at a line
    const spray = (g, x, y, ang, len, sd) => {
      const ex = x + Math.cos(ang) * len, ey = y + Math.sin(ang) * len;
      g.lineWidth = 4; g.beginPath(); g.moveTo(x, y); g.lineTo(ex, ey); g.stroke();
      g.lineWidth = 3;
      for (let k = 0; k < len; k += 4) {
        const px = x + Math.cos(ang) * k, py = y + Math.sin(ang) * k, nl = (10 + 8 * hash(k, sd)) * (1 - 0.6 * (k / len)) + 3;
        for (const side of [-1, 1]) { const a = ang + side * (1.05 + 0.2 * hash(k, sd + side)) - 0.25 * Math.sign(Math.cos(ang)); g.beginPath(); g.moveTo(px, py); g.lineTo(px + Math.cos(a) * nl, py + Math.sin(a) * nl); g.stroke(); }
      }
    };
    const crowns = [0, 1, 2].map((layer) => makeVolume((g) => {
      for (const t of T) {
        if (t.layer !== layer) continue;
        const n = [10, 14, 10][layer], reach = [260, 230, 170][layer], size = [1.5, 0.9, 0.6][layer];
        for (let k = 0; k < n; k++) {
          const y = t.top - 60 + (k / (n - 1)) ** 1.1 * (reach + 60) + 20 * (hash(k, t.id) - 0.5), s = sAt(y), xc = VP[0] + (t.bx - VP[0]) * s;
          const lower = clamp((y - t.top + 60) / (reach + 60)), w = (70 + 60 * hash(k, t.id + 3)) * (0.5 + 0.8 * lower) * size, side = k % 2 ? 1 : -1;
          g.save(); g.translate(xc + side * w * 0.3 * lower, y); g.rotate((hash(k, t.id + 5) - 0.5) * 1.6 + side * 0.35);
          pinePad(g, 0, 0, w, w * 0.55, t.id * 17 + k);
          g.restore();
        }
      }
    }, 10, 4));
    // firelight reaches the lower part of the frame only, and only surfaces turned toward it
    const fireReach = (y) => smooth(330, 760, y) ** 1.5;
    return bakeGrid(...FRAME.grid, (x, y, o) => {
      const [wx, wy] = warp(x, y, 1);
      if (ferns(wx, wy) > 0.5) { const n = noise(x * 0.05, y * 0.05); o.C = 0.16 + 0.3 * n * n; o.K = 0.08 * smooth(0.6, 0.8, noise(x * 0.04 + 9, y * 0.04)); o.D = 1; return; }
      if (arm(x, y) > 0.5) {
        const lw = sign(Math.floor(x / 2), Math.floor(y / 2));
        if (lw === 1) { o.C = 0.66 + 0.1 * noise(x * 0.2, y * 0.2); o.K = 0.03; o.D = 0.9; return; }
        if (lw === 2) { o.C = 0.03; o.D = 0.9; return; }
        if (nails(x, y)) { const r = Math.min(Math.hypot(x - 958, y - 356), Math.hypot(x - 962, y - 392)); o.C = r < 3 ? 0.55 : 0.04; o.K = r < 3 ? 0.1 : 0; o.D = 0.9; return; }
        // weathered boards along the arm, moonlit from above; the fire just catches the lower edge
        const along = x + y * slope * -1, lowEdge = lerp(A.b1[1], A.b0[1], (x - A.b1[0]) / (A.b0[0] - A.b1[0]));
        const grainV = noise(along * 0.025, (y - slope * (x - 500)) * 0.5) * 0.6 + noise(along * 0.1, y * 1.2) * 0.4, low = smooth(-12, 0, y - lowEdge);
        const endGrain = x > A.t0[0] - 12 ? 1 : 0; // the sawn end of the board, over the post
        o.C = (0.12 + 0.16 * grainV) * (endGrain ? 0.6 : 1) + (y - lerp(A.t1[1], A.t0[1], (x - A.t1[0]) / (A.t0[0] - A.t1[0])) < 4 ? 0.14 : 0); o.K = 0.7 * low * low; o.D = 0.9; return;
      }
      if (under(x, y) > 0.5) { o.C = 0.04; o.K = 0.8 * (0.75 + 0.25 * noise(x * 0.05, y * 0.4)); o.D = 0.9; return; }
      if (post(wx, wy) > 0.5) {
        // the post: moonlight down its left edge, firelight up the side facing the fire
        const across = (x - lerp(996, 948, (740 - y) / 514)) / lerp(66, 38, (740 - y) / 514), grainV = noise(x * 0.25, y * 0.015);
        const shade = y > A.b0[1] && y < A.b0[1] + 34 ? 0.35 : 1; // the arm's shadow on the post
        o.C = (0.05 + 0.09 * grainV + 0.16 * smooth(-0.5, -1, across) * smooth(740, 230, y)) * shade; o.K = 0.6 * smooth(-0.2, -0.95, across) * fireReach(y) * (0.6 + 0.5 * grainV) * shade; o.D = 0.92; return;
      }
      const glow = skyGlow(x, y);
      for (const layer of [0, 1, 2]) {
        const hit = trunkAt(x, y, layer);
        if (hit) {
          const [t, across, sc] = hit, inner = across * t.side; // +1 on the side facing the middle (sky and fire)
          const ridges = noise(across * 7 + t.id * 7, sc * 50) * 0.55 + noise(across * 22 + t.id, sc * 140) * 0.45, fleck = hash(x >> 1, y >> 2) > 0.86 ? 0.04 : 0;
          const rim = smooth(0.2, 0.95, inner), lowMist = smooth(330, 720, y) * Math.exp(-(((x - 640) / 420) ** 2)), haze = [0, 0.01, 0.05][layer] + [0, 0.03, 0.1][layer] * glow + [0, 0.04, 0.08][layer] * lowMist;
          o.C = 0.022 + haze + 0.07 * ridges * ridges + fleck * 0.6 + 0.1 * rim ** 2 * glow * (layer ? 0.6 : 1);
          o.K = [0.55, 0.3, 0.06][layer] * rim ** 3 * fireReach(y) * (0.45 + ridges); o.D = [0.95, 0.6, 0.3][layer]; return;
        }
        if (crowns[layer].at(wx, wy) > 0.5) {
          // flat-shaded in three tones: lit where the clump faces the open sky, dark underneath
          const lx = 640 - x, ly = -120 - y, ll = Math.hypot(lx, ly) || 1, sh = crowns[layer].shade(wx, wy, lx / ll, ly / ll);
          const band = sh > 0.64 ? 2 : sh > 0.47 ? 1 : 0;
          o.C = [0.018, 0.03, 0.06][layer] + band * [0.022, 0.032, 0.045][layer] * (0.5 + glow) + [0, 0.03, 0.09][layer] * glow;
          o.D = [0.9, 0.55, 0.3][layer]; return; // (no firelight on the boughs: against the darker crowns it read as rust)
        }
      }
      if (moon(x, y)) { o.C = 0.95; o.b = 1; o.D = 0; return; }
      const mist = smooth(330, 720, y) * Math.exp(-(((x - 640) / 420) ** 2)); // cool mist hanging low between the trunks
      o.C = 0.04 + 0.5 * glow + 0.05 * glow * (noise(x * 0.01, y * 0.02) - 0.5) + 0.1 * mist + (glow > 0.3 && hash(x >> 1, y >> 1) > 0.996 ? 0.4 : 0); o.b = glow > 0.2 ? 1 : 0; o.K = 0.01 * fireReach(y); o.D = 0;
    });
  },
  glsl: `
const vec2 F3 = vec2(${FIRE_T3.x.toFixed(1)}, ${FIRE_T3.y.toFixed(1)});
void scene(vec2 sp, vec4 b, vec4 a, float t, inout float C, inout float W) {
  float flick = 0.75 + 0.25 * noise(vec2(t * 6.0, 1.0)) + 0.05 * sin(t * 21.0);
  W = b.g * 2.0 * flick;
  // a faint glow off the fire, only right at the bottom edge
  W += smoothstep(690.0, 730.0, sp.y) * exp(-pow((sp.x - F3.x) / 160.0, 2.0)) * 0.05 * flick;
  // sparks and embers rising toward the canopy
  for (int i = 0; i < 24; i++) {
    float fi = float(i), life = fract(t * 0.12 + hash(vec2(fi, 1.0)));
    vec2 e = vec2(F3.x + (hash(vec2(fi, 2.0)) - 0.5) * 220.0 + sin(t * 1.3 + fi) * 30.0 * life, 760.0 - life * (560.0 + hash(vec2(fi, 3.0)) * 260.0));
    if (life < 0.9 && length(sp - e) < 3.2 * (1.0 - life * 0.6)) { W = 1.1 - life * 0.6; C = 0.0; }
  }
}`,
});

// Mobile: looking up through the trees in a tall frame: the trunks rise further toward the gap, the
// moon high in it, the sign reaching across the middle.
SCENES.push(mobile(SCENES.find((s) => s.id === "title_pines"), { view: [400, -330, 1.0] }));
