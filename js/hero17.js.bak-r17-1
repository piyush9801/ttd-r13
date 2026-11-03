/* The Talent Dept. · round 17 hero (3 Nov 2026). Lisa's 3 Nov notes: restraint, balance, precision. One narrative,
   Conceal, Reveal, Resolve, with less movement; a smaller statement; fewer, smaller bars; the coral at the centre;
   no flat-line stage and nothing tied to the scroll.
   Conceal: the statement sits under one solid Ink line per word, the full stop under the one Signal square; the
   replies in Draft carry each row on to the margin and fill the pauses between the rows.
   The hand: a line hangs on a hinge at its left end and lifts a few degrees toward the hand; the word shows under it
   (a line only ever hides what it covers).
   Reveal (on its own after a short hold, at once on a scroll, tap or key): the replies fold back into their hinges and
   each line draws back off its word toward the word's end, in reading order, so the sentence is written out. Nothing
   crosses the screen, nothing turns, no line passes over another.
   Resolve: as the last word is said the rhythm rises beside the statement on its centre line: seven upright bars, the
   coral at the centre first, then outward in pairs. Then it stays, breathing slightly; the bars answer the hand.
   The scroll is just the scroll: the hero is one screen and the page moves on.
   Phones and portrait screens: the same, the rhythm under the statement. Reduced motion and ?still: the final
   composition. Review: ?tau=1.4 holds a moment, &lift=1,.06 lifts line 1, ?figma lays the shapes out as elements. */
(function () {
  var H = document.querySelector('.hero4.h17'); if (!H) return;
  var root = document.documentElement;
  var reduce = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  var STILL = root.classList.contains('still') || reduce;
  var stage = H.querySelector('.stage'), hb = H.querySelector('.hb'), hl = H.querySelector('.hl');
  var wds = [].slice.call(hl.querySelectorAll('.wd'));
  var cv = document.createElement('canvas'); cv.className = 'ln16'; cv.setAttribute('aria-hidden', 'true'); hb.appendChild(cv);
  var ctx = cv.getContext('2d');
  var INK = '#171614', SIG = '#D65A4A', DRAFT = '#C7B394';
  var WID = [18, 44, 48, 92, 104, 111, 127, 144, 183];          // the brand's dash lengths
  var qs = new URLSearchParams(location.search);
  // the rhythm: seven bars, symmetric about the Signal at the centre, a deliberate rise and fall
  var PROF = qs.get('prof') ? qs.get('prof').split(',').map(Number) : [.42, .66, .86, 1, .86, .66, .42];
  var NB = PROF.length, CK = (NB - 1) / 2;
  var HOLD = qs.has('hold') ? parseFloat(qs.get('hold')) : 1.3;   // seconds the lines hold before the reveal
  var TAU = qs.has('tau') ? parseFloat(qs.get('tau')) : null, FIG = qs.has('figma'), figBox = null;

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function ss(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }
  function eio(t) { t = clamp(t, 0, 1); return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function eout(t) { t = clamp(t, 0, 1); return 1 - Math.pow(1 - t, 3); }
  function hash(i, s) { var x = Math.sin(i * 12.9898 + s * 78.233) * 43758.5453; return x - Math.floor(x); }

  var W = 1, SH = 1, em = 16, M = 20, dpr = 1, beside = true, lines = [], reps = [], rows = [], bars = [], textR = 0, ym = 0;
  var B = 2, END = 0, built = false;
  var t0 = 0, revealAt = 0, tR = -1, speed = 1, px = -1e4, py = -1e4, inside = false, running = false, tPrev = 0, done = false;
  var lt = 0, la = 0;                          // the breath once the rhythm stands: its clock and its strength

  function measure() {
    var b = hb.getBoundingClientRect();
    W = b.width; SH = b.height; em = parseFloat(getComputedStyle(hb).fontSize) || 16;
    M = parseFloat(getComputedStyle(hl).paddingLeft) || 20;
    beside = !(innerWidth < 900 || innerWidth / innerHeight < 1.1);
    dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(W * dpr); cv.height = Math.round(SH * dpr);
    var cs = getComputedStyle(hl), mc = document.createElement('canvas').getContext('2d');
    mc.font = cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily; try { mc.letterSpacing = cs.letterSpacing; } catch (e) {}
    lines = []; rows = []; reps = [];
    wds.forEach(function (el, k) {
      var tx = el.firstElementChild, d = el.lastElementChild.getBoundingClientRect(), t = tx.getBoundingClientRect();
      var mt = mc.measureText(tx.textContent), sig = el.classList.contains('pd');
      // the line covers its word's ink, not just its box (a T's bar or a t's tail can stand a little outside it)
      var x0 = Math.min(d.left, t.left - mt.actualBoundingBoxLeft - em * .02) - b.left;
      var x1 = Math.max(d.right, t.left + mt.actualBoundingBoxRight + em * .02) - b.left;
      if (sig) { var c = t.left - b.left + (mt.actualBoundingBoxRight - mt.actualBoundingBoxLeft) / 2; x0 = c - d.height / 2; x1 = c + d.height / 2; }
      var l = { j: k, sig: sig, tx: tx, x0: x0, x1: x1, L0: x1 - x0, T0: d.height, hy: d.top - b.top + d.height / 2,
        tl: t.left - b.left, tt: t.top - b.top, tw: t.width, ha: 0, hv: 0, clip: '' };
      l.pad = Math.max(0, t.height / 2 - l.T0 / 2 + em * .08);
      lines.push(l);
      var r = null; rows.forEach(function (o) { if (Math.abs(o.y - l.hy) < l.T0) r = o; });
      if (!r) { r = { y: l.hy, x1: 0 }; rows.push(r); }
      r.x1 = Math.max(r.x1, x1);
    });
    rows.sort(function (a, c) { return a.y - c.y; });
    textR = Math.max.apply(null, rows.map(function (r) { return r.x1; }));
    var last = rows[rows.length - 1];
    // the rhythm: slim bars with air between them, centred in the space beside the statement on its centre line
    // (beside), or under it on the left edge (below)
    B = em * .13; var Pt = em * .4, HMAX = beside ? em * 2.25 : em * 2, wide = (NB - 1) * Pt + B;
    var x0w = beside ? textR + Math.max(em * 1.1, (W - M - textR - wide) / 2) : M;
    ym = beside ? (rows[0].y + last.y) / 2 : last.y + em * 1.3 + HMAX / 2;
    bars = PROF.map(function (h, k) { return { k: k, x: x0w + B / 2 + k * Pt, H: HMAX * h, sig: k === CK, d: Math.abs(k - CK), g: 1, gv: 0 }; });
    // the replies: Draft dashes after each row to the margin, and in the pauses between the rows
    var n = 0;
    function lay(y, xa, xb, th) {
      var x = xa;
      while (x < xb - em * .25) {
        var L = WID[Math.floor(hash(n * 7 + 3, 5) * WID.length)] * em / 64 * .86;
        if (x + L > xb - em * .3) L = xb - x; if (L < em * .22) break;
        reps.push({ x0: x, L0: L, T0: th, hy: y, ha: 0, hv: 0, f0: .02 + .22 * clamp((x - M) / (W - 2 * M), 0, 1) + hash(n, 8) * .04 });
        x += L + em * (hash(n, 6) < .18 ? .8 : .22); n++;
      }
    }
    rows.forEach(function (r) { lay(r.y, r.x1 + em * .42, W - M, em * .11); });
    for (var i = 0; i + 1 < rows.length; i++) lay((rows[i].y + rows[i + 1].y) / 2, M + (textR - M) * (.3 + hash(i, 9) * .2), W - M, em * .075);
    schedule();
    built = true;
  }

  // the timing: the replies fold first; the lines draw back in reading order; the rhythm rises from the centre
  // outward as the last word is said
  function schedule() {
    lines.forEach(function (l, j) { l.s = .22 + j * .075; l.D = .5; });
    var said = lines[lines.length - 1].s + lines[lines.length - 1].D * .55;
    bars.forEach(function (bb) { bb.c = said + bb.d * .085; });
    END = Math.max.apply(null, bars.map(function (bb) { return bb.c + .75; }));
  }

  // a line: resting on its hinge, or drawing back toward the end of its word
  function pose(l, tau) {
    var u = tau >= 0 ? (tau - l.s) / l.D : -1;
    if (u > 0) {
      var p = eio(u), len = l.L0 * (1 - p), xl = l.x0 + l.L0 * p;
      return { cx: xl + len / 2, cy: l.hy, a: 0, len: len, th: l.T0, xl: xl, wipe: true, gone: p >= 1 };
    }
    var a = l.ha;
    return { cx: l.x0 + Math.cos(a) * l.L0 / 2, cy: l.hy + Math.sin(a) * l.L0 / 2, a: a, len: l.L0, th: l.T0, rest: true, moved: Math.abs(a) * l.L0 / 2 };
  }
  // a bar: rising from the centre line, a hair past its height and back, then breathing with the others
  function bar(bb, tau) {
    var u = (tau - bb.c) / .7; if (u <= 0) return 0;
    var r = eout(u) * (1 + .035 * Math.sin(Math.PI * clamp(u * 1.25, 0, 1)));
    var h = bb.H * r * bb.g;
    if (la > 0) h *= 1 + la * .05 * Math.sin(lt * 1.9 - bb.d * .9);
    return h;
  }

  function draw(tau) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, SH);
    var fig = FIG ? [] : null, i;
    ctx.fillStyle = DRAFT;
    for (i = 0; i < reps.length; i++) {
      var r = reps[i], f = tau >= 0 ? eio((tau - r.f0) / .32) : 0, len = r.L0 * (1 - f);
      if (len < .5) continue;
      ctx.save(); ctx.translate(r.x0, r.hy); ctx.rotate(r.ha); ctx.fillRect(0, -r.T0 / 2, len, r.T0); ctx.restore();
      if (fig) fig.push([r.x0 + Math.cos(r.ha) * len / 2, r.hy + Math.sin(r.ha) * len / 2, len, r.T0, r.ha, DRAFT]);
    }
    for (i = 0; i < lines.length; i++) {
      var l = lines[i], o = pose(l, tau);
      clip(l, o);
      if (o.gone || o.len < .5) continue;
      ctx.fillStyle = l.sig ? SIG : INK;
      ctx.save(); ctx.translate(o.cx, o.cy); ctx.rotate(o.a); ctx.fillRect(-o.len / 2, -o.th / 2, o.len, o.th); ctx.restore();
      if (fig) fig.push([o.cx, o.cy, o.len, o.th, o.a, l.sig ? SIG : INK]);
    }
    for (i = 0; i < bars.length; i++) {
      var bb = bars[i], h = tau >= 0 ? bar(bb, tau) : 0;
      if (h < .5) continue;
      ctx.fillStyle = bb.sig ? SIG : INK; ctx.fillRect(bb.x - B / 2, ym - h / 2, B, h);
      if (fig) fig.push([bb.x, ym, B, h, 0, bb.sig ? SIG : INK]);
    }
    if (fig) {
      if (!figBox) { figBox = document.createElement('div'); figBox.className = 'ln16dom'; figBox.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:3'; hb.appendChild(figBox); }
      figBox.innerHTML = fig.map(function (q) {
        return '<i style="position:absolute;display:block;left:' + (q[0] - q[2] / 2).toFixed(2) + 'px;top:' + (q[1] - q[3] / 2).toFixed(2) + 'px;width:' + q[2].toFixed(2) +
          'px;height:' + q[3].toFixed(2) + 'px;background:' + q[5] + (q[4] ? ';transform:rotate(' + (q[4] * 57.29578).toFixed(3) + 'deg)' : '') + '"></i>';
      }).join('');
    }
  }

  // a word is hidden under its own line. At rest that is the full height of its letters; the moment the hand lifts the
  // line, only what the line still covers stays hidden. While a line draws back the word is written out behind it
  function clip(l, o) {
    var css;
    if (o.gone) css = 'none';
    else if (o.wipe) css = 'inset(-.5em ' + Math.max(0, l.tl + l.tw - Math.max(o.xl, l.tl)).toFixed(1) + 'px -.5em -.5em)';
    else {
      var near = Math.max(0, 1 - (o.moved || 0) / Math.max(2, em * .025)); near = near * near * (3 - 2 * near);
      var hh = o.th / 2 + l.pad * near, c = Math.cos(o.a), s = Math.sin(o.a), hw = o.len / 2 + .5;
      var pts = [[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]].map(function (p) {
        return (o.cx + p[0] * c - p[1] * s - l.tl).toFixed(1) + 'px ' + (o.cy + p[0] * s + p[1] * c - l.tt).toFixed(1) + 'px';
      });
      css = 'polygon(evenodd,-9999px -9999px,9999px -9999px,9999px 9999px,-9999px 9999px,-9999px -9999px,' + pts.join(',') + ',' + pts[0] + ')';
    }
    if (FIG) { l.tx.style.clipPath = 'none'; l.tx.style.visibility = (o.rest && !(o.moved > 1)) ? 'hidden' : ''; return; }
    if (css !== l.clip) { l.tx.style.clipPath = css; l.clip = css; }
  }

  // the hand: before the reveal it lifts lines a few degrees on their hinges; afterwards the bars rise a little toward it
  function springs(dt, tau) {
    var moving = false, i, k = 81, c = 2 * .7 * 9;
    var pre = tau < .2;
    function lift(o, L, cap, x0, y) {
      var tg = 0;
      if (pre && inside) {
        var dx = Math.max(x0 - px, 0, px - (x0 + L)), dy = py - y, d = Math.sqrt(dx * dx + dy * dy * 2.2), R = em * 1.1;
        var gg = Math.max(0, 1 - d / R); gg = gg * gg * (3 - 2 * gg);
        tg = -Math.min(cap, em * .26 / L) * gg;
      }
      o.hv += (k * (tg - o.ha) - c * o.hv) * dt; o.ha += o.hv * dt;
      if (Math.abs(o.hv) > .0005 || Math.abs(tg - o.ha) > .0005) moving = true;
    }
    for (i = 0; i < lines.length; i++) lift(lines[i], lines[i].L0, .07, lines[i].x0, lines[i].hy);
    for (i = 0; i < reps.length; i++) lift(reps[i], reps[i].L0, .05, reps[i].x0, reps[i].hy);
    if (tau >= END - .3) for (i = 0; i < bars.length; i++) {
      var bb = bars[i], tg2 = 1;
      if (inside) {
        var g2 = Math.max(0, 1 - Math.abs(px - bb.x) / (em * .8)), vy = Math.abs(py - ym) < Math.max(bb.H * .8, em * .8) ? 1 : 0;
        tg2 = 1 + .1 * g2 * g2 * (3 - 2 * g2) * vy;
      }
      bb.gv += (121 * (tg2 - bb.g) - 2 * .5 * 11 * bb.gv) * dt; bb.g += bb.gv * dt;
      if (Math.abs(bb.gv) > .0005 || Math.abs(tg2 - bb.g) > .0005) moving = true;
    }
    return moving;
  }

  function tick(now) {
    var dt = tPrev ? Math.min((now - tPrev) / 1000, 1 / 20) : 1 / 60; tPrev = now;
    if (tR < 0 && built && now >= revealAt) start(now);
    var tau = tR < 0 ? -1 : (now - tR) / 1000 * speed, moving = false;
    var n = Math.max(1, Math.ceil(dt / (1 / 240)));
    for (var i = 0; i < n; i++) moving = springs(dt / n, tau) || moving;
    // once it stands, a slow breath runs through the rhythm from the centre, only while the hero is on screen
    var seen = H.getBoundingClientRect().bottom > 0, laT = (!STILL && tau >= END && seen) ? 1 : 0;
    la += (laT - la) * (1 - Math.exp(-dt * 1.6)); if (Math.abs(laT - la) < .002 || !seen) la = laT;
    if (la > 0 || laT > 0) { lt += dt; moving = true; }
    draw(tau);
    if (tau >= END && !done) { done = true; H.classList.add('said'); }
    if (moving || tR < 0 || tau < END + .1) requestAnimationFrame(tick); else { running = false; tPrev = 0; }
  }
  function kick() { if (!running && built) { running = true; requestAnimationFrame(tick); } }
  function start(now, fast) { if (tR < 0) { tR = now || performance.now(); if (fast) speed = 1.4; kick(); } }

  stage.addEventListener('pointermove', function (e) {
    if (e.pointerType === 'touch') return;
    var b = hb.getBoundingClientRect(); px = e.clientX - b.left; py = e.clientY - b.top; inside = true;
    // while the hand plays with the lines the reveal waits for it to rest (never longer than about four seconds)
    if (tR < 0) revealAt = Math.min(t0 + 4200, Math.max(revealAt, performance.now() + 900));
    kick();
  });
  stage.addEventListener('pointerleave', function () { inside = false; kick(); });
  stage.addEventListener('pointerdown', function () { start(); });
  addEventListener('scroll', function () { if (scrollY > 2) start(0, true); kick(); }, { passive: true });
  addEventListener('keydown', function () { start(); });

  function finish() { tR = performance.now() - (END + 1) * 1000 / speed; done = true; H.classList.add('said'); }
  var rt;
  function setup(first) {
    measure(); H.classList.add('ln-on');
    window.__h17 = { end: END, draw: function (t, loop) { la = loop == null ? 0 : 1; lt = loop || 0; draw(t); } };
    if (qs.has('lift')) { var lf = qs.get('lift').split(','), ll = lines[+lf[0]]; if (ll) ll.ha = -Math.abs(parseFloat(lf[1]) || .06); }
    if (TAU !== null) { draw(TAU); return; }
    if (STILL || (first && scrollY > innerHeight * .5)) { t0 = performance.now() - 5000; finish(); draw(END + 1); if (!STILL) kick(); return; }
    if (!first && tR >= 0) { if (!done) finish(); draw(END + 1); kick(); return; }   // resized after the reveal began
    if (first) { t0 = performance.now(); revealAt = t0 + HOLD * 1000; }
    draw(-1); kick();
  }
  addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { setup(false); }, 150); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { setup(true); }); else setup(true);
})();
