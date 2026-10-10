/* Arcade — minijuegos de premio comunes a todo el móvil (MA-D4/MA-D5). Se pagan con la hucha común: 1 entrada o 150 monedas (AR-D1),
   y SOLO si queda tiempo de juego (MK.Time: cada 4 min de estudio real dan 1 min de juego; la partida descuenta sus segundos reales).
   Contrato de cada juego: window.MiniGames[id].start(container, opts) → { stop() }; opts.onEnd({ score, won }). */
(function () {
  'use strict';
  const { $, $$, Wallet, Audio, UI, Nav, sleep, Time } = MK;
  Audio.dirs = [{ dir: '../tablas/assets/audio/', test: /^music_(onepiece|demonslayer|haikyuu)$/ }, MK.ROOT + 'shared/audio/'];   // músicas de los mundos (tablas) y lo genérico
  const COST = 150, PRIZE_WIN = 10, PRIZE_LOSE = 0, MIN_SECS = 20;
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
    const can = Time.canPlay(MIN_SECS);
    $('#arcade-time').textContent = can ? `Te quedan ${Time.fmt(Time.bank)} de juego. Cada 4 min de estudio te dan 1 min.` : 'No te queda tiempo de juego: cada 4 min de estudio te dan 1 min. ¡A estudiar!';
    $('.arcade-info').classList.toggle('no-time', !can);
    GAMES.forEach(g => {
      const mod = window.MiniGames && window.MiniGames[g.id];
      const c = document.createElement('button'); c.className = `game-card g-${g.world}${mod ? '' : ' locked'}${can ? '' : ' no-time'}`;
      c.innerHTML = `<img src="${g.img}" alt=""><div><b>${mod ? (mod.title || g.title) : g.title}</b><small>${g.desc}</small><small>${mod ? 'Récord: ' + (S.best[g.id] || 0) : 'Muy pronto'}</small></div><span class="cost">${mod ? (can ? (Wallet.tickets ? '1 entrada' : COST + ' ฿') : '⏱️') : '🔒'}</span>`;
      c.addEventListener('click', () => play(g));
      el.appendChild(c);
    });
    UI.stagger(el); Wallet.render(); Time.render();
  }

  let PLAY = null, token = 0;
  async function play(g) {
    const mod = window.MiniGames && window.MiniGames[g.id];
    if (!mod) { UI.toast('Este juego llegará muy pronto'); return; }
    Audio.unlock();
    if (!Time.canPlay(MIN_SECS)) { Audio.sfx('wrong', .6); Audio.say('v_notime', { text: 'No te queda tiempo de juego. Estudia un poco y vuelve.' }); UI.toast('No te queda tiempo de juego: cada 4 min de estudio te dan 1 min. ¡A estudiar!', 3000); return; }
    const pay = Wallet.pay(COST, 'arcade ' + g.id);
    if (!pay.ok) { Audio.sfx('wrong', .6); UI.toast(`Te faltan ${pay.missing} monedas. ¡A estudiar!`); return; }
    const w = WORLD[g.world]; UI.setWorld(g.world); $('#play-title').textContent = mod.title || g.title;
    const area = $('#play-area'); area.innerHTML = ''; const box = document.createElement('div'); area.appendChild(box);
    UI.show('play'); Audio.music(w.music, .18); Audio.say('v_minigame'); Audio.sfx('chest', .7);
    const t = ++token; await sleep(80); if (token !== t) return;
    S.plays++; save();
    const durationMs = Math.min(80000, Math.max(MIN_SECS, Math.floor(Time.bank)) * 1000);   // la partida nunca dura más que el tiempo que queda
    try {
      PLAY = mod.start(box, {
        durationMs, theme: w.theme, vibrate: MK.vibrate, sfx: { play: n => Audio.sfx(n, .8) }, onScore: () => {},
        onEnd: res => {
          if (token !== t) return; PLAY = null; Time.playing(false); Time.save();
          const score = (res && res.score) | 0, won = !!(res && res.won);
          const isBest = score > (S.best[g.id] || 0); S.best[g.id] = Math.max(S.best[g.id] || 0, score); save();
          const bonus = won ? PRIZE_WIN : PRIZE_LOSE; if (bonus) Wallet.add(bonus, 'arcade premio ' + g.id);
          Audio.sfx(won ? 'win' : 'coin'); if (won) MK.Confetti.burst(120);
          UI.toast(`${isBest && score > 0 ? '¡Nuevo récord! ' : ''}${score} puntos${bonus ? ' · +' + bonus + ' monedas' : ''}`, 2600);
          setTimeout(() => { if (token === t) { area.innerHTML = ''; goList(); } }, 500);
        },
      });
      Time.playing(true);
    } catch (e) { UI.toast('El juego ha fallado, te devuelvo lo pagado'); Wallet.refund(COST, pay.how, 'arcade fallo'); Time.playing(false); goList(); }
  }
  function leavePlay() { token++; const p = PLAY; PLAY = null; Time.playing(false); Time.save(); try { p && p.stop && p.stop(); } catch (e) {} $('#play-area').innerHTML = ''; goList(); }
  function goList() { UI.setWorld(null); Audio.music('music_home', .25); renderList(); UI.show('list'); }
  // se acabó el tiempo de juego en mitad de una partida: se corta (AR-D1)
  Time.on(ev => { if (ev === 'timeout' && PLAY) { leavePlay(); Audio.sfx('ding', .8); UI.toast('Se acabó el tiempo de juego. Estudia un poco y vuelves', 3000); } });

  $('#btn-back').addEventListener('click', () => Nav.back('../index.html'));
  $('#play-back').addEventListener('click', leavePlay);
  $('#radio-slot').appendChild(MK.Radio.button());
  document.addEventListener('pointerdown', () => Audio.unlock(), { once: true });
  window.addEventListener('pagehide', () => { Time.playing(false); Time.save(); });
  MK.tapSounds();
  Wallet.touchDay();
  renderList();
  window.__arcade = { GAMES, play, S, Wallet, COST, get PLAY() { return PLAY; } };
})();
