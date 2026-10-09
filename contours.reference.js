'use strict';
// ponytail: hand-merged from the former ES modules so the site works from file:// without a server.
// ---- components/contour-geometry.mjs
const { sampleField, traceContours, bahrTerrain, contourPath } = (() => {
/** Sample once so every elevation uses the same terrain. Coordinates are normalized. */
function sampleField(field, columns = 180, rows = 100) {
  const values = new Float64Array((columns + 1) * (rows + 1));
  for (let y = 0; y <= rows; y++) for (let x = 0; x <= columns; x++) {
    values[y * (columns + 1) + x] = field(x / columns, y / rows);
  }
  return { values, columns, rows };
}

/** Marching squares followed by stitching: one path per continuous contour. */
function traceContours(field, level, columns = 180, rows = 100) {
  const grid = typeof field === 'function' ? sampleField(field, columns, rows) : field;
  ({ columns, rows } = grid);
  const nodes = new Map(), segments = [], unique = new Set();
  const cases = [[], [[3,0]], [[0,1]], [[3,1]], [[1,2]], null, [[0,2]], [[3,2]], [[2,3]], [[0,2]], null, [[1,2]], [[3,1]], [[0,1]], [[0,3]], []];
  const key = p => `${Math.round(p[0] * 1e8)},${Math.round(p[1] * 1e8)}`;
  for (let y = 0; y < rows; y++) for (let x = 0; x < columns; x++) {
    const i = y * (columns + 1) + x;
    const v = [grid.values[i], grid.values[i+1], grid.values[i+columns+2], grid.values[i+columns+1]];
    const mask = v.reduce((bits, value, n) => bits | (value >= level ? 1 << n : 0), 0);
    const centerHigh = v.reduce((a,b) => a+b, 0) / 4 >= level;
    const pairs = cases[mask] ?? (mask === 5
      ? (centerHigh ? [[0,1],[2,3]] : [[3,0],[1,2]])
      : (centerHigh ? [[0,3],[1,2]] : [[0,1],[2,3]]));
    if (!pairs.length) continue;
    const corners = [[x,y],[x+1,y],[x+1,y+1],[x,y+1]];
    const crossing = edge => {
      const a = edge, b = (edge + 1) % 4;
      const t = (level - v[a]) / (v[b] - v[a]);
      return [(corners[a][0] + t * (corners[b][0] - corners[a][0])) / columns,
        (corners[a][1] + t * (corners[b][1] - corners[a][1])) / rows];
    };
    for (const pair of pairs) {
      const points = pair.map(crossing), keys = points.map(key);
      if (keys[0] === keys[1]) continue;
      const signature = [...keys].sort().join('|');
      if (unique.has(signature)) continue;
      unique.add(signature);
      const id = segments.length;
      segments.push({ keys, used: false });
      keys.forEach((k,n) => {
        if (!nodes.has(k)) nodes.set(k, { point: points[n], edges: [] });
        nodes.get(k).edges.push(id);
      });
    }
  }
  const paths = [];
  function walk(start) {
    let current = start;
    const points = [nodes.get(start).point];
    let closed = false;
    while (true) {
      const id = nodes.get(current).edges.find(id => !segments[id].used);
      if (id === undefined) break;
      const segment = segments[id];
      segment.used = true;
      current = segment.keys[0] === current ? segment.keys[1] : segment.keys[0];
      if (current === start) { closed = true; break; }
      points.push(nodes.get(current).point);
    }
    if (points.length > 1) paths.push({ points, closed });
  }
  for (const [k,node] of nodes) if (node.edges.length === 1) walk(k);
  for (const segment of segments) if (!segment.used) walk(segment.keys[0]);
  return paths;
}

const ridge = [[-.1,.57],[0,.52],[.17,.49],[.34,.64],[.43,.54],[.52,.51],[.62,.36],[.72,.31],[.81,.13],[.94,.02],[1.1,-.12]];
function baseline(x) {
  let i = 1;
  while (i < ridge.length - 2 && x > ridge[i+1][0]) i++;
  const [a,b,c,d] = [ridge[i-1],ridge[i],ridge[i+1],ridge[Math.min(i+2,ridge.length-1)]];
  const t = (x-b[0])/(c[0]-b[0]);
  const m0 = (c[1]-a[1])/(c[0]-a[0])*(c[0]-b[0]);
  const m1 = (d[1]-b[1])/(d[0]-b[0])*(c[0]-b[0]);
  return (2*t**3-3*t*t+1)*b[1] + (t**3-2*t*t+t)*m0 + (-2*t**3+3*t*t)*c[1] + (t**3-t*t)*m1;
}

function bahrTerrain(x, y) {
  const hill = (cx,cy,sx,sy,height) => height * Math.exp(-(((x-cx)/sx)**2 + ((y-cy)/sy)**2));
  return y - baseline(x)
    + hill(.145,.65,.125,.058,.18)
    + hill(.9,.2,.072,.039,.16)
    + hill(.42,1.02,.18,.09,.25)
    + hill(.88,1.08,.20,.20,.24);
}

function contourPath({ points, closed }, width = 1600, height = 800) {
  const p = points.map(([x,y]) => [x*width,y*height]);
  const format = point => point.map(n => n.toFixed(2)).join(' ');
  const mid = (a,b) => [(a[0]+b[0])/2,(a[1]+b[1])/2];
  let d = `M${format(closed ? mid(p.at(-1),p[0]) : p[0])}`;
  for (let i = closed ? 0 : 1; i < p.length - (closed ? 0 : 1); i++) {
    d += `Q${format(p[i])} ${format(mid(p[i],p[(i+1)%p.length]))}`;
  }
  return d + (closed ? 'Z' : `L${format(p.at(-1))}`);
}

return { sampleField, traceContours, bahrTerrain, contourPath };
})();
// ---- components/bahr-contours.mjs
{

const NS = 'http://www.w3.org/2000/svg';
const terrain = sampleField(bahrTerrain);
const cache = new Map();
function geometry(count) {
  if (!cache.has(count)) {
    const lines = Array.from({ length: count }, (_,i) => ({
      d: traceContours(terrain, i * .88 / (count-1)).map(path => contourPath(path)).join(''),
      opacity: .34 + .26 * (.5 + .5 * Math.sin(i * .7)),
    }));
    cache.set(count, { lines, accent: traceContours(terrain, .34).filter(path => !path.closed).map(path => contourPath(path)).join('') });
  }
  return cache.get(count);
}

/** Reusable vector terrain with an optional, finite entrance animation. */
class BahrContours extends HTMLElement {
  static observedAttributes = ['lines', 'accent', 'stroke', 'background', 'brand', 'caption'];

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `<style>
      :host{display:block;position:relative;overflow:hidden;min-height:240px;background:var(--contour-background,#08151e);color:#eef0ed;container-type:inline-size}
      figure{position:absolute;inset:0;margin:0;background:var(--contour-background,#08151e)}
      svg{display:block;width:100%;height:100%}
      .lines{stroke:var(--contour-stroke,#b3b8b5)}
      .accent{stroke:var(--contour-accent,#24559b);opacity:.8}
      figcaption{position:absolute;bottom:24px;left:26px;right:26px;display:flex;justify-content:space-between;align-items:end;gap:24px;font:inherit;font-size:14px;line-height:1.3;text-transform:uppercase}
      .caption{text-align:end}
      :host([variant="backdrop"]) figcaption{display:none}
      :host([variant="backdrop"]) .accent{stroke-width:2.4}
      @container(max-width:500px){figcaption{left:15px;right:15px;bottom:17px;font-size:11px;gap:16px}.caption{max-width:130px}}
    </style><figure><svg viewBox="0 0 1600 800" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><g class="lines" fill="none" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"></g><path class="accent" fill="none" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"></path></svg><figcaption><span class="brand"></span><span class="caption"></span></figcaption></figure>`;
  }

  connectedCallback() { this.render(); }
  attributeChangedCallback() { if (this.isConnected) this.render(); }

  playIntro() {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return [];
    return [...this.shadowRoot.querySelectorAll('path')].map((path, index, paths) => {
      const accent = index === paths.length - 1;
      path.setAttribute('pathLength', '1');
      return path.animate([
        { strokeDasharray: '1 1', strokeDashoffset: index % 2 ? '-1' : '1' },
        { strokeDasharray: '1 1', strokeDashoffset: '0' },
      ], { duration: accent ? 1700 : 1550, delay: accent ? 250 : index * 14,
        easing: 'cubic-bezier(.22,.68,.2,1)', fill: 'backwards' });
    });
  }

  render() {
    const requested = Number(this.getAttribute('lines') ?? 38);
    const count = Math.max(16, Math.min(56, Number.isFinite(requested) ? Math.round(requested) : 38));
    if (this.lineCount !== count) {
      const { lines, accent } = geometry(count);
      this.shadowRoot.querySelector('.lines').replaceChildren(...lines.map(line => {
        const path = document.createElementNS(NS, 'path');
        path.setAttribute('d', line.d);
        path.setAttribute('opacity', line.opacity);
        return path;
      }));
      this.shadowRoot.querySelector('.accent').setAttribute('d', accent);
      this.lineCount = count;
    }
    for (const attr of ['accent','stroke','background']) {
      const value = this.getAttribute(attr);
      if (value && CSS.supports('color',value)) this.style.setProperty(`--contour-${attr}`,value);
      else this.style.removeProperty(`--contour-${attr}`);
    }
    this.shadowRoot.querySelector('.brand').textContent = this.getAttribute('brand') ?? 'Bahr / بحر';
    this.shadowRoot.querySelector('.caption').textContent = this.getAttribute('caption') ?? 'Depth is our craft.';
  }
}

if (!customElements.get('bahr-contours')) customElements.define('bahr-contours', BahrContours);

}
// ---- components/bahr-wallpaper.mjs
{

/** One continuous, page-length contour field. No tiles or animation loop. */
class BahrWallpaper extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `<style>
      :host{display:block;position:absolute;inset:0;overflow:hidden;pointer-events:none;user-select:none;contain:strict}
      svg{display:block;width:100%;height:100%;overflow:hidden}
      .contours{stroke:var(--wallpaper-stroke,#b3b8b5);opacity:var(--wallpaper-opacity,.3)}
      .current{stroke:var(--wallpaper-accent,#24559b);opacity:var(--wallpaper-current-opacity,.65)}
    </style><svg xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" aria-hidden="true"><g class="contours" fill="none" stroke-width="1"></g><g class="current" fill="none" stroke-width="2.5"></g></svg>`;
    this.observer = new ResizeObserver(() => this.schedule());
  }

  connectedCallback() {
    this.setAttribute('aria-hidden', 'true');
    this.observer.observe(this);
    this.schedule();
  }

  disconnectedCallback() {
    this.observer.disconnect();
    cancelAnimationFrame(this.frame);
    this.frame = 0;
  }

  schedule() {
    if (this.frame) return;
    this.frame = requestAnimationFrame(() => {
      this.frame = 0;
      this.render();
    });
  }

  render() {
    const { width, height } = this.getBoundingClientRect();
    if (!width || !height) return;
    // Work in CSS pixels: phone layouts get the same fine line weight and spacing.
    const signature = `${Math.round(width)}:${Math.round(height)}`;
    if (signature === this.signature) return;
    this.signature = signature;
    const svg = this.shadowRoot.querySelector('svg');
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    const span = Math.max(700, width);
    const margin = span * .7;
    const count = Math.min(200, Math.ceil((height + margin * 2) / 28));
    const step = (height + margin * 2) / count;
    const paths = [];
    const accents = [];
    for (let i = 0; i <= count; i++) {
      const row = -margin + i * step;
      const depth = row / (height + margin * 2);
      const points = Array.from({ length: 97 }, (_, j) => {
        const x = j / 96;
        // Broad ridges evolve along the entire page instead of repeating a panel.
        const ridge = .25 * Math.cos(x * 3.6 + depth * 2.2)
          + .052 * Math.sin(x * 12 - depth * 3.8)
          + .014 * Math.sin(x * 23 + depth * 2.5);
        const y = row + span * ridge;
        return [x, y / height];
      });
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', contourPath({ points, closed: false }, width, height));
      path.setAttribute('vector-effect', 'non-scaling-stroke');
      path.setAttribute('opacity', String(.55 + .35 * Math.sin(i * .17) ** 2));
      paths.push(path);
      // A small number of blue contours trace the current through the field.
      if (i === Math.round(count * .24) || i === Math.round(count * .54) || i === Math.round(count * .82)) {
        accents.push(path.cloneNode());
      }
    }
    svg.querySelector('.contours').replaceChildren(...paths);
    svg.querySelector('.current').replaceChildren(...accents);
  }
}

if (!customElements.get('bahr-wallpaper')) customElements.define('bahr-wallpaper', BahrWallpaper);

}
// ---- components/contact-landscape.mjs
{

// A separate coastal basin: its center lies beyond the right edge, so the
// contours wrap around the contact area instead of repeating the hero's ridge.
const basin = sampleField((x, y) =>
  Math.hypot((x - 1.17) * 1.08, (y - .30) * .66)
  + .038 * Math.sin(y * 6.5 - x * 2.2)
  + .065 * Math.exp(-(((x - .65) / .22) ** 2 + ((y - .86) / .25) ** 2))
);
const elevations = Array.from({ length: 30 }, (_, i) => .19 + i * .022);
const paths = elevations.map(level => traceContours(basin, level).map(path => contourPath(path)).join(''));
const accent = traceContours(basin, .56).map(path => contourPath(path)).join('');
const NS = 'http://www.w3.org/2000/svg';

class ContactLandscape extends HTMLElement {
  constructor() {
    super();
    const root = this.attachShadow({ mode: 'open' });
    root.innerHTML = `<style>
      :host{display:block;pointer-events:none}
      svg{display:block;width:100%;height:100%}
      path{fill:none;stroke:var(--contact-contour-stroke,#5e6a71);stroke-width:1.15;stroke-linecap:round;stroke-linejoin:round}
      .accent{stroke:var(--contact-contour-accent,#426f9c);stroke-width:2;opacity:.7}
    </style><svg viewBox="0 0 1600 800" preserveAspectRatio="xMaxYMid slice" aria-hidden="true"></svg>`;
    const svg = root.querySelector('svg');
    paths.forEach((d, i) => {
      const path = document.createElementNS(NS, 'path');
      path.setAttribute('d', d);
      path.setAttribute('opacity', String(.38 + .14 * Math.sin(i * .52) ** 2));
      svg.append(path);
    });
    const current = document.createElementNS(NS, 'path');
    current.setAttribute('class', 'accent');
    current.setAttribute('d', accent);
    svg.append(current);
  }
}
if (!customElements.get('contact-landscape')) customElements.define('contact-landscape', ContactLandscape);

}

