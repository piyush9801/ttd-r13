/* The Talent Dept. · round 13 · the quiet moments, once each as they arrive (native scroll, no blur):
   headings rise in word by word, a line at a time; photographs fade in where they stand (round 16: no movement);
   the names build in, the big names last. Reduced motion: everything simply shows. */
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
  var heads = [].slice.call(document.querySelectorAll('.vb-h,.ag-t,.ct-h,.chairs2 .words,.hall-h,.sw-h,.pn'));
  heads.forEach(split);
  // the names: each name a beat after the last, the big names last of all
  var wall = document.querySelector('.names2 .ws');
  if (wall) { [].slice.call(wall.querySelectorAll('.w')).forEach(function (w, i) { w.classList.add('nm'); w.style.setProperty('--d', i * .55 + (w.querySelector('.big') ? 6 : 0)); }); wall.classList.add('rv', 'rv-n'); }
  // photographs, the portraits too (round 16, Lisa: no movement): a quiet fade, nothing rises or opens
  var figs = [].slice.call(document.querySelectorAll('.chairs2 figure,.vb-f,.hall-f,.wk-ph,.ct-f,.pp'));
  figs.forEach(function (f) { f.classList.add('rv-o'); });

  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -12% 0px', threshold: .01 });
  heads.concat(figs).forEach(function (el) { io.observe(el); }); if (wall) io.observe(wall);

})();
