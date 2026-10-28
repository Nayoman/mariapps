/* Banco de María (AH-D1): ahorro con interés del 1 % al día para que entienda cómo crece el dinero guardado.
   La lógica del interés vive en shared/kit.js (MK.Bank): aquí solo la pantalla, la calculadora y el objetivo. */
(function () {
  'use strict';
  const { $, $$, Wallet, Bank, Audio, UI, Nav } = MK;
  Audio.dirs = [{ dir: 'assets/audio/', test: /^b_/ }, MK.ROOT + 'shared/audio/'];
  const say = (n, t) => Audio.say(n, { text: t });
  const LINES = {
    b_intro: '¡Bienvenida al banco, María! Si guardas aquí tus monedas, cada día te regalo una de cada cien. Eso se llama interés.',
    b_interes: 'Cuantas más monedas guardes y más días las dejes, más crecen. Y cada día crecen un poquito más rápido, porque también te pago interés por el interés de ayer. ¡Las monedas trabajan para ti mientras duermes!',
    b_guardado: '¡Guardado! Mañana ya habrá crecido.',
    b_sacado: 'Has sacado monedas. Las que quedan siguen creciendo.',
    b_objetivo: '¡Buen objetivo! Guarda monedas y el banco te ayudará a llegar.',
  };
  const fmtDate = d => d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
  let days = 7;

  function render() {
    Wallet.render(); Bank.save();
    const next = Bank.interestOf(Bank.saved);
    $('#interest-today').textContent = Bank.saved > 0 ? `+${next} mañana por el interés` : 'guarda y crecerán solas';
    $$('[data-dep]').forEach(b => { const n = b.dataset.dep === 'all' ? Wallet.coins : +b.dataset.dep; b.disabled = n <= 0 || Wallet.coins < n; });
    $$('[data-wd]').forEach(b => { const n = b.dataset.wd === 'all' ? Bank.saved : +b.dataset.wd; b.disabled = n <= 0 || Bank.saved < n; });
    renderCalc(); renderGoal(); renderHistory();
  }
  function renderCalc() {
    const a = Math.max(0, +$('#calc-amount').value || 0), total = Bank.grow(a, days);
    $('#calc-total').textContent = total; $('#calc-gift').textContent = `+${total - a} de regalo`;
    const pts = [[0, 'hoy'], [7, '7 días'], [30, '30 días'], [90, '90 días'], [365, '1 año']];
    const max = Bank.grow(a, 365) || 1; const ch = $('#chart'); ch.innerHTML = '';
    pts.forEach(([d, lab]) => { const v = Bank.grow(a, d); const col = document.createElement('div'); col.className = 'bar-col'; col.innerHTML = `<b>${v}</b><i class="${d ? '' : 'base'}" style="height:${Math.max(4, v / max * 70)}%"></i><small>${lab}</small>`; ch.appendChild(col); });
  }
  function renderGoal() {
    const g = Bank.data.goal, bar = $('#goal-bar'), txt = $('#goal-txt');
    if (!g) { bar.style.width = '0%'; txt.textContent = 'Ponte un objetivo y te digo cuándo llegarás.'; return; }
    $('#goal-in').value = g; const pct = Math.min(100, Bank.saved / g * 100); bar.style.width = pct + '%';
    const d = Bank.daysTo(g);
    if (d === 0) txt.textContent = `¡Objetivo conseguido! Tienes ${Bank.saved} de ${g}.`;
    else if (d === Infinity) txt.textContent = `Tienes 0 en el banco. Guarda algo y el interés empezará a ayudarte a llegar a ${g}.`;
    else { const when = new Date(); when.setDate(when.getDate() + d); txt.textContent = `Llevas ${Bank.saved} de ${g} (${Math.round(pct)} %). Sin guardar nada más, el interés te lleva al objetivo en ${d} ${d === 1 ? 'día' : 'días'}: el ${fmtDate(when)}. Si guardas más, antes.`; }
  }
  function renderHistory() {
    const h = $('#history'), paid = Bank.data.paid.slice(-7).reverse();
    if (!paid.length) { h.innerHTML = '<div class="empty">Todavía nada. Guarda monedas hoy y mañana verás aquí el primer regalo.</div>'; return; }
    h.innerHTML = paid.map(p => `<div class="row"><span>${p.d}</span><b>+${p.n} de interés</b></div>`).join('') + `<div class="row"><span>Total regalado</span><b>+${Bank.data.totalInterest}</b></div>`;
  }

  $$('[data-dep]').forEach(b => b.addEventListener('click', () => {
    const n = b.dataset.dep === 'all' ? Wallet.coins : +b.dataset.dep;
    if (!Bank.deposit(n)) { UI.toast('No tienes tantas monedas en la hucha'); Audio.sfx('wrong', .5); return; }
    Audio.sfx('coin', .8); MK.vibrate(30); UI.plus('+' + n, innerWidth * .75, 170); say('b_guardado', LINES.b_guardado); render();
  }));
  $$('[data-wd]').forEach(b => b.addEventListener('click', () => {
    const n = b.dataset.wd === 'all' ? Bank.saved : +b.dataset.wd;
    if (!Bank.withdraw(n)) { UI.toast('No hay tantas monedas en el banco'); Audio.sfx('wrong', .5); return; }
    Audio.sfx('coin', .8); MK.vibrate(30); UI.plus('+' + n, innerWidth * .25, 170); say('b_sacado', LINES.b_sacado); render();
  }));
  $('#btn-explain').addEventListener('click', () => { Audio.unlock(); say('b_intro', LINES.b_intro).then(() => say('b_interes', LINES.b_interes)); });
  $('#calc-amount').value = Bank.saved > 0 ? Bank.saved : 1000;
  $('#calc-amount').addEventListener('input', renderCalc);
  $$('#days button').forEach(b => b.addEventListener('click', () => { $$('#days button').forEach(x => x.classList.remove('on')); b.classList.add('on'); days = +b.dataset.d; Audio.sfx('pop', .4); renderCalc(); }));
  $('#goal-set').addEventListener('click', () => { Bank.setGoal(+$('#goal-in').value || 0); Audio.sfx('ding', .6); if (Bank.data.goal) say('b_objetivo', LINES.b_objetivo); renderGoal(); });
  $('#btn-home').addEventListener('click', () => Nav.home());
  $('#btn-sound').addEventListener('click', () => { Audio.setOn(!Audio.on); $('#btn-sound use').setAttribute('href', Audio.on ? '#i-sound' : '#i-mute'); if (Audio.on) Audio.unlock(); });
  $('#btn-sound use').setAttribute('href', Audio.on ? '#i-sound' : '#i-mute');
  document.addEventListener('pointerdown', () => Audio.unlock(), { once: true });
  MK.tapSounds('.btn, .iconbtn');
  Wallet.on(render);
  render();
  if (Bank.lastPayout > 0) setTimeout(() => say('b_interes', LINES.b_interes), 2600);
  else if (!MK.readJSON('banco_visto_v1')) { MK.writeJSON('banco_visto_v1', { t: Date.now() }); setTimeout(() => say('b_intro', LINES.b_intro), 800); }
  window.__banco = { Bank, Wallet, render };
})();
