/* MariApps — lógica de la pantalla de inicio: reloj, iconos de apps, apertura animada, álbum de pegatinas. */
(function () {
  'use strict';
  const { $, $$, Wallet, Audio, UI, Nav, Settings } = MK;

  const APPS = [
    { id: 'tablas', name: 'Tablas', icon: 'tablas/assets/img/icon.png', href: 'tablas/index.html', emoji: '✖️' },
    { id: 'ciencias', name: 'Ciencias', icon: 'shared/img/icon_ciencias.webp', href: 'ciencias/index.html', emoji: '🌍' },
    { id: 'arcade', name: 'Arcade', icon: 'shared/img/icon_arcade.webp', href: 'arcade/index.html', emoji: '🕹️' },
    { id: 'album', name: 'Álbum', icon: 'shared/img/icon_album.webp', sheet: 'album', emoji: '⭐' },
    { id: 'lengua', name: 'Lengua', soon: true, emoji: '📖' },
    { id: 'ingles', name: 'English', soon: true, emoji: '🇬🇧' },
    { id: 'mates', name: 'Mates', soon: true, emoji: '➗' },
    { id: 'musica', name: 'Música', soon: true, emoji: '🎵' },
  ];
  const DOCK = ['ciencias', 'tablas', 'arcade'];

  // ---------- reloj ----------
  function tick() { $('#clock').textContent = MK.timeHM(); }
  tick(); setInterval(tick, 10000);

  // ---------- fondo (si ya está generado) ----------
  const wp = new Image(); wp.onload = () => $('.wall').classList.add('ready'); wp.src = 'shared/img/wallpaper.webp';

  // ---------- iconos ----------
  function makeIcon(app, i) {
    const b = document.createElement('button'); b.className = 'appicon' + (app.soon ? ' soon' : ''); b.style.setProperty('--i', i); b.dataset.id = app.id;
    const wrap = document.createElement('div'); wrap.className = 'icwrap';
    const ic = document.createElement('div'); ic.className = 'ic' + (app.soon ? ' soon' : '');
    if (app.icon) { const img = new Image(); img.alt = ''; img.src = app.icon; img.onerror = () => { img.remove(); ic.textContent = app.emoji; ic.style.background = 'linear-gradient(135deg,#4f7cff,#F52C98)'; }; ic.appendChild(img); }
    else ic.textContent = app.emoji;
    wrap.appendChild(ic); b.appendChild(wrap);
    const span = document.createElement('span'); span.textContent = app.name; b.appendChild(span);
    b.addEventListener('click', () => open(app, ic));
    return b;
  }
  const grid = $('#apps'); APPS.forEach((a, i) => grid.appendChild(makeIcon(a, i)));
  const dock = $('#dock');
  DOCK.forEach(id => { const a = APPS.find(x => x.id === id); if (a) dock.appendChild(makeIcon(a, 0)); });
  const snd = document.createElement('button'); snd.className = 'iconbtn'; snd.id = 'btn-sound'; snd.innerHTML = '<svg class="ico"><use href="#i-sound"/></svg>';
  snd.addEventListener('click', () => { Audio.setOn(!Audio.on); renderSound(); if (Audio.on) { Audio.unlock(); Audio.sfx('pop', .5); } });
  dock.appendChild(snd);
  function renderSound() { $('#btn-sound use').setAttribute('href', Audio.on ? '#i-sound' : '#i-mute'); }
  renderSound();

  // ---------- abrir una app: el icono crece hasta llenar la pantalla y luego navega ----------
  let opening = false;
  function open(app, ic) {
    if (opening) return;
    Audio.unlock(); Audio.sfx('pop', .4);
    if (app.soon) { UI.toast(`«${app.name}» llegará muy pronto`); MK.vibrate(30); return; }
    if (app.sheet === 'album') return openAlbum();
    opening = true;
    const r = ic.getBoundingClientRect();
    const o = document.createElement('div'); o.className = 'opener';
    o.style.cssText = `left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;`;
    const img = $('img', ic); if (img) { const c = img.cloneNode(); o.appendChild(c); } else { o.style.background = ic.style.background || '#fff'; }
    document.body.appendChild(o);
    const sx = innerWidth / r.width, sy = innerHeight / r.height, s = Math.max(sx, sy) * 1.05;
    const tx = innerWidth / 2 - (r.left + r.width / 2), ty = innerHeight / 2 - (r.top + r.height / 2);
    requestAnimationFrame(() => { o.classList.add('go'); o.style.transform = `translate(${tx}px, ${ty}px) scale(${s})`; });
    setTimeout(() => { location.href = app.href; }, MK.REDUCED ? 0 : 260);
    setTimeout(() => { opening = false; o.remove(); }, 2500);   // por si el navegador vuelve atrás con la página en caché
  }
  window.addEventListener('pageshow', ev => { if (ev.persisted) { opening = false; $$('.opener').forEach(e => e.remove()); Wallet.render(); renderWidget(); } });

  // ---------- widget de saludo ----------
  function renderWidget() {
    const h = new Date().getHours();
    const saludo = h < 12 ? '¡Buenos días' : h < 20 ? '¡Hola' : '¡Buenas noches';
    $('#w-hello').textContent = `${saludo}, ${Settings.S.name || 'María'}!`;
    const streak = Wallet.streakDays(), st = Wallet.stickers.length, total = window.MK_STICKERS.length;
    const partes = [];
    if (streak >= 2) partes.push(`${streak} días seguidos 🔥`);
    partes.push(`${st} de ${total} pegatinas`);
    $('#w-sub').textContent = partes.join(' · ');
    Wallet.render();
  }
  renderWidget();
  Wallet.on(renderWidget);

  // ---------- álbum de pegatinas ----------
  const seen = MK.store('album_seen_v1', () => ({ ids: [] }));
  function openAlbum() {
    const body = $('#album-body'); body.innerHTML = '';
    $('#album-total').textContent = window.MK_STICKERS.length;
    const owned = Wallet.stickers;
    Object.entries(window.MK_SERIES).forEach(([sid, s]) => {
      const sec = document.createElement('div'); sec.className = 'album-series';
      const list = window.MK_STICKERS.filter(x => x.series === sid);
      const have = list.filter(x => owned.includes(x.id)).length;
      sec.innerHTML = `<h3><i style="background:${s.color}"></i>${s.name} <span class="muted" style="font-weight:700">${have}/${list.length}</span></h3><div class="album-grid"></div>`;
      const g = $('.album-grid', sec);
      list.forEach(x => {
        const has = owned.includes(x.id);
        const b = document.createElement('button'); b.className = 'sticker' + (has ? '' : ' locked') + (has && !seen.S.ids.includes(x.id) ? ' new' : '');
        b.innerHTML = `<img src="${x.img}" alt=""><span>${has ? x.name : '?'}</span>`;
        b.addEventListener('click', () => { if (!has) { UI.toast('Gana esta pegatina jugando'); return; } Audio.sfx('pop', .5); UI.lightbox(x.img); if (!seen.S.ids.includes(x.id)) { seen.S.ids.push(x.id); seen.save(); b.classList.remove('new'); } });
        g.appendChild(b);
      });
      sec.appendChild(g); body.appendChild(sec);
    });
    $('#album').classList.add('show'); $('#dim').classList.add('show');
  }
  function closeAlbum() { $('#album').classList.remove('show'); $('#dim').classList.remove('show'); }
  $('#album-close').addEventListener('click', closeAlbum);
  $('#dim').addEventListener('click', closeAlbum);
  // arrastrar la hoja hacia abajo para cerrarla
  (function () {
    const sh = $('#album'); let y0 = null, dy = 0;
    sh.addEventListener('pointerdown', ev => { if (ev.target.closest('.sheet-body') && $('.sheet-body').scrollTop > 0) return; y0 = ev.clientY; dy = 0; sh.style.transition = 'none'; });
    window.addEventListener('pointermove', ev => { if (y0 == null) return; dy = Math.max(0, ev.clientY - y0); sh.style.transform = `translateY(${dy}px)`; });
    window.addEventListener('pointerup', () => { if (y0 == null) return; sh.style.transition = ''; sh.style.transform = ''; if (dy > 120) closeAlbum(); y0 = null; });
  })();

  MK.tapSounds('.appicon, .iconbtn, .sticker');
  Wallet.touchDay();
  window.__launcher = { open, openAlbum, APPS };
})();
