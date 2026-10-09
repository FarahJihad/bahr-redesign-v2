import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';

export default function HeroMark({ interactive = false }: { interactive?: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = host.current!;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' }); } catch { return; }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    renderer.setClearColor(0x000000, 0); renderer.toneMapping = THREE.ACESFilmicToneMapping;
    element.appendChild(renderer.domElement);
    const scene = new THREE.Scene(); const camera = new THREE.PerspectiveCamera(34, 1, .1, 100); camera.position.z = 8;
    // A local studio/ocean reflection map supplies soft bands of reflected light.
    const envCanvas = document.createElement('canvas'); envCanvas.width = 512; envCanvas.height = 256;
    const context = envCanvas.getContext('2d')!;
    const gradient = context.createLinearGradient(0, 0, 0, 256);
    gradient.addColorStop(0, '#123246'); gradient.addColorStop(.3, '#b4e9fa'); gradient.addColorStop(.43, '#345c79'); gradient.addColorStop(.5, '#b4e5f4'); gradient.addColorStop(.6, '#133a53'); gradient.addColorStop(1, '#06121f');
    context.fillStyle = gradient; context.fillRect(0, 0, 512, 256);
    context.fillStyle = '#e6faff'; context.fillRect(70, 20, 34, 150); context.fillStyle = '#65adc6'; context.fillRect(320, 40, 65, 120);
    const source = new THREE.CanvasTexture(envCanvas); source.mapping = THREE.EquirectangularReflectionMapping; source.colorSpace = THREE.SRGBColorSpace;
    const pmrem = new THREE.PMREMGenerator(renderer); const environment = pmrem.fromEquirectangular(source); scene.environment = environment.texture;
    const key = new THREE.DirectionalLight('#d9f5ff', 1.7); key.position.set(-3, 5, 6); scene.add(key);
    const rim = new THREE.DirectionalLight('#48b6df', 1.4); rim.position.set(4, -1, 3); scene.add(rim); scene.add(new THREE.AmbientLight('#94c9e0', .25));
    const material = new THREE.MeshPhysicalMaterial({ color: interactive ? '#79c6ef' : '#f1f4f4', metalness: .24, roughness: .1, transmission: .25, thickness: .45, ior: 1.45, clearcoat: 1, clearcoatRoughness: .12, envMapIntensity: 1.5, attenuationColor: new THREE.Color('#b8e3ed'), attenuationDistance: 3 });
    const shimmer = { value: 0 };
    material.onBeforeCompile = (shader) => {
      shader.uniforms.uMarkTime = shimmer;
      shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vMarkPosition;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvMarkPosition = position;');
      shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\nuniform float uMarkTime;\nvarying vec3 vMarkPosition;').replace('#include <color_fragment>', `#include <color_fragment>
        float iceDepth = smoothstep(5., 50., vMarkPosition.y);
        float lightSweep = pow(.5 + .5 * sin(vMarkPosition.x * .14 + vMarkPosition.y * .19 - uMarkTime * .45), 18.);
        diffuseColor.rgb *= mix(vec3(.82,.91,.98), vec3(1.,1.,1.), iceDepth);
        diffuseColor.rgb += vec3(.08,.1,.12) * lightSweep;
      `);
    };
    const group = new THREE.Group(); scene.add(group); const geometries: THREE.ExtrudeGeometry[] = [];
    let disposed = false, visible = false, loaded = false, frame = 0, last = performance.now(), time = 0;
    const pointer = { x: 0, y: 0 };
    const currentPointer = { x: 0, y: 0 };
    const move = (event: PointerEvent) => { if (!interactive || event.pointerType === 'touch') return; const box = element.getBoundingClientRect(); pointer.x = ((event.clientX - box.left) / box.width - .5) * 2; pointer.y = ((event.clientY - box.top) / box.height - .5) * 2; };
    const leave = () => { pointer.x = 0; pointer.y = 0; };
    element.addEventListener('pointermove', move); element.addEventListener('pointerleave', leave);
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const tick = (now: number) => {
      frame = 0; if (!visible || document.hidden || reduced.matches || !loaded) return;
      time += Math.min((now - last) / 1000, .05); last = now; shimmer.value = time;
      group.position.y = Math.sin(time * .7) * .16;
      currentPointer.x += (pointer.x - currentPointer.x) * .07; currentPointer.y += (pointer.y - currentPointer.y) * .07;
      group.rotation.set(.14 + Math.sin(time * .35) * .045 + currentPointer.y * .24, -.42 + Math.sin(time * .3) * .11 + currentPointer.x * .5, -.035 - currentPointer.x * .045);
      renderer.render(scene, camera); frame = requestAnimationFrame(tick);
    };
    const resume = () => { cancelAnimationFrame(frame); frame = 0; last = performance.now(); if (visible && loaded && !document.hidden && !reduced.matches) frame = requestAnimationFrame(tick); else renderer.render(scene, camera); };
    const resize = () => { const box = element.getBoundingClientRect(); renderer.setSize(box.width, box.height); camera.aspect = box.width / Math.max(box.height, 1); camera.updateProjectionMatrix(); renderer.render(scene, camera); };
    const sizeObserver = new ResizeObserver(resize); sizeObserver.observe(element);
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; resume(); }); observer.observe(element);
    const abort = new AbortController();
    fetch('/bahr-mark.svg', { signal: abort.signal }).then(r => { if (!r.ok) throw new Error('Mark unavailable'); return r.text(); }).then(svg => {
      if (disposed) return;
      const data = new SVGLoader().parse(svg);
      for (const path of data.paths) for (const shape of SVGLoader.createShapes(path)) {
        const geometry = new THREE.ExtrudeGeometry(shape, { depth: 3.5, bevelEnabled: true, bevelThickness: .8, bevelSize: .4, bevelSegments: 4, curveSegments: 18, steps: 1 });
        geometries.push(geometry); group.add(new THREE.Mesh(geometry, material));
      }
      const box = new THREE.Box3().setFromObject(group); const center = box.getCenter(new THREE.Vector3());
      group.children.forEach(child => child.position.sub(center));
      group.scale.set(.072, -.072, .072); group.rotation.set(.14, -.42, -.035);
      loaded = true; element.classList.add('is-ready'); resize(); resume();
    }).catch(() => { /* Keep the original SVG visible if WebGL or loading fails. */ });
    document.addEventListener('visibilitychange', resume); reduced.addEventListener('change', resume); resize();
    return () => { element.removeEventListener('pointermove', move); element.removeEventListener('pointerleave', leave); disposed = true; abort.abort(); cancelAnimationFrame(frame); observer.disconnect(); sizeObserver.disconnect(); document.removeEventListener('visibilitychange', resume); reduced.removeEventListener('change', resume); geometries.forEach(g => g.dispose()); material.dispose(); environment.dispose(); source.dispose(); pmrem.dispose(); renderer.dispose(); renderer.domElement.remove(); element.classList.remove('is-ready'); };
  }, [interactive]);
  return <div ref={host} className="hero-mark-object" aria-hidden="true"><img src="/bahr-mark.svg" alt="" /></div>;
}




