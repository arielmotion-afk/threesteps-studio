// Three Steps Studio — main.js

// Tile thumbnails
document.querySelectorAll('.project-tile[data-thumb]').forEach(function (tile) {
  tile.style.backgroundImage = 'url(' + tile.dataset.thumb + ')';
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
