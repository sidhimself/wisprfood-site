// wisprfood.com: reveal on scroll, header line, the phone's sticky button,
// sliders with dots that move on their own until touched, the logo band,
// one language menu open at a time.
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var top = document.querySelector('.top');
  var sticky = document.querySelector('.sticky-cta');
  var hero = document.querySelector('.hero .cta-row');
  var closing = document.querySelector('#download');

  function onScroll() {
    if (top) top.classList.toggle('scrolled', window.scrollY > 8);
    if (sticky && hero) {
      var pastHero = hero.getBoundingClientRect().bottom < 0;
      var atEnd = closing && closing.getBoundingClientRect().top < window.innerHeight;
      sticky.classList.toggle('show', pastHero && !atEnd);
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Things arrive as they scroll into view.
  var items = document.querySelectorAll('.reveal, .reveal-group');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add('in'); });
  }

  // The logo band loops: a second copy of the logos follows the first.
  document.querySelectorAll('.marquee .logos').forEach(function (list) {
    Array.prototype.slice.call(list.children).forEach(function (li) {
      var copy = li.cloneNode(true);
      copy.setAttribute('aria-hidden', 'true');
      list.appendChild(copy);
    });
  });

  // Sliders: dots under every row that scrolls sideways; rows with
  // data-auto move on by themselves while visible, until someone touches them.
  document.querySelectorAll('.snap').forEach(function (track) {
    var slides = track.matches('.rail') ? track.querySelectorAll('li') : track.children;
    var count = slides.length;
    if (!count) return;
    var dots = document.createElement('div');
    dots.className = 'dots';
    dots.setAttribute('aria-hidden', 'true');
    for (var i = 0; i < count; i++) {
      var b = document.createElement('button');
      b.type = 'button';
      b.tabIndex = -1;
      b.dataset.i = i;
      dots.appendChild(b);
    }
    track.insertAdjacentElement('afterend', dots);

    var padding = function () { return parseFloat(getComputedStyle(track).scrollPaddingLeft) || 0; };
    var overflows = function () { return track.scrollWidth > track.clientWidth + 4; };
    // Where slide k starts, in the track's scroll coordinates.
    var startOf = function (k) {
      return slides[k].getBoundingClientRect().left - track.getBoundingClientRect().left + track.scrollLeft - padding();
    };
    var current = function () {
      var left = track.scrollLeft, best = 0, dist = Infinity;
      for (var k = 0; k < count; k++) {
        var d = Math.abs(startOf(k) - left);
        if (d < dist) { dist = d; best = k; }
      }
      if (left + track.clientWidth >= track.scrollWidth - 4) best = count - 1;
      return best;
    };
    var go = function (k) {
      var x = startOf(k);
      track.scrollTo({ left: Math.max(0, x), behavior: reduce ? 'auto' : 'smooth' });
    };
    var paint = function () {
      dots.hidden = !overflows();
      var c = current();
      Array.prototype.forEach.call(dots.children, function (d, k) { d.classList.toggle('on', k === c); });
    };
    var raf = 0;
    track.addEventListener('scroll', function () { cancelAnimationFrame(raf); raf = requestAnimationFrame(paint); }, { passive: true });
    window.addEventListener('resize', paint);
    dots.addEventListener('click', function (e) {
      var k = e.target.dataset && e.target.dataset.i;
      if (k != null) { stop(); go(+k); }
    });
    paint();

    // Moving on by itself.
    var every = +track.dataset.auto || 0;
    var timer = 0, visible = false, touched = false;
    function tick() {
      if (!visible || touched || !overflows() || document.hidden) return;
      var c = current();
      go(c >= count - 1 || track.scrollLeft + track.clientWidth >= track.scrollWidth - 4 ? 0 : c + 1);
    }
    function start() { if (every && !reduce && !touched && !timer) timer = setInterval(tick, every); }
    function stop() { touched = true; clearInterval(timer); timer = 0; }
    ['pointerdown', 'touchstart', 'wheel', 'keydown'].forEach(function (ev) { track.addEventListener(ev, stop, { passive: true }); });
    if (every && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible) start(); else { clearInterval(timer); timer = 0; }
      }, { threshold: 0.5 }).observe(track);
    }
  });

  // Only one language menu open at a time; a tap outside closes it.
  var menus = document.querySelectorAll('details.lang');
  menus.forEach(function (d) {
    d.addEventListener('toggle', function () {
      if (d.open) menus.forEach(function (o) { if (o !== d) o.open = false; });
    });
  });
  document.addEventListener('click', function (e) {
    menus.forEach(function (d) { if (d.open && !d.contains(e.target)) d.open = false; });
  });
})();
