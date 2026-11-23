/* La hucha de casa (M15, PR-D3…PR-D10): la pantalla de María y, tras la clave, la de mayores.
   Toda la cuenta (créditos, interés, precio del día, tope) vive en shared/kit.js (MK.Hucha): aquí solo se enseña. */
(function () {
  'use strict';
  const { $, $$, Hucha: H, Audio, Nav } = MK;
  Audio.dirs = [MK.ROOT + 'shared/audio/'];
  const D = H.DIAS;
  const pl = (n, uno, varios) => n + ' ' + (n === 1 ? uno : varios);
  const mins = s => Math.floor(s / 60);

  function render() {
    const on = H.on; $('#hu-on').hidden = !on; $('#hu-off').hidden = on;
    if (!on) return;
    const now = H._now(), cr = H.credits, we = H.weekend(now), rate = H.rate(now), d = H.data;
    // cuánto tiene y cuánto ha crecido por esperar
    $('#hu-credits').textContent = cr; $('#hu-credits-w').textContent = cr === 1 ? 'crédito' : 'créditos';
    const last = d.paid.length ? d.paid[d.paid.length - 1] : null;
    $('#hu-grown').innerHTML = d.interest > 0
      ? `Han crecido <b>+${d.interest}</b> por esperar` + (last && last.d === H.today() ? ` · esta noche <b>+${last.n}</b>` : '')
      : 'Guarda créditos y crecerán solos cada noche';
    // cuánto vale hoy y cuánto valdría el sábado
    const hoy = Math.floor(cr / rate), nights = H.nightsToSaturday(now), later = H.grow(cr, nights);
    $('#hu-day').textContent = 'Hoy, ' + D[now.getDay()];
    $('#hu-price').textContent = we ? 'Fin de semana: 1 crédito = 1 minuto. Hoy tus créditos valen el doble.' : 'Hoy 1 minuto cuesta 2 créditos. Sábado y domingo cuesta 1.';
    $('#hu-mins').textContent = hoy; $('#hu-mins-w').textContent = (hoy === 1 ? 'minuto' : 'minutos') + ' hoy';
    $('#hu-wait').innerHTML = cr <= 0 ? 'Todavía no hay créditos. Haz bien una ronda y aquí verás cuánto vale.'
      : we ? `Si los guardas hasta el sábado que viene: <b>${pl(later, 'crédito', 'créditos')}</b> = <b>${pl(later, 'minuto', 'minutos')}</b>`
        : `Si esperas al sábado: <b>${pl(later, 'crédito', 'créditos')}</b> = <b>${pl(later, 'minuto', 'minutos')}</b>` + (later > hoy ? ` <span class="hu-more">(${later - hoy} más que hoy)</span>` : '');
    const strip = $('#hu-strip'); strip.innerHTML = '';
    for (let i = 0; i <= nights; i++) {
      const dd = new Date(now); dd.setDate(dd.getDate() + i);
      const col = document.createElement('div'); col.className = 'col' + (i === nights ? ' sat' : '');
      col.innerHTML = `<b>${H.grow(cr, i)}</b><small>${i === 0 ? 'hoy' : D[dd.getDay()].slice(0, 3)}</small>`; strip.appendChild(col);
    }
    // lo que puede gastar hoy
    const cap = mins(H.capSecs(now)), used = Math.ceil(H.usedToday() / 60), left = H.leftToday();
    const best = Math.max(H.playable('cred'), H.playable('vale'));
    $('#hu-left').innerHTML = left <= 0 ? `Hoy ya has gastado tus <b>${pl(cap, 'minuto', 'minutos')}</b>. Mañana, más. Tu hucha sigue creciendo.`
      : `Hoy puedes jugar o ver YouTube hasta <b>${pl(cap, 'minuto', 'minutos')}</b>` + (used > 0 ? `. Llevas ${used}.` : '.');
    $('#hu-play').disabled = best < 20; $('#hu-yt').disabled = best < 60;
    const v = $('#hu-vale'); v.hidden = !(d.vale > 0);
    if (d.vale > 0) v.innerHTML = `🎟️ Además tienes un <b>vale de ${pl(mins(d.vale), 'minuto', 'minutos')}</b> de antes. No crece, pero puedes gastarlo cuando quieras.`;
    // lo último que ha pasado
    const k = H.today(), earned = d.log.filter(e => (e.k === 'ronda' || e.k === 'examen') && MK.dayKey(new Date(e.t)) === k).reduce((a, e) => a + e.n, 0);
    const rows = [`<div class="row"><span>Hoy, estudiando</span><b>+${earned}</b></div>`];
    d.paid.slice(-3).reverse().forEach(p => rows.push(`<div class="row"><span>Regalo de la noche (día ${+p.d.slice(8)})</span><b>+${p.n}</b></div>`));
    $('#hu-hist').innerHTML = rows.join('');
  }

  // ---------- la clave de mayores (4 cifras; teclado propio para que no salga el de la tablet) ----------
  let pin = '', busy = false, after = null;
  function paintPin() { $$('#pin-dots i').forEach((e, i) => e.classList.toggle('on', i < pin.length)); }
  function askPin(then) { after = then; pin = ''; paintPin(); $('#pin-msg').textContent = 'Escribe la clave de 4 cifras'; $('#pin').hidden = false; }
  async function key(k) {
    if (busy) return; Audio.unlock();
    if (k === '⌫') { pin = pin.slice(0, -1); paintPin(); return; }
    if (pin.length >= 4) return;
    pin += k; paintPin(); if (pin.length < 4) return;
    busy = true; const r = await H.checkPin(pin); busy = false;
    if (r === true) { $('#pin').hidden = true; pin = ''; const f = after; after = null; if (f) f(); return; }
    Audio.sfx('wrong', .5); MK.vibrate([40, 30, 40]); pin = ''; paintPin();
    $('#pin-msg').textContent = r === 'espera' ? 'Demasiados intentos. Espera un minuto.' : r === 'sin' ? 'Desde este enlace no se puede comprobar la clave.' : 'Esa no es. Prueba otra vez.';
    const box = $('#pin .hu-box'); box.classList.remove('shake'); void box.offsetWidth; box.classList.add('shake');
  }
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].forEach(k => {
    if (!k) { $('#pin-keys').appendChild(document.createElement('span')); return; }
    const b = document.createElement('button'); b.type = 'button'; b.textContent = k; b.addEventListener('click', () => key(k)); $('#pin-keys').appendChild(b);
  });
  $('#pin-cancel').addEventListener('click', () => { $('#pin').hidden = true; pin = ''; after = null; });

  // ---------- el panel de mayores: encender o apagar y el tope de minutos ----------
  function paintPanel() {
    const on = H.on, d = H.data;
    $('#pn-state').textContent = on ? 'Encendida en este aparato.' : 'Apagada en este aparato: todo funciona como siempre (monedas, Arcade y premio de YouTube por un 10).';
    const b = $('#pn-toggle'); b.textContent = on ? 'Apagar la hucha' : 'Encender la hucha'; b.className = 'btn btn-xl ' + (on ? 'btn-ghost' : 'btn-ok');
    $('#pn-wk').textContent = d.cap.wk; $('#pn-we').textContent = d.cap.we;
    $('#pn-info').textContent = on
      ? `Hoy lleva ${Math.ceil(H.usedToday() / 60)} min gastados. Tiene ${pl(H.credits, 'crédito', 'créditos')}` + (d.vale > 0 ? ` y un vale de ${mins(d.vale)} min.` : '.') + ' Si la apagas, lo que quede del vale vuelve como minutos de YouTube y los créditos se guardan.'
      : 'Al encenderla, los minutos de YouTube y de juego que ya tenía pasan a ser un vale, y las monedas del banco vuelven a su montón.';
  }
  function openPanel() { paintPanel(); $('#panel').hidden = false; }
  $('#pn-toggle').addEventListener('click', () => { H.setOn(!H.on); Audio.sfx('ding', .6); paintPanel(); render(); });
  $$('[data-cap]').forEach(b => b.addEventListener('click', () => {
    const c = H.data.cap, wk = c.wk + (b.dataset.cap === 'wk' ? +b.dataset.d : 0), we = c.we + (b.dataset.cap === 'we' ? +b.dataset.d : 0);
    H.setCap(Math.max(0, wk), Math.max(0, we)); paintPanel(); render();
  }));
  $('#pn-close').addEventListener('click', () => { $('#panel').hidden = true; render(); });
  $('#btn-mayores').addEventListener('click', () => askPin(openPanel));

  $('#btn-home').addEventListener('click', () => Nav.home());
  $('#hu-back').addEventListener('click', () => Nav.home());
  $('#hu-play').addEventListener('click', () => Nav.arcade('hucha'));
  $('#hu-yt').addEventListener('click', () => Nav.go(MK.ROOT + 'youtube.html'));
  document.addEventListener('pointerdown', () => Audio.unlock(), { once: true });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') render(); });
  MK.tapSounds('.btn, .iconbtn');
  H.listen(render);
  render();
  if (/[?&]mayores=/.test(location.search)) askPin(openPanel);
  window.__hucha = { render, askPin, openPanel, key };
})();
