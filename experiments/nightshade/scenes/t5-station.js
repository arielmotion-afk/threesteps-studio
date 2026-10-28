// Title · the station at sunrise: side-on from across the line, in clear layers front to back
// (reference: refs/titles/5-station/v2/result.webp). The track; the platform edge; the platform
// under its canopy, with a "next train" board (LONDON, and a clock whose hands the porter sets by
// hand: scene.setHour), an empty bench with a portfolio left on it, a lamp still lit, milk churns;
// the station house with its lit window; then a fence, and rows of trees fading into the dawn mist;
// the sky warming to pink with the sun just over the canopy roof. Everything on the platform is a
// silhouette against the bright mist.
// Moves: clouds drift and birds cross; every half minute the morning train rushes through on the
// near track, a big dark blur, leaving its steam along the line; the hands move when set; the lamp and window flicker.

const CLOCK_T5 = { x: 333, y: 362, r: 25 };

SCENES.push({
  id: "title_station",
  title: "LONDON",
  sway: 0, // no camera drift (it sweeps bands across the frame)
  orderedMix: true, // blue to pink in an ordered pattern, not grain
  lift: 0.14,
  uniforms: { uHands: "vec2" },
  hour: 8,
  hands: [8, 0],
  setHour(h) { this.hour = ((h % 12) + 12) % 12 || 12; },
  update(t) {
    // the hands sweep to the set hour (the minute hand goes round), easing
    const target = this.hour * 60, cur = this.hands[0] * 60 + this.hands[1];
    let d = target - cur; if (d > 360) d -= 720; if (d < -360) d += 720;
    const next = cur + d * 0.06, m = ((next % 720) + 720) % 720;
    this.hands = [Math.floor(m / 60), m % 60];
    return { uHands: [(m / 720) * 2 * Math.PI, ((m % 60) / 60) * 2 * Math.PI] };
  },
  // the morning train, drawn once (not baked): engine, tender and three carriages, side-on, facing
  // right. One canvas pixel is one screen pixel. Channels: R cool light, G warm (lit windows, the
  // firebox), B pink (the sunrise catching top edges), A coverage.
  sprite() {
    const c = document.createElement("canvas"); c.width = 944; c.height = 150;
    const g = c.getContext("2d");
    const col = (C, K = 0, P = 0) => `rgb(${Math.round(C * 255)},${Math.round(K * 255)},${Math.round(P * 255)})`;
    const rect = (x, y, w, h, f) => { g.fillStyle = f; g.fillRect(x, y, w, h); };
    const wheel = (x, y, r, spokes) => {
      g.fillStyle = col(0.06); g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
      g.strokeStyle = col(0.15); g.lineWidth = 1.5; for (let k = 0; k < spokes; k++) { const a = (k / spokes) * TAU; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); g.stroke(); }
      g.strokeStyle = col(0.24, 0, 0.2); g.lineWidth = 2.5; g.beginPath(); g.arc(x, y, r - 1.5, 0, TAU); g.stroke();
      g.fillStyle = col(0.3); g.beginPath(); g.arc(x, y, Math.max(2, r * 0.18), 0, TAU); g.fill();
    };
    // three carriages
    for (let k = 0; k < 3; k++) {
      const c0 = 8 + k * 216;
      rect(c0 + 10, 118, 190, 8, col(0.04));
      for (const bx of [c0 + 42, c0 + 168]) { rect(bx - 25, 121, 50, 9, col(0.05)); wheel(bx - 13, 138, 10, 6); wheel(bx + 13, 138, 10, 6); }
      rect(c0, 50, 210, 70, col(0.1));
      rect(c0 + 2, 42, 206, 9, col(0.08)); rect(c0 + 5, 39, 200, 3, col(0.3, 0, 0.75)); // roof, rimmed pink
      rect(c0, 89, 210, 3, col(0.2));
      g.strokeStyle = col(0.17); g.lineWidth = 2; g.strokeRect(c0 + 7, 96, 196, 19);
      for (let i = 0; i < 7; i++) { const wx = c0 + 13 + i * 27, lit = hash(i, k) > 0.25; rect(wx, 59, 19, 25, lit ? col(0.28, 0.9) : col(0.12, 0.25)); g.strokeStyle = col(0.18); g.lineWidth = 2; g.strokeRect(wx, 59, 19, 25); }
      for (const dx of [67, 145]) { rect(c0 + dx, 53, 2, 64, col(0.05)); rect(c0 + dx + 5, 98, 2, 2, col(0.35)); }
      if (k < 2) rect(c0 + 210, 110, 6, 5, col(0.05)); else rect(c0 + 210, 110, 6, 5, col(0.05));
    }
    // the tender, heaped with coal
    const t0 = 656;
    rect(t0, 118, 82, 8, col(0.05)); for (const x of [t0 + 15, t0 + 41, t0 + 67]) wheel(x, 138, 10, 6);
    rect(t0, 70, 82, 50, col(0.09)); rect(t0, 68, 82, 3, col(0.3, 0, 0.7));
    g.fillStyle = col(0.04); g.beginPath(); g.moveTo(t0 + 2, 70); for (let x = 0; x <= 78; x += 6) g.lineTo(t0 + 2 + x, 62 + 4 * hash(x, 3)); g.lineTo(t0 + 80, 70); g.fill();
    g.strokeStyle = col(0.16); g.lineWidth = 2; g.strokeRect(t0 + 6, 80, 70, 32);
    rect(t0 + 82, 110, 6, 5, col(0.05));
    // the engine
    const L = 742;
    rect(L, 112, 192, 6, col(0.13)); rect(L, 111, 192, 1, col(0.3, 0, 0.5));
    rect(L + 56, 58, 128, 52, col(0.11)); rect(L + 56, 57, 128, 4, col(0.26, 0, 0.75)); // boiler, its top catching the sunrise
    for (const bx of [L + 82, L + 112, L + 142]) rect(bx, 59, 3, 51, col(0.06));
    g.fillStyle = col(0.12); g.beginPath(); g.ellipse(L + 120, 58, 12, 10, 0, Math.PI, TAU); g.fill(); rect(L + 110, 48, 20, 2, col(0.28, 0, 0.7)); // dome
    rect(L + 168, 54, 20, 58, col(0.07)); // smokebox
    rect(L + 164, 28, 14, 30, col(0.07)); rect(L + 160, 23, 22, 7, col(0.08)); rect(L + 160, 22, 22, 2, col(0.3, 0, 0.75)); // chimney
    rect(L, 42, 58, 72, col(0.1)); rect(L - 4, 35, 66, 8, col(0.08)); rect(L - 4, 34, 66, 2, col(0.3, 0, 0.75)); // cab
    rect(L + 14, 54, 28, 24, col(0.3, 0.95)); g.strokeStyle = col(0.18); g.lineWidth = 2; g.strokeRect(L + 14, 54, 28, 24); // cab window, the firebox glow
    rect(L + 160, 116, 30, 16, col(0.08)); rect(L + 160, 115, 30, 2, col(0.26));
    for (const x of [L + 62, L + 108, L + 154]) wheel(x, 126, 22, 10);
    wheel(L + 184, 138, 10, 6);
    rect(L + 62, 128, 92, 4, col(0.32, 0, 0.25)); // the coupling rod
    rect(L + 188, 106, 6, 16, col(0.1)); rect(L + 190, 109, 6, 3, col(0.25)); rect(L + 190, 117, 6, 3, col(0.25));
    rect(L + 180, 94, 7, 7, col(0.3, 1)); // the head lamp
    return c;
  },
  bake() {
    const M2 = makeMask, SUN = [818, 202], PLAT = 503;
    // ── the canopy: two sections, a tiled roof, a fascia with a scalloped edge ──
    const SECT = [[-10, 759, 195, 231, 272], [759, 1062, 219, 240, 276]]; // x0, x1, roof top, fascia top, scallop line
    const roof = M2((g) => { for (const [x0, x1, rt, ft] of SECT) { g.beginPath(); g.moveTo(x0, ft); g.lineTo(x0, rt); g.lineTo(x1 - 14, rt); g.lineTo(x1, ft); g.closePath(); g.fill(); } });
    const fascia = M2((g) => { for (const [x0, x1, , ft, sl] of SECT) { g.fillRect(x0, ft, x1 - x0, sl - ft); for (let x = x0 + 9; x < x1; x += 18) { g.beginPath(); g.arc(x, sl, 9, 0, Math.PI); g.fill(); } } });
    const posts = M2((g) => {
      for (const x of [71, 747, 1000]) {
        g.fillRect(x - 7, 280, 14, PLAT - 280); g.fillRect(x - 11, PLAT - 14, 22, 14); g.fillRect(x - 10, 284, 20, 8);
        g.lineWidth = 6; g.beginPath(); g.moveTo(x - 48, 282); g.quadraticCurveTo(x - 8, 286, x - 6, 326); g.moveTo(x + 48, 282); g.quadraticCurveTo(x + 8, 286, x + 6, 326); g.stroke();
      }
    });
    const pole = M2((g) => { g.fillRect(66, 80, 10, 205); g.fillRect(40, 96, 62, 6); g.fillRect(46, 114, 50, 5); });
    const wires = M2((g) => { g.lineWidth = 2; for (const [y0, y1] of [[98, 150], [98, 166], [116, 182]]) { g.beginPath(); g.moveTo(44 + (y1 - 150) * 0.5, y0); g.quadraticCurveTo(640, y0 + 60, 1290, y1 - 40); g.stroke(); } });
    // ── the board, the bench, the lamp, the churns ──
    const board = M2((g) => g.fillRect(278, 300, 110, 108)); // LONDON and the clock, evenly spaced inside
    const chains = M2((g) => { g.lineWidth = 2.5; for (const x of [291, 375]) for (let y = 272; y < 302; y += 7) { g.beginPath(); g.ellipse(x, y + 3, 2, 3.5, 0, 0, TAU); g.stroke(); } });
    const sign = pixelSign(["LONDON"], 166, 160, { scale: 1, gap: 1, font: PIXEL_CAPS_SMALL });
    const bench = M2((g) => {
      g.fillRect(400, 470, 272, 7); for (const y of [430, 443, 456]) g.fillRect(404, y, 264, 7);
      for (const x of [412, 652]) { g.fillRect(x, 424, 8, PLAT - 424); } for (const x of [430, 634]) g.fillRect(x, 477, 7, PLAT - 477);
    });
    const folio = M2((g) => { g.fillRect(606, 450, 36, 20); g.fillRect(617, 445, 14, 6); });
    const lamp = M2((g) => { g.fillRect(800, 336, 8, PLAT - 336); g.fillRect(795, PLAT - 14, 18, 14); g.fillRect(791, 304, 26, 34); g.beginPath(); g.moveTo(787, 306); g.lineTo(804, 292); g.lineTo(821, 306); g.fill(); });
    const lampGlass = M2((g) => g.fillRect(796, 311, 16, 24));
    const churns = M2((g) => { for (const x of [873, 911, 949]) { g.fillRect(x - 16, 448, 32, PLAT - 448); g.fillRect(x - 11, 436, 22, 13); g.fillRect(x - 14, 431, 28, 6); } });
    // ── the station house ──
    const house = M2((g) => { g.fillRect(1024, 258, 260, PLAT - 258); });
    const houseRoof = M2((g) => { g.beginPath(); g.moveTo(1010, 262); g.lineTo(1150, 178); g.lineTo(1290, 178); g.lineTo(1290, 262); g.fill(); g.fillRect(1176, 84, 42, 98); g.fillRect(1170, 80, 54, 8); });
    const win = M2((g) => g.fillRect(1114, 316, 68, 104));
    const winBars = M2((g) => { g.fillRect(1146, 316, 5, 104); g.fillRect(1114, 362, 68, 5); g.lineWidth = 7; g.strokeRect(1114, 316, 68, 104); g.fillRect(1106, 420, 84, 7); });
    const door = M2((g) => g.fillRect(1240, 330, 50, PLAT - 330));
    // ── behind the platform: a fence, rows of trees in the mist ──
    const fence = M2((g) => { g.fillRect(-10, 452, 1040, 3); g.fillRect(-10, 465, 1040, 3); for (let x = 0; x < 1030; x += 34) g.fillRect(x, 446, 4, 30); });
    const treeRow = (base, amp, step, seed) => M2((g) => {
      g.beginPath(); g.moveTo(-10, 720);
      for (let x = -10; x <= 1290; x += 4) {
        let top = base + 6 * Math.sin(x * 0.01 + seed);
        for (let k = -1; k <= 1; k++) { const c = Math.round(x / step) * step + k * step, r = step * (0.55 + 0.4 * hash(c, seed)), h = amp * (0.5 + 0.6 * hash(c, seed + 1)); const dx = (x - c) / r; if (Math.abs(dx) < 1) top = Math.min(top, base - h * Math.sqrt(1 - dx * dx)); }
        g.lineTo(x, top);
      }
      g.lineTo(1290, 720); g.closePath(); g.fill();
    });
    const rows = [treeRow(352, 38, 70, 1), treeRow(378, 42, 64, 2), treeRow(406, 40, 56, 3), treeRow(436, 34, 50, 4)];
    const sky = (x, y) => {
      const ds = Math.hypot(x - SUN[0], (y - SUN[1]) * 1.6), glow = Math.exp(-ds / 110) + 0.35 * Math.exp(-ds / 320);
      const horizon = Math.exp(-(((y - 330) / 60) ** 2)), warmth = clamp(0.6 * glow + 0.45 * horizon);
      return { C: (0.2 + 0.24 * smooth(0, 340, y)) * (1 - 0.75 * warmth), B: warmth };
    };
    return bakeGrid(...FRAME.grid, (x, y, o) => {
      // ── the track ──
      if (y > 592) {
        const rail = (y > 608 && y < 615) || (y > 645 && y < 654), head = (y > 608 && y < 611) || (y > 645 && y < 648);
        if (rail) { o.C = head ? 0.5 : 0.1; o.B = head ? 0.55 * Math.exp(-(((x - SUN[0]) / 360) ** 2)) + 0.1 : 0; o.D = 0.95; return; }
        const sleeper = ((y > 615 && y < 626) || (y > 654 && y < 666)) && x % 44 < 30, stone = hash(x >> 2, y >> 2);
        o.C = sleeper ? 0.05 : 0.06 + 0.12 * stone * stone; o.D = 0.95; return;
      }
      // ── the platform edge and top ──
      if (y > 527) { const joint = y < 531 || ((x / 92 + (Math.floor((y - 531) / 30) % 2) * 0.5) % 1) < 0.02 || (y - 531) % 30 < 2; o.C = y < 531 ? 0.5 : joint ? 0.04 : 0.08 + 0.02 * hash(Math.floor(x / 92), y >> 4); o.D = 0.9; return; }
      if (y > PLAT) {
        // wet flags: the sky's pink caught near the sun, the lamp's orange under it
        const refl = Math.exp(-(((x - SUN[0]) / 170) ** 2)), lampPool = Math.exp(-Math.hypot(x - 804, (y - PLAT) * 3) / 50);
        o.C = 0.2 + 0.06 * noise(x * 0.05, y * 0.3) + 0.08 * refl; o.B = 0.4 * refl; o.K = 0.9 * lampPool; o.D = 0.85; return;
      }
      // ── the board, its clock and lettering ──
      if (Math.hypot(x - CLOCK_T5.x, y - CLOCK_T5.y) < CLOCK_T5.r) {
        // a plain white face (bright enough to print as one flat colour), a dark rim, twelve short hour lines
        const dc = Math.hypot(x - CLOCK_T5.x, y - CLOCK_T5.y), a = Math.atan2(x - CLOCK_T5.x, CLOCK_T5.y - y), near = Math.round((a / TAU) * 12) / 12 * TAU;
        const mark = dc > CLOCK_T5.r * 0.68 && dc < CLOCK_T5.r - 4 && Math.abs(Math.sin(a - near)) * dc < 1.1;
        o.C = dc > CLOCK_T5.r - 3 ? 0.06 : mark ? 0.06 : 0.95; o.r = 1; o.D = 0.8; return;
      }
      if (board(x, y) > 0.5) { const lw = sign(x >> 1, y >> 1), inset = board(x - 6, y) > 0.5 && board(x + 6, y) > 0.5 && board(x, y - 6) > 0.5 && board(x, y + 6) > 0.5; o.C = lw === 1 ? 0.85 : inset ? 0.06 : 0.22; o.D = 0.8; return; }
      if (chains(x, y) > 0.5) { o.C = 0.12; o.D = 0.8; return; }
      // ── on the platform, silhouettes ──
      if (folio(x, y) > 0.5) { o.C = folio(x, y - 3) < 0.5 ? 0.26 : 0.1; o.B = folio(x, y - 3) < 0.5 ? 0.2 : 0; o.D = 0.8; return; }
      if (bench(x, y) > 0.5) { o.C = bench(x, y - 3) < 0.5 ? 0.16 : 0.06; o.D = 0.8; return; }
      if (lampGlass(x, y) > 0.5) { o.C = 0.3; o.K = 1.7; o.a = 1; o.D = 0.8; return; }
      if (lamp(x, y) > 0.5) { const near = Math.exp(-Math.hypot(x - 804, y - 322) / 30); o.C = 0.07; o.K = 0.5 * near; o.a = near > 0.2 ? 1 : 0; o.D = 0.8; return; }
      if (churns(x, y) > 0.5) { const c = ((x - 857) % 38) / 32, rim = c > 0.8 && c < 1; o.C = 0.12 + 0.12 * Math.sin(Math.PI * clamp(c)) ** 3 + (rim ? 0.1 : 0); o.B = rim ? 0.3 : 0; o.D = 0.8; return; }
      if (posts(x, y) > 0.5) { const rim = posts(x + 3, y) < 0.5; o.C = rim ? 0.16 : 0.06; o.B = rim ? 0.2 : 0; o.D = 0.8; return; }
      if (fascia(x, y) > 0.5) { const orn = (x % 18 < 3) && y < 266; o.C = orn ? 0.12 : 0.07; o.D = 0.75; return; }
      if (roof(x, y) > 0.5) { const top = roof(x, y - 3) < 0.5, tile = (Math.floor(x / 10) + Math.floor(y / 6)) % 2; o.C = top ? 0.3 : 0.08 + 0.03 * tile; o.B = top ? 0.6 * Math.exp(-Math.abs(x - SUN[0]) / 260) : 0; o.D = 0.75; return; }
      // ── the station house ──
      if (houseRoof(x, y) > 0.5) { const top = houseRoof(x, y - 3) < 0.5, tile = (Math.floor(x / 10) + Math.floor(y / 6)) % 2; o.C = top ? 0.26 : 0.07 + 0.03 * tile; o.B = top ? 0.4 : 0; o.D = 0.75; return; }
      if (house(x, y) > 0.5) {
        if (win(x, y) > 0.5) { if (winBars(x, y) > 0.5) { o.C = 0.06; o.D = 0.75; return; } o.C = 0.3; o.K = 1.25 * (0.85 + 0.15 * smooth(316, 420, y)); o.a = 1; o.D = 0.75; return; }
        if (winBars(x, y) > 0.5) { o.C = 0.2; o.D = 0.75; return; }
        if (door(x, y) > 0.5) { o.C = 0.05 + ((x - 1240) % 14 < 2 ? 0.03 : 0); o.D = 0.75; return; }
        const row = Math.floor(y / 14), joint = y % 14 < 2 || ((x / 30 + (row % 2) * 0.5) % 1) < 0.07;
        o.C = joint ? 0.05 : 0.1 + 0.05 * hash(Math.floor(x / 30 + (row % 2) * 0.5), row); o.D = 0.75; return;
      }
      if (pole(x, y) > 0.5) { o.C = 0.07; o.D = 0.4; return; }
      if (cover(wires, x, y) > 0.3) { o.C = 0.07; o.D = 0.4; return; }
      if (fence(x, y) > 0.5) { o.C = 0.14; o.D = 0.5; return; }
      // ── the trees in the mist: each row nearer is darker; mist lies in the dips ──
      for (let i = 3; i >= 0; i--) {
        if (rows[i](x, y) > 0.5) { const s = sky(x, 320), depth = [0.42, 0.36, 0.3, 0.22][i], mist = smooth(360 + i * 28, 470, y); o.C = depth + 0.08 * mist; o.B = (0.45 - i * 0.08) * s.B + 0.1 * mist; o.D = 0.2 + i * 0.05; return; }
      }
      // ── the sky ──
      if (Math.hypot(x - SUN[0], y - SUN[1]) < 34) { o.C = 0.9; o.B = 1; o.b = 1; o.D = 0; return; }
      const s = sky(x, y); o.C = s.C; o.B = s.B; o.b = 1; o.D = 0;
    });
  },
  glsl: `
const vec2 CLK = vec2(${CLOCK_T5.x.toFixed(1)}, ${CLOCK_T5.y.toFixed(1)});
const float CLR = ${CLOCK_T5.r.toFixed(1)};
float segD(vec2 p, vec2 a, vec2 b) { vec2 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0); return length(pa - ba * h); }
void scene(vec2 sp, vec4 b, vec4 a, float t, inout float C, inout float W) {
  float rise = min(t / 50.0, 1.0);
  float flick = 0.88 + 0.1 * noise(vec2(t * 3.0, 2.0)) + 0.02 * sin(t * 17.0);
  // pink for the dawn; the lamp and the lit window print orange
  gPink = a.a > 0.5 ? 0.0 : 1.0;
  W = b.g * 2.0 * flick + b.b * (0.85 + 0.25 * rise);
  // the sky, alive: soft streaks of cloud drifting across, lit pink near the sun; a bird now and then
  if (a.b > 0.5) {
    float cl = smoothstep(0.55, 0.8, noise(vec2((sp.x - t * 7.0) * 0.0045, sp.y * 0.045)) * 0.75 + noise(vec2((sp.x - t * 11.0) * 0.015, sp.y * 0.09)) * 0.25);
    float nearSun = exp(-length((sp - vec2(818.0, 202.0)) * vec2(1.0, 1.6)) / 260.0);
    C += cl * 0.08 * (1.0 - nearSun); W += cl * 0.35 * nearSun;
    for (int i = 0; i < 4; i++) {
      float fi = float(i), cyc = mod(t * 26.0 + fi * 430.0, 2600.0) - 300.0;
      vec2 p = vec2(cyc, 120.0 + 50.0 * sin(fi * 2.3) + 5.0 * sin(t * 0.8 + fi));
      vec2 q = sp - p; float flap = sin(t * 8.0 + fi * 1.9);
      if (abs(q.x) < 6.0 && abs(q.y - (abs(q.x) * 0.45 - 1.5) * (flap * 0.35 + 0.65)) < 1.2) { C = 0.08; W = 0.0; }
    }
  }
  // the morning train: every half minute a big dark mass rushes through on the near track, too fast
  // to make out: a black silhouette smeared along its motion, a thin rim of sunrise along its top,
  // the odd dull glint of a window; its steam hangs low along the line after it
  const float SC = 2.4, SPEED = 2600.0;
  float tc = mod(t - 4.0, 30.0), x0 = tc * SPEED - 2700.0;
  bool onTrain = false;
  float cov = 0.0, rimc = 0.0, glint = 0.0;
  for (int k = 0; k < 8; k++) {
    vec2 tp = vec2((sp.x - x0 + float(k) * 9.0) / SC, (sp.y - 296.0) / SC);
    if (tp.x >= 0.0 && tp.x < uSpriteSize.x && tp.y >= 0.0 && tp.y < uSpriteSize.y) {
      vec4 s = texture(uSprite, (floor(tp) + 0.5) / uSpriteSize);
      cov += s.a; rimc += s.a * s.b; glint += s.a * s.g;
    }
  }
  cov /= 8.0; rimc /= 8.0; glint /= 8.0;
  if (cov > 0.15 + 0.7 * bayer(sp / 2.0)) {
    onTrain = true; gPink = 1.0;
    C = 0.03 + 0.03 * cov; W = rimc * 1.1;
    if (glint > 0.35) { W = 0.1 * glint; gPink = 0.0; } // the windows: only a dull red glint
  }
  bool onBoard = sp.x > 272.0 && sp.x < 394.0 && sp.y > 262.0 && sp.y < 414.0; // the steam never covers the board
  if (!onTrain && !onBoard) {
    for (int i = 0; i < 18; i++) {
      float age = float(i) * 0.14, te = tc - age;
      if (te < 0.0) continue;
      vec2 c = vec2(te * SPEED - 2700.0 + 1794.0 * SC / 2.0 - age * 60.0, 360.0 - age * 22.0);
      float r = 18.0 + age * 34.0, d = length((sp - c) * vec2(1.0, 1.3));
      if (d < r && noise((sp - c) * 0.06 + float(i) * 3.1) > 0.25 + age * 0.25) { C = mix(C, 0.42, 0.75 - age * 0.3); W = mix(W, 0.15, 0.3); gPink = 1.0; }
    }
  }
  // the clock hands, set by hand
  if (a.r > 0.5) {
    vec2 hd = vec2(sin(uHands.x), cos(uHands.x)), md = vec2(sin(uHands.y), cos(uHands.y));
    vec2 q = vec2(sp.x - CLK.x, CLK.y - sp.y);
    if (segD(q, vec2(0.0), hd * CLR * 0.48) < 1.5 || segD(q, vec2(0.0), md * CLR * 0.72) < 1.1 || length(q) < 2.0) { C = 0.05; W = 0.0; }
  }
}`,
});

// Mobile: the middle of the platform: the LONDON board, the bench with the portfolio, the lamp and the
// churns under the canopy, the sun over its roof, a tall dawn sky above, the track below (where the
// train comes through).
SCENES.push(mobile(SCENES.find((s) => s.id === "title_station"), { view: [230, -300, 1.0] }));
