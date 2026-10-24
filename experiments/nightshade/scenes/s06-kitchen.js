// 6 · kitchen: the old kitchen at night. The range on the left with its fire door glowing, the
// kettle still steaming, copper pans; the dresser of plates; the long table; on the right the
// stone sink under the moonlit window, one wet cup on the drying rack.
// Moves: the ember glow, the steam, the drying herbs swaying.

const HERBS = tex2d(40, 90, (g) => {
  g.lineWidth = 1.4;
  g.beginPath(); g.moveTo(20, 0); g.lineTo(20, 14); g.stroke();
  for (let k = 0; k < 14; k++) { const a = -0.5 + k * 0.075, l = 50 + hash(k, 1) * 26; g.beginPath(); g.moveTo(20, 12); g.lineTo(20 + Math.sin(a) * l, 12 + Math.cos(a) * l); g.stroke(); for (let i = 1; i < 6; i++) { const t = i / 6; g.beginPath(); g.ellipse(20 + Math.sin(a) * l * t, 12 + Math.cos(a) * l * t, 3, 1.4, a + 1.2, 0, TAU); g.fill(); } }
});

const KITCHEN_CAM = { pos: [0.1, 1.55, -0.2], yaw: -0.07, pitch: -0.1, f: 740, cx: 640, cy: 300 };
const KITCHEN_PTS = { kettle: project(KITCHEN_CAM, [-2.0, 1.17, 1.96]), fire: project(KITCHEN_CAM, [-1.9, 0.4, 2.5]) };
SCENES.push({
  id: "kitchen",
  caption: "On the drying rack there's one teacup, still wet.",
  sway: 3,
  lift: 0.26,
  uniforms: { uKettle: "vec3", uFire: "vec3" },
  bake() {
    const W = makeWorld();
    W.cam = KITCHEN_CAM;
    W.amb = 0.14; W.far = 9;
    const l = Math.hypot(0.75, 0.5, -0.15);
    W.moon = { L: [0.75 / l, 0.5 / l, -0.15 / l], I: 2.0 };
    W.fills = [{ p: [2.3, 1.7, 3.9], I: 0.9, k: 0.35 }];
    W.warm = { p: [-1.75, 0.42, 2.5], I: 2.4, k: 1.4 };
    W.backdrop = (dx, dy, dz) => {
      const e = dy / Math.hypot(dx, dz), az = dz / dx;
      if (Math.hypot(az - 0.32, e - 0.18) < 0.03) return { C: 1, sky: 1 };
      const tree = noise(az * 12, e * 14) * 0.6 + noise(az * 40, e * 40) * 0.4 > 0.5 - 0.4 * smooth(0.1, -0.15, e);
      return { C: tree ? 0.12 : 0.42 + 0.3 * Math.exp(-((Math.hypot(az - 0.32, e - 0.18) / 0.1) ** 2)), sky: tree ? 0 : 1 };
    };
    const stone = M.stone(0.24), wood = M.wood(0.16), dark = M.wood(0.08), iron = (H) => { H.al = 0.09 * (0.8 + 0.4 * noise(H.y * 30, H.z * 30)); };
    const BZ = 6, H0 = 3.0;
    // Room: stone walls, flagstone floor, beamed ceiling.
    W.rect(2, BZ, -2.6, 2.6, 0, H0, stone);
    W.rect(0, -2.6, -1, BZ, 0, H0, stone);
    W.rect(0, 2.6, -1, BZ, 0, H0, stone, (u, v) => u > 3.35 && u < 4.35 && v > 1.15 && v < 2.25);
    W.rect(1, 0, -2.6, 2.6, -1, BZ, M.flags(0.26, 0.55, 0.06));
    W.rect(1, H0, -2.6, 2.6, -1, BZ, M.wood(0.12));
    W.group(() => { for (const x of [-1.3, 0, 1.3]) W.box([x - 0.11, H0 - 0.22, -1], [x + 0.11, H0, BZ], M.wood(0.16)); W.box([-2.6, H0 - 0.24, 4.4], [2.6, H0 - 0.04, 4.6], M.wood(0.16)); W.box([-2.6, H0 - 0.24, 1.6], [2.6, H0 - 0.04, 1.8], M.wood(0.16)); });
    // The range: iron body, the glowing fire door, the kettle, stovepipe, the pan rail.
    W.group(() => {
      W.box([-2.6, 0, 1.5], [-1.9, 0.86, 3.5], iron);
      W.box([-2.62, 0.86, 1.45], [-1.86, 0.92, 3.55], (H) => { H.al = 0.12; H.refl = 0.1; });
      W.rect(0, -1.899, 2.25, 2.75, 0.24, 0.56, (H) => { H.al = 0.05; H.wb = Math.abs(((H.z - 2.25) / 0.5 * 5) % 1 - 0.5) > 0.38 ? 0.2 : 1; });
      for (const [z0, z1, y0, y1] of [[1.65, 2.15, 0.2, 0.62], [2.85, 3.35, 0.2, 0.62]]) W.box([-1.92, y0, z0], [-1.88, y1, z1], (H) => { H.al = 0.13; });
      W.box([-1.92, 0.68, 1.6], [-1.86, 0.72, 3.4], 0.4);
      W.cyl(-2.42, 3.2, 0.09, 0.92, H0, iron);
    });
    W.ball(-2.2, 1.06, 2.0, 0.14, (H) => { H.al = 0.3; H.refl = 0.2; }); W.cyl(-2.2, 2.0, 0.09, 0.92, 1.02, 0.3);
    W.rod([-2.08, 1.08, 2.0], [-1.98, 1.16, 1.96], 0.022, 0.3); W.rod([-2.2, 1.24, 1.92], [-2.2, 1.24, 2.08], 0.012, 0.3);
    W.rod([-2.45, 1.95, 1.6], [-2.45, 1.95, 3.0], 0.015, 0.4);
    for (let k = 0; k < 4; k++) {
      const z = 1.75 + k * 0.32, r = 0.12 + 0.03 * (k % 2), y = 1.95 - 0.3 - r;
      W.rod([-2.45, 1.95, z], [-2.47, y + r, z], 0.01, 0.4);
      W.rect(0, -2.5, z - r, z + r, y - r, y + r, (H) => { const d = Math.hypot(H.z - z, H.y - y) / r; H.al = d > 0.85 ? 0.62 : 0.4; H.refl = 0.15; }, (u, v) => Math.hypot(u - z, v - y) > r);
    }
    W.rect(0, -1.85, 2.9, 3.15, 0.3, 0.7, M.cloth(0.55, 1.2, 14, 0.1));
    // The dresser with its rows of plates, jugs and a bowl.
    W.group(() => {
      W.box([-0.95, 0, 5.4], [0.95, 0.9, BZ], M.wood(0.18));
      W.box([-1.0, 0.9, 5.36], [1.0, 0.96, BZ], M.wood(0.26));
      W.box([-0.95, 0.96, 5.76], [0.95, 2.4, BZ], M.wood(0.12));
      for (const y of [1.35, 1.8, 2.3]) W.box([-0.95, y - 0.04, 5.62], [0.95, y, BZ], M.wood(0.24));
      for (const x of [-0.95, 0.95]) W.box([x - 0.04, 0.96, 5.62], [x + 0.04, 2.45, BZ], M.wood(0.2));
      for (const [y, n, r] of [[1.57, 5, 0.15], [2.04, 5, 0.15]]) for (let k = 0; k < n; k++) {
        const x = -0.72 + k * 0.36;
        W.rect(2, 5.72, x - r, x + r, y - r, y + r, (H) => { const d = Math.hypot(H.x - x, H.y - y) / r; H.al = d > 0.82 ? 0.55 : d > 0.6 ? 0.35 : 0.6; }, (u, v) => Math.hypot(u - x, v - y) > r);
      }
      for (let k = 0; k < 6; k++) { const x = -0.8 + k * 0.32; W.box([x - 0.12, 0.25, 5.38], [x + 0.12, 0.7, 5.4], M.wood(0.22)); }
      W.cyl(-0.55, 5.55, 0.07, 0.96, 1.2, 0.45); W.cyl(0.6, 5.55, 0.06, 0.96, 1.16, 0.5); W.cyl(0.05, 5.5, 0.16, 0.96, 1.04, 0.5);
    });
    // The long table and the bench.
    W.group(() => {
      W.box([-0.85, 0.76, 2.3], [0.55, 0.84, 4.7], (H) => { M.wood(0.3, 0.6)(H); if (H.ny > 0.5 && ((H.x + 0.85) / 0.2) % 1 < 0.05) H.al *= 0.4; });
      for (const [x, z] of [[-0.76, 2.4], [0.46, 2.4], [-0.76, 4.6], [0.46, 4.6]]) W.box([x - 0.05, 0, z - 0.05], [x + 0.05, 0.76, z + 0.05], wood);
      W.box([0.75, 0.42, 2.5], [1.05, 0.48, 4.5], M.wood(0.26)); for (const z of [2.6, 4.4]) W.box([0.78, 0, z - 0.04], [1.02, 0.42, z + 0.04], wood);
    });
    W.cyl(-0.3, 3.3, 0.17, 0.84, 0.94, 0.4); W.cyl(-0.3, 3.3, 0.13, 0.9, 0.941, 0.15);
    W.cyl(0.15, 3.6, 0.06, 0.84, 1.05, 0.38); W.ball(0.15, 1.05, 3.6, 0.05, 0.38);
    // The sink under the window, the counter, the tap, the drying rack with one cup.
    const WZ0 = 3.35, WZ1 = 4.35, WY0 = 1.15, WY1 = 2.25;
    W.rect(0, 2.8, WZ0, WZ1, WY0, WY1, 0.25, (u, v) => { const fu = (u - WZ0) / (WZ1 - WZ0), fv = (v - WY0) / (WY1 - WY0); return fu > 0.05 && fu < 0.95 && fv > 0.05 && fv < 0.95 && Math.abs(fu - 0.5) > 0.025 && Math.abs(fv - 0.5) > 0.025; });
    W.rect(2, WZ0, 2.6, 2.8, WY0, WY1, 0.3); W.rect(2, WZ1, 2.6, 2.8, WY0, WY1, 0.3); W.rect(1, WY0, 2.4, 2.8, WZ0, WZ1, 0.4); W.rect(1, WY1, 2.6, 2.8, WZ0, WZ1, 0.2);
    W.box([2.4, WY0 - 0.06, WZ0 - 0.1], [2.6, WY0, WZ1 + 0.1], M.stone(0.3));
    W.box([1.95, 0, 1.6], [2.6, 0.86, 5.6], (H) => { M.wood(0.15)(H); if (H.nx < -0.5 && (((H.z - 1.6) / 0.55) % 1 < 0.04 || H.y < 0.06)) H.al *= 0.4; });
    W.box([1.9, 0.86, 1.55], [2.6, 0.93, 5.65], (H) => { M.stone(0.36, 0.6, 0.3)(H); H.refl = 0.12; });
    W.box([1.85, 0.6, 3.35], [2.5, 0.95, 4.35], (H) => { H.al = 0.42 * (0.85 + 0.3 * noise(H.y * 20, H.z * 20)); });
    W.box([1.95, 0.8, 3.45], [2.42, 0.951, 4.25], 0.08);
    W.rod([2.5, 0.95, 3.85], [2.5, 1.25, 3.85], 0.018, 0.55); W.rod([2.5, 1.25, 3.85], [2.32, 1.22, 3.85], 0.016, 0.55);
    W.group(() => {
      for (const z of [4.55, 5.15]) W.rod([1.98, 0.93, z], [1.98, 1.15, z], 0.008, 0.45);
      for (let k = 0; k < 6; k++) W.rod([1.98, 0.95, 4.55 + k * 0.12], [2.18, 1.08, 4.55 + k * 0.12], 0.006, 0.45);
      W.rod([1.98, 1.15, 4.55], [1.98, 1.15, 5.15], 0.008, 0.45);
    });
    W.cyl(2.07, 4.84, 0.045, 0.98, 1.06, (H) => { H.al = 0.75; H.refl = 0.3; });
    W.rect(0, 2.58, 4.6, 4.95, 1.2, 1.65, M.cloth(0.5, 1.2, 12, 0.1));
    // Herb bundles hanging from the beams (moved by the shader).
    for (const [x, z, y] of [[-1.6, 1.7, 2.78], [-1.15, 1.7, 2.78], [-0.3, 4.5, 2.78], [0.3, 4.5, 2.78], [0.85, 4.5, 2.78], [1.3, 1.7, 2.78], [-0.75, 4.5, 2.78]])
      W.rect(2, z - 0.15, x - 0.2, x + 0.2, y - 0.9, y, M.cloth(0.26, 0.6, 30, 0.3), (u, v) => HERBS((u - x + 0.2) / 0.4, (y - v) / 0.9) < 0.4, { sway: true });
    return bakeWorld(W);
  },
  update() { return { uKettle: KITCHEN_PTS.kettle, uFire: KITCHEN_PTS.fire }; },
  glsl: `
void scene(vec2 sp, vec4 b, vec4 a, float t, inout float C, inout float W) {
  float flick = 0.75 + 0.25 * noise(vec2(t * 4.5, 1.0)) + 0.05 * sin(t * 17.0);
  W = b.g * 2.0 * flick;
  // The fire door: embers glowing through the bars.
  if (b.b > 0.9) { float e = noise(vec2(sp.x * 0.15, sp.y * 0.12 + t * 0.8)); W = (0.7 + 0.6 * e) * flick; C = e > 0.7 ? 0.25 : 0.0; }
  // Steam from the kettle spout.
  vec2 k = (sp - uKettle.xy) / uKettle.z;
  if (k.y < 0.0 && k.y > -0.9) {
    float wob = k.x - 0.12 * k.y - sin(k.y * 7.0 + t * 1.6) * 0.05 * (-k.y);
    C += 0.24 * exp(-wob * wob / (0.003 + 0.02 * -k.y)) * (1.0 + k.y * 1.1) * noise(vec2(sp.x * 0.05, sp.y * 0.05 + t * 0.7));
  }
  // The herbs sway a little.
  float dx = 2.5 * sin(t * 0.6 + sp.x * 0.01) * clamp((sp.y + 40.0) / 220.0, 0.0, 1.0);
  vec4 h = auxAt(sp - vec2(dx, 0.0));
  if (h.r > 0.5) { C = h.g; W = 0.0; }
}`,
});
