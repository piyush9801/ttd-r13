/* The Talent Dept. · v1 Rhythm · the home hero.
   "Every conversation has a rhythm." The statement is printed on the page behind its Line of Sight: every word under
   one Ink dash, the full stop under the Signal dash, Draft replies in the pauses. Each dash is a row of square blocks,
   the conversations, each as wide as the dash is thick.
   The cursor: blocks near the hand flinch, then dart to the rim of a clearing (a ripple of alarm runs outwards, each
   curls to one side of the hand's path, lands on the block grid with a squash), the words show in the clearing; when
   the hand moves on they wait, then creep home on a softer spring.
   The scroll, pose to pose and on rails: the replies slide off along their rows; then each line's dash travels as one
   ribbon along its row, turns down (or up) one shared lane and runs along its slot height into its bar, so the line is
   said in reading order and the dash stands up as bars, each bar exactly the blocks of one word, grown from the centre
   line outwards. The coral full stop waits, is passed over, and arrives last: the Signal. The end is held.
   At the end the bars answer the pointer like a voice level. Nothing moves on its own; the loop stops at rest.
   ?still and reduced motion: the end pose, still. */
(function () {
  'use strict';
  var H = document.querySelector('.hero4.rh');
  if (!H) return;
  var root = document.documentElement;
  var reduce = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  var STILL = root.classList.contains('still') || reduce;
  var stage = H.querySelector('.stage'), hb = H.querySelector('.hb'), hl = H.querySelector('.hl');
  if (!stage || !hb || !hl) return;
  var wds = [].slice.call(hl.querySelectorAll('.wd'));
  var back = document.createElement('div'); back.className = 'sw sw-back'; back.setAttribute('aria-hidden', 'true');
  var front = document.createElement('div'); front.className = 'sw sw-front'; front.setAttribute('aria-hidden', 'true');
  hb.insertBefore(back, hb.firstChild); hb.appendChild(front);

  /* ------------------------------------------------------------------ helpers */
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function hash(i, s) { var x = Math.sin(i * 12.9898 + s * 78.233) * 43758.5453; return x - Math.floor(x); }
  function sstep(t) { t = clamp(t, 0, 1); return t * t * t * (t * (t * 6 - 15) + 10); }
  function between(a, b, x) { return sstep((x - a) / (b - a)); }
  function inOut2(t) { return t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
  function in2(t) { return t * t; }
  function backOut(t, k) { t -= 1; return 1 + (k + 1) * t * t * t + k * t * t; }

  /* A path along axis-aligned legs with rounded corners (quarter arcs). Evaluated by distance; before the start it
     extends back along the first leg, past the end along the last. */
  function makePath(pts, rc) {
    var P = [pts[0]], i;
    for (i = 1; i < pts.length; i++) {           // drop zero legs and merge straight runs
      var a = P[P.length - 1], b = pts[i];
      if (Math.abs(b[0] - a[0]) + Math.abs(b[1] - a[1]) < .5) continue;
      if (P.length > 1) {
        var z = P[P.length - 2];
        var d1x = Math.sign(a[0] - z[0]), d1y = Math.sign(a[1] - z[1]), d2x = Math.sign(b[0] - a[0]), d2y = Math.sign(b[1] - a[1]);
        if (d1x === d2x && d1y === d2y) { P[P.length - 1] = b; continue; }
      }
      P.push(b);
    }
    var legs = [];
    for (i = 1; i < P.length; i++) {
      var A = P[i - 1], B = P[i], len = Math.abs(B[0] - A[0]) + Math.abs(B[1] - A[1]);
      legs.push({ a: A, b: B, len: len, dx: Math.sign(B[0] - A[0]), dy: Math.sign(B[1] - A[1]) });
    }
    var r = [];                                    // fillet radius at each inner corner
    for (i = 0; i < legs.length - 1; i++) {
      var lim1 = i === 0 ? legs[i].len : legs[i].len / 2, lim2 = i + 1 === legs.length - 1 ? legs[i + 1].len : legs[i + 1].len / 2;
      r.push(Math.max(0, Math.min(rc, lim1, lim2)));
    }
    var segs = [], at = legs.length ? legs[0].a.slice() : pts[0].slice();
    for (i = 0; i < legs.length; i++) {
      var g = legs[i], rIn = i > 0 ? r[i - 1] : 0, rOut = i < legs.length - 1 ? r[i] : 0;
      var sx = g.a[0] + g.dx * rIn, sy = g.a[1] + g.dy * rIn, ex = g.b[0] - g.dx * rOut, ey = g.b[1] - g.dy * rOut;
      var ll = Math.abs(ex - sx) + Math.abs(ey - sy);
      segs.push({ t: 'l', x: sx, y: sy, dx: g.dx, dy: g.dy, len: ll });
      if (rOut > 0) {
        var n = legs[i + 1];
        segs.push({ t: 'a', cx: g.b[0] + (n.dx - g.dx) * rOut, cy: g.b[1] + (n.dy - g.dy) * rOut, r: rOut,
          d1x: g.dx, d1y: g.dy, d2x: n.dx, d2y: n.dy, len: Math.PI * rOut / 2 });
      }
    }
    var total = 0; segs.forEach(function (sg) { sg.s0 = total; total += sg.len; });
    if (!segs.length) segs.push({ t: 'l', x: pts[0][0], y: pts[0][1], dx: 1, dy: 0, len: 0, s0: 0 });
    return { segs: segs, len: total, end: pts[pts.length - 1] };
  }
  function pathAt(P, d, out) {
    var sg = P.segs, k, m;
    if (d <= 0) { m = sg[0]; out[0] = m.x + (m.dx || 0) * d; out[1] = m.y + (m.dy || 0) * d; return out; }
    for (k = 0; k < sg.length; k++) {
      m = sg[k];
      if (d <= m.s0 + m.len || k === sg.length - 1) {
        var u = d - m.s0;
        if (m.t === 'l') { out[0] = m.x + m.dx * u; out[1] = m.y + m.dy * u; }
        else {
          if (u > m.len) {                          // past an arc at the very end: carry on straight
            out[0] = m.cx + m.d1x * m.r + m.d2x * (u - m.len); out[1] = m.cy + m.d1y * m.r + m.d2y * (u - m.len);
          } else {
            var th = u / m.r, c = Math.cos(th), s2 = Math.sin(th);
            out[0] = m.cx + m.r * (-m.d2x * c + m.d1x * s2); out[1] = m.cy + m.r * (-m.d2y * c + m.d1y * s2);
          }
        }
        return out;
      }
    }
    return out;
  }

  /* ------------------------------------------------------------------ state */
  var W = 1, SH = 1, M = 20, mode = 'beside', em = 16, s = 10, g0 = 2, p = 12, PL = 12, L = 18, R = 150;
  var all = [], solid = [], reps = [], words = [], rows = [], bars = [], repRows = [], coral = [], levels = [];
  var Q_END = .78, built = false;
  var q = 0, qT = 0, first = true;
  var px = -1e4, py = -1e4, pvx = 0, pvy = 0, pspd = 0, lastPX = null, lastPY = null, lastPT = 0, inside = false, lastMove = -1e9;
  var running = false, tPrev = 0;
  var DART = { k: 260, c: 26 }, HOME = { k: 90, c: 14 }, HOVER = { k: 180, c: 20 };

  function mk(el, x, y, w, h, kind, i) {
    return { el: el, hx: x, hy: y, w: w, h: h, kind: kind, i: i,
      cx: x, cy: y, x: x, y: y, px: x, py: y, vxs: 0, vys: 0, sq: 0, sqx: 1, sp0: 0,
      ox: 0, oy: 0, vx: 0, vy: 0, tx: 0, ty: 0, alarm: 0, side: 1, hold: 0, dart: 0, fl: 0,
      jit: hash(i, 3) * 40, hr: hash(i, 5), tf: '' };
  }

  /* ------------------------------------------------------------------ measure and build */
  function measure() {
    front.textContent = ''; back.textContent = '';
    words.forEach(function (w) { w.tx.style.clipPath = ''; });
    var b = hb.getBoundingClientRect();
    W = b.width; SH = b.height;
    var cs = getComputedStyle(hb);
    mode = (cs.getPropertyValue('--mode') || '').trim() === 'below' ? 'below' : 'beside';
    em = parseFloat(getComputedStyle(hl).fontSize) || 16;
    M = parseFloat(getComputedStyle(hl).paddingLeft) || 20;
    all = []; solid = []; reps = []; words = []; rows = []; bars = []; repRows = []; coral = [];

    wds.forEach(function (el, k) {
      var tx = el.firstElementChild, d = el.lastElementChild.getBoundingClientRect(), t = tx.getBoundingClientRect();
      words.push({ el: el, tx: tx, k: k, sig: el.classList.contains('pd'), x0: t.left - b.left, x1: t.right - b.left,
        cy: Math.round(d.top - b.top + d.height / 2), th: d.height, blocks: [], clip: null });
    });
    s = Math.max(6, Math.round(words[0].th)); g0 = 0; p = s + g0; PL = Math.round(s * 1.25);
    words.forEach(function (w) {
      var r = null;
      for (var i = 0; i < rows.length; i++) if (Math.abs(rows[i].cy - w.cy) < s * .5) { r = rows[i]; break; }
      if (!r) { r = { cy: w.cy, words: [] }; rows.push(r); }
      r.words.push(w); w.row = r;
    });
    rows.sort(function (a, c) { return a.cy - c.cy; });
    rows.forEach(function (r, i) { r.i = i; r.words.sort(function (a, c) { return a.x0 - c.x0; }); });
    L = rows.length > 1 ? rows[1].cy - rows[0].cy : em * 1.16;
    R = clamp(em * 3, 110, 270);

    // the dashes, cut into square blocks on one pitch
    var n = 0, lastInkEnd = -1e9;
    words.forEach(function (w) {
      var tw = w.x1 - w.x0, cnt, x;
      if (w.sig) { cnt = 2; x = Math.max(Math.round(w.x0), lastInkEnd + g0); }
      else { cnt = Math.max(1, Math.round((tw + g0) / p)); x = Math.round(w.x0 + (w.k === 0 || w.x0 < M + 2 ? 0 : (tw - (cnt * p - g0)) / 2)); }
      for (var j = 0; j < cnt; j++) {
        var el = document.createElement('i');
        if (w.sig) { el.className = 'c'; front.insertBefore(el, front.firstChild); } else front.appendChild(el);
        el.style.width = s + 'px'; el.style.height = s + 'px';
        var bl = mk(el, x + s / 2, w.cy, s, s, w.sig ? 'coral' : 'ink', n++);
        bl.word = w; bl.row = w.row; bl.j = j;
        w.blocks.push(bl); all.push(bl); solid.push(bl);
        if (w.sig) coral.push(bl);
        x += p;
      }
      if (!w.sig) lastInkEnd = x - p + s;
    });
    var lineEnd = 0; solid.forEach(function (bl) { lineEnd = Math.max(lineEnd, bl.hx + s / 2); });
    var lastRow = rows[rows.length - 1];

    // the rhythm: one bar per word, standing in reading order on every layout; the lines stand in groups with a wider
    // pause between them. The full stop's blocks arrive last and join the middle bar, which turns coral as they join:
    // the Signal, discovered. A cable that has to pass bars already standing runs behind them along the middle line.
    var els = words.filter(function (w) { return !w.sig; }).map(function (w) {
      return { sig: false, n: w.blocks.length, row: w.row, blocks: w.blocks.slice(), word: w };
    });
    // the Signal is the bar at the rhythm's visual centre (as in the book's medium-scale mark: one coral bar of middle
    // height among Ink bars), not the tallest: the accent is discovered, not shouted
    var sigEl = els[Math.floor((els.length - 1) / 2)];
    sigEl.sig = true; sigEl.coral = coral.slice(); sigEl.n += coral.length;
    var ng = 0, nG = 0;
    for (var e = 1; e < els.length; e++) { if (els[e].row === els[e - 1].row) ng++; else nG++; }
    var maxN = 0; els.forEach(function (el) { maxN = Math.max(maxN, el.n); });
    var Hmax = maxN * p - g0, clr = Math.round(s * .55), g, X0, lane, cyR, GR = 2.1;
    if (mode === 'beside') {
      var X1 = W - M, avail = X1 - (lineEnd + 2 * clr + s);
      g = (avail - els.length * s) / (ng + GR * nG);
      g = clamp(g, s * .5, s * .78);
      var tot = els.length * s + ng * g + nG * GR * g;
      X0 = X1 - tot;
      lane = Math.round(Math.max(lineEnd + clr + s / 2, (lineEnd + X0) / 2));
      cyR = rows[Math.floor((rows.length - 1) / 2)].cy;
    } else {
      lane = Math.round(Math.min(lineEnd + clr + s / 2, W - s / 2 - 3));
      var X1b = lane - s / 2 - clr;
      g = (X1b - M - els.length * s) / (ng + GR * nG);
      g = clamp(g, s * .5, s * .85);
      X0 = M;
      cyR = Math.round(lastRow.cy + em * .5 + em * .62 + Hmax / 2);
      cyR = Math.min(cyR, Math.round(SH - Hmax / 2 - s * .8));
    }
    var x = X0;
    bars = [];
    els.forEach(function (el, i) {
      if (i > 0) x += els[i].row === els[i - 1].row ? g : GR * g;
      var xc = Math.round(x + s / 2), nn = el.n, j, r2;
      var bar = { x: xc, cy: cyR, n: nn, sig: el.sig, blocks: [], lv: 0, lvv: 0, coralFrom: el.blocks.length };
      // the bar's blocks in arrival order, the head of the ribbon first. Each new block enters at the centre line;
      // to take it the bar opens: odd arrivals lift the centre block and all above it one pitch, even arrivals lower
      // the centre block and all below it. So the bar grows from its centre line, alternately up and down.
      var head = function (a, c) { return c.hx - a.hx; };
      var arr = el.blocks.slice().sort(head).concat((el.coral || []).slice().sort(head)), pos = [];
      arr.forEach(function (bl, k) { bl.bar = bar; bl.k = k; bl.ex = xc; bl.ey = cyR; bl.pushes = []; bar.blocks.push(bl); });
      for (r2 = 0; r2 < nn; r2++) {
        for (j = 0; j < r2; j++) {
          if (r2 % 2 === 1 && pos[j] <= 0) { pos[j] -= 1; arr[j].pushes.push([r2, -1]); }
          else if (r2 % 2 === 0 && pos[j] >= 0) { pos[j] += 1; arr[j].pushes.push([r2, 1]); }
        }
        pos.push(0);
      }
      var mean = 0; pos.forEach(function (v) { mean += v; }); mean /= nn;
      bar.settle = -mean;                       // even bars end half a block high: they settle onto the line
      bar.maxSlot = .5;
      arr.forEach(function (bl, k) { bl.slot = pos[k] + bar.settle; bar.maxSlot = Math.max(bar.maxSlot, Math.abs(bl.slot)); });
      bars.push(bar);
      x += s;
    });

    // paths: along the row, along the lane, along the centre line into the side of the bar
    var rc = 0;                                  // square corners: the cable stays one block wide round the bend
    solid.forEach(function (bl) {
      bl.path = makePath([[bl.hx, bl.hy], [lane, bl.hy], [lane, bl.ey], [bl.ex, bl.ey]], rc);
      bl.L = bl.path.len;
    });


    // timing: the lines in turn, each as long as its longest path, with holds between; the Signal last
    var Q0 = .11, Q1 = .68, HOLD = .04, lens = [], tot2 = 0;
    rows.forEach(function (r) {
      var m = 0; r.blocks = solid.filter(function (bl) { return bl.row === r && bl.kind === 'ink'; });
      r.blocks.forEach(function (bl) { m = Math.max(m, bl.L + p * 1.0); });
      r.T = m; lens.push(Math.pow(m, .85)); tot2 += Math.pow(m, .85);
    });
    var span = Q1 - Q0 - HOLD * (rows.length - 1), t0 = Q0;
    rows.forEach(function (r, i) { r.a0 = t0; r.a1 = t0 + span * lens[i] / tot2; t0 = r.a1 + HOLD; });
    // three lines (wide screens): key poses on the quarters. 25% the first line being said and its bars rising;
    // 50% a hold, two lines said, six bars standing; 75% the Signal arriving; 78 to 100% the end, held
    if (rows.length === 3) [[.11, .31], [.37, .47], [.53, .68]].forEach(function (w, i) { rows[i].a0 = w[0]; rows[i].a1 = w[1]; });
    var cT = 0; coral.forEach(function (bl) { cT = Math.max(cT, bl.L + p * 1.6); });
    coral.act = { a0: Q1, a1: Q_END, T: cT };

    // the replies: Draft dashes of the brand's lengths in the pauses, cut into the same blocks, thinner
    var WID = [18, 44, 48, 92, 104, 111, 127, 144, 183], rh = Math.max(3, Math.round(em * .2)), specs = [];
    if (mode === 'beside') {
      var xs = [[.36, .91], [.29, .97], [.43, .86]];
      rows.forEach(function (r, i) { specs.push({ y: Math.round(r.cy + L / 2), x0: W * xs[i % 3][0], x1: W * xs[i % 3][1] }); });
    } else {
      var xb = [[.30, .98], [.10, .84], [.42, 1.02], [.18, .90]], top = lastRow.cy + L * .78;
      for (var k = 0; k < 4; k++) specs.push({ y: Math.round(top + k * L * .9), x0: W * xb[k][0], x1: W * xb[k][1] });
    }
    var rn = 0;
    specs.forEach(function (sp, ri) {
      var xx = Math.round(sp.x0), row = { y: sp.y, blocks: [], i: ri };
      while (xx < sp.x1) {
        var wl = WID[Math.floor(hash(rn * 7 + ri, 9) * WID.length)] * em / 100;
        var nb = Math.max(1, Math.round(wl / p));
        for (var q2 = 0; q2 < nb && xx + s <= sp.x1 + s; q2++) {
          var el = document.createElement('i'); el.className = 'r';
          el.style.width = s + 'px'; el.style.height = rh + 'px';
          back.appendChild(el);
          var bl = mk(el, xx + s / 2, sp.y, s, rh, 'rep', 500 + rn * 13 + q2);
          row.blocks.push(bl); reps.push(bl); all.push(bl);
          xx += p;
        }
        var pause = hash(rn, 4) < .16 ? s * 3.2 : s * [.55, .8, 1.25][Math.floor(hash(rn, 6) * 3)];
        xx += Math.round(pause - g0); rn++;
      }
      var minX = 1e9; row.blocks.forEach(function (bl) { minX = Math.min(minX, bl.hx); });
      row.dx = W + s * 2 - minX + s;
      row.a0 = .025 + ri * .022; row.a1 = row.a0 + .095;
      row.blocks.forEach(function (bl) { bl.rrow = row; });
      repRows.push(row);
    });
    levels = [];
    rows.forEach(function (r, i) {
      if (i < rows.length - 1) levels.push({ y: Math.round((r.cy + rows[i + 1].cy) / 2), adj: [r.cy, rows[i + 1].cy] });
    });
    levels.push({ y: Math.round(rows[0].cy - L / 2), adj: [rows[0].cy] }, { y: Math.round(rows[0].cy - L), adj: [] },
      { y: Math.round(lastRow.cy + L / 2), adj: [lastRow.cy] }, { y: Math.round(lastRow.cy + L), adj: [] });
    built = true;
    words.forEach(function (w) { w.clip = null; });
  }

  /* ------------------------------------------------------------------ the scroll, as a pure function of q */
  var tmp = [0, 0];
  function actTau(bl, qq) {
    var act = bl.kind === 'coral' ? coral.act : bl.row, a2 = clamp((qq - act.a0) / (act.a1 - act.a0), 0, 1);
    var tau = inOut2(a2) * act.T - .18 * p * Math.sin(Math.PI * clamp(a2 / .14, 0, 1));
    bl.tau = a2 >= 1 ? act.T : tau;
  }
  function choreo(bl, qq) {
    if (bl.kind === 'rep') {
      var r = bl.rrow, a = clamp((qq - r.a0) / (r.a1 - r.a0), 0, 1);
      var ant = -.3 * p * Math.sin(Math.PI * clamp(a / .2, 0, 1));
      bl.cx = bl.hx + in2(a) * r.dx + (a < .2 ? ant : 0); bl.cy = bl.hy;
      return;
    }
    var tau = bl.tau;
    pathAt(bl.path, Math.min(tau, bl.L), tmp);
    var oy = 0, bar = bl.bar, k;
    // pushed by every block that entered the bar after this one; each push opens just ahead of the arrival
    for (k = 0; k < bl.pushes.length; k++) {
      var ps = bl.pushes[k], pb = bar.blocks[ps[0]], u = (pb.tau - (pb.L - p)) / p;
      if (u <= 0) continue;
      oy += ps[1] * p * (u >= .55 ? 1 : backOut(u / .55, .9));
    }
    var last = bar.blocks[bar.n - 1];
    if (bar.settle) { var us = (last.tau - last.L) / (p * .8); if (us > 0) oy += bar.settle * p * (us >= 1 ? 1 : backOut(us, 1.4)); }
    bl.cx = tmp[0]; bl.cy = tmp[1] + oy;
    // the Signal: as the full stop enters its bar, the colour runs through the bar from the centre out
    if (bar.sig && bl.kind === 'ink') {
      var cf = bar.blocks[bar.coralFrom], cu = (cf.tau - (cf.L - p)) / (p * 1.6);
      var on = cu > .12 + .88 * Math.abs(bl.slot) / bar.maxSlot;
      if (on !== bl.isC) { bl.el.classList.toggle('c', on); bl.isC = on; }
    }
    // in a bar it stands in front; on its way it passes behind the bars already standing; the waiting full stop
    // lies under the last cable
    var z = tau >= bl.L - p * .5 ? 2 : bl.kind === 'coral' && tau <= 0 ? 0 : 1;
    if (z !== bl.z) { bl.el.style.zIndex = z; bl.z = z; }
  }

  function progress() {
    var r = H.getBoundingClientRect(), span = H.offsetHeight - innerHeight;
    return span > 0 ? clamp(-r.top / span, 0, 1) : 1;
  }

  /* ------------------------------------------------------------------ the words show where no block lies over them */
  function clipWords() {
    for (var k = 0; k < words.length; k++) {
      var w = words[k], ww = w.x1 - w.x0, cov = [], tiny = em * .12;
      for (var i = 0; i < solid.length; i++) {
        var bl = solid[i];
        if (Math.abs(bl.y - w.cy) > s * .8) continue;
        // a word's own blocks hide a little either side (a dash on the block pitch never leaves a sliver of letter)
        var hw = bl.w * bl.sx * .5 + (bl.word === w ? p * .5 : 1), a = bl.x - hw - w.x0, c = bl.x + hw - w.x0;
        if (c < 0 || a > ww) continue;
        cov.push([a, c]);
      }
      cov.sort(function (u, v) { return u[0] - v[0]; });
      var vis = [], at = 0;
      for (i = 0; i < cov.length; i++) {
        if (cov[i][0] - at >= tiny) vis.push([at, Math.min(cov[i][0], ww)]);
        at = Math.max(at, cov[i][1]);
        if (at >= ww) break;
      }
      if (ww - at >= tiny) vis.push([Math.max(at, 0), ww]);
      vis = vis.filter(function (u) { return u[1] - u[0] >= tiny; });
      var c2;
      if (!vis.length) c2 = 'polygon(0 0,0 0,0 0)';
      else if (vis.length === 1 && vis[0][0] <= 0 && vis[0][1] >= ww) c2 = 'none';
      else c2 = 'polygon(' + vis.map(function (u) {
        var A = (clamp(u[0] / ww, 0, 1) * 100).toFixed(2) + '%', B = (clamp(u[1] / ww, 0, 1) * 100).toFixed(2) + '%';
        return A + ' -40%,' + A + ' 140%,' + B + ' 140%,' + B + ' -40%';
      }).join(',') + ')';
      if (c2 !== w.clip) { w.tx.style.clipPath = c2; w.clip = c2; }
    }
  }

  /* ------------------------------------------------------------------ the scatter: targets for the hand */
  function scatterTargets(now, amp) {
    var spdF = Math.tanh(pspd / 900), rl0 = R * (.7 + .45 * spdF), cand = [], taken = [], i, bl;
    for (i = 0; i < all.length; i++) {
      bl = all[i];
      var dx = bl.hx - px, dy = bl.hy - py, d = Math.sqrt(dx * dx + dy * dy) || 1;
      bl.d = d;
      var rl = rl0 * (.92 + .16 * bl.hr);
      if (inside && amp > .02 && d < rl) {
        if (!bl.alarm) {
          bl.alarm = now + d / 1400 * 1000 + bl.jit;               // a ripple of alarm, outwards from the hand
          bl.side = (pvx * dy - pvy * dx) >= 0 ? 1 : -1;            // which side of the hand's path it is on
        }
        bl.rl = rl; cand.push(bl);
      } else if (now > bl.hold) {
        bl.tx = 0; bl.ty = 0; bl.spring = HOME; bl.dart = 0; bl.fl = 0;
        if (Math.abs(bl.ox) + Math.abs(bl.oy) < .6) bl.alarm = 0;
      }
    }
    // everything that is not choosing a landing now is in the way where it is headed
    for (i = 0; i < all.length; i++) {
      bl = all[i];
      if (cand.indexOf(bl) > -1 && now >= bl.alarm + 70) continue;
      taken.push([bl.hx + bl.tx, bl.hy + bl.ty, bl.w, bl.h]);
    }
    cand.sort(function (a, c) { return a.d - c.d; });
    for (i = 0; i < cand.length; i++) {
      bl = cand[i];
      var nx = (bl.hx - px) / bl.d, ny = (bl.hy - py) / bl.d;
      if (now < bl.alarm) { if (!bl.dart) { bl.tx = 0; bl.ty = 0; } continue; }
      if (now < bl.alarm + 70 && !bl.dart) {            // anticipation: a flinch towards the hand, a crouch
        bl.tx = -nx * .14 * s; bl.ty = -ny * .14 * s; bl.fl = 1; bl.spring = DART; bl.hold = now + 320;
        continue;
      }
      if (!bl.dart) bl.dart = now;
      bl.fl = 0;
      // the landing: out to the rim of the clearing, onto a track: a lane between two lines (only where both lines
      // are still covered, so a perched block never sits on a letter), or a free row above or below the statement; on
      // a grid one and a quarter blocks wide, so the scattered state reads as a pattern of single blocks
      var Dx = px + nx * bl.rl, Dy = py + ny * bl.rl, sx0 = nx >= 0 ? 1 : -1, ok = false, lx = 0, ly = 0;
      var lv = bl.kind === 'rep' ? [{ y: bl.hy, adj: [] }] : levels.slice().sort(function (u, v) {
        return Math.abs(u.y - Dy) - Math.abs(v.y - Dy) + (Math.sign(u.y - bl.hy) === Math.sign(ny) ? 0 : L * .6) - (Math.sign(v.y - bl.hy) === Math.sign(ny) ? 0 : L * .6);
      });
      for (var li = 0; li < lv.length && li < 4 && !ok; li++) {
        var lev = lv[li], gx = Math.round(Dx / PL) * PL;
        for (var tries = 0; tries < 7 && !ok; tries++) {
          lx = gx + sx0 * tries * PL; ly = lev.y;
          if (lx < bl.w / 2 + 2 || lx > W - bl.w / 2 - 2 || ly < bl.h / 2 + 2 || ly > SH - bl.h / 2 - 2) continue;
          var bad = false, t;
          for (t = 0; !bad && t < lev.adj.length; t++) {
            var ay = lev.adj[t], ddx = Math.max(0, Math.abs(lx - px) - bl.w * .5 - p * .5), ddy = ay - py;
            if (ddx * ddx + ddy * ddy < bl.rl * bl.rl * .9) bad = true;
          }
          for (t = 0; !bad && t < taken.length; t++) {
            var tk = taken[t];
            if (Math.abs(tk[0] - lx) < (tk[2] + bl.w) * .5 + 3 && Math.abs(tk[1] - ly) < (tk[3] + bl.h) * .5 + 3) bad = true;
          }
          if (!bad) ok = true;
        }
      }
      if (!ok) { lx = bl.hx + bl.tx; ly = bl.hy + bl.ty; }
      taken.push([lx, ly, bl.w, bl.h]);
      var X = lx - bl.hx, Y = ly - bl.hy;
      // the curl: for its first beat the target sits off to one side of the hand's path, so the flight is an arc
      var age = now - bl.dart, curl = .35 * Math.sqrt(X * X + Y * Y) * Math.max(0, 1 - age / 150);
      bl.tx = X + (-ny) * bl.side * curl; bl.ty = Y + nx * bl.side * curl;
      bl.spring = DART; bl.hold = now + 320;
    }
    if (amp < 1) for (i = 0; i < all.length; i++) { all[i].tx *= amp; all[i].ty *= amp; }
  }

  /* ------------------------------------------------------------------ the frame */
  function frame(now) {
    if (!built) { running = false; return; }
    var dt = tPrev ? clamp((now - tPrev) / 1000, .001, .05) : 1 / 60; tPrev = now;
    qT = progress();
    var wasFirst = first;
    if (first || STILL) { q = qT; first = false; }
    else { q += (qT - q) * (1 - Math.exp(-dt / .17)); if (Math.abs(qT - q) < 2e-4) q = qT; }
    var moving = q !== qT;
    var amp = 1 - between(.01, .06, q), endW = between(Q_END + .01, Q_END + .06, q);
    // pointer speed decays when the hand rests
    var fd = Math.exp(-dt / .12); pvx *= fd; pvy *= fd; pspd *= fd;
    if (now - lastMove < 140) moving = true;

    var i, bl;
    for (i = 0; i < solid.length; i++) actTau(solid[i], q);
    for (i = 0; i < all.length; i++) choreo(all[i], q);
    if (!STILL) scatterTargets(now, amp);

    // the voice level at the end: bars near the hand rise a little, on an under-damped spring
    for (i = 0; i < bars.length; i++) {
      var br = bars[i], tgt = 0;
      if (inside && endW > 0 && !STILL) {
        var dxb = Math.abs(px - br.x) / (s * 3.6), vy = clamp(1.4 - Math.abs(py - br.cy) / (p * 9), 0, 1);
        tgt = sstep(1 - dxb) * vy * endW;
      }
      var sub = Math.ceil(dt / (1 / 120)), h = dt / sub;
      for (var k = 0; k < sub; k++) { br.lvv += (-HOVER.k * (br.lv - tgt) - HOVER.c * br.lvv) * h; br.lv += br.lvv * h; }
      if (Math.abs(br.lv - tgt) > .001 || Math.abs(br.lvv) > .01) moving = true; else br.lv = tgt;
    }

    var sub2 = Math.max(1, Math.ceil(dt / (1 / 120))), h2 = dt / sub2;
    for (i = 0; i < all.length; i++) {
      bl = all[i];
      var sp = bl.spring || HOME;
      if (!STILL) {
        for (var k2 = 0; k2 < sub2; k2++) {
          bl.vx += (-sp.k * (bl.ox - bl.tx) - sp.c * bl.vx) * h2; bl.vy += (-sp.k * (bl.oy - bl.ty) - sp.c * bl.vy) * h2;
          bl.ox += bl.vx * h2; bl.oy += bl.vy * h2;
        }
        if (Math.abs(bl.vx) + Math.abs(bl.vy) > .5 || Math.abs(bl.ox - bl.tx) + Math.abs(bl.oy - bl.ty) > .1) moving = true;
        else { bl.ox = bl.tx; bl.oy = bl.ty; bl.vx = bl.vy = 0; }
      }
      var hov = 0;
      if (bl.bar && bl.bar.lv) hov = bl.slot * bl.bar.lv * s * .2;
      var X = bl.cx + bl.ox, Y = bl.cy + bl.oy + hov;
      // squash and stretch from the real velocity, locked to the axis of travel; a squash on a hard stop
      var vx = (X - bl.x) / dt, vy2 = (Y - bl.y) / dt;
      if (wasFirst || STILL) { vx = 0; vy2 = 0; }
      var fv = 1 - Math.exp(-dt / .035);
      bl.vxs += (vx - bl.vxs) * fv; bl.vys += (vy2 - bl.vys) * fv;
      var v = Math.sqrt(bl.vxs * bl.vxs + bl.vys * bl.vys), st = 1 + Math.min(v / 1800, .42), sx = 1, sy = 1;
      if (v > 1) { var ax = bl.vxs * bl.vxs / (v * v), ay = 1 - ax; sx = Math.pow(st, ax - ay); sy = Math.pow(st, ay - ax); }
      var dec = (bl.sp0 - v) / dt; bl.sp0 = v;
      if (dec > 5000 && bl.sp0 < 260) { bl.sq = Math.max(bl.sq, Math.min(.16, dec / 50000)); bl.sqx = Math.abs(bl.vxs) >= Math.abs(bl.vys) ? 1 : 0; }
      bl.sq *= Math.exp(-dt / .07); if (bl.sq < .004) bl.sq = 0;
      if (bl.sq) { if (bl.sqx) { sx *= 1 - bl.sq; sy *= 1 + bl.sq; } else { sy *= 1 - bl.sq; sx *= 1 + bl.sq; } moving = true; }
      if (bl.fl) { var fx = Math.abs(bl.hx - px) > Math.abs(bl.hy - py); if (fx) sx *= .88; else sy *= .88; }
      if (v > 2) moving = true;
      bl.x = X; bl.y = Y; bl.sx = sx; bl.sy = sy;
      var rx = v < 2 && !bl.sq ? Math.round(X - bl.w / 2) : (X - bl.w / 2).toFixed(2);
      var ry = v < 2 && !bl.sq ? Math.round(Y - bl.h / 2) : (Y - bl.h / 2).toFixed(2);
      var tf = 'translate(' + rx + 'px,' + ry + 'px)' + (Math.abs(sx - 1) > .002 || Math.abs(sy - 1) > .002 ? ' scale(' + sx.toFixed(3) + ',' + sy.toFixed(3) + ')' : '');
      if (tf !== bl.tf) { bl.el.style.transform = tf; bl.tf = tf; }
    }
    clipWords();
    if (moving && !STILL) requestAnimationFrame(frame); else { running = false; tPrev = 0; }
  }
  function kick() { if (!running && built) { running = true; requestAnimationFrame(frame); } }

  /* ------------------------------------------------------------------ input */
  function point(cx, cy2) {
    var b = hb.getBoundingClientRect(), now = performance.now(), nx = cx - b.left, ny = cy2 - b.top;
    if (lastPX !== null && now - lastPT < 150) {
      var dt = Math.max(8, now - lastPT) / 1000, vx = (nx - lastPX) / dt, vy = (ny - lastPY) / dt;
      pvx = pvx * .5 + vx * .5; pvy = pvy * .5 + vy * .5; pspd = Math.max(pspd * .6, Math.sqrt(pvx * pvx + pvy * pvy));
    }
    lastPX = nx; lastPY = ny; lastPT = now; lastMove = now; px = nx; py = ny;
    inside = nx >= 0 && nx <= b.width && ny >= 0 && ny <= b.height;
    kick();
  }
  function away() { inside = false; lastPX = null; kick(); }

  var rt, w0 = innerWidth;
  function start() {
    measure(); H.classList.add('live', 'sw-on');
    if (STILL) { q = qT = 1; first = true; frame(performance.now()); return; }
    stage.addEventListener('pointermove', function (e) { if (e.pointerType !== 'touch') point(e.clientX, e.clientY); });
    stage.addEventListener('pointerleave', function (e) { if (e.pointerType !== 'touch') away(); });
    stage.addEventListener('touchstart', function (e) { lastPX = null; var t = e.touches[0]; if (t) point(t.clientX, t.clientY); }, { passive: true });
    stage.addEventListener('touchmove', function (e) { var t = e.touches[0]; if (t) point(t.clientX, t.clientY); }, { passive: true });
    stage.addEventListener('touchend', away, { passive: true });
    stage.addEventListener('touchcancel', away, { passive: true });
    addEventListener('scroll', kick, { passive: true });
    kick();
  }
  addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(function () {
      if (innerWidth === w0 && matchMedia('(pointer: coarse)').matches) return;
      w0 = innerWidth; measure(); first = true;
      if (STILL) { frame(performance.now()); return; }
      kick();
    }, 140);
  });
  window.__rh = { kick: function () { kick(); }, get settled() { return !running && Math.abs(q - progress()) < 1e-4; },
    get q() { return q; }, get qT() { return qT; }, get running() { return running; },
    get info() { return { mode: mode, s: s, p: p, em: em, rows: rows.length, bars: bars.map(function (b) { return b.n; }), blocks: solid.length, reps: reps.length }; } };
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(start); else start();
})();
