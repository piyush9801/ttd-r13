/* The Talent Dept. · round 12 · v6 Line. The lines never break.
   Every word of the statement sits behind ONE solid Ink line (the full stop behind one Signal line). Each line is a
   rigid body: mass grows with its length, its moment of inertia is m(L^2 + h^2)/12, so a long word is heavy and turns
   slowly and a short one darts. The hand is a soft collider: it pushes a line at the point nearest to it, so an
   off-centre push slides AND turns it; friction slows it; lines shove each other instead of overlapping. A damped
   spring on position and angle brings each line home with a little natural overshoot.
   Scroll never moves a line directly. It moves each line's TARGET pose, and the line follows it through the same
   spring, so it has weight, lag and a soft landing: row by row, in reading order, each line slides off its word
   (the sentence is said), then tips upright like a stick falling into place, and stands as one bar of the brand's
   Rhythm. A word's line stood on end is a bar exactly as tall as the word is long. The full stop's Signal line comes
   last and caps the centre bar, which turns Signal as they meet. Nothing moves on its own: the loop stops at rest.
   Desktop only for now; narrow screens, reduced motion and ?still show the readable end pose. */
(function () {
  var H = document.querySelector('.hero4.rh'); if (!H) return;
  var root = document.documentElement;
  var reduce = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  var STILL = root.classList.contains('still') || reduce;
  var stage = H.querySelector('.stage'), hb = H.querySelector('.hb'), hl = H.querySelector('.hl');
  var wds = [].slice.call(hl.querySelectorAll('.wd'));
  var layer = document.createElement('div'); layer.className = 'sw ln'; layer.setAttribute('aria-hidden', 'true');
  hb.appendChild(layer);

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function sstep(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }
  function smoother(t) { t = clamp(t, 0, 1); return t * t * t * (t * (t * 6 - 15) + 10); }

  var W = 1, SH = 1, em = 16, h = 10, M = 20, R = 100;
  var lines = [], words = [], built = false, narrow = false;
  var q = 0, px = -1e4, py = -1e4, pvx = 0, pvy = 0, inside = false, lastT = 0;
  var running = false, tPrev = 0;
  // springs: angular frequency w (rad/s) and damping ratio z
  var LIN = { w: 8.2, z: .58 }, ANG = { w: 9.0, z: .55 };
  var FRICTION = 2.6;                        // extra linear drag, per second, like a line sliding on paper

  function measure() {
    layer.textContent = ''; lines = []; words = [];
    words.length = 0;
    var b = hb.getBoundingClientRect(), s = stage.getBoundingClientRect();
    W = b.width; SH = s.height;
    em = parseFloat(getComputedStyle(hb).fontSize) || 16;
    M = parseFloat(getComputedStyle(hl).paddingLeft) || 20;
    R = em * 1.9;
    wds.forEach(function (el, k) {
      var tx = el.firstElementChild, dash = el.lastElementChild;
      var d = dash.getBoundingClientRect(), t = tx.getBoundingClientRect();
      var sig = el.classList.contains('pd');
      var w = { tx: tx, x0: t.left - b.left, x1: t.right - b.left, ww: t.width || 1, clip: null };
      words.push(w);
      var L = d.width, hh = d.height; h = hh;
      var bl = document.createElement('i'); if (sig) bl.className = 'c';
      bl.style.width = L.toFixed(2) + 'px'; bl.style.height = hh.toFixed(2) + 'px';
      layer.appendChild(bl);
      var m = L / em + .25;                  // heavier with length
      lines.push({ el: bl, w: w, k: k, sig: sig, L: L, h: hh, m: m, I: m * (L * L + hh * hh) / 12,
        hx: d.left - b.left + L / 2, hy: d.top - b.top + hh / 2,
        x: 0, y: 0, a: 0, vx: 0, vy: 0, va: 0, tx: 0, ty: 0, ta: 0, tf: '', bar: false, z: 0 });
    });
    // rows in reading order
    var rows = [];
    lines.forEach(function (l) {
      var r = null; for (var i = 0; i < rows.length; i++) if (Math.abs(rows[i].y - l.hy) < h) { r = rows[i]; break; }
      if (!r) { r = { y: l.hy, ls: [] }; rows.push(r); } r.ls.push(l); l.row = r;
    });
    rows.sort(function (a, c) { return a.y - c.y; });
    rows.forEach(function (r, i) { r.i = i; r.ls.sort(function (a, c) { return a.hx - c.hx; }); });
    var mid = rows[Math.floor(rows.length / 2)].y;
    // the Rhythm: one bar per word, in reading order, left to right, on the statement's middle line, flush right
    var ink = lines.filter(function (l) { return !l.sig; }), sig = lines.filter(function (l) { return l.sig; })[0];
    var pitch = h * 2.05, n = ink.length, x0 = W - M - h / 2 - (n - 1) * pitch;
    var centre = Math.floor((n - 1) / 2);
    ink.forEach(function (l, j) { l.sx = x0 + j * pitch; l.sy = mid; l.turn = j % 2 ? -1 : 1; l.slot = j; });
    var cb = ink[centre]; cb.centre = true;
    if (sig) { sig.sx = cb.sx; sig.sy = mid - cb.L / 2 - sig.L / 2; sig.turn = 1; sig.cap = cb; }
    // the acts: each row in its own window, its words a beat apart; the Signal last; then the hold
    var acts = [[.04, .30], [.30, .52], [.52, .70]];
    rows.forEach(function (r, i) {
      var A = acts[Math.min(i, acts.length - 1)];
      var inkLs = r.ls.filter(function (l) { return !l.sig; }), cnt = inkLs.length;
      inkLs.forEach(function (l, j) {
        var span = (A[1] - A[0]) * .62, step = cnt > 1 ? (A[1] - A[0] - span) / (cnt - 1) : 0;
        l.q0 = A[0] + (cnt - 1 - j) * step; l.q1 = l.q0 + span;    // the front of the row leaves first, so no line runs into another
      });
    });
    if (sig) { sig.q0 = .66; sig.q1 = .80; }
    lines.forEach(function (l) { var p = target(l, q); l.x = p[0]; l.y = p[1]; l.a = p[2]; l.vx = l.vy = l.va = 0; l.tf = ''; });
    built = true;
  }

  // the pose a line is asked to hold at scroll progress Q: slide off its word along its row, then tip upright into
  // its bar (both stages overlap a little so the slide flows into the tip)
  function target(l, Q) {
    var u = clamp((Q - l.q0) / (l.q1 - l.q0), 0, 1);
    var sl = smoother(u / .62), tp = smoother((u - .56) / .44);
    var x = l.hx + (l.sx - l.hx) * sl, y = l.hy + (l.sy - l.hy) * tp, a = l.turn * Math.PI / 2 * tp;
    return [x, y, a];
  }

  function step(dt, now) {
    var moving = false, spd = Math.sqrt(pvx * pvx + pvy * pvy), i, j, l;
    var kL = LIN.w * LIN.w, cL = 2 * LIN.z * LIN.w, kA = ANG.w * ANG.w, cA = 2 * ANG.z * ANG.w;
    for (i = 0; i < lines.length; i++) {
      l = lines[i];
      var T = target(l, q); l.tx = T[0]; l.ty = T[1]; l.ta = T[2];
      // springs are accelerations (every line keeps the same tempo home); the hand is a force (light lines fly further)
      var sx = kL * (l.tx - l.x) - (cL + FRICTION) * l.vx, sy = kL * (l.ty - l.y) - (cL + FRICTION) * l.vy;
      var sa = kA * (l.ta - l.a) - cA * l.va, Fx = 0, Fy = 0, tq = 0;
      // the hand: pushes at the point of the line nearest to it, so an off-centre push also turns the line
      if (inside) {
        var ux = Math.cos(l.a), uy = Math.sin(l.a), dx = px - l.x, dy = py - l.y;
        var t = clamp(dx * ux + dy * uy, -l.L / 2, l.L / 2), cx = l.x + ux * t, cy = l.y + uy * t;
        var ex = cx - px, ey = cy - py, dc = Math.sqrt(ex * ex + ey * ey) || 1, d = dc - l.h / 2;
        if (d < R) {
          var g = 1 - Math.max(d, 0) / R;
          var push = (16000 * g * g + 260 * spd * g) * em / 80;   // a quicker hand pushes harder
          Fx = ex / dc * push; Fy = ey / dc * push;
          tq = (cx - l.x) * Fy - (cy - l.y) * Fx;               // torque about the centre of mass
        }
      }
      l.vx += (sx + Fx / l.m) * dt; l.vy += (sy + Fy / l.m) * dt; l.va += (sa + tq / l.I) * dt;
    }
    // lines shove each other instead of passing through (only while they lie flat; standing bars are a layer apart)
    for (i = 0; i < lines.length; i++) for (j = i + 1; j < lines.length; j++) {
      var A = lines[i], B = lines[j];
      if (Math.abs(A.a) > .35 || Math.abs(B.a) > .35 || A.bar || B.bar) continue;
      if (Math.abs(A.y - B.y) > (A.h + B.h) * .5 + 2) continue;
      var ov = (A.L + B.L) / 2 + 2 - Math.abs(A.x - B.x);
      if (ov > 0 && Math.abs(A.y - B.y) < (A.h + B.h) / 2) {
        var sgn = A.x < B.x ? -1 : 1, kk = 900 * ov * dt;
        A.vx += sgn * kk / A.m; B.vx -= sgn * kk / B.m;
      }
    }
    for (i = 0; i < lines.length; i++) {
      l = lines[i];
      l.x += l.vx * dt; l.y += l.vy * dt; l.a += l.va * dt;
      if (Math.abs(l.vx) + Math.abs(l.vy) > 1.5 || Math.abs(l.va) > .02 ||
          Math.abs(l.tx - l.x) + Math.abs(l.ty - l.y) > .25 || Math.abs(l.ta - l.a) > .002) moving = true;
    }
    return moving;
  }

  function render() {
    for (var i = 0; i < lines.length; i++) {
      var l = lines[i];
      var tf = 'translate3d(' + (l.x - l.L / 2).toFixed(2) + 'px,' + (l.y - l.h / 2).toFixed(2) + 'px,0) rotate(' + (l.a * 57.29578).toFixed(3) + 'deg)';
      if (tf !== l.tf) { l.el.style.transform = tf; l.tf = tf; }
      var up = Math.abs(l.a) > .78;
      if (up !== l.bar) { l.bar = up; l.el.style.zIndex = up ? 2 : 1; }
      if (l.centre) {
        var sg = lines.filter(function (o) { return o.cap === l; })[0];
        var met = sg && Math.abs(sg.x - l.sx) < l.h * .6 && Math.abs(Math.abs(sg.a) - Math.PI / 2) < .25 && Math.abs(sg.y - sg.sy) < sg.L;
        if (met !== l.met) { l.met = met; l.el.classList.toggle('c', !!met); }
      }
    }
    for (var k = 0; k < words.length; k++) clipWord(k);
  }

  // a word shows only where its own line no longer lies over it; slivers stay hidden
  function interval(l, yy) {
    var c = Math.cos(l.a), s = Math.sin(l.a), dy = yy - l.y, lo = -1e9, hi = 1e9;
    function lim(A, B, half) {          // |A*dx + B| <= half
      if (Math.abs(A) < 1e-6) { if (Math.abs(B) > half) { lo = 1; hi = 0; } return; }
      var p = (-half - B) / A, r = (half - B) / A; if (p > r) { var z = p; p = r; r = z; }
      lo = Math.max(lo, p); hi = Math.min(hi, r);
    }
    lim(c, dy * s, l.L / 2); lim(-s, dy * c, l.h / 2);
    return hi > lo ? [l.x + lo, l.x + hi] : null;
  }
  function clipWord(k) {
    var l = lines[k], w = l.w, cov = [], tiny = em * .12;
    [l.hy - l.h * .45, l.hy, l.hy + l.h * .45].forEach(function (yy) { var iv = interval(l, yy); if (iv) cov.push([iv[0] - w.x0, iv[1] - w.x0]); });
    var a = 1e9, bb = -1e9; cov.forEach(function (c) { a = Math.min(a, c[0]); bb = Math.max(bb, c[1]); });
    var vis = [];
    if (!cov.length) vis.push([0, w.ww]);
    else { if (a > tiny) vis.push([0, Math.min(a, w.ww)]); if (w.ww - bb > tiny) vis.push([Math.max(bb, 0), w.ww]); }
    vis = vis.filter(function (p) { return p[1] - p[0] >= tiny; });
    var css;
    if (!vis.length) css = 'polygon(0 0,0 0,0 0)';
    else if (vis.length === 1 && vis[0][0] <= 0 && vis[0][1] >= w.ww) css = 'none';
    else css = 'polygon(' + vis.map(function (p) {
      var A = (clamp(p[0] / w.ww, 0, 1) * 100).toFixed(2) + '%', B = (clamp(p[1] / w.ww, 0, 1) * 100).toFixed(2) + '%';
      return A + ' -40%,' + A + ' 140%,' + B + ' 140%,' + B + ' -40%';
    }).join(',') + ')';
    if (css !== w.clip) { w.tx.style.clipPath = css; w.clip = css; }
  }

  function progress() {
    var r = H.getBoundingClientRect(), span = H.offsetHeight - innerHeight;
    return span > 0 ? clamp(-r.top / span, 0, 1) : 0;
  }

  function tick(now) {
    var dtAll = tPrev ? Math.min((now - tPrev) / 1000, 1 / 20) : 1 / 60; tPrev = now;
    q = progress();
    pvx *= Math.pow(.02, dtAll); pvy *= Math.pow(.02, dtAll);   // the hand's speed fades when it stops
    var n = Math.max(1, Math.ceil(dtAll / (1 / 240))), dt = dtAll / n, moving = false;
    for (var i = 0; i < n; i++) moving = step(dt, now) || moving;
    if (Math.abs(pvx) + Math.abs(pvy) > .5) moving = true;
    render();
    if (moving) requestAnimationFrame(tick); else { running = false; tPrev = 0; }
  }
  function kick() { if (!running && built) { running = true; requestAnimationFrame(tick); } }

  function point(x, y) {
    var b = hb.getBoundingClientRect(), s = stage.getBoundingClientRect(), nx = x - b.left, ny = y - b.top, now = performance.now();
    if (lastT && now - lastT < 100) { var dt = Math.max(8, now - lastT) / 16.7; pvx = pvx * .4 + (nx - px) / dt * .6; pvy = pvy * .4 + (ny - py) / dt * .6; }
    px = nx; py = ny; lastT = now;
    inside = x >= s.left && x <= s.right && y >= s.top && y <= s.bottom; kick();
  }
  stage.addEventListener('pointermove', function (e) { if (e.pointerType !== 'touch') point(e.clientX, e.clientY); });
  stage.addEventListener('pointerleave', function () { inside = false; lastT = 0; kick(); });
  addEventListener('scroll', kick, { passive: true });

  function settleAt(Q) { q = Q; lines.forEach(function (l) { var p = target(l, Q); l.x = p[0]; l.y = p[1]; l.a = p[2]; }); render(); }
  var rt;
  function setup() {
    narrow = innerWidth < 900 || innerWidth / innerHeight < 1.1;
    H.classList.toggle('ln-off', narrow);
    if (narrow) { layer.textContent = ''; lines = []; built = false; return; }
    measure(); H.classList.add('ln-on');
    if (STILL) { settleAt(1); return; }
    q = progress(); settleAt(q); kick();
  }
  addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(setup, 150); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(setup); else setup();
})();
