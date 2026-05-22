// Three Steps Studio — main.js

// Tile thumbnails
document.querySelectorAll('.project-tile[data-thumb]').forEach(function (tile) {
  tile.style.backgroundImage = 'url(' + tile.dataset.thumb + ')';
});

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
