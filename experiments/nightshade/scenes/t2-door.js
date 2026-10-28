// Title · the reading room door: low in a dark hallway, the corridor running off to the left, the
// door on the right wall open a few inches. READING ROOM in gilt letters on its frosted glass,
// lit from behind by the lamp. A wedge of lamplight through the gap falls across the floorboards,
// on scattered soil, a shard of the pot and one orchid leaf. Nothing else of the room is seen.
// Moves: the lamp flickers a little, dust turns in the wedge of light, a slow camera sway.

SCENES.push({
  id: "title_reading_door",
  title: "READING ROOM",
  focus: [50, 18], // when a wide window crops the frame, keep the top (the glass) and trim the floor
  sway: 0, // no camera drift: on continuous floors and walls it reads as a band sweeping across
  lift: 0.4,
  bake() {
    const W = makeWorld();
    W.cam = { pos: [-1.0, 0.72, 0.85], yaw: 0.74, pitch: -0.02, f: 700, cx: 640, cy: 420 };
    W.amb = 0.19; W.far = 14; W.reflB = true;
    W.fills = [{ p: [-0.2, 1.9, 12], I: 0.9, k: 0.3 }, { p: [-0.6, 2.0, 1.2], I: 0.5, k: 0.6 }];
    W.warm = { p: [1.28, 0.55, 3.2], I: 3.4, k: 0.6 };
    W.backdrop = (dx, dy, dz) => ({ C: 0.24 + 0.1 * dy, sky: 1 });
    const paper = M.paper(0.2, SPRIG), wood = M.wood(0.16), dark = M.wood(0.09);
    const L = -1.4, R = 1.0, END = 13, CEIL = 2.9;
    const D0 = 2.2, D1 = 3.12, DH = 2.3, GAP = 3.04; // door opening (z), height, where the leaf stops
    const G0 = 2.27, G1 = 2.93, GY0 = 1.3, GY1 = 2.16; // the frosted glass panel
    // lettering on the glass; seen from the hallway, +z runs to the left, so u is flipped
    // the lettering: small pixel capitals, cut into the glass (placed on the screen grid below)
    // (laid out further down, once the glass's slope on screen is known)
    const glassMat = (H) => {
      const u = (G1 - H.z) / (G1 - G0), v = (GY1 - H.y) / (GY1 - GY0);
      const frost = 0.93 + 0.07 * noise(H.z * 120, H.y * 120), edge = smooth(0, 0.1, Math.min(u, 1 - u, v, 1 - v));
      H.al = 0.05; H.e = 0.02; H.noMoon = true;
      // frosted glass lit from behind, bright enough to print as one flat colour so the letters stay crisp
      H.wb = (1.25 + 0.3 * Math.exp(-(((u - 0.45) / 0.5) ** 2) - (((v - 0.3) / 0.6) ** 2))) * (0.6 + 0.4 * edge);
    };
    // the hallway
    const boards = M.boards(0.2, 0.12, 0.3);
    W.rect(1, 0, L, R, 0, END, (H) => { boards(H); H.k = 3.2; }); // polished: catches the lamplight strongly
    W.rect(1, CEIL, L, R, 0, END, 0.06);
    W.rect(0, L, 0, END, 0, CEIL, paper);
    W.rect(0, R, 0, END, 0, CEIL, paper, (u, v) => u > D0 && u < D1 && v < DH);
    W.rect(2, END, L, R, 0, CEIL, paper, (u, v) => Math.abs(u + 0.2) < 0.34 && v > 1.0 && (v < 2.0 || Math.hypot(u + 0.2, v - 2.0) < 0.34));
    for (const x of [L, R]) {
      const s = x < 0 ? 1 : -1;
      W.box([Math.min(x, x + s * 0.03), 0, 0], [Math.max(x, x + s * 0.03), 0.16, END], dark); // skirting
      W.box([Math.min(x, x + s * 0.025), 0.9, 0], [Math.max(x, x + s * 0.025), 0.94, END], wood); // dado rail
    }
    // the runner rug down the middle
    W.box([-0.85, 0, 0], [0.05, 0.008, END - 0.3], M.rug(0.18, -0.85, 0.05, 0, END - 0.3));
    // door frame (architrave) on the hallway side
    W.box([R - 0.04, 0, D0 - 0.1], [R, DH + 0.12, D0], wood);
    W.box([R - 0.04, 0, D1], [R, DH + 0.12, D1 + 0.1], wood);
    W.box([R - 0.04, DH, D0 - 0.1], [R, DH + 0.12, D1 + 0.1], wood);
    // the door leaf, ajar: set back into the room, stopping short of the frame
    const leafX = R + 0.05, panel = (u, v) => u > G0 && u < G1 && v > GY0 && v < GY1;
    W.rect(0, leafX, D0, GAP, 0.025, DH, (H) => {
      const lower = H.y < 1.1, mould = (Math.abs(H.y - 1.16) < 0.03) || (lower && (Math.abs(H.y - 0.15) < 0.02 || Math.abs(H.y - 1.0) < 0.02 || Math.abs(H.z - D0 - 0.12) < 0.02 || Math.abs(H.z - GAP + 0.12) < 0.02));
      H.al = mould ? 0.42 : 0.28 * (0.85 + 0.3 * noise(H.z * 30, H.y * 2));
    }, panel);
    W.rect(0, leafX + 0.02, G0, G1, GY0, GY1, glassMat);
    W.rect(2, GAP, R + 0.02, leafX + 0.05, 0, DH, 0.3); // the leaf's edge, in the gap
    W.cyl(R + 0.03, GAP - 0.08, 0.025, 1.0, 1.05, 0.5); // doorknob
    // the room behind (seen only through the gap)
    W.rect(1, 0, R, 4.5, D0 - 1, D1 + 2, M.boards(0.3, 0.14));
    W.rect(0, 4.5, D0 - 1, D1 + 2, 0, CEIL, M.paper(0.3, SPRIG));
    W.rect(2, D1 + 2, R, 4.5, 0, CEIL, M.paper(0.3, SPRIG));
    // pictures and a hall table
    const frame = (x, z0, z1, y0, y1) => { const s = x < 0 ? 1 : -1; W.box([Math.min(x, x + s * 0.04), y0, z0], [Math.max(x, x + s * 0.04), y1, z1], (H) => { const inner = H.y > y0 + 0.06 && H.y < y1 - 0.06 && H.z > z0 + 0.06 && H.z < z1 - 0.06; H.al = inner ? 0.08 + 0.1 * noise(H.z * 8, H.y * 8) : 0.3; }); };
    frame(R, 0.6, 1.5, 1.35, 2.15); frame(R, 4.0, 4.7, 1.4, 2.0); frame(L, 3.2, 3.8, 1.45, 2.0); frame(L, 5.6, 6.1, 1.5, 1.9);
    W.box([L, 0.78, 4.3], [L + 0.38, 0.82, 5.2], wood);
    for (const z of [4.35, 5.15]) W.box([L + 0.3, 0, z - 0.02], [L + 0.34, 0.78, z + 0.02], dark);
    W.ball(L + 0.18, 0.92, 4.75, 0.1, 0.2); W.rod([L + 0.18, 0.95, 4.75], [L + 0.12, 1.25, 4.7], 0.008, 0.2); W.rod([L + 0.18, 0.95, 4.75], [L + 0.28, 1.2, 4.8], 0.008, 0.2);
    // on the floor in the light: soil, a shard of the pot, one orchid leaf
    for (let i = 0; i < 52; i++) { const a = (hash(i, 1) - 0.5) * 1.6, r = 0.05 + hash(i, 2) * 0.75; W.ball(R - 0.05 - Math.cos(a) * r, 0.004, GAP + 0.03 - 0.12 * r + Math.sin(a) * r * 0.25, 0.006 + hash(i, 3) * 0.016, 0.08); }
    W.box([0.6, 0, 2.94], [0.7, 0.035, 3.02], 0.3); W.box([0.36, 0, 2.9], [0.42, 0.02, 2.95], 0.26); W.box([0.82, 0, 3.0], [0.86, 0.025, 3.05], 0.26);
    W.rod([0.05, 0.012, 2.86], [0.3, 0.012, 2.98], 0.024, 0.34); W.rod([0.3, 0.012, 2.98], [0.4, 0.012, 3.0], 0.016, 0.34);
    // a soft glow around the lit glass and along the gap (screen space, like light blooming)
    const P = (x, y, z) => project(W.cam, [x, y, z]);
    const gl = [P(leafX + 0.02, GY0, G0), P(leafX + 0.02, GY1, G1)], gx0 = Math.min(gl[0][0], gl[1][0]), gx1 = Math.max(gl[0][0], gl[1][0]), gy0 = Math.min(gl[0][1], gl[1][1]), gy1 = Math.max(gl[0][1], gl[1][1]);
    const gp0 = P(R, 0, (GAP + D1) / 2), gp1 = P(R, DH, (GAP + D1) / 2);
    // the words follow the glass's slope letter by letter, centred a third of the way down the glass,
    // one cell per screen pixel so every stroke stays whole
    // in perspective every height on the door has its own angle: each line takes the one at its height
    const TY = GY1 - 0.34 * (GY1 - GY0), slopeAt = (y) => { const a = P(leafX + 0.02, y, G1), b = P(leafX + 0.02, y, G0); return (b[1] - a[1]) / (b[0] - a[0]); };
    const WORDS = pixelWords(["READING", "ROOM"], { gap: 2, lead: 5, slope: [slopeAt(TY + 0.05), slopeAt(TY - 0.05)], skew: true });
    const gc = P(leafX + 0.02, TY, (G0 + G1) / 2), bx = Math.round(gc[0] / 2 - WORDS.w / 2), by = Math.round(gc[1] / 2 - WORDS.h / 2);
    return bakeWorld(W, ...FRAME.grid, (sx, sy, o, H) => {
      if (H && H.p.mat === glassMat) {
        const cx = Math.floor(sx / 2) - bx, cy = Math.floor(sy / 2) - by;
        // the cut: dark letters, with a softer shadow one pixel down-right
        if (WORDS.on(cx, cy)) o.B = 0.3;
        else if (WORDS.on(cx - 1, cy - 1)) o.B = 0.62;
        return;
      }
      const dg = Math.hypot(Math.max(gx0 - sx, 0, sx - gx1), Math.max(gy0 - sy, 0, sy - gy1));
      const t = clamp((sy - gp0[1]) / (gp1[1] - gp0[1])), dgap = Math.hypot(sx - lerp(gp0[0], gp1[0], t), sy - lerp(gp0[1], gp1[1], t));
      o.K += 0.12 * Math.exp(-dg / 16) + 0.12 * Math.exp(-dgap / 4);
    });
  },
  glsl: `
void scene(vec2 sp, vec4 b, vec4 a, float t, inout float C, inout float W) {
  float flick = 0.92 + 0.08 * noise(vec2(t * 2.5, 4.0)) + 0.03 * sin(t * 13.0);
  W = b.g * 2.0 * flick + b.b * 1.15 * flick;
  // dust turning slowly in the lamplight
  if (b.g > 0.12) {
    vec2 q = sp + vec2(t * 3.0, sin(t * 0.3 + sp.x * 0.01) * 8.0);
    float h = hash(floor(q / 3.0));
    if (h > 0.996) W += 0.35 * b.g * 2.0;
  }
}`,
});

// Mobile: the door high in the frame, the wedge of lamplight running down the floor toward us.
SCENES.push(mobile(SCENES.find((s) => s.id === "title_reading_door"), {
  cam: { pos: [-0.7, 0.8, 1.2], yaw: 0.82, pitch: 0.02, f: 560, cx: 360, cy: 600 },
}));
