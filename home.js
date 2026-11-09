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

  // The week's dishes loop like the logo band (copies are hidden on wide screens).
  document.querySelectorAll('.wc-band .wc-list').forEach(function (list) {
    Array.prototype.slice.call(list.children).forEach(function (li) {
      var copy = li.cloneNode(true);
      copy.setAttribute('aria-hidden', 'true');
      list.appendChild(copy);
    });
  });

  // The recipes drift by on their own, in a loop (a second copy follows the first).
  document.querySelectorAll('.rail.drift ul').forEach(function (list) {
    Array.prototype.slice.call(list.children).forEach(function (li) {
      var copy = li.cloneNode(true);
      copy.setAttribute('aria-hidden', 'true');
      var img = copy.querySelector('img');
      if (img) img.setAttribute('loading', 'lazy');
      list.appendChild(copy);
    });
  });

  // A finger on a band holds it still; it drifts on shortly after.
  document.querySelectorAll('.marquee, .wc-band, .rail.drift').forEach(function (band) {
    var t = 0;
    var hold = function () { clearTimeout(t); band.classList.add('held'); };
    var free = function () { clearTimeout(t); t = setTimeout(function () { band.classList.remove('held'); }, 1200); };
    band.addEventListener('touchstart', hold, { passive: true });
    band.addEventListener('touchend', free, { passive: true });
    band.addEventListener('mouseenter', hold);
    band.addEventListener('mouseleave', free);
  });

  // Headings and tick lists rise in as they arrive.
  var risers = document.querySelectorAll('.section .eyebrow, .section h2, .section .sub, .strip-title');
  risers.forEach(function (el) { el.classList.add('rise'); });
  var groups = document.querySelectorAll('.rise, .ticks');
  if ('IntersectionObserver' in window) {
    var io2 = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io2.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.2 });
    groups.forEach(function (el) { io2.observe(el); });
  } else {
    groups.forEach(function (el) { el.classList.add('in'); });
  }

  // The grocery list ticks itself off while it's on screen, then starts over.
  var list = document.querySelector('.list-card');
  if (list && !reduce && 'IntersectionObserver' in window) {
    var rows = Array.prototype.slice.call(list.querySelectorAll('li'));
    var start = rows.map(function (r) { return r.classList.contains('done'); });
    var timer = 0, on = false;
    var step = function () {
      var next = rows.find(function (r) { return !r.classList.contains('done'); });
      if (next) { next.classList.add('done'); timer = setTimeout(step, 650); }
      else timer = setTimeout(function () {
        rows.forEach(function (r, k) { r.classList.toggle('done', start[k]); });
        timer = setTimeout(step, 900);
      }, 2200);
    };
    new IntersectionObserver(function (entries) {
      var vis = entries[0].isIntersecting;
      if (vis && !on) { on = true; timer = setTimeout(step, 700); }
      if (!vis && on) { on = false; clearTimeout(timer); }
    }, { threshold: 0.4 }).observe(list);
  }

  // The hero card floats up a little as the page scrolls.
  var card = document.querySelector('.week-card');
  if (card && !reduce) {
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var y = Math.min(window.scrollY, 600);
        card.style.transform = 'translate3d(0,' + (-y * 0.06).toFixed(1) + 'px,0)';
        ticking = false;
      });
    }, { passive: true });
  }

  // A soft shine on the main buttons.
  document.querySelectorAll('.hero .btn-lg, .sticky-cta .btn, .closing .btn-lg').forEach(function (b) { b.classList.add('btn-shine'); });

  // A thin line under the header shows how far down the page you are.
  if (top) {
    var bar = document.createElement('div');
    bar.className = 'progress';
    top.appendChild(bar);
    var paintBar = function () {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(window.scrollY / max, 1) : 0).toFixed(3) + ')';
    };
    window.addEventListener('scroll', function () { requestAnimationFrame(paintBar); }, { passive: true });
    paintBar();
  }

  // FAQ answers slide open and closed.
  document.querySelectorAll('.faq details').forEach(function (d) {
    var sum = d.querySelector('summary'), body = d.querySelector('p');
    if (!sum || !body || reduce) return;
    sum.addEventListener('click', function (e) {
      e.preventDefault();
      d.classList.add('anim');
      if (d.open) {
        body.style.height = body.scrollHeight + 'px';
        requestAnimationFrame(function () { body.style.height = '0px'; body.style.opacity = '0'; });
        setTimeout(function () { d.open = false; body.style.height = ''; body.style.opacity = ''; }, 300);
      } else {
        d.open = true;
        var h = body.scrollHeight;
        body.style.height = '0px'; body.style.opacity = '0';
        requestAnimationFrame(function () { body.style.height = h + 'px'; body.style.opacity = '1'; });
        setTimeout(function () { body.style.height = ''; }, 320);
      }
    });
  });

  // The shop example uses the page's own country's chains.
  var CHAINS = {
    es: ['Aldi', 'Lidl', 'Mercadona', 'Dia', 'Carrefour'], fr: ['Lidl', 'Aldi', 'E.Leclerc', 'Intermarché', 'Carrefour'],
    de: ['Aldi', 'Lidl', 'Rewe', 'Kaufland', 'Edeka'], da: ['Netto', 'Lidl', 'Rema 1000', 'Føtex', 'Meny'],
    pl: ['Biedronka', 'Lidl', 'Dino', 'Kaufland', 'Carrefour'],
  };
  var chains = CHAINS[document.documentElement.lang];
  if (chains) {
    document.querySelectorAll('.compare li .shop').forEach(function (shop, k) {
      var text = shop.firstChild;
      if (text && text.nodeType === 3 && chains[k]) text.nodeValue = chains[k] + ' ';
    });
  }

  // Compare: tap a shop in the example to make it "your shop".
  var compare = document.querySelector('.compare ul');
  if (compare) {
    compare.addEventListener('click', function (e) {
      var li = e.target.closest('li');
      var tag = compare.querySelector('.tag-mine');
      if (!li || !tag || li.classList.contains('mine')) return;
      compare.querySelectorAll('li').forEach(function (x) { x.classList.remove('mine'); });
      li.classList.add('mine');
      var copy = tag.cloneNode(true);
      tag.remove();
      li.querySelector('.shop').appendChild(copy);
    });
  }

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
