// 5 · parlor_fork: the back hall, a choice of two ways. Stairs up on the left toward a thread of
// lamplight; the back door open onto the rainy garden on the right, a trail of muddy prints
// going out through it.
// Moves: rain, the lamplight, moonlight shimmering on the wet tiles.

// Bella sitting, facing the camera, at (x, z). Not in any scene for now.
function sittingCat(W, x, z, s = 1, y0 = 0) {
  const fur = 0.035;
  W.group(() => {
    W.ball(x, 0.11 * s, z, 0.12 * s, fur);
    W.ball(x, 0.2 * s, z - 0.02 * s, 0.09 * s, fur);
    W.ball(x, 0.33 * s, z - 0.04 * s, 0.075 * s, fur);
    for (const e of [-1, 1]) {
      W.rod([x + e * 0.04 * s, 0.38 * s, z - 0.04 * s], [x + e * 0.055 * s, 0.44 * s, z - 0.03 * s], 0.018 * s, fur);
      W.ball(x + e * 0.028 * s, 0.34 * s, z - 0.108 * s, 0.012 * s, (H) => { H.al = 0.1; H.wb = 1; });
      W.rod([x + e * 0.05 * s, 0.01, z - 0.1 * s], [x + e * 0.045 * s, 0.17 * s, z - 0.08 * s], 0.02 * s, fur);
    }
    W.ball(x, 0.255 * s, z - 0.105 * s, 0.012 * s, (H) => { H.al = 0.5; H.wb = 0.6; });
    W.rod([x + 0.1 * s, 0.03, z + 0.05 * s], [x + 0.24 * s, 0.02, z - 0.08 * s], 0.022 * s, fur);
  });
  if (y0) liftGroup(W.prims[W.prims.length - 1], y0);
}
// Move a group (and its bounds) up by dy.
function liftGroup(g, dy) {
  g.a = [g.a[0], g.a[1] + dy, g.a[2]]; g.b = [g.b[0], g.b[1] + dy, g.b[2]];
  for (const p of g.kids) {
    if (p.t === 3) p.y += dy;
    else if (p.t === 2) { p.y0 += dy; p.y1 += dy; }
    else if (p.t === 4) { p.a = [p.a[0], p.a[1] + dy, p.a[2]]; p.b = [p.b[0], p.b[1] + dy, p.b[2]]; }
    else if (p.t === 0) { p.a = [p.a[0], p.a[1] + dy, p.a[2]]; p.b = [p.b[0], p.b[1] + dy, p.b[2]]; }
  }
}

SCENES.push({
  id: "parlor_fork",
  caption: "Two ways: the stairs up to the guest rooms, or the mud out to the garden.",
  sway: 3,
  lift: 0.26,
  bake() {
    const W = makeWorld();
    W.cam = { pos: [0.25, 1.45, -0.6], yaw: 0, pitch: -0.04, f: 760, cx: 640, cy: 300 };
    W.amb = 0.14; W.far = 10;
    const l = Math.hypot(-0.15, 0.4, 0.9);
    W.moon = { L: [-0.15 / l, 0.4 / l, 0.9 / l], I: 2.1 };
    W.fills = [{ p: [1.05, 1.2, 4.3], I: 1.0, k: 0.35 }];
    W.warm = { p: [-1.4, 3.1, 4.4], I: 1.6, k: 1.6 };
    // Outside the door: the rainy garden at night.
    W.backdrop = (dx, dy, dz) => {
      const a = dx / dz, e = dy / dz;
      if (Math.hypot(a - 0.42, e - 0.26) < 0.022) return { C: 1, sky: 1 };
      if (e < -0.12) { const path = Math.abs(a - 0.24 - (e + 0.3) * 0.6) < 0.05 + (-e - 0.12) * 0.25; return { C: path ? 0.36 + 0.1 * noise(a * 300, e * 300) : 0.12 + 0.1 * noise(a * 90, e * 120), sky: 1 }; }
      const bush = noise(a * 30, e * 28) * 0.6 + noise(a * 90, e * 80) * 0.4;
      if (bush > 0.36 + 0.5 * smooth(-0.1, 0.25, e)) return { C: 0.1 + 0.28 * smooth(0.55, 0.8, bush), sky: 1 };
      return { C: 0.32 + 0.3 * Math.exp(-((Math.hypot(a - 0.42, e - 0.26) / 0.12) ** 2)), sky: 1 };
    };
    const paper = M.paper(0.24, SPRIG), wood = M.wood(0.14), dark = M.wood(0.08), pale = M.wood(0.3);
    const BZ = 4.5, DX0 = 0.62, DX1 = 1.48, DT = 2.25, H0 = 4.8;
    const panels = (al) => (H) => { const [s2, t] = planar(H); const fs = ((s2 / 0.5) % 1 + 1) % 1, ft = t / 0.9; H.al = (fs < 0.08 || fs > 0.92 || ft < 0.1 || ft > 0.9 ? 1.4 : 1) * al * (0.85 + 0.3 * noise(s2 * 20, t * 2)); };
    // Hall: walls with wainscoting, checker floor (wet, glossy), ceiling with the stairwell opening.
    W.rect(2, BZ, -2.4, 2.4, 0, H0, paper, (u, v) => u > DX0 && u < DX1 && v < DT);
    W.rect(0, 2.4, -1, BZ, 0, H0, paper);
    W.rect(0, -2.4, -1, BZ + 1, 0, 6, paper);
    W.box([-2.4, 0, BZ - 0.03], [2.4, 1.0, BZ], panels(0.16)); W.box([2.37, 0, -1], [2.4, 1.0, BZ], panels(0.16));
    W.rect(1, 0, -2.4, 2.4, -1, BZ, (H) => { M.tiles(0.36, 0.1, 0.32, 0.3)(H); });
    W.rect(1, H0, -2.4, 2.4, -1, BZ, 0.1);
    // The back door, open; the step and threshold; the door leaf swung in.
    W.box([DX0 - 0.1, 0, BZ - 0.06], [DX0, DT + 0.1, BZ + 0.12], wood); W.box([DX1, 0, BZ - 0.06], [DX1 + 0.1, DT + 0.1, BZ + 0.12], wood); W.box([DX0 - 0.1, DT, BZ - 0.06], [DX1 + 0.1, DT + 0.12, BZ + 0.12], wood);
    W.box([DX0, -0.02, BZ - 0.02], [DX1, 0.02, BZ + 0.15], 0.4);
    W.box([DX1 + 0.02, 0, BZ - 0.85], [DX1 + 0.07, DT - 0.02, BZ - 0.02], (H) => { pale(H); const pz = (BZ - 0.02 - H.z) / 0.83, py = H.y / DT; if (py > 0.55 && py < 0.95 && pz > 0.15 && pz < 0.85) { const gx = (pz - 0.15) / 0.7 * 3 % 1, gy = (py - 0.55) / 0.4 * 3 % 1; H.al = gx < 0.1 || gy < 0.1 ? 0.35 : 0.12; } });
    W.ball(DX1 + 0.01, 1.0, BZ - 0.75, 0.03, 0.8);
    // The stairs up on the left: solid steps with a panelled side, banister, big newel post.
    const N = 13, R = 0.2, D = 0.27, SZ0 = 0.6, SX0 = -2.1, SX1 = -0.75;
    W.group(() => {
      for (let k = 0; k < N; k++) {
        const y = (k + 1) * R, z = SZ0 + k * D;
        W.box([SX0, 0, z], [SX1, y, BZ], (H) => { if (H.nx > 0.5) panels(0.14)(H); else if (H.ny > 0.5) pale(H); else M.wood(0.2)(H); });
        W.box([SX0, y - 0.02, z - 0.025], [SX1 + 0.02, y + 0.005, z + 0.02], M.wood(0.4));
      }
    });
    W.rect(1, N * R, SX0, SX1, SZ0 + N * D, BZ, pale);
    W.group(() => {
      const railY = (z) => 0.95 + ((z - SZ0) / D) * R;
      W.rod([SX1, 1.25, SZ0 - 0.25], [SX1, railY(SZ0 + N * D), SZ0 + N * D], 0.035, M.wood(0.3));
      for (let k = 0; k < N; k++) for (const dz of [0.07, 0.19]) { const z = SZ0 + k * D + dz, y = (k + 1) * R; W.cyl(SX1, z, 0.016, y, railY(z) - 0.02, wood); }
      W.box([SX1 - 0.09, 0, SZ0 - 0.34], [SX1 + 0.09, 1.2, SZ0 - 0.16], M.wood(0.24));
      W.cyl(SX1, SZ0 - 0.25, 0.1, 1.2, 1.3, M.wood(0.28)); W.ball(SX1, 1.38, SZ0 - 0.25, 0.09, M.wood(0.3));
    });
    // Up the stairs: the landing door with a thread of lamplight.
    W.rect(2, BZ - 0.002, -1.75, -1.1, N * R, N * R + 2.05, (H) => { M.wood(0.14)(H); }, (u, v) => u > -1.47 && u < -1.42);
    W.rect(2, BZ + 0.1, -1.8, -1.0, N * R, N * R + 2.1, (H) => { H.al = 0.3; H.e = 0.12; H.wb = 0.3; });
    // Coats on hooks and the boot rack on the right wall.
    for (let k = 0; k < 4; k++) {
      const z = 1.4 + k * 0.42;
      W.rod([2.4, 2.0, z], [2.28, 2.02, z], 0.012, 0.5);
      W.box([2.12, 0.95 + hash(k, 1) * 0.2, z - 0.18], [2.36, 2.02, z + 0.18], M.cloth(0.16 + hash(k, 2) * 0.1, 1.4, 12, 0.06));
    }
    W.box([1.95, 0.35, 1.2], [2.4, 0.4, 3.2], M.wood(0.22));
    for (const z of [1.25, 3.15]) W.box([1.95, 0, z - 0.04], [2.4, 0.35, z + 0.04], wood);
    for (let k = 0; k < 4; k++) { const z = 1.45 + k * 0.45; W.box([2.15, 0.4, z - 0.06], [2.27, 0.78, z + 0.06], 0.12); W.box([2.0, 0.4, z - 0.06], [2.17, 0.52, z + 0.06], 0.12); }
    // A small picture and a dark sconce on the back wall.
    W.box([-0.45, 1.4, BZ - 0.05], [0.0, 1.9, BZ], M.wood(0.24)); W.rect(2, BZ - 0.051, -0.4, -0.05, 1.45, 1.85, (H) => { H.al = 0.14 + 0.2 * noise(H.x * 12, H.y * 12); });
    W.rod([0.25, 2.0, BZ], [0.25, 2.05, BZ - 0.15], 0.015, 0.3); W.cyl(0.25, BZ - 0.17, 0.05, 1.85, 2.05, 0.3);
    // Muddy boot prints crossing the hall and going out of the door.
    const prints = [];
    for (let k = 0; k < 8; k++) { const t = k / 7, x = lerp(0.2, 1.1, t) + (k % 2 ? 0.12 : -0.12), z = lerp(0.9, 4.4, t); prints.push([x, z]); }
    W.rect(1, 0.003, -1, 2.0, 0.4, 4.6, (H) => { H.al = 0.05 + 0.08 * hash(Math.floor(H.x * 90), Math.floor(H.z * 90)); H.refl = 0.05; }, (u, v) => !prints.some(([x, z]) => { const dz = (v - z) / 0.15, dx = (u - x) / 0.055; return dx * dx + (dz - 0.25) ** 2 * 1.2 < 0.55 || (dx * dx + ((dz + 0.6) * 1.6) ** 2 < 0.35); }));
    return bakeWorld(W);
  },
  glsl: `
void scene(vec2 sp, vec4 b, vec4 a, float t, inout float C, inout float W) {
  // Rain outside.
  if (a.b > 0.5) {
    vec2 r = vec2(floor((sp.x + sp.y * 0.12) / 3.0), 0.0);
    float sp0 = hash(r) * 720.0, speed = 520.0 + 300.0 * hash(r + 3.1);
    float y = mod(sp.y - t * speed + sp0, 90.0 + 160.0 * hash(r + 7.0));
    if (hash(r + 11.0) > 0.55 && y < 9.0) C += 0.18;
  }
  // Moonlight trembling on the wet tiles.
  C += a.a * 0.08 * (noise(vec2(sp.x * 0.05, sp.y * 0.08 + t * 1.5)) - 0.5);
  // Lamplight from upstairs.
  float flick = 0.85 + 0.15 * noise(vec2(t * 3.0, 4.0));
  W = b.g * 2.0 * flick;
  // The thread of lamplight from the door upstairs.
  if (b.b > 0.2) W += 0.5 * flick;
}`,
});

// Mobile: the hall: the stairs up on the left, the garden door ahead, the tiles below.
SCENES.push(mobile(SCENES.find((s) => s.id === "parlor_fork"), {
  cam: { pos: [0.25, 1.45, -0.6], yaw: 0, pitch: -0.06, f: 560, cx: 360, cy: 500 },
}));
