/* The Talent Dept. · round 16 hero (2 Nov 2026). Hinge, refined to Lisa's 2 Nov brief: Conceal, Respond, Reveal,
   Resolve, smaller and denser than round 15 (the statement about 30% over round 12's, thin lines, no gaps).
   Conceal: the statement sits under one solid Ink line per word, the full stop under the one Signal square; the
   replies in Draft carry each row on to the margin and fill the pauses between the rows, so it reads as one block.
   Respond: every line hangs on a hinge at its left end. The hand lifts the nearest lines a few degrees on a spring
   and the word shows at their edges. No line turns far enough to reach another row.
   Reveal: with no scroll and no hand (after a short hold, or at once on the first scroll, tap or key), the replies
   fold back into their hinges, then the statement's lines glide off their words along their own rows in reading
   order, so the sentence is read as it appears. A line only ever passes over words that are still hidden.
   Resolve: past the statement each line turns upright and rises into one bar of the waveform beside it, all on the
   statement's centre line: the first word furthest out, the full stop's Signal last and nearest. Every bar stands
   at 90 degrees, inside the frame; nothing leaves it. Afterwards the bars answer the hand a little, like a level.
   Phones and portrait screens: the lines fold off their words and the waveform rises under the statement.
   Reduced motion and ?still: the final composition. Drawn on one canvas; the words are clipped in the DOM. */
(function () {
  var H = document.querySelector('.hero4.h16'); if (!H) return;
  var root = document.documentElement;
  var reduce = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  var STILL = root.classList.contains('still') || reduce;
  var stage = H.querySelector('.stage'), hb = H.querySelector('.hb'), hl = H.querySelector('.hl');
  var wds = [].slice.call(hl.querySelectorAll('.wd'));
  var cv = document.createElement('canvas'); cv.className = 'ln16'; cv.setAttribute('aria-hidden', 'true'); hb.appendChild(cv);
  var ctx = cv.getContext('2d');
  var INK = '#171614', SIG = '#D65A4A', DRAFT = '#C7B394';
  var WID = [18, 44, 48, 92, 104, 111, 127, 144, 183];          // the brand's dash lengths
  // the waveform, left to right (the first bar is the Signal): a rise, a peak, a dip and a second peak, after the
  // rhythm on the studio wall
  var PROF = [.5, .72, .9, 1, .58, .95, .8, .6];
  var q = new URLSearchParams(location.search);
  var HOLD = q.has('hold') ? parseFloat(q.get('hold')) : 1.5;   // seconds the lines hold before the reveal
  var TAU = q.has('tau') ? parseFloat(q.get('tau')) : null;      // review: ?tau=1.4 holds the moment 1.4 s into the reveal

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function ss(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }
  function eio(t) { t = clamp(t, 0, 1); return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function back(t, s) { t = clamp(t, 0, 1); var u = t - 1; return 1 + (s + 1) * u * u * u + s * u * u; }
  function hash(i, s) { var x = Math.sin(i * 12.9898 + s * 78.233) * 43758.5453; return x - Math.floor(x); }

  var W = 1, SH = 1, em = 16, M = 20, dpr = 1, beside = true, lines = [], reps = [], rows = [], textR = 0, ym = 0;
  var B = 2, P = 6, S = 8, END = 0, built = false;
  var t0 = 0, revealAt = 0, tR = -1, px = -1e4, py = -1e4, inside = false, running = false, tPrev = 0, done = false;

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
      var l = { j: k, sig: sig, tx: tx, x0: x0, x1: x1, L0: x1 - x0, T0: d.height, hx: (x0 + x1) / 2, hy: d.top - b.top + d.height / 2,
        tl: t.left - b.left, tt: t.top - b.top, tw: t.width, th: t.height, ha: 0, hv: 0, g: 1, gv: 0, clip: '' };
      l.pad = Math.max(0, t.height / 2 - l.T0 / 2 + em * .08);
      lines.push(l);
      var r = null; rows.forEach(function (o) { if (Math.abs(o.y - l.hy) < l.T0) r = o; });
      if (!r) { r = { y: l.hy, ls: [], x1: 0 }; rows.push(r); }
      r.ls.push(l); r.x1 = Math.max(r.x1, x1);
    });
    rows.sort(function (a, c) { return a.y - c.y; });
    textR = Math.max.apply(null, rows.map(function (r) { return r.x1; }));
    var last = rows[rows.length - 1];
    // the waveform: slim bars, close together, on the statement's centre line (beside), or under it (below)
    var N = lines.length;
    B = em * .15; P = em * .36; S = em * .42;
    var HMAX = beside ? em * 2.72 : em * 2.3, wide = (N - 1) * P + B;
    var x0w = beside ? Math.max(textR + em, textR + (W - M - textR - wide) / 2) : M;
    ym = beside ? (rows[0].y + last.y) / 2 : last.y + em * 1.25 + HMAX / 2;
    lines.forEach(function (l, j) {
      var k = N - 1 - j; l.k = k; l.sx = x0w + B / 2 + k * P; l.sy = ym; l.H = HMAX * PROF[k % PROF.length];
    });
    // the replies: Draft dashes after each row to the margin, and in the pauses between the rows
    var n = 0;
    function lay(y, xa, xb, th) {
      var x = xa;
      while (x < xb - em * .25) {
        var L = WID[Math.floor(hash(n * 7 + 3, 5) * WID.length)] * em / 64 * .86;
        if (x + L > xb - em * .3) L = xb - x; if (L < em * .22) break;
        reps.push({ x0: x, L0: L, T0: th, hy: y, ha: 0, hv: 0, u0: .04 + .34 * clamp((x - M) / (W - 2 * M), 0, 1) + hash(n, 4) * .05,
          f0: .02 + .2 * clamp((x - M) / (W - 2 * M), 0, 1) + hash(n, 8) * .04 });
        x += L + em * (hash(n, 6) < .18 ? .8 : .22); n++;
      }
    }
    rows.forEach(function (r) { lay(r.y, r.x1 + em * .42, W - M, em * .11); });
    for (var i = 0; i + 1 < rows.length; i++) lay((rows[i].y + rows[i + 1].y) / 2, M + (textR - M) * (.3 + hash(i, 9) * .2), W - M, em * .075);
    schedule();
    built = true;
  }

  // the pose a line takes on its way, at time tau after the reveal began. Beside: glide along the row, then in the
  // clear space turn upright and rise into its bar. Below: fold toward the end of its word, then the bar rises.
  function glide(l, tau) {
    var u = (tau - l.s) / l.D;
    if (u <= 0) return null;
    var p = eio(u), len, xl, y, a = 0, th;
    if (!beside) {
      len = l.L0 * (1 - p); xl = l.x0 + l.L0 * p;
      return { cx: xl + len / 2, cy: l.hy, a: 0, len: len, th: l.T0, xl: xl, gone: p >= 1 };
    }
    len = l.L0 + (S - l.L0) * ss(p / .8);
    var xc = l.hx + (l.sx - l.hx) * p; xl = xc - len / 2;
    var span = l.sx - S / 2 - textR - em * .08, ey = ss((xl - textR - em * .08) / (span > 1 ? span : 1));
    y = l.hy + (l.sy - l.hy) * ey;
    a = -Math.PI / 2 * ss((ey - .2) / .8);          // past the statement it turns upright as it glides to its place
    th = l.T0 + (B - l.T0) * ss((p - .25) / .5);
    return { cx: xc, cy: y, a: a, len: len, th: th, xl: xl };
  }
  function stand(l, tau) {
    var u = (tau - l.c) / .62;
    if (u <= 0) return null;
    var s0 = beside ? S : 0;
    return { cx: l.sx, cy: l.sy, a: -Math.PI / 2, len: s0 + (l.H - s0) * back(u, 1.15), th: B };
  }
  function schedule() {
    var N = lines.length, prev = null;
    lines.forEach(function (l, j) {
      if (!beside) { l.D = .46; l.s = .25 + j * .1; l.c = l.s + l.D * .8; prev = l; return; }   // its bar rises as it folds away
      l.D = .52 + .042 * Math.abs(l.sx - l.hx) / em;
      var s = j === 0 ? .22 : prev.s + .1;
      // a line may only pass over words still hidden: the line ahead of it on its row must stay ahead of its left
      // end, and the bars must arrive in order (each lands nearer the statement than the one before)
      for (var it = 0; it < 200; it++) {
        l.s = s; var ok = true;
        if (prev) {
          if (s + l.D < prev.s + prev.D + .14) ok = false;
          var same = Math.abs(prev.hy - l.hy) < l.T0;
          for (var tt = s; ok && same && tt < s + l.D; tt += .02) {
            var A = glide(prev, tt), Bq = glide(l, tt);
            if (Bq && A && A.xl < Bq.xl + em * .05) ok = false;
            if (Bq && !A) ok = false;
          }
        }
        if (ok) break; s += .02;
      }
      l.c = l.s + l.D - .04; prev = l;
    });
    END = Math.max.apply(null, lines.map(function (l) { return l.c + .7; }));
  }

  // where a line (or reply) is right now: rest with its hinge, gliding, or standing as a bar
  function pose(l, tau) {
    var st = tau >= 0 ? stand(l, tau) : null;
    if (st) { st.bar = true; return st; }
    var g = tau >= 0 ? glide(l, tau) : null;
    if (g) return g;
    var a = l.ha, xl = l.x0;
    return { cx: xl + Math.cos(a) * l.L0 / 2, cy: l.hy + Math.sin(a) * l.L0 / 2, a: a, len: l.L0, th: l.T0, xl: xl, rest: true };
  }

  function draw(tau, intro) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, SH);
    ctx.fillStyle = DRAFT;
    for (var i = 0; i < reps.length; i++) {
      var r = reps[i], f = tau >= 0 ? eio((tau - r.f0) / .3) : 0, un = intro >= 0 ? eio((intro - r.u0) / .42) : 1, len = r.L0 * un * (1 - f);
      if (len < .5) continue;
      ctx.save(); ctx.translate(r.x0, r.hy); ctx.rotate(r.ha); ctx.fillRect(0, -r.T0 / 2, len, r.T0); ctx.restore();
    }
    var order = lines.map(function (l) { var o = pose(l, tau); l.o = o; return l; });
    order.sort(function (a, c) { return (a.o.rest ? 1 : 0) - (c.o.rest ? 1 : 0) || a.j - c.j; });
    for (var j = 0; j < order.length; j++) {
      var l = order[j], o = l.o;
      if (o.gone || o.len < .5) { clip(l, o); continue; }
      var len = o.len * (o.bar ? l.g : 1);
      ctx.fillStyle = l.sig ? SIG : INK;
      ctx.save(); ctx.translate(o.cx, o.cy); ctx.rotate(o.a); ctx.fillRect(-len / 2, -o.th / 2, len, o.th); ctx.restore();
      clip(l, o);
    }
  }

  // a word is hidden under its line: while the line rests or hinges, by the line's own (turned) rectangle stretched
  // over the full height of the letters; once it glides, everything left of the line's trailing end shows
  function clip(l, o) {
    var css;
    if (o.bar || o.gone || (o.xl != null && !o.rest && o.xl >= l.tl + l.tw)) css = 'none';
    else if (!o.rest) css = 'inset(-.5em ' + Math.max(0, l.tl + l.tw - Math.max(o.xl, l.tl)).toFixed(1) + 'px -.5em -.5em)';
    else {
      var near = Math.max(0, 1 - Math.abs(o.a) * l.L0 * .5 / (em * .9)), hh = l.T0 / 2 + l.pad * near, c = Math.cos(o.a), s = Math.sin(o.a), hw = l.L0 / 2 + 1;
      var pts = [[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]].map(function (p) {
        return (o.cx + p[0] * c - p[1] * s - l.tl).toFixed(1) + 'px ' + (o.cy + p[0] * s + p[1] * c - l.tt).toFixed(1) + 'px';
      });
      css = 'polygon(evenodd,-9999px -9999px,9999px -9999px,9999px 9999px,-9999px 9999px,-9999px -9999px,' + pts.join(',') + ',' + pts[0] + ')';
    }
    if (css !== l.clip) { l.tx.style.clipPath = css; l.clip = css; }
  }

  // the hand: before the reveal it lifts lines on their hinges; afterwards the bars rise a little toward it
  function springs(dt, tau) {
    var moving = false, i, l, w = 9, z = .62, k = w * w, c = 2 * z * w;
    var pre = tau < 0 || tau < .3;
    function lift(b, L, cap, x0, y) {
      var tg = 0;
      if (pre && inside) {
        var dx = Math.max(x0 - px, 0, px - (x0 + L)), dy = py - y, d = Math.sqrt(dx * dx + dy * dy * 2.2), R = em * 1.15;
        var gg = Math.max(0, 1 - d / R); gg = gg * gg * (3 - 2 * gg);
        tg = -Math.min(cap, em * .34 / L) * gg;
      }
      b.hv += (k * (tg - b.ha) - c * b.hv) * dt; b.ha += b.hv * dt;
      if (Math.abs(b.hv) > .0005 || Math.abs(tg - b.ha) > .0005) moving = true;
    }
    for (i = 0; i < lines.length; i++) { l = lines[i]; lift(l, l.L0, .1, l.x0, l.hy); }
    for (i = 0; i < reps.length; i++) { var r = reps[i]; lift(r, r.L0, .07, r.x0, r.hy); }
    if (tau >= END - .7) for (i = 0; i < lines.length; i++) {
      l = lines[i]; var tg2 = 1;
      if (inside && beside) {
        var hx = Math.abs(px - l.sx), vy = Math.abs(py - l.sy) < l.H * .75 ? 1 : 0;
        var g2 = Math.max(0, 1 - hx / (em * .85)); tg2 = 1 + .11 * g2 * g2 * (3 - 2 * g2) * vy;
      }
      var w2 = 11, z2 = .42;
      l.gv += (w2 * w2 * (tg2 - l.g) - 2 * z2 * w2 * l.gv) * dt; l.g += l.gv * dt;
      if (Math.abs(l.gv) > .0005 || Math.abs(tg2 - l.g) > .0005) moving = true;
    }
    return moving;
  }

  function tick(now) {
    var dt = tPrev ? Math.min((now - tPrev) / 1000, 1 / 20) : 1 / 60; tPrev = now;
    if (tR < 0 && built && now >= revealAt) start(now);
    var tau = tR < 0 ? -1 : (now - tR) / 1000, intro = (now - t0) / 1000;
    var n = Math.max(1, Math.ceil(dt / (1 / 240))), moving = false;
    for (var i = 0; i < n; i++) moving = springs(dt / n, tau) || moving;
    draw(tau, intro);
    if (tau >= END && !done) { done = true; H.classList.add('said'); }
    var busy = moving || tR < 0 || tau < END + .1 || intro < 1;
    if (busy) requestAnimationFrame(tick); else { running = false; tPrev = 0; }
  }
  function kick() { if (!running && built) { running = true; requestAnimationFrame(tick); } }
  function start(now) { if (tR < 0) { tR = now || performance.now(); kick(); } }

  stage.addEventListener('pointermove', function (e) {
    if (e.pointerType === 'touch') return;
    var b = hb.getBoundingClientRect(); px = e.clientX - b.left; py = e.clientY - b.top; inside = true;
    // while the hand plays with the lines the reveal waits for it to rest (never longer than five seconds)
    if (tR < 0) revealAt = Math.min(t0 + 5200, Math.max(revealAt, performance.now() + 1100));
    kick();
  });
  stage.addEventListener('pointerleave', function () { inside = false; kick(); });
  stage.addEventListener('pointerdown', function () { start(); });
  addEventListener('scroll', function () { if (scrollY > 2) start(); }, { passive: true });
  addEventListener('keydown', function () { start(); });

  function finish() { tR = performance.now() - (END + 1) * 1000; done = true; H.classList.add('said'); lines.forEach(function (l) { l.g = 1; l.gv = 0; }); }
  var rt;
  function setup(first) {
    measure(); H.classList.add('ln-on');
    window.__h16 = { end: END, draw: function (t) { draw(t, 9); } };
    if (TAU !== null) { draw(TAU, 9); return; }
    if (STILL || (first && scrollY > H.offsetHeight * .6)) { t0 = performance.now() - 5000; finish(); draw(END + 1, 9); return; }
    if (!first && tR >= 0) {              // resized after the reveal: straight to where it was going
      if (!done) finish();
      t0 = performance.now() - 5000; draw((performance.now() - tR) / 1000, 9); kick(); return;
    }
    if (first) { t0 = performance.now(); revealAt = t0 + HOLD * 1000; }
    draw(-1, first ? 0 : 9); kick();
  }
  addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { setup(false); }, 150); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { setup(true); }); else setup(true);
})();
