/* The Talent Dept. · round 13 hero. Five motions of one idea: the statement sits BEHIND solid lines, one unbroken
   line per word (the full stop behind the one Signal line), with the Draft replies filling the rows around it so the
   composition owns the screen. The hand reveals glimpses; the scroll ends with every line moving aside so the whole
   statement is said. Every line is a rigid body (mass from length, inertia m(L^2+h^2)/12) on a damped spring to the
   pose it is asked to hold, so all motion has weight, lag and a soft landing. Nothing moves on its own.
   Every motion ends the same way, the one the client chose: the first stretch of scroll slides every line off its
   word to the side (the whole statement is said almost at once), then the lines tip up and stand beside it as the
   brand's sound bars, leaning on each other, while the statement and the bars settle to their final size together.
   ?m=1 push   the hand pushes lines like sticks on a table (slide and turn)
   ?m=2 depth  lines sit at different depths in front of the words; the hand shifts them by parallax
   ?m=3 lift   lines near the hand lift like lids
   ?m=5 hinge  lines hinge at their left end and swing open for the hand
   ?m=6 field  the whole screen is bars; the hand sets the whole field moving; scroll breaks it apart */
(function () {
  var H = document.querySelector('.hero4.h13'); if (!H) return;
  var root = document.documentElement, q0 = location.search.match(/[?&]m=(\d)/);
  var MODE = q0 ? +q0[1] : 1; if (MODE < 1 || MODE > 6 || MODE === 4) MODE = 1;
  H.setAttribute('data-m', MODE);
  var reduce = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  var STILL = root.classList.contains('still') || reduce;
  var stage = H.querySelector('.stage'), hb = H.querySelector('.hb'), hl = H.querySelector('.hl');
  var wds = [].slice.call(hl.querySelectorAll('.wd'));
  var layer = document.createElement('div'); layer.className = 'ln13'; layer.setAttribute('aria-hidden', 'true'); hb.appendChild(layer);

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function sm(t) { t = clamp(t, 0, 1); return t * t * t * (t * (t * 6 - 15) + 10); }
  function ein(t) { t = clamp(t, 0, 1); return t * t * t; }
  function hash(i, s) { var x = Math.sin(i * 12.9898 + s * 78.233) * 43758.5453; return x - Math.floor(x); }

  var CB = null, K = .6, OX = 0, OY = 0, W = 1, SH = 1, em = 16, M = 20, R = 100, bodies = [], words = [], built = false;
  var q = 0, px = -1e4, py = -1e4, pvx = 0, pvy = 0, inside = false, lastT = 0, running = false, tPrev = 0;
  var SPR = { w: 8.4, z: .6 }, SPA = { w: 9.2, z: .55 }, FR = 2.4;
  var WID = [18, 44, 48, 92, 104, 111, 127, 144, 183];          // the brand's dash lengths, for the replies

  function mk(el, L, h, cx, cy, kind, k) {
    var m = L / em + .25;
    return { el: el, L: L, h: h, m: m, I: m * (L * L + h * h) / 12, hx: cx, hy: cy, x: cx, y: cy, a: 0, vx: 0, vy: 0, va: 0,
      kind: kind, k: k, d: .7 + hash(k, 3) * .6, tf: '', row: 0 };
  }

  function measure() {
    layer.textContent = ''; bodies = []; words = [];
    var b = hb.getBoundingClientRect(), s = stage.getBoundingClientRect();
    W = b.width; SH = s.height; em = parseFloat(getComputedStyle(hb).fontSize) || 16;
    M = parseFloat(getComputedStyle(hl).paddingLeft) || 20; R = em * 1.6;
    var rows = [], h = 10;
    wds.forEach(function (el, k) {
      var tx = el.firstElementChild, d = el.lastElementChild.getBoundingClientRect(), t = tx.getBoundingClientRect();
      var sig = el.classList.contains('pd'), L = d.width; h = d.height;
      var i = document.createElement('i'); i.className = sig ? 'c' : 'k'; i.style.width = L + 'px'; i.style.height = h + 'px'; layer.appendChild(i);
      var body = mk(i, L, h, d.left - b.left + L / 2, d.top - b.top + h / 2, sig ? 'sig' : 'ink', k);
      body.w = { tx: tx, x0: t.left - b.left, ww: t.width || 1, clip: null };
      bodies.push(body); words.push(body);
      var r = null; for (var j = 0; j < rows.length; j++) if (Math.abs(rows[j].y - body.hy) < h) { r = rows[j]; break; }
      if (!r) { r = { y: body.hy, x1: 0, ls: [] }; rows.push(r); }
      r.ls.push(body); r.x1 = Math.max(r.x1, d.right - b.left);
    });
    rows.sort(function (a, c) { return a.y - c.y; });
    rows.forEach(function (r, i) { r.ls.forEach(function (l) { l.row = i; }); });
    // the replies: Draft dashes after each line of the statement and on a row above and below, to the margins
    var pitch = rows.length > 1 ? rows[1].y - rows[0].y : em * 1.2, n = 0;
    var top = rows[0].y, bot = rows[rows.length - 1].y, gap = pitch * .62, replyRows = [];
    for (var u = 1; top - gap * u > em * .9; u++) replyRows.push({ y: top - gap * u + pitch * .1, x0: M + em * (u % 2 ? 1.4 : .2) + hash(u, 2) * em, row: -u });
    rows.forEach(function (r, i) { replyRows.push({ y: r.y, x0: r.x1 + em * .55, row: i, after: true }); });
    for (var v = 1; bot + gap * v < SH - em * .5; v++) replyRows.push({ y: bot + gap * v - pitch * .1, x0: M + em * (v % 2 ? 2.6 : .9) + hash(v, 8) * em, row: rows.length + v });
    if (MODE === 6) replyRows = [];
    replyRows.forEach(function (rr, ri) {
      var x = rr.x0, hh = rr.after ? h * .62 : h * .34;
      while (x < W - M - 10) {
        var L = WID[Math.floor(hash(ri * 17 + n, 5) * WID.length)] * em / 64;
        if (x + L > W - M) L = W - M - x; if (L < em * .25) break;
        var i = document.createElement('i'); i.className = 'r'; i.style.width = L + 'px'; i.style.height = hh + 'px'; layer.appendChild(i);
        var body = mk(i, L, hh, x + L / 2, rr.y, 'rep', 100 + n); body.row = rr.row; body.d = .35 + hash(n, 9) * .3;
        bodies.push(body); x += L + em * (hash(n, 6) < .25 ? 1.1 : .32); n++;
      }
    });
    // the end pose: the statement at its final size on the left, the lines standing as sound bars on the right,
    // leaning on each other. The statement and the bars settle to that size together (k = end scale)
    var emEnd = Math.min((W - 2 * M) / 17.3, (SH - 40) / 6.4); K = clamp(emEnd / em, .45, 1);
    var hr = hl.getBoundingClientRect(); OX = M; OY = hr.top - b.top + hr.height / 2;
    var ink = words.filter(function (l) { return l.kind === 'ink'; }), sig = words.filter(function (l) { return l.kind === 'sig'; })[0];
    var hE = h * K, pitch2 = hE * 1.55, n2 = ink.length, x0 = W - M - hE / 2 - (n2 - 1) * pitch2;
    var midY = OY + (rows[Math.floor(rows.length / 2)].y - OY) * K;
    ink.concat(sig ? [sig] : []).forEach(function (l, j) {
      l.sx = x0 + j * pitch2; l.sy = midY; l.sa = Math.PI / 2 + (j % 2 ? -1 : 1) * (.05 + hash(j, 12) * .06);
      l.a0 = .03 + l.row * .07 + (rows[l.row].ls.length - rows[l.row].ls.indexOf(l)) * .012; l.a1 = l.a0 + .16;   // slide aside: front of each row first
      l.b0 = .36 + j * .03; l.b1 = l.b0 + .26;                                                                // stand up, in reading order
    });
    // the Signal: the full stop's line comes last and caps the centre bar, which turns Signal as they meet
    CB = ink[Math.floor((ink.length - 1) / 2)];
    if (sig) { sig.sx = CB.sx; sig.sa = CB.sa; sig.sy = CB.sy - (CB.L * K / 2 + sig.L * K / 2) * Math.sin(CB.sa) ; sig.sx = CB.sx - (CB.L * K / 2 + sig.L * K / 2) * Math.cos(CB.sa); sig.b0 = .62; sig.b1 = .8; }
    bodies.forEach(function (l, j) { if (l.kind === 'rep') { l.a0 = .14 + hash(j, 13) * .12; l.a1 = l.a0 + .2; l.side = 1; } });
    if (MODE === 6) {          // the whole screen is bars: fill every free row edge to edge, Ink with Draft, one Signal
      var rowsY = [], yy = em * .55, gp = pitch * .5;
      for (; yy < SH - em * .3; yy += gp) rowsY.push(yy);
      var nf = 0, sigDone = false;
      rowsY.forEach(function (yv, ri) {
        var onText = rows.filter(function (r) { return Math.abs(r.y - yv) < pitch * .45; })[0];
        var x = onText ? onText.x1 + em * .4 : M * .4 + hash(ri, 3) * em * .6;
        if (bodies.some(function (o) { return o.kind === 'rep' && Math.abs(o.hy - yv) < gp * .5; }) && !onText) return;
        while (x < W - 8) {
          var L = (1.4 + hash(nf, 21) * 3.6) * em; if (x + L > W - 8) L = W - 8 - x; if (L < em * .5) break;
          var hh = Math.min(onText ? h : h * (.6 + hash(nf, 22) * .3), gp * .62);
          var i = document.createElement('i'); var cl = !sigDone && ri === Math.floor(rowsY.length * .78) && hash(nf, 23) > .3 ? 'c' : (!onText && hash(nf, 24) < .28 ? 'r' : 'k');
          if (cl === 'c') sigDone = true;
          i.className = cl + ' f'; i.style.width = L + 'px'; i.style.height = hh + 'px'; layer.appendChild(i);
          var fb = mk(i, L, hh, x + L / 2, yv, 'field', 300 + nf); fb.row = 1000 + ri; fb.side = (x + L / 2) < W / 2 ? -1 : 1;
          fb.a0 = .02 + Math.abs(fb.hx - W / 2) / W * .1 + hash(nf, 25) * .06; fb.a1 = fb.a0 + .22;
          bodies.push(fb); x += L + em * (.18 + hash(nf, 26) * .3); nf++;
        }
      });
    }
    bodies.forEach(function (l) { l.x = l.hx; l.y = l.hy; l.a = 0; l.vx = l.vy = l.va = 0; l.tf = ''; });
    built = true;
  }

  // the pose the scroll asks a body to hold (offsets from home): only the statement's lines leave; the replies stay
  function exitPose(l, Q) {
    if (l.kind === 'rep' || l.kind === 'field') {           // the replies and the field leave the room, by the nearer side
      var e = sm((Q - l.a0) / (l.a1 - l.a0)), far = l.side > 0 ? W - l.hx + l.L : -(l.hx + l.L);
      return [far * e, 0, 0, 1];
    }
    var ua = sm((Q - l.a0) / (l.a1 - l.a0)), ub = sm((Q - l.b0) / (l.b1 - l.b0));
    // A: slide along the row to the column it will stand in. B: tip up into the bar, leaning, at the final size
    var off = W + l.L * .6 + 30;                               // A: the line leaves its word and the frame, to the right
    var x = l.hx + (off - l.hx) * ua + (l.sx - off) * ub, y = l.hy + (l.sy - l.hy) * ub, k = 1 + (K - 1) * ub;
    return [x - l.hx, y - l.hy, l.sa * ub, k];
  }
  function textScale(Q) { return 1 + (K - 1) * sm((Q - .36) / .42); }

  function step(dt) {
    var moving = false, spd = Math.sqrt(pvx * pvx + pvy * pvy), i, j, l;
    var kL = SPR.w * SPR.w, cL = 2 * SPR.z * SPR.w, kA = SPA.w * SPA.w, cA = 2 * SPA.z * SPA.w;
    var cxs = W / 2, cys = SH * .45;
    for (i = 0; i < bodies.length; i++) {
      l = bodies[i];
      var T = exitPose(l, q), tx = l.hx + T[0], ty = l.hy + T[1], ta = T[2]; l.k = T[3];
      var away = q > l.a0 + .01;              // once a line is leaving, the hand lets it go
      // mode targets from the hand (pose offsets, not forces)
      if (inside && !away) {
        if (MODE === 2) { tx += -(px - cxs) * .06 * l.d; ty += -(py - cys) * .05 * l.d; }
        if (MODE === 3) {
          var g3 = Math.max(0, 1 - Math.abs(px - l.hx) / (l.L / 2 + R)) * Math.max(0, 1 - Math.abs(py - l.hy) / (R * 1.2));
          g3 = g3 * g3 * (3 - 2 * g3); ty -= g3 * em * (l.kind === 'rep' ? .6 : 1.05); ta += (px < l.hx ? 1 : -1) * g3 * .12;
        }
        if (MODE === 5 && l.kind !== 'rep') {
          var g5 = Math.max(0, 1 - Math.hypot(px - (l.hx - l.L / 2 + l.L * .6), (py - l.hy) * 1.4) / (l.L * .5 + R));
          g5 = g5 * g5 * (3 - 2 * g5); var op = -g5 * 1.05;     // swing up about the left end
          tx += -l.L / 2 + Math.cos(op) * l.L / 2 - 0; ty += Math.sin(op) * l.L / 2; ta += op;
        }
      }
      var sx = kL * (tx - l.x) - (cL + FR) * l.vx, sy = kL * (ty - l.y) - (cL + FR) * l.vy, sa = kA * (ta - l.a) - cA * l.va;
      var Fx = 0, Fy = 0, tq = 0;
      // forces from the hand: m1 pushes at the nearest point (slide and turn); m4 pushes along the row only
      if (inside && !away && (MODE === 1 || MODE === 6)) {
        var ux = Math.cos(l.a), uy = Math.sin(l.a), dx = px - l.x, dy = py - l.y;
        var t = clamp(dx * ux + dy * uy, -l.L / 2, l.L / 2), cx = l.x + ux * t, cy = l.y + uy * t;
        var ex = cx - px, ey = cy - py, dc = Math.sqrt(ex * ex + ey * ey) || 1, d = dc - l.h / 2;
        if (d < R) {
          var g = 1 - Math.max(d, 0) / R, push = (16000 * g * g + 260 * spd * g) * em / 80 * (l.kind === 'rep' ? .6 : 1) * (MODE === 6 ? 1.3 : 1);
          Fx = ex / dc * push; Fy = ey / dc * push; tq = (cx - l.x) * Fy - (cy - l.y) * Fx;
        }
      }
      l.vx += (sx + Fx / l.m) * dt; l.vy += (sy + Fy / l.m) * dt; l.va += (sa + tq / l.I) * dt;
    }
    // lines on one row shove each other instead of passing through (m1, m4)
    if ((MODE === 1 || MODE === 6) && q < .02) for (i = 0; i < bodies.length; i++) for (j = i + 1; j < bodies.length; j++) {
      var A = bodies[i], B = bodies[j];
      if (A.row !== B.row || A.kind === 'field' && B.kind !== 'field' || Math.abs(A.a) > .35 || Math.abs(B.a) > .35) continue;
      if (Math.abs(A.y - B.y) > (A.h + B.h) / 2) continue;
      var ov = (A.L + B.L) / 2 + 3 - Math.abs(A.x - B.x);
      if (ov > 0) { var sg = A.x < B.x ? -1 : 1, kk = 1400 * ov * dt; A.vx += sg * kk / A.m; B.vx -= sg * kk / B.m; }
    }
    for (i = 0; i < bodies.length; i++) {
      l = bodies[i]; l.x += l.vx * dt; l.y += l.vy * dt; l.a += l.va * dt;
      if (Math.abs(l.vx) + Math.abs(l.vy) > 1.5 || Math.abs(l.va) > .02) moving = true;
    }
    return moving;
  }

  function render() {
    for (var i = 0; i < bodies.length; i++) {
      var l = bodies[i];
      var tf = 'translate3d(' + (l.x - l.L / 2).toFixed(2) + 'px,' + (l.y - l.h / 2).toFixed(2) + 'px,0) rotate(' + (l.a * 57.29578).toFixed(3) + 'deg)' + (l.k && l.k !== 1 ? ' scale(' + l.k.toFixed(4) + ')' : '');
      if (tf !== l.tf) { l.el.style.transform = tf; l.tf = tf; }
    }
    if (CB) { var met = q > .78; if (met !== CB.met) { CB.met = met; CB.el.className = met ? 'c' : 'k'; } }
    var ts = textScale(q); hl.style.transform = 'translateY(-50%) scale(' + ts.toFixed(4) + ')';
    for (var k = 0; k < words.length; k++) clipWord(words[k]);
  }
  function interval(l, yy) {
    var c = Math.cos(l.a), s = Math.sin(l.a), dy = yy - l.y, lo = -1e9, hi = 1e9;
    function lim(A, B, half) { if (Math.abs(A) < 1e-6) { if (Math.abs(B) > half) { lo = 1; hi = 0; } return; }
      var p = (-half - B) / A, r = (half - B) / A; if (p > r) { var z = p; p = r; r = z; } lo = Math.max(lo, p); hi = Math.min(hi, r); }
    lim(c, dy * s, l.L / 2); lim(-s, dy * c, l.h / 2);
    return hi > lo ? [l.x + lo, l.x + hi] : null;
  }
  function clipWord(l) {
    var w = l.w, cov = [], tiny = em * .1;
    if (q > .3) { if (w.clip !== 'none') { w.tx.style.clipPath = 'none'; w.clip = 'none'; } return; }
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

  function progress() { var r = H.getBoundingClientRect(), span = H.offsetHeight - innerHeight; return span > 0 ? clamp(-r.top / span, 0, 1) : 0; }
  function tick(now) {
    var dtAll = tPrev ? Math.min((now - tPrev) / 1000, 1 / 20) : 1 / 60; tPrev = now;
    q = progress(); pvx *= Math.pow(.02, dtAll); pvy *= Math.pow(.02, dtAll);
    var n = Math.max(1, Math.ceil(dtAll / (1 / 240))), dt = dtAll / n, moving = false;
    for (var i = 0; i < n; i++) moving = step(dt) || moving;
    // keep going while any body is still away from where it was asked to be
    for (var j = 0; j < bodies.length && !moving; j++) { var l = bodies[j], T = exitPose(l, q); if (Math.abs(l.hx + T[0] - l.x) + Math.abs(l.hy + T[1] - l.y) > .4 || Math.abs(T[2] - l.a) > .003) moving = true; l.k = T[3]; }
    if (inside) moving = moving || Math.abs(pvx) + Math.abs(pvy) > .3;
    render();
    if (moving) requestAnimationFrame(tick); else { running = false; tPrev = 0; }
  }
  function kick() { if (!running && built) { running = true; requestAnimationFrame(tick); } }
  function point(x, y) {
    var b = hb.getBoundingClientRect(), s = stage.getBoundingClientRect(), nx = x - b.left, ny = y - b.top, now = performance.now();
    if (lastT && now - lastT < 100) { var dt = Math.max(8, now - lastT) / 16.7; pvx = pvx * .4 + (nx - px) / dt * .6; pvy = pvy * .4 + (ny - py) / dt * .6; }
    px = nx; py = ny; lastT = now; inside = x >= s.left && x <= s.right && y >= s.top && y <= s.bottom; kick();
  }
  stage.addEventListener('pointermove', function (e) { if (e.pointerType !== 'touch') point(e.clientX, e.clientY); });
  stage.addEventListener('pointerleave', function () { inside = false; lastT = 0; kick(); });
  addEventListener('scroll', kick, { passive: true });

  function settle(Q) { q = Q; bodies.forEach(function (l) { var T = exitPose(l, Q); l.x = l.hx + T[0]; l.y = l.hy + T[1]; l.a = T[2]; l.k = T[3]; }); render(); }
  var rt;
  function setup() {
    var narrow = innerWidth < 900 || innerWidth / innerHeight < 1.1;
    H.classList.toggle('ln-off', narrow);
    if (narrow) { layer.textContent = ''; bodies = []; built = false; return; }
    measure(); H.classList.add('ln-on');
    if (STILL) { settle(1); return; }
    settle(progress()); kick();
  }
  addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(setup, 150); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(setup); else setup();
})();
