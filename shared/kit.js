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
  const Settings = { S: Object.assign({ sound: true }, readJSON(SKEY) || {}), save() { writeJSON(SKEY, this.S); } };
  // M13 (MA-D21): el nombre ya no vive en los ajustes, porque los ajustes suben al servidor con la copia de seguridad. Si quedó de antes, se quita.
  if ('name' in Settings.S) { delete Settings.S.name; Settings.save(); }

  // M15: estado de la hucha de casa. La lógica va más abajo (tras los premios); se declara aquí porque la hucha común y el tiempo lo consultan.
  const HKEY = 'mariapps_hucha';
  const HU = Object.assign({ on: false, cs: 0, lastNight: '', paid: [], interest: 0, done: { day: '', keys: {} }, used: { day: '', secs: 0 }, vale: 0, src: 'cred', cap: { wk: 20, we: 45 }, log: [], since: '', fails: 0, lockUntil: 0 }, readJSON(HKEY) || {});
  let Hucha = null, huDirty = false;   // huDirty: esta página ha gastado y aún no lo ha guardado

  // ---------- el nombre de cada niño (M13, 16-nov-2026; MA-D18…D21) ----------
  // · Se guarda SOLO en este aparato, en una clave que la copia de seguridad NO sube (NKEY no casa con BK_RE). No añadirla nunca a la copia.
  // · Sin nombre no se dice ninguno: nunca «María» por defecto.
  // · La tablet de María se reconoce por la huella del número de su copia (MA-D19): ahí sigue «María» sin preguntar y con sus audios de siempre.
  // · 17-nov (MA-D23/D24): la voz del aparato quedó DESCARTADA («es una voz robótica»). El nombre lo dicen las voces de ElevenLabs,
  //   las mismas que oye María: lo graba la función mariapps-nombre (frases fijas, una vez por nombre) al pulsar «Oír» o «¡Empezar!»
  //   y el audio se guarda en este aparato (NAKEY). Al servidor va SOLO el nombre de pila: nunca el número de la copia ni nada más.
  const NKEY = 'mi_nombre_v1';
  const NAKEY = 'mi_nombre_audio_v1';                          // { clave, clips: { hola_n: 'mp3 en base64', … } }; tampoco sube con la copia
  const NB_URL = 'https://dvphfjmpikuqxfqidauj.supabase.co/functions/v1/mariapps-nombre';
  const SALUDOS = ['hola_n', 'hola_g', 'hola_w', 'hola_b', 'genial', 'preparate', 'vuela', 'muybien', 'solo'];
  // qué saludo con nombre va delante de cada audio y con qué voz: niña (Ochaco, Nezuko), chica (Nami), chico (el resto), narrador
  const saludoDe = name => name === 'v_ok1' ? 'genial' : name === 'v_fly' ? 'vuela' : name === 'v_boss_start' ? 'preparate' : name === 'v_goodnight' ? 'muybien' : name === 'v_eight_intro' ? 'solo'
    : /^l_w_(tierra|otras|cellparts|verts)$/.test(name) ? 'hola_g' : /^l_w_(costa|marinas|sujeto)$/.test(name) ? 'hola_w' : /^l_w_/.test(name) ? 'hola_b' : 'hola_n';
  const MARIA_HUELLAS = [4350112162446662];
  const huella = s => { let a = 0xdeadbeef, b = 0x41c6ce57; for (let i = 0; i < s.length; i++) { const c = s.charCodeAt(i); a = Math.imul(a ^ c, 2654435761); b = Math.imul(b ^ c, 1597334677); } a = Math.imul(a ^ (a >>> 16), 2246822507) ^ Math.imul(b ^ (b >>> 13), 3266489909); b = Math.imul(b ^ (b >>> 16), 2246822507) ^ Math.imul(a ^ (a >>> 13), 3266489909); return 4294967296 * (2097151 & b) + (a >>> 0); };
  // audios grabados con «María» dentro (33) o en femenino (5): cada uno tiene un gemelo neutro <clip>_n.mp3 para los demás niños (MA-D18)
  // y, los que llevan nombre, un «resto» <clip>_r.mp3 (la frase sin el saludo) que se pega detrás del «¡Hola, Lucía!» del niño (MA-D24)
  const CLIP_NOMBRE = /^(v_(intro|ok1|boss_start|fly|goodnight|eight_intro)|l_w_[a-z]+|l_(cs|ns)_intro|b_intro)$/;
  const CLIP_GENERO = /^v_(ok3|wrong3|exam_start|exam_great|eight_done)$/;
  const NOMBRE_CSS = '#mk-nombre{position:fixed;inset:0;z-index:99999;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;padding:max(16px,env(safe-area-inset-top)) 16px 16px;background:#f5f5f7;color:#1d1d1f;color-scheme:light;font-family:-apple-system,BlinkMacSystemFont,"SF Pro Rounded","Segoe UI",Roboto,"Helvetica Neue",sans-serif;overflow:hidden;opacity:0;transition:opacity .2s ease-out;-webkit-tap-highlight-color:transparent}'
    + '#mk-nombre.show{opacity:1}'
    + '#mk-nombre .mkn-card{position:relative;box-sizing:border-box;width:100%;max-width:440px;margin-top:clamp(8px,9vh,96px);padding:28px 24px 18px;background:#fff;border-radius:28px;box-shadow:0 1px 2px rgba(0,0,0,.04),0 12px 40px rgba(0,0,0,.08);display:flex;flex-direction:column;gap:14px;text-align:center;transform:translateY(8px) scale(.98);transition:transform .26s cubic-bezier(.23,1,.32,1)}'
    + '#mk-nombre.show .mkn-card{transform:none}'
    + '#mk-nombre .mkn-wave{font-size:44px;line-height:1}'
    + '#mk-nombre h2{margin:0;font-size:28px;line-height:1.15;font-weight:800;letter-spacing:-.02em;color:#1d1d1f;text-shadow:none}'
    + '#mk-nombre .mkn-row{display:flex;gap:10px}'
    + '#mk-nombre input{flex:1;min-width:0;box-sizing:border-box;height:56px;margin:0;padding:0 16px;font:inherit;font-size:20px;font-weight:600;color:#1d1d1f;background:#fff;border:2px solid #d2d2d7;border-radius:16px;outline:none;-webkit-user-select:text;user-select:text;transition:border-color .15s ease,box-shadow .15s ease}'
    + '#mk-nombre input:focus{border-color:#0071e3;box-shadow:0 0 0 4px rgba(0,113,227,.15)}'
    + '#mk-nombre input::placeholder{color:#a1a1a6;font-weight:500}'
    + '#mk-nombre button{box-sizing:border-box;margin:0;font:inherit;border:0;box-shadow:none;text-shadow:none;cursor:pointer;transition:transform .12s ease-out,background-color .15s ease;touch-action:manipulation}'
    + '#mk-nombre button:active{transform:scale(.97)}'
    + '#mk-nombre .mkn-oir{flex:none;height:56px;padding:0 16px;font-size:17px;font-weight:700;color:#0071e3;background:#e8f1fd;border-radius:16px;white-space:nowrap}'
    + '#mk-nombre .mkn-oir.on{background:#cfe3fb}'
    + '#mk-nombre .mkn-ok{height:56px;padding:0 16px;font-size:19px;font-weight:700;color:#fff;background:#0071e3;border-radius:16px}'
    + '#mk-nombre .mkn-no{height:40px;padding:0 12px;font-size:15px;font-weight:600;color:#6e6e73;background:transparent;border-radius:12px}'
    + '#mk-nombre .mkn-aviso{min-height:18px;margin:-4px 0 -2px;font-size:14px;line-height:18px;font-weight:600;color:#b25000}'
    + '#mk-nombre .mkn-nota{margin:0;font-size:13px;line-height:1.3;font-weight:500;color:#86868b}'
    + '#mk-nombre .mkn-x{position:absolute;top:12px;right:12px;width:36px;height:36px;padding:0;border-radius:50%;background:#f0f0f2;color:#6e6e73;font-size:16px;font-weight:700}'
    + '@media (max-height:520px){#mk-nombre .mkn-card{margin-top:0;padding:12px 18px 8px;gap:6px}#mk-nombre .mkn-wave{display:none}#mk-nombre h2{font-size:21px}#mk-nombre input,#mk-nombre .mkn-oir,#mk-nombre .mkn-ok{height:46px}#mk-nombre .mkn-no{height:30px}#mk-nombre .mkn-aviso{min-height:0}}'
    + '@media (prefers-reduced-motion:reduce){#mk-nombre,#mk-nombre .mkn-card,#mk-nombre button{transition:none}}';
  const Name = {
    d: (() => {
      let d = readJSON(NKEY);
      if (!d) {
        const bk = readJSON('mariapps_backup_id');           // el número de la copia de este aparato (la misma clave que BK_KEY, más abajo)
        d = bk && bk.id && MARIA_HUELLAS.includes(huella(String(bk.id))) ? { name: 'María', asked: true, maria: true } : { name: '', asked: false };
        if (d.maria) writeJSON(NKEY, d);
      }
      return d;
    })(),
    get value() { return this.d.name || ''; },
    get original() { return this.d.name === 'María'; },       // con «María» suenan los audios de siempre, con su nombre dentro
    // frontera de confianza: del cuadro de texto solo pasan letras, espacios y guiones (máx. 30); «juan francisco» → «Juan Francisco»
    clean(v) {
      const w = String(v || '').normalize('NFC').replace(/[^\p{L}\s-]|[ºª]/gu, '').replace(/\s+/g, ' ').trim().slice(0, 30).trim().split(' ').filter(Boolean);
      return w.map((p, i) => { const low = p.toLocaleLowerCase('es'); return i && /^(de|del|la|las|los|y)$/.test(low) ? low : low.replace(/(^|-)(\p{L})/gu, (m, a, b) => a + b.toLocaleUpperCase('es')); }).join(' ');
    },
    set(v) { this.d.name = this.clean(v); this.d.asked = true; writeJSON(NKEY, this.d); this.paint(); },
    fmt(con, sin) { const n = this.value; return n ? String(con).replace('{n}', () => n) : (sin || ''); },
    hello(pre) { return this.fmt((pre || '¡Hola') + ', {n}!', (pre || '¡Hola') + '!'); },
    g(fem, neutro) { return this.original ? fem : neutro; },     // un texto en femenino: tal cual para María, neutro para los demás (MA-D22)
    // adapta una frase escrita para María: con otro nombre lo cambia; sin nombre (o con sin=true) lo quita. Y sin femeninos, que vale para niño o niña.
    text(t, sin) {
      const n = sin ? '' : this.value; if (!t || this.original) return t;
      return String(t).replace(/¡Bienvenida al banco, María!/g, () => (n ? `¡Hola, ${n}!` : '¡Hola!') + ' Este es tu banco.')
        .replace(/¡María!\s*/g, () => (n ? `¡${n}! ` : '')).replace(/,\s*María(?![\p{L}_])/gu, () => (n ? `, ${n}` : '')).replace(/María(?![\p{L}_])/gu, () => n)
        .replace(/Bienvenida a la aventura/g, 'Empieza la aventura').replace(/Bienvenida a /g, 'Esto es ').replace(/como una heroína/g, 'a lo grande').replace(/Tranquila, lo tienes/g, 'Con calma, lo tienes');
    },
    // rellena lo escrito en la página: <h2 data-con="¡Hola, {n}!" data-sin="¡Hola!">
    paint() { $$('[data-con]').forEach(e => { e.textContent = this.fmt(e.dataset.con, e.dataset.sin); }); },
    // ----- la voz del nombre: audios grabados por el servidor con las voces de ElevenLabs y guardados en este aparato -----
    a: readJSON(NAKEY) || { clave: '', clips: {} },
    tiene(id) { return !!(this.value && this.a.clave === this.value.toLocaleLowerCase('es') && this.a.clips[id]); },
    // pide al servidor los audios que falten de un nombre (solo viaja el nombre) y los guarda aquí; true si ya están todos los pedidos
    async traer(nombre, ids) {
      const n = this.clean(nombre); if (n.replace(/[\s-]/g, '').length < 2) return false;
      const clave = n.toLocaleLowerCase('es');
      if (this.a.clave !== clave) { this.a = { clave, clips: {} }; this._b = {}; }
      const faltan = (ids || SALUDOS).filter(c => !this.a.clips[c]); if (!faltan.length) return true;
      try {
        const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 15000);
        const r = await fetch(NB_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nombre: n, clips: faltan }), signal: ctl.signal });
        clearTimeout(t);
        const j = await r.json();
        if (this.a.clave === clave) {
          // frontera de confianza: de lo que contesta el servidor solo se guardan saludos conocidos y bien formados { a: mp3 en base64, i, f }
          Object.entries(j.clips || {}).forEach(([c, x]) => { if (SALUDOS.includes(c) && x && typeof x.a === 'string' && /^[A-Za-z0-9+/=]{200,400000}$/.test(x.a)) this.a.clips[c] = { a: x.a, i: +x.i || 0, f: +x.f || 0 }; });
          writeJSON(NAKEY, this.a);
        }
      } catch (e) {}
      return this.a.clave === clave && faltan.every(c => this.a.clips[c]);
    },
    olvidar() { this.a = { clave: '', clips: {} }; this._b = {}; try { localStorage.removeItem(NAKEY); } catch (e) {} },
    // el audio guardado, listo para sonar
    buf(ctx, id) {
      const b64 = (this.a.clips[id] || {}).a; if (!ctx || !b64) return Promise.resolve(null);
      this._b = this._b || {};
      if (!this._b[id]) {
        this._b[id] = new Promise((res, rej) => { const bin = atob(b64), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); ctx.decodeAudioData(u.buffer, res, rej); }).catch(() => null);
      }
      return this._b[id];
    },
    // pone a sonar un saludo SOLO en su trozo de voz: el servidor lo midió y guardó dónde empieza (i) y acaba (f), para que no suene
    // ningún ruido de más y la frase siguiente entre seguida
    arrancar(s, id) {
      const c = this.a.clips[id] || {}, d = s.buffer.duration, i = Math.max(0, Math.min(c.i || 0, d)), f = c.f > i ? Math.min(c.f, d) : d;
      s.start(0, i, f - i);
    },
    // qué suena en un audio que llevaba «María» o femenino: el de siempre (María) · saludo con su nombre + resto · o el gemelo sin nombre
    plan(name) {
      if (this.original) return { clip: name };
      if (CLIP_NOMBRE.test(name)) {
        const s = saludoDe(name);
        if (!this.tiene(s)) return { clip: name + '_n' };
        return { pre: s, clip: s === 'genial' || s === 'vuela' ? null : name + (s === 'solo' ? '_n' : '_r') };
      }
      if (CLIP_GENERO.test(name)) return { clip: name + '_n' };
      return { clip: name };
    },
    // la pantalla «¿Cómo te llamas?» (tema claro). La primera vez no se puede cerrar sin contestar; después sirve para cambiar el nombre.
    ask() {
      if (document.getElementById('mk-nombre')) return;
      const editar = !!this.d.asked;
      const el = document.createElement('div'); el.id = 'mk-nombre';
      el.innerHTML = `<style>${NOMBRE_CSS}</style><div class="mkn-card" role="dialog" aria-modal="true" aria-labelledby="mkn-t">`
        + (editar ? '<button type="button" class="mkn-x" aria-label="Cerrar">✕</button>' : '')
        + '<div class="mkn-wave">👋</div><h2 id="mkn-t">¿Cómo te llamas?</h2>'
        + '<div class="mkn-row"><input type="text" maxlength="30" placeholder="Escribe tu nombre" aria-label="Tu nombre" autocomplete="off" autocapitalize="words" autocorrect="off" spellcheck="false" enterkeyhint="done"><button type="button" class="mkn-oir" aria-label="Oír cómo suena mi nombre">🔊 Oír</button></div>'
        + '<p class="mkn-aviso" aria-live="polite"></p>'
        + `<button type="button" class="mkn-ok">${editar ? 'Guardar' : '¡Empezar!'}</button>`
        + `<button type="button" class="mkn-no">${editar ? 'Quitar mi nombre' : 'Seguir sin nombre'}</button>`
        + '<p class="mkn-nota">Tu nombre solo se usa para decirlo con las voces de la app.</p></div>';
      document.body.appendChild(el);
      const inp = $('input', el), aviso = $('.mkn-aviso', el), oir = $('.mkn-oir', el), bOk = $('.mkn-ok', el), bNo = $('.mkn-no', el);
      inp.value = this.value;
      const antes = this.a;                                  // si prueba a oír otro nombre y luego cierra, se queda con el audio que tenía
      const cerrar = () => { this.a = antes; this._b = {}; writeJSON(NAKEY, this.a); el.classList.remove('show'); setTimeout(() => el.remove(), 220); };
      const guardar = async v => {
        const n = this.clean(v);
        if (n && n !== 'María') {                             // se piden los 9 saludos con su nombre antes de entrar (unos 2 s; si falla, entra igual y sale escrito)
          [oir, bOk, bNo].forEach(b => { b.disabled = true; }); aviso.textContent = 'Preparando tu nombre…';
          this.d.t = Date.now(); await this.traer(n);
        } else this.olvidar();
        this.set(n);
        if (/[?&]nombre=/.test(location.search)) location.replace(location.pathname); else location.reload();
      };
      inp.addEventListener('keydown', ev => { if (ev.key === 'Enter') { inp.value = this.clean(inp.value); inp.blur(); } });
      inp.addEventListener('input', () => { aviso.textContent = ''; });
      oir.addEventListener('click', async () => {
        const n = this.clean(inp.value); inp.value = n;
        if (n.replace(/[\s-]/g, '').length < 2) { aviso.textContent = 'Escribe primero tu nombre.'; inp.focus(); return; }
        Audio.unlock();
        oir.disabled = true; oir.classList.add('on'); aviso.textContent = 'Preparando tu nombre…';
        const ok = await this.traer(n, ['hola_n']); const b = ok ? await this.buf(Audio.ctx, 'hola_n') : null;
        oir.disabled = false; oir.classList.remove('on');
        if (!b) { aviso.textContent = 'Ahora no puedo decir tu nombre: saldrá escrito.'; return; }
        aviso.textContent = '';
        const s = Audio.ctx.createBufferSource(); s.buffer = b; s.connect(Audio.ctx.destination); this.arrancar(s, 'hola_n');
      });
      bOk.addEventListener('click', () => guardar(inp.value));
      bNo.addEventListener('click', () => guardar(''));
      if (editar) $('.mkn-x', el).addEventListener('click', cerrar);
      requestAnimationFrame(() => el.classList.add('show'));
    },
  };
  // si al poner el nombre no se pudieron grabar sus saludos (sin conexión, tope del día…), se reintenta como mucho cada 6 horas
  if (Name.value && !Name.original && !navigator.webdriver && !SALUDOS.every(c => Name.tiene(c)) && Date.now() - (Name.d.t || 0) > 6 * 3600 * 1000) {
    Name.d.t = Date.now(); writeJSON(NKEY, Name.d); Name.traer(Name.value);
  }

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
    canPlay(cost) { return HU.on || W.tickets > 0 || W.coins >= cost; },
    pay(cost, why) {
      if (HU.on) return { ok: true, how: 'hucha' };          // M15: con la hucha de casa el Arcade se paga en minutos, no en monedas
      if (W.tickets > 0) { W.tickets--; wlog(why, 0, -1); wsave('tickets'); return { ok: true, how: 'ticket' }; }
      if (W.coins >= cost) { W.coins -= cost; wlog(why, -cost); wsave('coins'); return { ok: true, how: 'coins' }; }
      return { ok: false, missing: cost - W.coins };
    },
    refund(cost, how, why) { if (how === 'hucha') return; if (how === 'ticket') this.addTickets(1, why); else this.add(cost, why); },
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

  // ---------- decir una frase de voz (lo usan el audio del kit y el de las tablas, que tienen la misma forma) ----------
  // M13: en la tablet de María suena el audio de siempre. A los demás, el saludo con SU nombre (grabado con la misma voz) y detrás
  // el resto de la frase; si su nombre no está grabado, el gemelo sin nombre. La voz de respaldo del navegador nunca dice el nombre.
  function sayVoice(A, name, opt) {
    opt = opt || {};
    if (!A.on || !A.ctx) return Promise.resolve();
    const id = ++A.voiceId, p = Name.plan(name);
    return Promise.all([p.pre ? Name.buf(A.ctx, p.pre) : null, p.clip ? A.load(p.clip) : null]).then(async ([b0, b]) => {
      if (A.voiceId !== id) return;                   // ya ha empezado otra frase
      A.stopVoice();
      if (!b0 && !b) return A.speak(Name.text(opt.text, true));
      for (const x of [b0, b]) {
        if (!x) continue;
        await new Promise(res => {
          const s = A.ctx.createBufferSource(); s.buffer = x; s.connect(A.ctx.destination);
          A.duck(true);
          s.onended = () => { if (A.voice === s) { A.voice = null; A.duck(false); } res(); };
          if (x === b0) Name.arrancar(s, p.pre); else s.start();     // el saludo suena solo en su trozo de voz, y la frase entra seguida
          A.voice = s;
        });
        if (A.voiceId !== id) return;
      }
    });
  }

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
    preload(names) { if (!this.ctx) return; (names || []).forEach(n => { const c = Name.plan(n).clip; if (c) this.load(c); }); },   // M13: carga lo que de verdad va a sonar en este aparato
    async sfx(name, vol) {
      if (!this.on || !this.ctx) return; const b = await this.load(name); if (!b) return;
      const s = this.ctx.createBufferSource(); s.buffer = b; const g = this.ctx.createGain(); g.gain.value = vol == null ? 1 : vol; s.connect(g); g.connect(this.ctx.destination); s.start();
    },
    say(name, opt) { return sayVoice(this, name, opt); },
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
  // OJO (MA-D21): el nombre del niño (clave «mi_nombre_v1») NO sube nunca: no añadir aquí ningún prefijo que la incluya.
  const BK_RE = /^(mariapps_|ciencias_|agua_|natural_|ingles_|lengua_|tablas_|arcade_|album_)/;   // natural_ desde el 13-oct (NS-D4): antes Science no se copiaba · lengua_ desde el 21-oct (M8)
  // (antes)   // natural_ desde el 13-oct (NS-D4): antes Science no se copiaba
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
    get bank() { return HU.on && Hucha ? Hucha.playable() : T.bank; }, get data() { return T; },
    day() { const k = dayKey(); return T.days[k] || (T.days[k] = { study: 0, play: 0 }); },
    studying(on) { tStudy = !!on; if (on) tPlay = false; },
    playing(on) { tPlay = !!on; if (on) { tStudy = false; tFired = false; } },
    canPlay(min) { return this.bank >= (min == null ? 20 : min); },
    fmt(s) { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ':' + pad2(s % 60); },
    on(f) { this.listeners.push(f); },
    save() { writeJSON(TKEY, T); if (huDirty) { huDirty = false; writeJSON(HKEY, HU); } },
    render() { $$('[data-playtime]').forEach(e => { e.textContent = this.fmt(this.bank); const p = e.closest('.pill'); if (p) p.classList.toggle('low', this.bank < 60); }); },
    tick() {
      if (document.visibilityState !== 'visible') return;
      const active = Date.now() - lastInput < this.IDLE;
      if (tStudy && active) { T.study++; this.day().study++; if (!HU.on) T.bank = Math.min(this.CAP, T.bank + this.RATIO); tDirty++; }
      else if (tPlay) { T.play++; this.day().play++; if (HU.on && Hucha) Hucha.spend(1, 'juego'); else T.bank = Math.max(0, T.bank - 1); tDirty++; if (this.bank <= 0 && !tFired) { tFired = true; this.listeners.forEach(f => { try { f('timeout'); } catch (e) {} }); } }
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
    exam(nota, app) { if (nota < 10) return 0; if (HU.on && Hucha) { Hucha.exam10(app); return 0; } const s = (CFG.EXAM10_MINUTES || 10) * 60; this.grant('youtube', s, 'examen 10 ' + app); return s; },
  };

  // ---------- la hucha de casa (M15, PR-D3…PR-D10): créditos que se ganan estudiando y se gastan en jugar y en YouTube ----------
  // Nace APAGADA en cada aparato y solo se enciende con la clave de Bernardo; apagada, todo funciona como siempre (PR-D7).
  // · 1 crédito por ronda bien hecha (7 aciertos de cada 10); cada ejercicio paga una sola vez al día (PR-D3) · un 10 en el examen de prueba: 5 más (PR-D10)
  // · sábado y domingo 1 crédito = 1 minuto; de lunes a viernes 1 minuto cuesta 2 créditos; igual para jugar que para YouTube (PR-D4)
  // · cada noche 1 crédito por cada 10 guardados, solo los primeros 50, y como mucho 7 noches seguidas sin abrir la app (PR-D5, PR-D10)
  // · tope de minutos al día, que solo cambia Bernardo (PR-D6) · los minutos ganados antes quedan como «vale», sin interés (PR-D8)
  // Por dentro se cuenta en segundos de crédito (60 = 1 crédito) para poder cobrar el juego segundo a segundo.
  const HU_HASH = '3d94cbbf55bd5695871233e8eaa8fd7459e8b91e5c05a5330c25fd4bce06a037', HU_SALT = 'mariapps-hucha-v1:';
  let huChipT = 0;
  Hucha = {
    PER_ROUND: 1, PASS: .7, MIN_Q: 4, EXAM10: 5, RATE_WEEK: 2, RATE_WEEKEND: 1, INT_EVERY: 10, INT_TOP: 50, MAX_NIGHTS: 7,
    DIAS: ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'],
    lastPayout: 0, listeners: [],
    _now: () => new Date(),                                   // las pruebas lo cambian para simular otro día
    get on() { return !!HU.on; }, get data() { return HU; },
    get credits() { return Math.floor(HU.cs / 60); },
    get src() { return HU.src === 'vale' && HU.vale > 0 ? 'vale' : 'cred'; },   // con qué paga ahora: créditos o el vale de antes
    listen(f) { this.listeners.push(f); },
    render() { $$('[data-credits]').forEach(e => { e.textContent = this.credits; }); },
    save() { huDirty = false; writeJSON(HKEY, HU); this.render(); Time.render(); this.listeners.forEach(f => { try { f(); } catch (e) {} }); },
    today() { return dayKey(this._now()); },
    weekend(d) { const w = (d || this._now()).getDay(); return w === 0 || w === 6; },
    rate(d) { return this.weekend(d) ? this.RATE_WEEKEND : this.RATE_WEEK; },   // créditos por minuto
    capSecs(d) { return (this.weekend(d) ? HU.cap.we : HU.cap.wk) * 60; },
    usedToday() { return HU.used.day === this.today() ? HU.used.secs : 0; },
    leftToday() { return Math.max(0, this.capSecs() - this.usedToday()); },
    // segundos que puede gastar AHORA: lo que le alcanza (créditos al precio de hoy, o el vale) sin pasar del tope de hoy
    playable(src) { const have = (src || this.src) === 'vale' ? HU.vale : Math.floor(HU.cs / this.rate()); return Math.max(0, Math.min(this.leftToday(), have)); },
    setSrc(s) { HU.src = s === 'vale' ? 'vale' : 'cred'; this.save(); },
    note(k, n, why, extra) { HU.log.push(Object.assign({ t: this._now().getTime(), k, n, why: why || '' }, extra || {})); if (HU.log.length > 80) HU.log.splice(0, HU.log.length - 80); },
    // gasta segundos de juego o de YouTube (no guarda: guarda quien llama, o el reloj cada pocos segundos)
    spend(secs, why, src) {
      src = src || this.src; secs = Math.min(secs, this.playable(src)); if (!(secs > 0)) return 0;
      huDirty = true; if (src === 'vale') HU.vale = Math.max(0, HU.vale - secs); else HU.cs = Math.max(0, HU.cs - secs * this.rate());
      const k = this.today(); if (HU.used.day !== k) HU.used = { day: k, secs: 0 }; HU.used.secs += secs;
      const last = HU.log[HU.log.length - 1];
      if (last && last.k === 'gasto' && last.why === why && last.src === src && dayKey(new Date(last.t)) === k) last.s += secs; else this.note('gasto', 0, why, { src, s: secs });
      return secs;
    },
    interestOf(cr) { return Math.floor(Math.min(cr, this.INT_TOP) / this.INT_EVERY); },
    grow(cr, nights) { for (let i = 0; i < nights; i++) cr += this.interestOf(cr); return cr; },   // cuánto habrá tras esas noches sin tocar nada
    nightsToSaturday(d) { const w = (d || this._now()).getDay(); return w === 6 ? 7 : 6 - w; },
    // paga el interés de las noches pasadas desde la última vez (se llama al cargar cualquier página)
    accrue() {
      if (!HU.on) return 0;
      const today = this.today();
      if (!HU.lastNight) { HU.lastNight = today; writeJSON(HKEY, HU); return 0; }
      let nights = 0; const d = new Date(HU.lastNight + 'T12:00:00');
      while (dayKey(d) < today && nights < 400) { d.setDate(d.getDate() + 1); nights++; }
      if (!nights) return 0;
      let total = 0; const pay = Math.min(nights, this.MAX_NIGHTS);
      for (let i = pay - 1; i >= 0; i--) {
        const n = this.interestOf(this.credits); if (!n) continue;
        HU.cs += n * 60; total += n; const dd = new Date(today + 'T12:00:00'); dd.setDate(dd.getDate() - i); HU.paid.push({ d: dayKey(dd), n });
      }
      if (HU.paid.length > 40) HU.paid.splice(0, HU.paid.length - 40);
      HU.lastNight = today; HU.interest += total; this.lastPayout = total; if (total) this.note('interes', total, pay + (pay === 1 ? ' noche' : ' noches'));
      writeJSON(HKEY, HU); return total;
    },
    // fin de una ronda de cualquier app: paga 1 crédito si está bien hecha y ese ejercicio no ha pagado hoy. Apagada: no hace nada.
    round(key, ok, total) {
      if (!HU.on || !(total >= this.MIN_Q)) return null;
      const k = this.today(); if (HU.done.day !== k) HU.done = { day: k, keys: {} };
      let r;
      if (ok / total < this.PASS) r = { paid: 0, why: 'floja' };
      else if (HU.done.keys[key]) r = { paid: 0, why: 'repetida' };
      else { HU.done.keys[key] = 1; HU.cs += this.PER_ROUND * 60; this.note('ronda', this.PER_ROUND, key); r = { paid: this.PER_ROUND, why: 'ronda' }; }
      this.save(); this.chip(r, 900); return r;
    },
    exam10(app) { if (!HU.on) return 0; HU.cs += this.EXAM10 * 60; this.note('examen', this.EXAM10, app); this.save(); this.chip({ paid: this.EXAM10, why: 'examen' }, 4000); return this.EXAM10; },
    chip(r, delay) {
      const txt = r.why === 'examen' ? `🐷 ¡Un 10! +${r.paid} créditos para tu hucha`
        : r.paid ? `🐷 +${r.paid} crédito para tu hucha · ya tienes ${this.credits}`
          : r.why === 'repetida' ? '🐷 Este ejercicio ya te ha pagado hoy. Prueba otro y ganas 1 crédito'
            : '🐷 Para ganar el crédito hacen falta 7 aciertos de cada 10';
      setTimeout(() => {
        const el = layer('mk-hucha-chip', '');
        el.style.cssText = 'position:fixed;left:50%;top:calc(env(safe-area-inset-top,0px) + 64px);transform:translateX(-50%);z-index:9000;max-width:min(92vw,520px);width:max-content;padding:10px 16px;border-radius:999px;background:#fff;color:#1b2033;font:800 15px/1.25 system-ui,sans-serif;text-align:center;box-shadow:0 8px 28px rgba(0,0,0,.28);pointer-events:none;opacity:1;transition:opacity .3s';
        el.textContent = txt; if (r.paid) Audio.sfx('coin', .7);
        clearTimeout(huChipT); huChipT = setTimeout(() => { el.style.opacity = '0'; }, 2800);
      }, delay || 0);
    },
    // la clave de Bernardo: aquí solo está su huella, no la clave. Cinco fallos seguidos = un minuto de espera.
    async checkPin(pin) {
      if (Date.now() < (HU.lockUntil || 0)) return 'espera';
      if (!(window.crypto && crypto.subtle)) return 'sin';     // solo se puede comprobar por https (o en el propio ordenador)
      let hex = '';
      try { const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(HU_SALT + pin)); hex = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join(''); } catch (e) { return false; }
      if (hex === (CFG.HUCHA_HASH || HU_HASH)) { HU.fails = 0; HU.lockUntil = 0; writeJSON(HKEY, HU); return true; }
      HU.fails = (HU.fails || 0) + 1; if (HU.fails >= 5) { HU.fails = 0; HU.lockUntil = Date.now() + 60000; }
      writeJSON(HKEY, HU); return false;
    },
    // encender o apagar en ESTE aparato (la pantalla de mayores lo llama después de comprobar la clave)
    setOn(v) {
      v = !!v; if (v === !!HU.on) return;
      if (v) {
        const today = this.today(); HU.on = true; if (!HU.since) HU.since = today; HU.lastNight = today;
        const old = Math.round((PR.youtube || 0) + (T.bank || 0));          // PR-D8: los minutos de antes pasan a ser un vale
        if (old > 0) { HU.vale += old; PR.youtube = 0; T.bank = 0; writeJSON(PKEY, PR); writeJSON(TKEY, T); this.note('vale', 0, 'minutos de antes', { s: old }); }
        if (BK.saved > 0) Bank.withdraw(BK.saved, 'banco: cerrado por la hucha');   // PR-D10: el banco de monedas se esconde; sus monedas vuelven al montón
      } else {
        HU.on = false; if (HU.vale > 0) { PR.youtube = (PR.youtube || 0) + HU.vale; HU.vale = 0; writeJSON(PKEY, PR); }
      }
      this.note('ajuste', 0, v ? 'hucha encendida' : 'hucha apagada'); this.save();
    },
    setCap(wk, we) { HU.cap.wk = clamp(Math.round(wk) || 0, 0, 180); HU.cap.we = clamp(Math.round(we) || 0, 0, 240); this.save(); },
  };
  { const hp = Hucha.accrue(); if (hp > 0 && !navigator.webdriver) setTimeout(() => { UI.toast(`🐷 Esta noche tu hucha ha crecido +${hp} ${hp === 1 ? 'crédito' : 'créditos'}`, 3600); Audio.sfx('coin', .8); }, 1800); }
  // Otra pestaña, volver atrás con el botón de la tablet o despertar la pantalla: se relee lo guardado, para no pisar créditos recién ganados con una copia vieja.
  const huSync = pay => { if (huDirty) return; const d = readJSON(HKEY); if (d) Object.assign(HU, d); if (pay) Hucha.accrue(); Hucha.render(); Time.render(); Hucha.listeners.forEach(f => { try { f(); } catch (e) {} }); };
  window.addEventListener('storage', ev => { if (ev.key === HKEY) huSync(false); });
  window.addEventListener('pageshow', ev => { if (ev.persisted) huSync(true); });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && HU.on) huSync(true); });

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

  // ---------- la ficha del libro (NS-D4/CS-D1): la foto original de la ficha a pantalla completa, con pestañas 1-4 ----------
  // Tocar la foto la agranda justo donde tocas (y se mueve arrastrando); otro toque la vuelve a encajar. list = [{ src, name }].
  const Ficha = {
    list: [], i: 0,
    el() {
      const l = layer('mk-ficha', 'ficha-view', '<div class="fv-bar"><div class="fv-tabs"></div><button class="btn btn-ghost btn-sm fv-close">Cerrar</button></div><div class="fv-scroll"><img alt="La ficha del libro"></div><div class="fv-hint"><span class="h-fit">Toca la ficha para verla más grande</span><span class="h-zoom">Arrastra para moverte · toca otra vez para verla entera</span></div>');
      if (!l.dataset.wired) {
        l.dataset.wired = '1';
        const img = $('img', l), sc = $('.fv-scroll', l);
        $('.fv-close', l).onclick = () => l.classList.remove('show');
        img.onclick = ev => {
          if (l.classList.contains('zoom')) { l.classList.remove('zoom'); img.style.width = ''; return; }
          const r = img.getBoundingClientRect(), rx = (ev.clientX - r.left) / r.width, ry = (ev.clientY - r.top) / r.height;
          img.style.width = Math.round(r.width * 2.4) + 'px'; l.classList.add('zoom');
          sc.scrollLeft = rx * img.offsetWidth - sc.clientWidth / 2; sc.scrollTop = ry * img.offsetHeight - sc.clientHeight / 2;
        };
      }
      return l;
    },
    open(list, i) {
      const l = this.el(); this.list = list || [];
      $('.fv-tabs', l).innerHTML = this.list.map((f, k) => `<button class="fv-tab" data-k="${k}"><b>${k + 1}</b><span>${f.name}</span></button>`).join('');
      $$('.fv-tab', l).forEach(b => { b.onclick = () => this.show(+b.dataset.k); });
      this.show(i || 0); l.classList.add('show'); Audio.sfx('pop', .4);
    },
    show(i) {
      const l = this.el(), img = $('img', l); this.i = i;
      l.classList.remove('zoom'); img.style.width = ''; img.src = (this.list[i] || {}).src || '';
      $$('.fv-tab', l).forEach(b => b.classList.toggle('on', +b.dataset.k === i));
    },
  };

  window.MK = { Backup, Time, Bank, Prizes, Hucha, Radio, CFG, $, $$, sleep, rnd, pick, shuffle, clamp, pad2, dayKey, REDUCED, ROOT, norm, matchKeys, readJSON, writeJSON, store, Settings, Wallet, Audio, vibrate, UI, Confetti, Nav, tapSounds, timeHM, Ficha, Name, sayVoice };

  // M13: lo escrito con el nombre, y la pregunta «¿Cómo te llamas?» la primera vez que se entra en este aparato.
  // En las pruebas automáticas no sale sola (taparía todas las pantallas); con ?nombre=1 se abre siempre, también para cambiarlo.
  Name.paint();
  if (/[?&]nombre=/.test(location.search) || (!Name.d.asked && !navigator.webdriver)) Name.ask();
})();
