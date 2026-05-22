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
