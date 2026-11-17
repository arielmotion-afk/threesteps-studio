/* How it works: one SVG diagram that builds itself on a 14 s loop.
   Lines draw with stroke-dashoffset, nodes fade in, light dots run along the lines. */
(function () {
  var wrap = document.getElementById('flow');
  if (!wrap) return;
  var svg = wrap.querySelector('.flowsvg'), orbEl = document.getElementById('flowOrb'), T = 14, on = false, t0 = 0;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var items = [].slice.call(svg.querySelectorAll('[data-t]')).map(function (el) {
    var mk = el.getAttribute('marker-end'); if (mk) el.removeAttribute('marker-end');
    var it = { el: el, t: +el.dataset.t, d: +(el.dataset.d || .45), ln: el.classList.contains('ln'), mk: mk, mkOn: false };
    if (el.classList.contains('node')) {
      // the outer stroke opens first, then the contents appear one by one
      it.box = el.querySelector('.bx');
      it.parts = [].slice.call(el.querySelectorAll('.lab, .ic, .tx, .dotw, .sq, .vd'));
      el.style.opacity = 1;
    }
    return it;
  });
  var bad = svg.querySelectorAll('.val')[1].querySelectorAll('.vd')[1];
  var chk = svg.querySelector('.chk'), out = svg.querySelector('.outbox');
  // light balls in the Validate columns drift and breathe, each on its own rhythm
  var balls = [].slice.call(svg.querySelectorAll('.vd')).map(function (c, i) {
    var col = c.closest('.val').querySelector('.bx'), top = +col.getAttribute('y'), h = +col.getAttribute('height');
    return { c: c, y: +c.getAttribute('cy'), r: +c.getAttribute('r'), lo: top + 14, hi: top + h - 14, sp: .35 + (i * .37) % .45, ph: i * 1.7, amp: 14 + (i * 23) % 26 };
  });
  var sp = document.getElementById('sparks'), NS = 'http://www.w3.org/2000/svg', runs = [];
  function addRuns(sel, start, dur) {
    svg.querySelectorAll(sel).forEach(function (p, i) {
      var c = document.createElementNS(NS, 'circle'); c.setAttribute('r', 3.6); c.setAttribute('class', 'spk'); c.style.opacity = 0; sp.appendChild(c);
      // a ball only leaves once its own line has finished drawing
      var drawn = (+p.dataset.t || 0) + (+p.dataset.d || .45);
      runs.push({ p: p, c: c, s: Math.max(start + i * .08, drawn + .05), d: dur, L: p.getTotalLength() });
    });
  }
  addRuns('.ln.trunk', 1.0, .8);
  addRuns('.ln:not(.trunk):not(.plan):not(.run):not(.fix):not(.out)', 2.6, .7);
  addRuns('.ln.plan', 4.4, .6);
  addRuns('.ln.run', 5.4, .5);
  addRuns('.ln.fix', 8.6, .9);
  addRuns('.ln.out', 10.6, .4);
  if (window.MaestroOrb && orbEl) MaestroOrb(orbEl, { scale: .2 });

  function c01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function ease(x) { return 1 - Math.pow(1 - x, 3); }
  function draw(t) {
    var fade = t > 13.2 ? 1 - c01((t - 13.2) / .7) : 1;
    items.forEach(function (it) {
      var k = ease(c01((t - it.t) / (it.ln ? it.d : .45)));
      if (it.ln) {
        it.el.style.strokeDashoffset = 1 - k;
        var want = k > .97;
        if (it.mk && want !== it.mkOn) { it.mkOn = want; if (want) it.el.setAttribute('marker-end', it.mk); else it.el.removeAttribute('marker-end'); }
      } else if (it.box) {
        var e = t - it.t, kb = c01(e / .38), sb = 1 - Math.pow(1 - kb, 4);
        it.box.style.opacity = c01(e / .2);
        it.box.style.scale = (.4 + .6 * sb) + ' ' + (.7 + .3 * sb);
        it.parts.forEach(function (p, i) {
          var kp = ease(c01((e - .32 - i * .07) / .32));
          p.style.opacity = kp; p.style.translate = '0 ' + ((1 - kp) * 7) + 'px';
        });
      } else it.el.style.opacity = k;
    });
    runs.forEach(function (r) {
      var k = (t - r.s) / r.d;
      if (k < 0 || k > 1) { r.c.style.opacity = 0; return; }
      var pt = r.p.getPointAtLength(r.L * k); r.c.setAttribute('cx', pt.x); r.c.setAttribute('cy', pt.y); r.c.style.opacity = Math.sin(Math.PI * k);
    });
    balls.forEach(function (b) {
      var y = b.y + Math.sin(t * b.sp + b.ph) * b.amp, br = .5 + .5 * Math.sin(t * (b.sp * 2.3) + b.ph * 1.3);
      b.c.setAttribute('cy', Math.max(b.lo, Math.min(b.hi, y)).toFixed(1));
      b.c.setAttribute('r', (b.r * (.75 + .5 * br)).toFixed(2));
      b.c.style.filter = 'drop-shadow(0 0 ' + (3 + 7 * br).toFixed(1) + 'px rgba(253,211,197,' + (.55 + .4 * br).toFixed(2) + '))';
    });
    bad.classList.toggle('bad', t > 7.9 && t < 9.5);
    chk.classList.toggle('lit', t > 10.2);
    out.classList.toggle('lit', t > 10.7);
    if (orbEl) orbEl.style.opacity = (.35 + .65 * c01((t - 1.8) / 1.4)) * fade;
    svg.style.opacity = fade;
  }
  function frame(now) { if (!on) return; draw(((now - t0) / 1000) % T); requestAnimationFrame(frame); }
  if (reduce || document.documentElement.classList.contains('shot')) { draw(12); return; }
  new IntersectionObserver(function (es) {
    if (es[0].isIntersecting && !on) { on = true; t0 = performance.now(); requestAnimationFrame(frame); }
    else if (!es[0].isIntersecting) on = false;
  }, { threshold: .2 }).observe(wrap);
}());
