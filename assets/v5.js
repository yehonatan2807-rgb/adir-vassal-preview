/* Adir Vassal · v5 home: the opening film, the header over it, the second film. */
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var narrow = window.matchMedia('(max-width: 760px)').matches;

  // opening film: wide cut on screens, square cut on phones. With reduced motion only the still frame shows.
  var v = document.getElementById('film');
  if (v) {
    if (narrow) v.poster = v.dataset.sqPoster;
    v.classList.add('is-on');
    if (!reduce) {
      v.src = narrow ? v.dataset.sq : v.dataset.wide;
      var p = v.play(); if (p && p.catch) p.catch(function () {});
    }
  }

  // header: transparent and white over the film, white once past it
  var hd = document.querySelector('.header'), hero = document.querySelector('.vhero');
  function sc() { if (hd && hero) hd.classList.toggle('is-past', window.scrollY > hero.offsetHeight - 90); }
  window.addEventListener('scroll', sc, { passive: true }); sc();

  // the second film only plays while it is on screen
  var f2 = document.getElementById('film2');
  if (f2 && !reduce && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { var q = f2.play(); if (q && q.catch) q.catch(function () {}); } else f2.pause();
      });
    }, { threshold: 0.25 }).observe(f2);
  }
})();
