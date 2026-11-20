(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // logo curtain (home page, first visit only): let the hero start as the curtain lifts
  var root = document.documentElement;
  if (root.classList.contains('intro')) {
    setTimeout(function () { root.classList.remove('intro'); }, 1200);
    setTimeout(function () { root.classList.add('no-intro'); }, 2100);
  }

  // header + floating whatsapp
  var header = document.querySelector('.header');
  var wa = document.querySelector('.wa');
  function onScroll() {
    var y = window.scrollY;
    if (header) header.classList.toggle('is-solid', y > 40);
    if (wa) wa.classList.toggle('is-shown', y > window.innerHeight * 0.6);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  var askSec = document.getElementById('ask');
  if (wa && askSec && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (en) { wa.classList.toggle('is-away', en[0].isIntersecting); }, { rootMargin: '0px 0px -15% 0px' }).observe(askSec);
  }

  // mobile menu
  var btn = document.querySelector('.menu-btn');
  var nav = document.getElementById('nav');
  function setMenu(open) {
    document.body.classList.toggle('menu-open', open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    btn.setAttribute('aria-label', open ? btn.dataset.close : btn.dataset.open);
  }
  if (btn && nav) {
    btn.addEventListener('click', function () { setMenu(!document.body.classList.contains('menu-open')); });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && document.body.classList.contains('menu-open')) { setMenu(false); btn.focus(); }
    });
  }

  // reveal on scroll (hero shows right away)
  requestAnimationFrame(function () {
    document.querySelectorAll('.hero .rv, .ghero .rv').forEach(function (el) { el.classList.add('in'); });
  });
  var items = document.querySelectorAll('.rv:not(.hero .rv):not(.ghero .rv)');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add('in'); });
  }

  // lightbox
  var lb = document.getElementById('lb');
  var pieces = Array.prototype.slice.call(document.querySelectorAll('[data-lb]'));
  if (lb && pieces.length && typeof lb.showModal === 'function') {
    var lbImg = lb.querySelector('img'), lbCap = lb.querySelector('p'), cur = 0, opener = null;
    // only step through pieces the current filter shows
    var visible = function () { return pieces.filter(function (b) { return !b.closest('figure').hidden; }); };
    var show = function (i) {
      var list = visible();
      cur = (i + list.length) % list.length;
      var fig = list[cur].closest('figure');
      var img = fig.querySelector('img');
      lbImg.src = img.currentSrc || img.src;
      lbImg.alt = img.alt;
      lbCap.textContent = fig.querySelector('figcaption').textContent.replace(/\s+/g, ' ').trim();
    };
    pieces.forEach(function (b) {
      b.addEventListener('click', function () { opener = b; show(visible().indexOf(b)); lb.showModal(); });
    });
    var rtl = document.documentElement.dir === 'rtl';
    lb.querySelector('.lb__close').addEventListener('click', function () { lb.close(); });
    lb.querySelector('.lb__prev').addEventListener('click', function () { show(cur - 1); });
    lb.querySelector('.lb__next').addEventListener('click', function () { show(cur + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) lb.close(); });
    lb.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') show(rtl ? cur + 1 : cur - 1);
      if (e.key === 'ArrowRight') show(rtl ? cur - 1 : cur + 1);
    });
    lb.addEventListener('close', function () { if (opener) opener.focus(); });
  }

  // ring designer
  var d = document.querySelector('[data-designer]');
  if (d) {
    var steps = Array.prototype.slice.call(d.querySelectorAll('.dstep'));
    var total = steps.length - 1; // last one is the summary
    var count = d.querySelector('.designer__count');
    var bar = d.querySelector('.designer__bar i');
    var back = d.querySelector('[data-back]');
    var ring = d.querySelector('.ring');
    var stone = ring.querySelector('.r-stone');
    var halo = ring.querySelector('.r-halo');
    var wrap = ring.querySelector('.r-stone-wrap');
    var band = ring.querySelectorAll('.r-band rect');
    var nameEl = d.querySelector('.designer__name');
    var descEl = d.querySelector('.designer__desc');
    var metals = { white: 'url(#m-white)', yellow: 'url(#m-yellow)', rose: 'url(#m-rose)', unsure: 'url(#m-unsure)' };
    var sizes = { s: 1.55, m: 1.75, l: 1.9, xl: 2.05, unsure: 1.75 };
    var latin = { round: 'Round Brilliant', oval: 'Oval', emerald: 'Emerald', pear: 'Pear', cushion: 'Cushion',
      princess: 'Princess', radiant: 'Radiant', marquise: 'Marquise', unsure: '—' };
    var state = {}, idx = 0;

    var drawStone = function (btn) {
      var svg = btn.querySelector('svg');
      if (!svg) return;
      var v = btn.dataset.value === 'unsure' ? null : svg.innerHTML;
      if (v) {
        stone.innerHTML = v;
        halo.innerHTML = svg.firstElementChild.outerHTML;
      }
      nameEl.textContent = latin[btn.dataset.value] || '';
      descEl.textContent = btn.dataset.desc || '';
    };
    var render = function () {
      var s = state.style || 'solitaire';
      ring.setAttribute('class', 'ring s-' + s);
      var c = metals[state.metal || 'white'];
      band.forEach(function (r) { r.setAttribute('fill', c); });
      var k = sizes[state.carat || 'm'];
      var shift = Math.max(0, (k - 1.75) * 30);
      ring.querySelectorAll('.r-side polygon').forEach(function (p, n) {
        p.setAttribute('transform', 'translate(' + (n ? shift : -shift) + ' 0)');
      });
      wrap.setAttribute('transform', 'translate(200 110) scale(' + k + ') translate(-50 -50)');
    };
    var go = function (i, focus) {
      idx = Math.max(0, Math.min(i, total));
      steps.forEach(function (s, n) { s.classList.toggle('is-current', n === idx); });
      var done = idx === total;
      count.textContent = done ? '✓' : d.dataset.step + ' ' + (idx + 1) + ' ' + d.dataset.of + ' ' + total;
      bar.style.width = ((done ? total : idx + 1) / total * 100) + '%';
      back.hidden = idx === 0;
      if (done) buildSummary();
      if (focus) {
        var h = steps[idx].querySelector('legend, h3');
        if (h) h.focus({ preventScroll: true });
        var top = d.getBoundingClientRect().top;
        if (top < 0) d.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      }
    };
    var buildSummary = function () {
      var dl = d.querySelector('.summary');
      var lines = [];
      dl.innerHTML = '';
      steps.slice(0, total).forEach(function (s) {
        var sel = s.querySelector('.opt[aria-pressed="true"] span:not(.sw)');
        if (!sel) return;
        var q = s.dataset.label;
        var dt = document.createElement('dt'); dt.textContent = q;
        var dd = document.createElement('dd'); dd.textContent = sel.textContent;
        dl.appendChild(dt); dl.appendChild(dd);
        lines.push('• ' + q + ': ' + sel.textContent);
      });
      var msg = d.dataset.intro + '\n' + lines.join('\n');
      d.querySelector('[data-send]').href = 'https://wa.me/' + d.dataset.phone + '?text=' + encodeURIComponent(msg);
    };

    steps.forEach(function (s, n) {
      s.addEventListener('click', function (e) {
        var b = e.target.closest('.opt');
        if (!b) return;
        s.querySelectorAll('.opt').forEach(function (o) { o.setAttribute('aria-pressed', o === b ? 'true' : 'false'); });
        state[s.dataset.key] = b.dataset.value;
        if (s.dataset.key === 'shape') drawStone(b);
        render();
        setTimeout(function () { go(n + 1, true); }, reduce ? 0 : 280);
      });
      if (s.dataset.key === 'shape') {
        s.querySelectorAll('.opt').forEach(function (b) {
          b.addEventListener('mouseenter', function () { drawStone(b); });
          b.addEventListener('focus', function () { drawStone(b); });
        });
        s.addEventListener('mouseleave', function () {
          var sel = s.querySelector('.opt[aria-pressed="true"]') || s.querySelector('.opt');
          drawStone(sel);
        });
      }
    });
    back.addEventListener('click', function () { go(idx - 1, true); });
    d.querySelector('[data-restart]').addEventListener('click', function () {
      state = {};
      d.querySelectorAll('.opt').forEach(function (o) { o.setAttribute('aria-pressed', 'false'); });
      drawStone(d.querySelector('.opt[data-value="round"]'));
      descEl.textContent = '';
      render();
      go(0, true);
    });
    render();
    go(0, false);
  }

  // hero slideshow: slow cross-fade, pausable, off for reduced-motion users
  var hero = document.querySelector('[data-slides]');
  if (hero) {
    var slides = Array.prototype.slice.call(hero.querySelectorAll('.slide'));
    var dots = Array.prototype.slice.call(hero.querySelectorAll('.hero__dot'));
    var pauseBtn = hero.querySelector('.hero__pause');
    var cur2 = 0, timer = null, paused = reduce;
    var showSlide = function (i) {
      cur2 = (i + slides.length) % slides.length;
      slides.forEach(function (s, n) { s.classList.toggle('is-active', n === cur2); });
      dots.forEach(function (d, n) { d.setAttribute('aria-current', n === cur2 ? 'true' : 'false'); });
    };
    var start = function () { stop(); if (!paused) timer = setInterval(function () { showSlide(cur2 + 1); }, 6500); };
    var stop = function () { if (timer) { clearInterval(timer); timer = null; } };
    var syncPause = function () {
      hero.classList.toggle('is-paused', paused);
      pauseBtn.setAttribute('aria-pressed', paused ? 'true' : 'false');
      pauseBtn.setAttribute('aria-label', paused ? pauseBtn.dataset.play : pauseBtn.dataset.pause);
    };
    dots.forEach(function (d, n) { d.addEventListener('click', function () { showSlide(n); start(); }); });
    pauseBtn.addEventListener('click', function () { paused = !paused; syncPause(); start(); });
    document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else start(); });
    showSlide(0); syncPause(); start();
  }

  // logo = home: on the home page itself it glides back to the top
  document.querySelectorAll('.brand, .footer__logo').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var target = new URL(a.href, location.href);
      var here = location.pathname.replace(/\/$/, '/index.html');
      if (target.pathname.replace(/\/$/, '/index.html') !== here) return;
      e.preventDefault();
      if (document.body.classList.contains('menu-open') && btn) setMenu(false);
      window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
      if (location.hash) history.replaceState(null, '', location.pathname + location.search);
    });
  });

  // signatures "sign" themselves once they scroll into view
  var sigs = document.querySelectorAll('.signature');
  if (sigs.length) {
    if ('IntersectionObserver' in window && !reduce) {
      var sio = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('is-signed'); sio.unobserve(en.target); }
        });
      }, { threshold: 0.6 });
      sigs.forEach(function (el) { sio.observe(el); });
    } else {
      sigs.forEach(function (el) { el.classList.add('is-signed'); });
    }
  }

  // opening hours status (Israel time)
  var status = document.getElementById('status');
  if (status) {
    try {
      var parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Jerusalem', weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false }).formatToParts(new Date());
      var get = function (t) { return (parts.find(function (p) { return p.type === t; }) || {}).value; };
      var day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
      var mins = (parseInt(get('hour'), 10) % 24) * 60 + parseInt(get('minute'), 10);
      var open = day >= 0 && day <= 4 && mins >= 600 && mins < 1080;
      var row = document.querySelector('.hours tr[data-day="' + day + '"]');
      if (row) row.classList.add('today');
      status.textContent = open ? status.dataset.open : status.dataset.closed;
      status.classList.toggle('is-open', open);
    } catch (e) { /* no status */ }
  }

  // scroll-spy: highlight the nav link of the section in view
  var links = Array.prototype.slice.call(document.querySelectorAll('.nav a[href^="#"]'));
  var spied = links.map(function (a) { return document.querySelector(a.getAttribute('href')); }).filter(Boolean);
  function spy() {
    var line = window.innerHeight * 0.4, active = null;
    spied.forEach(function (sec) { if (sec.getBoundingClientRect().top <= line) active = sec; });
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) active = spied[spied.length - 1];
    links.forEach(function (a) {
      var on = !!active && a.getAttribute('href') === '#' + active.id;
      a.classList.toggle('is-active', on);
      if (on) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current');
    });
    moveInk();
  }
  // a bronze bar that glides under whichever link is active
  var ink = document.querySelector('.nav__ink');
  function moveInk() {
    if (!ink || !nav) return;
    var a = nav.querySelector('a.is-active');
    if (!a || !a.offsetWidth || getComputedStyle(ink).display === 'none') { ink.style.opacity = '0'; return; }
    var nr = nav.getBoundingClientRect(), ar = a.getBoundingClientRect();
    ink.style.width = ar.width + 'px';
    ink.style.transform = 'translateX(' + (ar.left - nr.left) + 'px)';
    ink.style.opacity = '1';
  }
  if (spied.length) {
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(function () { spy(); ticking = false; }); }
    }, { passive: true });
    window.addEventListener('resize', spy);
    spy();
  } else {
    window.addEventListener('resize', moveInk);
    moveInk();
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(moveInk);

  // gallery filter by diamond shape
  var filters = document.querySelector('.filters');
  if (filters) {
    var figs = Array.prototype.slice.call(document.querySelectorAll('.gallery .piece'));
    var fStatus = document.getElementById('filter-status');
    var gallery = document.querySelector('.gallery');
    filters.hidden = false;
    filters.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-filter]');
      if (!b) return;
      var f = b.dataset.filter, n = 0;
      filters.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      figs.forEach(function (fig) {
        var on = f === 'all' || fig.dataset.cat === f;
        fig.hidden = !on;
        if (on) { n++; if (!reduce) { fig.classList.remove('is-in'); void fig.offsetWidth; fig.classList.add('is-in'); } }
      });
      if (gallery) gallery.scrollLeft = 0;
      if (fStatus) fStatus.textContent = n === 1 ? fStatus.dataset.one : fStatus.dataset.tpl.replace('{n}', n);
    });
  }

  // enquiry form -> ready-made WhatsApp message (nothing is sent to or stored on this site)
  var askForm = document.getElementById('ask-form');
  if (askForm) {
    askForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var d = askForm.dataset, el = askForm.elements;
      var val = function (n) { var x = el[n]; return x && x.value ? x.value.trim() : ''; };
      var what = askForm.querySelector('input[name=what]:checked');
      var lines = [d.hello];
      if (val('name')) lines.push(d.lName + ': ' + val('name'));
      if (what) lines.push(d.lWhat + ': ' + what.value);
      if (val('budget')) lines.push(d.lBudget + ': ' + val('budget'));
      if (val('when')) lines.push(d.lWhen + ': ' + val('when'));
      if (val('msg')) lines.push('', val('msg'));
      var url = askForm.action + '?text=' + encodeURIComponent(lines.join('\n'));
      var win = window.open(url, '_blank');
      if (win) win.opener = null;
      else window.location.href = url; // pop-up blocked: open WhatsApp in this tab instead
    });
  }

  // map loads from Google only when asked (privacy + speed)
  var mapEl = document.querySelector('.mapbox__map');
  if (mapEl) {
    mapEl.querySelector('.mapbox__load').addEventListener('click', function () {
      var f = document.createElement('iframe');
      f.src = mapEl.dataset.src;
      f.title = mapEl.dataset.title;
      f.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
      f.setAttribute('allowfullscreen', '');
      mapEl.innerHTML = '';
      mapEl.appendChild(f);
      mapEl.classList.add('is-loaded');
      f.focus();
    });
  }

  var y = document.querySelector('[data-year]');
  if (y) y.textContent = new Date().getFullYear();
})();
