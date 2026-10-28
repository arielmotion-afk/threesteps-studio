// Title · the orchid house, at blue hour, built in 3D so it has real depth: layered planes and
// true perspective. The glasshouse front (piers and iron frames as solid bars with thickness, the
// double door set into it, steps coming down toward the camera to the lawn), and inside, palms at
// several depths and the orchid on its stand a metre in. The only warm light is a lantern set down
// outside, beyond the far wall: it backlights everything, its light comes through the leaves
// (casting their shadows on the floor) and catches the inner edges of the frames; the haze inside
// thickens with distance. The curved board with THE ORCHID HOUSE in gold is drawn over the frame.
// (Reference: refs/titles/4-orchid-house/v2/result-lantern.webp.)
// Moves: the lantern's light flickers through the glass.

SCENES.push({
  id: "title_orchid_house",
  title: "THE ORCHID HOUSE",
  sway: 0, // no camera drift (it sweeps bands across the frame)
  lift: 0.16,
  bake() {
    const W = makeWorld();
    // a little above the lawn, a few steps back: the stairs come toward us in perspective
    W.cam = { pos: [0, 1.15, -1.0], yaw: 0, pitch: -0.04, f: 1000, cx: 640, cy: 360 };
    W.amb = 0.2; W.far = 30;
    W.fills = [{ p: [0, 2.5, -3], I: 1.4, k: 0.02 }, { p: [-3, 3, 1], I: 0.5, k: 0.05 }]; // the blue dawn from behind the camera
    const LANTERN = [-0.3, 0.7, 11.5]; // at the end of the aisle, straight behind the orchid
    W.warm = { p: LANTERN, I: 14, k: 0.15 };
    // beyond the far wall: blue-hour sky above, and the lantern's glow low down, seen through everything
    const toL = (() => { const v = LANTERN.map((c, i) => c - W.cam.pos[i]), l = Math.hypot(...v); return v.map((c) => c / l); })();
    W.backdrop = (dx, dy, dz) => {
      const ang = Math.acos(clamp(dx * toL[0] + dy * toL[1] + dz * toL[2], -1, 1));
      return { C: 0.16 + 0.2 * smooth(-0.05, 0.4, dy), K: 1.4 * Math.exp(-ang / 0.05) + 0.7 * Math.exp(-ang / 0.14) + 0.12 * Math.exp(-ang / 0.4), sky: dy > 0.25 ? 1 : 0 };
    };
    const ZF = 4; // the glasshouse front
    const paint = (H) => { H.al = 0.62 + 0.06 * noise(H.x * 20, H.y * 20); }; // pale painted iron
    const bar = (x0, x1, y0, y1, d = 0.08) => W.box([x0, y0, ZF - d / 2], [x1, y1, ZF + d / 2], paint);
    // piers either side of the door
    for (const s of [-1, 1]) W.box([Math.min(s * 1.57, s * 1.79), -0.02, ZF - 0.22], [Math.max(s * 1.57, s * 1.79), 2.25, ZF + 0.14], paint);
    // the side walls: glazing bars and rails, a brick plinth
    for (const s of [-1, 1]) {
      for (const x of [2.17, 2.65, 3.15]) bar(s * x - 0.025, s * x + 0.025, 0.28, 2.95);
      for (const y of [0.28, 1.41, 2.24]) W.box([Math.min(s * 1.79, s * 3.6), y - 0.025, ZF - 0.04], [Math.max(s * 1.79, s * 3.6), y + 0.025, ZF + 0.04], paint);
      W.box([Math.min(s * 1.79, s * 3.6), -0.36, ZF - 0.06], [Math.max(s * 1.79, s * 3.6), 0.26, ZF + 0.2], M.stone(0.12, 0.24, 0.08));
    }
    // the band of panes along the top
    for (let x = -3.6; x <= 3.6; x += 0.46) bar(x - 0.02, x + 0.02, 2.24, 2.95);
    // the door: a frame following the arch, two leaves of glass with bars, solid lower panels
    const D = 1.36, archY = (x) => 2.18 - 0.14 * (x / D) ** 2;
    for (const s of [-1, 1]) W.box([Math.min(s * D, s * (D + 0.09)), 0, ZF - 0.07], [Math.max(s * D, s * (D + 0.09)), 2.2, ZF + 0.07], paint);
    for (let i = 0; i < 24; i++) { const x0 = -D + (i / 24) * 2 * D, x1 = x0 + (2 * D) / 24, y = archY((x0 + x1) / 2); W.box([x0, y, ZF - 0.06], [x1, y + 0.09, ZF + 0.06], paint); }
    W.box([-0.06, 0, ZF - 0.05], [0.06, 2.18, ZF + 0.05], paint); // centre stile
    W.box([-D, 1.84, ZF - 0.04], [D, 1.89, ZF + 0.04], paint); // transom
    W.box([-D, 0.33, ZF - 0.05], [D, 0.4, ZF + 0.05], paint); // lower rail
    for (const x of [-0.82, 0.82]) W.box([x - 0.025, 0.4, ZF - 0.035], [x + 0.025, 1.84, ZF + 0.035], paint);
    for (const x of [-1.0, -0.42, 0.42, 1.0]) W.box([x - 0.015, 1.89, ZF - 0.03], [x + 0.015, 2.12, ZF + 0.03], paint);
    W.box([-D, 0, ZF - 0.02], [D, 0.33, ZF + 0.03], (H) => { const fu = Math.abs(H.x) % (D / 2), inner = fu > 0.12 && fu < D / 2 - 0.12 && H.y > 0.07 && H.y < 0.27; H.al = inner ? 0.5 : 0.58; });
    for (const x of [-0.11, 0.11]) W.ball(x, 1.08, ZF - 0.07, 0.026, 0.6); // small knobs, pale like the ironwork
    // the threshold and the steps down to the lawn (each wider than the last), the lawn
    // even stone, a little wet (no per-slab variation: one dark slab dead centre read as a hole)
    const stoneStep = (al) => (H) => { H.al = al * (0.9 + 0.2 * noise(H.x * 6, H.z * 6 + H.y * 6)); H.refl = H.ny > 0.5 ? 0.12 : 0; };
    W.box([-1.75, -0.12, ZF - 0.32], [1.75, 0, ZF + 0.05], stoneStep(0.34));
    W.box([-1.9, -0.24, ZF - 0.62], [1.9, -0.12, ZF - 0.32], stoneStep(0.32));
    W.box([-2.05, -0.36, ZF - 0.92], [2.05, -0.24, ZF - 0.62], stoneStep(0.3));
    W.rect(1, -0.36, -8, 8, -2, ZF, (H) => { H.al = 0.14 + 0.1 * noise(H.x * 9, H.z * 9) + (hash(Math.floor(H.x * 200), Math.floor(H.z * 200)) > 0.985 ? 0.6 : 0); });
    // inside: the floor; two lines of plants either side of an aisle; the orchid on a table in the middle; the far wall's bars
    W.rect(1, 0, -8, 8, ZF, 12, (H) => { H.al = 0.2 + 0.08 * noise(H.x * 3, H.z * 3); H.k = 2.2; H.refl = 0.15; });
    const palmTex = (seed, fronds) => tex2d(220, 220, (g) => {
      g.lineCap = "round";
      for (let k = 0; k < fronds; k++) {
        const a = -Math.PI / 2 + (k / (fronds - 1) - 0.5) * 2.4 + (hash(k, seed) - 0.5) * 0.35, len = 140 + 50 * hash(k, seed + 1);
        const pt = (t) => [110 + Math.cos(a) * len * 0.55 * t, 214 + Math.sin(a) * len * t + len * 0.22 * t * t]; // rise high, droop at the tips
        g.lineWidth = 3; g.beginPath(); g.moveTo(110, 214); for (let i = 1; i <= 14; i++) g.lineTo(...pt(i / 14)); g.stroke();
        for (let i = 2; i < 14; i++) { const t = i / 14, [px, py] = pt(t), [qx, qy] = pt(t + 0.02), b = Math.atan2(qy - py, qx - px), l = 30 * Math.sin(t * Math.PI * 0.9 + 0.2); g.lineWidth = Math.max(2.5, l * 0.13); for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(px, py); g.lineTo(px + Math.cos(b + sd * 0.8) * l, py + Math.sin(b + sd * 0.8) * l + l * 0.3); g.stroke(); } }
      }
    });
    const palmAt = (x, z, w, h, seed, fronds = 9, y0 = -0.02) => { const t = palmTex(seed, fronds); W.rect(2, z, x - w / 2, x + w / 2, y0, y0 + h, (H) => { H.al = 0.08; }, (u, v) => t((u - x + w / 2) / w, 1 - (v - y0) / h) < 0.5); };
    // the back line: tall palms along both walls, receding down the house
    for (let i = 0; i < 6; i++) for (const sd of [-1, 1]) palmAt(sd * (2.55 + 0.3 * hash(i, sd + 3)), 4.4 + i * 1.05, 2.1, 2.5 - i * 0.06, 20 + i * 2 + (sd > 0 ? 1 : 0), 11);
    palmAt(-3.5, 4.5, 2.0, 2.4, 5, 11); palmAt(3.4, 4.5, 2.0, 2.4, 6, 11);
    // the front line: a bench down each side of the aisle, with smaller plants in pots on it
    for (const sd of [-1, 1]) {
      const xa = sd * 0.85, xb = sd * 1.95;
      W.box([Math.min(xa, xb), 0.76, 4.5], [Math.max(xa, xb), 0.82, 10.2], M.wood(0.14));
      for (let z = 4.6; z < 10.2; z += 1.4) for (const x of [xa + sd * 0.05, xb - sd * 0.05]) W.box([x - 0.03, 0, z - 0.03], [x + 0.03, 0.76, z + 0.03], 0.1);
      for (let i = 0; i < 8; i++) {
        const z = 4.75 + i * 0.72, x = sd * (1.38 + 0.18 * (hash(i, sd + 9) - 0.5)), h = 0.8 + 0.35 * hash(i, sd + 11);
        W.box([x - 0.12, 0.82, z - 0.09], [x + 0.12, 0.98, z + 0.09], 0.16); // pot
        palmAt(x, z, 0.95, h, 40 + i * 2 + (sd > 0 ? 1 : 0), 8, 0.96);
      }
    }
    // the orchid, alone on a small table in the middle of the aisle, against the lantern's glow
    const OX = -0.42, OZ = 6.3;
    const orchid = tex2d(120, 160, (g) => {
      for (const sd of [-1, 1]) for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(60, 150); g.quadraticCurveTo(60 + sd * (18 + k * 8), 128 - k * 8, 60 + sd * (40 + k * 9), 142 - k * 5); g.lineTo(60 + sd * (36 + k * 8), 147 - k * 5); g.quadraticCurveTo(60 + sd * (16 + k * 7), 136 - k * 7, 60, 156); g.fill(); }
      g.lineWidth = 3.5; g.beginPath(); g.moveTo(60, 150); g.quadraticCurveTo(56, 90, 62, 34); g.stroke(); g.beginPath(); g.ellipse(62, 24, 6, 13, 0, 0, TAU); g.fill();
    });
    W.box([OX - 0.34, 0.72, OZ - 0.26], [OX + 0.34, 0.78, OZ + 0.26], M.wood(0.16));
    for (const dx of [-0.3, 0.3]) for (const dz of [-0.22, 0.22]) W.box([OX + dx - 0.025, 0, OZ + dz - 0.025], [OX + dx + 0.025, 0.72, OZ + dz + 0.025], 0.1);
    W.box([OX - 0.1, 0.78, OZ - 0.08], [OX + 0.1, 0.98, OZ + 0.08], 0.18); // the pot
    W.rect(2, OZ, OX - 0.42, OX + 0.42, 0.96, 1.95, (H) => { H.al = 0.06; }, (u, v) => orchid((u - OX + 0.42) / 0.84, 1 - (v - 0.96) / 0.99) < 0.5);
    for (let x = -3.6; x <= 3.6; x += 0.9) W.box([x - 0.03, 0, 10.4], [x + 0.03, 3.2, 10.46], 0.1); // the far wall's bars
    W.box([-3.6, 2.4, 10.4], [3.6, 2.46, 10.46], 0.1);
    // the pitched glass roof: bars from the eaves up to the ridge, against the sky (above the desktop frame;
    // seen in the tall mobile one)
    const RIDGE = [5.0, 7.0];
    for (let x = -3.6; x <= 3.61; x += 0.46) W.rod([x, 2.95, ZF], [x, RIDGE[0], RIDGE[1]], 0.022, paint);
    W.box([-3.6, RIDGE[0] - 0.05, RIDGE[1] - 0.05], [3.6, RIDGE[0] + 0.07, RIDGE[1] + 0.05], paint);
    for (const f of [0.4, 0.75]) W.rod([-3.6, 2.95 + (RIDGE[0] - 2.95) * f, ZF + (RIDGE[1] - ZF) * f], [3.6, 2.95 + (RIDGE[0] - 2.95) * f, ZF + (RIDGE[1] - ZF) * f], 0.02, paint);
    W.box([-3.6, 2.92, ZF - 0.06], [3.6, 3.02, ZF + 0.06], paint); // the eaves
    for (const x of [-1.2, 0, 1.2]) { W.rod([x, RIDGE[0] + 0.07, RIDGE[1]], [x, RIDGE[0] + 0.32, RIDGE[1]], 0.02, paint); W.ball(x, RIDGE[0] + 0.36, RIDGE[1], 0.05, paint); } // finials

    // the board over the door (screen space), placed from where the door's arch lands on screen
    const top = project(W.cam, [0, 2.27, ZF]), side = project(W.cam, [1.6, 2.12, ZF]);
    const k = W.cam.f / 1000, CX = W.cam.cx; // (desktop: f 1000, centred at 640; the mobile camera scales it)
    const SIGN = { c: [CX, top[1] + 560 * k], r0: 560 * k, r1: 494 * k, x0: CX - (side[0] - CX) - 6, x1: side[0] + 6 };
    const words = makeMask((g) => textOnCurve(g, "THE ORCHID HOUSE", SERIF, (t) => { const a = lerp(-0.5, 0.5, t), r = (SIGN.r0 + SIGN.r1) / 2 - 16; return [SIGN.c[0] + Math.sin(a) * r, SIGN.c[1] - Math.cos(a) * r]; }, 40 * ((SIGN.x1 - SIGN.x0) / 672), 40 * ((SIGN.x1 - SIGN.x0) / 672), { from: 0.08, to: 0.92, track: 0.1, bold: 0.3 })); // fine strokes, sized to the board
    return bakeWorld(W, ...FRAME.grid, (sx, sy, o, H, d) => {
      const dd = Math.hypot(sx - SIGN.c[0], sy - SIGN.c[1]);
      if (sx > SIGN.x0 && sx < SIGN.x1 && dd < SIGN.r0 && dd > SIGN.r1 - 10) {
        if (dd < SIGN.r1) { o.C = 0.04; o.K = 0; o.D = 0.9; return; } // the board's underside
        // letters cut into the plate and gilded: inside each one, the upper wall of the cut is in
        // shadow and the lower wall catches the light; nothing stands out from the surface
        if (cover(words, sx, sy) > 0.35) {
          const upper = words(sx, sy - 3) < 0.5 || words(sx, sy - 5) < 0.5, lower = words(sx, sy + 3) < 0.5;
          o.C = upper ? 0.04 : lower ? 0.5 : 0.24; o.K = upper ? 0.35 : lower ? 1.4 : 1.0; o.D = 0.9; return;
        }
        const trim = dd > SIGN.r0 - 6 * k || dd < SIGN.r1 + 5 * k || sx < SIGN.x0 + 5 || sx > SIGN.x1 - 5;
        o.C = trim ? 0.5 : 0.07 + 0.03 * noise(sx * 0.02, dd * 0.4); o.K = 0; o.D = 0.9; return;
      }
      // haze inside: the further in, the more the lantern-lit air shows
      if (H && H.z > ZF + 0.1) { const fog = 1 - Math.exp(-Math.max(0, H.z - ZF - 0.3) / 4.5), ang = Math.acos(clamp(d[0] * toL[0] + d[1] * toL[1] + d[2] * toL[2], -1, 1)); o.C = lerp(o.C, 0.18, fog * 0.6); o.K += fog * (0.4 * Math.exp(-ang / 0.18) + 0.03); }
      // the sky over the roof caught in the upper glass (where the view passes through the front above 2.24 m)
      const tf = (ZF - W.cam.pos[2]) / d[2], yf = W.cam.pos[1] + tf * d[1], t = H ? H.t : 99;
      if (t > tf + 0.05 && yf > 2.24 && yf < 2.95) { const cl = smooth(0.45, 0.7, noise(sx * 0.004, sy * 0.03) * 0.7 + noise(sx * 0.015, sy * 0.08) * 0.3); o.C = 0.3 + 0.1 * cl + 0.05 * smooth(300, 0, sy); o.K *= 0.2; o.b = 1; }
    });
  },
  glsl: `
void scene(vec2 sp, vec4 b, vec4 a, float t, inout float C, inout float W) {
  // the lantern beyond the far wall: its light flickers through everything it reaches
  float flick = 0.8 + 0.14 * noise(vec2(t * 4.0, 1.0)) + 0.08 * noise(vec2(t * 11.0, 5.0)) + 0.03 * sin(t * 23.0);
  W = b.g * 2.0 * flick;
}`,
});

// Mobile: closer, from low on the lawn: the door and its board fill the width, the pitched glass roof
// rises against the sky above, the steps below.
SCENES.push(mobile(SCENES.find((s) => s.id === "title_orchid_house"), {
  cam: { pos: [0, 1.0, -2.6], yaw: 0, pitch: 0.18, f: 1150, cx: 360, cy: 600 },
}));
