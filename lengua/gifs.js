/* Lengua (M8) — gifs de los personajes y animaciones propias.
   Los gifs NO se copian a la web: se enlazan desde Giphy (i.giphy.com). Revisados a mano el 21-oct-2026 (fotograma del medio):
   solo escenas alegres, sin peleas, sangre ni textos. Si Giphy no carga (sin internet), se ve el dibujo de siempre. */
(function () {
  'use strict';
  const IDS = {
    onepiece: ['tuCFp8rod0x3O', 's55XB0bzfwo9y', 'nZ8HKcnfNWCOI', 'T7Qx28nEdo9NK', 'nkKnUo0RldrtvXBSBD', 'wzWxTUiXRQDYc', '13Uqp5IGFpmDle', 'Qcrmc6dbGyLMQ', 'cIBSTh8r2bgsASssn2', 'Z4DJjoV2e2dWdYLQVT'],
    haikyuu: ['NfBQ73MtvPJS', 'pg87nWVeAQ6Ag', '3BVuVJv8fUGRi', 'dlVUiIRqpjEuA', '1Ev8ZAGWX1Juw', 'ufmlo7OC4AOMU', 'VIiahZxXYk6e4', 'cRfnmVzTnPTNe'],
    demonslayer: ['T2d4uMzn7dzOVHcUHA', 'WQaaoV5Tpq9Y0e7kIw', '1mfd6cAR8T4LJNeOAh', '2ya7xLyEeynlZM4FCw', 'n5ckuFVteRoUuvyHbQ', '5hxB4AqmEhcnIjv0q9'],
    mha: ['La1SsPdQ7nt8WFvfXA', '76WpfhN3mifUp9gC1N', 'QYjDYpN1kyeTAPZf2n', 'XbNqeB5vMkPMoSAd1X', 'o8LkAh092XX4QyPeLX', 'EHHi29hCF0hlm', 'E5qKDZQfRDmrswUw1o', 'naiatn5LxTOsU', 'YczhLetaQXUdABcXmP', 'x3QT8p2ZkGIbkO7CED', 'sdGA6YG7C4VTikAaUa'],
  };
  const src = id => 'https://i.giphy.com/media/' + id + '/200w.gif';
  const last = {};
  function url(series) {
    const list = IDS[series] || IDS[Object.keys(IDS)[Math.floor(Math.random() * 4)]];
    let id; do { id = list[Math.floor(Math.random() * list.length)]; } while (list.length > 1 && id === last[series]);
    last[series] = id; return src(id);
  }
  // pone un gif en una <img> (con el dibujo de antes si falla) o dentro de un hueco <div>
  function into(el, series, fallback) {
    if (!el) return;
    const img = el.tagName === 'IMG' ? el : (el.querySelector('img') || el.appendChild(document.createElement('img')));
    const fb = fallback || img.getAttribute('src');
    img.onerror = () => { img.onerror = null; if (fb) img.src = fb; else el.classList.add('hidden'); };
    img.classList.add('lg-gif'); img.src = url(series);
  }
  // gif que salta en la esquina con un letrero tipo anime, 2,4 s, sin parar el juego
  let popT = 0;
  function pop(series, text) {
    const box = document.getElementById('gif-pop'); if (!box) return;
    const img = box.querySelector('img'); img.onerror = () => box.classList.remove('show');
    img.src = url(series); box.querySelector('b').textContent = text || '';
    box.classList.remove('show'); void box.offsetWidth; box.classList.add('show');
    clearTimeout(popT); popT = setTimeout(() => box.classList.remove('show'), 2400);
  }
  // precarga uno de cada serie para que el primero salga al momento
  function preload() { Object.keys(IDS).forEach(s => { const i = new Image(); i.src = url(s); }); }
  window.LG_GIFS = { url, into, pop, preload };

  // ---------- animaciones propias ----------
  // la letra elegida vuela del botón al hueco de la palabra
  function fly(fromEl, toEl, text) {
    try {
      if (!fromEl || !toEl) return;
      const a = fromEl.getBoundingClientRect(), b = toEl.getBoundingClientRect();
      const dx = Math.round((b.left + b.width / 2) - (a.left + a.width / 2)), dy = Math.round((b.top + b.height / 2) - (a.top + a.height / 2));
      const f = document.createElement('div'); f.className = 'fly-letter'; f.textContent = text;
      f.style.left = (a.left + a.width / 2) + 'px'; f.style.top = (a.top + a.height / 2) + 'px';
      document.body.appendChild(f); setTimeout(() => f.remove(), 600);
      f.animate([{ transform: 'translate(-50%,-50%) scale(1)' }, { transform: `translate(${dx - 20}px,${dy - 25}px) scale(1.6) rotate(360deg)`, offset: .85 }, { transform: `translate(${dx - 20}px,${dy - 25}px) scale(.4)`, opacity: 0 }], { duration: 420, easing: 'cubic-bezier(.5,0,.3,1)' });
    } catch (e) { /* la animación nunca puede frenar la respuesta */ }
  }
  // tajo en diagonal sobre el jefe al acertar
  function slash(el) {
    if (!el) return;
    const s = document.createElement('div'); s.className = 'slash'; el.appendChild(s);
    setTimeout(() => s.remove(), 500);
  }
  window.LG_ANIM = { fly, slash };
})();
