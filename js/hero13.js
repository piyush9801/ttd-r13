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
   ?m=6 field  the whole screen is bars; the hand sets the whole field moving; scroll breaks it apart
   ?m=7 reveal the moment the hand enters, every line slides aside (a ripple out from the hand) and the whole
               statement is said before any scroll; the lines come back when the hand leaves
   ?m=8 black  (option 7, Lisa 21 Oct) the whole screen is black: a wall of charcoal lines under a charcoal nav,
               one Signal square where the full stop is. The hand startles the lines into blocks that scatter like
               bugs, glide to a stop, wait, then creep home; a click breaks the wall apart from that point. The
               scroll parts the wall from the centre, then the lines return as the sound bars */
(function () {
  var H = document.querySelector('.hero4.h13'); if (!H) return;
  var root = document.documentElement, q0 = location.search.match(/[?&]m=(\d)/);
  var MODE = q0 ? +q0[1] : 1; if (MODE < 1 || MODE > 8 || MODE === 4) MODE = 1;
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

  var REVEAL_MOVING = false, CB = null, K = .6, OX = 0, OY = 0, W = 1, SH = 1, em = 16, M = 20, R = 100, bodies = [], words = [], built = false;
  var q = 0, px = -1e4, py = -1e4, pvx = 0, pvy = 0, inside = false, lastT = 0, running = false, tPrev = 0, clock = 0;
  var SPR = { w: 6.6, z: .42 }, SPA = { w: 7.4, z: .4 }, FR = 1.2;
  var GL = 4.2, GA = 4.6, CR = { w: 4.2, z: 1 }, CA = { w: 4.6, z: 1 };   // black: glide friction, then a slow creep home
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
      body.w = { tx: tx, x0: t.left - b.left, y0: t.top - b.top, ww: t.width || 1, clip: null, pad: Math.max(0, t.height / 2 - h / 2 + em * .06) };
      bodies.push(body); words.push(body);
      var r = null; for (var j = 0; j < rows.length; j++) if (Math.abs(rows[j].y - body.hy) < h) { r = rows[j]; break; }
      if (!r) { r = { y: body.hy, x1: 0, ls: [] }; rows.push(r); }
      r.ls.push(body); r.x1 = Math.max(r.x1, d.right - b.left);
    });
    rows.sort(function (a, c) { return a.y - c.y; });
    rows.forEach(function (r, i) { r.ls.forEach(function (l) { l.row = i; }); });
    // the replies: Draft dashes after each line of the statement and on a row above and below, to the margins
    var pitch = rows.length > 1 ? rows[1].y - rows[0].y : em * 1.2, n = 0;
    var top = rows[0].y, bot = rows[rows.length - 1].y, gap = pitch * .56, replyRows = [];
    for (var u = 1; top - gap * u > em * .35; u++) replyRows.push({ y: top - gap * u + pitch * .1, x0: M + em * (u % 2 ? 1.4 : .2) + hash(u, 2) * em, row: -u });
    rows.forEach(function (r, i) { replyRows.push({ y: r.y, x0: r.x1 + em * .55, row: i, after: true }); });
    for (var v = 1; bot + gap * v < SH - em * .25; v++) replyRows.push({ y: bot + gap * v - pitch * .1, x0: M + em * (v % 2 ? 2.6 : .9) + hash(v, 8) * em, row: rows.length + v });
    if (MODE === 6 || MODE === 8) replyRows = [];
    replyRows.forEach(function (rr, ri) {
      var x = rr.x0, hh = rr.after ? h * .78 : h * .46;
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
    var textR = Math.max.apply(null, rows.map(function (r) { return r.x1; }));
    for (var it = 0; it < 40; it++) { var tE = OX + (textR - OX) * K, room = W - M - tE - em * K * 1.1; if (ink.length * h * K * 1.5 <= room) break; K *= .96; }
    var hE = h * K, pitch2 = hE * 1.5, n2 = ink.length, x0 = W - M - hE / 2 - (n2 - 1) * pitch2;
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
    if (MODE === 8) {          // the whole screen is one black wall of lines, edge to edge. No gaps: each block carries its
      // own dark groove (top edge, and the right edge where a line ends), so at rest it is solid black, nothing shows through
      var pd = sig, rg = Math.max(3, em * .035), rows8 = Math.max(6, Math.round(SH / (em * .38))), p8 = SH / rows8, nb = 0;
      layer.style.setProperty('--sg', rg.toFixed(1) + 'px');
      var block = function (x, L, y, cl, join) {
        var i = document.createElement('i'); i.className = cl + ' f' + (join ? '' : ' e'); i.style.width = (L + 1) + 'px'; i.style.height = (p8 + 1) + 'px'; layer.appendChild(i);
        var fb = mk(i, L, p8, x + L / 2, y, 'field', 500 + nb); fb.blk = true; fb.fr = 0; fb.row = 2000 + nb;
        fb.side = fb.hx < W / 2 ? -1 : 1; fb.jit = (hash(nb, 44) - .5) * 1.1;
        fb.a0 = .015 + Math.abs(fb.hx - W / 2) / W * .12 + hash(nb, 45) * .05; fb.a1 = fb.a0 + .2;   // the wall parts from the centre
        bodies.push(fb); nb++;
      };
      var fill = function (xa, xb, y) {                // long lines of two to seven blocks, joined without a seam
        var x = xa;
        while (x < xb - em * .12) {
          var nk = 2 + Math.floor(hash(nb, 46) * 6);
          for (var c = 0; c < nk && x < xb - em * .12; c++) {
            var L = em * (.7 + hash(nb, 47) * .8); if (x + L > xb - em * .3) L = xb - x;
            block(x, L, y, 'k', c < nk - 1 && x + L < xb - 1); x += L;
          }
        }
      };
      for (var r8 = 0; r8 < rows8; r8++) {
        var yc = r8 * p8 + p8 / 2, xs = -hash(r8, 48) * em * .9;
        if (pd && Math.abs(pd.hy - yc) <= p8 / 2) {     // the full stop's row: one Signal square stands over the full stop
          var cs = p8 - rg, cx0 = pd.hx - cs / 2;
          fill(xs, cx0, yc); block(cx0, cs + rg, yc, 'c', false); fill(cx0 + cs + rg, W + em, yc);
        } else fill(xs, W + em, yc);
      }
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
    // (black: the statement's lines wait off the right edge from the start; the wall covers the words instead)
    var ua = MODE === 8 ? 1 : Math.max(sm((Q - l.a0) / (l.a1 - l.a0)), MODE === 7 ? sm(l.rv || 0) : 0), ub = sm((Q - l.b0) / (l.b1 - l.b0));
    // A: slide along the row to the column it will stand in. B: tip up into the bar, leaning, at the final size
    var off = W + l.L * .6 + 30;                               // A: the line leaves its word and the frame, to the right
    var x = l.hx + (off - l.hx) * ua + (l.sx - off) * ub, y = l.hy + (l.sy - l.hy) * ub, k = 1 + (K - 1) * ub;
    return [x - l.hx, y - l.hy, l.sa * ub, k];
  }
  function textScale(Q) { return 1 + (K - 1) * sm((Q - .36) / .26); }

  function step(dt) {
    if (MODE === 7) for (var ri = 0; ri < bodies.length; ri++) {
      var rb = bodies[ri], tgt = inside ? 1 : 0, dd = Math.hypot(px - rb.hx, py - rb.hy) / W;
      var rate = inside ? 2.6 / (1 + dd * 5) : 1.8 / (1 + (1 - dd) * 2);      // in: nearest first; out: farthest first
      rb.rv = (rb.rv || 0) + (tgt - (rb.rv || 0)) * Math.min(1, rate * dt);
      if (Math.abs(tgt - rb.rv) > .002) REVEAL_MOVING = true;
    }
    var moving = false, spd = Math.sqrt(pvx * pvx + pvy * pvy), i, j, l;
    var kL = SPR.w * SPR.w, cL = 2 * SPR.z * SPR.w, kA = SPA.w * SPA.w, cA = 2 * SPA.z * SPA.w;
    var cxs = W / 2, cys = SH * .45;
    for (i = 0; i < bodies.length; i++) {
      l = bodies[i];
      var T = exitPose(l, q), tx = l.hx + T[0], ty = l.hy + T[1], ta = T[2]; l.k = T[3];
      var away = q > l.a0 + .01;              // once a line is leaving, the hand lets it go
      // mode targets from the hand (pose offsets, not forces)
      if (inside && !away) {
        if (MODE === 2) {
          var dz = l.kind === 'rep' ? l.d * .5 : (l.d - 1) * 2.2 + (hash(l.k, 31) - .5) * 1.4;   // each line its own depth
          tx += -(px - cxs) * .16 * dz; ty += -(py - cys) * .1 * dz;
          var ddx = l.hx - px, ddy = l.hy - py, dd2 = Math.hypot(ddx, ddy * 1.6), gz = Math.max(0, 1 - dd2 / (R * 2.2));
          ty += (ddy >= 0 ? 1 : -1) * gz * gz * em * .55;          // and the nearest lines give way above or below
        }
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
      var sx, sy, sa;
      if (l.blk && l.fr > clock && q < .01) { sx = -GL * l.vx; sy = -GL * l.vy; sa = -GA * l.va; }        // startled: glide to a stop and wait
      else if (l.blk && q < .01) {                                                            // then creep home, no overshoot
        sx = CR.w * CR.w * (tx - l.x) - 2 * CR.z * CR.w * l.vx; sy = CR.w * CR.w * (ty - l.y) - 2 * CR.z * CR.w * l.vy;
        sa = CA.w * CA.w * (ta - l.a) - 2 * CA.z * CA.w * l.va;
      } else { sx = kL * (tx - l.x) - (cL + FR) * l.vx; sy = kL * (ty - l.y) - (cL + FR) * l.vy; sa = kA * (ta - l.a) - cA * l.va; }
      var Fx = 0, Fy = 0, tq = 0;
      // forces from the hand: m1 pushes at the nearest point (slide and turn); m4 pushes along the row only
      if (inside && !away && (MODE === 1 || MODE === 6 || l.blk)) {
        var ux = Math.cos(l.a), uy = Math.sin(l.a), dx = px - l.x, dy = py - l.y;
        var t = clamp(dx * ux + dy * uy, -l.L / 2, l.L / 2), cx = l.x + ux * t, cy = l.y + uy * t;
        var ex = cx - px, ey = cy - py, dc = Math.sqrt(ex * ex + ey * ey) || 1, d = dc - l.h / 2;
        if (d < R) {
          var g = 1 - Math.max(d, 0) / R, push = (16000 * g * g + 260 * spd * g) * em / 80 * (l.kind === 'rep' ? .6 : 1) * (MODE === 6 ? 1.3 : 1);
          if (l.blk) {                       // each block darts off a little sideways of straight away, then waits
            var cj = Math.cos(l.jit), sj = Math.sin(l.jit), ex2 = ex * cj - ey * sj; ey = ex * sj + ey * cj; ex = ex2;
            if (g > .12) {
              if (l.fr <= clock) {             // the startle: a quick hand scares it further than a slow one
                var kick0 = Math.min(900, (420 + 18 * spd) * g) * em / 126 / Math.sqrt(l.m);
                l.vx += ex / dc * kick0; l.vy += ey / dc * kick0;
              }
              l.fr = Math.max(l.fr, clock + .65 + hash(l.k, 41) * .9);
            }
          }
          if (l.blk) push *= .22;              // after the startle only a faint push: they dart once, they are not ploughed
          Fx = ex / dc * push; Fy = ey / dc * push; tq = (cx - l.x) * Fy - (cy - l.y) * Fx;
          if (l.blk) tq *= .35;                // blocks turn a little as they go, never spin
        }
      }
      l.vx += (sx + Fx / l.m) * dt; l.vy += (sy + Fy / l.m) * dt; l.va += (sa + tq / l.I) * dt;
    }
    // lines on one row shove each other instead of passing through (m1, m4)
    if ((MODE === 1 || MODE === 6) && q < .02) for (i = 0; i < bodies.length; i++) for (j = i + 1; j < bodies.length; j++) {
      var A = bodies[i], B = bodies[j];
      if (Math.abs(A.a) > .45 || Math.abs(B.a) > .45) continue;
      var ox = (A.L + B.L) / 2 + 2 - Math.abs(A.x - B.x), oy = (A.h + B.h) / 2 + 2 - Math.abs(A.y - B.y);
      if (ox <= 0 || oy <= 0) continue;
      var kk2 = 1800 * dt;
      if (ox < oy * 2.2) { var sg = A.x < B.x ? -1 : 1; A.vx += sg * kk2 * ox / A.m; B.vx -= sg * kk2 * ox / B.m; }
      else { var sv = A.y < B.y ? -1 : 1; A.vy += sv * kk2 * oy / A.m; B.vy -= sv * kk2 * oy / B.m; A.va += (B.x - A.x) * sv * .0004; B.va -= (A.x - B.x) * sv * .0004; }
    }
    for (i = 0; i < bodies.length; i++) {
      l = bodies[i]; l.x += l.vx * dt; l.y += l.vy * dt; l.a += l.va * dt;
      if (l.blk && q < .01 && l.fr <= clock) {   // home again: land exactly, so not a hairline of tan shows in the wall
        var Th = exitPose(l, q), hx = l.hx + Th[0], hy = l.hy + Th[1];
        if (Math.abs(hx - l.x) < .7 && Math.abs(hy - l.y) < .7 && Math.abs(Th[2] - l.a) < .003 && Math.abs(l.vx) + Math.abs(l.vy) < 30) { l.x = hx; l.y = hy; l.a = Th[2]; l.vx = l.vy = l.va = 0; }
      }
      if (q < .02 && MODE !== 8) { var lo = l.L / 2 * .3; if (l.x < lo) { l.x = lo; l.vx = Math.abs(l.vx) * .45; } if (l.x > W - lo) { l.x = W - lo; l.vx = -Math.abs(l.vx) * .45; }
        // a clear break under the logo: a line never reaches the top edge of the stage, however it is turned
        var top = Math.abs(Math.sin(l.a)) * l.L / 2 + Math.abs(Math.cos(l.a)) * l.h / 2 + em * .3;
        if (l.y < top) { l.y = top; l.vy = Math.abs(l.vy) * .45; } if (l.y > SH) { l.y = SH; l.vy = -Math.abs(l.vy) * .45; } }
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
    if (MODE === 8) {                    // the nav goes back to tan as the wall parts (fades only after the first paint)
      var dk = q < .1; if (dk !== H.dk) { H.dk = dk; H.classList.toggle('dk', dk); }
      if (!H.dkr) { H.dkr = true; setTimeout(function () { H.classList.add('dkr'); }, 120); }
    }
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
  // a word is hidden exactly under its own line (its real, tilted rectangle), stretched over the full height of the
  // letters while the line is still near home, and shrinking to the line itself as it moves away
  function clipWord(l) {
    var w = l.w, ua = sm((q - l.a0) / (l.a1 - l.a0));
    var drift = Math.sin(Math.PI * Math.min(1, ua * 1.15)) * em * .09 * (1 - ua * .4);
    var dtf = drift > .1 ? 'translateX(' + drift.toFixed(2) + 'px)' : '';
    if (dtf !== w.tf) { w.tx.style.transform = dtf; w.tf = dtf; }
    if (MODE === 8 || q > .3 || (MODE === 7 && (l.rv || 0) > .97)) { if (w.clip !== 'none') { w.tx.style.clipPath = 'none'; w.clip = 'none'; } return; }
    var off = Math.hypot(l.x - l.hx, l.y - l.hy) + Math.abs(l.a) * l.L * .5, near = Math.max(0, 1 - off / (em * .9));
    var hh = l.h / 2 + w.pad * near, c = Math.cos(l.a), s = Math.sin(l.a), hw = l.L / 2 + 1;
    var pts = [[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]].map(function (p) {
      var X = l.x + p[0] * c - p[1] * s - w.x0, Y = l.y + p[0] * s + p[1] * c - w.y0;
      return X.toFixed(1) + 'px ' + Y.toFixed(1) + 'px';
    });
    var css = 'polygon(evenodd,-9999px -9999px,9999px -9999px,9999px 9999px,-9999px 9999px,-9999px -9999px,' + pts.join(',') + ',' + pts[0] + ')';
    if (css !== w.clip) { w.tx.style.clipPath = css; w.clip = css; }
  }
  function progress() { var r = H.getBoundingClientRect(), span = H.offsetHeight - innerHeight; return span > 0 ? clamp(-r.top / span, 0, 1) : 0; }
  function tick(now) {
    var dtAll = tPrev ? Math.min((now - tPrev) / 1000, 1 / 20) : 1 / 60; tPrev = now;
    q = progress(); pvx *= Math.pow(.02, dtAll); pvy *= Math.pow(.02, dtAll);
    var n = Math.max(1, Math.ceil(dtAll / (1 / 240))), dt = dtAll / n, moving = false; clock += dtAll;
    REVEAL_MOVING = false;
    for (var i = 0; i < n; i++) moving = step(dt) || moving;
    if (REVEAL_MOVING) moving = true;
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
  // black: a click (or a tap) splits the wall open from that point. Every line slides along its own row, away from the
  // click, the rows nearest it furthest, so the statement opens like an eye; a few seconds later the lines slide back
  stage.addEventListener('pointerdown', function (e) {
    if (MODE !== 8 || !built || q > .02) return;
    var b = hb.getBoundingClientRect(), cx = e.clientX - b.left, cy = e.clientY - b.top;
    for (var i = 0; i < bodies.length; i++) {
      var l = bodies[i]; if (!l.blk) continue;
      var dx = l.hx - cx, dy = l.hy - cy, f = Math.exp(-Math.abs(dy) / (SH * .34)) * (.35 + .65 * Math.exp(-Math.abs(dx) / (W * .45)));
      var v = 2600 * f * (.85 + hash(l.k, 49) * .3) * em / 126;
      l.vx += (dx < 0 ? -1 : 1) * v; l.va += (hash(l.k, 50) - .5) * .25 * f;
      l.fr = clock + 2.2 + Math.abs(dy) / SH * .8 + hash(l.k, 51) * .3;
    }
    kick();
  });
  addEventListener('scroll', kick, { passive: true });

  function settle(Q) { q = Q; bodies.forEach(function (l) { var T = exitPose(l, Q); l.x = l.hx + T[0]; l.y = l.hy + T[1]; l.a = T[2]; l.k = T[3]; }); render(); }
  var rt;
  function setup() {
    // black holds at narrower, taller windows too (a wall needs no room beside the words); phones keep the plain statement
    var narrow = MODE === 8 ? innerWidth < 600 : innerWidth < 900 || innerWidth / innerHeight < 1.1;
    H.classList.toggle('ln-off', narrow);
    if (MODE === 8) {                    // black: the light logo sits over the dark one and takes over while the wall is up
      var lg = H.querySelector('.nav .logo'), im = lg && lg.querySelector('img');
      if (im && !lg.querySelector('.lt')) { var lt = im.cloneNode(); lt.src = im.getAttribute('src').replace('dark', 'light'); lt.className = 'lt'; lt.alt = ''; lg.appendChild(lt); }
      if (narrow) { H.dk = false; H.classList.remove('dk'); }
    }
    if (narrow) { layer.textContent = ''; bodies = []; built = false; return; }
    measure(); H.classList.add('ln-on');
    if (STILL) { settle(1); return; }
    settle(progress()); kick();
  }
  addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(setup, 150); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(setup); else setup();
})();
