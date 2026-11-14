// Ardent website: shared nav, footer, clips, scroll behaviour. Runs before kf.js mounts the logo and brand text.
(() => {
  const links = [['Technology', 'technology.html'], ['{product}', 'ar-1.html'], ['Company', 'company.html'], ['Careers', 'careers.html']];
  const NAV = (page) => `<nav class="nav" id="nav"><a class="logo" href="home.html" aria-label="{full} home"><span data-kf="lockup"></span></a>
    <span class="lk">${links.map(([l, h]) => `<a href="${h}" class="${h === page + '.html' ? 'on' : ''}">${l}</a>`).join('')}</span>
    <a class="btn w" href="home.html#contact">Contact</a>
    <button class="menu" aria-label="Menu" aria-expanded="false"><span></span><span></span></button></nav>`;
  const FOOT = `<footer class="foot"><div class="in">
    <div><span data-kf="lockup" style="font-size:22px;color:var(--off)"></span><div style="margin-top:18px">Eindhoven, the Netherlands</div><div class="note">Self-initiated concept by Ariel Paz.<br>{full} is a fictional company.</div></div>
    <div><b>COMPANY</b><a href="technology.html">Technology</a><br><a href="ar-1.html">{product}</a><br><a href="company.html">Company</a><br><a href="company.html#news">News</a></div>
    <div><b>WORK WITH US</b><a href="careers.html">Careers</a><br><a href="home.html#contact">Partners and suppliers</a><br><a href="home.html#contact">Investors</a></div>
    <div><b>CONTACT</b>press@{domain}<br>invest@{domain}<br>LinkedIn</div></div></footer>`;

  window.KF_BEFORE = () => {
    document.body.insertAdjacentHTML('afterbegin', NAV(document.body.dataset.page));
    document.body.insertAdjacentHTML('beforeend', FOOT);
    const nav = document.getElementById('nav'), menu = nav.querySelector('.menu');
    menu.onclick = () => { const o = nav.classList.toggle('open'); menu.setAttribute('aria-expanded', o); document.body.style.overflow = o ? 'hidden' : ''; };
    nav.querySelectorAll('.lk a').forEach((a) => a.addEventListener('click', () => { nav.classList.remove('open'); document.body.style.overflow = ''; }));
    const solid = () => nav.classList.toggle('solid', scrollY > 40); solid(); addEventListener('scroll', solid, { passive: true });

    // clips: <div class="clip" data-clip="plasma"> becomes a muted loop that only plays while on screen
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const io = new IntersectionObserver((es) => es.forEach((e) => { const v = e.target; if (e.isIntersecting) { if (!v.src) v.src = v.dataset.src; v.play().catch(() => {}); } else v.pause(); }), { rootMargin: '200px' });
    document.querySelectorAll('[data-clip]').forEach((el) => {
      const n = el.dataset.clip, pos = el.dataset.pos || 'center', fit = el.dataset.fit ? `;object-fit:${el.dataset.fit}` : '';
      if (still) { el.innerHTML = `<img src="media/${n}.jpg" alt="" style="object-position:${pos}${fit}">`; return; }
      el.innerHTML = `<video muted loop playsinline preload="none" poster="media/${n}.jpg" data-src="media/${n}.mp4" style="object-position:${pos}${fit}" aria-hidden="true"></video>`;
      io.observe(el.firstChild);
    });

    // how it works: the step in the middle of the screen picks the clip on the stage
    const steps = [...document.querySelectorAll('.step')], stage = [...document.querySelectorAll('.stage .clip')];
    if (steps.length) { const so = new IntersectionObserver((es) => es.forEach((e) => { if (!e.isIntersecting) return; const i = steps.indexOf(e.target);
      steps.forEach((s, k) => s.classList.toggle('on', k === i)); stage.forEach((c, k) => c.classList.toggle('on', k === i)); }), { rootMargin: '-45% 0px -45% 0px' });
      steps.forEach((s) => so.observe(s)); steps[0].classList.add('on'); stage[0] && stage[0].classList.add('on'); }

    // reveal on scroll
    const ro = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); ro.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
    document.querySelectorAll('.rv').forEach((el) => ro.observe(el));

    // film links open in a pop-up player instead of leaving the page
    document.querySelectorAll('[data-film]').forEach((a) => a.addEventListener('click', (e) => {
      e.preventDefault();
      const d = document.createElement('div'); d.className = 'film' + (a.dataset.film === 'portrait' ? ' portrait' : '');
      d.innerHTML = `<button aria-label="Close">×</button><video src="${a.getAttribute('href')}" controls autoplay playsinline></video>`;
      const close = () => { d.remove(); document.body.style.overflow = ''; removeEventListener('keydown', esc); };
      const esc = (k) => k.key === 'Escape' && close();
      d.addEventListener('click', (k) => k.target === d && close()); d.querySelector('button').onclick = close; addEventListener('keydown', esc);
      document.body.appendChild(d); document.body.style.overflow = 'hidden';
    }));

    // careers filters
    document.querySelectorAll('.filters button').forEach((b, _, all) => b.onclick = () => {
      all.forEach((x) => x.classList.toggle('on', x === b));
      document.querySelectorAll('.roles a').forEach((r) => r.hidden = b.dataset.f !== 'all' && r.dataset.t !== b.dataset.f);
    });
  };
})();
