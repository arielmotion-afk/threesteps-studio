// 2 · stairs_dark: from the top of the stairs, looking down into the hall. Moonlight from the
// tall window on the stairwell wall falls through the balusters and stripes the steps; at the
// bottom, lamplight under the reading room door.
// Moves: the lamplight, the tree shadows outside the window swaying across the steps.

const STAIRS = { N: 14, R: 0.2, D: 0.3, Z0: 0.4, X0: -0.85, X1: 1.0 };
const LANDSCAPE = tex2d(90, 60, (g) => {
  g.fillRect(0, 40, 90, 20);
  for (let k = 0; k < 9; k++) { const x = 8 + k * 10 + hash(k, 3) * 6, h = 14 + hash(k, 4) * 20; g.beginPath(); g.moveTo(x, 44 - h); g.lineTo(x - 6, 44); g.lineTo(x + 6, 44); g.fill(); }
  g.beginPath(); g.ellipse(64, 50, 22, 4, 0, 0, TAU); g.fill();
});

function stairsWorld() {
  const { N, R, D, Z0, X0, X1 } = STAIRS, BOT = -N * R, ZB = Z0 + N * D;
  const W = makeWorld();
  W.cam = { pos: [0.35, 1.62, -0.5], yaw: -0.27, pitch: -0.42, f: 720, cx: 640, cy: 250 };
  W.amb = 0.15; W.far = 11;
  const l = Math.hypot(-0.42, 0.3, 0.8);
  W.moon = { L: [-0.42 / l, 0.3 / l, 0.8 / l], I: 1.9 };
  W.fills = [{ p: [-1.45, 0.4, 5.3], I: 0.9, k: 0.3 }];
  W.warm = { p: [0.45, BOT + 0.05, 7.88], I: 1.4, k: 3.5 };
  W.backdrop = (dx, dy, dz) => {
    const az = dx / dz, e = dy / dz;
    const md = Math.hypot(az + 0.33, e + 0.0);
    const tree = noise(az * 22, e * 16) * 0.6 + noise(az * 60, e * 50) * 0.4 > 0.5 - 0.6 * smooth(-0.05, -0.3, e) && md > 0.05;
    return { C: md < 0.022 ? 1 : tree ? 0.09 + 0.05 * noise(az * 90, e * 90) : 0.4 + 0.3 * Math.exp(-((md / 0.09) ** 2)), sky: tree || md < 0.022 ? 0 : 1 };
  };
  const paper = M.paper(0.28, SPRIG), wood = M.wood(0.16), dark = M.wood(0.1), pale = M.wood(0.32);
  // Landing, steps (solid, with nosings and a runner), hall floor.
  W.box([X0, -0.3, -2], [X1, 0, Z0], M.boards(0.3, 0.14, 0.05));
  const runner = (H) => { const drop = H.ny > 0.5 && ((H.z - Z0) / D) % 1 < 0.14; runner0(H); if (drop) H.al *= 0.35; };
  const runner0 = (H) => { const c = Math.abs(H.x - 0.1) < 0.55; if (c) { H.al = 0.34 * (0.8 + 0.4 * hash(Math.floor(H.x * 30), Math.floor((H.y + H.z) * 30))) * (Math.abs(Math.abs(H.x - 0.1) - 0.48) < 0.03 ? 1.6 : 1); } else pale(H); };
  W.group(() => { for (let k = 0; k < N; k++) {
    const y = -(k + 1) * R, z = Z0 + k * D;
    W.box([X0, BOT - 0.1, z], [X1, y, z + D], runner);
    W.box([X0, y - 0.03, z + D - 0.035], [X1, y + 0.004, z + D + 0.01], M.wood(0.62));
    W.rod([-0.45, y + 0.012, z + 0.01], [0.65, y + 0.012, z + 0.01], 0.008, 0.6);
  } });
  W.rect(1, BOT, -2.4, X1, -2, 8.4, M.boards(0.24, 0.14, 0.18));
  W.rect(1, BOT + 0.003, -0.05, 0.95, ZB, 7.98, M.rug(0.2, -0.05, 0.95, ZB, 7.98));
  // Walls: the stairwell's end wall with its tall arched window, the side walls, the back wall with the door.
  const SZ = 5.5, WX0 = -2.0, WX1 = -0.95, WY0 = -0.7, WY1 = 1.3, WR = (WX1 - WX0) / 2, WC = (WX0 + WX1) / 2;
  const inWin = (u, v) => u > WX0 && u < WX1 && v > WY0 && (v < WY1 || (u - WC) ** 2 + (v - WY1) ** 2 < WR * WR);
  W.rect(0, -2.4, -2, SZ, BOT, 4, paper);
  W.rect(2, SZ, -2.4, X0, BOT, 4, paper, inWin);
  W.rect(2, SZ + 0.16, WX0, WX1, WY0, WY1 + WR, 0.3, (u, v) => {
    if (!inWin(u, v)) return true;
    if (Math.abs(u - WC) < 0.02) return false;
    for (const y of [-0.05, 0.6]) if (Math.abs(v - y) < 0.018) return false;
    if (v > WY1 && Math.abs(Math.hypot(u - WC, v - WY1) - WR * 0.55) < 0.018) return false;
    return u > WX0 + 0.05 && u < WX1 - 0.05 && v > WY0 + 0.05;
  });
  W.rect(0, WX0, SZ, SZ + 0.16, WY0, WY1 + WR, 0.25); W.rect(0, WX1, SZ, SZ + 0.16, WY0, WY1 + WR, 0.25);
  W.box([WX0 - 0.08, WY0 - 0.06, SZ - 0.1], [WX1 + 0.08, WY0, SZ + 0.16], M.wood(0.4));
  W.rect(0, X0, SZ, 8.4, BOT, 4, paper);
  W.rect(0, X1, -2, 8.4, BOT, 4, paper);
  W.rect(1, 4, -2.4, X1, -2, 8.4, 0.02, null, { noShadow: true }); // ceiling (only seen in the tall mobile frame; casts no shadow)
  W.box([X1 - 0.03, BOT, -2], [X1, BOT + 0.9, 8.4], dark);
  const DX0 = 0.15, DX1 = 0.95, DTOP = BOT + 2.15;
  W.rect(2, 8.0, X0, X1, BOT, 4, paper, (u, v) => u > DX0 && u < DX1 && v < DTOP);
  W.rect(2, 8.06, DX0, DX1, BOT + 0.025, DTOP, (H) => { dark(H); const pu = (H.x - DX0) / (DX1 - DX0), pv = (H.y - BOT) / 2.15; if (Math.abs(pu - 0.5) > 0.38 || pv < 0.06 || Math.abs(pv - 0.5) < 0.04 || pv > 0.95) H.al *= 1.6; });
  W.rect(2, 8.2, DX0 - 0.1, DX1 + 0.1, BOT - 0.1, BOT + 0.03, (H) => { H.al = 0; H.wb = 1; H.e = 0.1; });
  W.box([DX0 - 0.12, BOT, 7.96], [DX0, DTOP + 0.12, 8.02], wood); W.box([DX1, BOT, 7.96], [DX1 + 0.12, DTOP + 0.12, 8.02], wood); W.box([DX0 - 0.12, DTOP, 7.96], [DX1 + 0.12, DTOP + 0.14, 8.02], wood);
  W.ball(DX1 - 0.1, BOT + 1.0, 8.0, 0.03, 0.7);
  // The grandfather clock.
  W.box([-0.52, BOT, 7.62], [-0.12, BOT + 2.1, 7.98], M.wood(0.14));
  W.box([-0.56, BOT + 1.55, 7.58], [-0.08, BOT + 2.2, 7.98], M.wood(0.16));
  
  W.rect(2, 7.575, -0.48, -0.16, BOT + 1.72, BOT + 2.02, (H) => { H.al = Math.hypot(H.x + 0.32, H.y - BOT - 1.87) < 0.13 ? 0.6 : 0.12; });
  // Paintings: a big landscape on the stairwell wall, small frames on the right wall.
  W.box([-2.4, -0.9, 3.0], [-2.34, 0.6, 5.1], M.wood(0.22));
  W.rect(0, -2.335, 3.1, 5.0, -0.8, 0.5, (H) => { const u = (H.z - 3.1) / 1.9, v = 1 - (H.y + 0.8) / 1.3; H.al = LANDSCAPE(u * 0.999, v * 0.999) > 0.4 ? 0.06 : 0.3 + 0.2 * (1 - v); });
  for (const [z, y] of [[2.0, 0.2], [3.4, -0.4], [5.0, -1.2]]) {
    W.box([X1 - 0.05, y, z], [X1, y + 0.5, z + 0.4], M.wood(0.24));
    W.rect(0, X1 - 0.052, z + 0.05, z + 0.35, y + 0.05, y + 0.45, (H) => { H.al = 0.18 + 0.2 * noise(H.z * 20, H.y * 20); });
  }
  // The banister: a handrail falling with the stairs, turned balusters, newel posts.
  W.group(() => {
  const railY = (z) => 0.9 - ((z - Z0) * R) / D;
  W.rod([X0, 0.95, -0.4], [X0, railY(ZB), ZB], 0.04, pale);
  for (let k = -1; k < N; k++) {
    const y = k < 0 ? 0 : -(k + 1) * R, z0 = k < 0 ? -0.3 : Z0 + k * D;
    for (const dz of [0.08, 0.22]) {
      const z = z0 + dz, top = railY(Math.max(Z0, z)) - 0.02;
      W.cyl(X0, z, 0.018, y, top, wood); W.ball(X0, y + (top - y) * 0.3, z, 0.034, wood);
    }
  }
  W.box([X0 - 0.07, BOT, ZB - 0.07], [X0 + 0.07, BOT + 1.15, ZB + 0.07], wood); W.ball(X0, BOT + 1.22, ZB, 0.08, pale);
  });
  // The chandelier hanging in the stairwell.
  const CH = [-1.4, 1.5, 4.2];
  W.group(() => {
  W.rod([CH[0], 4, CH[2]], [CH[0], CH[1] + 0.3, CH[2]], 0.01, 0.4);
  W.ball(CH[0], CH[1], CH[2], 0.12, 0.35);
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * TAU, ax = CH[0] + Math.cos(a) * 0.38, az = CH[2] + Math.sin(a) * 0.38;
    W.rod([CH[0], CH[1], CH[2]], [ax, CH[1] + 0.08, az], 0.012, 0.4);
    W.cyl(ax, az, 0.015, CH[1] + 0.08, CH[1] + 0.22, 0.7);
    W.ball(ax, CH[1] - 0.06, az, 0.022, 0.9);
  }
  });
  return W;
}

SCENES.push({
  id: "stairs_dark",
  caption: "Something small brushes past your ankles, running up the stairs. A bell on a collar: Bella.",
  sway: 3,
  lift: 0.26,
  bake() { return bakeWorld(stairsWorld()); },
  glsl: `
void scene(vec2 sp, vec4 b, vec4 a, float t, inout float C, inout float W) {
  // Branches outside the window, swaying, cut the moonlight on the steps.
  float br = smoothstep(0.55, 0.62, noise(vec2(sp.x * 0.01 + sin(t * 0.5) * 0.25, sp.y * 0.016 + sin(t * 0.37) * 0.12)));
  C -= a.a * 0.55 * br;
  // Lamplight under the door, flickering.
  float flick = 0.8 + 0.2 * noise(vec2(t * 5.0, 2.0)) + 0.04 * sin(t * 19.0);
  W = b.g * 2.0 * flick + b.b * 1.3 * flick;
}`,
});

// Mobile: straight down the stairs: the window and the lamp at the bottom, the moonlight on the treads.
SCENES.push(mobile(SCENES.find((s) => s.id === "stairs_dark"), {
  cam: { pos: [0.3, 1.7, -0.2], yaw: -0.1, pitch: -0.3, f: 560, cx: 360, cy: 520 },
}));
