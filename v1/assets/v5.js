/* Adir Vassal · v5 home: the opening film, the header over it, the second film.
   The films keep themselves running: they retry when the browser refuses or interrupts playback,
   after returning to the tab/app, and on the first tap when autoplay is blocked
   (iPhone Low Power Mode). Until then the still frame shows, with no native play button. */
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var narrow = window.matchMedia('(max-width: 760px)').matches;
  var keepers = [], needTap = false;

  function keep(v, startVisible) {
    var k = { v: v, visible: startVisible, last: -1, stuck: 0, errors: 0 };
    k.wants = function () { return k.visible && !document.hidden; };
    k.play = function () {
      if (!k.wants() || !v.paused) return;
      v.muted = true;
      var p = v.play();
      if (p && p.catch) p.catch(function (err) { if (err && err.name === 'NotAllowedError') needTap = true; });
    };
    v.muted = true; v.defaultMuted = true; v.setAttribute('muted', '');
    v.playsInline = true; v.setAttribute('playsinline', ''); v.setAttribute('webkit-playsinline', '');
    v.loop = true; v.controls = false;
    ['loadedmetadata', 'loadeddata', 'canplay', 'canplaythrough', 'ended'].forEach(function (n) { v.addEventListener(n, k.play); });
    v.addEventListener('playing', function () { needTap = false; k.errors = 0; k.stuck = 0; });
    v.addEventListener('pause', function () { setTimeout(k.play, 350); }); // the system interrupted it
    function recover() {
      if (k.errors >= 3) return;
      k.errors++;
      setTimeout(function () { v.load(); k.play(); }, 1000 * k.errors);
    }
    v.addEventListener('error', recover);
    var source = v.querySelector('source');
    if (source) source.addEventListener('error', recover);
    keepers.push(k);
    return k;
  }

  function resumeAll() { keepers.forEach(function (k) { k.play(); }); }

  // a real tap unlocks blocked films; off-screen ones are unlocked and paused again
  function onGesture() {
    if (!needTap) return;
    keepers.forEach(function (k) {
      if (!k.v.paused) return;
      if (k.wants()) { k.play(); return; }
      var p = k.v.play();
      if (p && p.then) p.then(function () { if (!k.wants()) k.v.pause(); }).catch(function () {});
    });
  }

  // watchdog: restarts a film that stopped or froze without telling anyone
  function watchdog() {
    keepers.forEach(function (k) {
      var v = k.v;
      if (!k.wants()) { k.stuck = 0; return; }
      if (v.paused) { k.play(); return; }
      if (v.currentTime === k.last) k.stuck++; else k.stuck = 0;
      k.last = v.currentTime;
      if (k.stuck === 3) { v.pause(); k.play(); }
      else if (k.stuck >= 8) {
        var at = v.currentTime;
        k.stuck = 0;
        v.addEventListener('loadedmetadata', function once() {
          v.removeEventListener('loadedmetadata', once);
          try { v.currentTime = at; } catch (err) {}
        });
        v.load(); k.play();
      }
    });
  }

  function watch(k, threshold) {
    if (!('IntersectionObserver' in window)) { k.visible = true; k.play(); return; }
    new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        k.visible = e.isIntersecting;
        if (e.isIntersecting) k.play(); else if (!k.v.paused) k.v.pause();
      });
    }, { threshold: threshold }).observe(k.v);
  }

  // opening film: wide cut on screens, square cut on phones. With reduced motion only the still frame shows.
  var v = document.getElementById('film');
  if (v) {
    if (narrow) v.poster = v.dataset.sqPoster;
    v.classList.add('is-on');
    if (reduce) { v.removeAttribute('autoplay'); }
    else {
      var hero1 = keep(v, true);
      v.src = narrow ? v.dataset.sq : v.dataset.wide;
      hero1.play();
      watch(hero1, 0.05);
    }
  }

  // header: transparent and white over the film, white once past it
  var hd = document.querySelector('.header'), hero = document.querySelector('.vhero');
  function sc() { if (hd && hero) hd.classList.toggle('is-past', window.scrollY > hero.offsetHeight - 90); }
  window.addEventListener('scroll', sc, { passive: true }); sc();

  // the second film only plays while it is on screen
  var f2 = document.getElementById('film2');
  if (f2 && !reduce) watch(keep(f2, false), 0.25);

  if (keepers.length) {
    document.addEventListener('visibilitychange', resumeAll);
    window.addEventListener('pageshow', resumeAll);
    window.addEventListener('focus', resumeAll);
    window.addEventListener('online', resumeAll);
    ['touchend', 'pointerup', 'click', 'keydown'].forEach(function (n) {
      document.addEventListener(n, onGesture, { passive: true });
    });
    setInterval(watchdog, 2000);
  }
})();
