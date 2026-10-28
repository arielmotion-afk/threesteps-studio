// 4 · parlor_evening: the empty parlor late at night. The dying fire on the left is the only
// warm light; the armchair with the uncapped pen on its arm; the kitchen doorway at the back
// with steam drifting out; the tall window on the right with moonlight and the muddy boots.
// Moves: the fire (flames, flicker on everything it lights), the steam.

const FLOWERS = tex2d(50, 60, (g) => {
  g.lineWidth = 1.2;
  for (let k = 0; k < 9; k++) { const a = -1.2 + k * 0.3, l = 26 + hash(k, 1) * 18, x = 25 + Math.cos(a - Math.PI / 2) * l * 0.6, y = 58 - l; g.beginPath(); g.moveTo(25, 58); g.quadraticCurveTo(25 + (x - 25) * 0.3, 40, x, y); g.stroke(); g.beginPath(); g.arc(x, y, 3 + hash(k, 2) * 2, 0, TAU); g.fill(); }
});

// A wingback armchair facing the camera, at (x, z), seat front toward -z.
function armchair(W, x, z, mat, legs) {
  W.group(() => {
    W.box([x - 0.42, 0.22, z], [x + 0.42, 0.46, z + 0.7], mat);
    W.box([x - 0.42, 0.22, z + 0.62], [x + 0.42, 1.18, z + 0.82], mat);
    W.rod([x - 0.36, 1.12, z + 0.72], [x + 0.36, 1.12, z + 0.72], 0.08, mat);
    for (const s of [-1, 1]) {
      W.box([x + s * 0.42 - 0.07, 0.22, z + 0.05], [x + s * 0.42 + 0.07, 0.62, z + 0.75], mat);
      W.rod([x + s * 0.44, 0.64, z], [x + s * 0.44, 0.64, z + 0.72], 0.085, mat);
      W.box([x + s * 0.42 - 0.06, 0.62, z + 0.42], [x + s * 0.42 + 0.06, 1.1, z + 0.8], mat);
      for (const dz of [0.06, 0.74]) W.cyl(x + s * 0.38, z + dz, 0.03, 0, 0.22, legs);
    }
    W.box([x - 0.36, 0.46, z + 0.02], [x + 0.36, 0.55, z + 0.62], mat);
  });
}

const PARLOR_CAM = { pos: [0.35, 1.5, -0.2], yaw: -0.13, pitch: -0.02, f: 820, cx: 640, cy: 320 };
const PARLOR_PTS = { fire: project(PARLOR_CAM, [-2.4, 0.12, 3.7]), kettle: project(PARLOR_CAM, [0.05, 1.16, 9.0]) };
SCENES.push({
  id: "parlor_evening",
  caption: "In the armchair, the Rival. He's still holding his fountain pen.",
  sway: 3,
  lift: 0.26,
  uniforms: { uFire: "vec3", uKettle: "vec3" },
  bake() {
    const W = makeWorld();
    W.cam = PARLOR_CAM;
    W.amb = 0.14; W.far = 10;
    const l = Math.hypot(0.62, 0.62, 0.2);
    W.moon = { L: [0.62 / l, 0.62 / l, 0.2 / l], I: 1.9 };
    W.fills = [{ p: [2.4, 1.6, 4.9], I: 0.7, k: 0.3 }, { p: [0.0, 1.4, 8.4], I: 0.5, k: 0.3 }];
    W.warm = { p: [-2.38, 0.28, 3.7], I: 2.2, k: 0.5 };
    W.backdrop = (dx, dy, dz) => {
      const e = dy / Math.hypot(dx, dz), az = dz / dx;
      const tree = noise(az * 12, e * 12) > 0.45 - 0.4 * smooth(0.1, -0.2, e);
      return { C: tree ? 0.1 : 0.4 + 0.12 * e, sky: tree ? 0 : 1 };
    };
    const paper = M.paper(0.24, SPRIG), wood = M.wood(0.14), dark = M.wood(0.08), soot = 0.04;
    const BZ = 7, DX0 = -0.42, DX1 = 0.5, DT = 2.35;
    const WZ0 = 4.4, WZ1 = 5.3, WY0 = 0.45, WY1 = 2.95;
    // Room.
    W.rect(2, BZ, -2.6, 2.6, 0, 3.4, paper, (u, v) => u > DX0 && u < DX1 && v < DT);
    W.rect(0, -2.6, -1, BZ, 0, 3.4, paper);
    W.rect(0, 2.6, -1, BZ, 0, 3.4, paper, (u, v) => u > WZ0 && u < WZ1 && v > WY0 && v < WY1);
    W.rect(1, 0, -2.6, 2.6, -1, BZ, M.boards(0.24, 0.13, 0.14));
    W.rect(1, 3.4, -2.6, 2.6, -1, BZ, 0.1);
    W.box([-2.6, 0, BZ - 0.04], [2.6, 0.18, BZ], 0.14);
    W.box([-2.6, 0.9, BZ - 0.03], [2.6, 0.95, BZ], 0.2);
    // Doorway into the kitchen, and the kitchen beyond it.
    W.box([DX0 - 0.1, 0, BZ - 0.05], [DX0, DT + 0.1, BZ + 0.1], wood); W.box([DX1, 0, BZ - 0.05], [DX1 + 0.1, DT + 0.1, BZ + 0.1], wood); W.box([DX0 - 0.1, DT, BZ - 0.05], [DX1 + 0.1, DT + 0.12, BZ + 0.1], wood);
    W.rect(1, 0, -1.5, 1.5, BZ, 9.6, M.tiles(0.2, 0.14, 0.3, 0.1));
    W.rect(2, 9.6, -1.5, 1.5, 0, 3, 0.18); W.rect(0, -1.5, BZ, 9.6, 0, 3, 0.16); W.rect(0, 1.5, BZ, 9.6, 0, 3, 0.16);
    W.box([-1.5, 0, 8.9], [1.5, 0.9, 9.6], M.wood(0.2)); W.box([-1.5, 0.9, 8.85], [1.5, 0.95, 9.6], 0.3);
    W.box([-1.2, 1.4, 9.3], [1.2, 2.4, 9.6], M.books(0.3, 0.32));
    W.ball(0.05, 1.03, 9.15, 0.11, 0.4); W.rod([0.05, 1.12, 9.15], [-0.08, 1.16, 9.05], 0.02, 0.4);
    // The fireplace on the left wall: surround, mantel, hearth, logs; things on the mantel.
    const FZ0 = 3.2, FZ1 = 4.2, FY = 0.85, marble = M.wood(0.3, 0.3);
    W.box([-2.6, 0, FZ0 - 0.38], [-2.26, 1.22, FZ0], marble); W.box([-2.6, 0, FZ1], [-2.26, 1.22, FZ1 + 0.38], marble);
    W.box([-2.6, FY, FZ0], [-2.26, 1.22, FZ1], marble);
    W.box([-2.6, 1.22, FZ0 - 0.5], [-2.16, 1.3, FZ1 + 0.5], M.wood(0.36));
    W.box([-2.6, 0, FZ0 - 0.5], [-1.95, 0.05, FZ1 + 0.5], 0.3);
    W.box([-2.6, 0, FZ0], [-2.5, FY, FZ1], soot);
    W.rect(2, FZ0 + 0.001, -2.6, -2.26, 0, FY, soot); W.rect(2, FZ1 - 0.001, -2.6, -2.26, 0, FY, soot);
    for (const [y, a, b] of [[0.1, 3.4, 4.0], [0.16, 3.45, 3.9]]) W.rod([-2.42, y, a], [-2.36, y, b], 0.05, 0.12);
    W.box([-2.5, 1.3, 3.52], [-2.3, 1.52, 3.88], M.wood(0.3)); W.ball(-2.4, 1.55, 3.7, 0.1, M.wood(0.32)); W.cyl(-2.29, 3.7, 0.06, 1.38, 1.46, 0.6);
    for (const z of [FZ0 - 0.3, FZ1 + 0.3]) { W.cyl(-2.4, z, 0.04, 1.3, 1.5, 0.5); W.cyl(-2.4, z, 0.016, 1.5, 1.66, 0.85); }
    W.box([-2.6, 1.7, 3.1], [-2.56, 2.55, 4.3], M.wood(0.24)); W.rect(0, -2.555, 3.2, 4.2, 1.8, 2.45, (H) => { H.al = 0.16 + 0.16 * noise(H.z * 8, H.y * 8); });
    // Things along the walls: a side table with flowers by the fireplace, paintings, a console.
    W.cyl(-2.1, 5.4, 0.24, 0.7, 0.74, M.wood(0.24)); W.cyl(-2.1, 5.4, 0.04, 0, 0.7, wood);
    W.cyl(-2.1, 5.4, 0.06, 0.74, 0.95, 0.4);
    W.rect(2, 5.4, -2.35, -1.85, 0.9, 1.5, 0.3, (u, v) => FLOWERS((u + 2.35) / 0.5, 1 - (v - 0.9) / 0.6) < 0.4);
    for (const [x0, x1, y0, y1] of [[-1.7, -0.95, 1.4, 2.0], [1.05, 1.6, 1.35, 1.95], [-0.9, -0.6, 1.6, 1.9]]) {
      W.box([x0, y0, BZ - 0.06], [x1, y1, BZ], M.wood(0.24));
      W.rect(2, BZ - 0.061, x0 + 0.05, x1 - 0.05, y0 + 0.05, y1 - 0.05, (H) => { H.al = 0.1 + 0.18 * (H.y > (y0 + y1) / 2 ? 1 : 0.5) * noise(H.x * 9, H.y * 9); });
    }
    W.box([0.9, 0.7, BZ - 0.42], [1.7, 0.75, BZ - 0.05], M.wood(0.22)); W.box([0.95, 0, BZ - 0.4], [1.65, 0.7, BZ - 0.07], M.wood(0.12));
    // The armchair, with the fountain pen on its arm.
    armchair(W, -0.55, 3.3, M.cloth(0.28, 0.8, 9), dark);
    W.rod([-0.11, 0.735, 3.22], [-0.1, 0.735, 3.38], 0.008, 0.06); W.ball(-0.11, 0.735, 3.21, 0.008, 0.9);
    // The tall window on the right wall, with curtains and the boots below.
    W.rect(0, 2.75, WZ0, WZ1, WY0, WY1, 0.25, (u, v) => {
      const fu = (u - WZ0) / (WZ1 - WZ0), fv = (v - WY0) / (WY1 - WY0);
      if (fu < 0.05 || fu > 0.95 || fv < 0.03 || fv > 0.97 || Math.abs(fu - 0.5) < 0.025) return false;
      for (const y of [0.25, 0.5, 0.75]) if (Math.abs(fv - y) < 0.012) return false;
      return true;
    });
    W.rect(2, WZ0, 2.6, 2.75, WY0, WY1, 0.2); W.rect(2, WZ1, 2.6, 2.75, WY0, WY1, 0.2); W.rect(1, WY0, 2.6, 2.75, WZ0, WZ1, 0.3);
    for (const [z0, z1] of [[WZ0 - 0.35, WZ0 + 0.12], [WZ1 - 0.12, WZ1 + 0.35]])
      W.rect(0, 2.5, z0, z1, 0, 3.2, (H) => { M.cloth(0.4, 1.6, 14, 0.05)(H); H.noMoon = true; }, null, { noShadow: true });
    W.rod([2.5, 3.2, WZ0 - 0.5], [2.5, 3.2, WZ1 + 0.5], 0.02, 0.4);
    for (const dz of [0, 0.2]) {
      const bx = 2.1, bz = 5.6 + dz, mud = (H) => { H.al = 0.13 * (0.7 + 0.6 * noise(H.y * 40, H.z * 40 + H.x * 40)); if (H.y < 0.1 && hash(Math.floor(H.z * 80), Math.floor(H.y * 80)) > 0.6) H.al = 0.32; };
      W.box([bx - 0.05, 0, bz - 0.06], [bx + 0.06, 0.4, bz + 0.06], mud);
      W.box([bx - 0.22, 0, bz - 0.06], [bx - 0.04, 0.12, bz + 0.06], mud);
    }
    // The open door on the right, and a small table with a decanter in the corner.
    W.box([1.95, 0, 0.5], [2.0, 2.25, 1.4], (H) => { dark(H); const pz = (H.z - 0.5) / 0.9, py = H.y / 2.25; if (Math.abs(pz - 0.5) < 0.35 && (Math.abs(py - 0.3) < 0.17 || Math.abs(py - 0.72) < 0.2)) H.al *= 1.6; });
    W.ball(1.94, 1.0, 1.3, 0.03, 0.75);
    W.box([1.45, 0.7, 1.7], [2.25, 0.74, 2.3], M.wood(0.26)); W.cyl(1.85, 2.0, 0.04, 0, 0.7, wood);
    W.cyl(1.7, 2.0, 0.07, 0.74, 0.92, (H) => { H.al = 0.5; H.e = 0.04; }); W.ball(1.7, 0.95, 2.0, 0.035, 0.6);
    W.cyl(1.95, 1.95, 0.035, 0.74, 0.84, (H) => { H.al = 0.5; H.e = 0.03; });
    // Rug.
    W.rect(1, 0.004, -1.6, 1.8, 1.3, 5.6, M.rug(0.22, -1.6, 1.8, 1.3, 5.6));
    return bakeWorld(W);
  },
  update() { return { uFire: PARLOR_PTS.fire, uKettle: PARLOR_PTS.kettle }; },
  glsl: `
void scene(vec2 sp, vec4 b, vec4 a, float t, inout float C, inout float W) {
  float flick = 0.75 + 0.25 * noise(vec2(t * 5.5, 1.0)) + 0.06 * sin(t * 21.0);
  W = b.g * 2.0 * flick;
  // Flames in the fireplace: low, licking up from the logs.
  vec2 f = uFire.xy; float s = uFire.z;
  vec2 q = (sp - f) / s;
  float fl = flame(vec2(q.x / 0.36, -q.y / (0.34 * (0.8 + 0.3 * flick))), t, 3.0);
  if (fl > 0.5) { W = fl > 1.5 ? 1.35 : 0.9; C = fl > 1.5 ? 0.3 : 0.0; }
  if (abs(q.y) < 0.04 && abs(q.x) < 0.36 && noise(vec2(sp.x * 0.2, t)) > 0.5) W = 0.9;
  // Steam drifting out of the kettle in the kitchen.
  vec2 k = (sp - uKettle.xy) / uKettle.z;
  if (k.y < 0.0 && k.y > -1.1) {
    float wob = k.x - sin(k.y * 6.0 + t * 1.3) * 0.06 * (-k.y) - k.y * 0.15;
    float st = exp(-wob * wob / (0.004 + 0.02 * -k.y)) * (1.0 + k.y) * noise(vec2(sp.x * 0.05, sp.y * 0.04 + t * 0.6));
    C += 0.22 * st;
  }
}`,
});

// Mobile: turned toward the fire: the hearth on the left, the chairs, the window light on the rug.
SCENES.push(mobile(SCENES.find((s) => s.id === "parlor_evening"), {
  cam: { ...PARLOR_CAM, yaw: -0.42, pitch: -0.14, f: 560, cx: 360, cy: 470 },
  // the flames and the steam, placed through this frame's camera
  update() { const cam = this.cam; return { uFire: project(cam, [-2.4, 0.12, 3.7]), uKettle: project(cam, [0.05, 1.16, 9.0]) }; },
}));
