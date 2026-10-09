'use strict';
// ponytail: hand-merged from the former ES modules so the site works from file:// without a server.
// ---- logo-layout.mjs
const { introPose, logoPose } = (() => {
const clamp = value => Math.max(0, Math.min(1, value));
const ease = value => { const t = clamp(value); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => ({ x: a.x + (b.x-a.x)*t, y: a.y + (b.y-a.y)*t, size: a.size + (b.size-a.size)*t });

/** A single transform carries the actual liquid logo from loader to hero. */
function introPose(elapsed, hero, width, height) {
  const t = clamp(elapsed / 1500);
  const progress = t * t * t * (t * (t * 6 - 15) + 10);
  return mix({ x: width / 2, y: height / 2, size: Math.min(154, width * .30) }, hero, progress);
}

/** Scroll destinations measured from the heading and header, never page length. */
function logoPose(scroll, { hero, about, header, viewportHeight, heroHeight }, reduced = false) {
  const arrival = Math.max(heroHeight * .45, about.y - viewportHeight * .48);
  const departure = Math.max(arrival + viewportHeight * .16, about.y - viewportHeight * .30);
  const dockEnd = departure + Math.max(180, viewportHeight * .30);
  const aboutPose = { ...about, y: about.y - scroll };
  if (reduced) {
    if (scroll >= departure) return { ...header, dock: 1 };
    if (scroll >= arrival * .6) return { ...aboutPose, dock: 0 };
    return { ...hero, y: hero.y - scroll, dock: 0 };
  }
  const approach = ease((scroll - heroHeight * .12) / Math.max(1, arrival - heroHeight * .12));
  const dock = ease((scroll - departure) / (dockEnd - departure));
  return { ...mix(mix(hero, aboutPose, approach), header, dock), dock };
}

return { introPose, logoPose };
})();
// ---- orb-simulation.mjs
const { WaveField } = (() => {
// A damped two-dimensional wave equation. Fixed time steps keep the surface
// stable at different display refresh rates; no floating-point GPU extension is needed.
class WaveField {
  constructor(size = 128) {
    this.size = size;
    this.height = new Float32Array(size * size);
    this.velocity = new Float32Array(size * size);
    this.next = new Float32Array(size * size);
    this.pixels = new Uint8Array(size * size * 4);
  }

  disturb(u, v, strength = 0.08, radius = 0.045) {
    const n = this.size;
    const cx = u * (n - 1), cy = v * (n - 1), r = radius * n;
    for (let y = Math.max(1, Math.floor(cy - r)); y <= Math.min(n - 2, Math.ceil(cy + r)); y++) {
      for (let x = Math.max(1, Math.floor(cx - r)); x <= Math.min(n - 2, Math.ceil(cx + r)); x++) {
        const distance = Math.hypot(x - cx, y - cy) / r;
        if (distance < 1) {
          const index = y * n + x;
          this.height[index] = Math.max(-0.8, Math.min(0.8,
            this.height[index] + strength * (Math.cos(distance * Math.PI) + 1) * 0.5));
        }
      }
    }
  }

  stroke(fromU, fromV, toU, toV, strength, radius) {
    const distance = Math.hypot(toU - fromU, toV - fromV);
    const steps = Math.max(1, Math.min(64, Math.ceil(distance / (radius * 0.35))));
    const dose = strength / Math.sqrt(steps);
    for (let step = 1; step <= steps; step++) {
      const t = step / steps;
      this.disturb(fromU + (toU - fromU) * t, fromV + (toV - fromV) * t, dose, radius);
    }
  }

  step() {
    const n = this.size, h = this.height, v = this.velocity, next = this.next;
    for (let y = 1; y < n - 1; y++) {
      for (let x = 1; x < n - 1; x++) {
        const i = y * n + x;
        const laplacian = h[i - 1] + h[i + 1] + h[i - n] + h[i + n] - 4 * h[i];
        v[i] = (v[i] + laplacian * 0.23) * 0.983;
        next[i] = (h[i] + v[i]) * 0.997;
      }
    }
    this.height = next;
    this.next = h;
  }

  encode(alpha = 1) {
    // Store height in two bytes to avoid banding in the normal reconstruction.
    // Interpolate the previous and current fixed steps for smooth display at 60–144 Hz.
    const blend = Math.max(0, Math.min(1, alpha));
    for (let i = 0; i < this.height.length; i++) {
      const height = this.next[i] + (this.height[i] - this.next[i]) * blend;
      const value = Math.round((Math.max(-1, Math.min(1, height)) * 0.5 + 0.5) * 65535);
      this.pixels[i * 4] = value >> 8;
      this.pixels[i * 4 + 1] = value & 255;
      this.pixels[i * 4 + 2] = 0;
      this.pixels[i * 4 + 3] = 255;
    }
    return this.pixels;
  }
}

return { WaveField };
})();
// ---- hero-motion.mjs
{
// ponytail: textures inlined so canvas/WebGL are not tainted by cross-origin file:// images.
const TEXTURES = {
  shape: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjMzIiBoZWlnaHQ9IjEwODAiIHZpZXdCb3g9IjkzLjI5ODY1NCAzLjk1NTA5OCA1My4wMDQwNTUgNDYuNDQ0OTAzIj4KPCEtLSBTVkcgY3JlYXRlZCB3aXRoIEFycm93LCBieSBRdWl2ZXJBSSAoaHR0cHM6Ly9xdWl2ZXIuYWkpIC0tPgogIDxwYXRoIGQ9Im0xMzYuMyA1LjRjMC43IDAuOC0yLjYgNy4yLTMgOC42LTAuMyAwLjQtMS4zIDAuOC0xLjMtMC4zczAtMS44LTEuOC0yLjFjLTMuOS0wLjctNyAxLjMtNy45IDQuMy0wLjMgMSA4LjkgMi43IDkuMSA0LjUgMC4yIDEuOS0xLjUgOC44LTMuNCAxMC4zLTMuMiAyLjQtOSAzLjItMTQuNCAzLjctMS42IDAuMS0xLjcgMS41LTIuMiAyLjQtMiA0LTQuNyA4LjItMTAuMiA3LjktMi41LTAuMS04LTItNy45LTMuMSAwLTAuNyAyLjQtMSA2LTIuMyA0LjgtMS42IDEwLjMtMy44IDEwLjgtNC41bDIuNy01LjFjMS4xLTIuMSAxLjktMi4yIDUuNy0yLjYgMi43LTAuMiA4LjMtMC45IDguMy0xLjdzLTMuOC0xLjktNy43LTIuN2MtMS42LTAuMy0xLjEtMC43IDAuOS02IDAuNS0xLjIgMi41LTUuNiAzLTYuOSAyLTMuOSA0LjctNi4yIDktNS44IDEuNSAwLjEgMy43IDAuMyA0LjMgMS40em0tMC41IDEwLjZjMC42IDAgMi45IDMuNCAyLjcgNC4yLTAuMSAwLjMtMi44IDIuMy0zLjUgMi4zcy0zLjEtMi43LTMuMS0zLjZjMC0wLjggMy4xLTIuOSAzLjktMi45eiIvPgogIAogIDxwYXRoIGQ9Im0xNDYuMyA4LjN2NDEuNGMwIDAuNS0wLjEgMC43LTEuNCAwLjctMS45IDAtMS44LTAuMy0xLjktMS45LTAuMi0zLjIgMC4yLTM5LjUgMC4zLTQwLjEgMC40LTEgMy4xLTAuOSAzLTAuMXoiLz4KPC9zdmc+',
  light: 'data:image/webp;base64,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',
  dark: 'data:image/jpeg;base64,/9j/4QAYRXhpZgAASUkqAAgAAAAAAAAAAAAAAP/sABFEdWNreQABAAQAAAA8AAD/4QMfaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLwA8P3hwYWNrZXQgYmVnaW49Iu+7vyIgaWQ9Ilc1TTBNcENlaGlIenJlU3pOVGN6a2M5ZCI/PiA8eDp4bXBtZXRhIHhtbG5zOng9ImFkb2JlOm5zOm1ldGEvIiB4OnhtcHRrPSJBZG9iZSBYTVAgQ29yZSA5LjEtYzAwMSA3OS5hOGQ0NzUzNDksIDIwMjMvMDMvMjMtMTM6MDU6NDUgICAgICAgICI+IDxyZGY6UkRGIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+IDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSIiIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdFJlZj0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlUmVmIyIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOjA5RDRBNTg0NDhEQzExRUVBRUNGOUUwRjQ5OTlBRjBBIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjA5RDRBNTgzNDhEQzExRUVBRUNGOUUwRjQ5OTlBRjBBIiB4bXA6Q3JlYXRvclRvb2w9IkFkb2JlIFBob3Rvc2hvcCAyMDIzIE1hY2ludG9zaCI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJGQUMyMEMyQThEQzIwRTVBMzQ0N0ZDNjE1M0NDOTAwMSIgc3RSZWY6ZG9jdW1lbnRJRD0iRkFDMjBDMkE4REMyMEU1QTM0NDdGQzYxNTNDQzkwMDEiLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz7/7gAOQWRvYmUAZMAAAAAB/9sAhAAGBAQEBQQGBQUGCQYFBgkLCAYGCAsMCgoLCgoMEAwM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'
};

const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const stage = document.querySelector('.orb-stage');
const art = document.querySelector('.hero-art');
const sphere = document.querySelector('.sphere');
const canvas = document.querySelector('.orb-canvas');
const backdrop = document.querySelector('.hero-contours');
const hero = document.querySelector('.hero');
const header = document.querySelector('.logo-header');
const wordmark = header.querySelector('.header-wordmark');
const aboutAnchor = document.querySelector('.about-logo-anchor');
const headerAnchor = document.querySelector('.header-logo-anchor');
let anchors;
const lines = [...document.querySelectorAll('.hero-line')];
const wave = new WaveField(128);
let gl, program, texture, colorTextures, uniforms;
let frame = 0, previous = 0, accumulator = 0, elapsed = 0;
let lastDrop = 0, scroll = window.scrollY;
let introStart = Infinity, width = innerWidth, height = innerHeight;
let introStarted = false, introAnimations = [];
const loader = document.querySelector('.loading-screen');
const loaderStarted = performance.now();
let loaderRelease;
let heroHeight = 1, contextLost = false, themeMix = document.documentElement.dataset.theme === 'light' ? 1 : 0;
let layoutDirty = true, orbVisible = true, letters = [];
let shapePixels;
const shapeResolution = 512;
let baseOrb = { x: 0, y: 0, size: 1 }, orbBounds = { left: 0, top: 0, size: 1 };
const pointer = { x: .5, y: .5, smoothX: .5, smoothY: .5, trailX: .5, trailY: .5, force: 0, active: false, down: false };

const vertexSource = `
attribute vec2 position;
varying vec2 uv;
void main() { uv = position * .5 + .5; gl_Position = vec4(position, 0., 1.); }
`;
const fragmentSource = `
precision highp float;
varying vec2 uv;
uniform sampler2D surface;
uniform sampler2D palette;
uniform sampler2D darkPalette;
uniform float time;
uniform float themeMix;
uniform float texel;
uniform vec3 cursor;
float heightAt(vec2 point) {
  vec2 channels = texture2D(surface, clamp(point, 0., 1.)).rg;
  return (channels.r * 65280. + channels.g * 255.) / 65535. * 2. - 1.;
}
void main() {
  vec2 p = (uv - .5) * 2.;
  vec2 slope = vec2(heightAt(uv + vec2(texel, 0.)) - heightAt(uv - vec2(texel, 0.)),
                    heightAt(uv + vec2(0., texel)) - heightAt(uv - vec2(0., texel)));
  // A broad, continuous depression reacts every display frame. The wave field
  // adds the trailing ripples; it no longer carries the whole hover response.
  vec2 delta = uv - cursor.xy;
  float footprint = exp(-dot(delta, delta) / .0225) * cursor.z;
  vec2 bend = delta * footprint * 13.;
  float z = sqrt(max(.02, 1. - dot(p, p)));
  vec2 current = vec2(sin(p.y * 5. + time * .7), cos(p.x * 4. - time * .55)) * .038;
  vec3 normal = normalize(vec3(p * .20 - slope * 34. + bend + current, .85 + z * .15));
  float turn = .8 + sin(time * .34) * .9;
  mat2 rotation = mat2(cos(turn), -sin(turn), sin(turn), cos(turn));
  vec2 colorUv = rotation * (p * .45 + slope * 2. + bend * .19) + .5;
  // Light theme: navy / cobalt / azure from the palette's blue channel. Dark theme: the pastel orb texture as-is.
  float blueTone = texture2D(palette, colorUv).b;
  vec3 lightColor = mix(vec3(.018, .055, .16), vec3(.025, .20, .50), smoothstep(.05, .55, blueTone));
  lightColor = mix(lightColor, vec3(.055, .38, .68), smoothstep(.55, .95, blueTone));
  vec3 color = mix(texture2D(darkPalette, colorUv).rgb, lightColor, themeMix);
  vec3 light = normalize(vec3(cos(time * .55) * .9, sin(time * .55) * .65, 1.));
  float diffuse = max(0., dot(normal, light));
  vec3 shaded = mix(2. * color * diffuse, 1. - 2. * (1. - color) * (1. - diffuse), step(.5, color));
  float highlight = pow(max(0., dot(normal, normalize(light + vec3(0., 0., 1.)))), 38.);
  float grain = (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - .5) / 255.;
  // The supplied vector silhouette masks this liquid material in CSS.
  gl_FragColor = vec4(mix(color, shaded, mix(.74, .38, themeMix)) + highlight * mix(.1, .035, themeMix) + grain, 1.);
}
`;

function compile(type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const reason = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(reason);
  }
  return shader;
}

function makeTexture(unit, pixel = [243, 208, 168, 255]) {
  gl.activeTexture(gl.TEXTURE0 + unit);
  const result = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, result);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(pixel));
  return result;
}

async function loadPalette(url, target, unit) {
  const image = new Image();
  image.src = url;
  await image.decode();
  if (contextLost) return;
  gl.activeTexture(gl.TEXTURE0 + unit);
  gl.bindTexture(gl.TEXTURE_2D, target);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
}

async function loadHeroShape() {
  const image = new Image();
  image.src = TEXTURES.shape;
  await image.decode();
  const mask = document.createElement('canvas');
  mask.width = mask.height = shapeResolution;
  const context = mask.getContext('2d', { willReadFrequently: true });
  // Match the centered 94% CSS mask without distorting the SVG aspect ratio.
  const scale = shapeResolution * .94 / Math.max(image.naturalWidth, image.naturalHeight);
  const w = image.naturalWidth * scale, h = image.naturalHeight * scale;
  context.drawImage(image, (shapeResolution-w)/2, (shapeResolution-h)/2, w, h);
  shapePixels = context.getImageData(0, 0, shapeResolution, shapeResolution).data;
}

function insideShape(u, v) {
  if (!shapePixels || u < 0 || u >= 1 || v <= 0 || v > 1) return false;
  const x = Math.floor(u * shapeResolution), y = Math.floor((1-v) * shapeResolution);
  return shapePixels[(y * shapeResolution + x) * 4 + 3] > 32;
}

async function initRenderer() {
  gl = canvas.getContext('webgl', { alpha: true, antialias: false, premultipliedAlpha: false, powerPreference: 'low-power' });
  if (!gl) return;
  program = gl.createProgram();
  const vertex = compile(gl.VERTEX_SHADER, vertexSource);
  const fragment = compile(gl.FRAGMENT_SHADER, fragmentSource);
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
  gl.useProgram(program);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, 'position');
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  uniforms = Object.fromEntries(['time', 'themeMix', 'texel', 'cursor'].map(name => [name, gl.getUniformLocation(program, name)]));
  texture = makeTexture(0, [128, 0, 0, 255]);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, wave.size, wave.size, 0, gl.RGBA, gl.UNSIGNED_BYTE, wave.encode());
  colorTextures = [makeTexture(1), makeTexture(2)];
  gl.uniform1i(gl.getUniformLocation(program, 'surface'), 0);
  gl.uniform1i(gl.getUniformLocation(program, 'palette'), 1);
  gl.uniform1i(gl.getUniformLocation(program, 'darkPalette'), 2);
  gl.uniform1f(uniforms.texel, 1 / wave.size);
  await Promise.all([
    loadHeroShape(),
    loadPalette(TEXTURES.light, colorTextures[0], 1),
    loadPalette(TEXTURES.dark, colorTextures[1], 2)
  ]);
  sphere.classList.add('liquid-ready');
  resize();
  wake();
}

const clamp = (v, low = 0, high = 1) => Math.min(high, Math.max(low, v));
const smooth = v => v * v * (3 - 2 * v);
// Some phone browsers (Arc on Android) resize the whole viewport, svh and lvh included, when the URL
// bar shows or hides, so the hero grew and the page jumped. The hero is sized from this locked height instead.
// ponytail: touch screens re-lock only on a width change (rotation); a height-only split-screen resize keeps the old height.
const touchScreen = matchMedia('(pointer: coarse)');
let lockedWidth = 0, lockedHeight = 0;
function lockViewport() {
  if (lockedHeight && touchScreen.matches && innerWidth === lockedWidth) return;
  lockedWidth = innerWidth; lockedHeight = innerHeight;
  document.documentElement.style.setProperty('--lock-h', `${lockedHeight}px`);
}
function resize() {
  lockViewport();
  width = innerWidth; height = lockedHeight;
  heroHeight = hero.offsetHeight;
  const artRect = art.getBoundingClientRect();
  const size = sphere.offsetWidth;
  baseOrb = { x: artRect.left + sphere.offsetLeft + size / 2, y: artRect.top + sphere.offsetTop + size / 2, size };
  const aboutRect = aboutAnchor.getBoundingClientRect();
  const headerRect = headerAnchor.getBoundingClientRect();
  anchors = { hero: baseOrb, about: { x:aboutRect.left+aboutRect.width/2, y:aboutRect.top+window.scrollY+aboutRect.height/2, size:aboutRect.width },
    header: { x:headerRect.left+headerRect.width/2, y:headerRect.top+headerRect.height/2, size:headerRect.width }, viewportHeight:height, heroHeight };
  const resolution = Math.max(1, Math.min(840, Math.round(size * Math.min(devicePixelRatio, 1.25))));
  if (canvas.width !== resolution) canvas.width = canvas.height = resolution;
  if (gl && !contextLost) gl.viewport(0, 0, canvas.width, canvas.height);
  layoutDirty = true;
  wake();
}

function layout(now, dt) {
  scroll += (window.scrollY - scroll) * (1 - Math.exp(-dt * 10));
  if (reduced.matches) scroll = window.scrollY;
  const mobile = width <= 900;
  const entering = !reduced.matches && now - introStart < 1500;
  const pose = entering ? { ...introPose(now - introStart, baseOrb, width, height), dock: 0 } : logoPose(scroll, anchors, reduced.matches);
  const scale = pose.size / baseOrb.size;
  const x = pose.x - baseOrb.x, y = pose.y - baseOrb.y;
  wordmark.style.opacity = String(1 - smooth(clamp(pose.dock * 2)));
  header.classList.toggle('is-pinned', window.scrollY > 20);
  stage.classList.toggle('is-docked', pose.dock > .001);
  const displayedSize = pose.size;
  orbBounds = { left: pose.x - displayedSize / 2, top: pose.y - displayedSize / 2, size: displayedSize };
  sphere.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`;
  sphere.style.opacity = '1';
  const contourEntrance = reduced.matches ? 1 : smooth(clamp((now - introStart - 250) / 1000));
  backdrop.style.opacity = String((mobile ? .46 : .62) * contourEntrance * (1 - smooth(clamp(scroll / heroHeight))));
  stage.style.opacity = '1';
  const exit = reduced.matches ? 0 : clamp(scroll / heroHeight);
  lines.forEach((line, index) => {
    line.style.transform = `translate3d(${-exit * width * [0.25, 0.13, 0.07][index]}px,0,0)`;
    letters[index].forEach((letter, i) => {
      const stagger = ((i * 7 + index * 3) % 11) / 24;
      const amount = clamp((exit - stagger * .5) / .55);
      letter.style.transform = `translateY(${amount * 110}%)`;
      letter.style.opacity = String(1 - amount);
    });
  });
  layoutDirty = false;
  return scale > .015;
}

function render() {
  if (!gl || !uniforms || contextLost || !sphere.classList.contains('liquid-ready')) return;
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, wave.size, wave.size, gl.RGBA, gl.UNSIGNED_BYTE, wave.encode(reduced.matches ? 1 : accumulator * 60));
  gl.uniform1f(uniforms.time, reduced.matches ? 0 : elapsed);
  gl.uniform1f(uniforms.themeMix, themeMix);
  gl.uniform3f(uniforms.cursor, pointer.smoothX, pointer.smoothY, reduced.matches ? 0 : pointer.force);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
}

function tick(now) {
  frame = 0;
  const dt = Math.min((now - (previous || now)) / 1000, .05);
  previous = now;
  // Hover changes only the rendered surface. Leave the DOM/compositor alone
  // after the entrance has settled unless a scroll or resize needs a new layout.
  if (layoutDirty || now - introStart < 2500 || Math.abs(scroll - window.scrollY) > .1) orbVisible = layout(now, dt);
  const visible = orbVisible;
  const targetTheme = document.documentElement.dataset.theme === 'light' ? 1 : 0;
  themeMix += (targetTheme - themeMix) * (reduced.matches ? 1 : 1 - Math.exp(-dt * 8));
  if (visible && !reduced.matches) {
    elapsed += dt;
    const follow = 1 - Math.exp(-dt * 38);
    pointer.smoothX += (pointer.x - pointer.smoothX) * follow;
    pointer.smoothY += (pointer.y - pointer.smoothY) * follow;
    pointer.force += ((pointer.active ? (pointer.down ? 1.65 : 1.15) : 0) - pointer.force) * (1 - Math.exp(-dt * 20));
    if (elapsed - lastDrop > .22) {
      const angle = elapsed * 2.399;
      wave.disturb(.5 + Math.cos(angle) * .28, .5 + Math.sin(angle * 1.37) * .28, .015, .04);
      lastDrop = elapsed;
    }
    accumulator += dt;
    while (accumulator >= 1 / 60) {
      if (pointer.active) {
        const distance = Math.hypot(pointer.smoothX - pointer.trailX, pointer.smoothY - pointer.trailY);
        const strength = pointer.down ? -.13 : Math.min(.16, .016 + distance * 3.5);
        wave.stroke(pointer.trailX, pointer.trailY, pointer.smoothX, pointer.smoothY, strength, pointer.down ? .08 : .055);
      }
      pointer.trailX = pointer.smoothX; pointer.trailY = pointer.smoothY;
      wave.step(); accumulator -= 1 / 60;
    }
  }
  if (visible) render();
  if (!document.hidden && !contextLost && !reduced.matches &&
      ((introStarted && now - introStart < 2500) || visible || Math.abs(scroll - window.scrollY) > .1 || Math.abs(themeMix - targetTheme) > .001)) {
    frame = requestAnimationFrame(tick);
  }
}
function wake() {
  if (!frame && !document.hidden && !contextLost) { previous = 0; frame = requestAnimationFrame(tick); }
}

function updatePointer(event) {
  // ponytail: touch/pen never drive the ripple (mobile perf); mouse hover keeps it on desktop.
  if (reduced.matches || event.pointerType !== 'mouse') return;
  // Cached geometry avoids forcing a browser layout for every pointer event.
  const u = (event.clientX - orbBounds.left) / Math.max(1, orbBounds.size);
  const v = 1 - (event.clientY - orbBounds.top) / Math.max(1, orbBounds.size);
  const active = insideShape(u, v) && !event.target.closest('a, button, summary, dialog');
  if (active && !pointer.active) {
    pointer.smoothX = pointer.trailX = u;
    pointer.smoothY = pointer.trailY = v;
  }
  pointer.active = active;
  pointer.x = u; pointer.y = v;
  wake();
}
window.addEventListener('pointermove', updatePointer, { passive: true });
window.addEventListener('pointerdown', event => {
  updatePointer(event);
  pointer.down = pointer.active;
  if (pointer.active) wave.disturb(pointer.x, pointer.y, -.15, .06);
}, { passive: true });
window.addEventListener('pointerup', event => { pointer.down = false; if (event.pointerType !== 'mouse') pointer.active = false; }, { passive: true });
window.addEventListener('pointercancel', () => { pointer.active = pointer.down = false; });
document.addEventListener('pointerleave', () => { pointer.active = pointer.down = false; });
window.addEventListener('scroll', () => { if (window.scrollY > 40) finishIntro(); pointer.active = false; layoutDirty = true; wake(); }, { passive: true });
window.addEventListener('resize', resize, { passive: true });
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { cancelAnimationFrame(frame); frame = 0; pointer.active = pointer.down = false; }
  else wake();
});
new ResizeObserver(resize).observe(document.body);
new ResizeObserver(resize).observe(header);
document.fonts.ready.then(resize);
new MutationObserver(wake).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
reduced.addEventListener('change', () => {
  pointer.active = pointer.down = false;
  layoutDirty = true;
  if (reduced.matches) finishIntro();
  wake();
});
canvas.addEventListener('webglcontextlost', event => {
  event.preventDefault(); contextLost = true;
  cancelAnimationFrame(frame); frame = 0;
  sphere.classList.remove('liquid-ready');
});
canvas.addEventListener('webglcontextrestored', () => { contextLost = false; initRenderer().catch(fallback); });
function fallback(error) { sphere.classList.remove('liquid-ready'); console.warn('Liquid orb unavailable; using gradient fallback.', error); wake(); }

function prepareHeadline() {
  lines.forEach(line => {
    const text = line.textContent;
    line.setAttribute('aria-label', text);
    line.textContent = '';
    // Keep Arabic shaping intact; disconnected character spans break joining.
    const segments = document.documentElement.lang === 'ar' ? [text] : [...text];
    for (const character of segments) {
      const span = document.createElement('span');
      span.className = 'hero-letter';
      span.textContent = character === ' ' ? '\u00a0' : character;
      span.setAttribute('aria-hidden', 'true');
      line.append(span);
    }
  });
  letters = lines.map(line => [...line.querySelectorAll('.hero-letter')]);
}
prepareHeadline();
document.addEventListener('bahr:languagechange', () => {
  finishIntro();
  prepareHeadline();
  resize();
});
resize();
if (!document.documentElement.classList.contains('loading-active')) finishIntro();
// Start on material readiness, with a bounded wait for slow asset loading.
const introDeadline = setTimeout(beginIntro, 2400);
Promise.allSettled([initRenderer().catch(fallback), document.fonts.ready]).then(() => {
  clearTimeout(introDeadline);
  loaderRelease = setTimeout(beginIntro, Math.max(0, 750 - (performance.now() - loaderStarted)));
});
document.addEventListener('bahr:introabort', finishIntro);
document.addEventListener('keydown', event => {
  if (['Tab', 'Escape', 'PageDown', 'ArrowDown', ' '].includes(event.key) && document.documentElement.classList.contains('loading-active')) finishIntro();
});
window.addEventListener('pageshow', event => { if (event.persisted) finishIntro(); });

function finishIntro() {
  clearTimeout(loaderRelease);
  introStarted = true;
  introStart = performance.now() - 3000;
  document.documentElement.classList.remove('intro-pending', 'loading-active');
  loader.hidden = true;
  introAnimations.forEach(animation => animation.cancel());
  introAnimations = [];
  layoutDirty = true;
  wake();
}

function beginIntro() {
  if (introStarted) return;
  if (reduced.matches || window.scrollY > 40 || (location.hash && location.hash !== '#top')) { finishIntro(); return; }
  introStarted = true;
  introStart = performance.now();
  loader.classList.add('is-releasing');
  loaderRelease = setTimeout(() => {
    loader.hidden = true;
    document.documentElement.classList.remove('loading-active');
  }, 1600);
  introAnimations.push(...backdrop.playIntro());
  letters.forEach((row, index) => row.forEach((letter, i) => {
    introAnimations.push(letter.animate([
      { transform: 'translateY(110%)', opacity: 0 },
      { transform: 'translateY(0)', opacity: 1 },
    ], { duration: 1000, delay: 550 + index * 180 + i * 26,
      easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards' }));
  }));
  for (const [selector, delay, distance] of [
    ['.header .wordmark', 900, -18], ['.header-actions', 1040, -18],
    ['.hero-caption', 1450, 20], ['.scroll-link', 1620, 20],
  ]) {
    introAnimations.push(document.querySelector(selector).animate([
      { opacity: 0, transform: `translateY(${distance}px)` },
      { opacity: 1, transform: 'translateY(0)' },
    ], { duration: 700, delay, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards' }));
  }
  document.documentElement.classList.remove('intro-pending');
  layoutDirty = true;
  wake();
}

}
// ---- components/contact-motion.mjs
{
const section = document.querySelector('#contact');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');

// Separate viewport triggers keep the lower details from playing offscreen on phones.
if (section && !reduced.matches && 'IntersectionObserver' in window && Element.prototype.animate) {
  const groups = new Map();
  const animations = [];
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      groups.get(entry.target).forEach(animation => animation.play());
      observer.unobserve(entry.target);
    }
  }, { threshold: .12, rootMargin: '0px 0px -6% 0px' });

  function add(trigger, target, frames, duration, delay = 0) {
    const animation = target.animate(frames, {
      duration, delay, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'both',
    });
    animation.pause();
    animation.currentTime = 0;
    // Release finished effects so hover/focus styles remain in control.
    animation.onfinish = () => animation.cancel();
    if (!groups.has(trigger)) groups.set(trigger, []);
    groups.get(trigger).push(animation);
    animations.push(animation);
  }
  const rise = distance => [
    { opacity: 0, transform: `translateY(${distance}px)` },
    { opacity: 1, transform: 'translateY(0)' },
  ];
  const label = section.querySelector('.section-label');
  label.querySelectorAll('span').forEach((item, i) => add(label, item, rise(16), 650, i * 100));

  const heading = section.querySelector('.contact-heading');
  heading.querySelectorAll('.contact-word').forEach((word, i) => {
    add(heading, word, [
      { transform: 'translateY(115%)', opacity: 0 },
      { transform: 'translateY(0)', opacity: 1 },
    ], 1050, i * 170);
  });
  add(heading, section.querySelector('.contact-ring circle'), [
    { strokeDasharray: '1 1', strokeDashoffset: '1' },
    { strokeDasharray: '1 1', strokeDashoffset: '0' },
  ], 1100, 220);
  add(heading, section.querySelector('.contact-orb > span'), [
    { opacity: 0, transform: 'translate(-18px,18px) rotate(-20deg) scale(.75)' },
    { opacity: 1, transform: 'translate(0,0) rotate(0) scale(1)' },
  ], 850, 400);

  const bottom = section.querySelector('.contact-bottom');
  add(bottom, bottom.querySelector('p'), rise(24), 750);
  add(bottom, bottom.querySelector('.email'), rise(24), 800, 140);
  add(bottom, bottom.querySelector('.email-rule'), [
    { transform: 'scaleX(0)' }, { transform: 'scaleX(1)' },
  ], 850, 350);

  groups.forEach((_, trigger) => observer.observe(trigger));
  function finish() {
    observer.disconnect();
    animations.forEach(animation => animation.cancel());
  }
  section.addEventListener('focusin', finish, { once: true });
  reduced.addEventListener('change', event => { if (event.matches) finish(); });
}

}

