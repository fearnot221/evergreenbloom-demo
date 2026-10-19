// 松櫻祭 style demo: builds the trees/arches, then drives reveal, parallax, petals and grain.
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
// Desktop = mouse/trackpad with hover. Touch devices skip Lenis and parallax: every parallax layer is a
// full-stage GPU texture, and pinch-zooming re-rasterises them at zoom scale until mobile Safari runs out of memory.
const desktop = matchMedia('(hover: hover) and (pointer: fine)').matches;
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
// Large, soft unevenness of the spray. A raster image (not an SVG filter) so pinch-zoom only stretches it
// instead of re-rendering a giant filtered bitmap. Upscaling a 3×3 tiling and keeping the centre makes it seamless.
{
  const n = 8, scale = 32;   // 8 cells over a 720px tile ≈ 90px blotches, like the old fractal noise
  const small = document.createElement('canvas');
  small.width = small.height = n * 3;
  const sctx = small.getContext('2d');
  const cell = sctx.createImageData(n, n);
  for (let i = 0; i < cell.data.length; i += 4) {
    cell.data[i] = cell.data[i + 1] = cell.data[i + 2] = (84 + Math.random() * 88) | 0;   // low contrast, centred on mid-grey
    cell.data[i + 3] = 255;
  }
  for (let x = 0; x < 3; x++) for (let y = 0; y < 3; y++) sctx.putImageData(cell, x * n, y * n);
  const big = document.createElement('canvas');
  big.width = big.height = n * scale;
  const bctx = big.getContext('2d');
  bctx.imageSmoothingQuality = 'high';
  bctx.drawImage(small, n, n, n, n, 0, 0, n * scale, n * scale);
  root.setProperty('--mottle', `url(${big.toDataURL()})`);
}

// ── 2b. While pinch-zoomed (phones, tablets, trackpad pinch), hide the full-screen decorative layers:
//    at zoom they are re-rasterised at zoom scale, which is what runs mobile Safari out of memory. ──
if (window.visualViewport) {
  const onZoom = () => document.documentElement.classList.toggle('zoomed', visualViewport.scale > 1.05);
  visualViewport.addEventListener('resize', onZoom);
  onZoom();
}

// ── 3. Petals: a slow diagonal gust that ties the sections together ──
if (!reduce) {
  const layer = document.querySelector('.petals');
  const count = desktop ? 16 : 7;
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
let lenis = null;
// Desktop only (mouse/trackpad + hover); phones and tablets keep their native touch scrolling.
if (!reduce && window.Lenis && desktop) {
  // Same setup as sitcon.org/2026 (Lenis defaults: lerp .1, wheelMultiplier 1), which the client cited as the reference feel.
  lenis = new Lenis({ autoRaf: true, anchors: true });
}

// ── 6. Parallax (desktop only): every .depth element is its own compositor layer and gets a transform written here,
//    in the same frame Lenis moves the page (no CSS-variable cascade, no SVG repaint, no layout reads) ──
if (!reduce && desktop) {
  const flow = document.querySelector('.flow');
  const edges = flow.querySelectorAll('.edge');
  const layers = [...document.querySelectorAll('.depth')].map((el) => ({
    el,
    d: parseFloat(el.style.getPropertyValue('--d')),
    slide: el.closest('.slide'),
    pointer: !!el.closest('.hero'),
  }));
  let boxes = new Map(), flowBox = { top: 0, height: 1 };
  const measure = () => {
    const y = scrollY;
    boxes = new Map(slides.map((s) => {
      const r = s.getBoundingClientRect();
      return [s, { top: r.top + y, height: r.height }];
    }));
    const f = flow.getBoundingClientRect();
    flowBox = { top: f.top + y, height: f.height };
  };

  let tx = 0, ty = 0, mx = 0, my = 0, lastFlow = -1, queued = false;
  const frame = () => {
    queued = false;
    const vh = innerHeight;
    const y = lenis ? lenis.animatedScroll : scrollY;
    mx += (tx - mx) * 0.08;
    my += (ty - my) * 0.08;
    for (const l of layers) {
      const b = boxes.get(l.slide);
      const p = (b.top - y + b.height / 2 - vh / 2) / vh;
      if (p < -2 || p > 2) continue;
      const x = l.pointer ? -mx * l.d * 0.5 : 0;
      const dy = (p - (l.pointer ? my * 0.3 : 0)) * l.d;
      l.el.style.transform = `translate3d(${x.toFixed(2)}px, ${dy.toFixed(2)}px, 0)`;
    }
    const fl = Math.min(1, Math.max(0, ((vh - (flowBox.top - y)) / flowBox.height) * 1.15));
    if (Math.abs(fl - lastFlow) > 0.0005) {
      lastFlow = fl;
      edges.forEach((e) => (e.style.strokeDashoffset = (1 - fl).toFixed(4)));
    }
    if (Math.abs(tx - mx) > 0.001 || Math.abs(ty - my) > 0.001) queue();
  };
  const queue = () => {
    if (!queued) { queued = true; requestAnimationFrame(frame); }
  };

  measure();
  if (lenis) lenis.on('scroll', frame);
  else addEventListener('scroll', queue, { passive: true });
  addEventListener('resize', () => { measure(); queue(); });
  addEventListener('load', () => { measure(); queue(); });
  document.fonts.ready.then(() => { measure(); queue(); });
  addEventListener('pointermove', (e) => {
    tx = (e.clientX / innerWidth) * 2 - 1;
    ty = (e.clientY / innerHeight) * 2 - 1;
    queue();
  }, { passive: true });
  queue();
}
