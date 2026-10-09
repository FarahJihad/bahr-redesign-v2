# Hero ocean update

The hero now includes a local Three.js animated water shader with moving swells, reflected light and subtle pointer response. Existing hero typography and scrolling descent are retained. Rendering pauses offscreen and in background tabs. Reduced-motion preference displays a still ocean. If WebGL is unavailable, the original CSS atmosphere remains visible.

Changed in this iteration: src/components/OceanWaves.tsx (new), src/App.tsx (hero integration), src/App.css (hero styling). Project gallery remains as in the preceding R3F edition.

Validation: npm run build and npm run lint passed. Edge/Chromium WebGL at 1440x1000 and 390x844 showed changing ocean frames with no page errors or horizontal overflow. Scrolling descent remained accessible. Reduced-motion ocean frames stayed identical. Viewports are emulated rather than physical device tests.

Run: npm ci, then npm run dev. Production: npm run build, then npm run preview. Node 22.12+ required; tested with Node 24.15. dist includes the production build.
