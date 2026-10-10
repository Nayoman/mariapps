/* MariApps — kit común (script plano, sin módulos). Expone window.MK.
 * Qué hay aquí: utilidades, ajustes, la HUCHA común (monedas, entradas, pegatinas, días seguidos), el gestor de audio
 * (voz + efectos + música; busca cada clip en varias carpetas) y las capas de interfaz (pantallas, avisos, confeti, momentos).
 * Lo usan el móvil (index.html), Ciencias, el Arcade y las Tablas. */
(function () {
  'use strict';
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const rnd = n => Math.floor(Math.random() * n);
  const pick = a => a[rnd(a.length)];
  const shuffle = a => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = rnd(i + 1); const t = b[i]; b[i] = b[j]; b[j] = t; } return b; };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const pad2 = n => String(n).padStart(2, '0');
  const dayKey = d => { d = d || new Date(); return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); };
  const REDUCED = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  // raíz de MariApps (la carpeta donde está index.html), calculada desde la ruta de este script
  const ROOT = (() => { const s = document.currentScript && document.currentScript.getAttribute('src'); if (!s) return ''; return s.replace(/shared\/kit\.js(\?.*)?$/, ''); })();
  // texto normalizado para comparar respuestas escritas: minúsculas, sin tildes, sin signos
  const norm = t => String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
  // comprueba palabras clave: keys = [[alternativas del grupo 1], [grupo 2], ...]; pasa si se cumplen `min` grupos (por defecto todos)
  function matchKeys(answer, keys, min) {
    const a = ' ' + norm(answer) + ' ';
    const matched = [], missing = [];
    (keys || []).forEach(g => { const ok = g.some(k => a.includes(' ' + norm(k) + ' ') || a.includes(norm(k))); (ok ? matched : missing).push(g[0]); });
    const need = min == null ? (keys || []).length : min;
    return { ok: matched.length >= need, matched, missing };
  }
  const readJSON = key => { try { const v = JSON.parse(localStorage.getItem(key)); return v && typeof v === 'object' ? v : null; } catch (e) { return null; } };
  const writeJSON = (key, v) => { try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) {} };
  // estado propio de cada app: store('ciencias_v1', () => ({...})) → { S, save }
  function store(key, defaults) { const S = Object.assign(defaults(), readJSON(key) || {}); return { S, save: () => writeJSON(key, S) }; }

  // ---------- ajustes comunes ----------
  const SKEY = 'mariapps_settings';
  const Settings = { S: Object.assign({ sound: true, name: 'María' }, readJSON(SKEY) || {}), save() { writeJSON(SKEY, this.S); } };

  // ---------- la hucha común ----------
  const WKEY = 'mariapps_wallet';
  const wdef = () => ({ coins: 0, tickets: 1, stickers: [], log: [], days: {}, migrated: {} });
  const W = Object.assign(wdef(), readJSON(WKEY) || {});
  const listeners = [];
  function wlog(why, c, k) { W.log.push({ t: Date.now(), why: why || '', c: c || 0, k: k || 0 }); if (W.log.length > 200) W.log.splice(0, W.log.length - 200); }
  function wsave(why) { writeJSON(WKEY, W); Wallet.render(); listeners.forEach(f => { try { f(W, why); } catch (e) {} }); }
  const Wallet = {
    get coins() { return W.coins; }, get tickets() { return W.tickets; }, get stickers() { return W.stickers.slice(); }, get data() { return W; },
    add(n, why) { n = Math.round(n) || 0; if (!n) return W.coins; W.coins = Math.max(0, W.coins + n); wlog(why, n); wsave('coins'); return W.coins; },
    spend(n, why) { if (W.coins < n) return false; W.coins -= n; wlog(why, -n); wsave('coins'); return true; },
    addTickets(n, why) { W.tickets = Math.max(0, W.tickets + (n || 0)); wlog(why, 0, n); wsave('tickets'); return W.tickets; },
    canPlay(cost) { return W.tickets > 0 || W.coins >= cost; },
    pay(cost, why) {
      if (W.tickets > 0) { W.tickets--; wlog(why, 0, -1); wsave('tickets'); return { ok: true, how: 'ticket' }; }
      if (W.coins >= cost) { W.coins -= cost; wlog(why, -cost); wsave('coins'); return { ok: true, how: 'coins' }; }
      return { ok: false, missing: cost - W.coins };
    },
    refund(cost, how, why) { if (how === 'ticket') this.addTickets(1, why); else this.add(cost, why); },
    giveSticker(id, why) { if (W.stickers.includes(id)) return false; W.stickers.push(id); wlog(why || ('pegatina ' + id)); wsave('sticker'); return true; },
    hasSticker(id) { return W.stickers.includes(id); },
    touchDay() { const k = dayKey(); if (!W.days[k]) { W.days[k] = 1; wsave('day'); } return Object.keys(W.days).length; },
    streakDays() {
      let n = 0; const d = new Date();
      if (!W.days[dayKey(d)]) d.setDate(d.getDate() - 1);          // si hoy aún no ha jugado, la racha cuenta hasta ayer
      while (W.days[dayKey(d)]) { n++; d.setDate(d.getDate() - 1); }
      return n;
    },
    totalDays() { return Object.keys(W.days).length; },
    migrate(appKey, fn) { if (W.migrated[appKey]) return false; try { fn(); } catch (e) {} W.migrated[appKey] = true; wsave('migrate'); return true; },
    on(f) { listeners.push(f); return () => { const i = listeners.indexOf(f); if (i > -1) listeners.splice(i, 1); }; },
    render() {
      $$('[data-coins]').forEach(e => { e.textContent = W.coins; });
      $$('[data-tickets]').forEach(e => { e.textContent = W.tickets; });
      $$('[data-stickers]').forEach(e => { e.textContent = W.stickers.length; });
    },
  };
  window.addEventListener('storage', ev => { if (ev.key === WKEY) { Object.assign(W, wdef(), readJSON(WKEY) || {}); Wallet.render(); listeners.forEach(f => { try { f(W, 'storage'); } catch (e) {} }); } });

  // ---------- audio: voz, efectos y música ----------
  const Audio = {
    ctx: null, buf: {}, dirs: [ROOT + 'shared/audio/'], musicSrc: null, musicGain: null, musicName: null, musicVol: .35, voice: null, voiceId: 0,
    get on() { return Settings.S.sound !== false; },
    unlock() {
      try {
        if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        if (this.ctx.state === 'suspended') this.ctx.resume();
        const s = this.ctx.createBufferSource(); s.buffer = this.ctx.createBuffer(1, 1, 22050); s.connect(this.ctx.destination); s.start(0);
      } catch (e) {}
    },
    load(name) {
      if (!this.ctx) return Promise.resolve(null);
      if (!this.buf[name]) {
        this.buf[name] = (async () => {
          // cada carpeta puede ser 'ruta/' o { dir: 'ruta/', test: /^(d|q)_/ } para buscar ahí solo ciertos clips (sin 404 inútiles)
          for (const e of this.dirs) {
            const d = typeof e === 'string' ? e : e.dir; if (typeof e !== 'string' && e.test && !e.test.test(name)) continue;
            try {
              const r = await fetch(d + name + '.mp3'); if (!r.ok) continue;
              const ab = await r.arrayBuffer();
              return await new Promise((res, rej) => this.ctx.decodeAudioData(ab, res, rej));
            } catch (e) {}
          }
          return null;
        })();
      }
      return this.buf[name];
    },
    preload(names) { if (!this.ctx) return; (names || []).forEach(n => this.load(n)); },
    async sfx(name, vol) {
      if (!this.on || !this.ctx) return; const b = await this.load(name); if (!b) return;
      const s = this.ctx.createBufferSource(); s.buffer = b; const g = this.ctx.createGain(); g.gain.value = vol == null ? 1 : vol; s.connect(g); g.connect(this.ctx.destination); s.start();
    },
    say(name, opt) {
      opt = opt || {};
      if (!this.on || !this.ctx) return Promise.resolve();
      const id = ++this.voiceId;
      return this.load(name).then(b => {
        if (this.voiceId !== id) return;              // ya ha empezado otra frase
        this.stopVoice();
        if (!b) return this.speak(opt.text);
        return new Promise(res => {
          const s = this.ctx.createBufferSource(); s.buffer = b; s.connect(this.ctx.destination);
          this.duck(true);
          s.onended = () => { if (this.voice === s) { this.voice = null; this.duck(false); } res(); };
          s.start(); this.voice = s;
        });
      });
    },
    stopVoice() {
      if (this.voice) { try { this.voice.onended = null; this.voice.stop(); } catch (e) {} this.voice = null; this.duck(false); }
      try { window.speechSynthesis && speechSynthesis.cancel(); } catch (e) {}
    },
    speak(text) {
      return new Promise(res => {
        if (!text || !('speechSynthesis' in window)) return res();
        const u = new SpeechSynthesisUtterance(text); u.lang = 'es-ES'; u.onend = res; u.onerror = res; speechSynthesis.speak(u); setTimeout(res, 6000);
      });
    },
    duck(on) {
      if (!this.musicGain || !this.ctx) return; const t = this.ctx.currentTime;
      this.musicGain.gain.cancelScheduledValues(t); this.musicGain.gain.setTargetAtTime(on ? this.musicVol * .3 : this.musicVol, t, .08);
    },
    async music(name, vol) {
      this.appMusic = { name, vol };                 // lo que pide la app (se recuerda por si se apaga la radio)
      if (Radio.active) return Radio.play();         // con una emisora elegida, suena la emisora y no la música del mundo (RA-D1)
      this.musicVol = vol == null ? .35 : vol;
      if (this.musicName === name && this.musicSrc) { this.duck(!!this.voice); return; }
      this.musicName = name; this.stopMusic();
      if (!this.on || !this.ctx) return;
      const b = await this.load(name); if (!b || this.musicName !== name) return;
      const s = this.ctx.createBufferSource(); s.buffer = b; s.loop = true;
      const g = this.ctx.createGain(); g.gain.value = 0; s.connect(g); g.connect(this.ctx.destination); s.start();
      g.gain.setTargetAtTime(this.musicVol, this.ctx.currentTime, .3); this.musicSrc = s; this.musicGain = g;
    },
    stopMusic() {
      if (!this.musicSrc) return; const s = this.musicSrc, g = this.musicGain;
      try { g.gain.setTargetAtTime(0, this.ctx.currentTime, .12); } catch (e) {}
      setTimeout(() => { try { s.stop(); } catch (e) {} }, 500); this.musicSrc = null; this.musicGain = null;
    },
    setOn(v) { Settings.S.sound = !!v; Settings.save(); if (!v) { this.stopMusic(); this.stopVoice(); this.musicName = null; } },
  };
  const vibrate = p => { try { navigator.vibrate && navigator.vibrate(p); } catch (e) {} };

  // ---------- capas de interfaz ----------
  function layer(id, cls, html) { let el = document.getElementById(id); if (!el) { el = document.createElement('div'); el.id = id; el.className = cls; el.innerHTML = html || ''; document.body.appendChild(el); } return el; }
  let toastT = 0;
  const UI = {
    current: '',
    show(id) { $$('.screen').forEach(s => s.classList.toggle('active', s.id === 's-' + id)); this.current = id; },
    toast(msg, ms) { const t = layer('mk-toast', 'toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), ms || 1800); },
    flash() { const d = document.createElement('div'); d.className = 'flash'; document.body.appendChild(d); setTimeout(() => d.remove(), 520); },
    plus(txt, x, y) {
      const el = document.createElement('div'); el.className = 'plus'; el.textContent = txt; el.style.left = x + 'px'; el.style.top = y + 'px'; document.body.appendChild(el);
      if (REDUCED) { setTimeout(() => el.remove(), 700); return; }
      const a = el.animate([{ transform: 'translate(-50%,0) scale(.7)', opacity: 0 }, { transform: 'translate(-50%,-34px) scale(1.15)', opacity: 1, offset: .3 }, { transform: 'translate(-50%,-100px) scale(1)', opacity: 0 }], { duration: 950, easing: 'cubic-bezier(.2,.8,.2,1)' });
      a.onfinish = () => el.remove(); setTimeout(() => el.remove(), 1200);
    },
    async moment(o) {
      const m = layer('mk-moment', 'moment', '<img alt=""><div class="moment-txt"></div>');
      const img = $('img', m); img.src = o.img || ''; img.style.display = o.img ? '' : 'none'; $('.moment-txt', m).textContent = o.text || '';
      m.classList.add('show'); if (o.sfx) Audio.sfx(o.sfx); vibrate([60, 40, 60]); if (o.flash) this.flash();
      await sleep(o.ms || 1500); m.classList.remove('show');
    },
    lightbox(src) {
      const l = layer('mk-lightbox', 'lightbox', '<img alt=""><button class="btn btn-ghost">Cerrar</button>');
      $('img', l).src = src; l.classList.add('show');
      const close = () => l.classList.remove('show'); $('button', l).onclick = close; l.onclick = ev => { if (ev.target === l) close(); };
    },
    stagger(container) { Array.from(container.children).forEach((c, i) => c.style.setProperty('--i', i)); container.classList.add('stagger'); },
    setWorld(id) { document.body.dataset.world = id || 'home'; },
    bubble(el, txt, ms) { el.textContent = txt; el.classList.add('show'); clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove('show'), ms || 1800); },
    react(img, cls) { img.classList.remove('jump', 'sad'); void img.offsetWidth; img.classList.add(cls); setTimeout(() => img.classList.remove(cls), 650); },
  };
  const Confetti = {
    cv: null, ctx: null, parts: [], raf: 0, colors: ['#E4002B', '#FFC72C', '#F52C98', '#1E6F50', '#4f7cff', '#F26A1B', '#2BA84A', '#fff'],
    burst(n) {
      if (REDUCED) return;
      if (!this.cv) { this.cv = document.createElement('canvas'); this.cv.id = 'mk-confetti'; document.body.appendChild(this.cv); this.ctx = this.cv.getContext('2d'); }
      const W = this.cv.width = innerWidth, H = this.cv.height = innerHeight;
      for (let i = 0; i < (n || 140); i++) this.parts.push({ x: W / 2 + (Math.random() - .5) * 160, y: H * .45, vx: (Math.random() - .5) * 16, vy: -Math.random() * 16 - 5, s: 6 + Math.random() * 7, c: pick(this.colors), r: Math.random() * Math.PI, vr: (Math.random() - .5) * .3, life: 1 });
      if (!this.raf) this.tick();
    },
    tick() {
      const c = this.ctx; c.clearRect(0, 0, this.cv.width, this.cv.height);
      this.parts = this.parts.filter(p => p.life > 0);
      for (const p of this.parts) { p.vy += .42; p.x += p.vx; p.y += p.vy; p.vx *= .99; p.r += p.vr; p.life -= .011; c.save(); c.globalAlpha = Math.max(0, p.life); c.translate(p.x, p.y); c.rotate(p.r); c.fillStyle = p.c; c.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * .6); c.restore(); }
      this.raf = this.parts.length ? requestAnimationFrame(() => this.tick()) : 0;
      if (!this.parts.length) c.clearRect(0, 0, this.cv.width, this.cv.height);
    },
  };
  // ---------- navegación entre apps del móvil ----------
  const Nav = {
    param(k) { return new URLSearchParams(location.search).get(k); },
    go(url) { document.body.classList.add('leaving'); Audio.stopVoice(); setTimeout(() => { location.href = url; }, REDUCED ? 0 : 160); },
    home() { this.go(ROOT + 'index.html'); },
    arcade(from) { this.go(ROOT + 'arcade/index.html' + (from ? '?from=' + encodeURIComponent(from) : '')); },
    back(fallback) { const f = this.param('from'); this.go(f ? ROOT + f + '/index.html' : (fallback || ROOT + 'index.html')); },
  };
  // sonido de toque en botones (se instala una vez por página)
  function tapSounds(sel) {
    document.addEventListener('pointerdown', ev => { const b = ev.target.closest(sel || '.btn, .tile, .choice, .iconbtn, .appicon'); if (b && !b.disabled) Audio.sfx('pop', .35); }, { passive: true });
  }
  const timeHM = () => { const d = new Date(); return d.getHours() + ':' + pad2(d.getMinutes()); };

  // ---------- copia de seguridad automática en el servidor (por si la tablet se rompe o se borra) ----------
  // Cada aparato tiene su id + secreto (guardados aquí). Al entrar y cada minuto, si algo cambió, se sube todo el progreso.
  // Recuperar en otro aparato: abrir MariApps con ?restaurar=<id>.<secreto> (la fila está en la tabla mariapps_backup).
  const BK_URL = 'https://dvphfjmpikuqxfqidauj.supabase.co/functions/v1/mariapps-backup';
  const BK_KEY = 'mariapps_backup_id';
  const BK_RE = /^(mariapps_|ciencias_|tablas_|arcade_|album_)/;
  const rid = n => { const a = new Uint8Array(n); crypto.getRandomValues(a); return Array.from(a, b => 'abcdefghijklmnopqrstuvwxyz0123456789'[b % 36]).join(''); };
  const Backup = {
    last: '',
    ident() { let v = readJSON(BK_KEY); if (!v || !v.id || !v.secret) { v = { id: 'w-' + rid(16), secret: rid(32) }; writeJSON(BK_KEY, v); } return v; },
    snapshot() { const o = {}; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (BK_RE.test(k) && k !== BK_KEY) o[k] = localStorage.getItem(k); } } catch (e) {} return o; },
    async save(keepalive) {
      if (navigator.webdriver) return;                       // pruebas automáticas: no ensuciar la tabla
      const snap = this.snapshot(); const s = JSON.stringify(snap);
      if (s === this.last || s === '{}') return;
      const v = this.ident();
      try {
        const r = await fetch(BK_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, keepalive: !!keepalive, body: JSON.stringify({ op: 'save', app: 'web', id: v.id, secret: v.secret, data: snap, device: (navigator.userAgent || '').slice(0, 120) }) });
        if (r.ok) this.last = s;
      } catch (e) {}
    },
    async restore(code) {
      const [id, secret] = String(code).split('.');
      const r = await fetch(BK_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ op: 'load', app: 'web', id, secret }) });
      const j = await r.json(); if (!j.ok) throw new Error(j.error || 'sin copia');
      Object.entries(j.data || {}).forEach(([k, val]) => { if (BK_RE.test(k)) { try { localStorage.setItem(k, val); } catch (e) {} } });
      writeJSON(BK_KEY, { id, secret });
    },
    start() {
      const code = new URLSearchParams(location.search).get('restaurar');
      if (code) { this.restore(code).then(() => location.replace(location.pathname)).catch(e => console.log('[copia] no se pudo restaurar:', e.message)); return; }
      setTimeout(() => this.save(), 4000);
      setInterval(() => this.save(), 60000);
      document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') this.save(true); });
    },
  };
  Backup.start();

  // ---------- ajustes que Bernardo puede tocar (shared/config.js, cargado antes que este kit) ----------
  const CFG = Object.assign({ YOUTUBE_LIST: '', EXAM10_MINUTES: 10 }, window.MK_CONFIG || {});

  // ---------- tiempo de estudio y de juego (AR-D1): cada 4 min de estudio real = 1 min de juego; banco máximo 20 min ----------
  // «Estudio real» = pantalla de ejercicios/jefe/examen visible y con algún toque en los últimos 90 s. El juego descuenta sus segundos reales.
  const TKEY = 'mariapps_time';
  const T = Object.assign({ bank: 0, study: 0, play: 0, days: {} }, readJSON(TKEY) || {});
  let lastInput = Date.now(), tStudy = false, tPlay = false, tDirty = 0, tFired = false;
  ['pointerdown', 'keydown', 'touchstart'].forEach(ev => document.addEventListener(ev, () => { lastInput = Date.now(); }, { passive: true, capture: true }));
  const Time = {
    RATIO: .25, CAP: 20 * 60, IDLE: 90000, listeners: [],
    get bank() { return T.bank; }, get data() { return T; },
    day() { const k = dayKey(); return T.days[k] || (T.days[k] = { study: 0, play: 0 }); },
    studying(on) { tStudy = !!on; if (on) tPlay = false; },
    playing(on) { tPlay = !!on; if (on) { tStudy = false; tFired = false; } },
    canPlay(min) { return T.bank >= (min == null ? 20 : min); },
    fmt(s) { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ':' + pad2(s % 60); },
    on(f) { this.listeners.push(f); },
    save() { writeJSON(TKEY, T); },
    render() { $$('[data-playtime]').forEach(e => { e.textContent = this.fmt(T.bank); const p = e.closest('.pill'); if (p) p.classList.toggle('low', T.bank < 60); }); },
    tick() {
      if (document.visibilityState !== 'visible') return;
      const active = Date.now() - lastInput < this.IDLE;
      if (tStudy && active) { T.study++; this.day().study++; T.bank = Math.min(this.CAP, T.bank + this.RATIO); tDirty++; }
      else if (tPlay) { T.play++; this.day().play++; T.bank = Math.max(0, T.bank - 1); tDirty++; if (T.bank <= 0 && !tFired) { tFired = true; this.listeners.forEach(f => { try { f('timeout'); } catch (e) {} }); } }
      if (tDirty >= 5) { tDirty = 0; this.save(); }
      this.render();
    },
  };
  setInterval(() => Time.tick(), 1000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') { Time.save(); } });
  window.addEventListener('pagehide', () => Time.save());

  // ---------- el banco (AH-D1): ahorro con interés del 1 % al día (una moneda de cada cien), compuesto, pagado al abrir ----------
  const BNKEY = 'mariapps_banco';
  const BK = Object.assign({ saved: 0, lastPaid: '', paid: [], goal: 0, totalInterest: 0 }, readJSON(BNKEY) || {});
  const Bank = {
    RATE: .01, lastPayout: 0,
    get saved() { return BK.saved; }, get data() { return BK; },
    save() { writeJSON(BNKEY, BK); $$('[data-saved]').forEach(e => { e.textContent = BK.saved; }); },
    interestOf(a) { return a > 0 ? Math.max(1, Math.round(a * this.RATE)) : 0; },
    // paga el interés de los días que han pasado desde la última vez (se llama al cargar cualquier app)
    accrue() {
      const today = dayKey();
      if (!BK.lastPaid) { BK.lastPaid = today; this.save(); return 0; }
      let total = 0, guard = 0; const d = new Date(BK.lastPaid + 'T12:00:00');
      while (dayKey(d) < today && guard++ < 400) { d.setDate(d.getDate() + 1); const n = this.interestOf(BK.saved); if (n) { BK.saved += n; total += n; BK.paid.push({ d: dayKey(d), n }); } }
      if (BK.paid.length > 60) BK.paid.splice(0, BK.paid.length - 60);
      BK.lastPaid = today; BK.totalInterest += total; this.lastPayout = total; this.save(); return total;
    },
    deposit(n, why) { n = Math.round(n); if (n <= 0 || !Wallet.spend(n, why || 'banco: guardar')) return false; BK.saved += n; if (!BK.lastPaid) BK.lastPaid = dayKey(); this.save(); return true; },
    withdraw(n, why) { n = Math.min(Math.round(n), BK.saved); if (n <= 0) return false; BK.saved -= n; Wallet.add(n, why || 'banco: sacar'); this.save(); return true; },
    setGoal(n) { BK.goal = Math.max(0, Math.round(n) || 0); this.save(); },
    grow(amount, days) { let a = amount; for (let i = 0; i < days; i++) a += this.interestOf(a); return a; },
    daysTo(goal) { if (goal <= BK.saved) return 0; if (BK.saved <= 0) return Infinity; let a = BK.saved, d = 0; while (a < goal && d < 3650) { a += this.interestOf(a); d++; } return d; },
  };
  const payout = Bank.accrue();
  if (payout > 0 && !navigator.webdriver) setTimeout(() => { UI.toast(`🏦 El banco te ha pagado +${payout} monedas de interés`, 3200); Audio.sfx('coin', .8); }, 1800);

  // ---------- premios especiales (PR-D1): un 10 en el examen = 10 minutos de YouTube (los minutos se acumulan) ----------
  const PKEY = 'mariapps_premios';
  const PR = Object.assign({ youtube: 0, history: [] }, readJSON(PKEY) || {});
  const Prizes = {
    CFG,
    // los minutos guardados (PR.youtube) pasan a correr con el RELOJ al abrir YouTube (PR.youtubeUntil): da igual que MariApps quede en segundo plano
    sync() { if (PR.youtubeUntil && PR.youtubeUntil <= Date.now()) { PR.youtubeUntil = null; PR.youtube = 0; this.save(); } },
    get youtubeSeconds() { this.sync(); return PR.youtubeUntil ? Math.max(0, Math.ceil((PR.youtubeUntil - Date.now()) / 1000)) : (PR.youtube || 0); },
    get youtubeRunning() { this.sync(); return !!PR.youtubeUntil; },
    startYoutube() { this.sync(); if (PR.youtubeUntil) return PR.youtubeUntil; if (!(PR.youtube > 0)) return 0; PR.youtubeUntil = Date.now() + PR.youtube * 1000; PR.youtube = 0; this.save(); return PR.youtubeUntil; },
    get data() { return PR; },
    save() { writeJSON(PKEY, PR); },
    grant(id, seconds, why) { PR[id] = (PR[id] || 0) + seconds; PR.history.push({ t: Date.now(), id, s: seconds, why: why || '' }); if (PR.history.length > 50) PR.history.splice(0, PR.history.length - 50); this.save(); },
    use(id, seconds) { PR[id] = Math.max(0, (PR[id] || 0) - seconds); this.save(); return PR[id]; },
    // un 10 en el examen de prueba → minutos de YouTube; devuelve los segundos dados (0 si no toca)
    exam(nota, app) { if (nota < 10) return 0; const s = (CFG.EXAM10_MINUTES || 10) * 60; this.grant('youtube', s, 'examen 10 ' + app); return s; },
  };

  // ---------- la radio (RA-D1): emisoras para estudiar que suenan en todas las apps hasta que se cambie ----------
  const STATIONS = [
    { id: 'off', name: 'Música de cada mundo', sub: 'La de siempre, según la app', emoji: '🎮' },
    { id: 'lofi', name: 'Lo-fi para estudiar', sub: 'Tranquila, con un ritmo suave', emoji: '🎧', tracks: ['radio_lofi_1', 'radio_lofi_2'] },
    { id: 'focus', name: 'Concentración', sub: 'Piano suave, sin batería', emoji: '🧘', tracks: ['radio_focus_1', 'radio_focus_2'] },
    { id: 'rain', name: 'Lluvia y piano', sub: 'Para relajarse mientras estudias', emoji: '🌧️', tracks: ['radio_rain_1', 'radio_rain_2'] },
    { id: 'classic', name: 'Clásica para estudiar', sub: 'Violines, clavecín y piano', emoji: '🎻', tracks: ['radio_classic_1', 'radio_classic_2'] },
    { id: 'anime', name: 'Anime', sub: 'Las músicas de las cuatro series', emoji: '⛩️', tracks: ['music_onepiece', 'music_demonslayer', 'music_haikyuu', 'music_mha'] },
    { id: 'silence', name: 'Sin música', sub: 'Solo la voz y los sonidos', emoji: '🔇' },
  ];
  const Radio = {
    STATIONS, idx: 0,
    get station() { return STATIONS.find(s => s.id === (Settings.S.radio || 'off')) || STATIONS[0]; },
    get active() { return this.station.id !== 'off'; },
    set(id) {
      Settings.S.radio = id; Settings.save(); this.idx = 0;
      Audio.stopMusic(); Audio.musicName = null;
      if (this.active) this.play(); else if (Audio.appMusic) Audio.music(Audio.appMusic.name, Audio.appMusic.vol);
      this.render();
    },
    async play() {
      const st = this.station; Audio.musicVol = .3;
      if (!st.tracks) { Audio.stopMusic(); Audio.musicName = null; return; }
      if (!Audio.dirs.some(e => typeof e !== 'string' && /tablas\/assets\/audio/.test(e.dir))) Audio.dirs.push({ dir: ROOT + 'tablas/assets/audio/', test: /^music_(onepiece|demonslayer|haikyuu)$/ });
      const name = st.tracks[this.idx % st.tracks.length];
      if (Audio.musicName === name && Audio.musicSrc) { Audio.duck(!!Audio.voice); return; }
      Audio.musicName = name; Audio.stopMusic();
      if (!Audio.on || !Audio.ctx) return;
      const b = await Audio.load(name); if (!b || Audio.musicName !== name) return;
      const s = Audio.ctx.createBufferSource(); s.buffer = b; s.loop = st.tracks.length === 1;
      const g = Audio.ctx.createGain(); g.gain.value = 0; s.connect(g); g.connect(Audio.ctx.destination); s.start();
      g.gain.setTargetAtTime(Audio.musicVol, Audio.ctx.currentTime, .3); Audio.musicSrc = s; Audio.musicGain = g;
      s.onended = () => { if (Audio.musicSrc === s) { Audio.musicSrc = null; Audio.musicGain = null; Audio.musicName = null; this.idx++; if (this.active && Audio.on) this.play(); } };
    },
    render() { $$('[data-radio]').forEach(e => { e.textContent = this.station.emoji; e.classList.toggle('on', this.active); }); },
    button() { const b = document.createElement('button'); b.className = 'iconbtn radio-btn'; b.setAttribute('aria-label', 'Radio'); b.dataset.radio = '1'; b.textContent = this.station.emoji; b.addEventListener('click', () => this.open()); return b; },
    open() {
      Audio.unlock();
      const dim = layer('mk-radio-dim', 'mk-dim'), sh = layer('mk-radio', 'mk-sheet', '<div class="mk-head"><span style="font-size:26px">📻</span><h2>Radio</h2><button class="iconbtn" aria-label="Cerrar">✕</button></div><div class="mk-body"></div>');
      const body = $('.mk-body', sh); body.innerHTML = '';
      STATIONS.forEach(st => {
        const b = document.createElement('button'); b.className = 'station' + (st.id === this.station.id ? ' on' : '');
        b.innerHTML = `<span class="st-emoji">${st.emoji}</span><span class="st-txt">${st.name}<small>${st.sub}</small></span>${st.id === this.station.id ? '<span class="st-on">▶</span>' : ''}`;
        b.addEventListener('click', () => { Audio.sfx('pop', .4); this.set(st.id); $$('.station', body).forEach(x => x.classList.toggle('on', x === b)); $$('.st-on', body).forEach(x => x.remove()); b.insertAdjacentHTML('beforeend', '<span class="st-on">▶</span>'); });
        body.appendChild(b);
      });
      const close = () => { sh.classList.remove('show'); dim.classList.remove('show'); };
      $('.mk-head .iconbtn', sh).onclick = close; dim.onclick = close;
      dim.classList.add('show'); sh.classList.add('show');
    },
  };

  window.MK = { Backup, Time, Bank, Prizes, Radio, CFG, $, $$, sleep, rnd, pick, shuffle, clamp, pad2, dayKey, REDUCED, ROOT, norm, matchKeys, readJSON, writeJSON, store, Settings, Wallet, Audio, vibrate, UI, Confetti, Nav, tapSounds, timeHM };
})();
