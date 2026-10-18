/* WisprFood landing page motion. Everything is visible without this file; it only adds movement. */
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root = document.documentElement;

  /* ---------- Reveal on scroll ---------- */
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      var el = e.target;
      el.classList.add('in');
      if (el.__onView) el.__onView();
      io.unobserve(el);
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.12 }) : null;

  function onView(el, fn) {
    if (!el) return;
    if (!io || reduce) { el.classList.add('in'); fn && fn(); return; }
    el.__onView = fn; io.observe(el);
  }
  document.querySelectorAll('.reveal').forEach(function (el) { onView(el); });

  /* ---------- Count-up numbers ---------- */
  function countUp(el, to, opts) {
    opts = opts || {};
    var from = opts.from || 0, dur = opts.dur || 1200, dec = opts.dec || 0, pre = opts.pre || '';
    if (reduce) { el.textContent = pre + to.toFixed(dec); return; }
    var t0 = null;
    function step(t) {
      if (!t0) t0 = t;
      var p = Math.min(1, (t - t0) / dur), k = 1 - Math.pow(1 - p, 3);
      el.textContent = pre + (from + (to - from) * k).toFixed(dec);
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  document.querySelectorAll('[data-count]').forEach(function (el) {
    var to = +el.getAttribute('data-count');
    onView(el.closest('.reveal') || el, function () { countUp(el, to); });
  });

  /* ---------- Fit-to-budget demo ---------- */
  var bdemo = document.querySelector('.bdemo');
  if (bdemo) onView(bdemo, function () {
    setTimeout(function () {
      bdemo.classList.add('go');
      var b = bdemo.querySelector('[data-budget]');
      if (b) countUp(b, 41.96, { from: 49.80, dur: 1300, dec: 2, pre: '$' });
    }, reduce ? 0 : 700);
  });

  /* ---------- Grocery list ticks itself off ---------- */
  var list = document.querySelector('.list-card');
  if (list && !reduce) {
    list.classList.add('ticking');
    list.querySelectorAll('.row.done').forEach(function (r) { r.classList.remove('done'); });
    var bk = list.querySelector('[data-basket]'); if (bk) bk.textContent = '$0.00';
    onView(list, function () {
      var rows = list.querySelectorAll('.row'), basket = list.querySelector('[data-basket]');
      var order = [0, 3, 1, 4, 2], total = 0, steps = [4.20, 6.60, 2.10, 1.01, 1.60];
      order.forEach(function (i, n) {
        setTimeout(function () {
          rows[i].classList.add('t');
          var prev = total; total += steps[n];
          if (basket) countUp(basket, total, { from: prev, dur: 500, dec: 2, pre: '$' });
        }, 600 + n * 650);
      });
    });
  }

  /* ---------- Cooking timer counts down while visible ---------- */
  var timer = document.querySelector('[data-timer]');
  if (timer && !reduce) {
    var ring = document.querySelector('.timer .fg'), total = +timer.getAttribute('data-timer'), left = total, iv = null;
    var C = 163.4;
    function draw() {
      var m = Math.floor(left / 60), s = left % 60;
      timer.textContent = m + ':' + (s < 10 ? '0' : '') + s;
      if (ring) ring.style.strokeDashoffset = (C * (1 - left / total)).toFixed(1);
    }
    var tio = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting && !iv) iv = setInterval(function () { left = left > 0 ? left - 1 : total; draw(); }, 1000);
        if (!e.isIntersecting && iv) { clearInterval(iv); iv = null; }
      });
    });
    tio.observe(timer);
  }

  /* ---------- Gentle parallax on the hero phone ---------- */
  var phone = document.querySelector('[data-parallax]');
  if (phone && !reduce) {
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return; ticking = true;
      requestAnimationFrame(function () {
        var y = Math.min(window.scrollY, 700);
        phone.style.transform = 'translateY(' + (y * -0.08).toFixed(1) + 'px) rotate(' + (2 - y * 0.004).toFixed(2) + 'deg)';
        ticking = false;
      });
    }, { passive: true });
  }

  /* ---------- Store marquee: duplicate the row so it loops seamlessly ---------- */
  ['stores-track', 'food-track'].forEach(function (id) {
  var track = document.getElementById(id);
  if (track && !reduce) {
    Array.prototype.slice.call(track.children).forEach(function (c) {
      var d = c.cloneNode(true); d.setAttribute('aria-hidden', 'true'); track.appendChild(d);
    });
  }
  });

  /* ---------- Lottie animations (the app's own files in /animations) ---------- */
  var slots = document.querySelectorAll('[data-lottie]');
  if (!slots.length || reduce || !window.fetch) return;
  var cache = {};
  function getJSON(name) {
    if (!cache[name]) cache[name] = fetch('/animations/' + name + '.json').then(function (r) {
      if (!r.ok) throw new Error(r.status); return r.json();
    });
    return cache[name];
  }
  var s = document.createElement('script');
  s.src = 'https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie_light.min.js';
  s.async = true;
  s.onload = function () {
    if (!window.lottie) return;
    var lio = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        var a = e.target.__anim; if (!a) return;
        if (e.isIntersecting) { if (e.target.hasAttribute('data-once')) a.goToAndPlay(0, true); else a.play(); } else a.pause();
      });
    }, { rootMargin: '80px' });
    slots.forEach(function (el) {
      getJSON(el.getAttribute('data-lottie')).then(function (data) {
        el.classList.add('ready');
        el.__anim = window.lottie.loadAnimation({
          container: el, renderer: 'svg', autoplay: false,
          loop: !el.hasAttribute('data-once'), animationData: data,
          rendererSettings: { preserveAspectRatio: el.hasAttribute('data-once') ? 'xMidYMid slice' : 'xMidYMid meet' }
        });
        lio.observe(el);
      }).catch(function () { /* file not there yet: the emoji or number stays */ });
    });
  };
  document.head.appendChild(s);
})();

/* ===== Scroll choreography: sticky bar, progress, scrollspy, bands, headings, story ===== */
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;
  var vh = function () { return window.innerHeight || 800; };

  /* Headings rise word by word (keeps <em> colouring) */
  if (!reduce) {
    document.querySelectorAll('main h2').forEach(function (h) {
      var n = 0;
      (function walk(node) {
        Array.prototype.slice.call(node.childNodes).forEach(function (c) {
          if (c.nodeType === 3) {
            var parts = c.textContent.split(/(\s+)/), frag = document.createDocumentFragment();
            parts.forEach(function (p) {
              if (!p) return;
              if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(p)); return; }
              var o = document.createElement('span'), i = document.createElement('span');
              o.className = 'wd'; i.textContent = p; i.style.setProperty('--w', n++); o.appendChild(i); frag.appendChild(o);
            });
            c.parentNode.replaceChild(frag, c);
          } else if (c.nodeType === 1) walk(c);
        });
      })(h);
    });
  }

  /* Grids stagger their children */
  ['.features', '.cuisines', '.audience', '.plans', '.stats'].forEach(function (sel) {
    document.querySelectorAll(sel).forEach(function (g) {
      g.classList.add('stagger');
      Array.prototype.forEach.call(g.children, function (c, i) { c.style.setProperty('--d', (i * 0.07).toFixed(2) + 's'); });
    });
  });

  /* Story: the pinned phone changes screen per step */
  var steps = document.querySelectorAll('.story-step');
  var screens = document.querySelectorAll('.story-phone .scr');
  var dots = document.querySelectorAll('.story-dots i');
  function setStep(n) {
    steps.forEach(function (s, i) { s.classList.toggle('on', i === n); });
    screens.forEach(function (s, i) { s.classList.toggle('on', i === n); s.classList.toggle('up', i < n); });
    dots.forEach(function (d, i) { d.classList.toggle('on', i === n); });
  }
  // mobile: give every step its own copy of its screen
  steps.forEach(function (s, i) {
    if (!screens[i]) return;
    var m = document.createElement('div'); m.className = 'mini-phone'; m.setAttribute('aria-hidden', 'true');
    var c = screens[i].cloneNode(true); c.classList.add('on'); m.appendChild(c); s.appendChild(m);
  });
  var stage = document.querySelector('.story-stage');
  if (stage && !document.querySelector('.story-stage > .story-dots')) {
    var d = document.querySelector('.story-phone .story-dots'); if (d) stage.appendChild(d);
    dots = document.querySelectorAll('.story-dots i');
  }
  if (steps.length) {
    setStep(0);
    if (hasIO) {
      var sio = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) setStep(+e.target.getAttribute('data-step')); });
      }, { rootMargin: '-45% 0px -45% 0px' });
      steps.forEach(function (s) { sio.observe(s); });
    }
  }

  /* Sticky bar + phone dock: show after the hero, hide the dock at the final download section */
  var bar = document.getElementById('topbar'), dock = document.getElementById('dock');
  var hero = document.querySelector('.hero'), dl = document.getElementById('download');
  var pastHero = false, atDownload = false;
  function syncChrome() {
    if (bar) bar.classList.toggle('on', pastHero);
    if (dock) dock.classList.toggle('on', pastHero && !atDownload);
  }
  if (hasIO && hero) new IntersectionObserver(function (es) { pastHero = !es[0].isIntersecting; syncChrome(); }, { rootMargin: '-80px 0px 0px 0px' }).observe(hero);
  if (hasIO && dl) new IntersectionObserver(function (es) { atDownload = es[0].isIntersecting; syncChrome(); }).observe(dl);

  /* Scrollspy */
  var spyLinks = document.querySelectorAll('.spy a');
  var spyMap = {};
  spyLinks.forEach(function (a) { var id = a.getAttribute('href').slice(1); var el = document.getElementById(id); if (el) spyMap[id] = a; });
  if (hasIO) {
    var spyIO = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        spyLinks.forEach(function (a) { a.classList.remove('active'); });
        spyMap[e.target.id].classList.add('active');
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    Object.keys(spyMap).forEach(function (id) { spyIO.observe(document.getElementById(id)); });
  }

  /* Progress bar + bands that rise and widen as they arrive */
  var prog = document.querySelector('.topbar .progress');
  var bands = reduce ? [] : Array.prototype.slice.call(document.querySelectorAll('[data-band]'));
  var ticking = false;
  function frame() {
    ticking = false;
    var doc = document.documentElement, max = doc.scrollHeight - vh();
    if (prog) prog.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, window.scrollY / max) : 0).toFixed(4) + ')';
    var H = vh();
    bands.forEach(function (b) {
      var r = b.getBoundingClientRect();
      if (r.top > H || r.bottom < 0) return;
      var p = Math.min(1, Math.max(0, (H - r.top) / (H * 0.7)));
      var e = 1 - Math.pow(1 - p, 3);
      b.style.transform = 'translateY(' + ((1 - e) * 60).toFixed(1) + 'px) scale(' + (0.94 + 0.06 * e).toFixed(4) + ')';
    });
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  frame();
})();

/* Land exactly on the section when the page opens with #section (short links like /pricing) */
(function () {
  if (!location.hash) return;
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  function jump() {
    var el = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'start' });
  }
  jump();
  window.addEventListener('load', function () { jump(); setTimeout(jump, 350); setTimeout(jump, 900); });
})();
