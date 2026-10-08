/* Arcade — minijuegos de premio comunes a todo el móvil (MA-D4/MA-D5). Se pagan con la hucha común: 1 entrada o 100 monedas.
   Contrato de cada juego: window.MiniGames[id].start(container, opts) → { stop() }; opts.onEnd({ score, won }). */
(function () {
  'use strict';
  const { $, $$, Wallet, Audio, UI, Nav, sleep } = MK;
  Audio.dirs = [{ dir: '../tablas/assets/audio/', test: /^music_(onepiece|demonslayer|haikyuu)$/ }, MK.ROOT + 'shared/audio/'];   // músicas de los mundos (tablas) y lo genérico
  const COST = 100;
  const GAMES = [
    { id: 'pacman', world: 'onepiece', img: '../tablas/assets/img/ch_luffy.webp', title: 'Luffy come carne', desc: 'Come toda la carne y escapa de los Marines' },
    { id: 'slash', world: 'demonslayer', img: '../tablas/assets/img/ch_nezuko.webp', title: 'Corta demonios', desc: 'Corta demonios con la espada (¡a Nezuko no!)' },
    { id: 'volley', world: 'haikyuu', img: '../tablas/assets/img/ch_hinata.webp', title: 'Remate de Hinata', desc: 'Remata en el momento justo' },
    { id: 'tetris', world: 'demonslayer', img: '../tablas/assets/img/ch_tanjiro.webp', title: 'Tetris Hashira', desc: 'Encaja los bloques y corta las filas con la katana' },
    { id: 'flappy', world: 'onepiece', img: '../tablas/assets/img/ch_nami.webp', title: 'Nami vuela entre islas', desc: 'Toca para aletear y pasa entre las islas' },
    { id: 'runner', world: 'mha', img: '../shared/img/st_deku.webp', title: 'Deku corre', desc: 'Salta los obstáculos y llega lo más lejos' },
    { id: 'memory', world: 'mha', img: '../shared/img/icon_album.webp', title: 'Parejas de pegatinas', desc: 'Encuentra las parejas de tu álbum' },
    { id: 'whack', world: 'demonslayer', img: '../tablas/assets/img/boss_demon.webp', title: 'Golpea al oni', desc: 'Dale al oni cuando asome, ¡a Nezuko no!' },
  ];
  const WORLD = {
    onepiece: { music: 'music_onepiece', theme: { accent: '#E4002B', accent2: '#FFC72C', bg: '#0b1a33', text: '#fff' } },
    demonslayer: { music: 'music_demonslayer', theme: { accent: '#1E6F50', accent2: '#F4A6C8', bg: '#0f0f1a', text: '#fff' } },
    haikyuu: { music: 'music_haikyuu', theme: { accent: '#F26A1B', accent2: '#111', bg: '#1a1a1f', text: '#fff' } },
    mha: { music: 'music_mha', theme: { accent: '#2BA84A', accent2: '#FFD54F', bg: '#101a12', text: '#fff' } },
  };
  const { S, save } = MK.store('arcade_v1', () => ({ best: {}, plays: 0 }));

  function renderList() {
    const el = $('#games-list'); el.innerHTML = '';
    GAMES.forEach(g => {
      const mod = window.MiniGames && window.MiniGames[g.id];
      const c = document.createElement('button'); c.className = `game-card g-${g.world}${mod ? '' : ' locked'}`;
      c.innerHTML = `<img src="${g.img}" alt=""><div><b>${mod ? (mod.title || g.title) : g.title}</b><small>${g.desc}</small><small>${mod ? 'Récord: ' + (S.best[g.id] || 0) : 'Muy pronto'}</small></div><span class="cost">${mod ? (Wallet.tickets ? '1 entrada' : COST + ' ฿') : '🔒'}</span>`;
      c.addEventListener('click', () => play(g));
      el.appendChild(c);
    });
    UI.stagger(el); Wallet.render();
  }

  let PLAY = null, token = 0;
  async function play(g) {
    const mod = window.MiniGames && window.MiniGames[g.id];
    if (!mod) { UI.toast('Este juego llegará muy pronto'); return; }
    Audio.unlock();
    const pay = Wallet.pay(COST, 'arcade ' + g.id);
    if (!pay.ok) { Audio.sfx('wrong', .6); UI.toast(`Te faltan ${pay.missing} monedas. ¡A estudiar!`); return; }
    const w = WORLD[g.world]; UI.setWorld(g.world); $('#play-title').textContent = mod.title || g.title;
    const area = $('#play-area'); area.innerHTML = ''; const box = document.createElement('div'); area.appendChild(box);
    UI.show('play'); Audio.music(w.music, .18); Audio.say('v_minigame'); Audio.sfx('chest', .7);
    const t = ++token; await sleep(80); if (token !== t) return;
    S.plays++; save();
    try {
      PLAY = mod.start(box, {
        durationMs: 80000, theme: w.theme, vibrate: MK.vibrate, sfx: { play: n => Audio.sfx(n, .8) }, onScore: () => {},
        onEnd: res => {
          if (token !== t) return; PLAY = null;
          const score = (res && res.score) | 0, won = !!(res && res.won);
          const isBest = score > (S.best[g.id] || 0); S.best[g.id] = Math.max(S.best[g.id] || 0, score); save();
          const bonus = won ? 25 : 5; Wallet.add(bonus, 'arcade premio ' + g.id);
          Audio.sfx(won ? 'win' : 'coin'); if (won) MK.Confetti.burst(120);
          UI.toast(`${isBest && score > 0 ? '¡Nuevo récord! ' : ''}${score} puntos · +${bonus} monedas`, 2600);
          setTimeout(() => { if (token === t) { area.innerHTML = ''; goList(); } }, 500);
        },
      });
    } catch (e) { UI.toast('El juego ha fallado, te devuelvo lo pagado'); Wallet.refund(COST, pay.how, 'arcade fallo'); goList(); }
  }
  function leavePlay() { token++; const p = PLAY; PLAY = null; try { p && p.stop && p.stop(); } catch (e) {} $('#play-area').innerHTML = ''; goList(); }
  function goList() { UI.setWorld(null); Audio.music('music_home', .25); renderList(); UI.show('list'); }

  $('#btn-back').addEventListener('click', () => Nav.back('../index.html'));
  $('#play-back').addEventListener('click', leavePlay);
  document.addEventListener('pointerdown', () => Audio.unlock(), { once: true });
  MK.tapSounds();
  Wallet.touchDay();
  renderList();
  window.__arcade = { GAMES, play, S, Wallet, get PLAY() { return PLAY; } };
})();
