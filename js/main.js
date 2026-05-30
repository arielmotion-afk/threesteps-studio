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

// ─── Custom video controls (project pages) ───────────────────
(function () {
  var mobile = window.matchMedia('(hover: none)').matches;

  function fmt(s) {
    if (!isFinite(s) || isNaN(s)) return '0:00';
    s = Math.floor(s);
    return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2);
  }

  var SVG_PLAY  = '<svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M8 5v14l11-7z"/></svg>';
  var SVG_PAUSE = '<svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>';
  var SVG_VOL   = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="18" height="18"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07"/></svg>';
  var SVG_MUTE  = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="18" height="18"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>';
  var SVG_FS    = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="18" height="18"><path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3"/></svg>';

  document.querySelectorAll('.project-video-wrap video, .spot-video-wrap video').forEach(function (video) {
    video.removeAttribute('controls');

    var wrap = video.parentElement;
    var hideTimer = null;

    // Build controls
    var vc = document.createElement('div');
    vc.className = 'vc';
    vc.innerHTML =
      '<div class="vc-grad"></div>' +
      '<div class="vc-bar">' +
        '<button class="vc-play-btn" aria-label="Play/pause">' + SVG_PLAY + SVG_PAUSE + '</button>' +
        '<span class="vc-cur">0:00</span>' +
        '<div class="vc-seek-wrap"><div class="vc-seek-fill"></div>' +
          '<input class="vc-seek-input" type="range" min="0" max="1000" step="1" value="0">' +
        '</div>' +
        '<span class="vc-dur">—:——</span>' +
        '<button class="vc-vol-btn" aria-label="Toggle mute">' + SVG_MUTE + SVG_VOL + '</button>' +
        '<button class="vc-fs-btn" aria-label="Fullscreen">' + SVG_FS + '</button>' +
      '</div>';
    wrap.appendChild(vc);

    var playBtn  = vc.querySelector('.vc-play-btn');
    var playIcon = playBtn.querySelectorAll('svg')[0];
    var pauseIcon = playBtn.querySelectorAll('svg')[1];
    var curEl    = vc.querySelector('.vc-cur');
    var durEl    = vc.querySelector('.vc-dur');
    var seekInput = vc.querySelector('.vc-seek-input');
    var seekFill  = vc.querySelector('.vc-seek-fill');
    var volBtn   = vc.querySelector('.vc-vol-btn');
    var muteIcon = volBtn.querySelectorAll('svg')[0];
    var volIcon  = volBtn.querySelectorAll('svg')[1];
    var fsBtn    = vc.querySelector('.vc-fs-btn');

    pauseIcon.style.display = 'none';

    function updatePlayState() {
      var playing = !video.paused && !video.ended;
      playIcon.style.display  = playing ? 'none'  : 'block';
      pauseIcon.style.display = playing ? 'block' : 'none';
    }

    function updateProgress() {
      if (!video.duration || !isFinite(video.duration)) return;
      var pct = (video.currentTime / video.duration) * 1000;
      seekInput.value = pct;
      seekFill.style.width = (pct / 10) + '%';
      curEl.textContent = fmt(video.currentTime);
    }

    function show() {
      wrap.classList.add('vc-active');
      clearTimeout(hideTimer);
    }

    function scheduleHide(ms) {
      clearTimeout(hideTimer);
      if (!video.paused && !video.ended) {
        hideTimer = setTimeout(function () {
          wrap.classList.remove('vc-active');
        }, ms);
      }
    }

    video.addEventListener('loadedmetadata', function () {
      durEl.textContent = fmt(video.duration);
    });
    video.addEventListener('timeupdate', updateProgress);
    video.addEventListener('play', function () {
      updatePlayState();
      if (mobile) scheduleHide(1800);
    });
    video.addEventListener('pause', function () {
      updatePlayState();
      clearTimeout(hideTimer);
      show();
    });
    video.addEventListener('ended', function () {
      updatePlayState();
      show();
    });

    // Play / pause button
    playBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      video.paused || video.ended ? video.play() : video.pause();
      show();
    });

    // Seek
    seekInput.addEventListener('input', function (e) {
      e.stopPropagation();
      if (video.duration && isFinite(video.duration)) {
        video.currentTime = (seekInput.value / 1000) * video.duration;
      }
      seekFill.style.width = (seekInput.value / 10) + '%';
      show();
    });
    seekInput.addEventListener('click', function (e) { e.stopPropagation(); });

    // Mute / unmute
    function updateVolState() {
      muteIcon.style.display = video.muted ? 'block' : 'none';
      volIcon.style.display  = video.muted ? 'none'  : 'block';
    }
    updateVolState();
    volBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      video.muted = !video.muted;
      updateVolState();
      show();
    });

    // Fullscreen
    fsBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      var fsEl = document.fullscreenElement || document.webkitFullscreenElement;
      if (fsEl) {
        (document.exitFullscreen || document.webkitExitFullscreen).call(document);
      } else {
        var req = wrap.requestFullscreen || wrap.webkitRequestFullscreen;
        if (req) req.call(wrap);
      }
    });

    // Click / tap on wrap or video directly
    function handleToggle(e) {
      if (e.target.closest('.vc-bar')) return; // controls handle themselves
      if (mobile) {
        if (!wrap.classList.contains('vc-active')) {
          show();
          scheduleHide(1800);
        } else {
          video.paused || video.ended ? video.play() : video.pause();
        }
      } else {
        video.paused || video.ended ? video.play() : video.pause();
        show();
      }
    }
    wrap.addEventListener('click', handleToggle);
    video.addEventListener('click', handleToggle);

    // Desktop hover
    if (!mobile) {
      wrap.addEventListener('mousemove', show);
      wrap.addEventListener('mouseleave', function () {
        if (!video.paused) scheduleHide(900);
      });
    }

    // Initial state
    updatePlayState();
    show();
    if (!video.paused) scheduleHide(mobile ? 1800 : 2500);
  });
}());
