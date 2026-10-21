/* The Talent Dept. · v1 Rhythm · The Work. The seven services stand as the Rhythm: one bar each on one centre line,
   Talent Booking the Signal. The first time the section comes into view the bars build from their centre line,
   block by block, from the Signal bar outwards along the row, then everything is still. A bar (or its name) opens its
   service below; arrow keys move along the row. Reduced motion: the bars simply stand. */
(function () {
  var rh = document.querySelector('.svc-rh'); if (!rh) return;
  var tabs = [].slice.call(rh.querySelectorAll('.sv')), panels = [].slice.call(document.querySelectorAll('.svp'));
  function pick(i, focus) {
    tabs.forEach(function (t, k) { var on = k === i; t.classList.toggle('on', on); t.setAttribute('aria-selected', on ? 'true' : 'false'); t.tabIndex = on ? 0 : -1; });
    panels.forEach(function (p, k) { p.classList.toggle('on', k === i); });
    if (focus) tabs[i].focus();
  }
  tabs.forEach(function (t, i) {
    t.tabIndex = i === 0 ? 0 : -1;
    t.addEventListener('click', function () { pick(i); });
    t.addEventListener('keydown', function (e) {
      var k = e.key, n = tabs.length, j = -1;
      if (k === 'ArrowRight' || k === 'ArrowDown') j = (i + 1) % n;
      else if (k === 'ArrowLeft' || k === 'ArrowUp') j = (i - 1 + n) % n;
      else if (k === 'Home') j = 0; else if (k === 'End') j = n - 1;
      if (j > -1) { e.preventDefault(); pick(j, true); }
    });
  });
  document.documentElement.classList.add('svc-js');
  // arriving from the home page's list (the-work.html#svp3): open that service and bring the row into view
  var m = /^#svp(\d)$/.exec(location.hash);
  if (m && tabs[+m[1]]) {
    pick(+m[1]);
    var sec = rh.closest('section'), go = function () { if (sec) sec.scrollIntoView({ block: 'start' }); };
    go(); addEventListener('load', function () { setTimeout(go, 0); });   // after the browser's own jump to the panel
  }

  // the build: quantised to blocks, so a bar is seen to stack rather than stretch
  var root = document.documentElement;
  if (root.classList.contains('still') || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) || !('IntersectionObserver' in window)) return;
  var bars = tabs.map(function (t) { return t.querySelector('.bar'); });
  rh.classList.add('pre');
  bars.forEach(function (b) { b.style.transform = 'scaleY(0)'; });
  function run() {
    var t0 = performance.now(), H = bars.map(function (b) { return b.getBoundingClientRect().height || b.offsetHeight; });
    var Q = bars.map(function (b) { var w = b.offsetWidth || 20; return w * .5; });
    (function step(now) {
      var done = true;
      bars.forEach(function (b, i) {
        var t = (now - t0 - i * 85) / 620, e = t <= 0 ? 0 : t >= 1 ? 1 : 1 - Math.pow(1 - t, 3);
        var blocks = Math.round(e * H[i] / Q[i]), h = Math.min(H[i], blocks * Q[i]);
        // follow-through: the last block lands with a small overshoot and settles
        if (t > 1 && t < 1.35) h = H[i] * (1 + .035 * Math.sin((t - 1) / .35 * Math.PI));
        b.style.transform = 'scaleY(' + (h / H[i]).toFixed(4) + ')';
        if (t < 1.35) done = false;
      });
      if (!done) requestAnimationFrame(step);
      else { bars.forEach(function (b) { b.style.transform = ''; }); rh.classList.remove('pre'); }
    })(t0);
  }
  var io = new IntersectionObserver(function (es) {
    if (es.some(function (e) { return e.isIntersecting; })) { io.disconnect(); run(); }
  }, { threshold: .45 });
  io.observe(rh);
})();
