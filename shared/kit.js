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

  window.MK = { $, $$, sleep, rnd, pick, shuffle, clamp, pad2, dayKey, REDUCED, ROOT, norm, matchKeys, readJSON, writeJSON, store, Settings, Wallet, Audio, vibrate, UI, Confetti, Nav, tapSounds, timeHM };
})();
