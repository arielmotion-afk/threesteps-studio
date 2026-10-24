// 8 · garden_night: the back garden under the moon. The house on the left with the three
// pointed reading-room windows, mud dried on the middle sill; boot prints across the wet lawn
// to that window; the hedged bed of white flowers; the greenhouse dark at the back; the gravel
// path curving to a lantern on its post; the padlocked potting shed on the right.
// Moves: the lantern, clouds over the moon, the white flowers and leaves stirring, mist.

const LAMP8 = { x: 942, y: 318 };

SCENES.push({
  id: "garden_night",
  caption: "The prints stop right under the reading room window. But the mud on the sill has dried hard.",
  sway: 4,
  bake() {
    const M2 = (draw) => makeMask(draw);
    const house = makeVolume((g) => { g.beginPath(); g.moveTo(-10, -10); g.lineTo(400, -10); g.lineTo(420, 30); g.lineTo(420, 470); g.lineTo(-10, 520); g.fill(); }, 6, 4);
    const WINS = [[122, 80, 70, 360], [256, 84, 66, 362], [354, 60, 96, 352]];
    const inWin = (x, y) => WINS.some(([cx, w, top, bot]) => lancet(x, y, cx, w, top + w * 0.75, bot, w * 0.85));
    const bars = M2((g) => { g.lineWidth = 3; for (const [x, w, top, bot] of WINS) { g.beginPath(); g.moveTo(x, top + 10); g.lineTo(x, bot); for (let k = 1; k < 5; k++) { const y = top + w + ((bot - top - w) * k) / 5; g.moveTo(x - w / 2, y); g.lineTo(x + w / 2, y); } g.stroke(); g.lineWidth = 5; g.beginPath(); g.moveTo(x - w / 2, top + w); g.lineTo(x - w / 2, bot); g.moveTo(x + w / 2, top + w); g.lineTo(x + w / 2, bot); g.stroke(); g.lineWidth = 3; } });
    const sills = M2((g) => { for (const [x, w, , bot] of WINS) g.fillRect(x - w / 2 - 10, bot, w + 20, 12); });
    const mud = M2((g) => { const [x, w, , bot] = WINS[1]; for (let k = 0; k < 14; k++) { g.beginPath(); g.ellipse(x - w / 2 + 6 + hash(k, 1) * (w - 6), bot + 4 + hash(k, 2) * 6, 4 + hash(k, 3) * 6, 2.5, 0, 0, TAU); g.fill(); } g.lineWidth = 2; for (let k = 0; k < 5; k++) { const dx = x - 20 + k * 10; g.beginPath(); g.moveTo(dx, bot + 12); g.lineTo(dx + 1, bot + 22 + hash(k, 4) * 26); g.stroke(); } });
    const steps = M2((g) => { for (let k = 0; k < 3; k++) g.fillRect(150 - k * 12, 400 + k * 22, 270 + k * 24, 22); });
    const ivy = M2((g) => { for (let i = 0; i < 700; i++) { const x = hash(i, 11) * 420, y = hash(i, 12) * 520; if ((x > 300 && y < 300) || hash(i, 13) > 0.7 + 0.3 * (y / 520)) continue; g.beginPath(); g.ellipse(x, y, 4, 2.6, hash(i, 14) * 3, 0, TAU); g.fill(); } });
    const hedge = makeVolume((g) => {
      g.beginPath(); g.moveTo(330, 470); g.quadraticCurveTo(320, 400, 380, 392); g.lineTo(830, 410); g.quadraticCurveTo(880, 430, 868, 470); g.quadraticCurveTo(600, 500, 330, 470); g.fill();
      g.beginPath(); g.moveTo(-10, 520); g.quadraticCurveTo(80, 500, 260, 515); g.lineTo(270, 600); g.lineTo(-10, 610); g.fill();
    }, 8, 4);
    const bushes = makeVolume((g) => { for (let i = 0; i < 46; i++) { const x = 380 + hash(i, 21) * 440, y = 395 - hash(i, 22) * 70, r = 18 + hash(i, 23) * 26; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); } for (let i = 0; i < 20; i++) { const x = 10 + hash(i, 24) * 200, y = 470 + hash(i, 25) * 50, r = 14 + hash(i, 26) * 18; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); } }, 6, 5);
    const blooms = M2((g) => { for (let i = 0; i < 260; i++) { const x = 360 + hash(i, 31) * 470, y = 325 + hash(i, 32) * 100, r = 2 + hash(i, 33) * 3.5; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); } for (let i = 0; i < 90; i++) { const x = 20 + hash(i, 34) * 200, y = 440 + hash(i, 35) * 70; g.beginPath(); g.arc(x, y, 2 + hash(i, 36) * 3, 0, TAU); g.fill(); } for (let i = 0; i < 60; i++) { const x = 1180 + hash(i, 37) * 100, y = 560 + hash(i, 38) * 150; g.beginPath(); g.arc(x, y, 2.5 + hash(i, 39) * 3, 0, TAU); g.fill(); } });
    const glass = M2((g) => { g.beginPath(); g.moveTo(590, 360); g.lineTo(590, 268); g.lineTo(640, 232); g.lineTo(760, 232); g.lineTo(790, 268); g.lineTo(790, 360); g.closePath(); g.fill(); });
    const glassBars = M2((g) => { g.lineWidth = 1.6; for (let x = 590; x <= 790; x += 12) { g.beginPath(); g.moveTo(x, 360); g.lineTo(x, x < 640 ? 268 - (x - 590) * 0.72 : x > 760 ? 232 + (x - 760) * 1.2 : 232); g.stroke(); } g.beginPath(); g.moveTo(590, 300); g.lineTo(790, 300); g.moveTo(590, 268); g.lineTo(790, 268); g.stroke(); });
    const shed = makeVolume((g) => { g.beginPath(); g.moveTo(1110, 600); g.lineTo(1110, 240); g.lineTo(1170, 186); g.lineTo(1290, 186); g.lineTo(1290, 600); g.fill(); }, 4, 3);
    const roof = M2((g) => { g.beginPath(); g.moveTo(1098, 248); g.lineTo(1166, 180); g.lineTo(1290, 180); g.lineTo(1290, 206); g.lineTo(1176, 206); g.lineTo(1120, 256); g.fill(); });
    const door = M2((g) => g.fillRect(1150, 300, 92, 270));
    const trees = M2((g) => { for (let i = 0; i < 60; i++) { const x = 380 + hash(i, 41) * 900, y = 120 + hash(i, 42) * 200 + (x > 1000 ? -60 : 0), r = 30 + hash(i, 43) * 60; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); } g.fillRect(380, 250, 900, 140); });
    const treesNear = M2((g) => { for (let i = 0; i < 30; i++) { const x = 980 + hash(i, 44) * 320, y = -20 + hash(i, 45) * 300, r = 40 + hash(i, 46) * 60; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); } });
    const cypress = M2((g) => { for (const [x, h] of [[565, 120], [850, 100], [700, 80]]) { g.beginPath(); g.ellipse(x, 360 - h / 2, 14, h / 2, 0, 0, TAU); g.fill(); } });
    const post = M2((g) => { g.fillRect(LAMP8.x - 3, LAMP8.y + 8, 6, 70); });
    const pathC = (y) => 760 + (470 - y) * 0.9 + 60 * Math.sin((470 - y) / 60);
    const gravel = M2((g) => { g.beginPath(); for (let y = 470; y >= 330; y -= 4) g.lineTo(pathC(y) - (y - 300) * 0.35, y); for (let y = 330; y <= 470; y += 4) g.lineTo(pathC(y) + (y - 300) * 0.2 + 10, y); g.closePath(); g.fill(); g.beginPath(); g.moveTo(700, 470); g.quadraticCurveTo(760, 500, 860, 480); g.lineTo(890, 470); g.fill(); });
    const prints = M2((g) => { for (let k = 0; k < 10; k++) { const t = k / 9, x = lerp(520, 300, t) + (k % 2 ? 14 : -14) * (1 - t * 0.6), y = lerp(712, 470, Math.pow(t, 0.8)), s = 1.4 - t * 0.9; g.beginPath(); g.ellipse(x, y, 13 * s, 6 * s, -0.25, 0, TAU); g.fill(); } for (let k = 0; k < 6; k++) { const t = k / 5, x = lerp(330, 640, t) + (k % 2 ? 8 : -8), y = lerp(462, 445, t), s = 0.55; g.beginPath(); g.ellipse(x, y, 13 * s, 6 * s, 0.1, 0, TAU); g.fill(); } });
    const moon = { x: 868, y: 72 };
    return bakeGrid(640, 360, (x, y, o) => {
      const [wx, wy] = warp(x, y, 1.2), md = Math.hypot(x - moon.x, y - moon.y);
      const sky = md < 18 ? 1 : 0.1 + 0.35 * Math.exp(-((md / 130) ** 2)) + 0.08 * (1 - y / 400) - 0.08 * smooth(0.55, 0.7, noise(x * 0.004, y * 0.02));
      const lampD = Math.hypot(x - LAMP8.x, (y - LAMP8.y) * 1.6);
      if (blooms(wx, wy) > 0.5) { o.C = 0.45 + 0.3 * noise(x * 0.3, y * 0.3); o.K = 0.3; o.D = 0.6; o.B = 0.3; return; }
      if (house.at(wx, wy) > 0.5 && !(steps(wx, wy) > 0.5 && y > 395)) {
        if (inWin(wx, wy)) { const bar = bars(wx, wy) > 0.5; o.C = bar ? 0.06 : 0.3 + 0.22 * noise(x * 0.03, y * 0.03) + 0.1 * (y / 360); o.D = 0.7; o.b = bar ? 0 : 1; return; }
        if (sills(wx, wy) > 0.5) { o.C = mud(wx, wy) > 0.5 ? 0.06 : 0.3; o.D = 0.72; return; }
        const block = M.stone(1, 26, 14); const H = { nx: 0, ny: 0, nz: 1, x, y: -y, z: 0 }; block(H);
        o.C = (ivy(wx, wy) > 0.5 ? 0.05 + 0.08 * noise(x * 0.3, y * 0.3) : 0.04 + 0.1 * H.al) * (0.6 + 0.6 * house.shade(wx, wy, 1, -0.3)); o.D = 0.7; return;
      }
      if (steps(wx, wy) > 0.5) { o.C = 0.12 + 0.12 * (((y - 400) % 22) < 4 ? 1 : 0); o.D = 0.75; return; }
      if (hedge.at(wx, wy) > 0.5) { const s = hedge.shade(wx, wy, 0.5, -1); o.C = 0.04 + 0.16 * s ** 2 * (0.6 + 0.6 * noise(x * 0.2, y * 0.2)); o.K = 0.4; o.D = 0.6; o.B = 0.3; return; }
      if (bushes.at(x + (noise(x * 0.15, y * 0.15) - 0.5) * 12, y + (noise(x * 0.15 + 3, y * 0.15) - 0.5) * 12) > 0.5) { const s = bushes.shade(wx, wy, 0.5, -1); o.C = 0.03 + 0.14 * s ** 3 * (0.5 + 0.8 * noise(x * 0.25, y * 0.25)); o.K = 0.4; o.D = 0.55; o.B = 0.3; return; }
      if (shed.at(wx, wy) > 0.5 || roof(wx, wy) > 0.5) {
        if (roof(wx, wy) > 0.5) { o.C = 0.1 + 0.08 * ((Math.floor(x / 8) % 2) ? 1 : 0); o.D = 0.8; return; }
        const plank = ((x - 1110) % 22) < 2.5, dr = door(wx, wy) > 0.5, edge = dr && (Math.abs(x - 1150) < 3 || Math.abs(x - 1242) < 3 || Math.abs(y - 300) < 3 || Math.abs(y - 430) < 4);
        o.C = plank || edge ? 0.03 : 0.09 + 0.06 * noise(x * 0.02, y * 0.2); o.D = 0.8; o.K = 0.25;
        if (Math.hypot(x - 1228, y - 448) < 7) { o.C = 0.5; }
        return;
      }
      if (post(wx, wy) > 0.5) { o.C = 0.04; o.K = 0.4; o.D = 0.4; return; }
      if (glass(wx, wy) > 0.5) { const bar = glassBars(wx, wy) > 0.5; o.C = bar ? 0.08 : 0.18 + 0.12 * noise(x * 0.05, y * 0.05) + 0.1 * smooth(300, 240, y); o.D = 0.3; return; }
      if (cypress(wx, wy) > 0.5) { o.C = 0.04 + 0.05 * noise(x * 0.3, y * 0.1); o.D = 0.3; return; }
      if (y > 360) {
        const onPath = gravel(wx, wy) > 0.5, gp = ground(x, y, 360, 640);
        const grass = noise(x * 0.3 / (0.3 + gp.t), y * 0.05 / (0.3 + gp.t)), wet = 0.06 * smooth(0.6, 0.8, noise(x * 0.01, y * 0.04));
        o.C = onPath ? 0.2 + 0.12 * hash(x >> 1, y >> 1) : 0.05 + 0.1 * grass + wet + 0.12 * Math.exp(-(y - 360) / 50);
        if (prints(wx, wy) > 0.5) o.C *= 0.3;
        o.K = onPath ? 1.0 : 0.5; o.D = 0.3 + 0.65 * gp.t; return;
      }
      const lx = x + (noise(x * 0.11, y * 0.11) - 0.5) * 22 + (hash(x >> 2, y >> 2) - 0.5) * 6, ly = y + (noise(x * 0.11 + 7, y * 0.11) - 0.5) * 22;
      if (treesNear(lx, ly) > 0.5) { o.C = 0.03 + 0.06 * noise(x * 0.05, y * 0.05) * smooth(0.4, 0.8, noise(x * 0.2, y * 0.2)); o.D = 0.5; return; }
      if (trees(lx, ly) > 0.5) { o.C = 0.05 + 0.07 * smooth(0.5, 0.8, noise(x * 0.06, y * 0.06)) + 0.05 * Math.exp(-((md / 160) ** 2)); o.D = 0.2; o.K = lampD < 120 ? 0.3 : 0; return; }
      o.C = sky; o.b = md < 18 ? 0 : 1; o.D = 0;
    });
  },
  glsl: `
const vec2 LP8 = vec2(${LAMP8.x.toFixed(1)}, ${LAMP8.y.toFixed(1)});
void scene(vec2 sp, vec4 b, vec4 a, float t, inout float C, inout float W) {
  float flick = 0.85 + 0.15 * noise(vec2(t * 4.0, 1.0));
  float glow = flick * (g2(sp, LP8, 16.0) + 0.4 * g2(vec2(sp.x, LP8.y + (sp.y - LP8.y) * 1.8), LP8, 60.0) + 0.1 * g2(sp, LP8, 140.0));
  W = b.g * 2.0 * glow;
  vec2 q = sp - LP8;
  if (abs(q.x) < 6.0 && abs(q.y) < 9.0) { bool frame = abs(q.x) > 4.0 || abs(q.y) > 7.0; W = frame ? 0.1 : 1.3 * flick; C = frame ? 0.02 : 0.45; }
  // Clouds drift across the moon; the sky darkens and the light on everything dips.
  float cl = smoothstep(0.5, 0.75, fbm(vec2(sp.x * 0.004 + t * 0.012, sp.y * 0.018)));
  if (a.b > 0.5 && b.a < 0.05) C = mix(C, C * 0.6, cl);
  float pass = pow(0.5 + 0.5 * sin(t * 0.15), 8.0);
  C *= 1.0 - 0.25 * pass * (1.0 - step(0.9, C));
  // The white flowers and leaves stir in the breeze.
  if (b.b > 0.2 && b.b < 0.4) C += 0.05 * sin(t * 1.5 + sp.x * 0.05 + sp.y * 0.03) * C;
  // The lit windows shimmer faintly (moonlight through the greenhouse behind them).
  if (a.b > 0.5 && b.a > 0.5) C += 0.03 * sin(t * 0.8 + sp.y * 0.05);
}`,
});
