/* The Talent Dept. · round 13 · the quiet moments, once each as they arrive (native scroll, no blur):
   headings rise in word by word, a line at a time; photographs open from a band and settle; "The right person can
   change the whole conversation." travels slowly sideways with the scroll and stops when the scroll stops; the
   names build in, the big names last. Reduced motion: everything simply shows. */
(function () {
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!('IntersectionObserver' in window)) return;
  var root = document.documentElement; root.classList.add('rv-on');

  // split a heading into word spans (keeping <b>, <i>, <br>), then number each word by its line
  function split(el) {
    var walk = function (n) {
      [].slice.call(n.childNodes).forEach(function (c) {
        if (c.nodeType === 3) {
          var parts = c.textContent.split(/(\s+)/), f = document.createDocumentFragment();
          parts.forEach(function (p) { if (!p) return; if (/^\s+$/.test(p)) f.appendChild(document.createTextNode(p)); else { var s = document.createElement('span'); s.className = 'w'; s.textContent = p; f.appendChild(s); } });
          c.parentNode.replaceChild(f, c);
        } else if (c.nodeType === 1 && c.tagName !== 'BR' && !c.classList.contains('w')) walk(c);
      });
    };
    walk(el);
    var ws = [].slice.call(el.querySelectorAll('.w')), top = null, line = -1;
    ws.forEach(function (w, i) { var t = w.offsetTop; if (top === null || t > top + 4) { line++; top = t; } w.style.setProperty('--d', line * 2 + i * .25); });
    el.classList.add('rv');
  }
  var heads = [].slice.call(document.querySelectorAll('.vb-h,.rp-h,.ag-t,.pb-n,.wk-h,.ct-h,.chairs2 .words,.svc-hd h2,.ag-p .q'));
  heads.forEach(split);
  // the names: each name a beat after the last, the big names last of all
  var wall = document.querySelector('.names2 .ws');
  if (wall) { [].slice.call(wall.querySelectorAll('.w')).forEach(function (w, i) { w.classList.add('nm'); w.style.setProperty('--d', i * .55 + (w.querySelector('.big') ? 6 : 0)); }); wall.classList.add('rv', 'rv-n'); }
  // photographs
  var figs = [].slice.call(document.querySelectorAll('.chairs2 figure,.vb-f,.rp-f,.wk-close .strip figure,.ct figure,.pb-p'));
  figs.forEach(function (f, i) { f.classList.add('rv-f'); f.style.setProperty('--d', (i % 4) * 1.2); });

  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -12% 0px', threshold: .01 });
  heads.concat(figs).forEach(function (el) { io.observe(el); }); if (wall) io.observe(wall);

  // the right person: travels a little sideways with the scroll while it passes, and stops when the scroll stops
  var rp = document.querySelector('.rp-h'), sec = rp && rp.closest('section'), ticking = false;
  function move() {
    ticking = false; if (!rp) return;
    var r = sec.getBoundingClientRect(), p = (innerHeight - r.top) / (innerHeight + r.height);
    p = p < 0 ? 0 : p > 1 ? 1 : p;
    rp.style.transform = 'translate3d(' + ((.45 - p) * innerWidth * .16).toFixed(1) + 'px,0,0)';
  }
  if (rp) { addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(move); } }, { passive: true }); move(); }
})();
