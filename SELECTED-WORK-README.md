# Bahr — Selected Work / R3F edition

This document describes the earlier Selected Work iteration. The latest hero changes are documented in HERO-README.md.

## Run
Requires Node.js 22.12+ (tested with Node 24.15).

npm ci
npm run dev

Production:
npm run build
npm run preview

The dist directory contains the verified production build. Serve it over HTTP; do not open index.html using file://.

## Experience
V7-inspired oversized typography and a metallic 3D opening sculpture, followed by Alageely, Riyadh Retina, then SYC League. Each project has an isolated station in the same Three.js world. Scroll moves the actual perspective camera along a curved flight; intentional hold ranges keep the camera still for reading. Outgoing content disappears before incoming content appears. Chapter buttons allow direct access without long scrolling.

The screen artwork is locally generated, stylized project imagery, not captured screenshots of the live websites. Project links retain the original destinations. No V7 design file was present, so the opening interprets the existing Selected Work typography rather than reproducing an unavailable reference exactly.

GPU pixel ratio is capped at 1.5. The scene mounts only near the work section. Reduced-motion mode uses direct station changes and freezes the sculpture. A text fallback is provided when WebGL is unavailable. Inactive/faded project links cannot receive keyboard focus.

## Validation
- npm run build: PASS (TypeScript and Vite production compilation).
- npm run lint: PASS.
- Edge/Chromium with WebGL: 1440x1000, 390x844, 320x640.
- Opening, all three holds, and flight midpoint: no page errors, no horizontal overflow, captions fit viewport, WebGL active.
- Chapter controls, keyboard activation, reduced motion and contact navigation: PASS.
- Screenshots reviewed and framing adjusted so project screens remain fully visible.
- Browser checks use emulated viewport sizes, not physical phone hardware.

Vite reports a bundle-size advisory because Three.js is included; this does not prevent the production build. The provided archive omits node_modules; npm ci restores dependencies using the included lockfile.

