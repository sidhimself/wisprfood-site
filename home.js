// wisprfood.com: reveal on scroll, header line, the phone's sticky button,
// one language menu open at a time.
(function () {
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

  var items = document.querySelectorAll('.reveal');
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
