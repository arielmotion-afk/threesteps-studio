// Three Steps Studio — main.js

// YouTube thumbnails
document.querySelectorAll('.project-tile[data-video]').forEach(function (tile) {
  var id = tile.dataset.video;
  var img = new Image();
  img.onload = function () {
    tile.style.backgroundImage = 'url(' + img.src + ')';
  };
  img.onerror = function () {
    // maxresdefault not available, fall back
    tile.style.backgroundImage = 'url(https://img.youtube.com/vi/' + id + '/hqdefault.jpg)';
  };
  img.src = 'https://img.youtube.com/vi/' + id + '/maxresdefault.jpg';
});

// Lightbox
(function () {
  var lightbox = document.getElementById('lightbox');
  var iframe   = document.getElementById('lightbox-iframe');
  var closeBtn = document.getElementById('lightbox-close');
  if (!lightbox) return;

  function open(videoId) {
    iframe.src = 'https://www.youtube.com/embed/' + videoId + '?autoplay=1&rel=0';
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    iframe.src = '';
    document.body.style.overflow = '';
  }

  document.querySelectorAll('.project-tile[data-video]').forEach(function (tile) {
    tile.addEventListener('click', function () { open(tile.dataset.video); });
  });

  closeBtn.addEventListener('click', close);
  lightbox.addEventListener('click', function (e) {
    if (e.target === lightbox) close();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') close();
  });
}());

// Lottie hero animation — drop animations/hero.json to activate
(function () {
  var el = document.getElementById('lottie-hero');
  if (!el || typeof lottie === 'undefined') return;

  fetch('animations/hero.json')
    .then(function (r) { if (!r.ok) throw new Error('not found'); return r.json(); })
    .then(function () {
      lottie.loadAnimation({
        container: el,
        renderer: 'svg',
        loop: true,
        autoplay: true,
        path: 'animations/hero.json',
      });
    })
    .catch(function () {});
}());
