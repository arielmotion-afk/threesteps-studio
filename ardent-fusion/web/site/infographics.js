// Ardent product infographics, drawn as SVG into <div data-info="ring|coil|temp|field">.
// Only established, illustrative content: 18 coils, layer names, real temperatures, B^4 scaling (simplified).
(() => {
  const ICE = '#39F2F7', PINK = '#F02DBE', EDGE = 'rgba(124,242,176,.35)', MUTE = '#8B96AD', OFF = '#EDF1F2', BG = '#020107';
  const defs = (id) => `<defs>
    <linearGradient id="${id}-hot" x1="0" x2="1"><stop offset="0" stop-color="${PINK}"/><stop offset=".35" stop-color="#8A2BB8"/><stop offset=".65" stop-color="#1E6BFF"/><stop offset=".9" stop-color="${ICE}"/><stop offset="1" stop-color="#E6FFE8"/></linearGradient>
    <linearGradient id="${id}-c2h" x1="0" x2="1"><stop offset="0" stop-color="${ICE}"/><stop offset=".5" stop-color="#1E6BFF"/><stop offset=".8" stop-color="#8A2BB8"/><stop offset="1" stop-color="${PINK}"/></linearGradient>
    <linearGradient id="${id}-c2hv" x1="0" x2="0" y1="1" y2="0"><stop offset="0" stop-color="${ICE}"/><stop offset=".5" stop-color="#1E6BFF"/><stop offset=".8" stop-color="#8A2BB8"/><stop offset="1" stop-color="${PINK}"/></linearGradient>
    <filter id="${id}-blur" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="10"/></filter></defs>`;
  const T = (x, y, s, o = {}) => `<text x="${x}" y="${y}" fill="${o.c || MUTE}" font-family="${o.f || 'Geist Mono'}" font-size="${o.z || 14}" letter-spacing="${o.ls ?? 1.2}" text-anchor="${o.a || 'start'}"${o.cls ? ` class="${o.cls}"` : ''}${o.st ? ` style="${o.st}"` : ''}>${s}</text>`;
  let uid = 0;

  // 01 reactor: tilted view of 18 coils looping around a ring of plasma, the AR-1 lit
  const ring = (el) => {
    const id = 'i' + uid++, cx = 320, cy = 200, R = 205, a = 46, b = 80, el0 = 28 * Math.PI / 180, se = Math.sin(el0), ce = Math.cos(el0);
    // each coil is a loop around the plasma tube
    const P = (phi, t) => { const c = Math.cos(t), r = R + a * c; return [cx + r * Math.cos(phi), cy + r * Math.sin(phi) * se - b * Math.sin(t) * ce]; };
    const arc = (phi, t0, t1) => 'M' + Array.from({ length: 61 }, (_, i) => P(phi, t0 + (t1 - t0) * i / 60).map((v) => v.toFixed(1)).join(' ')).join(' L');
    const HERO = 3, coils = Array.from({ length: 18 }, (_, i) => ({ i, phi: i / 18 * Math.PI * 2 + Math.PI / 36 }));
    // each coil wraps the plasma: the leg nearer the viewer crosses in front of the glow, the far leg passes behind it
    // (front coils show their outer leg, back coils their inner leg)
    const OUT = [-Math.PI / 2, Math.PI / 2], IN = [Math.PI / 2, Math.PI * 1.5];
    const half = (c, near, k) => { const on = c.i === HERO, front = Math.sin(c.phi) >= 0, [t0, t1] = (front === near) ? OUT : IN, d = arc(c.phi, t0, t1);
      return `<g class="coilp${on ? ' hero' : ''}" style="--d:${300 + k * 80}ms"><path d="${d}" pathLength="1" fill="none" stroke="#000" stroke-width="9" stroke-linecap="round"/><path d="${d}" pathLength="1" fill="none" stroke="${on ? ICE : EDGE}" stroke-width="${on ? 2.5 : 1.1}" stroke-opacity="${on ? 1 : near ? .9 : .7}" stroke-linecap="round"/></g>`; };
    const order = [...coils].sort((p, q) => Math.sin(p.phi) - Math.sin(q.phi));
    const [hx, hy] = P(coils[HERO].phi, -Math.PI / 2);
    el.innerHTML = `<svg viewBox="0 6 640 464" role="img" aria-label="A reactor seen from above at an angle: 18 coil modules loop around a ring of plasma. One of them is the AR-1.">${defs(id)}
      ${order.map((c, k) => half(c, false, k)).join('')}
      <ellipse class="glow" cx="${cx}" cy="${cy}" rx="${R}" ry="${R * se}" fill="none" stroke="url(#${id}-hot)" stroke-width="46" filter="url(#${id}-blur)"/>
      <ellipse cx="${cx}" cy="${cy}" rx="${R}" ry="${R * se}" fill="none" stroke="url(#${id}-hot)" stroke-width="10" stroke-opacity=".9"/>
      ${order.map((c, k) => half(c, true, k)).join('')}
      <g class="late"><path d="M${hx.toFixed(1)} ${(hy + 10).toFixed(1)}V392H620" fill="none" stroke="${ICE}" stroke-width="1.2"/>${T(620, 382, '1 × ' + window.KF_BRAND.product + ' MODULE', { c: ICE, a: 'end', z: 17 })}</g>
      <path d="M20 422H620" stroke="${EDGE}"/>
      ${T(20, 452, '18 MODULES · ONE REACTOR', { c: OFF, z: 16 })}${T(620, 452, 'ILLUSTRATIVE, NOT TO SCALE', { a: 'end', z: 14 })}</svg>`;
  };

  // 02 inside one coil: black steel case, copper line, two plates of stacked tape, cooling channels in the gap
  const coil = (el) => {
    const id = 'i' + uid++;
    let tape = '';
    [[92, 176], [224, 308]].forEach(([x0, x1], k) => { for (let i = 0; i < 34; i++) { const y = 92 + i * 6.5;
      tape += `<path class="tp" style="--d:${500 + i * 28 + k * 120}ms" d="M${x0} ${y.toFixed(1)}H${x1}" stroke="url(#${id}-tape)" stroke-width="2.2" stroke-linecap="round"/>`; } });
    const chans = [130, 200, 270].map((y, i) => `<g class="chg" style="--d:${1500 + i * 150}ms"><circle cx="200" cy="${y}" r="13" fill="${BG}" stroke="${ICE}" stroke-width="2"/><circle class="he" cx="200" cy="${y}" r="5" fill="${ICE}"/></g>`).join('');
    const pin = (n, tx, ty, py) => `<g class="late"><path d="M${tx} ${ty}H404V${py}H424" fill="none" stroke="${OFF}" stroke-opacity=".5" stroke-width="1"/><circle cx="${tx}" cy="${ty}" r="3.5" fill="${OFF}"/><circle cx="440" cy="${py}" r="15" fill="${BG}" stroke="${OFF}" stroke-width="1.2"/>${T(440, py + 5, n, { c: OFF, a: 'middle', z: 14, ls: 0 })}</g>`;
    el.innerHTML = `<div class="coil-fig"><svg viewBox="0 0 470 400" role="img" aria-label="Cross-section of one coil leg: steel case, copper, two plates of stacked superconducting tape, and three helium cooling channels between them.">${defs(id)}
        <linearGradient id="${id}-tape" gradientUnits="userSpaceOnUse" x1="0" x2="0" y1="308" y2="92"><stop offset="0" stop-color="${ICE}"/><stop offset=".5" stop-color="#1E6BFF"/><stop offset=".8" stop-color="#8A2BB8"/><stop offset="1" stop-color="${PINK}"/></linearGradient>
        <rect class="draw" pathLength="1" x="14" y="14" width="372" height="372" rx="30" fill="#07060D" stroke="${EDGE}" stroke-width="1.5"/>
                <rect class="draw" pathLength="1" style="transition-delay:.35s" x="72" y="72" width="256" height="256" rx="10" fill="${BG}" stroke="${PINK}" stroke-width="2"/>
        ${tape}${chans}
        ${pin(1, 386, 46, 46)}${pin(2, 308, 120, 132)}${pin(3, 213, 200, 218)}${pin(4, 328, 300, 304)}</svg></div>
      <ol class="legend">
        <li><b>Steel case</b><span>Holds the coil together against the magnetic forces.</span></li>
        <li><b>REBCO tape stack</b><span>Superconducting tape, stacked in plates. Carries the current with no resistance.</span></li>
        <li><b>Cooling channels</b><span>Helium gas flows through to hold the coil at 20 K.</span></li>
        <li><b>Copper</b><span>Wraps the tape stack and protects it.</span></li>
      </ol>
      <p class="foot">Cross-section of one coil leg · illustrative, not to scale</p>`;
  };

  // 04 coldest next to hottest: true log scale, horizontal on wide screens, vertical on phones
  const TEMPS = [[20, '20 K', 'The coil', ICE], [300, '300 K', 'This room', MUTE], [5800, '5,800 K', 'Surface of the sun', MUTE], [1.5e7, '15 million K', 'Centre of the sun', MUTE], [1e8, '100 million K', 'The plasma', PINK]];
  const lg = (v) => (Math.log10(v) - Math.log10(20)) / (8 - Math.log10(20));
  const temp = (el) => {
    const id = 'i' + uid++, narrow = el.clientWidth < 640, fs = +(el.dataset.fs || 1);
    if (!narrow) {
      const X = (v) => 70 + lg(v) * 860;
      let s = `<rect class="bar" x="70" y="150" width="860" height="16" rx="8" fill="url(#${id}-c2h)"/>`;
      TEMPS.forEach(([v, val, lab, c], i) => {
        const x = X(v), up = i % 2 === 0, a = x > 860 ? 'end' : x < 120 ? 'start' : 'middle';
        s += `<g class="tick" style="transition-delay:${700 + lg(v) * 900}ms"><path d="M${x} ${up ? 144 : 172}V${up ? 98 : 218}" stroke="${c}" stroke-width="1.2"/><circle cx="${x}" cy="158" r="5" fill="${BG}" stroke="${c}" stroke-width="2"/>
          ${T(x, up ? 70 - 22 * (fs - 1) : 248 + 14 * (fs - 1), val, { c: c === MUTE ? OFF : c, a, z: 17 * fs, ls: .5 })}${T(x, up ? 92 - 4 * (fs - 1) : 272 + 34 * (fs - 1), lab.toUpperCase(), { a, z: 13 * fs })}</g>`;
      });
      s += T(70, 318 + 40 * (fs - 1), 'LOG SCALE · KELVIN', { z: 12 * fs });
      el.innerHTML = `<svg viewBox="0 ${-40 * (fs - 1)} 1000 ${330 + 90 * (fs - 1)}" role="img" aria-label="Log scale of temperatures: the coil at 20 K, this room at 300 K, the surface of the sun at 5,800 K, the centre of the sun at 15 million K, the plasma at 100 million K.">${defs(id)}${s}</svg>`;
    } else {
      const Y = (v) => 560 - lg(v) * 500;
      let s = `<rect class="bar v" x="40" y="60" width="14" height="500" rx="7" fill="url(#${id}-c2hv)"/>`;
      TEMPS.forEach(([v, val, lab, c], i) => {
        const y = Y(v);
        s += `<g class="tick" style="transition-delay:${700 + lg(v) * 900}ms"><path d="M60 ${y}H92" stroke="${c}" stroke-width="1.2"/><circle cx="47" cy="${y}" r="5" fill="${BG}" stroke="${c}" stroke-width="2"/>
          ${T(104, y - 2, val, { c: c === MUTE ? OFF : c, z: 22, ls: .5 })}${T(104, y + 22, lab.toUpperCase(), { z: 16 })}</g>`;
      });
      s += T(40, 600, 'LOG SCALE · KELVIN', { z: 15 });
      el.innerHTML = `<svg viewBox="0 0 400 612" role="img" aria-label="Log scale of temperatures from 20 K to 100 million K.">${defs(id)}${s}</svg>`;
    }
    el.classList.toggle('in', el.dataset.seen === '1');
  };

  // 05 field slider: drag the field from 1 x to 2 x, power density follows B^4 (simplified)
  const field = (el) => {
    const id = 'i' + uid++, X = (b) => 60 + (b - 1) * 500, Y = (b) => 330 - (b ** 4 - 1) / 15 * 270;
    const curve = Array.from({ length: 61 }, (_, i) => { const b = 1 + i / 60; return `${X(b).toFixed(1)} ${Y(b).toFixed(1)}`; }).join(' L');
    el.innerHTML = `<div class="readout"><div><b class="pd">16 ×</b><span>Power density</span></div><div><b class="bf">2 ×</b><span>Field strength</span></div></div>
      <svg viewBox="0 0 600 370" role="img" aria-label="Power density rises with the fourth power of field strength: double the field gives sixteen times the power density.">${defs(id)}
        <path d="M60 330H562" stroke="${EDGE}"/>
        ${[1, 1.5, 2].map((b) => `<path d="M${X(b)} 330v8" stroke="${EDGE}"/>${T(X(b), 364, b + ' ×', { a: b === 2 ? 'end' : b === 1 ? 'start' : 'middle', z: 20 })}`).join('')}
        <path class="curve" pathLength="1" d="M${curve}" fill="none" stroke="url(#${id}-c2h)" stroke-width="3.5" stroke-linecap="round"/>
        <path class="fill" d="M${curve} L${X(2)} 330 L${X(1)} 330Z" fill="url(#${id}-c2h)" opacity=".1"/>
        <path class="drop" stroke="${OFF}" stroke-dasharray="3 5"/>
        <circle class="knob" r="9" fill="${OFF}"/></svg>
      <label class="range"><span>Drag the field strength</span><input type="range" min="1" max="2" step="0.01" value="2" aria-label="Field strength, relative"></label>
      <p class="foot">Simplified: in a tokamak, fusion power density rises roughly with the fourth power of the field.</p>`;
    const inp = el.querySelector('input'), knob = el.querySelector('.knob'), drop = el.querySelector('.drop'), pd = el.querySelector('.pd'), bf = el.querySelector('.bf');
    const set = () => { const b = +inp.value, x = X(b), y = Y(b); knob.setAttribute('cx', x); knob.setAttribute('cy', y); drop.setAttribute('d', `M${x} ${y}V330`);
      const p = b ** 4; pd.textContent = (p < 9.95 ? p.toFixed(1) : Math.round(p)) + ' ×'; bf.textContent = b.toFixed(2).replace(/0$/, '').replace(/\.0$/, '') + ' ×';
      inp.style.setProperty('--p', (b - 1) * 100 + '%'); };
    let touched = false; inp.addEventListener('input', () => { touched = true; set(); }); set();
    // on first view the slider plays from 1 x to 2 x, unless someone already moved it
    el.play = () => { if (touched || (matchMedia('(prefers-reduced-motion: reduce)').matches && !window.__rate)) return; const t0 = performance.now();
      const step = (now) => { if (touched) return; const k = Math.min(1, ((now - t0) * (window.__rate || 1) - 500) / 1800); const e = k < 0 ? 0 : 1 - (1 - k) ** 3; inp.value = 1 + e; set(); if (k < 1) next(step); };
      const next = (f) => (window.__rate ? setTimeout(() => f(performance.now()), 16) : requestAnimationFrame(f));
      inp.value = 1; set(); next(step); };
  };

  const R = { ring, coil, temp, field };
  window.addEventListener('DOMContentLoaded', () => {
    const els = [...document.querySelectorAll('[data-info]')];
    els.forEach((el) => R[el.dataset.info](el));
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.dataset.seen = '1'; e.target.classList.add('in'); e.target.play && e.target.play(); io.unobserve(e.target); } }), { rootMargin: '0px 0px -15% 0px' });
    if (!window.__manual) els.forEach((el) => io.observe(el)); // posts start the graphics themselves
    let w = innerWidth; addEventListener('resize', () => { if (Math.abs(innerWidth - w) < 40) return; w = innerWidth; els.filter((e) => e.dataset.info === 'temp').forEach(temp); });
  });
})();
