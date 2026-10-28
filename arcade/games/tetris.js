/*
 * tetris.js — «Bloques Hashira» (mundo Demon Slayer). Tetris 10×16 para móvil en vertical.
 * Canvas 2D + Juice (partículas, temblor, hit-stop, textos). Script plano: window.MiniGames.tetris.start(container, opts) → { stop() }.
 * Control: deslizar ◀ ▶ (una casilla cada 28 px), deslizar ▼ = bajar, latigazo ▼ = caer, toque = girar; 5 botones grandes; teclado.
 */
(function () {
  'use strict';
  window.MiniGames = window.MiniGames || {};

  var COLS = 10, ROWS = 16, CELL = 28, BX = 8, BY = 94, BW = COLS * CELL, BH = ROWS * CELL;
  var SX = BX + BW + 10, SW = 72, W = SX + SW + 8, H = BY + BH + 10;          // lienzo lógico 378 × 552
  var FONT = '-apple-system, "SF Pro Text", "Segoe UI", Roboto, sans-serif';
  var GRAV = [900, 760, 640, 540, 450, 380, 320, 270, 230, 200, 175, 150];   // ms por casilla según nivel (empieza lento)
  var PTS = [0, 100, 300, 500, 800], META = 10;
  var SWIPE = 28, FLICK_PX = 120, FLICK_MS = 200, DAS = 160, ARR = 50;
  var LOCK_MS = 480, SOFT_MS = 55, CLEAR_MS = 430, FALL_MS = 150, CD_MS = 2500, END_MS = 1300;
  var TOK = 'assets/tokens/', BG = '../tablas/assets/img/bg_demonslayer.webp';
  // Las 7 piezas visten los colores de las Respiraciones; la ficha acompaña a la pieza siguiente
  var PIECES = [
    { n: 'Agua', c: '#2F8CFF', tok: 'st_giyu', s: [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]] },
    { n: 'Trueno', c: '#FFD23F', tok: 'ch_tanjiro', s: [[1, 1], [1, 1]] },
    { n: 'Niebla', c: '#B388FF', tok: 'ch_tanjiro', s: [[0, 1, 0], [1, 1, 1], [0, 0, 0]] },
    { n: 'Viento', c: '#3DDC84', tok: 'ch_tanjiro', s: [[0, 1, 1], [1, 1, 0], [0, 0, 0]] },
    { n: 'Amor', c: '#FF6FB5', tok: 'ch_tanjiro', s: [[1, 1, 0], [0, 1, 1], [0, 0, 0]] },
    { n: 'Serpiente', c: '#CFEAFF', tok: 'ch_tanjiro', s: [[1, 0, 0], [1, 1, 1], [0, 0, 0]] },
    { n: 'Llama', c: '#FF7A1A', tok: 'st_rengoku', s: [[0, 0, 1], [1, 1, 1], [0, 0, 0]] }
  ];
  var KICKS = [[0, 0], [-1, 0], [1, 0], [-2, 0], [2, 0], [0, -1], [-1, -1], [1, -1], [0, -2]];   // empujones al girar junto a pared/suelo

  function hex(c) { var n = parseInt(c.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
  function rgba(c, a) { var r = hex(c); return 'rgba(' + r[0] + ',' + r[1] + ',' + r[2] + ',' + a + ')'; }
  function shade(c, k) { var r = hex(c), o = [], i; for (i = 0; i < 3; i++) o.push(Math.round(k < 0 ? r[i] * (1 + k) : r[i] + (255 - r[i]) * k)); return 'rgb(' + o.join(',') + ')'; }
  function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
  function rot(m) { var n = m.length, o = [], y, x; for (y = 0; y < n; y++) { o.push([]); for (x = 0; x < n; x++) o[y].push(m[n - 1 - x][y]); } return o; }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  // Bloque redondeado con brillo (se pinta UNA vez por color en un sprite; el bucle solo hace drawImage)
  function paintBlock(g, s, col, ghost) {
    var p = s * 0.06, w = s - p * 2, r = s * 0.2, gr;
    if (ghost) { rr(g, p + 1, p + 1, w - 2, w - 2, r); g.fillStyle = rgba(col, 0.16); g.fill(); g.lineWidth = Math.max(1.5, s * 0.075); g.strokeStyle = rgba(col, 0.92); g.stroke(); return; }
    rr(g, p, p, w, w, r); g.fillStyle = shade(col, -0.45); g.fill();
    rr(g, p + 1, p + 1, w - 2, w - 2, r); g.fillStyle = col; g.fill();
    gr = g.createLinearGradient(0, p, 0, p + w); gr.addColorStop(0, 'rgba(255,255,255,.42)'); gr.addColorStop(0.45, 'rgba(255,255,255,.04)'); gr.addColorStop(1, 'rgba(0,0,0,.3)');
    rr(g, p + 1, p + 1, w - 2, w - 2, r); g.fillStyle = gr; g.fill();
    rr(g, p + w * 0.16, p + w * 0.11, w * 0.5, w * 0.2, w * 0.1); g.fillStyle = 'rgba(255,255,255,.5)'; g.fill();
  }

  function start(container, opts) {
    opts = opts || {};
    var th = { accent: '#1E6F50', accent2: '#F4A6C8', bg: '#0f0f1a', text: '#fff' }, k;
    if (opts.theme) for (k in opts.theme) if (opts.theme[k]) th[k] = opts.theme[k];
    var durationMs = typeof opts.durationMs === 'number' && opts.durationMs > 0 ? opts.durationMs : 120000;
    var J = window.Juice.create(), E = J.ease;
    function sfx(n) { try { if (opts.sfx && opts.sfx.play) opts.sfx.play(n); } catch (e) { /* el sonido nunca rompe el juego */ } }
    function buzz(ms) { try { if (typeof opts.vibrate === 'function') opts.vibrate(ms); } catch (e) { /* idem */ } }
    var L = [];   // oyentes registrados: se quitan todos en stop()
    function on(t, ev, fn, o) { t.addEventListener(ev, fn, o); L.push([t, ev, fn, o]); }
    function el(tag, css) { var e = document.createElement(tag); e.style.cssText = css; return e; }

    // ---------- DOM: raíz, lienzo y botonera (estilos en línea) ----------
    var root = el('div', 'position:relative;width:100%;height:100%;display:flex;flex-direction:column;box-sizing:border-box;overflow:hidden;background:' + th.bg + ';color:' + th.text + ';font-family:' + FONT + ';touch-action:none;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent;');
    var area = el('div', 'flex:1 1 auto;min-height:0;display:flex;align-items:center;justify-content:center;overflow:hidden;touch-action:none;');
    var canvas = el('canvas', 'display:block;touch-action:none;user-select:none;-webkit-user-select:none;');
    var bar = el('div', 'flex:0 0 auto;display:flex;flex-direction:column;gap:8px;padding:6px 8px 10px;box-sizing:border-box;');
    var row = el('div', 'display:flex;gap:8px;');
    area.appendChild(canvas); bar.appendChild(row); root.appendChild(area); root.appendChild(bar); container.appendChild(root);
    if (root.clientHeight < 240) root.style.height = Math.round(window.innerHeight * 0.7) + 'px';   // el contenedor no tenía alto fijo
    var ctx = canvas.getContext('2d'), layer = document.createElement('canvas'), lctx = layer.getContext('2d');

    function svg(p) { return '<svg viewBox="0 0 24 24" width="34" height="34" fill="currentColor" aria-hidden="true" style="display:block;pointer-events:none">' + p + '</svg>'; }
    var IC = {
      left: '<path d="M16 4 5 12l11 8z"/>', right: '<path d="M8 4l11 8-11 8z"/>', down: '<path d="M4 8h16l-8 11z"/>',
      rot: '<path d="M19 12a7 7 0 1 1-2.05-4.95" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><path d="M18.5 2.5v6.5H12z"/>',
      drop: '<path d="M12 3v8" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><path d="M5.5 10h13L12 18z"/><path d="M5 22h14" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>'
    };
    var releases = [], BTN = 'rgba(255,255,255,.14)';
    function mkBtn(parent, html, label, bg, fg, css, down, up) {
      var b = document.createElement('button'), held = false;
      b.type = 'button'; b.tabIndex = -1; b.setAttribute('aria-label', label); b.innerHTML = html;
      b.style.cssText = 'flex:1 1 0;min-width:64px;height:68px;border:2px solid rgba(255,255,255,.22);border-radius:18px;background:' + bg + ';color:' + fg +
        ';font:900 22px ' + FONT + ';padding:0;margin:0;outline:none;cursor:pointer;-webkit-appearance:none;appearance:none;touch-action:none;user-select:none;-webkit-user-select:none;' +
        '-webkit-tap-highlight-color:transparent;display:flex;align-items:center;justify-content:center;gap:10px;box-shadow:inset 0 -4px 0 rgba(0,0,0,.25),0 3px 8px rgba(0,0,0,.35);' + (css || '');
      function release() { if (!held) return; held = false; b.style.transform = ''; b.style.filter = ''; if (up) up(); }
      on(b, 'pointerdown', function (e) {
        e.preventDefault(); if (held) return; held = true;
        b.style.transform = 'scale(.94) translateY(2px)'; b.style.filter = 'brightness(1.25)';
        try { b.setPointerCapture(e.pointerId); } catch (x) { /* sin captura */ }
        down();
      });
      on(b, 'pointerup', release); on(b, 'pointercancel', release); on(b, 'lostpointercapture', release);
      releases.push(release); parent.appendChild(b);
    }
    function repeater(d) {   // ◀ ▶: mueve al pulsar y repite mientras se mantiene
      var t = 0;
      mkBtn(row, svg(d < 0 ? IC.left : IC.right), d < 0 ? 'Izquierda' : 'Derecha', BTN, th.text, '',
        function () { move(d); t = setTimeout(function rep() { move(d); t = setTimeout(rep, ARR); }, DAS); },
        function () { clearTimeout(t); });
    }
    repeater(-1);
    mkBtn(row, svg(IC.rot), 'Girar', th.accent, '#fff', '', function () { rotate(); });
    repeater(1);
    mkBtn(row, svg(IC.down), 'Bajar', BTN, th.text, '', function () { softBtn = true; softStep(); }, function () { softBtn = false; });
    mkBtn(bar, svg(IC.drop) + '<span style="pointer-events:none">¡CAER!</span>', 'Caer del todo', th.accent2, '#2a1020', 'height:60px;', function () { hardDrop(); });
    function releaseAll() { for (var i = 0; i < releases.length; i++) releases[i](); softBtn = false; }
    on(window, 'pointerup', releaseAll); on(window, 'blur', releaseAll);
    function swallow(e) { e.preventDefault(); }   // sin scroll, zoom ni menú contextual
    on(root, 'touchstart', swallow, { passive: false }); on(root, 'touchmove', swallow, { passive: false }); on(root, 'touchend', swallow, { passive: false }); on(root, 'contextmenu', swallow);

    // ---------- Gestos sobre el lienzo ----------
    var g = { on: false, id: 0, x0: 0, y0: 0, lx: 0, ly: 0, t0: 0, axis: 0, acc: 0, done: false };
    function pDown(e) {
      e.preventDefault(); if (g.on) return;
      g.on = true; g.id = e.pointerId; g.x0 = g.lx = e.clientX; g.y0 = g.ly = e.clientY; g.t0 = performance.now(); g.axis = 0; g.acc = 0; g.done = false;
      try { area.setPointerCapture(e.pointerId); } catch (x) { /* sin captura */ }
    }
    function pMove(e) {
      if (!g.on || e.pointerId !== g.id || g.done) return;
      e.preventDefault();
      var dx = e.clientX - g.lx, dy = e.clientY - g.ly, tx = e.clientX - g.x0, ty = e.clientY - g.y0, ms = performance.now() - g.t0;
      g.lx = e.clientX; g.ly = e.clientY;
      if (!g.axis) {   // se decide el eje con el primer tramo de 28 px
        if (Math.abs(tx) >= SWIPE) { g.axis = 1; g.acc = tx; }
        else if (ty >= SWIPE) { g.axis = 2; g.acc = ty; }
        else if (ty <= -SWIPE) { g.done = true; rotate(); return; }   // deslizar arriba también gira
        else return;
      } else g.acc += g.axis === 1 ? dx : dy;
      if (g.axis === 1) { while (g.acc >= SWIPE) { move(1); g.acc -= SWIPE; } while (g.acc <= -SWIPE) { move(-1); g.acc += SWIPE; } }
      else {
        if (ty > FLICK_PX && ms < FLICK_MS) { g.done = true; hardDrop(); return; }   // latigazo: caída instantánea
        while (g.acc >= SWIPE) { softStep(); g.acc -= SWIPE; }
        if (g.acc < 0) g.acc = 0;
      }
    }
    function pUp(e) {
      if (!g.on || e.pointerId !== g.id) return;
      g.on = false; if (g.done) return;
      var ms = performance.now() - g.t0, tx = e.clientX - g.x0, ty = e.clientY - g.y0;
      if (!g.axis && ms < 320 && Math.abs(tx) < 14 && Math.abs(ty) < 14) rotate();         // toque corto = girar
      else if (g.axis === 2 && ty > FLICK_PX && ms < FLICK_MS + 60) hardDrop();
    }
    function pCancel(e) { if (g.on && e.pointerId === g.id) g.on = false; }
    on(area, 'pointerdown', pDown); on(area, 'pointermove', pMove); on(area, 'pointerup', pUp); on(area, 'pointercancel', pCancel);
    function onKey(e) {
      var c = e.key;
      if (c === 'ArrowLeft') move(-1); else if (c === 'ArrowRight') move(1);
      else if (c === 'ArrowUp' || c === 'x' || c === 'X') { if (!e.repeat) rotate(); }
      else if (c === 'ArrowDown') { if (!softKey) softStep(); softKey = true; }
      else if (c === ' ' || c === 'Spacebar') { if (!e.repeat) hardDrop(); }
      else return;
      e.preventDefault();
    }
    function onKeyUp(e) { if (e.key === 'ArrowDown') softKey = false; }
    on(window, 'keydown', onKey); on(window, 'keyup', onKeyUp);
    on(window, 'resize', resize); on(window, 'orientationchange', resize);
    var ro = window.ResizeObserver ? new ResizeObserver(function () { resize(); }) : null;
    if (ro) ro.observe(area);

    // ---------- Estado ----------
    var board = [], y, x;
    for (y = 0; y < ROWS; y++) { board.push([]); for (x = 0; x < COLS; x++) board[y].push(0); }
    var bag = [], cur = null, nextT = 0, score = 0, lines = 0, level = 1, combo = 0, pendingLvl = 0, won = false;
    var scoreStr = '0', linesStr = '0', levelStr = '1', metaStr = '0 / ' + META, timeStr = '', endStr = '', lastSecs = -1, scoreSc = 1;
    var state = 'cd', stT = 0, playT = 0, gravT = 0, lockT = 0, lockN = 0, softBtn = false, softKey = false, cdTick = -1;
    var clearRows = [], shift = [], flashX = [0, 0, 0, 0], flashY = [0, 0, 0, 0], flashN = 0, flashT = 9999, shakeUntil = 0;
    var ended = false, raf = 0, last = 0, overTimer = 0, Sx = 1, Sy = 1, ps = 0, bgImg = null, tokImg = {}, blk = [], gho = [];
    for (y = 0; y < ROWS; y++) shift.push(0);
    J.loadImage(BG).then(function (im) { if (!ended && im) { bgImg = im; paintStatic(); } });
    ['st_giyu', 'st_rengoku', 'ch_tanjiro'].forEach(function (n) { J.loadImage(TOK + n + '.png').then(function (im) { if (!ended) tokImg[n] = im; }); });

    function addScore(n) {
      score += n; scoreStr = String(score);
      if (n >= 10) J.tween({ from: 1.35, to: 1, dur: 0.25, update: function (v) { scoreSc = v; } });
      try { if (typeof opts.onScore === 'function') opts.onScore(score); } catch (e) { /* silencio */ }
    }
    function fits(s, px, py) {
      var n = s.length, yy, xx, bx, by;
      for (yy = 0; yy < n; yy++) for (xx = 0; xx < n; xx++) {
        if (!s[yy][xx]) continue; bx = px + xx; by = py + yy;
        if (bx < 0 || bx >= COLS || by >= ROWS) return false;
        if (by >= 0 && board[by][bx]) return false;
      }
      return true;
    }
    function takeBag() { if (!bag.length) bag = shuffle([0, 1, 2, 3, 4, 5, 6]); return bag.shift(); }
    function spawn() {
      var t = nextT, s = PIECES[t].s.map(function (r) { return r.slice(); });
      nextT = takeBag();
      cur = { t: t, s: s, x: Math.floor((COLS - s.length) / 2), y: s.length === 4 ? -1 : 0 };
      gravT = 0; lockT = 0; lockN = 0;
      if (!fits(s, cur.x, cur.y)) { cur.y--; if (!fits(s, cur.x, cur.y)) gameOver(false); }   // la pila llegó arriba
    }
    function grounded() { return !fits(cur.s, cur.x, cur.y + 1); }
    function touched() { if (grounded()) { lockT = 0; lockN++; } }
    function move(dx) { if (state !== 'play' || !cur || !fits(cur.s, cur.x + dx, cur.y)) return; cur.x += dx; touched(); }
    function rotate() {
      if (state !== 'play' || !cur) return;
      var r = rot(cur.s), i;
      for (i = 0; i < KICKS.length; i++) if (fits(r, cur.x + KICKS[i][0], cur.y + KICKS[i][1])) {
        cur.s = r; cur.x += KICKS[i][0]; cur.y += KICKS[i][1]; touched(); sfx('snap'); return;
      }
    }
    function stepDown(pts) { if (state !== 'play' || !cur || grounded()) return false; cur.y++; if (pts) addScore(pts); return true; }
    function softStep() { stepDown(1); }
    function hardDrop() {
      if (state !== 'play' || !cur) return;
      var n = 0; while (stepDown(0)) n++;
      if (n) addScore(n * 2);
      lock(true, n);
    }
    function lock(hard, dist) {
      var s = cur.s, n = s.length, t = cur.t, col = PIECES[t].c, top = false, yy, xx, bx, by, minX = COLS, maxX = -1, minY = ROWS, maxY = -1, full = [];
      flashN = 0;
      for (yy = 0; yy < n; yy++) for (xx = 0; xx < n; xx++) {
        if (!s[yy][xx]) continue; bx = cur.x + xx; by = cur.y + yy;
        if (by < 0) { top = true; continue; }
        board[by][bx] = t + 1; flashX[flashN] = bx; flashY[flashN] = by; flashN++;
        if (bx < minX) minX = bx; if (bx > maxX) maxX = bx; if (by < minY) minY = by; if (by > maxY) maxY = by;
      }
      flashT = 0; cur = null;
      if (top) { gameOver(false); return; }
      if (hard) {   // golpe seco: temblor, hit-stop, «¡ZAS!» y polvo bajo la pieza
        sfx('whoosh'); buzz(25); shake(dist > 3 ? 0.4 : 0.25); J.hitStop(45);
        J.text(BX + (minX + maxX + 1) / 2 * CELL, BY + minY * CELL - 6, '¡ZAS!', { size: 28, color: '#fff', life: 0.7, rise: 46 });
        for (xx = 0; xx < flashN; xx++) if (flashY[xx] === maxY) J.burst(BX + flashX[xx] * CELL + CELL / 2, BY + (maxY + 1) * CELL, { n: 4, colors: ['#ffffff', col], speed: 150, life: 0.45, size: 5, gravity: 250, angle: -Math.PI / 2, spread: 1.8, shape: 'circle' });
      } else sfx('pop');
      for (yy = 0; yy < ROWS; yy++) { for (xx = 0; xx < COLS; xx++) if (!board[yy][xx]) break; if (xx === COLS) full.push(yy); }
      if (full.length) startClear(full); else { combo = 0; spawn(); }
    }
    function startClear(rows) {
      var n = rows.length, i, j, yy, cx = BX + BW / 2, cy = BY + (rows[0] + rows[n - 1] + 1) / 2 * CELL, pts, nl;
      clearRows = rows; state = 'clear'; stT = 0; lines += n; combo++;
      linesStr = String(lines); metaStr = Math.min(lines, META) + ' / ' + META;
      pts = PTS[n] + (combo > 1 ? 50 * (combo - 1) : 0); addScore(pts);
      sfx(n >= 4 ? 'levelup' : 'slash'); buzz(n >= 4 ? 90 : 40); shake(0.22 + 0.14 * n); J.hitStop(n >= 4 ? 80 : 55);
      for (i = 0; i < n; i++) { yy = rows[i]; for (j = 1; j < COLS; j += 3) J.burst(BX + j * CELL + CELL / 2, BY + yy * CELL + CELL / 2, { n: 5, colors: [PIECES[board[yy][j] - 1].c, PIECES[board[yy][j + 1] - 1].c, '#ffffff'], speed: 230, life: 0.8, size: 7, gravity: 600 }); }
      if (n >= 4) { J.text(cx, cy - 26, '¡RESPIRACIÓN TOTAL!', { size: 23, color: '#9fe7ff', life: 1.5, rise: 36 }); J.text(cx, cy + 14, '+' + pts, { size: 34, color: '#fff', life: 1.3, rise: 50 }); }
      else J.text(cx, cy - 6, '+' + pts + (n === 2 ? ' ¡DOBLE!' : n === 3 ? ' ¡TRIPLE!' : ''), { size: 26, color: th.accent2, life: 1.1, rise: 50 });
      if (combo > 1) J.text(cx, cy + 40, '¡COMBO ×' + combo + '!', { size: 19, color: '#ffd54f', life: 1.1, rise: 40 });
      nl = 1 + Math.floor(lines / 10); if (nl > level) { level = nl; levelStr = String(level); pendingLvl = 1; }
    }
    function collapse() {   // quita las filas limpias; las de arriba caen (animación en 'fall' con shift[])
      var keep = [], from = [], free = [], yy, i;
      for (yy = 0; yy < ROWS; yy++) { if (clearRows.indexOf(yy) < 0) { keep.push(board[yy]); from.push(yy); } else free.push(board[yy]); }
      for (yy = 0; yy < ROWS; yy++) {
        if (yy < free.length) { board[yy] = free[yy]; for (i = 0; i < COLS; i++) board[yy][i] = 0; shift[yy] = 0; }
        else { board[yy] = keep[yy - free.length]; shift[yy] = yy - from[yy - free.length]; }
      }
      clearRows = []; state = 'fall'; stT = 0;
    }
    function shake(a) { J.shake(a); shakeUntil = performance.now() + 800; }
    function gameOver(byTime) {
      if (state === 'over' || ended) return;
      state = 'over'; stT = 0; won = lines >= META; softKey = false; releaseAll();
      endStr = lines + (lines === 1 ? ' línea' : ' líneas') + ' · nivel ' + level;
      sfx(won ? 'win' : byTime ? 'ding' : 'lose'); buzz(won ? 80 : 120);
      if (won) for (var i = 0; i < 3; i++) J.burst(BX + BW * (0.25 + 0.25 * i), BY + BH * 0.4, { n: 14, colors: [th.accent2, '#ffffff', '#ffd54f', '#9fe7ff'], speed: 260, life: 1.2, size: 8, gravity: 400, shape: i % 2 ? 'star' : 'square' });
      overTimer = setTimeout(endNow, END_MS);
    }
    function endNow() {
      if (ended) return;
      ended = true; cleanup();
      try { if (typeof opts.onEnd === 'function') opts.onEnd({ score: score, won: won }); } catch (e) { /* silencio */ }
    }
    function cleanup() {
      cancelAnimationFrame(raf); clearTimeout(overTimer); releaseAll();
      for (var i = 0; i < L.length; i++) L[i][0].removeEventListener(L[i][1], L[i][2], L[i][3]);
      L.length = 0; if (ro) ro.disconnect(); J.reset();
      if (root.parentNode) root.parentNode.removeChild(root);
    }
    function updatePlay(dt) {
      if (!cur) return;
      var soft = softBtn || softKey, iv;
      if (grounded()) { gravT = 0; lockT += dt; if (lockT >= LOCK_MS || lockN > 14) lock(false, 0); return; }
      iv = soft ? SOFT_MS : GRAV[Math.min(level, GRAV.length) - 1];
      gravT += dt;
      while (gravT >= iv && cur) { gravT -= iv; if (!stepDown(soft ? 1 : 0)) { gravT = 0; break; } }
    }
    function update(dt) {
      stT += dt;
      if (state === 'cd') {
        var i = Math.min(3, Math.floor(stT / 700));
        if (i !== cdTick) { cdTick = i; sfx(i < 3 ? 'drum' : 'whoosh'); }
        if (stT >= CD_MS) { state = 'play'; stT = 0; spawn(); }
        return;
      }
      if (state === 'over') return;
      playT += dt; if (flashT < 999) flashT += dt;
      if (playT >= durationMs) { gameOver(true); return; }
      if (state === 'play') updatePlay(dt);
      else if (state === 'clear') { if (stT >= CLEAR_MS) collapse(); }
      else if (state === 'fall' && stT >= FALL_MS) {
        state = 'play'; stT = 0;
        if (pendingLvl) { pendingLvl = 0; sfx('ding'); shake(0.2); J.text(BX + BW / 2, BY + BH * 0.35, '¡NIVEL ' + level + '!', { size: 30, color: '#ffd54f', life: 1.2, rise: 40 }); }
        spawn();
      }
    }

    // ---------- Tamaño: encaja en la zona libre, nítido en pantallas 2x/3x ----------
    function resize() {
      var aw = Math.max(1, area.clientWidth), ah = Math.max(1, area.clientHeight), s = Math.min(aw / W, ah / H), dpr = Math.min(3, window.devicePixelRatio || 1), cw, ch;
      if (!(s > 0)) s = 1;
      cw = Math.max(1, Math.floor(W * s)); ch = Math.max(1, Math.floor(H * s));
      canvas.style.width = cw + 'px'; canvas.style.height = ch + 'px';
      canvas.width = layer.width = Math.round(cw * dpr); canvas.height = layer.height = Math.round(ch * dpr);
      Sx = canvas.width / W; Sy = canvas.height / H;
      makeSprites(); paintStatic();
    }
    function makeSprites() {
      ps = Math.max(4, Math.ceil(CELL * Sx));
      for (var i = 0; i < 7; i++) {
        blk[i] = blk[i] || document.createElement('canvas'); gho[i] = gho[i] || document.createElement('canvas');
        blk[i].width = blk[i].height = gho[i].width = gho[i].height = ps;
        paintBlock(blk[i].getContext('2d'), ps, PIECES[i].c, false); paintBlock(gho[i].getContext('2d'), ps, PIECES[i].c, true);
      }
    }
    function panel(g, x, y, w, h) { rr(g, x, y, w, h, 10); g.fillStyle = 'rgba(255,255,255,.07)'; g.fill(); g.lineWidth = 1; g.strokeStyle = 'rgba(255,255,255,.16)'; g.stroke(); }
    function paintStatic() {   // capa fija: fondo con velo, banda del marcador, tablero con marco brillante y rejilla, columna lateral
      var g = lctx, i, s, dw, dh, glow = [[16, 0.07], [9, 0.16], [4, 0.4], [2, 1]];
      g.setTransform(Sx, 0, 0, Sy, 0, 0);
      g.fillStyle = th.bg; g.fillRect(0, 0, W, H);
      if (bgImg) { s = Math.max(W / bgImg.width, H / bgImg.height); dw = bgImg.width * s; dh = bgImg.height * s; g.drawImage(bgImg, (W - dw) / 2, 0, dw, dh); }
      g.fillStyle = 'rgba(10,6,22,.6)'; g.fillRect(0, 0, W, H);
      g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(0, 0, W, 86);
      g.textBaseline = 'middle'; g.fillStyle = 'rgba(255,255,255,.62)'; g.font = '800 11px ' + FONT;
      g.textAlign = 'left'; g.fillText('PUNTOS', BX, 20); g.textAlign = 'right'; g.fillText('TIEMPO', W - 8, 20);
      g.fillStyle = 'rgba(8,6,20,.78)'; rr(g, BX, BY, BW, BH, 6); g.fill();
      for (i = 0; i < glow.length; i++) { g.lineWidth = glow[i][0]; g.strokeStyle = rgba(th.accent2, glow[i][1]); rr(g, BX - 3, BY - 3, BW + 6, BH + 6, 9); g.stroke(); }
      g.strokeStyle = 'rgba(255,255,255,.07)'; g.lineWidth = 1; g.beginPath();
      for (i = 1; i < COLS; i++) { g.moveTo(BX + i * CELL, BY); g.lineTo(BX + i * CELL, BY + BH); }
      for (i = 1; i < ROWS; i++) { g.moveTo(BX, BY + i * CELL); g.lineTo(BX + BW, BY + i * CELL); }
      g.stroke();
      g.textAlign = 'center'; g.fillStyle = 'rgba(255,255,255,.62)'; g.font = '800 10px ' + FONT;
      g.fillText('SIGUIENTE', SX + SW / 2, BY + 4); panel(g, SX, BY + 14, SW, SW);
      g.fillStyle = 'rgba(255,255,255,.62)'; g.fillText('LÍNEAS', SX + SW / 2, BY + 178); panel(g, SX, BY + 186, SW, 40);
      g.fillStyle = 'rgba(255,255,255,.62)'; g.fillText('NIVEL', SX + SW / 2, BY + 240); panel(g, SX, BY + 248, SW, 40);
      g.fillStyle = 'rgba(255,255,255,.62)'; g.fillText('META', SX + SW / 2, BY + 304);
      g.fillStyle = 'rgba(229,57,53,.55)'; g.font = '900 30px ' + FONT; g.fillText('滅', SX + SW / 2, BY + 408);
      g.setTransform(1, 0, 0, 1, 0, 0);
    }

    // ---------- Dibujo por fotograma ----------
    function cells(s, px, py, sp) {   // dibuja las casillas de una pieza con el sprite sp (solo las que están dentro del tablero)
      var n = s.length, yy, xx;
      for (yy = 0; yy < n; yy++) for (xx = 0; xx < n; xx++) if (s[yy][xx] && py + yy >= 0) ctx.drawImage(sp, BX + (px + xx) * CELL, BY + (py + yy) * CELL, CELL, CELL);
    }
    function drawBoard() {
      var falling = state === 'fall', kf = falling ? E.outCubic(Math.min(1, stT / FALL_MS)) : 1, yy, xx, t, off, gy, i;
      ctx.save(); ctx.beginPath(); ctx.rect(BX, BY, BW, BH); ctx.clip();
      for (yy = 0; yy < ROWS; yy++) {
        off = falling && shift[yy] ? -shift[yy] * CELL * (1 - kf) : 0;
        for (xx = 0; xx < COLS; xx++) { t = board[yy][xx]; if (t) ctx.drawImage(blk[t - 1], BX + xx * CELL, BY + yy * CELL + off, CELL, CELL); }
      }
      if (cur) {
        gy = cur.y; while (fits(cur.s, cur.x, gy + 1)) gy++;
        if (gy !== cur.y) cells(cur.s, cur.x, gy, gho[cur.t]);   // pieza fantasma: dónde caerá
        cells(cur.s, cur.x, cur.y, blk[cur.t]);
      }
      if (flashT < 180) {   // destello de la pieza recién fijada
        ctx.globalAlpha = (1 - flashT / 180) * 0.75; ctx.fillStyle = '#fff';
        for (i = 0; i < flashN; i++) { rr(ctx, BX + flashX[i] * CELL + 2, BY + flashY[i] * CELL + 2, CELL - 4, CELL - 4, 5); ctx.fill(); }
        ctx.globalAlpha = 1;
      }
      if (state === 'clear') drawClear(Math.min(1, stT / CLEAR_MS));
      ctx.restore();
    }
    function slash(k, flip) {   // tajo de katana: cabeza que cruza el tablero en diagonal con estela
      var h = Math.min(1, k * 1.4), t = Math.max(0, h - 0.4), ax = BX - 30, ay = flip ? BY - 30 : BY + BH + 30, bx = BX + BW + 30, by = flip ? BY + BH + 30 : BY - 30, i, a, b;
      if (k <= 0 || t >= 1) return;
      ctx.lineCap = 'round';
      for (i = 0; i < 3; i++) {
        a = t + (h - t) * i / 3; b = t + (h - t) * (i + 1) / 3; ctx.globalAlpha = 0.3 + 0.35 * i;
        ctx.beginPath(); ctx.moveTo(ax + (bx - ax) * a, ay + (by - ay) * a); ctx.lineTo(ax + (bx - ax) * b, ay + (by - ay) * b);
        ctx.strokeStyle = 'rgba(150,215,255,.6)'; ctx.lineWidth = 24; ctx.stroke();
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 4 + i * 2; ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
    function drawClear(k) {
      var a = (1 - k) * (0.5 + 0.5 * Math.abs(Math.sin(k * 15))), i;
      ctx.fillStyle = '#fff'; ctx.globalAlpha = a;
      for (i = 0; i < clearRows.length; i++) ctx.fillRect(BX, BY + clearRows[i] * CELL, BW, CELL);
      ctx.globalAlpha = 1;
      slash(k, false);
      if (clearRows.length >= 4) slash(k - 0.18, true);
    }
    function drawHUD(now) {
      var left = Math.max(0, durationMs - playT), secs = Math.ceil(left / 1000), hot = state !== 'cd' && left <= 10000, bw = W - 16, fw = bw * left / durationMs;
      if (secs !== lastSecs) { lastSecs = secs; timeStr = secs + ' s'; }
      ctx.textBaseline = 'middle'; ctx.textAlign = 'left'; ctx.fillStyle = '#fff'; ctx.font = '900 34px ' + FONT;
      ctx.save(); ctx.translate(BX, 50); ctx.scale(scoreSc, scoreSc); ctx.fillText(scoreStr, 0, 0); ctx.restore();
      ctx.textAlign = 'right'; ctx.fillStyle = hot ? '#ff5252' : '#fff'; ctx.font = '900 30px ' + FONT; ctx.fillText(timeStr, W - 8, 50);
      ctx.fillStyle = 'rgba(255,255,255,.14)'; rr(ctx, 8, 70, bw, 9, 4.5); ctx.fill();
      if (fw > 2) { ctx.fillStyle = hot ? (Math.floor(now / 250) % 2 ? '#ff5252' : '#ff8a80') : th.accent2; rr(ctx, 8, 70, fw, 9, 4.5); ctx.fill(); }
    }
    function drawSide(now) {
      var p = PIECES[nextT], s = p.s, n = s.length, m = 14, x0 = n, x1 = -1, y0 = n, y1 = -1, xx, yy, ox, oy, mw = SW - 12, mf = Math.min(1, lines / META) * mw;
      for (yy = 0; yy < n; yy++) for (xx = 0; xx < n; xx++) if (s[yy][xx]) { if (xx < x0) x0 = xx; if (xx > x1) x1 = xx; if (yy < y0) y0 = yy; if (yy > y1) y1 = yy; }
      ox = SX + (SW - (x1 - x0 + 1) * m) / 2; oy = BY + 14 + (SW - (y1 - y0 + 1) * m) / 2;
      for (yy = y0; yy <= y1; yy++) for (xx = x0; xx <= x1; xx++) if (s[yy][xx]) ctx.drawImage(blk[nextT], ox + (xx - x0) * m, oy + (yy - y0) * m, m, m);
      J.token(ctx, tokImg[p.tok], SX + SW / 2, BY + 120 + Math.sin(now / 400) * 2, 24, { ring: 3, ringColor: p.c, color: p.c });
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = p.c; ctx.font = '800 11px ' + FONT; ctx.fillText(p.n, SX + SW / 2, BY + 156);
      ctx.fillStyle = '#fff'; ctx.font = '900 26px ' + FONT; ctx.fillText(linesStr, SX + SW / 2, BY + 207); ctx.fillText(levelStr, SX + SW / 2, BY + 269);
      ctx.fillStyle = 'rgba(255,255,255,.14)'; rr(ctx, SX + 6, BY + 314, mw, 8, 4); ctx.fill();
      if (mf > 1) { ctx.fillStyle = lines >= META ? '#ffd54f' : '#5ce39a'; rr(ctx, SX + 6, BY + 314, mf, 8, 4); ctx.fill(); }
      ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.font = '800 12px ' + FONT; ctx.fillText(metaStr, SX + SW / 2, BY + 334);
    }
    function drawCountdown() {
      var i = Math.min(3, Math.floor(stT / 700)), tk = i < 3 ? (stT - i * 700) / 700 : (stT - 2100) / 400, cx = BX + BW / 2, cy = BY + BH / 2, sc = E.outBack(Math.min(1, tk * 3)), txt = i < 3 ? String(3 - i) : '¡YA!', ns = 1 + 0.5 * Math.max(0, 1 - tk * 4);
      ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(0, 0, W, H);
      J.token(ctx, tokImg.st_giyu, cx, cy - 96, 52, { ring: 4, ringColor: '#2F8CFF', color: '#2F8CFF', sx: sc, sy: sc });
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = th.accent2; ctx.font = '900 20px ' + FONT; ctx.fillText('Bloques Hashira', cx, cy - 22);
      ctx.save(); ctx.translate(cx, cy + 46); ctx.scale(ns, ns); ctx.lineWidth = 8; ctx.strokeStyle = 'rgba(0,0,0,.6)'; ctx.fillStyle = '#fff';
      ctx.font = '900 ' + (i < 3 ? 96 : 72) + 'px ' + FONT; ctx.strokeText(txt, 0, 0); ctx.fillText(txt, 0, 0); ctx.restore();
      ctx.fillStyle = 'rgba(255,255,255,.88)'; ctx.font = '700 14px ' + FONT;
      ctx.fillText('Desliza ◀ ▶ para mover · toca para girar', cx, cy + 130); ctx.fillText('Desliza ▼ para bajar · latigazo = ¡CAER!', cx, cy + 152);
    }
    function drawOver() {
      var cx = BX + BW / 2, cy = BY + BH / 2, k = E.outBack(Math.min(1, stT / 350));
      ctx.fillStyle = 'rgba(0,0,0,.66)'; ctx.fillRect(0, 0, W, H);
      ctx.save(); ctx.translate(cx, cy); ctx.scale(k, k);
      ctx.fillStyle = 'rgba(20,14,40,.94)'; rr(ctx, -132, -122, 264, 244, 22); ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = won ? '#ffd54f' : th.accent2; ctx.stroke();
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = won ? '#ffd54f' : th.accent2; ctx.font = '900 46px ' + FONT; ctx.fillText(won ? '¡Meta!' : '¡Fin!', 0, -72);
      ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.font = '800 13px ' + FONT; ctx.fillText('PUNTOS', 0, -32);
      ctx.fillStyle = '#fff'; ctx.font = '900 44px ' + FONT; ctx.fillText(scoreStr, 0, 4);
      ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.font = '700 16px ' + FONT; ctx.fillText(endStr, 0, 48);
      ctx.fillStyle = won ? '#ffd54f' : th.accent2; ctx.font = '800 15px ' + FONT; ctx.fillText(won ? '¡10 líneas! ¡Eres un Hashira!' : '¡Casi! La meta son 10 líneas', 0, 86);
      ctx.restore();
    }
    function draw(now) {
      var o;
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(layer, 0, 0);
      ctx.setTransform(Sx, 0, 0, Sy, 0, 0);
      if (now < shakeUntil) { o = J.shakeOffset(8); ctx.translate(o[0], o[1]); }
      drawBoard();
      J.draw(ctx);
      drawHUD(now); drawSide(now);
      if (state === 'cd') drawCountdown(); else if (state === 'over') drawOver();
    }
    function frame(now) {
      raf = requestAnimationFrame(frame);
      var dt = last ? Math.min(100, now - last) : 16; last = now;
      J.update(dt / 1000);
      if (!J.frozen()) update(dt);   // hit-stop: el juego se congela unos ms, las partículas no
      if (!ended) draw(now);
    }
    nextT = takeBag(); resize();
    raf = requestAnimationFrame(frame);
    return { stop: function () { if (ended) return; ended = true; cleanup(); } };   // si paran antes del fin, no hay onEnd
  }

  window.MiniGames.tetris = { id: 'tetris', title: 'Bloques Hashira', world: 'demonslayer', start: start };
})();
