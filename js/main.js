// Three Steps Studio — main.js

// Tile thumbnails
document.querySelectorAll('.project-tile[data-thumb]').forEach(function (tile) {
  tile.style.backgroundImage = 'url(' + tile.dataset.thumb + ')';
});

// Hide tiles with no media (no data-thumb, no lottie, not a text tile)
document.querySelectorAll('.project-tile').forEach(function (tile) {
  if (tile.dataset.thumb) return;
  if (tile.querySelector('lottie-player')) return;
  if (tile.classList.contains('project-tile--text')) return;
  var link = tile.closest('.project-tile-link');
  if (link) link.style.display = 'none';
});

// UGC lightbox
(function () {
  var lightbox = document.getElementById('ugcLightbox');
  if (!lightbox) return;

  var lbVideo = document.getElementById('ugcLightboxVideo');
  var lbClose = document.getElementById('ugcLightboxClose');
  var lbBackdrop = lightbox.querySelector('.ugc-lightbox-backdrop');

  function openLightbox(src) {
    lbVideo.src = src;
    lbVideo.load();
    lbVideo.play();
    lightbox.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightbox.classList.remove('is-open');
    lbVideo.pause();
    lbVideo.src = '';
    document.body.style.overflow = '';
  }

  document.querySelectorAll('.ugc-tile[data-src]').forEach(function (tile) {
    tile.addEventListener('click', function () {
      openLightbox(tile.dataset.src);
    });
  });

  lbClose.addEventListener('click', closeLightbox);
  lbBackdrop.addEventListener('click', closeLightbox);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && lightbox.classList.contains('is-open')) closeLightbox();
  });
}());

// Mobile video: autoplay muted, tap to reveal controls
(function () {
  if (!('ontouchstart' in window) && window.innerWidth >= 768) return;
  document.querySelectorAll('video[controls]').forEach(function (video) {
    video.removeAttribute('controls');
    function showControls() {
      video.setAttribute('controls', '');
    }
    video.addEventListener('click', showControls, { once: true });
    video.addEventListener('touchend', showControls, { once: true });
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
