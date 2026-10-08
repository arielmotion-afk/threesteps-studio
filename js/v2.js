// No lonely words: join the last two words of each text block with a
// non-breaking space, so the final word never ends up alone on a line.
// Only the last line is affected; the rest of the paragraph wraps naturally.
(function () {
  const blocks = document.querySelectorAll('p, li, dd, h1, h2, h3, h4, h5, .lede');
  blocks.forEach((el) => {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let last = null;
    while (walker.nextNode()) if (walker.currentNode.nodeValue.trim()) last = walker.currentNode;
    if (!last || last.parentElement.closest('#heroSwap')) return;
    const text = last.nodeValue.replace(/\s+$/, '');
    const i = text.lastIndexOf(' ');
    if (i > 0) last.nodeValue = text.slice(0, i) + ' ' + text.slice(i + 1) + last.nodeValue.slice(text.length);
  });
}());

// Mini orbs: one shared FabricGlass renderer (js/fabric-glass.js) draws each visible
// orb with its own time offset, then copies the frame into that orb's 2D canvas.
(function () {
  const orbs = [...document.querySelectorAll('.mini-orb')];
  if (!orbs.length) return;
  const SIZE = 320;
  const fg = window.FabricGlass && FabricGlass(SIZE, document.body.dataset.orbPalette);
  if (!fg) { orbs.forEach((o) => o.classList.add('no-gl')); return; }
  const items = orbs.map((o, i) => {
    o.innerHTML = '<canvas class="mo-canvas"></canvas><span class="mo-rim"></span>';
    const cv = o.firstChild; cv.width = cv.height = SIZE;
    return { el: o, ctx: cv.getContext('2d'), seed: i * 17.3, on: false };
  });
  const io = new IntersectionObserver((es) => es.forEach((e) => { items.find((it) => it.el === e.target).on = e.isIntersecting; }));
  items.forEach((it) => io.observe(it.el));
  const slow = matchMedia('(prefers-reduced-motion: reduce)').matches ? .15 : 1;
  let t = 0, last = performance.now();
  (function frame(now) {
    t += Math.min(.05, (now - last) / 1000) * slow; last = now;
    for (const it of items) {
      if (!it.on) continue;
      fg.render(t + it.seed, 0);
      it.ctx.clearRect(0, 0, SIZE, SIZE); it.ctx.drawImage(fg.canvas, 0, 0);
    }
    requestAnimationFrame(frame);
  })(last);
}());
