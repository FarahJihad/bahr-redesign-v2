import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const fragmentShader = `
precision highp float;
varying vec2 vUv;
uniform float uTime;
uniform float uAspect;
uniform vec2 uPointer;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*noise(p);p=mat2(.8,.6,-.6,.8)*p*2.03;a*=.5;}return v;}
float surface(vec2 p,float t){vec2 q=vec2(fbm(p+t*.045),fbm(p+vec2(5.2,1.3)-t*.035));vec2 r=vec2(fbm(p+3.5*q+vec2(1.7,9.2)+t*.03),fbm(p+3.5*q+vec2(8.3,2.8)-t*.025));return fbm(p+4.*r);}
void main(){vec2 uv=vUv;vec2 p=(uv-.5)*vec2(uAspect,1.)*3.1+uPointer*.10;float h=surface(p,uTime);float e=.015;vec2 g=vec2(surface(p+vec2(e,0.),uTime)-h,surface(p+vec2(0.,e),uTime)-h)/e;vec3 n=normalize(vec3(-g*.65,1.));float shine=pow(max(dot(n,normalize(vec3(-.35,.45,1.))),0.),14.);float ridge=pow(.5+.5*sin(h*36.),8.);vec3 col=mix(vec3(.055,.16,.21),vec3(.10,.27,.34),h);col+=vec3(.13,.38,.48)*shine*.75+vec3(.07,.18,.23)*ridge*.28;float quiet=1.-.18*exp(-length((uv-.5)*vec2(2.,3.)));col*=quiet; vec3 base=vec3(.035,.105,.16); float edge=smoothstep(.12,.62,1.-uv.y); float center=smoothstep(.12,.65,length((uv-.5)*vec2(1.6,2.))); col=mix(base,col,edge*(.28+.30*center)); gl_FragColor=vec4(col,1.);}
`;

export default function InvitationWater() {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = host.current!;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: 'low-power' }); }
    catch { return; }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.25));
    element.appendChild(renderer.domElement);
    const scene = new THREE.Scene(); const camera = new THREE.Camera();
    const uniforms = { uTime: { value: 0 }, uAspect: { value: 1 }, uPointer: { value: new THREE.Vector2() } };
    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({ uniforms, fragmentShader, vertexShader: 'varying vec2 vUv; void main(){vUv=uv;gl_Position=vec4(position,1.);}' });
    scene.add(new THREE.Mesh(geometry, material));
    let visible = false, frame = 0, time = 0, last = performance.now();
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const resize = () => { const { width, height } = element.getBoundingClientRect(); renderer.setSize(width, height); uniforms.uAspect.value = width / Math.max(height, 1); renderer.render(scene, camera); };
    const sizeObserver = new ResizeObserver(resize); sizeObserver.observe(element);
    const tick = (now: number) => {
      frame = 0;
      if (!visible || document.hidden || motion.matches) return;
      time += Math.min((now - last) / 1000, .05); last = now;
      uniforms.uTime.value = time; renderer.render(scene, camera);
      frame = requestAnimationFrame(tick);
    };
    const resume = () => { cancelAnimationFrame(frame); frame = 0; last = performance.now(); if (visible && !document.hidden && !motion.matches) frame = requestAnimationFrame(tick); else renderer.render(scene, camera); };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; resume(); }); observer.observe(element);
    const pointer = (event: PointerEvent) => { uniforms.uPointer.value.set((event.clientX / innerWidth - .5),(.5 - event.clientY / innerHeight)); };
    addEventListener('pointermove', pointer, { passive: true }); document.addEventListener('visibilitychange', resume); motion.addEventListener('change', resume);
    resize();
    return () => { cancelAnimationFrame(frame); observer.disconnect(); sizeObserver.disconnect(); removeEventListener('pointermove', pointer); document.removeEventListener('visibilitychange', resume); motion.removeEventListener('change', resume); geometry.dispose(); material.dispose(); renderer.dispose(); renderer.domElement.remove(); };
  }, []);
  return <div ref={host} className="invitation-water" aria-hidden="true" />;
}

