/* The Talent Dept. · round 16 hero (2 Nov 2026). Hinge, refined to Lisa's 2 Nov brief: Conceal, Respond, Reveal,
   Resolve, smaller and denser than round 15 (the statement about 25% over round 12's, thin lines, no gaps).
   Conceal: the statement sits under one solid Ink line per word, the full stop under the one Signal square; the
   replies in Draft carry each row on to the margin and fill the pauses between the rows, so it reads as one block.
   Respond: every line hangs on a hinge at its left end. The hand lifts the nearest lines a few degrees on a spring.
   A line hides only what it covers: at rest it hides its whole word, and the moment it moves (a lift of a couple of
   pixels) the word shows all round it (Piyush 2 Nov: no "white shadow" or "cream shadow" hiding the text).
   Reveal: with no scroll and no hand (after a short hold, or at once on the first scroll, tap or key), the replies
   fold back into their hinges, then the statement's lines glide off their words along their own rows in reading
   order, so the sentence is read as it appears (a line only ever passes over words still hidden), and settle beside
   the statement as one flat line on its centre line: the first word furthest out, the full stop's Signal nearest.
   Resolve, on scroll (Piyush 2 Nov: "this should happen on scroll"): the hero holds while the flat line rises into
   the waveform, bar by bar from the Signal outward, every bar upright at every point of the scroll; scrolling back
   lays it flat again. Once it stands, a slow wave keeps running through the bars (Piyush 2 Nov: "after it settles
   there should be looping wave movement"), only while the hero is on screen; the bars also answer the hand a
   little, like a level. Nothing leaves the frame.
   Phones and portrait screens: the lines fold off their words, the flat line draws in under the statement, and the
   scroll raises it. Reduced motion and ?still: the final composition, no hold, no wave. Drawn on one canvas; the words are
   clipped in the DOM. Review: ?tau=1.4 holds a moment of the reveal, &w=.5 a point of the rise; ?hold=N. */
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
  var qs = new URLSearchParams(location.search);
  var HOLD = qs.has('hold') ? parseFloat(qs.get('hold')) : 1.5;   // seconds the lines hold before the reveal
  var TAU = qs.has('tau') ? parseFloat(qs.get('tau')) : null, WQ = qs.has('w') ? parseFloat(qs.get('w')) : 0;
  // to compare: ?reveal=scroll puts the whole sequence on the scroll, the reveal too (no hold, nothing on its own)
  // the "everything on scroll" option is also built as its own page (the hero carries the class on-scroll)
  var SR = qs.get('reveal') === 'scroll' || H.classList.contains('on-scroll'), sp = 0;
  // ?figma: every drawn bar is also laid out as a plain element, so the Figma export takes them as editable shapes
  var FIG = qs.has('figma'), figBox = null;
  if (SR) H.classList.add('on-scroll');

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function ss(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }
  function eio(t) { t = clamp(t, 0, 1); return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function hash(i, s) { var x = Math.sin(i * 12.9898 + s * 78.233) * 43758.5453; return x - Math.floor(x); }

  var W = 1, SH = 1, em = 16, M = 20, dpr = 1, beside = true, lines = [], reps = [], rows = [], textR = 0, ym = 0;
  var B = 2, P = 6, TF = 2, END = 0, built = false;
  var t0 = 0, revealAt = 0, tR = -1, speed = 1, px = -1e4, py = -1e4, inside = false, running = false, tPrev = 0, done = false;
  var w = 0;                                   // the rise: 0 a flat line, 1 the waveform
  var lt = 0, la = 0;                          // the wave once the bars stand: its clock, and its strength (0 to 1)

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
    var last = rows[rows.length - 1], N = lines.length;
    // the waveform: slim bars, close together, on the statement's centre line (beside), or under it (below). Laid
    // flat, its segments meet end to end as one line
    B = em * .15; P = em * .36; TF = em * .1;
    var HMAX = beside ? em * 2.72 : em * 2.3, wide = (N - 1) * P + B;
    var x0w = beside ? Math.max(textR + em, textR + (W - M - textR - wide) / 2) : M + P / 2 - B / 2;
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

  // the reveal, at time tau after it began. Beside: a line glides along its row and, past the statement, down or up
  // to the centre line, shortening to one segment of the flat line. Below: it folds toward the end of its word
  function glide(l, tau) {
    var u = (tau - l.s) / l.D;
    if (u <= 0) return null;
    var p = eio(u), len, xl;
    if (!beside) {
      len = l.L0 * (1 - p); xl = l.x0 + l.L0 * p;
      return { cx: xl + len / 2, cy: l.hy, a: 0, len: len, th: l.T0, xl: xl, gone: p >= 1, moved: em };
    }
    len = l.L0 + (P - l.L0) * ss(p / .8);
    var xc = l.hx + (l.sx - l.hx) * p; xl = xc - len / 2;
    var span = l.sx - P / 2 - textR - em * .08, ey = ss((xl - textR - em * .08) / (span > 1 ? span : 1));
    return { cx: xc, cy: l.hy + (l.sy - l.hy) * ey, a: 0, len: len, th: l.T0 + (TF - l.T0) * ss((p - .25) / .5), xl: xl,
      moved: Math.abs(xc - l.hx) + (l.L0 - len) / 2 };
  }
  // after the reveal: one segment of the flat line, risen by w into its bar. Every bar stays upright at every w: the
  // segment narrows to a bar and grows up and down from the centre line, the Signal first, then outward
  function seg(l, tau, w) {
    var arrive = beside ? l.s + l.D : l.c;
    if (tau < arrive) return null;
    var grow = beside ? 1 : eio((tau - l.c) / .38), N = lines.length, dk = l.k * .045, wk = clamp((w - dk) / (1 - (N - 1) * .045), 0, 1);
    var hlen = (P + (B - P) * ss(wk / .22)) * grow, vlen = TF + (l.H - TF) * ss((wk - .08) / .92);   // breaks into dashes, then rises
    // once it stands, the waveform keeps speaking: a slow wave runs through the bars from the Signal outward, two
    // swells over each other so it never reads as a metronome; every bar stays upright and on its centre line
    if (la > 0) vlen *= 1 + la * wk * .15 * (.62 * Math.sin(lt * 2.4 - l.k * .78) + .38 * Math.sin(lt * 3.7 + l.k * 1.3));
    var e = l.g - 1;                                     // the hand: a small rise near it, a little more on a bar
    vlen += e * (1 - wk) * em * 2.6 + vlen * e * wk;
    return { cx: beside || grow >= 1 ? l.sx : l.sx - P / 2 + hlen / 2, cy: l.sy, a: 0, len: hlen, th: vlen, bar: true };
  }
  function schedule() {
    var N = lines.length, prev = null;
    lines.forEach(function (l, j) {
      if (!beside) { l.D = .46; l.s = .25 + j * .1; l.c = .25 + N * .1 + .25 + l.k * .07; prev = l; return; }   // the flat line draws in left to right
      l.D = .52 + .042 * Math.abs(l.sx - l.hx) / em;
      var s = j === 0 ? .22 : prev.s + .1;
      // a line may only pass over words still hidden: the line ahead of it on its row must stay ahead of its left
      // end, and the segments must arrive in order (each lands nearer the statement than the one before)
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
      prev = l;
    });
    END = Math.max.apply(null, lines.map(function (l) { return beside ? l.s + l.D : l.c + .4; }));
  }

  // where a line is right now: resting on its hinge, gliding, or a segment of the line that rises on scroll
  function pose(l, tau, w) {
    var s = tau >= 0 ? seg(l, tau, w) : null;
    if (s) return s;
    var g = tau >= 0 ? glide(l, tau) : null;
    if (g) return g;
    var a = l.ha, xl = l.x0;
    return { cx: xl + Math.cos(a) * l.L0 / 2, cy: l.hy + Math.sin(a) * l.L0 / 2, a: a, len: l.L0, th: l.T0, xl: xl, rest: true,
      moved: Math.abs(a) * l.L0 / 2 };
  }

  function draw(tau, intro, wv) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, SH);
    ctx.fillStyle = DRAFT;
    for (var i = 0; i < reps.length; i++) {
      var r = reps[i], f = tau >= 0 ? eio((tau - r.f0) / .3) : 0, un = intro >= 0 ? eio((intro - r.u0) / .42) : 1, len = r.L0 * un * (1 - f);
      if (len < .5) continue;
      ctx.save(); ctx.translate(r.x0, r.hy); ctx.rotate(r.ha); ctx.fillRect(0, -r.T0 / 2, len, r.T0); ctx.restore();
    }
    var figOut = FIG ? [] : null;
    if (FIG) for (var fi = 0; fi < reps.length; fi++) {
      var fr = reps[fi], ff = tau >= 0 ? eio((tau - fr.f0) / .3) : 0, fl = fr.L0 * (1 - ff);
      if (fl >= .5) figOut.push([fr.x0 + fl / 2, fr.hy, fl, fr.T0, fr.ha, DRAFT]);
    }
    var order = lines.map(function (l) { l.o = pose(l, tau, wv); return l; });
    order.sort(function (a, c) { return (a.o.rest ? 1 : 0) - (c.o.rest ? 1 : 0) || a.j - c.j; });
    for (var j = 0; j < order.length; j++) {
      var l = order[j], o = l.o;
      clip(l, o);
      if (o.gone || o.len < .5) continue;
      ctx.fillStyle = l.sig ? SIG : INK;
      ctx.save(); ctx.translate(o.cx, o.cy); ctx.rotate(o.a); ctx.fillRect(-o.len / 2, -o.th / 2, o.len, o.th); ctx.restore();
      if (FIG) figOut.push([o.cx, o.cy, o.len, o.th, o.a, l.sig ? SIG : INK]);
    }
    if (FIG) {
      if (!figBox) { figBox = document.createElement('div'); figBox.className = 'ln16dom'; figBox.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:3'; hb.appendChild(figBox); }
      figBox.innerHTML = figOut.map(function (b) {
        return '<i style="position:absolute;display:block;left:' + (b[0] - b[2] / 2).toFixed(2) + 'px;top:' + (b[1] - b[3] / 2).toFixed(2) + 'px;width:' + b[2].toFixed(2) +
          'px;height:' + b[3].toFixed(2) + 'px;background:' + b[5] + (b[4] ? ';transform:rotate(' + (b[4] * 57.29578).toFixed(3) + 'deg)' : '') + '"></i>';
      }).join('');
    }
  }

  // a word is hidden under its own line. At rest the hidden area is the line stretched over the full height of the
  // letters; the moment the line moves (a hinge, a glide) it shrinks to the line itself, so the word shows all round
  // it and there is never a hidden box larger than the line
  function clip(l, o) {
    var css;
    if (o.bar || o.gone || (!o.rest && o.xl >= l.tl + l.tw)) css = 'none';
    else {
      // a couple of pixels of movement is enough: a lifted line never leaves a pale band hiding the letters under it
      var near = Math.max(0, 1 - (o.moved || 0) / Math.max(2, em * .025)); near = near * near * (3 - 2 * near);
      var hh = o.th / 2 + l.pad * near, c = Math.cos(o.a), s = Math.sin(o.a), hw = o.len / 2 + .5;
      var pts = [[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]].map(function (p) {
        return (o.cx + p[0] * c - p[1] * s - l.tl).toFixed(1) + 'px ' + (o.cy + p[0] * s + p[1] * c - l.tt).toFixed(1) + 'px';
      });
      css = 'polygon(evenodd,-9999px -9999px,9999px -9999px,9999px 9999px,-9999px 9999px,-9999px -9999px,' + pts.join(',') + ',' + pts[0] + ')';
    }
    if (FIG) { var hide = o.rest && !(o.moved > 1); l.tx.style.clipPath = 'none'; l.tx.style.visibility = hide ? 'hidden' : ''; return; }
    if (css !== l.clip) { l.tx.style.clipPath = css; l.clip = css; }
  }

  // the hand: before the reveal it lifts lines on their hinges; afterwards the line and its bars rise a little toward it
  function springs(dt, tau) {
    var moving = false, i, l, k = 81, c = 2 * .62 * 9;
    var pre = tau < .3;
    function lift(b, L, cap, x0, y) {
      var tg = 0;
      if (pre && inside) {
        var dx = Math.max(x0 - px, 0, px - (x0 + L)), dy = py - y, d = Math.sqrt(dx * dx + dy * dy * 2.2), R = em * 1.15;
        var gg = Math.max(0, 1 - d / R); gg = gg * gg * (3 - 2 * gg);
        tg = -Math.min(cap, em * .3 / L) * gg;
      }
      b.hv += (k * (tg - b.ha) - c * b.hv) * dt; b.ha += b.hv * dt;
      if (Math.abs(b.hv) > .0005 || Math.abs(tg - b.ha) > .0005) moving = true;
    }
    for (i = 0; i < lines.length; i++) { l = lines[i]; lift(l, l.L0, .09, l.x0, l.hy); }
    for (i = 0; i < reps.length; i++) { var r = reps[i]; lift(r, r.L0, .06, r.x0, r.hy); }
    if (tau >= END) for (i = 0; i < lines.length; i++) {
      l = lines[i]; var tg2 = 1;
      if (inside && beside) {
        var hx = Math.abs(px - l.sx), vy = Math.abs(py - l.sy) < Math.max(l.H * .75, em * .8) ? 1 : 0;
        var g2 = Math.max(0, 1 - hx / (em * .85)); tg2 = 1 + .11 * g2 * g2 * (3 - 2 * g2) * vy;
      }
      l.gv += (121 * (tg2 - l.g) - 2 * .42 * 11 * l.gv) * dt; l.g += l.gv * dt;
      if (Math.abs(l.gv) > .0005 || Math.abs(tg2 - l.g) > .0005) moving = true;
    }
    return moving;
  }

  // how far the hero's scroll has gone: 0 at the top, 1 when it lets go of the page
  function progress() { var r = H.getBoundingClientRect(), span = H.offsetHeight - innerHeight; return span > 0 ? clamp(-r.top / span, 0, 1) : 1; }

  function tick(now) {
    var dt = tPrev ? Math.min((now - tPrev) / 1000, 1 / 20) : 1 / 60; tPrev = now;
    if (!SR && tR < 0 && built && now >= revealAt) start(now);
    var moving = false, tau, intro = (now - t0) / 1000;
    if (SR) {                                  // the scroll is the clock: the first half reveals, the second raises
      var pT = progress(); sp += (pT - sp) * (1 - Math.exp(-dt * 14)); if (Math.abs(pT - sp) < .0005) sp = pT; else moving = true;
      tau = sp / .48 * END; w = ss((sp - .5) / .36);
    } else tau = tR < 0 ? -1 : (now - tR) / 1000 * speed;
    var n = Math.max(1, Math.ceil(dt / (1 / 240)));
    for (var i = 0; i < n; i++) moving = springs(dt / n, tau) || moving;
    if (!SR) {
      // the rise follows the scroll once the line is whole (a short follow, so a quick scroll still eases in)
      var wT = tau >= END ? ss(progress() / .78) : 0;
      w += (wT - w) * (1 - Math.exp(-dt * 14)); if (Math.abs(wT - w) < .0005) w = wT; else moving = true;
    }
    // the wave runs only while the waveform stands and the hero is on screen, easing in and out
    var seen = H.getBoundingClientRect().bottom > 0, laT = (!STILL && w > .97 && seen) ? 1 : 0;
    la += (laT - la) * (1 - Math.exp(-dt * 2.2)); if (Math.abs(laT - la) < .002 || !seen) la = laT;
    if (la > 0 || laT > 0) { lt += dt; moving = true; }
    draw(tau, intro, w);
    if (tau >= END !== done) { done = tau >= END; H.classList.toggle('said', done); }
    var busy = moving || intro < 1 || (!SR && (tR < 0 || tau < END + .1));
    if (busy) requestAnimationFrame(tick); else { running = false; tPrev = 0; }
  }
  function kick() { if (!running && built) { running = true; requestAnimationFrame(tick); } }
  function start(now, fast) { if (tR < 0) { tR = now || performance.now(); if (fast) speed = 1.5; kick(); } }

  stage.addEventListener('pointermove', function (e) {
    if (e.pointerType === 'touch') return;
    var b = hb.getBoundingClientRect(); px = e.clientX - b.left; py = e.clientY - b.top; inside = true;
    // while the hand plays with the lines the reveal waits for it to rest (never longer than five seconds)
    if (tR < 0) revealAt = Math.min(t0 + 5200, Math.max(revealAt, performance.now() + 1100));
    kick();
  });
  stage.addEventListener('pointerleave', function () { inside = false; kick(); });
  stage.addEventListener('pointerdown', function () { if (!SR) start(); });
  addEventListener('scroll', function () { if (!SR && scrollY > 2) start(0, true); kick(); }, { passive: true });
  addEventListener('keydown', function () { if (!SR) start(); });

  function finish() { tR = performance.now() - (END + 1) * 1000 / speed; done = true; H.classList.add('said'); lines.forEach(function (l) { l.g = 1; l.gv = 0; }); }
  var rt;
  function setup(first) {
    measure(); H.classList.add('ln-on');
    window.__h16 = { end: END, draw: function (t, wv, loop) { la = loop == null ? 0 : 1; lt = loop || 0; draw(t, 9, wv || 0); },
      state: function () { return { w: w, la: la, lt: lt, running: running, done: done }; } };
    if (qs.has('lift')) { var lf = qs.get('lift').split(','), ll = lines[+lf[0]]; if (ll) ll.ha = -Math.abs(parseFloat(lf[1]) || .07); }
    if (TAU !== null) { draw(TAU, 9, WQ); return; }
    if (STILL) { t0 = performance.now() - 5000; finish(); w = 1; draw(END + 1, 9, 1); return; }
    if (SR) { if (first) t0 = performance.now(); sp = progress(); draw(sp / .48 * END, first ? 0 : 9, ss((sp - .5) / .36)); kick(); return; }
    if (first && scrollY > innerHeight * .5) { t0 = performance.now() - 5000; finish(); w = ss(progress() / .78); draw(END + 1, 9, w); kick(); return; }
    if (!first && tR >= 0) {              // resized after the reveal began: straight to the whole line, the rise kept
      if (!done) finish();
      t0 = performance.now() - 5000; draw(END + 1, 9, w); kick(); return;
    }
    if (first) { t0 = performance.now(); revealAt = t0 + HOLD * 1000; }
    draw(-1, first ? 0 : 9, 0); kick();
  }
  addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { setup(false); }, 150); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { setup(true); }); else setup(true);
})();
