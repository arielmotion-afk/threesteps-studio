// A tiny ray caster for the interiors. A room is built from boxes, rectangles (with holes, for
// windows and cut-out shapes), vertical cylinders and balls, then baked once: moonlight through
// the windows with real shadows, one warm light (fire, lamp, a gap under a door) with real
// shadows, soft window fill, and one bounce of reflection on glossy floors.
// World units are metres, y is up, the camera looks along +z.

let CAM_OVERRIDE = null;
function makeWorld() {
  const prims = [];
  const W = {
    prims, amb: 0.05, moon: null, warm: null, fills: [], far: 12,
    backdrop: () => ({ C: 0, sky: 0 }),
  };
  // The camera. A mobile variant sets CAM_OVERRIDE while it bakes, and every use of W.cam (the bake,
  // and anything a scene projects onto the screen) sees that camera instead of the scene's own.
  let cam = { pos: [0, 1.6, 0], yaw: 0, pitch: 0, f: 1000, cx: 640, cy: 360 };
  Object.defineProperty(W, "cam", { get: () => CAM_OVERRIDE || cam, set: (v) => { cam = v; }, enumerable: true });
  let target = prims;
  const add = (p, o) => { target.push(Object.assign(p, o || {})); return p; };
  // Everything added inside fn goes into one group with a bounding box, so rays that miss the
  // box skip all of it.
  W.group = (fn) => {
    const kids = [], prev = target;
    target = kids; fn(); target = prev;
    const a = [Infinity, Infinity, Infinity], b = [-Infinity, -Infinity, -Infinity];
    for (const k of kids) { const [ka, kb] = primBounds(k); for (let i = 0; i < 3; i++) { a[i] = Math.min(a[i], ka[i]); b[i] = Math.max(b[i], kb[i]); } }
    return add({ t: 5, a, b, kids, sway: kids.some((k) => k.sway), noShadow: kids.every((k) => k.noShadow) });
  };
  W.box = (a, b, mat, o) => add({ t: 0, a, b, mat }, o);
  // axis 0: plane x = at, u = z, v = y · axis 1: plane y = at, u = x, v = z · axis 2: plane z = at, u = x, v = y
  W.rect = (axis, at, u0, u1, v0, v1, mat, hole, o) => add({ t: 1, axis, at, u0, u1, v0, v1, mat, hole }, o);
  W.cyl = (x, z, r, y0, y1, mat, o) => add({ t: 2, x, z, r, y0, y1, mat }, o);
  W.ball = (x, y, z, r, mat, o) => add({ t: 3, x, y, z, r, mat }, o);
  // A capsule between two points: rails, chains, slanted legs, branches.
  W.rod = (a, b, r, mat, o) => add({ t: 4, a, b, r, mat }, o);
  return W;
}

const UAX = [[2, 1], [0, 2], [0, 1]]; // which world axes a rect's (u, v) are, per plane axis

function primBounds(p) {
  const e = 1e-3;
  if (p.t === 0 || p.t === 5) return [p.a, p.b];
  if (p.t === 1) { const a = [0, 0, 0], b = [0, 0, 0], [ua, va] = UAX[p.axis]; a[p.axis] = p.at - e; b[p.axis] = p.at + e; a[ua] = p.u0; b[ua] = p.u1; a[va] = p.v0; b[va] = p.v1; return [a, b]; }
  if (p.t === 2) return [[p.x - p.r, p.y0, p.z - p.r], [p.x + p.r, p.y1, p.z + p.r]];
  if (p.t === 3) return [[p.x - p.r, p.y - p.r, p.z - p.r], [p.x + p.r, p.y + p.r, p.z + p.r]];
  return [[0, 1, 2].map((i) => Math.min(p.a[i], p.b[i]) - p.r), [0, 1, 2].map((i) => Math.max(p.a[i], p.b[i]) + p.r)];
}
// Does the ray enter the box before tmax?
function hitsBox(a, b, o, d, tmax) {
  let tn = 0, tf = tmax;
  for (let k = 0; k < 3; k++) {
    if (Math.abs(d[k]) < 1e-12) { if (o[k] < a[k] || o[k] > b[k]) return false; continue; }
    let ta = (a[k] - o[k]) / d[k], tb = (b[k] - o[k]) / d[k];
    if (ta > tb) { const t = ta; ta = tb; tb = t; }
    if (ta > tn) tn = ta;
    if (tb < tf) tf = tb;
    if (tn > tf) return false;
  }
  return true;
}

// Nearest hit along the ray, or null. H receives the hit (point, normal, u, v, prim).
function castRay(prims, o, d, tmax, H, pass) {
  let best = tmax, hp = null, hu = 0, hv = 0, hnx = 0, hny = 0, hnz = 0;
  const visit = (prims) => {
  for (let i = 0; i < prims.length; i++) {
    const p = prims[i];
    if (pass === 1 && p.sway && p.t !== 5) continue;
    if (pass === 2 && p.noShadow) continue;
    if (p.t === 5) { if (hitsBox(p.a, p.b, o, d, best)) visit(p.kids); continue; }
    if (p.t === 0) {
      let tn = 1e-4, tf = best, ax = -1, sg = 0, miss = false;
      for (let k = 0; k < 3; k++) {
        if (Math.abs(d[k]) < 1e-12) { if (o[k] < p.a[k] || o[k] > p.b[k]) { miss = true; break; } continue; }
        let ta = (p.a[k] - o[k]) / d[k], tb = (p.b[k] - o[k]) / d[k], s = -1;
        if (ta > tb) { const tmp = ta; ta = tb; tb = tmp; s = 1; }
        if (ta > tn) { tn = ta; ax = k; sg = s; }
        if (tb < tf) tf = tb;
        if (tn > tf) { miss = true; break; }
      }
      if (miss || ax < 0) continue;
      best = tn; hp = p; hnx = ax === 0 ? sg : 0; hny = ax === 1 ? sg : 0; hnz = ax === 2 ? sg : 0;
    } else if (p.t === 1) {
      const k = p.axis;
      if (Math.abs(d[k]) < 1e-12) continue;
      const t = (p.at - o[k]) / d[k];
      if (t <= 1e-4 || t >= best) continue;
      const [ua, va] = UAX[k];
      const u = o[ua] + t * d[ua], v = o[va] + t * d[va];
      if (u < p.u0 || u > p.u1 || v < p.v0 || v > p.v1) continue;
      if (p.hole && p.hole(u, v)) continue;
      best = t; hp = p; hu = u; hv = v;
      const s = d[k] > 0 ? -1 : 1;
      hnx = k === 0 ? s : 0; hny = k === 1 ? s : 0; hnz = k === 2 ? s : 0;
    } else if (p.t === 2) {
      const fx = o[0] - p.x, fz = o[2] - p.z, A = d[0] * d[0] + d[2] * d[2];
      if (A > 1e-12) {
        const B = 2 * (fx * d[0] + fz * d[2]), Cc = fx * fx + fz * fz - p.r * p.r, disc = B * B - 4 * A * Cc;
        if (disc >= 0) {
          const t = (-B - Math.sqrt(disc)) / (2 * A);
          if (t > 1e-4 && t < best) {
            const y = o[1] + t * d[1];
            if (y >= p.y0 && y <= p.y1) { best = t; hp = p; hnx = (fx + t * d[0]) / p.r; hny = 0; hnz = (fz + t * d[2]) / p.r; continue; }
          }
        }
      }
      if (Math.abs(d[1]) > 1e-12) {
        for (const [cy, s] of [[p.y1, 1], [p.y0, -1]]) {
          const t = (cy - o[1]) / d[1];
          if (t <= 1e-4 || t >= best) continue;
          const x = fx + t * d[0], z = fz + t * d[2];
          if (x * x + z * z <= p.r * p.r) { best = t; hp = p; hnx = 0; hny = s; hnz = 0; }
        }
      }
    } else if (p.t === 4) {
      const bx = p.b[0] - p.a[0], by = p.b[1] - p.a[1], bz = p.b[2] - p.a[2];
      const ox = o[0] - p.a[0], oy = o[1] - p.a[1], oz = o[2] - p.a[2];
      const baba = bx * bx + by * by + bz * bz, bard = bx * d[0] + by * d[1] + bz * d[2], baoa = bx * ox + by * oy + bz * oz;
      const rdoa = d[0] * ox + d[1] * oy + d[2] * oz, oaoa = ox * ox + oy * oy + oz * oz;
      const A = baba - bard * bard, B = baba * rdoa - baoa * bard, Cc = baba * oaoa - baoa * baoa - p.r * p.r * baba;
      let h = B * B - A * Cc, t = Infinity;
      if (h >= 0 && A > 1e-12) {
        t = (-B - Math.sqrt(h)) / A;
        const y = baoa + t * bard;
        if (!(y > 0 && y < baba)) {
          const cx = y <= 0 ? ox : o[0] - p.b[0], cy = y <= 0 ? oy : o[1] - p.b[1], cz = y <= 0 ? oz : o[2] - p.b[2];
          const b2 = d[0] * cx + d[1] * cy + d[2] * cz, c2 = cx * cx + cy * cy + cz * cz - p.r * p.r;
          h = b2 * b2 - c2;
          t = h > 0 ? -b2 - Math.sqrt(h) : Infinity;
        }
      }
      if (!(t > 1e-4 && t < best)) continue;
      const px = ox + t * d[0], py = oy + t * d[1], pz = oz + t * d[2], k = clamp((px * bx + py * by + pz * bz) / baba);
      best = t; hp = p; hnx = (px - k * bx) / p.r; hny = (py - k * by) / p.r; hnz = (pz - k * bz) / p.r;
    } else {
      const fx = o[0] - p.x, fy = o[1] - p.y, fz = o[2] - p.z;
      const B = fx * d[0] + fy * d[1] + fz * d[2], Cc = fx * fx + fy * fy + fz * fz - p.r * p.r, disc = B * B - Cc;
      if (disc < 0) continue;
      const t = -B - Math.sqrt(disc);
      if (t <= 1e-4 || t >= best) continue;
      best = t; hp = p; hnx = (fx + t * d[0]) / p.r; hny = (fy + t * d[1]) / p.r; hnz = (fz + t * d[2]) / p.r;
    }
  }
  };
  visit(prims);
  if (!hp) return null;
  H.t = best; H.p = hp;
  H.x = o[0] + best * d[0]; H.y = o[1] + best * d[1]; H.z = o[2] + best * d[2];
  H.nx = hnx; H.ny = hny; H.nz = hnz; H.u = hu; H.v = hv;
  return H;
}

// Light a hit: returns { C, K, B, moon }.
function shadeHit(W, H, d, depth) {
  H.al = 0.3; H.k = 1; H.e = 0; H.wb = 0; H.refl = 0; H.noMoon = false;
  const m = H.p.mat;
  if (typeof m === "number") H.al = m; else m(H);
  const nl0 = Math.hypot(H.nx, H.ny, H.nz) || 1;
  const nx = H.nx / nl0, ny = H.ny / nl0, nz = H.nz / nl0;
  const ox = H.x + nx * 2e-3, oy = H.y + ny * 2e-3, oz = H.z + nz * 2e-3, O = [ox, oy, oz];
  const S = {};
  let light = W.amb * (0.75 + 0.25 * ny), moon = 0, K = 0;
  for (const f of W.fills) {
    const lx = f.p[0] - H.x, ly = f.p[1] - H.y, lz = f.p[2] - H.z, dist = Math.hypot(lx, ly, lz);
    const nl = (nx * lx + ny * ly + nz * lz) / dist;
    if (nl > 0) light += (f.I * nl) / (1 + dist * dist * f.k);
  }
  if (W.moon && !H.noMoon) {
    const L = W.moon.L, nl = nx * L[0] + ny * L[1] + nz * L[2];
    if (nl > 0 && !castRay(W.prims, O, L, 60, S, 2)) moon = W.moon.I * nl;
  }
  if (W.warm) {
    const lx = W.warm.p[0] - H.x, ly = W.warm.p[1] - H.y, lz = W.warm.p[2] - H.z, dist = Math.hypot(lx, ly, lz);
    const nl = (nx * lx + ny * ly + nz * lz) / dist;
    const r = W.warm.r || 0;
    if (dist < r) K = W.warm.I;
    else if (nl > 0 && !castRay(W.prims, O, [lx / dist, ly / dist, lz / dist], dist - r - 0.02, S, 2)) K = (W.warm.I * nl) / (1 + dist * dist * W.warm.k);
  }
  let C = H.al * (light + moon) + H.e;
  K *= H.al * H.k;
  let B = H.wb;
  if (H.refl > 0 && depth === 0) {
    const dn = d[0] * nx + d[1] * ny + d[2] * nz, rd = [d[0] - 2 * dn * nx, d[1] - 2 * dn * ny, d[2] - 2 * dn * nz];
    const R = {}, rh = castRay(W.prims, O, rd, W.far, R, 1);
    const rs = rh ? shadeHit(W, R, rd, 1) : W.backdrop(rd[0], rd[1], rd[2]);
    C += H.refl * (rs.C || 0); K += H.refl * (rs.K || 0);
    if (W.reflB) B += H.refl * (rs.B || 0); // opt-in: glowing things (B) show in reflections too
  }
  return { C, K, B, moon: H.al * moon };
}

function camDir(cam, sx, sy) {
  let x = (sx - cam.cx) / cam.f, y = -(sy - cam.cy) / cam.f, z = 1;
  const cp = Math.cos(cam.pitch), sp = Math.sin(cam.pitch);
  [y, z] = [y * cp + z * sp, -y * sp + z * cp];
  const cy = Math.cos(cam.yaw), sy2 = Math.sin(cam.yaw);
  [x, z] = [x * cy + z * sy2, -x * sy2 + z * cy];
  const l = Math.hypot(x, y, z);
  return [x / l, y / l, z / l];
}

// World point to screen (1280 x 720), plus the pixel scale of one metre there.
function project(cam, p) {
  let x = p[0] - cam.pos[0], y = p[1] - cam.pos[1], z = p[2] - cam.pos[2];
  const cy = Math.cos(cam.yaw), sy = Math.sin(cam.yaw);
  [x, z] = [x * cy - z * sy, x * sy + z * cy];
  const cp = Math.cos(cam.pitch), sp = Math.sin(cam.pitch);
  [y, z] = [y * cp - z * sp, y * sp + z * cp];
  return [cam.cx + (x / z) * cam.f, cam.cy - (y / z) * cam.f, cam.f / z];
}

// Bake a world: main pass without sway objects, plus the sway layer into aux R/G.
function bakeWorld(W, w = FRAME.grid[0], h = FRAME.grid[1], extra) {
  const H = {}, H2 = {};
  return bakeGrid(w, h, (sx, sy, o) => {
    const d = camDir(W.cam, sx, sy), O = W.cam.pos;
    const hit = castRay(W.prims, O, d, W.far, H, 1);
    if (hit) {
      const s = shadeHit(W, H, d, 0);
      o.C = s.C; o.K = s.K; o.B = s.B; o.a = s.moon; o.D = clamp(1 - H.t / W.far);
    } else {
      const bd = W.backdrop(d[0], d[1], d[2], sx, sy);
      o.C = bd.C; o.K = bd.K || 0; o.B = bd.B || 0; o.b = bd.sky ? 1 : 0; o.D = 0;
    }
    const sw = castRay(W.prims, O, d, hit ? H.t : W.far, H2, 0);
    if (sw && sw.p.sway) { o.r = 1; o.g = shadeHit(W, H2, d, 1).C; }
    if (extra) extra(sx, sy, o, hit ? H : null, d);
  });
}

// ── Materials ───────────────────────────────────
// Planar coordinates for a hit, picked by the normal.
const planar = (H) => (Math.abs(H.nx) > 0.5 ? [H.z, H.y] : Math.abs(H.ny) > 0.5 ? [H.x, H.z] : [H.x, H.y]);
const M = {
  // Wood with grain running along `dir` (0 x, 1 y, 2 z) or along the longer planar axis.
  wood: (al, scale = 1) => (H) => {
    const [s, t] = planar(H);
    H.al = al * (0.8 + 0.4 * noise(s * 2 * scale, t * 40 * scale)) * (0.9 + 0.2 * noise(s * 40 * scale, t * 2 * scale));
  },
  // Victorian wallpaper: a repeating damask of small sprigs, low contrast.
  paper: (al, motif) => (H) => {
    const [s, t] = planar(H);
    const u = s / 0.32, v = t / 0.42 + (Math.floor(s / 0.32) % 2) * 0.5;
    H.al = al * (0.62 + 0.75 * motif(u, v)) * (0.9 + 0.2 * noise(s * 3, t * 3));
  },
  // Floorboards along z, with seams and staggered ends.
  boards: (al, bw = 0.15, gloss = 0) => (H) => {
    const b = Math.floor(H.x / bw), fx = H.x / bw - b, len = 1.4, off = hash(b, 7) * len, fz = ((H.z + off) / len) % 1;
    const seam = fx < 0.06 || fz < 0.012;
    H.al = seam ? al * 0.25 : al * (0.75 + 0.3 * hash(b, 3)) * (0.85 + 0.3 * noise(H.x * 30, H.z * 1.5));
    H.refl = seam ? 0 : gloss;
  },
  // Soft cloth: folds as bumps in the normal.
  // aniso < 1 stretches the folds along v (curtains, drapes hang in vertical folds).
  cloth: (al, amt = 0.35, scale = 4, aniso = 0.6) => (H) => {
    const [s, t] = planar(H);
    const e = 0.01, n0 = noise(s * scale, t * scale * aniso);
    const gs = (noise((s + e) * scale, t * scale * aniso) - n0) / e, gt = (noise(s * scale, (t + e) * scale * aniso) - n0) / e;
    if (Math.abs(H.ny) > 0.5) { H.nx += -gs * amt * 0.25; H.nz += -gt * amt * 0.25; }
    else if (Math.abs(H.nx) > 0.5) { H.nz += -gs * amt * 0.25; H.ny += -gt * amt * 0.25; }
    else { H.nx += -gs * amt * 0.25; H.ny += -gt * amt * 0.25; }
    H.al = al * (0.85 + 0.3 * n0);
  },
  // A checkerboard of tiles.
  tiles: (a1, a2, size = 0.3, gloss = 0) => (H) => {
    const [s, t] = planar(H);
    const i = Math.floor(s / size) + Math.floor(t / size), fs = (s / size) % 1, ft = (t / size) % 1;
    const grout = Math.abs(fs) < 0.03 || Math.abs(ft) < 0.03;
    H.al = grout ? a2 * 0.5 : (((i % 2) + 2) % 2 ? a1 : a2) * (0.9 + 0.2 * noise(s * 8, t * 8));
    H.refl = grout ? 0 : gloss;
  },
  // A patterned rug: border bands and a field of small medallions.
  rug: (al, x0, x1, z0, z1) => (H) => {
    const u = (H.x - x0) / (x1 - x0), v = (H.z - z0) / (z1 - z0), e = Math.min(u, 1 - u, (v * (z1 - z0)) / (x1 - x0), ((1 - v) * (z1 - z0)) / (x1 - x0));
    const band = e < 0.03 ? 0.6 : e < 0.06 ? 1.3 : e < 0.09 ? 0.5 : 1;
    const fu = (H.x * 5) % 1, fv = (H.z * 5) % 1, med = Math.abs(fu - 0.5) + Math.abs(fv - 0.5) < 0.3 ? 1.35 : 0.85;
    H.al = al * band * (e < 0.09 ? 1 : med) * (0.85 + 0.3 * hash(Math.floor(H.x * 60), Math.floor(H.z * 60)));
  },
  // Rough stone blocks in courses, with dark mortar.
  stone: (al, bw = 0.42, bh = 0.24) => (H) => {
    const [s, t] = planar(H);
    const row = Math.floor(t / bh), off = (row % 2) * 0.5 + hash(row, 3) * 0.3, col = Math.floor(s / bw + off);
    const fs = (s / bw + off) % 1, ft = (t / bh) % 1;
    const mortar = fs < 0.05 || ft < 0.08;
    H.al = mortar ? al * 0.3 : al * (0.6 + 0.6 * hash(col, row)) * (0.8 + 0.4 * noise(s * 14, t * 14));
  },
  // Flagstones on a floor: big irregular slabs.
  flags: (al, size = 0.5, gloss = 0) => (H) => {
    const u = H.x / size + 0.3 * noise(H.z * 2, H.x * 2), v = H.z / size + 0.3 * noise(H.x * 2 + 5, H.z * 2);
    const cu = Math.floor(u), cv = Math.floor(v), fu = u - cu, fv = v - cv;
    const joint = fu < 0.05 || fv < 0.05;
    H.al = joint ? al * 0.3 : al * (0.6 + 0.6 * hash(cu, cv)) * (0.85 + 0.3 * noise(H.x * 20, H.z * 20));
    H.refl = joint ? 0 : gloss;
  },
  // Books on a shelf face: rows of spines with gaps; the shelf boards between rows.
  books: (al, row = 0.36) => (H) => {
    const [s, t] = planar(H);
    const r = Math.floor(t / row), ft = (t / row) % 1;
    if (ft < 0.08) { H.al = al * 1.3; return; }
    const w = 0.035 + 0.03 * hash(Math.floor(s / 0.05), r), k = Math.floor(s / w + r * 7.3), top = 0.7 + 0.28 * hash(k, r + 1);
    H.al = ft > top ? al * 0.15 : al * (0.4 + 1.1 * hash(k, r)) * (0.9 + 0.2 * noise(s * 90, t * 3));
  },
};

// Pointed (lancet) window shape test, in wall coordinates.
function lancetIn(u, v, cx, w, spring, bottom) {
  if (u < cx - w / 2 || u > cx + w / 2 || v < bottom) return false;
  if (v <= spring) return true;
  const r = w * 0.85, lc = cx - w / 2 + r, rc = cx + w / 2 - r;
  return (u - lc) ** 2 + (v - spring) ** 2 <= r * r && (u - rc) ** 2 + (v - spring) ** 2 <= r * r;
}
