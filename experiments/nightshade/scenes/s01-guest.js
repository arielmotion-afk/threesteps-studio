// 1 · guest_room_dusk: the small guest room at dusk, from the doorway. Bed on the left with the
// sketchbook on it, the sash window open a few inches, clouds drifting.
// Moves: clouds, dust in the light.

const SPRIG = tex2d(32, 42, (g) => {
  g.lineWidth = 1.2;
  g.beginPath(); g.moveTo(16, 36); g.quadraticCurveTo(14, 22, 17, 8); g.stroke();
  for (const [x, y, a] of [[12, 26, -0.7], [20, 20, 0.7], [12, 14, -0.6], [19, 10, 0.5]]) { g.beginPath(); g.ellipse(x, y, 4, 1.8, a, 0, TAU); g.fill(); }
  g.beginPath(); g.arc(17, 6, 2.4, 0, TAU); g.fill();
});
const BOTANICAL = tex2d(60, 80, (g) => {
  g.lineWidth = 1.5;
  g.beginPath(); g.moveTo(30, 74); g.bezierCurveTo(26, 50, 34, 30, 30, 12); g.stroke();
  for (let k = 0; k < 6; k++) { const y = 66 - k * 9, s = k % 2 ? 1 : -1; g.beginPath(); g.ellipse(30 + s * 9, y, 9, 3.4, s * 0.5, 0, TAU); g.fill(); }
  for (const [x, y] of [[30, 10], [22, 16], [38, 15]]) { g.beginPath(); g.arc(x, y, 4, 0, TAU); g.fill(); }
});

function pines(a, e, seed, base, hMin, hMax, n, span) {
  for (let i = 0; i < n; i++) {
    const ai = span[0] + (span[1] - span[0]) * hash(i, seed), hi = hMin + (hMax - hMin) * hash(i, seed + 1), wi = hi * (0.32 + 0.1 * hash(i, seed + 2));
    const top = base + hi;
    if (e > top || e < base - 0.2) continue;
    const k = (top - e) / hi, jag = 0.72 + 0.28 * ((((top - e) / (hi * 0.14)) % 1));
    if (Math.abs(a - ai) < wi * Math.min(1, k) * jag) return true;
  }
  return false;
}

SCENES.push({
  id: "guest_room_dusk",
  caption: "You lay down in the guest room to rest before midnight, your sketchbook on your chest.",
  sway: 3,
  bake() {
    const W = makeWorld();
    W.cam = { pos: [0.05, 1.55, 0], yaw: 0, pitch: 0, f: 1100, cx: 640, cy: 160 };
    W.amb = 0.065; W.far = 6;
    W.moon = { L: [-0.12 / 0.987, 0.8 / 0.987, 0.58 / 0.987], I: 0.95 };
    W.fills = [{ p: [0.2, 1.3, 4.55], I: 1.6, k: 0.45 }, { p: [0.2, 2.1, 4.55], I: 1.2, k: 0.45 }];
    W.backdrop = (dx, dy, dz) => {
      const a = dx / dz, e = dy / dz;
      if (pines(a, e, 11, -0.13, 0.05, 0.12, 26, [-0.12, 0.2])) return { C: 0.07 + 0.05 * noise(a * 400, e * 300) };
      if (pines(a, e, 31, -0.15, 0.04, 0.08, 30, [-0.12, 0.2])) return { C: 0.13 + 0.04 * noise(a * 300, e * 300) };
      const glow = Math.exp(-(((e + 0.08) / 0.09) ** 2));
      const cloud = smooth(0.52, 0.7, noise(a * 14, e * 46)) * smooth(-0.05, 0.08, e);
      return { C: 0.34 + 0.4 * glow + 0.08 * (e > 0.1 ? 0 : 1) - 0.14 * cloud, sky: 1 };
    };
    const paper = M.paper(0.34, SPRIG), wood = M.wood(0.16), dark = M.wood(0.09);
    // Room: back wall with the window opening, side walls, front wall with the doorway, floor.
    const WX0 = -0.25, WX1 = 0.65, SILL = 0.7, TOP = 2.75, GLASS = 4.84;
    W.rect(2, 4.7, -2.3, 2.3, 0, 3, paper, (u, v) => u > WX0 && u < WX1 && v > SILL && v < TOP);
    W.rect(0, -2.3, 0.8, 4.7, 0, 3, paper); W.rect(0, 2.3, 0.8, 4.7, 0, 3, paper);
    W.rect(2, 0.86, -2.3, 2.3, 0, 3, paper, (u, v) => Math.abs(u) < 0.39 && v < 2.1);
    W.rect(1, 0, -2.3, 2.3, 0.8, 4.7, M.boards(0.3, 0.15, 0.06));
    W.rect(1, 3, -2.3, 2.3, 0.8, 4.7, 0.1, null, { noShadow: true }); // ceiling (only seen in the tall mobile frame; casts no shadow)
    // Window: reveal, sill, casing, two sashes (the lower one raised a little), glass set back.
    W.rect(0, WX0, 4.7, GLASS, SILL, TOP, 0.24); W.rect(0, WX1, 4.7, GLASS, SILL, TOP, 0.24);
    W.rect(1, TOP, WX0, WX1, 4.7, GLASS, 0.2);
    W.box([WX0 - 0.09, SILL - 0.05, 4.52], [WX1 + 0.09, SILL, 4.86], M.wood(0.42));
    W.box([WX0 - 0.13, SILL, 4.64], [WX0, TOP + 0.12, 4.7], M.wood(0.28)); W.box([WX1, SILL, 4.64], [WX1 + 0.13, TOP + 0.12, 4.7], M.wood(0.28));
    const MID = (WX0 + WX1) / 2, LOW = SILL + 0.14;
    W.rect(2, GLASS, WX0, WX1, SILL, TOP, M.wood(0.32), (u, v) => {
      if (u < WX0 + 0.045 || u > WX1 - 0.045 || v > TOP - 0.05) return false;
      if (v < LOW) return true; // the lower sash is raised: open air beneath it
      if (Math.abs(u - MID) < 0.016) return false;
      for (const y of [LOW + 0.03, 1.72, 1.78, 1.25, 2.25]) if (Math.abs(v - y) < (y === LOW + 0.03 ? 0.035 : 0.016)) return false;
      return true;
    });
    // Baseboards.
    W.box([-2.3, 0, 4.66], [2.3, 0.16, 4.7], 0.2); W.box([-2.3, 0, 0.8], [-2.26, 0.16, 4.7], 0.2); W.box([2.26, 0, 0.8], [2.3, 0.16, 4.7], 0.2);
    // The open door on the left, the door frame on the right.
    W.box([-0.47, 0, 0.05], [-0.42, 2.1, 0.85], (H) => { const p = Math.abs(H.z - 0.45) < 0.3 && ((H.y > 1.1 && H.y < 1.95) || (H.y > 0.2 && H.y < 0.95)); dark(H); if (!p) H.al *= 0.7; });
    W.box([0.39, 0, 0.72], [0.52, 2.2, 0.86], wood);
    // Bed: blanket over the mattress, pillow, iron frame with brass knobs.
    // The blanket: a rumpled top, and sides that hang in folds down to a wavy hem.
    const hem = (u) => 0.14 + 0.05 * Math.sin(u * 11) + 0.03 * Math.sin(u * 27 + 1);
    W.rect(1, 0.62, -2.1, -1.05, 2.5, 4.45, M.cloth(0.84, 1.1, 6, 0.8));
    W.rect(0, -1.05, 2.5, 4.45, 0.05, 0.62, M.cloth(0.7, 1.4, 9, 0.08), (u, v) => v < hem(u));
    W.rect(2, 2.5, -2.1, -1.05, 0.05, 0.62, M.cloth(0.66, 1.4, 9, 0.08), (u, v) => v < hem(u + 3));
    W.box([-2.08, 0.25, 2.55], [-1.07, 0.6, 4.43], 0.05);
    W.box([-2.0, 0.6, 4.0], [-1.15, 0.76, 4.42], M.cloth(0.88, 0.9, 6, 0.9));
    const iron = 0.1;
    for (const [x, z, top] of [[-2.13, 4.5, 1.15], [-1.02, 4.5, 1.15], [-2.13, 2.46, 0.8], [-1.02, 2.46, 0.8]]) { W.cyl(x, z, 0.024, 0, top, iron); W.ball(x, top + 0.03, z, 0.042, 0.55); }
    W.box([-2.13, 1.07, 4.48], [-1.02, 1.11, 4.52], iron); W.box([-2.13, 0.8, 4.48], [-1.02, 0.83, 4.52], iron);
    for (let k = 1; k < 10; k++) W.cyl(-2.13 + k * 0.111, 4.5, 0.009, 0.6, 1.08, iron);
    W.box([-2.13, 0.68, 2.44], [-1.02, 0.71, 2.48], iron);
    // The sketchbook and a pencil on the blanket.
    W.box([-1.62, 0.62, 3.25], [-1.32, 0.648, 3.5], (H) => { H.al = H.ny > 0.5 ? 0.1 : 0.6; });
    W.box([-1.26, 0.62, 3.38], [-1.08, 0.633, 3.395], 0.45);
    // A framed botanical print.
    W.box([-1.52, 1.28, 4.66], [-1.02, 1.88, 4.7], M.wood(0.2));
    W.rect(2, 4.655, -1.46, -1.08, 1.34, 1.82, (H) => { const u = (H.x + 1.46) / 0.38, v = 1 - (H.y - 1.34) / 0.48; H.al = BOTANICAL(u * 0.999, v * 0.999) > 0.4 ? 0.12 : 0.55; });
    // Washstand with basin, jug and towel.
    W.box([1.0, 0.74, 4.15], [1.62, 0.78, 4.64], M.wood(0.24));
    for (const [x, z] of [[1.03, 4.18], [1.59, 4.18], [1.03, 4.61], [1.59, 4.61]]) W.box([x - 0.02, 0, z - 0.02], [x + 0.02, 0.74, z + 0.02], wood);
    W.box([1.0, 0.18, 4.15], [1.62, 0.21, 4.64], wood);
    W.cyl(1.31, 4.38, 0.2, 0.78, 0.86, 0.72); W.cyl(1.31, 4.38, 0.16, 0.86, 0.875, 0.5);
    W.cyl(1.31, 4.4, 0.07, 0.86, 1.02, 0.74); W.cyl(1.31, 4.4, 0.05, 1.02, 1.12, 0.74); W.ball(1.31, 1.12, 4.4, 0.055, 0.74);
    W.box([0.97, 0.36, 4.22], [1.0, 0.76, 4.46], M.cloth(0.6, 0.4, 9));
    // Chair with a coat over its back.
    W.box([1.24, 0.42, 3.1], [1.7, 0.46, 3.55], wood);
    for (const [x, z] of [[1.27, 3.13], [1.67, 3.13]]) W.cyl(x, z, 0.018, 0, 0.42, wood);
    for (const x of [1.27, 1.67]) W.cyl(x, 3.53, 0.02, 0, 0.98, wood);
    W.box([1.24, 0.9, 3.51], [1.7, 0.98, 3.56], wood);
    W.box([1.2, 0.22, 3.48], [1.74, 1.0, 3.62], M.cloth(0.2, 0.9, 6));
    W.box([1.16, 0.18, 3.28], [1.24, 0.8, 3.6], M.cloth(0.18, 0.9, 6));
    // Rug.
    W.rect(1, 0.004, -1.0, 0.55, 1.5, 3.3, M.rug(0.24, -1.0, 0.55, 1.5, 3.3));
    // The curtain, hung beside the window.
    W.rect(2, 4.58, 0.42, 0.98, 0.5, 3.0, (H) => { M.cloth(0.55, 1.6, 16, 0.05)(H); H.e = H.x < WX1 ? 0.2 : 0.05; H.noMoon = true; }, (u, v) => u < 0.62 - 0.2 * smooth(3.0, 0.6, v) || u > 0.95, { noShadow: true });
    return bakeWorld(W);
  },
  glsl: `
void scene(vec2 sp, vec4 b, vec4 a, float t, inout float C, inout float W) {
  // Clouds drifting across the dusk sky.
  if (a.b > 0.5) {
    float cl = fbm(vec2(sp.x * 0.006 + t * 0.018, sp.y * 0.024));
    C = mix(C, C * 0.62 + 0.03, smoothstep(0.52, 0.72, cl));
  }
  // Dust in the light.
  for (int i = 0; i < 26; i++) {
    float fi = float(i);
    vec2 m = vec2(620.0 + 300.0 * hash(vec2(fi, 4.0)) + sin(t * 0.13 + fi) * 18.0, 640.0 - mod(t * (3.0 + 4.0 * hash(vec2(fi, 5.0))) + 400.0 * hash(vec2(fi, 6.0)), 420.0));
    if (length(sp - m) < 1.5) C += 0.22;
  }
}`,
});

// Mobile: the same room, taller. The window high in the frame, the moonlight down the middle of the
// floor, the bed at the left edge; the lower part (under the text box) is quiet floor.
SCENES.push(mobile(SCENES.find((s) => s.id === "guest_room_dusk"), {
  cam: { pos: [0.1, 1.5, 1.05], yaw: -0.08, pitch: -0.12, f: 640, cx: 360, cy: 440 },
  // the dust, moved into the moonlight under this frame's window
  glsl: SCENES.find((s) => s.id === "guest_room_dusk").glsl.replace("620.0 + 300.0", "170.0 + 150.0").replace("640.0 - mod(", "560.0 - mod(").replace("hash(vec2(fi, 6.0)), 420.0)", "hash(vec2(fi, 6.0)), 320.0)"),
}));
