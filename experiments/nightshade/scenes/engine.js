// Scene engine: every scene is baked once into two textures, then lit, animated and printed
// on the GPU every frame through two pixel ramps (cool moonlight, warm firelight).
//
// bake texture  R  cool light C (0..1)
//               G  warm catch: how much of the scene's warm light a surface takes (0..2, stored /2)
//               B  scene-defined (fire: shadow receiver; interiors: blood / constant warm)
//               A  depth for parallax (0 far .. 1 near)
// aux texture   R  sway layer coverage (curtain, hanging plants), at rest
//               G  sway layer lightness
//               B  1 where you see the sky (for drifting clouds)
//               A  the part of C that is direct moonlight (so clouds can dim it)
//
// A scene supplies GLSL defining `void scene(vec2 sp, vec4 b, vec4 a, float t, inout float C, inout float W)`,
// and may set gPink (0..1) where its warm light should print pink instead of orange.
//
// Image scenes (direct: true) are painted pictures instead: the bake holds the picture's own colours
// (RGB), depth in A (for the camera sway, as in every scene) and whatever masks the scene needs in
// aux; stepLight() changes light in printed steps. The GLSL defines
// `vec3 direct(vec2 sp, vec4 b, vec4 a, float t, vec2 lp)` returning the colour (0..1) to show.

const SCENES = [];

// The frame a scene is drawn in. Desktop: 1280 x 720, baked at 640 x 360. Mobile: 720 x 1280, baked
// at 360 x 640. While a mobile scene bakes, FRAME (and RW, RH) describe the portrait frame, so the
// bake helpers (makeMask, bakeGrid, bakeWorld, ground ...) all work in it.
const FRAME = { w: 1280, h: 720, grid: [640, 360], portrait: false, view: null };
function inFrame(portrait, fn) {
  const prev = { ...FRAME, RW, RH };
  Object.assign(FRAME, portrait ? { w: 720, h: 1280, grid: [360, 640], portrait: true } : { w: 1280, h: 720, grid: [640, 360], portrait: false });
  RW = FRAME.w; RH = FRAME.h;
  try { return fn(); } finally { Object.assign(FRAME, prev); RW = prev.RW; RH = prev.RH; delete FRAME.RW; delete FRAME.RH; }
}
// The top edge for shapes that run off the top of the frame (trunks, walls): in a mobile view it's
// the top of the tall window.
const TOPY = () => (FRAME.view ? FRAME.view[1] - 60 : -10);
// The mobile version of a scene: its own id (<id>_m), a portrait frame, and its own composition. The
// overrides replace whatever needs re-composing (bake, glsl, constants); the rest is shared.
function mobile(scene, overrides = {}) {
  const m = { ...scene, ...overrides, id: scene.id + "_m", frame: [720, 1280], base: scene.id };
  const bake = overrides.bake || scene.bake;
  m.bake = function () {
    // a painted (2D) scene with a view: the scene keeps its own 1280 x 720 plane (sky and ground run on
    // past its edges) and the portrait frame is a window onto it: frame pixel p is plane point
    // view.xy + p * view[2]. Everything else is drawn in the portrait frame itself.
    if (overrides.view) {
      const prev = { ...FRAME };
      Object.assign(FRAME, { portrait: true, grid: [360, 640], view: overrides.view });
      // masks cover the desktop frame and the whole tall window (with a margin)
      const [vx, vy, vs] = overrides.view, ax0 = Math.floor(Math.min(0, vx) - 40), ay0 = Math.floor(Math.min(0, vy) - 40);
      MASK_AREA = [ax0, ay0, Math.ceil(Math.max(1280, vx + 720 * vs) + 40 - ax0), Math.ceil(Math.max(720, vy + 1280 * vs) + 40 - ay0)];
      try { return bake.call(this); } finally { Object.assign(FRAME, prev); MASK_AREA = null; }
    }
    return inFrame(true, () => { CAM_OVERRIDE = overrides.cam || null; try { return bake.call(this); } finally { CAM_OVERRIDE = null; } });
  };
  m.bakeSrc = "mobile:" + JSON.stringify(overrides.cam || overrides.view || null) + bake.toString();
  return m;
}

const ENGINE_VS = `#version 300 es
in vec2 aPos;
out vec2 vUv;
void main() { vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }`;

const ENGINE_FS = (scene) => `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;
uniform sampler2D uBake, uAux, uPrev;
${scene.sprite ? "uniform sampler2D uSprite; uniform vec2 uSpriteSize;" : ""}
uniform float uTime, uMix;
uniform vec2 uPx;
${Object.entries(scene.uniforms || {}).map(([n, ty]) => `uniform ${ty} ${n};`).join("\n")}
const vec2 BASE = vec2(${scene.frame ? scene.frame[0] : 1280}.0, ${scene.frame ? scene.frame[1] : 720}.0);
const float PI = 3.14159265;
const vec3 COOL[8] = vec3[8](
  vec3(4, 5, 22), vec3(9, 12, 44), vec3(17, 26, 82), vec3(27, 44, 128),
  vec3(42, 68, 176), vec3(70, 104, 214), vec3(130, 160, 240), vec3(222, 230, 255));
const vec3 WARM[8] = vec3[8](
  vec3(6, 6, 24), vec3(44, 16, 34), vec3(104, 34, 32), vec3(176, 62, 28),
  vec3(232, 104, 36), vec3(255, 150, 60), vec3(255, 206, 120), vec3(255, 244, 210));
const vec3 PINKR[8] = vec3[8](
  vec3(6, 6, 24), vec3(40, 14, 44), vec3(96, 30, 80), vec3(170, 54, 130),
  vec3(230, 90, 170), vec3(255, 140, 200), vec3(255, 196, 228), vec3(255, 238, 246));
float gPink = 0.0; // a scene sets this above 0.5 where its warm light is pink (the orchid, the dawn)
const float BAY[16] = float[16](0.,8.,2.,10.,12.,4.,14.,6.,3.,11.,1.,9.,15.,7.,13.,5.);

float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}
float fbm(vec2 p) { return 0.55 * noise(p) + 0.3 * noise(p * 2.1 + 3.7) + 0.15 * noise(p * 4.3 + 9.1); }
float g2(vec2 p, vec2 c, float r) { vec2 d = p - c; return exp(-dot(d, d) / (2.0 * r * r)); }
${scene.view ? `const vec3 VIEW = vec3(${scene.view.map((v) => v.toFixed(3)).join(", ")});
vec2 toFrame(vec2 p) { return (p - VIEW.xy) / VIEW.z; } // a point on the scene's plane, in the portrait frame` : "vec2 toFrame(vec2 p) { return p; }"}
vec4 bakeAt(vec2 p) { return texture(uBake, toFrame(p) / BASE); }
vec4 auxAt(vec2 p) { return texture(uAux, toFrame(p) / BASE); }
// Flames in local units: q.x across (-1..1), q.y up (0 at the base, 1 at the tallest tip).
// Returns 0 outside, 1 flame, 2 hot core. Tongues rise, split and lick.
float flame(vec2 q, float t, float seed) {
  if (q.y < 0.0 || abs(q.x) > 1.0) return 0.0;
  float tongues = 0.45 + 0.55 * noise(vec2(q.x * 3.2 + seed, t * 2.4 - q.y));
  float h = pow(1.0 - abs(q.x), 0.7) * tongues;
  float edge = h - q.y + 0.22 * (noise(vec2(q.x * 8.0 + seed, q.y * 5.0 - t * 5.5)) - 0.5);
  if (edge < 0.0) return 0.0;
  return edge > 0.22 && abs(q.x) < 0.5 ? 2.0 : 1.0;
}
float bayer(vec2 p) { int i = int(mod(p.y, 4.0)) * 4 + int(mod(p.x, 4.0)); return (BAY[i] + 0.5) / 16.0; }
// For image scenes: change a colour's light by factor k in printed steps (each step about 20%),
// dithered the same way the light ramps are, so changes read as pixels turning over, not a fade.
vec3 stepLight(vec3 col, float k, vec2 lp) {
  float d = 0.55 * bayer(lp) + 0.45 * hash(lp + 3.1);
  float n = floor(abs(log(max(k, 0.01))) / 0.18 + d);
  return col * pow(k > 1.0 ? 1.2 : 0.835, n);
}

${scene.glsl}

void main() {
  vec2 cell = floor(vUv * uPx);
  vec2 lp = vec2(cell.x, uPx.y - 1.0 - cell.y);
  vec2 px = (lp + 0.5) * (BASE / uPx);
  float t = uTime;

${scene.direct ? `
  // An image scene: the scene paints its own colours (from a picture), no light ramps. The camera
  // sways with the same parallax as the other scenes (bake alpha is depth here too).
  vec2 cam = ${(scene.sway ?? 5).toFixed(1)} * vec2(sin(t * 0.19), 0.4 * sin(t * 0.12));
  vec2 sp = px + cam * (texture(uBake, px / BASE).a - 0.4) * 2.0;
  ${scene.view ? "sp = VIEW.xy + sp * VIEW.z; // the scene works on its own plane" : ""}
  outColor = vec4(direct(sp, bakeAt(sp), auxAt(sp), t, lp), 1.0);
` : `
  vec2 cam = ${(scene.sway ?? 5).toFixed(1)} * vec2(sin(t * 0.19), 0.4 * sin(t * 0.12));
  vec2 sp = px + cam * (texture(uBake, px / BASE).a - 0.4) * 2.0;
  ${scene.view ? "sp = VIEW.xy + sp * VIEW.z; // the scene works on its own plane" : ""}
  vec4 b = bakeAt(sp), a = auxAt(sp);
  float C = b.r, W = 0.0;
  gPink = 0.0;
  scene(sp, b, a, t, C, W);

  C = max(C, 0.0); W = max(W, 0.0);
  // lift opens up the darks (0 = none): shadows gain detail, highlights barely move.
  float Y = pow(clamp(C * 1.12 + W * 0.8, 0.0, 1.0), 0.8 - ${(scene.lift ?? 0).toFixed(3)});
  float share = W / (C + W + 0.002);
  // where cool and warm light meet, each pixel picks one: at random (grain), or in an ordered
  // pattern (scene.orderedMix), which reads as a smooth printed gradient
  bool warm = smoothstep(0.15, 0.75, share) > ${scene.orderedMix ? "bayer(lp + vec2(2.0, 1.0))" : "hash(lp + 17.3)"};
  float d = 0.55 * bayer(lp) + 0.45 * hash(lp);
  int idx = int(clamp(floor(Y * 7.0 + d), 0.0, 7.0));
  vec3 wc = gPink > hash(lp + 5.7) ? PINKR[idx] : WARM[idx];
  outColor = vec4((warm ? wc : COOL[idx]) / 255.0, 1.0);
`}
  // Dissolving in from the previous page: the new scene spreads in clumps, pixel by pixel.
  if (uMix < 1.0) {
    float th = 0.35 * bayer(lp) + 0.65 * noise(lp * 0.045 + 7.0);
    if (th > uMix * 1.02) outColor = texture(uPrev, vUv);
  }
}`;

// Bake a scene on a w x h grid. fn(x, y, o) gets coordinates in the 1280 x 720 frame and fills
// o.C, o.K, o.B, o.D (bake) and o.r, o.g, o.b, o.a (aux).
function bakeGrid(w, h, fn) {
  const bake = new Uint8Array(w * h * 4), aux = new Uint8Array(w * h * 4);
  const o = {};
  const sx = RW / w, sy = RH / h;
  if (FRAME.view) {
    // a portrait window onto the scene's plane: cell (x, y) of the 360 x 640 grid covers frame pixels
    // (2x, 2y), plane point view.xy + frame * view[2]
    const [vx, vy, vs] = FRAME.view;
    [w, h] = FRAME.grid;
    const bake2 = new Uint8Array(w * h * 4), aux2 = new Uint8Array(w * h * 4), o = {};
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      o.C = 0; o.K = 0; o.B = 0; o.D = 0; o.r = 0; o.g = 0; o.b = 0; o.a = 0;
      fn(vx + (x + 0.5) * 2 * vs, vy + (y + 0.5) * 2 * vs, o);
      const i = (y * w + x) * 4;
      bake2[i] = clamp(o.C) * 255; bake2[i + 1] = clamp(o.K / 2) * 255; bake2[i + 2] = clamp(o.B) * 255; bake2[i + 3] = clamp(o.D) * 255;
      aux2[i] = clamp(o.r) * 255; aux2[i + 1] = clamp(o.g) * 255; aux2[i + 2] = clamp(o.b) * 255; aux2[i + 3] = clamp(o.a) * 255;
    }
    return { w, h, bake: bake2, aux: aux2 };
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      o.C = 0; o.K = 0; o.B = 0; o.D = 0; o.r = 0; o.g = 0; o.b = 0; o.a = 0;
      fn((x + 0.5) * sx, (y + 0.5) * sy, o);
      const i = (y * w + x) * 4;
      bake[i] = clamp(o.C) * 255; bake[i + 1] = clamp(o.K / 2) * 255; bake[i + 2] = clamp(o.B) * 255; bake[i + 3] = clamp(o.D) * 255;
      aux[i] = clamp(o.r) * 255; aux[i + 1] = clamp(o.g) * 255; aux[i + 2] = clamp(o.b) * 255; aux[i + 3] = clamp(o.a) * 255;
    }
  }
  return { w, h, bake, aux };
}

// A small texture drawn with canvas, sampled by (u, v) in 0..1 (wrapping), returning alpha 0..1.
function tex2d(w, h, draw) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const g = c.getContext("2d", { willReadFrequently: true });
  g.fillStyle = g.strokeStyle = "#fff"; g.lineCap = g.lineJoin = "round";
  draw(g, w, h);
  const d = g.getImageData(0, 0, w, h).data;
  return (u, v) => {
    const x = ((Math.floor(u * w) % w) + w) % w, y = ((Math.floor(v * h) % h) + h) % h;
    return d[(y * w + x) * 4 + 3] / 255;
  };
}

// The stage: one WebGL canvas. Scenes are prepared ahead (shader compiled, textures uploaded)
// so showing one is instant; changing scene dissolves from the old one, still moving, to the
// new one through a dithered, clumping pattern.
function createStage(canvas, { dissolve = 1.1 } = {}) {
  const gl = canvas.getContext("webgl2", { antialias: false, preserveDrawingBuffer: true });
  if (!gl) throw new Error("WebGL2 not available");
  gl.getExtension("KHR_parallel_shader_compile");
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

  const shader = (type, src) => { const sh = gl.createShader(type); gl.shaderSource(sh, src); gl.compileShader(sh); return sh; };
  const texture = (w, h, data) => {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
    for (const p of [gl.TEXTURE_MIN_FILTER, gl.TEXTURE_MAG_FILTER]) gl.texParameteri(gl.TEXTURE_2D, p, gl.NEAREST);
    for (const p of [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T]) gl.texParameteri(gl.TEXTURE_2D, p, gl.CLAMP_TO_EDGE);
    return tex;
  };

  const prepared = new Map();
  // Compile and upload a scene without showing it (the driver compiles in the background).
  function prepare(scene, data) {
    if (prepared.has(scene.id)) return prepared.get(scene.id);
    const vs = shader(gl.VERTEX_SHADER, ENGINE_VS), fs = shader(gl.FRAGMENT_SHADER, ENGINE_FS(scene));
    const prog = gl.createProgram();
    gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    const e = { scene, prog, vs, fs, ready: false, tex: [texture(data.w, data.h, data.bake), texture(data.w, data.h, data.aux)], t0: 0 };
    // a scene may carry a sprite (something that moves across it, drawn once on a canvas: R C, G warm,
    // B pink, A coverage); it isn't baked, so it costs nothing to load
    if (scene.sprite) {
      const c = scene.spriteCanvas ??= scene.sprite();
      e.spriteSize = [c.width, c.height];
      e.sprite = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, e.sprite);
      gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c);
      for (const p of [gl.TEXTURE_MIN_FILTER, gl.TEXTURE_MAG_FILTER]) gl.texParameteri(gl.TEXTURE_2D, p, gl.NEAREST);
      for (const p of [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T]) gl.texParameteri(gl.TEXTURE_2D, p, gl.CLAMP_TO_EDGE);
    }
    prepared.set(scene.id, e);
    return e;
  }
  // First use of a prepared scene: check the compile, look up its uniforms.
  function finish(e) {
    if (e.ready) return;
    if (!gl.getProgramParameter(e.prog, gl.LINK_STATUS)) throw new Error(gl.getShaderInfoLog(e.fs) || gl.getProgramInfoLog(e.prog));
    const U = (n) => gl.getUniformLocation(e.prog, n);
    e.u = { time: U("uTime"), px: U("uPx"), bake: U("uBake"), aux: U("uAux"), prev: U("uPrev"), mix: U("uMix"), sprite: U("uSprite"), spriteSize: U("uSpriteSize") };
    e.custom = Object.keys(e.scene.uniforms || {}).map((n) => [n, U(n)]);
    e.loc = gl.getAttribLocation(e.prog, "aPos");
    e.ready = true;
  }

  let asleep = false, size = [640, 360], paused = false, tFrozen = 0, current = null, leaving = null, tStart = 0, fbo = null, prevTex = null;
  const t0 = performance.now();
  const stats = { frames: 0 };
  const now = () => (paused ? tFrozen : (performance.now() - t0) / 1000);

  function makeTarget() {
    if (prevTex) { gl.deleteTexture(prevTex); gl.deleteFramebuffer(fbo); }
    prevTex = texture(size[0], size[1], null);
    fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, prevTex, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  function drawScene(e, t, mix) {
    finish(e);
    gl.useProgram(e.prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.enableVertexAttribArray(e.loc);
    gl.vertexAttribPointer(e.loc, 2, gl.FLOAT, false, 0, 0);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, e.tex[0]);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, e.tex[1]);
    gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, mix < 1 ? prevTex : null);
    gl.uniform1i(e.u.bake, 0); gl.uniform1i(e.u.aux, 1); gl.uniform1i(e.u.prev, 2);
    if (e.sprite) { gl.activeTexture(gl.TEXTURE3); gl.bindTexture(gl.TEXTURE_2D, e.sprite); gl.uniform1i(e.u.sprite, 3); gl.uniform2f(e.u.spriteSize, ...e.spriteSize); }
    gl.uniform1f(e.u.mix, mix);
    gl.uniform1f(e.u.time, t - e.t0);
    gl.uniform2f(e.u.px, size[0], size[1]); // (the stage is sized to the scenes it shows: 640 x 360 or 360 x 640)
    if (e.scene.update) {
      const vals = e.scene.update(t - e.t0);
      for (const [n, loc] of e.custom) { const v = vals[n]; if (v == null) continue; [, gl.uniform1f, gl.uniform2fv, gl.uniform3fv, gl.uniform4fv][Array.isArray(v) ? v.length : 1].call(gl, loc, v); }
    }
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  function draw(t = now()) {
    if (!current) return;
    let mix = 1;
    if (leaving) {
      mix = Math.min(1, (t - tStart) / dissolve);
      if (mix >= 1) leaving = null;
      else {
        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
        drawScene(leaving, t, 1);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      }
    }
    drawScene(current, t, mix * mix * (3 - 2 * mix));
    stats.frames++;
  }

  // Show a scene (prepared or not). With something already on stage, dissolve to it.
  function show(scene, data, { instant = false } = {}) {
    const e = prepare(scene, data), t = now();
    if (e === current) return;
    e.t0 = t;
    if (current && !instant) { leaving = current; tStart = t; if (!fbo) makeTarget(); }
    current = e;
  }

  const resize = (w, h) => { size = [w, h]; canvas.width = w; canvas.height = h; gl.viewport(0, 0, w, h); if (fbo) makeTarget(); };
  resize(...size);

  (function frame() { if (!asleep) draw(); requestAnimationFrame(frame); })();

  // Draw the current scene at a given scene time, with no dissolve (for frame grabs).
  const drawAt = (st) => { leaving = null; if (current) draw(current.t0 + st); };

  // Stop drawing entirely (e.g. while scrolled out of view).
  const sleep = (v) => { asleep = v; };

  return { prepare, show, resize, stats, draw, drawAt, sleep, time: now, pause: (v) => { paused = v; tFrozen = (performance.now() - t0) / 1000; } };
}
