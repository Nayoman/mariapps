/* memory.js — «Parejas de pegatinas» (mundo My Hero Academia). Memoria 4×4 con las pegatinas del álbum (window.MK_STICKERS):
   se giran de dos en dos; si son iguales hacen «pop», se quedan con borde dorado, suena la pegatina, salta confeti y «+20»;
   si no, tiemblan y se dan la vuelta. Sin canvas de juego: HTML + CSS en línea (un <style> con prefijo .mgmem- que vive dentro
   del contenedor y se va con stop()); el confeti (Juice) usa un canvas encima que solo se enciende mientras dura.
   Contrato: window.MiniGames.memory.start(container, opts) → { stop() }. Script plano, sin módulos ni red. */
(function () {
  'use strict';
  window.MiniGames = window.MiniGames || {};

  var PAIRS = 8, LIMIT = 120, FAST = 60, PTS = 20, BONUS = 100, SHOW_MS = 700, CD_MS = 750, END_MS = 1500, ASPECT = 0.74;
  var BG = '../ciencias/assets/img/bg_mha.webp', BACK = '../shared/img/icon_album.webp', OCHACO = 'assets/tokens/ch_ochaco.png';
  var FONT = '-apple-system,BlinkMacSystemFont,"SF Pro Rounded","Segoe UI",Roboto,sans-serif', GOLD = '#FFD54F';
  var OUT = 'cubic-bezier(.23,1,.32,1)', BACKOUT = 'cubic-bezier(.34,1.56,.64,1)';
  var STAR = '<path d="M12 2.2l2.9 6.4 7 .7-5.3 4.7 1.5 6.9L12 17.4l-6.1 3.5 1.5-6.9-5.3-4.7 7-.7z"/>';
  var ICONS = [
    '<svg viewBox="0 0 24 24" fill="' + GOLD + '">' + STAR + '</svg>',
    '<svg viewBox="0 0 24 24"><rect x="2.5" y="6.5" width="11" height="15" rx="2.5" fill="#7ee0ff" transform="rotate(-12 8 14)"/><rect x="10.5" y="3" width="11" height="15" rx="2.5" fill="#fff"/></svg>',
    '<svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round"><circle cx="12" cy="13.5" r="8" stroke="#fff"/><path d="M12 9.5v4l2.8 1.8" stroke="' + GOLD + '"/><path d="M9.5 2.8h5" stroke="#fff"/></svg>'
  ];
  var NOPE = ['¡Casi! Recuerda dónde están', '¡Otra vez!', '¡Tú puedes!', '¡Fíjate bien!'];
  var FALLBACK = 'luffy:onepiece zoro:onepiece nami:onepiece tanjiro:demonslayer nezuko:demonslayer hinata:haikyuu kageyama:haikyuu ochaco:mha';
  var CSS = [
    '.mgmem-root{position:absolute;inset:0;overflow:hidden;display:flex;flex-direction:column;color:#fff;font-family:' + FONT + ';background:#0d1230;touch-action:none;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;-webkit-tap-highlight-color:transparent}',
    '.mgmem-root *{box-sizing:border-box}',
    '.mgmem-bg{position:absolute;inset:0;background:linear-gradient(rgba(6,10,32,.72),rgba(6,10,32,.5) 42%,rgba(6,10,32,.8)),url(' + BG + ') center/cover no-repeat}',
    '.mgmem-hud{position:relative;display:flex;gap:8px;padding:10px 12px 0}',
    '.mgmem-pill{flex:1 1 0;min-width:0;height:56px;display:flex;align-items:center;justify-content:center;gap:7px;border-radius:18px;background:rgba(10,14,40,.68);border:1.5px solid rgba(255,255,255,.16);box-shadow:0 4px 14px rgba(0,0,0,.28)}',
    '.mgmem-pill svg{width:26px;height:26px;flex:none}',
    '.mgmem-pill span{display:flex;flex-direction:column;align-items:flex-start;line-height:1}',
    '.mgmem-pill b{font-size:23px;font-weight:900;font-variant-numeric:tabular-nums}',
    '.mgmem-pill small{font-size:9px;font-weight:800;letter-spacing:.05em;opacity:.75;margin-top:4px}',
    '.mgmem-bump{animation:mgmem-bump 380ms ' + OUT + '}',
    '.mgmem-narrow .mgmem-hud{gap:6px;padding:8px 8px 0}.mgmem-narrow .mgmem-pill{gap:4px}.mgmem-narrow .mgmem-pill svg{width:20px;height:20px}.mgmem-narrow .mgmem-pill small{font-size:8.5px;letter-spacing:0}',
    '.mgmem-bar{position:relative;height:8px;margin:9px 14px 0;border-radius:4px;background:rgba(255,255,255,.16);overflow:hidden}',
    '.mgmem-bar i{position:absolute;inset:0;border-radius:4px;background:' + GOLD + ';transform-origin:0 50%;transition:transform 260ms linear,background-color 300ms}',
    '.mgmem-wrap{position:relative;flex:1 1 auto;min-height:0;display:flex;align-items:center;justify-content:center}',
    '.mgmem-board{display:grid;grid-template-columns:repeat(4,min(21vw,13vh));gap:10px}',
    '.mgmem-card{position:relative;aspect-ratio:' + ASPECT + ';perspective:900px;cursor:pointer}',
    '.mgmem-in{position:absolute;inset:0;transform-style:preserve-3d;-webkit-transform-style:preserve-3d;transition:transform 250ms ' + OUT + '}',
    '.mgmem-card.up .mgmem-in{transform:rotateY(180deg)}',
    '.mgmem-face{position:absolute;inset:0;border-radius:var(--r,12px);overflow:hidden;-webkit-backface-visibility:hidden;backface-visibility:hidden;border:3px solid var(--c);box-shadow:0 6px 14px rgba(0,0,0,.4)}',
    '.mgmem-back{display:flex;align-items:center;justify-content:center;background:radial-gradient(circle at 50% 42%,rgba(255,255,255,.3),rgba(255,255,255,0) 62%),repeating-linear-gradient(45deg,rgba(255,255,255,.07) 0 6px,rgba(255,255,255,0) 6px 12px),linear-gradient(160deg,#4253b8,#1b2158)}',
    '.mgmem-back img{width:66%;border-radius:22%;box-shadow:0 4px 10px rgba(0,0,0,.35)}',
    '.mgmem-front{transform:rotateY(180deg);background:#fff}',
    '.mgmem-front img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 18%}',
    '.mgmem-front b{position:absolute;left:0;right:0;bottom:0;padding:3px 2px 4px;background:var(--c);font-size:var(--fs,12px);font-weight:900;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-shadow:0 1px 2px rgba(0,0,0,.45)}',
    '.mgmem-card.ok .mgmem-front{border-color:' + GOLD + ';box-shadow:0 0 0 3px rgba(255,213,79,.5),0 0 22px rgba(255,213,79,.8)}',
    '.mgmem-card.ok .mgmem-front:after{content:"★";position:absolute;top:1px;right:5px;color:' + GOLD + ';font-size:calc(var(--fs,12px)*1.6);text-shadow:0 1px 3px rgba(0,0,0,.6)}',
    '.mgmem-card.pop{animation:mgmem-pop 420ms ' + OUT + '}',
    '.mgmem-card.no{animation:mgmem-no 380ms ease-in-out}',
    '.mgmem-card.deal{animation:mgmem-deal 480ms ' + BACKOUT + ' both}',
    '@keyframes mgmem-pop{40%{transform:scale(1.12)}}',
    '@keyframes mgmem-no{20%{transform:translateX(-7px) rotate(-2deg)}40%{transform:translateX(6px) rotate(2deg)}60%{transform:translateX(-4px)}80%{transform:translateX(3px)}}',
    '@keyframes mgmem-deal{0%{opacity:0;transform:translateY(46px) scale(.5) rotate(-10deg)}}',
    '@keyframes mgmem-bump{40%{transform:scale(1.15)}}',
    '@keyframes mgmem-in{0%{opacity:0;transform:scale(.3)}}',
    '@keyframes mgmem-bob{to{transform:translateY(-9px)}}',
    '.mgmem-strip{position:relative;flex:none;display:flex;align-items:center;gap:12px;height:86px;padding:0 14px 12px}',
    '.mgmem-och{width:66px;height:66px;flex:none;border-radius:50%;box-shadow:0 4px 14px rgba(0,0,0,.45)}',
    '.mgmem-say{position:relative;flex:1;min-width:0;padding:12px 14px;border-radius:18px;background:#fff;color:#1b2158;font-size:16px;font-weight:800;text-align:center;box-shadow:0 4px 14px rgba(0,0,0,.3)}',
    '.mgmem-say.hop{animation:mgmem-hop 320ms ' + OUT + '}',
    '@keyframes mgmem-hop{40%{transform:scale(1.05)}}',
    '.mgmem-say:before{content:"";position:absolute;left:-9px;top:50%;margin-top:-9px;border:9px solid transparent;border-left:0;border-right-color:#fff}',
    '.mgmem-ov{position:absolute;inset:0;z-index:5;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;padding:16px;background:rgba(4,8,28,.62);text-align:center;transition:opacity 260ms ease}',
    '.mgmem-ov.hide{opacity:0;pointer-events:none}',
    '.mgmem-cdi{width:132px;height:132px;border-radius:50%;box-shadow:0 0 0 6px #2BA84A,0 12px 30px rgba(0,0,0,.5);animation:mgmem-bob .9s ease-in-out infinite alternate}',
    '.mgmem-ttl{margin-top:10px;font-size:26px;font-weight:900;color:' + GOLD + ';text-shadow:0 2px 8px rgba(0,0,0,.6)}',
    '.mgmem-num{min-height:1.05em;font-size:120px;font-weight:900;line-height:1.05;text-shadow:0 6px 0 rgba(0,0,0,.35),0 0 30px rgba(43,168,74,.7)}',
    '.mgmem-num.go{animation:mgmem-in 420ms ' + BACKOUT + '}',
    '.mgmem-tip{font-size:20px;font-weight:800;text-shadow:0 2px 6px rgba(0,0,0,.7)}',
    '.mgmem-panel{width:min(300px,88%);padding:20px 18px 18px;border-radius:26px;background:rgba(16,22,62,.96);border:3px solid ' + GOLD + ';box-shadow:0 18px 50px rgba(0,0,0,.55);animation:mgmem-in 420ms ' + BACKOUT + '}',
    '.mgmem-fin{font-size:56px;font-weight:900;line-height:1;color:' + GOLD + '}',
    '.mgmem-panel small{display:block;margin-top:12px;font-size:12px;font-weight:800;letter-spacing:.08em;opacity:.7}',
    '.mgmem-pts{font-size:52px;font-weight:900;line-height:1.1}',
    '.mgmem-stars{display:flex;justify-content:center;gap:10px;margin:6px 0 10px}',
    '.mgmem-stars svg{width:46px;height:46px;fill:rgba(255,255,255,.18);animation:mgmem-in 420ms ' + BACKOUT + ' both}',
    '.mgmem-stars svg.on{fill:' + GOLD + '}',
    '.mgmem-line{margin-top:4px;font-size:14px;font-weight:700;opacity:.88}',
    '.mgmem-gold{color:' + GOLD + ';opacity:1;font-weight:900}',
    '.mgmem-msg{margin-top:10px;font-size:19px;font-weight:900;color:#7CFFB2}',
    '.mgmem-fx{position:absolute;left:0;top:0;width:100%;height:100%;z-index:6;pointer-events:none;display:none}'
  ].join('');

  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  // 8 pegatinas al azar, repartidas por series (con las 24 del álbum salen 2 de cada serie: 4 colores × 2 parejas)
  function pickStickers() {
    var all = (window.MK_STICKERS || []).filter(function (s) { return s && s.img && s.name; }).map(function (s) { return { name: s.name, series: s.series, src: '../' + s.img }; });
    if (all.length < PAIRS) all = FALLBACK.split(' ').map(function (p) { p = p.split(':'); return { name: p[0].charAt(0).toUpperCase() + p[0].slice(1), series: p[1], src: 'assets/tokens/ch_' + p[0] + '.png' }; });
    var by = {}, keys = [], out = [], i, list;
    all.forEach(function (s) { if (!by[s.series]) { by[s.series] = []; keys.push(s.series); } by[s.series].push(s); });
    keys.forEach(function (k) { shuffle(by[k]); }); shuffle(keys);
    for (i = 0; out.length < PAIRS && i < 200; i++) { list = by[keys[i % keys.length]]; if (list.length) out.push(list.pop()); }
    return out;
  }

  function start(container, opts) {
    opts = opts || {};
    var th = { accent: '#2BA84A', accent2: GOLD }, k;
    if (opts.theme) for (k in opts.theme) if (opts.theme[k]) th[k] = opts.theme[k];
    function sfx(n, v) { try { if (opts.sfx && opts.sfx.play) opts.sfx.play(n, v); } catch (e) { /* el sonido nunca rompe el juego */ } }
    function buzz(p) { try { if (typeof opts.vibrate === 'function') opts.vibrate(p); } catch (e) { /* idem */ } }
    var J = window.Juice.create(), timers = [], raf = 0, last = 0, ro = null, ended = false;
    function later(fn, ms) { timers.push(setTimeout(function () { if (!ended) fn(); }, ms)); }
    function replay(el, cls) { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }   // reinicia una animación CSS
    function fmt(s) { return Math.floor(s / 60) + ':' + (s % 60 < 10 ? '0' : '') + (s % 60); }
    function pill(i, val, label) { return '<div class="mgmem-pill">' + ICONS[i] + '<span><b>' + val + '</b><small>' + label + '</small></span></div>'; }

    // ---------- DOM: fondo con velo, marcador, tablero, Ochaco con bocadillo, cuenta atrás y capa de confeti ----------
    var root = document.createElement('div');
    root.className = 'mgmem-root';
    root.innerHTML = '<style>' + CSS + '</style><div class="mgmem-bg"></div>' +
      '<div class="mgmem-hud">' + pill(0, '0/' + PAIRS, 'PAREJAS') + pill(1, '0', 'MOVIMIENTOS') + pill(2, '0:00', 'TIEMPO') + '</div>' +
      '<div class="mgmem-bar"><i></i></div><div class="mgmem-wrap"><div class="mgmem-board"></div></div>' +
      '<div class="mgmem-strip"><img class="mgmem-och" alt="" draggable="false" src="' + OCHACO + '"><div class="mgmem-say">¡Encuentra las parejas!</div></div>' +
      '<div class="mgmem-ov"><img class="mgmem-cdi" alt="" draggable="false" src="' + OCHACO + '"><div class="mgmem-ttl">Parejas de pegatinas</div>' +
      '<div class="mgmem-num"></div><div class="mgmem-tip">Toca dos cartas iguales</div></div><canvas class="mgmem-fx"></canvas>';
    container.appendChild(root);
    if (root.clientHeight < 240) root.style.height = Math.round((window.innerHeight || 780) * 0.7) + 'px';   // el contenedor no tenía alto
    function q(s) { return root.querySelector(s); }
    var pills = root.querySelectorAll('.mgmem-pill'), nums = root.querySelectorAll('.mgmem-pill b'), timeEl = nums[2];
    var wrap = q('.mgmem-wrap'), board = q('.mgmem-board'), strip = q('.mgmem-strip'), sayEl = q('.mgmem-say'), barEl = q('.mgmem-bar i');
    var ov = q('.mgmem-ov'), numEl = q('.mgmem-num'), fx = q('.mgmem-fx'), fctx = fx.getContext('2d');

    // ---------- cartas: 8 parejas barajadas; dorso con el álbum y borde del color de la serie ----------
    var cards = [];
    function card(s) {
      var e = document.createElement('div'), ser = window.MK_SERIES && window.MK_SERIES[s.series], col = (ser && ser.color) || th.accent;
      e.className = 'mgmem-card deal'; e.setAttribute('role', 'button'); e.setAttribute('aria-label', 'Carta');
      e.style.setProperty('--c', col);
      e.innerHTML = '<div class="mgmem-in"><div class="mgmem-face mgmem-back"><img alt="" draggable="false" src="' + BACK + '"></div>' +
        '<div class="mgmem-face mgmem-front"><img alt="" draggable="false"><b></b></div></div>';
      e.querySelector('.mgmem-front img').src = s.src; e.querySelector('b').textContent = s.name;
      return { s: s, el: e, col: col, up: false, ok: false };
    }
    pickStickers().forEach(function (s) { cards.push(card(s)); cards.push(card(s)); });
    shuffle(cards);
    cards.forEach(function (c, i) { c.el.setAttribute('data-i', i); c.el.style.animationDelay = (150 + i * 45) + 'ms'; board.appendChild(c.el); });   // se reparten una a una

    // ---------- estado ----------
    var phase = 'count', first = null, busy = false, pairs = 0, moves = 0, score = 0, nope = 0, tt = 0, lastSec = 0, lastQ = -1, barCol = '', hurried = false;
    var fxOn = false, fxUntil = 0, fxDpr = 1;

    function addScore(n) { score += n; try { if (typeof opts.onScore === 'function') opts.onScore(score); } catch (e) { /* nada */ } }
    function say(s) { sayEl.textContent = s; replay(sayEl, 'hop'); }
    function spot(c) { var r = c.el.getBoundingClientRect(), b = root.getBoundingClientRect(); return { x: r.left - b.left + r.width / 2, y: r.top - b.top + r.height / 2 }; }
    function fxGo(ms) { fxUntil = Math.max(fxUntil, performance.now() + ms); if (!fxOn) { fxOn = true; fx.style.display = 'block'; } }

    // ---------- cuenta atrás 3, 2, 1, ¡YA! con Ochaco ----------
    ['3', '2', '1', '¡YA!'].forEach(function (s, j) {
      later(function () { numEl.textContent = s; replay(numEl, 'go'); sfx(j < 3 ? 'drum' : 'whoosh'); }, 200 + j * CD_MS);
    });
    later(function () {
      phase = 'play'; ov.classList.add('hide');
      cards.forEach(function (c) { c.el.classList.remove('deal'); c.el.style.animationDelay = ''; });
      later(function () { if (phase === 'play') ov.style.display = 'none'; }, 300);
    }, 200 + 3 * CD_MS + 500);

    // ---------- jugar: se gira en pointerdown; con dos cartas giradas no se acepta ningún toque ----------
    function tap(c) {
      if (phase !== 'play' || busy || !c || c.up || c.ok) return;
      c.up = true; c.el.classList.add('up'); sfx('pop');
      if (!first) { first = c; return; }
      var a = first; first = null; busy = true; moves++;
      nums[1].textContent = String(moves); replay(pills[1], 'mgmem-bump');
      later(function () { if (phase === 'play') { if (a.s === c.s) match(a, c); else nomatch(a, c); } }, 280);   // tras el volteo (250 ms)
    }
    function match(a, b) {
      a.ok = b.ok = true; pairs++; busy = false;
      a.el.classList.add('ok'); b.el.classList.add('ok'); replay(a.el, 'pop'); replay(b.el, 'pop');
      sfx('sticker'); buzz(25); addScore(PTS);
      nums[0].textContent = pairs + '/' + PAIRS; replay(pills[0], 'mgmem-bump');
      var pa = spot(a), pb = spot(b), cols = [a.col, GOLD, '#fff', '#ff7bc5', '#7ee0ff'];
      fxGo(1300);
      J.burst(pa.x, pa.y, { n: 14, colors: cols, speed: 300, life: 0.95, size: 9, gravity: 620 });
      J.burst(pb.x, pb.y, { n: 14, colors: cols, speed: 300, life: 0.95, size: 9, gravity: 620, shape: 'star' });
      J.text(pb.x, pb.y - 24, '+' + PTS, { color: GOLD, size: 34, life: 1, rise: 70 });
      if (pairs < PAIRS) { say('¡Pareja de ' + a.s.name + '!'); return; }
      phase = 'over'; busy = true; say('¡Todas! ¡Eres una heroína!');   // el reloj se para aquí
      later(win, 450);
    }
    function nomatch(a, b) {
      replay(a.el, 'no'); replay(b.el, 'no'); sfx('wrong', 0.45); buzz(12);
      say(NOPE[nope++ % NOPE.length]);
      later(function () {
        if (phase !== 'play') return;   // se acabó el tiempo: se quedan a la vista
        a.up = b.up = false; a.el.classList.remove('up', 'no'); b.el.classList.remove('up', 'no'); busy = false;
      }, SHOW_MS);
    }
    function win() {
      var bonus = tt <= FAST ? BONUS : Math.max(0, Math.round(BONUS * (LIMIT - tt) / (LIMIT - FAST)));   // máx. 100 si acaba en < 60 s
      if (bonus) addScore(bonus);
      cards.forEach(function (c, j) { later(function () { replay(c.el, 'pop'); }, j * 35); });   // ola dorada por el tablero
      later(function () { showEnd(true, bonus); }, 700);
    }
    function timeUp() {
      phase = 'over'; busy = true; first = null; timeEl.textContent = fmt(LIMIT);
      say('¡Se acabó el tiempo!'); sfx('ding');
      var n = 0;
      cards.forEach(function (c) { if (!c.up) { c.up = true; var e = c.el; later(function () { e.classList.add('up'); }, 60 + n++ * 40); } });   // enseña dónde estaban
      later(function () { showEnd(false, 0); }, 1300);
    }
    function showEnd(won, bonus) {
      var st = won ? (moves <= 14 ? 3 : moves <= 22 ? 2 : 1) : pairs >= 4 ? 1 : 0, stars = '', left = PAIRS - pairs, j;
      for (j = 0; j < 3; j++) stars += '<svg viewBox="0 0 24 24"' + (j < st ? ' class="on"' : '') + ' style="animation-delay:' + (300 + j * 170) + 'ms">' + STAR + '</svg>';
      ov.innerHTML = '<div class="mgmem-panel"><div class="mgmem-fin">¡Fin!</div><small>PUNTOS</small><div class="mgmem-pts">' + score + '</div>' +
        '<div class="mgmem-stars">' + stars + '</div><div class="mgmem-line">' + pairs + '/' + PAIRS + ' parejas · ' + moves + ' movimientos · ' + fmt(Math.min(LIMIT, Math.floor(tt))) + '</div>' +
        (bonus ? '<div class="mgmem-line mgmem-gold">¡Bonus de rapidez! +' + bonus + '</div>' : '') +
        '<div class="mgmem-msg">' + (won ? (st === 3 ? '¡Memoria de heroína!' : '¡Todas las parejas!') : '¡Casi! Te ' + (left === 1 ? 'faltó 1 pareja' : 'faltaron ' + left + ' parejas')) + '</div></div>';
      ov.style.display = ''; ov.classList.remove('hide');
      sfx(won ? 'tada' : 'drum'); buzz(won ? [60, 40, 90] : 40);
      if (won) {
        var w = root.clientWidth, h = root.clientHeight;
        fxGo(1800);
        for (j = 0; j < 3; j++) J.burst(w * (0.18 + 0.32 * j), h * 0.66, { n: 24, colors: [GOLD, '#fff', '#ff7bc5', '#7ee0ff', th.accent, '#E4002B'], angle: -Math.PI / 2, spread: 1.2, speed: 640, life: 1.5, size: 10, gravity: 760, shape: j === 1 ? 'star' : 'square' });
      }
      later(endNow, END_MS);
    }
    function endNow() {
      if (ended) return;
      ended = true; cleanup();
      try { if (typeof opts.onEnd === 'function') opts.onEnd({ score: score, won: pairs >= PAIRS }); } catch (e) { /* nada */ }
    }
    function cleanup() {
      cancelAnimationFrame(raf); timers.forEach(clearTimeout); timers.length = 0;
      board.removeEventListener('pointerdown', onDown);
      root.removeEventListener('touchstart', swallow); root.removeEventListener('touchmove', swallow); root.removeEventListener('contextmenu', swallow);
      window.removeEventListener('resize', layout); window.removeEventListener('orientationchange', layout);
      if (ro) ro.disconnect();
      J.reset();
      if (root.parentNode) root.parentNode.removeChild(root);   // con él se va el <style> .mgmem-
    }

    // ---------- tamaño: las 16 cartas caben enteras (móvil 390×780 o tablet); sin Ochaco si falta alto ----------
    function layout() {
      if (ended) return;
      var w = root.clientWidth, h = root.clientHeight;
      root.classList.toggle('mgmem-narrow', w < 380);
      strip.style.display = h < 620 ? 'none' : '';
      var aw = wrap.clientWidth - 24, ah = wrap.clientHeight - 16, gap = Math.round(Math.max(6, Math.min(14, aw * 0.028)));
      var cw = Math.floor(Math.max(34, Math.min((aw - 3 * gap) / 4, (ah - 3 * gap) / 4 * ASPECT)));
      board.style.gridTemplateColumns = 'repeat(4,' + cw + 'px)'; board.style.gridAutoRows = Math.floor(cw / ASPECT) + 'px'; board.style.gap = gap + 'px';
      root.style.setProperty('--r', Math.round(cw * 0.13) + 'px'); root.style.setProperty('--fs', Math.max(10, Math.round(cw * 0.135)) + 'px');
      fxDpr = Math.min(3, window.devicePixelRatio || 1); fx.width = Math.round(w * fxDpr); fx.height = Math.round(h * fxDpr);
    }

    // ---------- entrada ----------
    function onDown(e) {
      var ce = e.target && e.target.closest ? e.target.closest('.mgmem-card') : null;
      if (!ce) return;
      if (e.cancelable) e.preventDefault();
      tap(cards[+ce.getAttribute('data-i')]);
    }
    function swallow(e) { if (e.cancelable) e.preventDefault(); }   // sin scroll, zoom ni menú
    board.addEventListener('pointerdown', onDown);
    root.addEventListener('touchstart', swallow, { passive: false }); root.addEventListener('touchmove', swallow, { passive: false }); root.addEventListener('contextmenu', swallow);
    window.addEventListener('resize', layout); window.addEventListener('orientationchange', layout);
    if (window.ResizeObserver) { ro = new ResizeObserver(function () { layout(); }); ro.observe(root); }

    // ---------- bucle: reloj, barra de tiempo y confeti (el canvas solo se dibuja mientras hay efectos) ----------
    function frame(ts) {
      raf = requestAnimationFrame(frame);
      var dt = last ? Math.min(0.1, Math.max(0, (ts - last) / 1000)) : 0; last = ts;
      if (phase === 'play') {
        tt += dt;
        var s = Math.floor(tt), qq = Math.floor(tt * 4), col = tt < FAST ? GOLD : LIMIT - tt <= 20 ? '#ff5c6c' : th.accent;
        if (s !== lastSec) { lastSec = s; timeEl.textContent = fmt(s); }
        if (qq !== lastQ) { lastQ = qq; barEl.style.transform = 'scaleX(' + Math.max(0, 1 - tt / LIMIT).toFixed(3) + ')'; }
        if (col !== barCol) { barCol = col; barEl.style.backgroundColor = col; }
        if (!hurried && LIMIT - tt <= 20) { hurried = true; timeEl.style.color = '#ff8a98'; say('¡Date prisa!'); }
        if (tt >= LIMIT) timeUp();
      }
      if (fxOn) {
        J.update(dt);
        fctx.setTransform(1, 0, 0, 1, 0, 0); fctx.clearRect(0, 0, fx.width, fx.height);
        if (ts > fxUntil) { fxOn = false; fx.style.display = 'none'; J.reset(); }
        else { fctx.setTransform(fxDpr, 0, 0, fxDpr, 0, 0); J.draw(fctx); }
      }
    }
    layout();
    raf = requestAnimationFrame(frame);
    return { stop: function () { if (ended) return; ended = true; cleanup(); } };   // si llega antes del fin, NO se llama a onEnd
  }

  window.MiniGames.memory = { id: 'memory', title: 'Parejas de pegatinas', world: 'mha', start: start };
})();
