// 12 · lawn_sunrise: the first light, lonely and wet. The house on the right, tall and dark, a
// tower and spire, one window still lit; the greenhouse on the left catching the first light
// under a bare tree; mist on the lawn, footprints through the dew, a thin pink and orange
// horizon with the sun just showing. The darks lift to a cold pale blue.
// Moves: the sun rising a little, mist drifting, birds crossing, the lit window, the greenhouse glinting.

SCENES.push({
  id: "lawn_sunrise",
  caption: "Behind them, the greenhouse glass catches the first light. The orchid has already closed.",
  sway: 3,
  bake() {
    const M2 = (draw) => makeMask(draw);
    const HX = FRAME.view ? -360 : 0; // on mobile the house stands closer, so it fits the tall frame beside the greenhouse
    const house = M2((g) => { g.translate(HX, 0);
      g.fillRect(950, 190, 340, 340);
      g.beginPath(); g.moveTo(990, 200); g.lineTo(1060, 128); g.lineTo(1130, 200); g.fill();
      g.beginPath(); g.moveTo(1150, 205); g.lineTo(1215, 140); g.lineTo(1280, 205); g.fill();
      g.fillRect(872, 140, 84, 390);
      g.beginPath(); g.moveTo(862, 146); g.lineTo(914, 46); g.lineTo(966, 146); g.fill();
      g.fillRect(912, 26, 4, 24);
      for (const [x, y, w, h] of [[1036, 92, 20, 70], [1176, 98, 18, 70], [1244, 110, 20, 80], [1112, 120, 16, 60]]) g.fillRect(x, y, w, h);
      g.fillRect(808, 388, 170, 14); g.beginPath(); g.moveTo(800, 392); g.lineTo(830, 360); g.lineTo(960, 360); g.lineTo(985, 392); g.fill();
      for (let k = 0; k < 6; k++) g.fillRect(812 + k * 30, 400, 6, 120);
      g.fillRect(805, 470, 175, 8);
    });
    const winList = [[888, 200, 26, 48], [920, 200, 26, 48], [888, 300, 26, 50], [920, 300, 26, 50], [1000, 240, 30, 54], [1050, 240, 30, 54], [1170, 250, 28, 54], [1222, 250, 28, 54], [1000, 360, 30, 60], [1050, 360, 30, 60], [1170, 360, 28, 60], [1222, 360, 28, 60], [1046, 150, 26, 34]];
    const wins = M2((g) => { g.translate(HX, 0); for (const [x, y, w, h] of winList) g.fillRect(x, y, w, h); });
    const lit = M2((g) => { g.translate(HX, 0); const [x, y, w, h] = winList[6]; g.fillRect(x + 3, y + 3, w - 6, h - 6); });
    const trim = M2((g) => { g.translate(HX, 0); g.lineWidth = 3; for (const [x, y, w, h] of winList) { g.strokeRect(x, y, w, h); g.beginPath(); g.moveTo(x + w / 2, y); g.lineTo(x + w / 2, y + h); g.moveTo(x, y + h / 2); g.lineTo(x + w, y + h / 2); g.stroke(); } g.lineWidth = 2; g.beginPath(); for (let y = 200; y < 530; y += 70) { g.moveTo(950, y); g.lineTo(1290, y); } g.stroke(); });
    const glass = M2((g) => { g.beginPath(); g.moveTo(-10, 535); g.lineTo(-10, 400); g.lineTo(120, 330); g.lineTo(250, 400); g.lineTo(250, 535); g.fill(); });
    const gbars = M2((g) => { g.lineWidth = 2; for (let x = 0; x <= 250; x += 18) { g.beginPath(); g.moveTo(x, 535); g.lineTo(x, 400 - Math.max(0, 70 - Math.abs(x - 120) * 0.54)); g.stroke(); } g.beginPath(); g.moveTo(-10, 400); g.lineTo(250, 400); g.moveTo(-10, 465); g.lineTo(250, 465); g.moveTo(-10, 400); g.lineTo(120, 330); g.lineTo(250, 400); g.stroke(); });
    const tree = M2((g) => {
      const branch = (x, y, a, len, w, d) => {
        if (d > 7 || len < 6) return;
        const x2 = x + Math.cos(a) * len, y2 = y + Math.sin(a) * len;
        g.lineWidth = w; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo((x + x2) / 2 + (hash(d, x | 0) - 0.5) * len * 0.3, (y + y2) / 2, x2, y2); g.stroke();
        const n = d < 2 ? 3 : 2;
        for (let k = 0; k < n; k++) branch(x2, y2, a + (k - (n - 1) / 2) * 0.55 + (hash(k + d, y | 0) - 0.5) * 0.4, len * (0.68 + hash(k, d) * 0.12), w * 0.66, d + 1);
      };
      branch(120, 560, -Math.PI / 2 + 0.05, 150, 22, 0);
    });
    const treeline = M2((g) => {
      g.beginPath(); g.moveTo(0, 430);
      for (let x = 0; x <= 1280; x += 6) { const h = 12 + 22 * noise(x * 0.012, 1) + 14 * noise(x * 0.04, 2) + (hash(Math.floor(x / 40), 9) > 2 ? 45 * Math.exp(-((((x % 40) - 20) / 6) ** 2)) : 0); g.lineTo(x, 420 - h); }
      g.lineTo(1280, 430); g.closePath(); g.fill();
    });
    const prints = M2((g) => { g.translate(HX, 0); for (let k = 0; k < 14; k++) { const t = k / 13, x = lerp(1000, 640, t) + (k % 2 ? 10 : -10) * (1 - t), y = lerp(712, 470, Math.pow(t, 0.75)), s = 1.2 - t * 0.85; g.beginPath(); g.ellipse(x, y, 12 * s, 5 * s, -0.4, 0, TAU); g.fill(); } });
    const SUN = { x: 640, y: 384 };
    return bakeGrid(...FRAME.grid, (x, y, o) => {
      const [wx, wy] = warp(x, y, 1.2);
      const horizon = Math.exp(-(((y - 372) / 34) ** 2)) * (0.45 + 0.55 * Math.exp(-(((x - SUN.x) / 340) ** 2)));
      const clouds = smooth(0.45, 0.7, noise(x * 0.004, y * 0.02) * 0.7 + noise(x * 0.015, y * 0.05) * 0.3);
      const skyC = 0.42 + 0.22 * (y / 420) - 0.12 * clouds + 0.06 * (hash(x >> 1, y >> 1) - 0.5) * clouds;
      if (tree(wx, wy) > 0.5) { o.C = 0.07; o.D = 0.8; return; }
      if (house(wx, wy) > 0.5) {
        if (lit(wx, wy) > 0.5) { o.C = 0.2; o.B = 1; o.D = 0.5; return; }
        const w = wins(wx, wy) > 0.5, tr = trim(wx, wy) > 0.5;
        o.C = w ? 0.11 + 0.12 * smooth(0.4, 0.9, noise(x * 0.05, y * 0.05)) * horizon * 0 + 0.06 : tr ? 0.2 : 0.12 + 0.05 * noise(x * 0.06, y * 0.3);
        o.D = 0.5; return;
      }
      if (glass(wx, wy) > 0.5) { const bar = gbars(wx, wy) > 0.5; o.C = bar ? 0.12 : 0.36 + 0.12 * noise(x * 0.03, y * 0.03); o.B = bar ? 0 : 0.12 + 0.12 * smooth(470, 400, y); o.D = 0.7; return; }
      if (y < 430 && treeline(wx, wy) > 0.5) { o.C = 0.24 + 0.1 * (y / 430) + 0.04 * noise(x * 0.1, y * 0.1); o.B = 0.2 * horizon; o.D = 0.2; return; }
      if (y < 430) {
        const sd = Math.hypot(x - SUN.x, (y - SUN.y) * 1.2);
        if (sd < 15) { o.C = 0.6; o.B = 1; o.D = 0; return; }
        o.C = skyC - 0.2 * horizon; o.B = horizon * (1.0 - 0.3 * clouds) + 0.5 * Math.exp(-((sd / 60) ** 2)); o.b = 1; o.D = 0; return;
      }
      // The lawn: wet, frosted, the sky caught in puddles; mist on it; footprints through the dew.
      const gp = ground(x, y, 425, 640);
      const grass = noise(x * 0.25 / (0.3 + gp.t), y * 0.04 / (0.3 + gp.t)), blades = hash(x >> 1, Math.floor(y / 3)) > 0.7 ? 1 : 0;
      const puddle = smooth(0.7, 0.76, noise(x * 0.008, y * 0.05)) * smooth(700, 300, Math.abs(x - 640) * 1.5 + (y - 430) * 0.8);
      const mist = Math.exp(-(y - 430) / 55);
      o.C = 0.22 + 0.1 * grass + 0.06 * blades + 0.22 * mist + puddle * 0.16; o.B = 0; o.D = 0.3 + 0.65 * gp.t;
      if (prints(wx, wy) > 0.5) o.C *= 0.55;
    });
  },
  glsl: `
void scene(vec2 sp, vec4 b, vec4 a, float t, inout float C, inout float W) {
  // Dawn light: the horizon pink above, orange close to the sun; the lit window stays orange.
  float rise = min(t / 60.0, 1.0);
  W = b.b * (0.95 + 0.25 * rise);
  gPink = clamp(1.0 - smoothstep(355.0, 392.0, sp.y) + smoothstep(120.0, 0.0, abs(sp.x - 640.0)) * 0.0, 0.0, 1.0) * (1.0 - exp(-pow(length(sp - vec2(640.0, 384.0)) / 90.0, 2.0)));
  if (b.b > 0.98) { gPink = 0.0; W = 1.1; }
  if (b.a > 0.45 && b.a < 0.55 && b.b > 0.9) { gPink = 0.0; W = 0.9 + 0.1 * noise(vec2(t * 3.0, 1.0)); }
  // The greenhouse panes glint as the light comes up.
  if (b.a > 0.65 && b.a < 0.75 && b.b > 0.3) W += 0.15 * pow(0.5 + 0.5 * sin(t * 0.5 - sp.x * 0.02), 6.0);
  // Mist drifting on the lawn.
  if (sp.y > 400.0) C += 0.08 * exp(-pow((sp.y - 450.0) / 40.0, 2.0)) * (noise(vec2((sp.x + t * 10.0) * 0.004, sp.y * 0.02)) - 0.3);
  // Birds crossing, far off.
  for (int i = 0; i < 9; i++) {
    float fi = float(i), cyc = mod(t * 22.0 + fi * 37.0, 1700.0) - 200.0;
    vec2 p = vec2(cyc + 30.0 * sin(fi * 2.1), 210.0 + 40.0 * sin(fi * 1.3) + 6.0 * sin(t * 0.9 + fi));
    vec2 q = sp - p; float flap = 2.0 * sin(t * 9.0 + fi * 1.7);
    if (abs(q.x) < 6.0 && abs(q.y - (abs(q.x) * 0.5 - 2.0) * (flap * 0.3 + 0.6)) < 1.1) { C = 0.06; W = 0.0; }
  }
}`,
});

// Mobile: the bare tree and the greenhouse catching the first light on the left, the sun low in the
// middle, the house pulled in on the right with its one lit window; a tall dawn sky above, the wet
// lawn and the footprints below.
SCENES.push(mobile(SCENES.find((s) => s.id === "lawn_sunrise"), { view: [-20, -330, 1.05] }));
