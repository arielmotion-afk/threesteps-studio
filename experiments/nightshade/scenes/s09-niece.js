// 9 · niece_room: the Niece's room, empty. The casement window wide open, the curtains hanging
// in it, moonlight pouring onto the rug; the bed made and untouched; the dressing-table mirror
// holding only the window. On the white sill: spilled soil and one purple fingerprint.
// Moves: clouds pass the moon and the light on the rug dims and returns.

SCENES.push({
  id: "niece_room",
  caption: "The window is open. On the white sill there's soil, and one dark purple fingerprint.",
  sway: 3,
  bake() {
    const W = makeWorld();
    W.cam = { pos: [0.05, 1.5, 0], yaw: 0, pitch: -0.06, f: 800, cx: 640, cy: 290 };
    W.amb = 0.085; W.far = 8;
    const l = Math.hypot(0.05, 0.5, 0.86);
    W.moon = { L: [0.05 / l, 0.5 / l, 0.86 / l], I: 2.2 };
    W.fills = [{ p: [0, 1.8, 4.9], I: 1.4, k: 0.24 }, { p: [1.0, 1.4, 4.6], I: 0.5, k: 0.4 }];
    W.backdrop = (dx, dy, dz) => {
      const a = dx / dz, e = dy / dz;
      const md = Math.hypot(a - 0.01, e - 0.2);
      if (md < 0.024) return { C: 1, sky: 1 };
      if (pines(a, e, 7, -0.16, 0.06, 0.16, 18, [-0.2, 0.2])) return { C: 0.07 + 0.05 * noise(a * 300, e * 300) };
      if (pines(a, e, 17, -0.18, 0.05, 0.1, 22, [-0.2, 0.2])) return { C: 0.14 };
      const cloud = smooth(0.55, 0.72, noise(a * 10, e * 30));
      return { C: 0.3 + 0.35 * Math.exp(-((md / 0.1) ** 2)) + 0.1 * Math.exp(-(((e + 0.1) / 0.08) ** 2)) - 0.1 * cloud, sky: 1 };
    };
    const paper = M.paper(0.24, SPRIG), wood = M.wood(0.16), BZ = 5.2, H0 = 3.0;
    const WX0 = -0.68, WX1 = 0.68, WY0 = 0.92, WY1 = 2.6, SILL = WY0;
    W.rect(2, BZ, -2.6, 2.6, 0, H0, paper, (u, v) => u > WX0 && u < WX1 && v > WY0 && v < WY1);
    W.rect(0, -2.6, -1, BZ, 0, H0, paper); W.rect(0, 2.6, -1, BZ, 0, H0, paper);
    W.rect(1, 0, -2.6, 2.6, -1, BZ, M.boards(0.22, 0.13, 0.06)); W.rect(1, H0, -2.6, 2.6, -1, BZ, 0.1);
    W.box([-2.6, 0, BZ - 0.04], [2.6, 0.16, BZ], 0.14);
    // Deep reveal, the white sill with soil and the fingerprint, the two casement leaves open into the room.
    W.rect(0, WX0, BZ, BZ + 0.3, WY0, WY1, 0.3); W.rect(0, WX1, BZ, BZ + 0.3, WY0, WY1, 0.3); W.rect(1, WY1, WX0, WX1, BZ, BZ + 0.3, 0.25);
    W.box([WX0 - 0.1, SILL - 0.06, BZ - 0.12], [WX1 + 0.1, SILL, BZ + 0.3], (H) => {
      H.al = 0.62;
      if (H.ny > 0.5) {
        const soil = Math.hypot(H.x - 0.12, H.z - (BZ + 0.05)) < 0.12 * (0.5 + noise(H.x * 40, H.z * 40)) || (hash(Math.floor(H.x * 120), Math.floor(H.z * 120)) > 0.94 && Math.abs(H.x - 0.12) < 0.25);
        if (soil) H.al = 0.07;
        if (Math.hypot((H.x - 0.3) / 1.4, H.z - (BZ - 0.02)) < 0.022) { H.al = 0.15; H.wb = 1; }
      }
    });
    const leaf = (x, s) => W.rect(0, x, BZ - 0.55, BZ - 0.02, WY0 + 0.02, WY1 - 0.02, M.wood(0.5), (u, v) => {
      const fu = (BZ - 0.02 - u) / 0.53, fv = (v - WY0) / (WY1 - WY0);
      if (fu < 0.08 || fu > 0.92 || fv < 0.05 || fv > 0.96) return false;
      for (const y of [1 / 3, 2 / 3]) if (Math.abs(fv - y) < 0.02) return false;
      return Math.abs(fu - 0.5) > 0.03;
    });
    leaf(WX0 + 0.03, -1); leaf(WX1 - 0.03, 1);
    // Curtains: sheer, hanging either side of the window.
    for (const [x0, x1] of [[WX0 - 0.55, WX0 + 0.05], [WX1 - 0.05, WX1 + 0.55]])
      W.rect(2, BZ - 0.15, x0, x1, 0.3, 2.85, (H) => { M.cloth(0.62, 1.5, 13, 0.06)(H); H.e = 0.12; H.noMoon = true; }, null, { noShadow: true });
    W.rod([WX0 - 0.65, 2.88, BZ - 0.15], [WX1 + 0.65, 2.88, BZ - 0.15], 0.02, 0.4);
    // The bed: made, smooth, untouched; iron head with brass knobs; the nightstand with flowers.
    W.group(() => {
      W.rect(1, 0.6, -2.5, -1.25, 2.0, 4.6, M.cloth(0.6, 0.25, 4, 0.9));
      W.rect(0, -1.25, 2.0, 4.6, 0.12, 0.6, M.cloth(0.52, 0.8, 10, 0.1), (u, v) => v < 0.16 + 0.025 * Math.sin(u * 14));
      W.rect(2, 2.0, -2.5, -1.25, 0.12, 0.6, M.cloth(0.5, 0.8, 10, 0.1), (u, v) => v < 0.16 + 0.025 * Math.sin(u * 14 + 2));
      W.box([-2.45, 0.2, 2.05], [-1.3, 0.59, 4.55], 0.06);
      W.box([-2.38, 0.6, 4.05], [-1.38, 0.76, 4.5], M.cloth(0.7, 0.5, 6, 0.8));
      for (const x of [-2.52, -1.23]) { W.cyl(x, 4.62, 0.028, 0, 1.25, 0.12); W.ball(x, 1.29, 4.62, 0.05, 0.45); W.cyl(x, 1.98, 0.025, 0, 0.82, 0.12); W.ball(x, 0.86, 1.98, 0.045, 0.45); }
      W.rect(2, 4.62, -2.52, -1.23, 0.6, 1.2, 0.12, (u, v) => { const fu = (u + 2.52) / 1.29; return v > 1.05 + 0.13 * Math.sin(fu * Math.PI) || (v < 1.0 + 0.1 * Math.sin(fu * Math.PI) && Math.abs(((fu * 9) % 1) - 0.5) < 0.42 && v > 0.66); });
    });
    W.box([-1.15, 0, 4.6], [-0.75, 0.62, 5.0], M.wood(0.2)); W.cyl(-0.95, 4.8, 0.05, 0.62, 0.8, 0.45);
    W.rect(2, 4.8, -1.2, -0.7, 0.75, 1.25, 0.32, (u, v) => FLOWERS((u + 1.2) / 0.5, 1 - (v - 0.75) / 0.5) < 0.4);
    // The dressing table with its mirror, the jewellery box, a stool.
    W.group(() => {
      W.box([1.2, 0.74, 4.5], [2.3, 0.78, 5.15], M.wood(0.26));
      for (const [x, z] of [[1.25, 4.55], [2.25, 4.55], [1.25, 5.1], [2.25, 5.1]]) W.cyl(x, z, 0.025, 0, 0.74, wood);
      W.box([1.2, 0.55, 4.5], [2.3, 0.74, 4.55], M.wood(0.2));
      W.box([1.35, 0.78, 5.08], [2.15, 1.95, 5.15], M.wood(0.24));
      W.rect(2, 5.075, 1.42, 2.08, 0.84, 1.88, (H) => { H.al = 0.03; H.refl = 0.85; }, (u, v) => v > 1.6 && Math.hypot(u - 1.75, v - 1.6) > 0.33);
      W.box([1.85, 0.78, 4.7], [2.1, 0.88, 4.88], M.wood(0.32)); W.box([1.42, 0.78, 4.68], [1.6, 0.8, 4.74], 0.4);
    });
    W.cyl(1.75, 4.05, 0.2, 0.38, 0.45, M.cloth(0.3, 0.5, 20)); for (const [x, z] of [[1.62, 3.92], [1.88, 3.92], [1.62, 4.18], [1.88, 4.18]]) W.cyl(x, z, 0.018, 0, 0.38, wood);
    W.box([-2.0, 1.5, BZ - 0.05], [-1.5, 2.05, BZ], M.wood(0.22)); W.rect(2, BZ - 0.051, -1.95, -1.55, 1.55, 2.0, (H) => { H.al = 0.15 + 0.2 * noise(H.x * 12, H.y * 12); });
    W.rect(1, 0.004, -1.0, 1.1, 1.6, 4.7, M.rug(0.22, -1.0, 1.1, 1.6, 4.7));
    return bakeWorld(W);
  },
  glsl: `
void scene(vec2 sp, vec4 b, vec4 a, float t, inout float C, inout float W) {
  float cloud = pow(0.5 + 0.5 * sin(t * 0.19 + 0.5), 8.0);
  C -= a.a * 0.6 * cloud;
  if (a.b > 0.5) C = mix(C, C * 0.7, smoothstep(0.55, 0.75, fbm(vec2(sp.x * 0.008 + t * 0.03, sp.y * 0.03))));
  // The fingerprint: dark purple.
  if (b.b > 0.5) { W = 0.3; C = 0.12; }
}`,
});
