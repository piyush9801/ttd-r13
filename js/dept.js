/* The Talent Dept. · v1 Rhythm · The Dept. One moment: the photograph under the head arrives through the Rhythm.
   As it scrolls in, it is seen through thirteen bars of the rhythm standing on its centre line; the bars grow from
   that line, the middle one first, and widen until they meet and the photograph is whole by the time it reaches the
   middle of the screen. Bars as windows onto the room (after Koto's Deezer: the beats become image containers).
   Scroll-linked clip only; nothing moves without the scroll. Reduced motion and ?still: the photograph, whole. */
(function () {
  var f = document.querySelector('.ag-ph.rw'); if (!f) return;
  var img = f.querySelector('img'); if (!img) return;
  var root = document.documentElement;
  if (root.classList.contains('still') || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)) return;
  var HS = [.46, .7, .38, .86, .55, .3, .64, .92, .5, .74, .4, .66, .34], N = HS.length, C = (N - 1) / 2;
  var q = -1, qT = 0, run = false, tp = 0, last = '';
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function ease(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function target() {
    var r = f.getBoundingClientRect(), vh = innerHeight;
    // 0 when the top of the photograph is at the bottom of the screen, 1 when it is at 40% of the screen, so the
    // photograph (and every face in it) is whole well before it is in the middle of the view
    return clamp((vh - r.top) / (vh * .6), 0, 1);
  }
  function draw(p) {
    if (p >= .999) { if (last !== 'none') { img.style.clipPath = ''; last = 'none'; } return; }
    var pitch = 100 / N, top = [], bot = [], i;
    for (i = 0; i < N; i++) {
      var d = Math.abs(i - C) / C, pi = ease(clamp((p - d * .22) / .78, 0, 1));
      var wf = .44 + .56 * pi, h = (HS[i] * .8 + (1 - HS[i] * .8) * pi) * 50;
      var x0 = (i + .5) * pitch - pitch * wf / 2, x1 = (i + .5) * pitch + pitch * wf / 2;
      x0 = i === 0 && pi >= 1 ? 0 : x0; x1 = i === N - 1 && pi >= 1 ? 100 : x1;
      top.push(x0.toFixed(2) + '% 50%', x0.toFixed(2) + '% ' + (50 - h).toFixed(2) + '%', x1.toFixed(2) + '% ' + (50 - h).toFixed(2) + '%', x1.toFixed(2) + '% 50%');
      bot.unshift(x1.toFixed(2) + '% 50%', x1.toFixed(2) + '% ' + (50 + h).toFixed(2) + '%', x0.toFixed(2) + '% ' + (50 + h).toFixed(2) + '%', x0.toFixed(2) + '% 50%');
    }
    var c = 'polygon(' + top.concat(bot).join(',') + ')';
    if (c !== last) { img.style.clipPath = c; last = c; }
  }
  function tick(now) {
    var dt = tp ? Math.min(.05, (now - tp) / 1000) : 1 / 60; tp = now;
    qT = target();
    if (q < 0) q = qT; else q += (qT - q) * (1 - Math.exp(-dt / .12));
    if (Math.abs(qT - q) < 5e-4) q = qT;
    draw(q);
    if (q !== qT) requestAnimationFrame(tick); else { run = false; tp = 0; }
  }
  function kick() { if (!run) { run = true; requestAnimationFrame(tick); } }
  addEventListener('scroll', kick, { passive: true });
  addEventListener('resize', kick);
  f.classList.add('rw-on');
  kick();
})();
