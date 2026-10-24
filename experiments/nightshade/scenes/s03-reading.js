// 3 · reading_room: from the doorway. Three openings in the far wall (two pointed windows and
// the glass doors to the greenhouse) throw long pointed shapes of moonlight across the floor.
// The brightest of them lands on the blood by the table corner. No lamp, no warm light.
// Moves: the hanging ferns sway, a cloud crosses the moon now and then and the light dims.

const FRONDS = tex2d(90, 100, (g) => {
  g.lineWidth = 1.6;
  for (let k = 0; k < 9; k++) {
    const x0 = 45 + (k - 4) * 4, sway = (k - 4) * 6 + (hash(k, 2) - 0.5) * 10, len = 55 + hash(k, 3) * 40;
    const pt = (t) => [x0 + sway * t * t * 1.2, 6 + len * t];
    g.beginPath(); g.moveTo(...pt(0)); for (let i = 1; i <= 12; i++) g.lineTo(...pt(i / 12)); g.stroke();
    for (let i = 2; i < 12; i++) { const [x, y] = pt(i / 12), s = 6 - i * 0.35; g.beginPath(); g.ellipse(x - 4, y, s, 1.8, 0.6, 0, TAU); g.ellipse(x + 4, y, s, 1.8, -0.6, 0, TAU); g.fill(); }
  }
  g.beginPath(); g.ellipse(45, 8, 30, 10, 0, 0, TAU); g.fill();
});
const BUSH = tex2d(80, 80, (g) => {
  for (let k = 0; k < 40; k++) { const a = hash(k, 1) * TAU, r = 8 + hash(k, 2) * 26, x = 40 + Math.cos(a) * r * 0.9, y = 44 + Math.sin(a) * r * 0.8; g.beginPath(); g.ellipse(x, y, 7, 3.5, a, 0, TAU); g.fill(); }
  g.lineWidth = 2; g.beginPath(); g.moveTo(40, 80); g.lineTo(40, 50); g.stroke();
});
const BERRIES = tex2d(80, 80, (g) => { for (let k = 0; k < 16; k++) { const x = 18 + hash(k, 5) * 44, y = 26 + hash(k, 6) * 36; g.beginPath(); g.arc(x, y, 2.4, 0, TAU); g.fill(); } });
const GLOVE = tex2d(60, 40, (g) => {
  g.beginPath(); g.moveTo(4, 14); g.lineTo(24, 12); g.lineTo(28, 28); g.lineTo(4, 28); g.fill();
  for (let k = 0; k < 4; k++) { g.beginPath(); g.ellipse(36 + k * 2, 13 + k * 5, 11 - Math.abs(k - 1.5) * 2, 2.4, 0.15 * k, 0, TAU); g.fill(); }
  g.beginPath(); g.ellipse(22, 31, 9, 3, 0.6, 0, TAU); g.fill();
});

SCENES.push({
  id: "reading_room",
  caption: "There's blood on the corner of the reading table, at hip height, and on the rug below it.",
  sway: 3,
  lift: 0.26,
  bake() {
    const W = makeWorld();
    W.cam = { pos: [0, 1.6, 0], yaw: 0, pitch: 0, f: 950, cx: 640, cy: 300 };
    W.amb = 0.14; W.far = 8;
    const l = Math.hypot(-0.42, 0.45, 0.79);
    W.moon = { L: [-0.42 / l, 0.45 / l, 0.79 / l], I: 2.3 };
    W.fills = [{ p: [0.06, 1.6, 6.3], I: 1.0, k: 0.22 }];
    W.backdrop = (dx, dy, dz) => {
      const a = dx / dz, e = dy / dz;
      const md = Math.hypot(a + 0.24, e - 0.245);
      if (md < 0.022) return { C: 1 };
      const bars = Math.abs(((a * 9) % 1 + 1) % 1 - 0.5) > 0.46 || Math.abs(((e * 7 + 0.3) % 1 + 1) % 1 - 0.5) > 0.47;
      const leaf = noise(a * 26, e * 22) * 0.55 + noise(a * 80, e * 70) * 0.45;
      const foliage = leaf > 0.42 + 0.35 * smooth(-0.05, 0.25, e);
      if (foliage) return { C: 0.06 + 0.22 * smooth(0.6, 0.85, leaf) * (0.6 + e) };
      return { C: bars ? 0.16 : 0.36 + 0.32 * Math.exp(-((md / 0.12) ** 2)) + 0.08 * e, sky: bars ? 0 : 1 };
    };
    const paper = M.paper(0.24, SPRIG), wood = M.wood(0.14), dark = M.wood(0.08);
    // Room.
    const BZ = 6.5, GZ = 6.62;
    const LW = [-1.58, 0.84, 2.95, 1.1], RW2 = [1.72, 0.7, 2.95, 1.1], DR = [-0.62, 0.75, 3.25];
    const inOpen = (u, v) => lancetIn(u, v, LW[0], LW[1], LW[2], LW[3]) || lancetIn(u, v, RW2[0], RW2[1], RW2[2], RW2[3]) || (u > DR[0] && u < DR[1] && v < DR[2]);
    W.rect(2, BZ, -2.6, 2.6, 0, 4.2, paper, inOpen);
    W.rect(0, -2.6, 0.9, BZ, 0, 4.2, paper); W.rect(0, 2.6, 0.9, BZ, 0, 4.2, paper);
    W.rect(2, 0.9, -2.6, 2.6, 0, 4.2, paper, (u, v) => u > -0.55 && u < 0.45 && v < 2.2);
    W.rect(1, 0, -2.6, 2.6, 0.9, BZ, M.boards(0.22, 0.13, 0.08));
    W.box([-2.6, 0, BZ - 0.04], [2.6, 0.2, BZ], 0.16);
    // Window and door glazing, set back in the wall: tracery for the windows, bars for the doors.
    const tracery = (cx, w, spring, bottom) => (u, v) => {
      if (!lancetIn(u, v, cx, w - 0.08, spring, bottom + 0.04)) return false;
      if (Math.abs(u - cx) < 0.018 && v < spring + 0.25) return false;
      for (const y of [bottom + (spring - bottom) * 0.5, spring]) if (Math.abs(v - y) < 0.016) return false;
      const r = w * 0.32;
      for (const s of [-1, 1]) if (Math.abs(Math.hypot(u - cx - s * w * 0.18, v - spring - 0.02) - r * 0.6) < 0.016 && v > spring) return false;
      return true;
    };
    const lt = tracery(...LW), rt = tracery(...RW2);
    W.rect(2, GZ, -2.6, 2.6, 0, 4.2, 0.2, (u, v) => {
      if (u > DR[0] && u < DR[1] && v < DR[2]) {
        const du = u - DR[0], w = DR[1] - DR[0];
        if (du < 0.05 || du > w - 0.05 || v > DR[2] - 0.05 || Math.abs(du - w / 2) < 0.03 || v < 0.3) return false;
        for (const y of [1.1, 2.0, 2.6]) if (Math.abs(v - y) < 0.02) return false;
        if (v > 2.6) { const fu = (du / w) * 4 % 1, fv = (v - 2.6) / 0.6; if (Math.abs(fu - fv) < 0.06 || Math.abs(1 - fu - fv) < 0.06) return false; }
        for (const x of [0.2, 0.45]) if (Math.abs((du % (w / 2)) - x * (w / 2) * 2) < 0.015) return false;
        return true;
      }
      return lt(u, v) || rt(u, v);
    });
    for (const [cx, w, spring, bottom] of [LW, RW2]) {
      W.rect(0, cx - w / 2, BZ, GZ, bottom, spring, 0.18); W.rect(0, cx + w / 2, BZ, GZ, bottom, spring, 0.18);
      W.box([cx - w / 2 - 0.06, bottom - 0.05, BZ - 0.1], [cx + w / 2 + 0.06, bottom, GZ], M.wood(0.3));
    }
    W.rect(0, DR[0], BZ, GZ, 0, DR[2], 0.18); W.rect(0, DR[1], BZ, GZ, 0, DR[2], 0.18); W.rect(1, DR[2], DR[0], DR[1], BZ, GZ, 0.18);
    // Bookshelves on both side walls, with the music box on a left shelf.
    for (const s of [-1, 1]) {
      const x0 = s < 0 ? -2.6 : 2.25, x1 = s < 0 ? -2.25 : 2.6;
      W.box([x0, 0, 3.7], [x1, 3.5, BZ], M.books(0.32));
      W.box([x0 - 0.02, 3.5, 3.66], [x1 + 0.02, 3.6, BZ], M.wood(0.2));
      W.box([Math.min(x0, x1) - 0.01, 0, 3.64], [Math.max(x0, x1) + 0.01, 3.6, 3.72], M.wood(0.2));
    }
    W.box([-2.25, 1.45, 4.35], [-2.02, 1.56, 4.62], M.wood(0.36));
    W.box([-2.25, 1.56, 4.6], [-2.02, 1.74, 4.63], M.wood(0.4));
    // The tea table on the left: one cup, two saucers.
    W.box([-1.95, 0.66, 3.15], [-1.2, 0.7, 3.75], M.wood(0.24));
    for (const [x, z] of [[-1.9, 3.2], [-1.25, 3.2], [-1.9, 3.7], [-1.25, 3.7]]) W.cyl(x, z, 0.022, 0, 0.66, wood);
    W.box([-1.85, 0.7, 3.22], [-1.3, 0.72, 3.62], 0.45);
    W.cyl(-1.48, 3.42, 0.08, 0.72, 0.735, 0.72); W.cyl(-1.48, 3.42, 0.045, 0.735, 0.8, 0.78);
    W.cyl(-1.7, 3.45, 0.08, 0.72, 0.735, 0.72);
    // The sofa, seen from behind: camelback, rolled arms, short legs.
    const velvet = (H) => { M.cloth(0.22, 0.6, 7, 0.7)(H); const bu = Math.abs(((H.x * 4) % 1 + 1) % 1 - 0.5) < 0.06 && Math.abs(((H.y * 4) % 1 + 1) % 1 - 0.5) < 0.06; if (bu) H.al *= 0.4; };
    const SX0 = -1.8, SX1 = 0.35, mid = (SX0 + SX1) / 2;
    W.rect(2, 4.9, SX0, SX1, 0.24, 1.25, velvet, (u, v) => v > 0.92 + 0.22 * Math.cos(((u - mid) / (SX1 - SX0)) * Math.PI) ** 2 + 0.04 * Math.cos(((u - mid) / (SX1 - SX0)) * Math.PI * 3));
    W.box([SX0, 0.24, 4.92], [SX1, 0.5, 5.75], velvet);
    for (const x of [SX0 - 0.06, SX1 + 0.06]) { W.box([x - 0.1, 0.24, 4.9], [x + 0.1, 0.68, 5.78], velvet); W.rod([x, 0.7, 4.9], [x, 0.7, 5.78], 0.11, velvet); }
    for (const x of [SX0, SX1]) for (const z of [4.95, 5.7]) W.cyl(x, z, 0.03, 0, 0.24, dark);
    // The low table, with books; blood on its corner and on the rug below.
    const blood = (H) => { const d = Math.hypot(H.x - 0.52, H.z - 5.06), n = noise(H.x * 14, H.z * 14); return d < 0.32 * (0.55 + 0.6 * n) || (d < 0.5 && hash(Math.floor(H.x * 60), Math.floor(H.z * 60)) > 0.93); };
    W.box([0.45, 0.46, 5.35], [1.5, 0.52, 6.05], (H) => { M.wood(0.26)(H); if (Math.hypot(H.x - 0.45, H.z - 5.35) < 0.14 + 0.05 * noise(H.x * 30, H.y * 30 + H.z * 30)) H.wb = 1; });
    for (const [x, z] of [[0.5, 5.4], [1.45, 5.4], [0.5, 6.0], [1.45, 6.0]]) W.cyl(x, z, 0.03, 0, 0.46, dark);
    W.box([1.0, 0.52, 5.55], [1.35, 0.6, 5.85], 0.3); W.box([1.04, 0.6, 5.58], [1.3, 0.66, 5.82], 0.4);
    // Rug.
    W.rect(1, 0.004, -1.7, 1.6, 2.9, 6.1, (H) => { M.rug(0.22, -1.7, 1.6, 2.9, 6.1)(H); if (blood(H)) { H.wb = 1; H.al *= 0.6; } });
    // The nightshade in its pot, and the gardening glove beside it.
    W.cyl(1.85, 4.45, 0.2, 0, 0.36, M.wood(0.32)); W.cyl(1.85, 4.45, 0.22, 0.32, 0.4, 0.34);
    W.rect(2, 4.45, 1.3, 2.4, 0.36, 1.46, (H) => { const u = (H.x - 1.3) / 1.1, v = 1 - (H.y - 0.36) / 1.1; if (BERRIES(u, v) > 0.4) { H.al = 0.04; H.e = 0.02; } else H.al = 0.2 * (0.7 + 0.6 * noise(H.x * 40, H.y * 40)); }, (u, v) => BUSH((u - 1.3) / 1.1, 1 - (v - 0.36) / 1.1) < 0.4 && BERRIES((u - 1.3) / 1.1, 1 - (v - 0.36) / 1.1) < 0.4);
    W.rect(1, 0.006, 1.25, 1.6, 3.85, 4.1, (H) => { const u = (H.x - 1.25) / 0.35; H.al = u > 0.62 ? 0.12 : 0.6; }, (u, v) => GLOVE((u - 1.25) / 0.35, (v - 3.85) / 0.25) < 0.4);
    // Hanging ferns on chains in front of the openings (moved by the shader).
    for (const x of [-1.58, 0.06, 1.72]) {
      W.group(() => {
        for (const dx of [-0.11, 0.11]) W.rod([x, 4.2, 6.15], [x + dx, 2.7, 6.15], 0.007, 0.35, { sway: true });
        W.cyl(x, 6.15, 0.13, 2.5, 2.7, M.wood(0.3), { sway: true });
        W.rect(2, 6.1, x - 0.5, x + 0.5, 1.5, 2.6, M.cloth(0.2, 0.6, 30, 0.4), (u, v) => FRONDS((u - x + 0.5) / 1.0, 1 - (v - 1.5) / 1.1) < 0.4, { sway: true });
      });
    }
    // The open door we stand in.
    W.box([-0.6, 0, 0.1], [-0.55, 2.2, 0.9], dark);
    return bakeWorld(W);
  },
  glsl: `
void scene(vec2 sp, vec4 b, vec4 a, float t, inout float C, inout float W) {
  // Now and then a cloud crosses the moon: the room dims, then the light comes back to the blood.
  float cloud = pow(0.5 + 0.5 * sin(t * 0.21 - 1.2), 8.0);
  C -= a.a * 0.75 * cloud;
  if (a.b > 0.5) C *= 1.0 - 0.35 * cloud;
  // Blood: dark red, brighter where the moon is on it.
  if (b.b > 0.5) { W = 0.16 + 0.7 * a.a * (1.0 - 0.75 * cloud); C *= 0.45; }
  // The ferns sway on their chains.
  float hang = clamp((sp.y - 40.0) / 280.0, 0.0, 1.0);
  float dx = (5.0 * sin(t * 0.45 + sp.x * 0.004) + 2.0 * sin(t * 1.3 + sp.y * 0.03)) * hang * hang;
  vec4 f = auxAt(sp - vec2(dx, 0.0));
  if (f.r > 0.5) { C = f.g; W = 0.0; }
}`,
});
