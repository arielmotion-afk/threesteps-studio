// 7 · rival_room: the Rival's very tidy room. The desk under the window, an oil lamp turned low,
// the field notebook open at a drawing of nightshade; the half-packed suitcase on its stand,
// the washstand with the small brown bottle, the made bed, the cane, the polished shoes.
// Moves: the lamp flame (and its small pool of light), moonlight under passing clouds.

const NOTEBOOK = tex2d(120, 60, (g) => {
  g.lineWidth = 1;
  for (let y = 8; y < 56; y += 5) { g.globalAlpha = 0.5; g.beginPath(); g.moveTo(6, y); g.lineTo(54, y); g.moveTo(66, y); g.lineTo(80, y); g.stroke(); }
  g.globalAlpha = 1; g.lineWidth = 1.4;
  g.beginPath(); g.moveTo(92, 54); g.quadraticCurveTo(90, 32, 100, 10); g.stroke();
  for (let k = 0; k < 5; k++) { const y = 46 - k * 8, s = k % 2 ? 1 : -1; g.beginPath(); g.ellipse(95 + s * 7, y, 7, 3, s * 0.5, 0, TAU); g.fill(); }
  for (const [x, y] of [[104, 14], [99, 18], [106, 22]]) { g.beginPath(); g.arc(x, y, 2.6, 0, TAU); g.fill(); }
  g.lineWidth = 1.6; g.beginPath(); g.moveTo(6, 50); g.lineTo(46, 50); g.moveTo(6, 52.5); g.lineTo(46, 52.5); g.stroke();
});

const RIVAL_CAM = { pos: [0.1, 1.55, 0], yaw: 0, pitch: -0.08, f: 800, cx: 640, cy: 290 };
const RIVAL_PTS = { lamp: project(RIVAL_CAM, [-0.45, 1.0, 5.15]) };
SCENES.push({
  id: "rival_room",
  caption: "His field notebook is open on the desk, at a page on deadly nightshade.",
  sway: 3,
  uniforms: { uLamp: "vec3" },
  bake() {
    const W = makeWorld();
    W.cam = RIVAL_CAM;
    W.amb = 0.09; W.far = 8;
    const l = Math.hypot(0.12, 0.55, 0.83);
    W.moon = { L: [0.12 / l, 0.55 / l, 0.83 / l], I: 2.0 };
    W.fills = [{ p: [0.1, 1.9, 5.3], I: 1.1, k: 0.25 }, { p: [0.1, 1.2, 5.3], I: 0.6, k: 0.15 }];
    W.warm = { p: [-0.45, 1.02, 5.15], I: 1.5, k: 2.2, r: 0.06 };
    W.backdrop = (dx, dy, dz) => {
      const a = dx / dz, e = dy / dz;
      const md = Math.hypot(a - 0.1, e - 0.15);
      if (md < 0.03) return { C: 1, sky: 1 };
      const tree = noise(a * 14, e * 14) * 0.6 + noise(a * 50, e * 50) * 0.4 > 0.46 - 0.5 * smooth(0.05, -0.15, e) + 0.25 * smooth(0.15, 0.3, e);
      return { C: tree ? 0.12 + 0.06 * noise(a * 90, e * 90) : 0.4 + 0.32 * Math.exp(-((md / 0.1) ** 2)), sky: tree ? 0 : 1 };
    };
    const paper = M.paper(0.22, SPRIG), wood = M.wood(0.16), dark = M.wood(0.09), BZ = 5.5, H0 = 3.0;
    const WX0 = -0.55, WX1 = 0.75, WY0 = 0.95, WY1 = 2.75;
    // Room.
    W.rect(2, BZ, -2.6, 2.6, 0, H0, paper, (u, v) => u > WX0 && u < WX1 && v > WY0 && v < WY1);
    W.rect(0, -2.6, -1, BZ, 0, H0, paper); W.rect(0, 2.6, -1, BZ, 0, H0, paper);
    W.rect(1, 0, -2.6, 2.6, -1, BZ, M.boards(0.22, 0.13, 0.08)); W.rect(1, H0, -2.6, 2.6, -1, BZ, 0.1);
    W.box([-2.6, 0, BZ - 0.04], [2.6, 0.16, BZ], 0.14); W.box([-2.6, 0.95, BZ - 0.03], [2.6, 1.0, BZ], 0.2);
    // The window: reveal, sill, glazing bars; curtains on a rod.
    W.rect(2, BZ + 0.15, WX0, WX1, WY0, WY1, 0.25, (u, v) => { const fu = (u - WX0) / (WX1 - WX0), fv = (v - WY0) / (WY1 - WY0); if (fu < 0.04 || fu > 0.96 || fv < 0.03 || fv > 0.97) return false; for (const x of [1 / 3, 2 / 3]) if (Math.abs(fu - x) < 0.015) return false; for (const y of [0.25, 0.5, 0.75]) if (Math.abs(fv - y) < 0.012) return false; return true; });
    W.rect(0, WX0, BZ, BZ + 0.15, WY0, WY1, 0.2); W.rect(0, WX1, BZ, BZ + 0.15, WY0, WY1, 0.2); W.rect(1, WY1, WX0, WX1, BZ, BZ + 0.15, 0.2);
    W.box([WX0 - 0.08, WY0 - 0.05, BZ - 0.06], [WX1 + 0.08, WY0, BZ + 0.15], M.wood(0.32));
    W.rod([WX0 - 0.5, 2.92, BZ - 0.12], [WX1 + 0.5, 2.92, BZ - 0.12], 0.018, 0.4);
    for (const [x0, x1] of [[WX0 - 0.48, WX0 + 0.08], [WX1 - 0.08, WX1 + 0.48]]) W.rect(2, BZ - 0.12, x0, x1, 0.35, 2.92, (H) => { M.cloth(0.3, 1.6, 15, 0.05)(H); H.noMoon = true; }, null, { noShadow: true });
    // The desk with its lamp, notebook, books, pen pot and a little vase.
    W.group(() => {
      W.box([-0.7, 0.72, 4.85], [0.9, 0.78, 5.45], M.wood(0.24));
      W.box([0.35, 0.05, 4.9], [0.88, 0.72, 5.42], (H) => { M.wood(0.17)(H); if (H.nz < -0.5 && (((H.y - 0.05) / 0.22) % 1 < 0.06)) H.al *= 0.35; });
      for (const [x, z] of [[-0.66, 4.89], [-0.66, 5.41]]) W.box([x - 0.03, 0, z - 0.03], [x + 0.03, 0.72, z + 0.03], wood);
      W.cyl(-0.45, 5.15, 0.07, 0.78, 0.84, 0.4); W.cyl(-0.45, 5.15, 0.02, 0.84, 0.92, 0.45);
      W.cyl(-0.45, 5.15, 0.035, 0.92, 1.1, (H) => { H.al = 0.5; H.wb = 1; });
      W.box([-0.15, 0.78, 4.98], [0.45, 0.79, 5.32], (H) => { const u = (H.x + 0.15) / 0.6, v = (H.z - 4.98) / 0.34; H.al = NOTEBOOK(u * 0.999, 1 - v * 0.999) > 0.35 ? 0.2 : Math.abs(u - 0.5) < 0.01 ? 0.3 : 0.62; });
      W.box([-0.62, 0.78, 4.95], [-0.3, 0.86, 5.2], 0.22); W.box([-0.6, 0.86, 4.97], [-0.32, 0.92, 5.18], 0.3);
      W.cyl(0.58, 5.25, 0.04, 0.78, 0.9, 0.3); for (const dx of [-0.012, 0.012]) W.rod([0.58 + dx, 0.88, 5.25], [0.58 + dx * 3, 1.0, 5.25], 0.004, 0.5);
      W.cyl(0.75, 5.2, 0.04, 0.78, 0.94, 0.5);
      W.box([0.5, 0.78, 4.92], [0.72, 0.84, 5.08], 0.26);
    });
    W.rect(2, 5.2, 0.62, 0.9, 0.94, 1.32, 0.45, (u, v) => FLOWERS((u - 0.62) / 0.28, 1 - (v - 0.94) / 0.38) < 0.4);
    // The chair at the desk, seen from behind: spindle back.
    W.group(() => {
      W.box([-0.05, 0.44, 4.35], [0.45, 0.48, 4.8], wood);
      for (const [x, z] of [[-0.02, 4.38], [0.42, 4.38], [-0.02, 4.77], [0.42, 4.77]]) W.cyl(x, z, 0.018, 0, 0.44, wood);
      for (const x of [-0.02, 0.42]) W.cyl(x, 4.36, 0.02, 0.44, 1.0, wood);
      W.box([-0.04, 0.92, 4.34], [0.44, 1.0, 4.39], wood);
      for (let k = 1; k < 5; k++) W.cyl(-0.02 + k * 0.088, 4.36, 0.01, 0.48, 0.92, wood);
    });
    // The bed on the left, made with square corners; the shoes; the cane.
    W.group(() => {
      W.rect(1, 0.58, -2.45, -1.3, 1.6, 4.0, M.cloth(0.5, 0.5, 5, 0.9));
      W.box([-2.45, 0.08, 1.6], [-1.3, 0.58, 4.0], (H) => { M.cloth(0.42, 0.4, 8, 0.2)(H); const u = ((H.z * 6) % 1), v = ((H.y * 6) % 1); if (Math.abs(u - 0.5) + Math.abs(v - 0.5) < 0.25) H.al *= 1.4; });
      W.box([-2.35, 0.58, 3.55], [-1.4, 0.72, 3.95], M.cloth(0.75, 0.6, 7, 0.8));
      for (const [z, top] of [[4.05, 1.2], [1.55, 0.8]]) for (const x of [-2.47, -1.28]) { W.cyl(x, z, 0.03, 0, top, M.wood(0.12)); W.ball(x, top + 0.03, z, 0.05, M.wood(0.3)); }
      W.box([-2.47, 0.62, 4.03], [-1.28, 1.15, 4.07], M.wood(0.14)); W.box([-2.47, 0.5, 1.53], [-1.28, 0.78, 1.57], M.wood(0.14));
    });
    for (const dx of [0, 0.14]) { const x = -1.05 + dx; W.box([x - 0.05, 0, 1.6], [x + 0.05, 0.08, 1.88], (H) => { H.al = 0.08; H.refl = 0.35; }); }
    W.rod([-1.3, 0.0, 4.6], [-1.2, 0.95, 4.75], 0.014, 0.2); W.rod([-1.2, 0.95, 4.75], [-1.12, 0.95, 4.62], 0.014, 0.2);
    // The washstand on the right wall: basin, jug, towel, the small brown bottle.
    W.group(() => {
      W.box([2.05, 0.78, 3.8], [2.6, 0.82, 4.8], M.wood(0.26)); W.box([2.08, 0, 3.83], [2.6, 0.78, 4.77], M.wood(0.14));
      W.cyl(2.3, 4.15, 0.18, 0.82, 0.9, 0.7); W.cyl(2.3, 4.15, 0.14, 0.9, 0.902, 0.4);
      W.cyl(2.3, 4.15, 0.06, 0.9, 1.04, 0.72); W.cyl(2.3, 4.15, 0.045, 1.04, 1.12, 0.72);
      W.cyl(2.25, 4.6, 0.03, 0.82, 0.96, (H) => { H.al = 0.2; H.wb = 0.3; }); W.cyl(2.25, 4.6, 0.012, 0.96, 1.0, 0.15);
    });
    W.rect(0, 2.04, 3.95, 4.3, 0.4, 0.78, M.cloth(0.55, 1.2, 12, 0.1));
    // The half-packed suitcase, lid open, on its folding stand.
    W.group(() => {
      for (const s of [-1, 1]) for (const z of [2.05, 2.65]) W.rod([1.35 + s * 0.38, 0.0, z], [1.35 - s * 0.38, 0.5, z], 0.015, wood);
      W.box([0.95, 0.5, 2.0], [1.75, 0.53, 2.7], wood);
      W.box([0.95, 0.53, 2.0], [1.75, 0.76, 2.7], (H) => { H.al = 0.22 * (0.85 + 0.3 * noise(H.x * 30, H.y * 30)); if (H.ny > 0.5 && H.x > 1.0 && H.x < 1.7 && H.z > 2.05 && H.z < 2.65) H.al = 0.08; });
      W.box([1.02, 0.6, 2.08], [1.36, 0.77, 2.4], M.cloth(0.75, 0.6, 20, 0.6)); W.box([1.38, 0.6, 2.08], [1.68, 0.74, 2.62], M.cloth(0.4, 0.6, 20, 0.6));
      W.box([0.95, 0.76, 2.68], [1.75, 1.22, 2.73], (H) => { H.al = 0.22; if (H.nz < -0.5 && H.y > 0.8 && H.y < 1.18) H.al = 0.32; });
    });
    // Framed botanical prints.
    for (const [x0, y0] of [[-1.9, 1.5], [1.3, 1.55], [1.85, 1.55]]) {
      W.box([x0, y0, BZ - 0.05], [x0 + 0.42, y0 + 0.55, BZ], M.wood(0.2));
      W.rect(2, BZ - 0.051, x0 + 0.05, x0 + 0.37, y0 + 0.05, y0 + 0.5, (H) => { const u = (H.x - x0 - 0.05) / 0.32, v = 1 - (H.y - y0 - 0.05) / 0.45; H.al = BOTANICAL(u * 0.999, v * 0.999) > 0.4 ? 0.1 : 0.45; });
    }
    W.rect(1, 0.004, -1.0, 1.6, 2.6, 4.9, M.rug(0.22, -1.0, 1.6, 2.6, 4.9));
    return bakeWorld(W);
  },
  update() { return { uLamp: RIVAL_PTS.lamp }; },
  glsl: `
void scene(vec2 sp, vec4 b, vec4 a, float t, inout float C, inout float W) {
  float flick = 0.88 + 0.12 * noise(vec2(t * 2.5, 3.0)) + 0.03 * sin(t * 13.0);
  W = b.g * 2.0 * flick;
  if (b.b > 0.9) { W = 1.2 * flick; C = 0.35; }
  else if (b.b > 0.2) W += 0.25;
  // The small flame inside the chimney.
  vec2 q = (sp - uLamp.xy) / uLamp.z;
  if (abs(q.x) < 0.012 * (1.0 - (q.y + 0.03) / 0.07) && q.y > -0.03 && q.y < 0.04 + 0.01 * flick) { W = 1.4; C = 0.6; }
  // A cloud now and then across the moon.
  float cloud = pow(0.5 + 0.5 * sin(t * 0.17 + 2.0), 10.0);
  C -= a.a * 0.6 * cloud;
}`,
});

// Mobile: closer in: the desk and the candle under the window, the bed at the left.
SCENES.push(mobile(SCENES.find((s) => s.id === "rival_room"), {
  cam: { ...RIVAL_CAM, pos: [0.1, 1.55, 1.1], f: 560, cx: 360, cy: 470 },
}));
