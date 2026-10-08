// Bubbles: the WebGL header/footer scene. Big type drawn into a texture, soft glass bubbles that
// bend it, drift on their own, get pushed by the cursor and can be dragged. One scene per section:
//   Bubbles.scene(sectionEl, canvasEl, { a: [lines], b: [lines], center, pills, homes, phone, glow, glow2, scale, seed })
// Falls back to the section's own HTML text (.no-gl) when WebGL isn't available.
(function () {
// Colour schemes: glow core, glow field, ink, bubble tint (3 stops seen through the bubbles) and tint strength
const SCHEMES = {
  'Ice chrome':     { core: '#3FB6FF', core2: '#A98BFF', field: '#E4E9F1', ink: '#060A16', tint: ['#ffffff', '#B49CFF', '#5CF2DC'], tk: .38, fk: 1.25 },
};
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
let S = SCHEMES['Ice chrome'];
// Tuned with Ariel (slider session, Oct 2026)
const P = { size: .9, wobble: .63, jiggle: .4, settle: .908, stretch: 1, drift: .6, driftSpeed: .22, push: 4.7, reach: .98, spring: .006, damping: .942, lens: 1.93, edge: .06, film: 1.2, bloom: .16 };   // Ariel's tuned values
// Type pairings: top two lines (name) and bottom two lines (discipline); size = fraction of width
const TYPES = {
  'Mona Sans wide':  { a: "900 F 'Mona Sans'", as: 13.5, at: -.04, b: "900 F 'Mona Sans'", bs: 4.8, bt: -.02 },   // big name, small discipline
};
let T = TYPES['Mona Sans wide'], redraw = () => {};

// One scene = one section with its own canvas, text lines and bubbles (used by the header and the footer)
const redraws = []; redraw = () => redraws.forEach((f) => f());
async function scene(hero, cv, cfg) {
  const gl = cv.getContext('webgl', { premultipliedAlpha: false, antialias: false });
  if (!gl) { hero.classList.add('no-gl'); return; }
  await Promise.all(Object.values(TYPES).flatMap((x) => [x.a, x.b]).map((f) => document.fonts.load(f.replace('F', '100px'))));

  // Type layer, redrawn at the current size (responsive)
  const tc = document.createElement('canvas'), tx = tc.getContext('2d'), sc = document.createElement('canvas'), sx = sc.getContext('2d'), pc = document.createElement('canvas'), px2 = pc.getContext('2d');
  let pillY = 0, pillDirty = true; const pills = (cfg.pills || []).map((o) => { const it = typeof o === 'string' ? { label: o } : { ...o }; Object.assign(it, { x: 0, y: 0, r: 0, vx: 0, vy: 0, vr: 0, cx: 0, cy: 0, w: 0, h: 0 });
    if (it.href) { const a = document.createElement('a'); a.className = 'bub-hit'; a.href = it.href; a.setAttribute('aria-label', it.aria || it.label); if (/^http|\.pdf$/.test(it.href)) { a.target = '_blank'; a.rel = 'noopener'; } hero.appendChild(a); it.a = a; }
    return it; });
  let W, H, dpr, phone;
  function drawType() {
    tc.width = W; tc.height = H; tx.clearRect(0, 0, W, H); tx.fillStyle = '#000';
    const vw = W / 100, k = (phone ? 1.85 : 1) * (cfg.scale || 1); let px = Math.min(T.as * k * vw, T.as * 15.5 * dpr), gr = Math.min(T.bs * k * vw, T.bs * 15.5 * dpr);
    // fit: never wider than 86% of the screen (matters on phones)
    const fit = (font, sp, size, lines) => { tx.font = font.replace('F', size + 'px'); tx.letterSpacing = (sp * size) + 'px'; const w = Math.max(...lines.map((l) => tx.measureText(l).width), 1); return Math.min(size, size * W * .86 / w); };
    px = fit(T.a, T.at, px, cfg.a); if (cfg.b.length) gr = fit(T.b, T.bt, gr, cfg.b);
    const C = cfg.center, blockH = px * (.82 + .86 * (cfg.a.length - 1)) + (cfg.b.length ? gr * (.95 + .88 * (cfg.b.length - 1)) : 0);
    let x = C ? W / 2 : 7 * vw, y = (C ? (H - blockH) / 2 - H * .03 : H * (phone ? cfg.topPhone : cfg.top)) + px * .82;   // centred: the whole block sits in the middle
    tx.textAlign = C ? 'center' : 'left';
    tx.font = T.a.replace('F', px + 'px'); tx.letterSpacing = (T.at * px) + 'px';
    cfg.a.forEach((line, n) => { if (n) y += px * .86; tx.fillText(line, x, y); });
    tx.font = T.b.replace('F', gr + 'px'); tx.letterSpacing = (T.bt * gr) + 'px';
    cfg.b.forEach((line, n) => { y += gr * (n ? .88 : .95); tx.fillText(line, x, y); }); tx.letterSpacing = '0px';
    sc.width = W; sc.height = H; sx.clearRect(0, 0, W, H); sx.filter = `blur(${14 * dpr}px)`; sx.drawImage(tc, 0, 0); sx.filter = 'none';   // blurred copy for the rim
    pillY = y + (cfg.b.length ? gr : px * .5) * .35; pillDirty = true;
    if (cfg.after) cfg.after.style.top = (y / dpr + (cfg.b.length ? gr : px * .5) / dpr * .35) + 'px';   // the row under the title (pills, or the email in the footer)
  }

  const vs = 'attribute vec2 p;void main(){gl_Position=vec4(p,0,1);}';
  const fs = `precision highp float;
  uniform vec2 res; uniform vec4 glow, glow2; uniform float t, dpr, tk, fk, uWob, uStretch, uLens, uEdge, uFilm, uBloom; uniform vec3 core2; uniform sampler2D type, soft, pills; uniform vec4 bv[5]; uniform vec3 b[5], core, field, ink, t0, t1, t2;
  float ty(vec2 q){ return texture2D(type, q / res).a; }
  float tyb(vec2 q, float w){ return mix(ty(q), texture2D(soft, q / res).a, w); }   // blend toward a pre-blurred copy: a true blur, no ghost copies
  void main(){
    vec2 fc = vec2(gl_FragCoord.x, res.y - gl_FragCoord.y), uv = fc / res;
    vec2 g = (uv - glow.xy - vec2(.03*sin(t*.3), .0)) * glow.zw;          // glow position and shape come from the scene
    float br = sin(t * .38);                                            // slow breath, about one every 16s
    vec3 col = mix(core, field, smoothstep(.0, .62, length(g) * (1.0 + .07 * br)));
    vec2 g2 = (uv - glow2.xy - vec2(.04*cos(t*.25), .03*sin(t*.33))) * glow2.zw;        // second glow, for depth
    col = mix(col, core2, (1.0 - smoothstep(.0, .38 * (1.0 + .08 * sin(t * .29 + 1.3)), length(g2))) * (.68 + .1 * sin(t * .29 + 1.3)));   // the second glow breathes on its own rhythm
    vec2 off = vec2(0.0); float rim = 0.0, soft = 0.0, bloom = 0.0, edgeBlur = 0.0; vec3 film = vec3(0.0), tint = vec3(0.0); float spec = 0.0;
    for (int i = 0; i < 5; i++) {
      if (b[i].z < 1.0) continue;                                       // unused slot
      float fi = float(i);
      vec2 d = (fc - b[i].xy) / b[i].z;
      // squash and stretch along the direction of travel (volume kept: long one way, thin the other)
      d *= vec2(1.0 + bv[i].w, 1.0 / (1.0 + bv[i].w));                  // idle breathing on a fixed axis (never flips)
      vec2 v = bv[i].xy; float sp = length(v); vec2 dir = sp > .001 ? v / sp : vec2(1., 0.);
      float st = min(.45 * uStretch, sp * .9 * uStretch) * smoothstep(.0, .02, sp);   // no stretch at a standstill, so its axis can't jitter
      float al = dot(d, dir), pe = dot(d, vec2(-dir.y, dir.x));
      d = dir * al / (1.0 + st) + vec2(-dir.y, dir.x) * pe * sqrt(1.0 + st);
      // jiggle: wobble modes that grow after a bump and ring down
      float j = bv[i].z, a = atan(d.y, d.x), tt = t * (1.0 + j * 2.5);
      float wob = 1.0 + uWob * ((.09 + j * .22) * sin(2.0 * a + tt * .9 + fi * 1.7)
                      + (.05 + j * .16) * sin(3.0 * a - tt * 1.3 + fi * 2.9)
                      + (.02 + j * .10) * sin(5.0 * a + tt * 2.1 + fi * .7));
      vec2 dn = d / wob; float r = length(dn);
      float aa = max(uEdge, 2.0 * dpr / b[i].z);                    // never thinner than ~2px, so the outline can't step
      float m = smoothstep(1.0, 1.0 - aa, r);
      float hr = (r - .97) * 9.0; bloom += exp(-hr * hr) * (1.0 - .6 * m);   // soft halo hugging the edge
      if (m > 0.0) {
        float h = sqrt(max(0.0, 1.0 - r * r));
        float fade = 1.0 - smoothstep(.72, 1.0, r);                     // bend eases to zero at the rim: no seam where inside meets outside
        off += -dn * (1.0 - h) * b[i].z * .5 * uLens * m * fade;
        edgeBlur = max(edgeBlur, smoothstep(.45, 1.0, r) * m);                       // lens: bend the type behind
        float e = pow(1.0 - h, 2.2) * m; rim = max(rim, e); soft = max(soft, m);
        film += (.5 + .5 * cos(6.2831 * (e * 1.3 + t * .05 + fi * .2 + vec3(0., .33, .67)))) * e;
        float f = .5 + .5 * sin(dn.x * 2.4 + dn.y * 1.7 + t * .4 + fi * 2.0);
        tint = max(tint, mix(mix(t0, t1, smoothstep(0., .5, f)), t2, smoothstep(.5, 1., f)) * m);
        spec += smoothstep(.55, .0, length(dn - vec2(-.36, -.4))) * .5 * m;
      }
    }
    // blur grows toward the rim so letters doubled by the bend dissolve; the colour split fades out there too
    float bl = soft * (.15 + .85 * edgeBlur), k = 5.0 * dpr * rim * (1.0 - edgeBlur * .9); vec2 q = fc + off;
    float ag = tyb(q, bl), ar = ag, ab = ag;
    if (k > .5 && soft > 0.0) { ar = mix(ag, tyb(q + vec2(k, 0.), bl), .6); ab = mix(ag, tyb(q - vec2(k, 0.), bl), .6); }
    col = mix(col, ink, vec3(ar, ag, ab));
    vec4 pl = texture2D(pills, q / res); col = mix(col, pl.rgb, pl.a);   // pills sit in the scene, so bubbles bend them too
    col = mix(col, tint, tk * soft);                                    // scheme tint seen through the bubble
    col = mix(col, mix(col, t1, .55) + .07, edgeBlur * .65);           // rim: lighter, with a lilac tint, so the edge never reads as a dark ring
    col += film * .6 * fk * uFilm + spec * .4 * fk;
    col += bloom * uBloom * mix(vec3(1.0), t1, .45) * .35;            // bloom: light spills softly past the edge
    col += (fract(sin(dot(fc, vec2(12.9898, 78.233))) * 43758.5453) - .5) * .035;
    gl_FragColor = vec4(col, 1.0);
  }`;
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw gl.getShaderInfoLog(s); return s; };
  const pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(pr); gl.useProgram(pr);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = (n) => gl.getUniformLocation(pr, n);
  const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
  [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T].forEach((p) => gl.texParameteri(gl.TEXTURE_2D, p, gl.CLAMP_TO_EDGE));
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  const tex2 = gl.createTexture(); gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, tex2);
  [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T].forEach((p) => gl.texParameteri(gl.TEXTURE_2D, p, gl.CLAMP_TO_EDGE));
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  // Bubbles: springy bodies. Home = resting spot; the cursor shoves them hard; drag to place.
  // five sizes, from one big lens down to a droplet
  let seed = cfg.seed || 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);   // small seeded random
  const bubbles = cfg.bubbles = cfg.homes.map((o, i) => ({ ...o, x: -1, y: 0, vx: 0, vy: 0, ph: rnd() * 6.28, f1: .6 + rnd() * .9, f2: .6 + rnd() * .9, f3: .5 + rnd(), ax: .6 + rnd() * .8, ay: .6 + rnd() * .8, jig: 0, pvx: 0, pvy: 0 }));
  let mx = -1e4, my = -1e4, pmx = 0, pmy = 0, smx = -1e4, smy = -1e4, svx = 0, svy = 0, drag = null;
  const pt = (e) => { const r = hero.getBoundingClientRect(); return [(e.clientX - r.left) * dpr, (e.clientY - r.top) * dpr]; };
  // Touch: a finger only pushes bubbles while it's actually down, and lifting it leaves no "ghost" cursor behind
  let touching = false;
  hero.addEventListener('pointermove', (e) => { if (e.pointerType === 'touch' && !touching) return; [mx, my] = pt(e); });
  hero.addEventListener('pointerleave', () => { mx = my = -1e4; });
  const lift = (e) => { if (e.pointerType === 'touch') { touching = false; mx = my = -1e4; } };
  addEventListener('pointercancel', (e) => { lift(e); drag = null; });   // a scroll gesture took over
  hero.addEventListener('pointerdown', (e) => { if (e.pointerType === 'touch') { touching = true; [mx, my] = pt(e); } const [x, y] = pt(e), m = Math.min(W, H); drag = bubbles.find((b) => Math.hypot(x - b.x, y - b.y) < b.r * m) || null; if (drag) { hero.setPointerCapture(e.pointerId); hero.style.cursor = 'grabbing'; } });
  addEventListener('pointerup', (e) => { lift(e); if (drag) { drag.hx = Math.min(.85, Math.max(.15, drag.x / W)); drag.hy = Math.min(.8, Math.max(.2, drag.y / H)); } drag = null; hero.style.cursor = ''; });

  // pills: rounded black chips with light text, laid out in a row under the title
  function drawPills() {
    pc.width = W; pc.height = H; px2.clearRect(0, 0, W, H);
    const fs0 = Math.min(15, Math.max(11, W / dpr * .011)) * dpr, gap = 8 * dpr;
    px2.textBaseline = 'middle';
    let x = W * .07, py = pillY;
    if (cfg.center) {                                                    // centred row: measure first, then start half its width left of centre
      let tw = 0; pills.forEach((p, n) => { const f = fs0 * (p.big ? 1.7 : 1); px2.font = `800 ${f}px 'Mona Sans', 'Inter Tight', sans-serif`; px2.letterSpacing = (f * (p.big ? .02 : .1)) + 'px'; tw += px2.measureText(p.label.replace(/\s*↗\uFE0E?/g, '')).width + f * 2.5 - f * .1 + (p.href ? f * 1.15 : 0) + (n ? gap : 0); });
      x = (W - tw) / 2;
    }
    pills.forEach((p) => {
      const fs = fs0 * (p.big ? 1.7 : 1), padX = fs * 1.25, padY = fs * .55;
      px2.font = `800 ${fs}px 'Mona Sans', 'Inter Tight', sans-serif`; px2.letterSpacing = (fs * (p.big ? .02 : .1)) + 'px';
      const label = p.label.replace(/\s*↗\uFE0E?/g, ''), aw = p.href ? fs * 1.15 : 0;   // links get a drawn arrow (never the ↗ character: iOS renders it as an emoji)
      p.w = px2.measureText(label).width + padX * 2 - fs * .1 + aw; p.h = fs + padY * 2;
      if (x + p.w > W * .94 && x > W * .07 + 1) { x = W * .07; py += p.h + gap; }   // wrap onto a new line instead of running off the screen
      p.cx = x + p.w / 2; p.cy = py + p.h / 2;
      px2.save(); px2.translate(p.cx + p.x, p.cy + p.y); px2.rotate(p.r * Math.PI / 180);
      px2.fillStyle = S.ink; px2.beginPath(); if (px2.roundRect) px2.roundRect(-p.w / 2, -p.h / 2, p.w, p.h, p.h / 2); else { const r = p.h / 2, l = -p.w / 2, tp = -p.h / 2; px2.moveTo(l + r, tp); px2.arcTo(l + p.w, tp, l + p.w, tp + p.h, r); px2.arcTo(l + p.w, tp + p.h, l, tp + p.h, r); px2.arcTo(l, tp + p.h, l, tp, r); px2.arcTo(l, tp, l + p.w, tp, r); } px2.fill();   // roundRect fallback for iOS < 16
      px2.fillStyle = S.field; px2.fillText(label, -p.w / 2 + padX, 1);
      if (aw) {                                                          // vector ↗: a diagonal with a corner head, in the chip's text colour
        const s2 = fs * .36, ax = p.w / 2 - padX - s2 * .9, ay = 0;
        px2.strokeStyle = S.field; px2.lineWidth = fs * .15; px2.lineCap = 'round'; px2.lineJoin = 'round';
        px2.beginPath(); px2.moveTo(ax - s2, ay + s2); px2.lineTo(ax + s2, ay - s2); px2.moveTo(ax - s2 * .35, ay - s2); px2.lineTo(ax + s2, ay - s2); px2.lineTo(ax + s2, ay + s2 * .35); px2.stroke();
      }
      px2.restore();
      if (p.a) Object.assign(p.a.style, { left: (p.cx - p.w / 2) / dpr + 'px', top: (p.cy - p.h / 2) / dpr + 'px', width: p.w / dpr + 'px', height: p.h / dpr + 'px' });
      x += p.w + gap;
    });
    gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, tex3); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, pc);
    pillDirty = false;
  }
  const tex3 = gl.createTexture(); gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, tex3);
  [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T].forEach((p) => gl.texParameteri(gl.TEXTURE_2D, p, gl.CLAMP_TO_EDGE));
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  let lastW = 0, lastH = 0;
  function resize(force) {
    // phones fire "resize" whenever the browser bar slides in or out; only rebuild when the section really changed size
    if (force !== true && hero.clientWidth === lastW && hero.clientHeight === lastH) return;
    lastW = hero.clientWidth; lastH = hero.clientHeight;
    const wasPhone = phone;
    dpr = Math.min(devicePixelRatio || 1, 2); phone = hero.clientWidth < 700;
    W = cv.width = Math.round(hero.clientWidth * dpr); H = cv.height = Math.round(hero.clientHeight * dpr);
    gl.viewport(0, 0, W, H); drawType();
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, tc);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, tex2); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, sc);
    if (phone && wasPhone !== true) bubbles.forEach((b, i) => { [b.hx, b.hy] = cfg.phone[i]; });   // only when switching into the phone layout
    cfg.relayout = () => bubbles.forEach((b, i) => { const h = cfg.homes[i] || { hx: .5, hy: .5, r: 0 }; b.r = h.r; [b.hx, b.hy] = phone ? (cfg.phone[i] || [.5, .5]) : [h.hx, h.hy]; b.jig = Math.max(b.jig, .25); b.x = -1; b.vx = b.vy = 0; });
  }
  resize(true); addEventListener('resize', () => resize()); redraws.push(() => resize(true));

  let on = true; new IntersectionObserver(([e]) => { on = e.isIntersecting; }).observe(hero);
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches, arr = new Float32Array(15), varr = new Float32Array(20);   // 5 slots; unused ones stay radius 0
  (function frame(now) {
    requestAnimationFrame(frame); if (!on) return;
    const t = still ? 0 : now / 1000, m = Math.min(W, H);
    // smoothed cursor position and speed (raw mouse samples are noisy)
    if (mx < -1e3) { smx = mx; smy = my; } else if (smx < -1e3) { smx = mx; smy = my; } else { smx += (mx - smx) * .18; smy += (my - smy) * .18; }
    const rvx = Math.max(-40, Math.min(40, mx - pmx)), rvy = Math.max(-40, Math.min(40, my - pmy)); pmx = mx; pmy = my;
    svx += ((mx < -1e3 ? 0 : rvx) - svx) * .15; svy += ((my < -1e3 ? 0 : rvy) - svy) * .15;
    bubbles.forEach((b, i) => {
      const R = b.r * m * (phone ? 1.25 : 1) * P.size;
      // idle wander: a few slow, unrelated sines so the path never repeats visibly
      const td = t * P.driftSpeed; const hx = (b.hx + (Math.sin(td * .23 * b.f1 + b.ph) * .03 * b.ax + Math.sin(td * .61 * b.f3 + b.ph * 3) * .012) * P.drift) * W, hy = (b.hy + (Math.cos(td * .19 * b.f2 + b.ph) * .035 * b.ay + Math.sin(td * .53 * b.f3 + b.ph * 2) * .014) * P.drift) * H;
      if (b.x < 0) { b.x = hx; b.y = hy; }
      if (drag === b) { b.vx = (mx - b.x) * .4; b.vy = (my - b.y) * .4; }
      else {
        b.vx += (hx - b.x) * P.spring; b.vy += (hy - b.y) * P.spring;          // soft spring home: floaty, overshoots
        // cursor: a smoothed position, a force that eases in from zero at the edge of its reach,
        // and the force itself ramps in gradually, so a bubble glides away instead of twitching
        // size matters: smaller bubbles get a shorter reach and a gentler push, so they move calmly in proportion
        const sz = Math.min(1, R / (Math.max(...bubbles.map((q) => q.r)) * m * P.size)), sk = Math.pow(sz, .8);
        const dx = b.x - smx, dy = b.y - smy, d = Math.hypot(dx, dy) || 1, reach = R * P.reach + 60 * dpr * sz;
        let tfx = 0, tfy = 0;
        if (d < reach) {
          const edge = Math.min(b.x, W - b.x, b.y, H - b.y) / (R * 1.2);    // pushes less near the walls
          const k = Math.pow(1 - d / reach, 2) * (3 - 2 * (1 - d / reach));   // smooth falloff: zero force at the edge of reach
          const f = k * P.push * dpr * .35 * sk * Math.min(1, Math.max(.15, edge));
          tfx = dx / d * f + svx * .04 * k * sk; tfy = dy / d * f + svy * .04 * k * sk;
        }
        b.fx = (b.fx || 0) + (tfx - (b.fx || 0)) * .08; b.fy = (b.fy || 0) + (tfy - (b.fy || 0)) * .08;
        b.vx += b.fx; b.vy += b.fy;
        b.vx *= P.damping; b.vy *= P.damping;
      }
      b.x += b.vx; b.y += b.vy; b.R = R;
      // soft walls: a cushion that eases bubbles back in. No position snapping, so nothing jitters at the edge.
      const pad = R * .45, wx = b.x < pad ? pad - b.x : b.x > W - pad ? W - pad - b.x : 0, wy = b.y < pad ? pad - b.y : b.y > H - pad ? H - pad - b.y : 0;
      // walls: ease the position back in and cancel only the outward speed. No force, no bounce, so nothing can oscillate.
      if (wx) { b.x += wx * .2; if (b.vx * wx < 0) b.vx = 0; }
      if (wy) { b.y += wy * .2; if (b.vy * wy < 0) b.vy = 0; }
      if (wx || wy) { b.pvx = b.vx; b.pvy = b.vy; }                     // wall contact doesn't count as an impact
    });
    // bubbles press into each other softly: a gentle force while overlapping, and approach speed is absorbed
    // (no teleporting, so pairs settle instead of fighting)
    for (let i = 0; i < bubbles.length; i++) for (let j = i + 1; j < bubbles.length; j++) {
      const A = bubbles[i], B = bubbles[j], dx = B.x - A.x, dy = B.y - A.y, d = Math.hypot(dx, dy) || 1, min = (A.R + B.R) * .9;
      if (d >= min) continue;
      const nx = dx / d, ny = dy / d, wa = B.R / (A.R + B.R), wb = 1 - wa, pen = min - d;
      const f = pen * .018;                                            // soft spring apart
      A.vx -= nx * f * wa; A.vy -= ny * f * wa; B.vx += nx * f * wb; B.vy += ny * f * wb;
      const vn = (B.vx - A.vx) * nx + (B.vy - A.vy) * ny;              // closing speed along the contact
      if (vn < 0) {
        const imp = -vn * .6;                                          // absorb most of it (inelastic, like soft jelly)
        A.vx -= nx * imp * wa; A.vy -= ny * imp * wa; B.vx += nx * imp * wb; B.vy += ny * imp * wb;
        A.bump = Math.max(A.bump || 0, -vn / A.R); B.bump = Math.max(B.bump || 0, -vn / B.R);
      }
      if (pen > min * .35) { const c = (pen - min * .35) * .2; A.x -= nx * c * wa; A.y -= ny * c * wa; B.x += nx * c * wb; B.y += ny * c * wb; }   // hard limit only if deeply overlapped
    }
    // speed limit: nothing ever whips across the screen
    const Rref = Math.max(...bubbles.map((b) => b.R));
    bubbles.forEach((b) => { if (!b.R) return; const sp = Math.hypot(b.vx, b.vy), lim = 22 * dpr * (.3 + .7 * b.R / Rref); if (sp > lim) { b.vx *= lim / sp; b.vy *= lim / sp; } });   // top speed scales with size
    bubbles.forEach((b, i) => {
      // jiggle builds from sudden changes in velocity (shoves, bumps, drags) and rings down slowly
      // jiggle comes from the cursor's shoves and from real impacts, capped so it can't feed on itself
      if (!b.R) { arr.set([0, 0, 0], i * 3); return; }   // hidden slot
      const acc = Math.min(.04, Math.hypot(b.vx - b.pvx, b.vy - b.pvy) / (b.R * .4 + Rref * .6)); b.pvx = b.vx; b.pvy = b.vy;   // small ones don't jiggle out of proportion
      b.jig = Math.min(.6, b.jig * P.settle + acc * P.jiggle + Math.min(.08, (b.bump || 0) * 2)); b.bump = 0;
      const breathe = still ? 0 : .035 * Math.sin(t * 1.1 * b.f3 + b.ph);
      arr.set([b.x, b.y, b.R * 1.08 * (1 + .025 * Math.sin(t * 1.3 + b.ph))], i * 3);
      b.svx = (b.svx || 0) + (b.vx - (b.svx || 0)) * .12; b.svy = (b.svy || 0) + (b.vy - (b.svy || 0)) * .12;   // smoothed velocity for the shape
      varr.set([b.svx / b.R, b.svy / b.R, still ? 0 : b.jig, breathe], i * 4);
    });
    // pill nudge: lean a few px away from the (smoothed) cursor, spring back; redraw the pill layer only while moving
    let moving = pillDirty;
    pills.forEach((p) => {
      const dx = p.cx + p.x - smx, dy = p.cy + p.y - smy, d = Math.hypot(dx, dy) || 1, k = Math.max(0, 1 - d / (140 * dpr));
      const sg = p.href ? -1.4 : 1;   // links lean toward the cursor (magnetic), labels lean away
      const tx = dx / d * k * 7 * dpr * sg, ty = dy / d * k * 5 * dpr * sg, tr = (dx > 0 ? 1 : -1) * k * 4 * (p.href ? -.5 : 1);
      p.vx = (p.vx + (tx - p.x) * .12) * .78; p.vy = (p.vy + (ty - p.y) * .12) * .78; p.vr = (p.vr + (tr - p.r) * .12) * .78;
      p.x += p.vx; p.y += p.vy; p.r += p.vr;
      if (Math.abs(p.vx) + Math.abs(p.vy) + Math.abs(p.vr) > .02) moving = true;
    });
    if (moving) drawPills();   // also uploads an empty layer once for scenes without pills
    gl.uniform2f(U('res'), W, H); gl.uniform1f(U('t'), t); gl.uniform1f(U('dpr'), dpr); gl.uniform3fv(U('b'), arr); gl.uniform4fv(U('bv'), varr); gl.uniform1f(U('uWob'), P.wobble); gl.uniform1f(U('uStretch'), P.stretch); gl.uniform1f(U('uLens'), P.lens); gl.uniform1f(U('uEdge'), P.edge); gl.uniform1f(U('uFilm'), P.film); gl.uniform1f(U('uBloom'), P.bloom); gl.uniform1i(U('type'), 0); gl.uniform1i(U('soft'), 1); gl.uniform1i(U('pills'), 2); const G = cfg.glow || [.55, .55, 1, 1.6], G2 = cfg.glow2 || [.78, .3, 1, 1.5]; gl.uniform4f(U('glow'), ...G); gl.uniform4f(U('glow2'), ...G2);
    gl.uniform3fv(U('core'), hex(S.core)); gl.uniform3fv(U('field'), hex(S.field)); gl.uniform3fv(U('ink'), hex(S.ink));
    gl.uniform3fv(U('t0'), hex(S.tint[0])); gl.uniform3fv(U('t1'), hex(S.tint[1])); gl.uniform3fv(U('t2'), hex(S.tint[2])); gl.uniform1f(U('tk'), S.tk); gl.uniform1f(U('fk'), S.fk || 1); gl.uniform3fv(U('core2'), hex(S.core2 || S.field));
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  })(0);
}

window.Bubbles = { scene: (el, cv, cfg) => scene(el, cv, cfg).catch(() => el.classList.add('no-gl')) };
}());
