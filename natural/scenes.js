/* Natural Science — the labelling pictures, drawn in SVG (exact positions, no generation; NS-D1).
   Each picture is 1200×900 (4:3). The label points in content.js are in % of this box. No words inside the pictures. */
window.NS_SCENES = (function () {
  const svg = (inner, bg) => `<svg viewBox="0 0 1200 900" xmlns="http://www.w3.org/2000/svg" role="img"><rect width="1200" height="900" rx="40" fill="${bg || '#eaf4ff'}"/>${inner}</svg>`;
  const E = (ch, x, y, s) => `<text x="${x}" y="${y}" font-size="${s || 90}" text-anchor="middle" dominant-baseline="central">${ch}</text>`;
  const mito = (x, y, r) => `<g transform="translate(${x} ${y}) rotate(${r || 0})"><ellipse rx="70" ry="34" fill="#ffb14d" stroke="#d97706" stroke-width="5"/><path d="M-50 0 q12 -22 24 0 t24 0 t24 0 t24 0" fill="none" stroke="#d97706" stroke-width="5"/></g>`;
  const golgi = (x, y) => `<g transform="translate(${x} ${y})" fill="none" stroke="#c084fc" stroke-width="9" stroke-linecap="round"><path d="M-70 -40 q70 -20 140 0"/><path d="M-78 -12 q78 -22 156 0"/><path d="M-70 16 q70 -20 140 0"/><path d="M-56 44 q56 -18 112 0"/></g>`;
  const dots = (pts, c) => pts.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r || 10}" fill="${c || '#60a5fa'}"/>`).join('');

  // ANIMAL CELL: soft blob with membrane (label point on the edge, top-left), nucleus in the middle, small vacuoles (top-right)
  const animal_cell = svg(`
    <path d="M300 250 C 360 120, 620 110, 760 150 C 950 200, 1010 340, 960 520 C 920 680, 760 800, 560 790 C 340 780, 190 650, 230 470 C 250 370, 260 300, 300 250 Z" fill="#fde7c8" stroke="#d2884b" stroke-width="22"/>
    <circle cx="600" cy="468" r="118" fill="#3b63c4" stroke="#1e3a8a" stroke-width="10"/><circle cx="600" cy="468" r="46" fill="#1e3a8a"/><circle cx="575" cy="440" r="14" fill="#93c5fd" opacity=".8"/>
    <circle cx="912" cy="270" r="30" fill="#7dd3fc" stroke="#0284c7" stroke-width="7"/><circle cx="860" cy="330" r="22" fill="#7dd3fc" stroke="#0284c7" stroke-width="6"/><circle cx="930" cy="360" r="18" fill="#7dd3fc" stroke="#0284c7" stroke-width="6"/>
    <circle cx="390" cy="620" r="26" fill="#7dd3fc" stroke="#0284c7" stroke-width="6"/>
    ${mito(420, 360, -25)}${mito(790, 620, 20)}${mito(640, 700, -10)}${golgi(400, 500)}
    ${dots([[520, 300, 9], [700, 300, 8], [820, 470, 9], [480, 690, 8], [740, 540, 7], [560, 620, 8]], '#a78bfa')}
  `);

  // PLANT CELL: thick green wall (label point on the wall, left), membrane inside (top-left), big central vacuole, nucleus (bottom-right), chloroplasts (top-right)
  const chloro = (x, y, r) => `<g transform="translate(${x} ${y}) rotate(${r || 0})"><ellipse rx="64" ry="38" fill="#4ade80" stroke="#15803d" stroke-width="6"/><ellipse cx="-24" cy="0" rx="12" ry="8" fill="#15803d"/><ellipse cx="0" cy="0" rx="12" ry="8" fill="#15803d"/><ellipse cx="24" cy="0" rx="12" ry="8" fill="#15803d"/></g>`;
  const plant_cell = svg(`
    <path d="M150 170 L600 120 L1050 170 L1090 450 L1050 730 L600 780 L150 730 L110 450 Z" fill="#86efac" stroke="#166534" stroke-width="46" stroke-linejoin="round"/>
    <path d="M215 220 L600 180 L985 220 L1020 450 L985 680 L600 720 L215 680 L180 450 Z" fill="#fef3c7" stroke="#d97706" stroke-width="12" stroke-linejoin="round"/>
    <path d="M330 330 C 420 260, 620 280, 700 400 C 760 500, 660 620, 520 640 C 380 660, 300 560, 320 460 Z" fill="#7dd3fc" stroke="#0284c7" stroke-width="10"/>
    <circle cx="880" cy="590" r="92" fill="#3b63c4" stroke="#1e3a8a" stroke-width="10"/><circle cx="880" cy="590" r="36" fill="#1e3a8a"/>
    ${chloro(910, 250, 20)}${chloro(790, 320, -15)}${chloro(300, 620, 10)}${chloro(760, 470, 35)}${chloro(420, 260, -30)}
    ${mito(880, 420, 25)}${mito(560, 700, -15)}${golgi(640, 230)}
    ${dots([[760, 640, 8], [340, 700, 8], [980, 330, 8], [460, 200, 7]], '#a78bfa')}
  `, '#f0fdf4');

  // ORGANISATION: two rows. Top = animal (cell → tissue → heart → body with vessels → dog). Bottom = plant (cell → tissue → leaf → plant with roots → potted plant).
  const arrow = (x, y, c) => `<path d="M${x - 46} ${y} h70 m-22 -26 l26 26 l-26 26" fill="none" stroke="${c}" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>`;
  const cellIcon = (x, y, c1, c2) => `<circle cx="${x}" cy="${y}" r="68" fill="${c1}" stroke="${c2}" stroke-width="8"/><circle cx="${x}" cy="${y}" r="24" fill="${c2}"/>`;
  const tissueIcon = (x, y, c1, c2) => { let s = ''; for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) s += `<rect x="${x + i * 46 - 22}" y="${y + j * 46 - 22}" width="44" height="44" rx="10" fill="${c1}" stroke="${c2}" stroke-width="5"/><circle cx="${x + i * 46}" cy="${y + j * 46}" r="7" fill="${c2}"/>`; return s; };
  const heartIcon = (x, y) => `<path d="M${x} ${y + 70} C ${x - 90} ${y}, ${x - 70} ${y - 80}, ${x} ${y - 30} C ${x + 70} ${y - 80}, ${x + 90} ${y}, ${x} ${y + 70} Z" fill="#ef4444" stroke="#991b1b" stroke-width="8"/><path d="M${x - 10} ${y - 40} q20 -30 40 -10" fill="none" stroke="#fecaca" stroke-width="8" stroke-linecap="round"/>`;
  const bodyIcon = (x, y) => `<circle cx="${x}" cy="${y - 80}" r="28" fill="#fcd5b5" stroke="#9a5b2b" stroke-width="5"/><path d="M${x - 44} ${y - 40} h88 v110 h-26 v60 h-36 v-60 h-26 Z" fill="#fde9d6" stroke="#9a5b2b" stroke-width="5" stroke-linejoin="round"/><path d="M${x} ${y - 40} v110 M${x - 30} ${y - 10} q30 20 60 0 M${x - 30} ${y + 30} q30 20 60 0" fill="none" stroke="#ef4444" stroke-width="6" stroke-linecap="round"/><path d="M${x} ${y + 12} m-14 0 a14 14 0 1 0 28 0 a14 14 0 1 0 -28 0" fill="#ef4444"/>`;
  const leafIcon = (x, y) => `<path d="M${x - 80} ${y + 60} C ${x - 60} ${y - 60}, ${x + 40} ${y - 90}, ${x + 84} ${y - 70} C ${x + 70} ${y + 20}, ${x + 10} ${y + 80}, ${x - 80} ${y + 60} Z" fill="#4ade80" stroke="#166534" stroke-width="8"/><path d="M${x - 70} ${y + 52} C ${x - 20} ${y + 10}, ${x + 30} ${y - 30}, ${x + 76} ${y - 62}" fill="none" stroke="#166534" stroke-width="6"/>`;
  const plantSysIcon = (x, y) => `<path d="M${x} ${y + 90} V${y - 60}" stroke="#166534" stroke-width="10" stroke-linecap="round"/><path d="M${x} ${y - 20} q-60 -40 -70 -90 q60 10 70 90 Z M${x} ${y + 20} q60 -40 70 -90 q-60 10 -70 90 Z" fill="#4ade80" stroke="#166534" stroke-width="6"/><path d="M${x} ${y + 90} q-40 20 -70 60 M${x} ${y + 90} q40 20 70 60 M${x} ${y + 90} v70" fill="none" stroke="#a16207" stroke-width="7" stroke-linecap="round"/>`;
  const pottedIcon = (x, y) => `<path d="M${x - 70} ${y + 20} h140 l-18 90 h-104 Z" fill="#f97316" stroke="#9a3412" stroke-width="7" stroke-linejoin="round"/><path d="M${x} ${y + 20} V${y - 70}" stroke="#166534" stroke-width="9" stroke-linecap="round"/><path d="M${x} ${y - 30} q-55 -30 -65 -80 q55 10 65 80 Z M${x} ${y - 10} q55 -40 70 -90 q-55 10 -70 90 Z M${x} ${y - 70} q-30 -50 0 -90 q30 40 0 90 Z" fill="#4ade80" stroke="#166534" stroke-width="6"/>`;
  const organisation = svg(`
    <rect x="40" y="90" width="1120" height="330" rx="36" fill="#fff7ed" stroke="#fdba74" stroke-width="6"/>
    <rect x="40" y="480" width="1120" height="330" rx="36" fill="#f0fdf4" stroke="#86efac" stroke-width="6"/>
    ${cellIcon(120, 270, '#fde7c8', '#d2884b')}${arrow(240, 270, '#f97316')}${tissueIcon(360, 270, '#fde7c8', '#d2884b')}${arrow(480, 270, '#f97316')}${heartIcon(600, 270)}${arrow(720, 270, '#f97316')}${bodyIcon(840, 270)}${arrow(960, 270, '#f97316')}${E('🐶', 1080, 270, 120)}
    ${cellIcon(120, 660, '#bbf7d0', '#166534')}${arrow(240, 660, '#16a34a')}${tissueIcon(360, 660, '#bbf7d0', '#166534')}${arrow(480, 660, '#16a34a')}${leafIcon(600, 660)}${arrow(720, 660, '#16a34a')}${plantSysIcon(840, 640)}${arrow(960, 660, '#16a34a')}${pottedIcon(1080, 640)}
  `, '#eaf4ff');

  // LIVING TREE: two big boxes at the top (living / non-living), four columns below with examples (no words)
  const living_tree = svg(`
    <rect x="60" y="60" width="500" height="150" rx="32" fill="#dcfce7" stroke="#16a34a" stroke-width="8"/>
    <rect x="640" y="60" width="500" height="150" rx="32" fill="#fce7f3" stroke="#db2777" stroke-width="8"/>
    ${E('🌿', 170, 135, 80)}${E('🦋', 310, 135, 80)}${E('🐾', 450, 135, 80)}
    ${E('☀️', 750, 135, 80)}${E('🚲', 890, 135, 80)}${E('🎈', 1030, 135, 80)}
    <path d="M310 210 v60 M310 270 h-150 v60 M310 270 h150 v60 M890 210 v60 M890 270 h-150 v60 M890 270 h150 v60" fill="none" stroke="#64748b" stroke-width="8" stroke-linecap="round"/>
    <rect x="40" y="330" width="250" height="520" rx="30" fill="#fff" stroke="#16a34a" stroke-width="6"/>
    <rect x="320" y="330" width="250" height="520" rx="30" fill="#fff" stroke="#16a34a" stroke-width="6"/>
    <rect x="610" y="330" width="250" height="520" rx="30" fill="#fff" stroke="#db2777" stroke-width="6"/>
    <rect x="900" y="330" width="250" height="520" rx="30" fill="#fff" stroke="#db2777" stroke-width="6"/>
    ${E('🦩', 165, 530, 110)}${E('🦊', 165, 660, 110)}${E('🦭', 165, 790, 100)}
    ${E('🌳', 445, 530, 110)}${E('🌸', 445, 660, 110)}${E('🌵', 445, 790, 100)}
    ${E('🌊', 735, 530, 110)}${E('☀️', 735, 660, 110)}${E('🌋', 735, 790, 100)}
    ${E('🚲', 1025, 530, 110)}${E('🎈', 1025, 660, 110)}${E('👟', 1025, 790, 100)}
  `);

  // KINGDOMS: five panels (plants, animals, fungi / monera, protists), drawn bacteria and amoeba
  const bact = (x, y, r, c) => `<g transform="translate(${x} ${y}) rotate(${r || 0})"><rect x="-60" y="-26" width="120" height="52" rx="26" fill="${c || '#60a5fa'}" stroke="#1d4ed8" stroke-width="6"/><circle cx="-20" cy="0" r="6" fill="#1d4ed8"/><circle cx="12" cy="-6" r="6" fill="#1d4ed8"/><path d="M60 0 q30 -20 50 10" fill="none" stroke="#1d4ed8" stroke-width="5"/></g>`;
  const amoeba = (x, y) => `<g transform="translate(${x} ${y})"><path d="M-110 -20 C -80 -100, 20 -120, 70 -70 C 130 -30, 110 50, 60 80 C 20 110, -40 90, -70 60 C -120 30, -130 10, -110 -20 Z" fill="#7dd3fc" stroke="#0369a1" stroke-width="7"/><circle cx="0" cy="0" r="28" fill="#0369a1"/><circle cx="50" cy="30" r="9" fill="#0369a1" opacity=".5"/><circle cx="-50" cy="-30" r="8" fill="#0369a1" opacity=".5"/></g>`;
  const alga = (x, y, r) => `<g transform="translate(${x} ${y}) rotate(${r || 0})"><ellipse rx="70" ry="32" fill="#86efac" stroke="#15803d" stroke-width="6"/><ellipse cx="-30" cy="0" rx="12" ry="9" fill="#15803d"/><ellipse cx="0" cy="0" rx="12" ry="9" fill="#15803d"/><ellipse cx="30" cy="0" rx="12" ry="9" fill="#15803d"/><path d="M70 0 q40 -30 70 0" fill="none" stroke="#15803d" stroke-width="5"/></g>`;
  const kingdoms = svg(`
    <rect x="40" y="40" width="340" height="380" rx="34" fill="#dcfce7" stroke="#16a34a" stroke-width="7"/>
    <rect x="430" y="40" width="340" height="380" rx="34" fill="#fef9c3" stroke="#ca8a04" stroke-width="7"/>
    <rect x="820" y="40" width="340" height="380" rx="34" fill="#ffedd5" stroke="#ea580c" stroke-width="7"/>
    <rect x="130" y="480" width="440" height="380" rx="34" fill="#dbeafe" stroke="#2563eb" stroke-width="7"/>
    <rect x="630" y="480" width="440" height="380" rx="34" fill="#e0f2fe" stroke="#0284c7" stroke-width="7"/>
    ${E('🌻', 150, 300, 130)}${E('🌳', 290, 300, 130)}
    ${E('🐰', 540, 300, 130)}${E('🐦', 680, 300, 120)}
    ${E('🍄', 920, 290, 130)}${E('🍄', 1050, 320, 90)}
    ${bact(260, 650, -20)}${bact(420, 700, 30, '#93c5fd')}${bact(330, 790, 5, '#a5b4fc')}
    ${amoeba(760, 700)}${alga(960, 650, -15)}${alga(980, 790, 10)}
  `);

  // VITAL FUNCTIONS: three panels (eating, babies, relating to the environment)
  const vital = svg(`
    <rect x="40" y="60" width="340" height="780" rx="34" fill="#dcfce7" stroke="#16a34a" stroke-width="7"/>
    <rect x="430" y="60" width="340" height="780" rx="34" fill="#fce7f3" stroke="#db2777" stroke-width="7"/>
    <rect x="820" y="60" width="340" height="780" rx="34" fill="#dbeafe" stroke="#2563eb" stroke-width="7"/>
    ${E('🐶', 210, 400, 150)}${E('🍖', 210, 620, 120)}
    ${E('🐱', 600, 380, 150)}${E('🐱', 540, 620, 90)}${E('🐱', 660, 620, 90)}
    ${E('🐕', 990, 420, 150)}${E('🦋', 1060, 230, 90)}${E('🌳', 920, 650, 110)}
  `);

  return { animal_cell, plant_cell, organisation, living_tree, kingdoms, vital };
})();
