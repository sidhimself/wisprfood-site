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
