// Ardent Fusion graphic language, drawn as plain SVG so it stays vector in PDFs.
// Symbol, wireframe torus, flux surfaces, dipole field lines, soft glows.
// Nothing here uses SVG filters or blend modes (Chrome's PDF printer flattens those).
(function () {
  const B = window.KF_BRAND || { short: 'Ardent', full: 'Ardent Fusion', domain: 'ardentfusion.example', product: 'AR-1' };
  let uid = 0;
  const id = (p) => `${p}${++uid}`;
  const f = (n) => Math.round(n * 100) / 100;
  const C = { orange: '#FF6A2B', hot: '#F2436A', magenta: '#D6339A', cyan: '#8FE3EE', cyanInk: '#127F92', off: '#F3F0EA', navy: '#070B17' };

  function plasmaGrad(gid, x1 = 0, x2 = 1, units = 'objectBoundingBox', y1 = 0, y2 = 0) {
    return `<linearGradient id="${gid}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" gradientUnits="${units}">
      <stop offset="0" stop-color="${C.orange}"/><stop offset=".55" stop-color="${C.hot}"/><stop offset="1" stop-color="${C.magenta}"/></linearGradient>`;
  }

  // ---- symbol: a hot core seen through five magnet coils. Each strip shows the core a step larger. ----
  // mode: 'color' (the Warm rim rings), 'mono' (silhouette in currentColor), 'line' (outline only)
  const RINGS = ['#FF6B4A', '#E0306A', '#1E6BFF', '#2FE0C8', '#E6FFE8'];
  function symbol(opts = {}) {
    const mode = opts.mode || 'mono', xs = [-36, -21.6, -7.2, 7.2, 21.6, 36], gap = opts.gap ?? 1.4;
    let s = '';
    for (let i = 0; i < 5; i++) {
      const cid = id('kfc'), r = 17 + i * 4.75, cx = -13 + i * 3.4, x0 = xs[i] + (i ? gap / 2 : 0), x1 = xs[i + 1] - (i < 4 ? gap / 2 : 0);
      const body = mode === 'color' ? RINGS.map((c, k) => `<circle cx="${f(cx)}" r="${f(r * (1 - k * 0.19))}" fill="${c}"/>`).join('')
        : `<path fill="currentColor" fill-rule="evenodd" d="${[1, 0.62, 0.24].map((k) => { const rr = f(r * k); return `M${f(cx - rr)} 0a${rr} ${rr} 0 1 0 ${f(2 * rr)} 0a${rr} ${rr} 0 1 0 ${f(-2 * rr)} 0Z`; }).join('')}"/>`;
      s += `<clipPath id="${cid}"><rect x="${f(x0)}" y="-40" width="${f(x1 - x0)}" height="80"/></clipPath><g clip-path="url(#${cid})">${body}</g>`;
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-37 -37 74 74" ${opts.size ? `width="${opts.size}" height="${opts.size}"` : ''} class="kf-symbol">${s}</svg>`;
  }

  // ---- wireframe torus seen from above at `tilt` degrees, with optional plasma ring and helical field line ----
  function torus(o = {}) {
    const R = o.R ?? 200, r = o.r ?? 70, cx = o.cx ?? 0, cy = o.cy ?? 0;
    const t = ((o.tilt ?? 64) * Math.PI) / 180, ct = Math.cos(t), st = Math.sin(t);
    const nu = o.nu ?? 40, nv = o.nv ?? 18, su = o.su ?? 120, sv = o.sv ?? 40;
    const col = o.color ?? C.cyan, back = o.back ?? 0.1, front = o.front ?? 0.75, sw = o.sw ?? 1;
    const levels = 7, buckets = Array.from({ length: levels }, () => []);
    const P = (u, v) => {
      const x = (R + r * Math.cos(v)) * Math.cos(u), y = (R + r * Math.cos(v)) * Math.sin(u), z = r * Math.sin(v);
      return [cx + x, cy + y * ct - z * st, (y * st + z * ct) / (R + r)];
    };
    const seg = (a, b) => {
      const d = (a[2] + b[2]) / 2, k = Math.min(levels - 1, Math.max(0, Math.floor(((d + 1) / 2) * levels)));
      buckets[k].push(`M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}`);
    };
    const TAU = Math.PI * 2;
    if (o.meridians !== false) for (let i = 0; i < nu; i++) { const u = (i / nu) * TAU; for (let j = 0; j < sv; j++) seg(P(u, (j / sv) * TAU), P(u, ((j + 1) / sv) * TAU)); }
    if (o.parallels !== false) for (let j = 0; j < nv; j++) { const v = (j / nv) * TAU; for (let i = 0; i < su; i++) seg(P((i / su) * TAU, v), P(((i + 1) / su) * TAU, v)); }
    let out = buckets.map((b, k) => b.length ? `<path d="${b.join('')}" fill="none" stroke="${col}" stroke-width="${sw}" stroke-opacity="${f(back + (front - back) * (k / (levels - 1)))}" stroke-linecap="round"/>` : '').join('');

    let defs = '';
    if (o.plasma) {
      const g = id('kfp');
      defs += plasmaGrad(g, cx - R, cx + R, 'userSpaceOnUse');
      const rx = R, ry = R * ct, w = o.plasmaW ?? r * 0.5;
      const layers = o.glowLayers ?? [[3.2, 0.05], [2.3, 0.08], [1.6, 0.14], [1.1, 0.3], [0.62, 1]];
      out = layers.map(([m, a]) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${f(ry)}" fill="none" stroke="url(#${g})" stroke-width="${f(w * m)}" stroke-opacity="${a}"/>`).join('') + out;
      if (o.core !== false) out += `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${f(ry)}" fill="none" stroke="#FFE3D2" stroke-width="${f(w * 0.12)}" stroke-opacity=".85"/>`;
    }
    if (o.helix) {
      const q = o.q ?? 0.23, turns = o.turns ?? 13, n = 2400, hb = Array.from({ length: levels }, () => []);
      let prev = P(0, 0);
      for (let i = 1; i <= n; i++) {
        const s = (i / n) * TAU * turns, cur = P(s * q, s);
        const d = (prev[2] + cur[2]) / 2, k = Math.min(levels - 1, Math.max(0, Math.floor(((d + 1) / 2) * levels)));
        hb[k].push(`M${f(prev[0])} ${f(prev[1])}L${f(cur[0])} ${f(cur[1])}`); prev = cur;
      }
      const hc = o.helixColor ?? col;
      out += hb.map((b, k) => b.length ? `<path d="${b.join('')}" fill="none" stroke="${hc}" stroke-width="${o.helixW ?? sw * 1.6}" stroke-opacity="${f(0.12 + 0.88 * (k / (levels - 1)))}" stroke-linecap="round"/>` : '').join('');
    }
    return (defs ? `<defs>${defs}</defs>` : '') + out;
  }

  // ---- nested D-shaped flux surfaces: a cross-section through the plasma ----
  function flux(o = {}) {
    const cx = o.cx ?? 0, cy = o.cy ?? 0, a = o.a ?? 120, kappa = o.kappa ?? 1.7, delta = o.delta ?? 0.35, shift = o.shift ?? 0.18;
    const n = o.n ?? 9, col = o.color ?? C.cyan, sw = o.sw ?? 1;
    let out = '';
    if (o.core !== false) {
      const g = id('kfc');
      out += `<defs><radialGradient id="${g}" cx="${cx + a * shift * 0.9}" cy="${cy}" r="${a}" gradientUnits="userSpaceOnUse" gradientTransform="translate(${cx + a * shift * 0.9} ${cy}) scale(1 ${kappa}) translate(${-(cx + a * shift * 0.9)} ${-cy})">
        <stop offset="0" stop-color="#FFE3D2"/><stop offset=".18" stop-color="${C.orange}"/><stop offset=".5" stop-color="${C.magenta}" stop-opacity=".55"/><stop offset="1" stop-color="${C.magenta}" stop-opacity="0"/></radialGradient></defs>`;
      out += `<path d="${dshape(cx, cy, a, kappa, delta, shift, 1)}" fill="url(#${g})"/>`;
    }
    for (let k = 1; k <= n; k++) {
      const rho = k / n;
      out += `<path d="${dshape(cx, cy, a, kappa, delta, shift, rho)}" fill="none" stroke="${col}" stroke-width="${sw}" stroke-opacity="${f(o.fade === false ? 1 : 0.25 + 0.75 * rho)}"/>`;
    }
    return out;
  }
  function dshape(cx, cy, a, kappa, delta, shift, rho) {
    let d = '';
    for (let i = 0; i <= 96; i++) {
      const th = (i / 96) * Math.PI * 2;
      const x = cx + a * shift * (1 - rho * rho) + a * rho * Math.cos(th + delta * rho * Math.sin(th));
      const y = cy + kappa * a * rho * Math.sin(th);
      d += (i ? 'L' : 'M') + f(x) + ' ' + f(y);
    }
    return d + 'Z';
  }

  // ---- dipole field lines r = L sin^2(theta), both sides, for backgrounds ----
  function dipole(o = {}) {
    const cx = o.cx ?? 0, cy = o.cy ?? 0, Ls = o.L ?? [80, 140, 220, 320, 440, 580, 740], col = o.color ?? C.cyan, sw = o.sw ?? 1;
    const rot = o.rotate ?? 0;
    return `<g transform="rotate(${rot} ${cx} ${cy})">` + Ls.map((L, i) => {
      let d = '';
      for (const side of [1, -1]) {
        for (let k = 0; k <= 120; k++) {
          const th = 0.02 + (k / 120) * (Math.PI - 0.04), rr = L * Math.sin(th) ** 2;
          d += (k ? 'L' : 'M') + f(cx + side * rr * Math.sin(th)) + ' ' + f(cy + rr * Math.cos(th));
        }
      }
      const op = o.opacity ? o.opacity(i, Ls.length) : 0.5;
      return `<path d="${d}" fill="none" stroke="${col}" stroke-width="${sw}" stroke-opacity="${op}"/>`;
    }).join('') + '</g>';
  }

  // soft radial glow (an SVG radial gradient, safe for PDF)
  function glow(o = {}) {
    const g = id('kfg'), cx = o.cx ?? 0, cy = o.cy ?? 0, rx = o.rx ?? 300, ry = o.ry ?? rx, c = o.color ?? C.hot, a = o.opacity ?? 0.5;
    return `<defs><radialGradient id="${g}"><stop offset="0" stop-color="${c}" stop-opacity="${a}"/><stop offset=".45" stop-color="${c}" stop-opacity="${a * 0.35}"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient></defs>
      <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#${g})"/>`;
  }

  // thin engineering grid with tick marks
  function grid(o = {}) {
    const w = o.w, h = o.h, step = o.step ?? 40, col = o.color ?? '#273152', op = o.opacity ?? 1;
    let d = '';
    for (let x = step; x < w; x += step) d += `M${x} 0V${h}`;
    for (let y = step; y < h; y += step) d += `M0 ${y}H${w}`;
    return `<path d="${d}" stroke="${col}" stroke-opacity="${op}" stroke-width="${o.sw ?? 1}" fill="none"/>`;
  }

  function svg(w, h, inner, attrs = '') {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" ${attrs}>${inner}</svg>`;
  }

  function wordmark(o = {}) {
    // name in Michroma (via the Archivo 800-900 alias in kf.css), descriptor in Geist Mono. A one-word name just drops the descriptor.
    const parts = (o.text || B.full).split(' '), first = parts.shift();
    return `<span class="wordmark"><span class="wm-1">${first}</span>${parts.length && o.descriptor !== false ? `<span class="wm-2">${parts.join(' ')}</span>` : ''}</span>`;
  }
  function lockup(o = {}) {
    return `<span class="lockup">${symbol({ mode: o.mode || 'mono' })}${wordmark(o)}</span>`;
  }

  // swap {full} {short} {upper} {domain} {product} in text and a few attributes
  function brandText(root) {
    const map = { '{full}': B.full, '{short}': B.short, '{upper}': B.short.toUpperCase(), '{domain}': B.domain, '{product}': B.product };
    const rx = /\{(full|short|upper|domain|product)\}/g;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = []; while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach((n) => { if (rx.test(n.nodeValue)) n.nodeValue = n.nodeValue.replace(rx, (m) => map[m]); rx.lastIndex = 0; });
    root.querySelectorAll('[alt],[title],[href]').forEach((el) => ['alt', 'title', 'href'].forEach((a) => { const v = el.getAttribute(a); if (v && rx.test(v)) el.setAttribute(a, v.replace(rx, (m) => map[m])); rx.lastIndex = 0; }));
    document.title = document.title.replace(rx, (m) => map[m]);
  }

  // <svg data-kf="torus" data-o='{"R":200}'> gets its contents generated
  function mount(root = document) {
    root.querySelectorAll('[data-kf]').forEach((el) => {
      const kind = el.dataset.kf, o = el.dataset.o ? JSON.parse(el.dataset.o) : {};
      if (kind === 'symbol') { el.outerHTML = symbol(o); return; }
      if (kind === 'wordmark') { el.innerHTML = wordmark(o); return; }
      if (kind === 'lockup') { el.innerHTML = lockup(o); return; }
      const fn = { torus, flux, dipole, glow, grid }[kind];
      if (fn) el.insertAdjacentHTML('beforeend', fn(o));
    });
  }

  window.KF = { B, C, symbol, torus, flux, dipole, glow, grid, svg, wordmark, lockup, mount, brandText, plasmaGrad, id };
  window.KF_READY = false;
  document.addEventListener('DOMContentLoaded', async () => {
    if (window.KF_BEFORE) await window.KF_BEFORE();
    mount(); brandText(document.body);
    await document.fonts.ready;
    if (window.KF_THERMAL) await window.KF_THERMAL.mount();
    if (window.KF_AFTER) await window.KF_AFTER();
    await document.fonts.ready;
    window.KF_READY = true;
  });
})();
