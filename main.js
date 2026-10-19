// 松櫻祭 style demo: builds the trees/arches, then drives reveal, parallax, petals and grain.
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const STROKE = 'stroke="#ffffb9" stroke-width="4"';

// ── 1. Build SVG pieces (each part gets its own wrapper so intro + ambient motion don't fight) ──
const ARCHES = [ // [path, side, distance from centre] — drawn outer → inner so the lens sits on top
  ['M408,70 A352,350 0 0 0 408,770 Z', 'l', 2], ['M1192,70 A352,350 0 0 1 1192,770 Z', 'r', 2],
  ['M666,70 A256,350 0 0 0 666,770 Z', 'l', 1], ['M934,70 A256,350 0 0 1 934,770 Z', 'r', 1],
  ['M800,70 A115,350 0 0 0 800,770 Z', 'l', 0], ['M800,70 A115,350 0 0 1 800,770 Z', 'r', 0],
];
const arches = (dy) =>
  `<g transform="translate(0 ${dy})" fill="url(#g-blue)" ${STROKE}>${ARCHES.map(
    ([d, side, i]) => `<path class="unfold ${side}" style="--i:${i}" d="${d}"/>`,
  ).join('')}</g>`;

const cloud = (x, y, s, i) =>
  `<g class="pop" style="--i:${i}"><g class="bob" style="--b:${i}"><use href="#cloud" fill="url(#g-green)" transform="translate(${x} ${y}) scale(${s})"/></g></g>`;
const trunk = (x, y, w, h, rings) =>
  `<g class="grow"><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#g-trunk)"/>${rings
    .map((r) => `<path d="M${x},${r} H${x + w}" fill="none"/>`)
    .join('')}</g>`;
const bloom = (cx, cy, r, i) =>
  `<g class="pop" style="--i:${i}"><circle class="breathe" style="--b:${i}" cx="${cx}" cy="${cy}" r="${r}" fill="url(#g-pink)"/></g>`;

const TREES = {
  pine: () =>
    cloud(-30, 190, 1, 1) + cloud(40, 30, 1.2, 2) + cloud(190, 120, 1.2, 3) +
    trunk(210, 330, 130, 620, [555, 720]) + cloud(240, 420, 1.15, 4),
  sakura: () =>
    bloom(250, 220, 165, 1) + bloom(410, 330, 140, 2) + bloom(260, 450, 140, 3) + bloom(410, 520, 95, 4) +
    trunk(270, 470, 130, 480, [640]),
};

for (const g of document.querySelectorAll('[data-build]')) {
  const { build, x, y, s, dy } = g.dataset;
  g.innerHTML = build === 'arches'
    ? arches(dy)
    : `<g transform="translate(${x} ${y}) scale(${s})" ${STROKE}>${TREES[build]()}</g>`;
}

// ── 2. Frosted grain: per-pixel noise reads as matte paper; sparse specks read as sprayed powder ──
function noise(size, paint) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(size, size);
  for (let i = 0; i < img.data.length; i += 4) paint(img.data, i);
  ctx.putImageData(img, 0, 0);
  return `url(${c.toDataURL()})`;
}
const root = document.documentElement.style;
root.setProperty('--fine', noise(256, (d, i) => {
  const v = (Math.random() * 255) | 0;
  d[i] = d[i + 1] = d[i + 2] = v;
  d[i + 3] = 255;
}));
root.setProperty('--speck', noise(256, (d, i) => {
  const r = Math.random();
  d[i] = d[i + 1] = d[i + 2] = 255;
  d[i + 3] = r > 0.955 ? 90 + Math.random() * 165 : 0;
}));

// ── 3. Petals: a slow diagonal gust that ties the sections together ──
if (!reduce) {
  const layer = document.querySelector('.petals');
  const count = innerWidth < 720 ? 9 : 16;
  const rnd = (a, b) => a + Math.random() * (b - a);
  layer.innerHTML = Array.from({ length: count }, () => {
    const dur = rnd(14, 26);
    return `<i class="petal" style="--x:${rnd(-10, 95).toFixed(1)}vw;--drift:${rnd(12, 34).toFixed(1)}vw;--s:${rnd(11, 21).toFixed(1)}px;--dur:${dur.toFixed(1)}s;--delay:${(-rnd(0, dur)).toFixed(1)}s;--sway:${rnd(2.4, 4.2).toFixed(1)}s;--rot:${rnd(120, 300).toFixed(0)}deg"><b></b></i>`;
  }).join('');
}

// ── 4. Reveal + active section ──
const slides = [...document.querySelectorAll('.slide')];
const hero = document.getElementById('hero');

const reveal = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    e.target.classList.add('is-in');
    reveal.unobserve(e.target);
  }
}, { threshold: 0.28 });
slides.filter((s) => s !== hero).forEach((s) => reveal.observe(s));

const navLinks = document.querySelectorAll('[data-nav]');
const active = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    document.body.dataset.active = e.target.id;
    navLinks.forEach((a) => (a.dataset.nav === e.target.id ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current')));
  }
}, { rootMargin: '-45% 0px -45% 0px' });
slides.forEach((s) => active.observe(s));

// Hero opens immediately; the glowing characters come in last (~1.5s), by which time the font has usually loaded.
requestAnimationFrame(() => requestAnimationFrame(() => {
  hero.classList.add('is-in');
  document.body.classList.add('ready');
}));

// ── 5. Damped scrolling (Lenis): wheel input eases toward its target instead of jumping ──
if (!reduce && window.Lenis) {
  const lenis = new Lenis({ lerp: 0.075, wheelMultiplier: 0.9 });
  const tick = (t) => { lenis.raf(t); requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    const target = a && document.querySelector(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    lenis.scrollTo(target, { duration: 1.8, easing: (x) => 1 - Math.pow(1 - x, 4) });
  });
}

// ── 6. Parallax: scroll depth for every section, pointer depth on the hero, ribbon drawn by scroll ──
if (!reduce) {
  const flow = document.querySelector('.flow');
  let tx = 0, ty = 0, mx = 0, my = 0, queued = false;
  const frame = () => {
    queued = false;
    const vh = innerHeight;
    for (const s of slides) {
      const r = s.getBoundingClientRect();
      if (r.bottom < -vh || r.top > vh * 2) continue;
      s.style.setProperty('--p', ((r.top + r.height / 2 - vh / 2) / vh).toFixed(4));
    }
    const f = flow.getBoundingClientRect();
    flow.style.setProperty('--flow', Math.min(1, Math.max(0, ((vh - f.top) / f.height) * 1.15)).toFixed(4));
    mx += (tx - mx) * 0.08;
    my += (ty - my) * 0.08;
    hero.style.setProperty('--mx', mx.toFixed(4));
    hero.style.setProperty('--my', my.toFixed(4));
    if (Math.abs(tx - mx) > 0.001 || Math.abs(ty - my) > 0.001) queue();
  };
  const queue = () => {
    if (!queued) { queued = true; requestAnimationFrame(frame); }
  };
  addEventListener('scroll', queue, { passive: true });
  addEventListener('resize', queue);
  if (matchMedia('(pointer: fine)').matches) {
    addEventListener('pointermove', (e) => {
      tx = (e.clientX / innerWidth) * 2 - 1;
      ty = (e.clientY / innerHeight) * 2 - 1;
      queue();
    }, { passive: true });
  }
  queue();
}
