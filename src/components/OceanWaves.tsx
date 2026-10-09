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
float water(vec2 p,float t){
 float h=sin(p.x*.8+p.y*1.6-t*.65)*.36;
 h+=sin(p.x*1.7-p.y*1.1+t*.48)*.22;
 h+=sin(p.x*3.2+p.y*2.7-t*.95)*.12;
 h+=sin(p.x*5.3-p.y*4.1+t*.7)*.065;
 h+=sin(p.x*8.1+p.y*6.4-t*1.1)*.025;
 return h;
}
void main(){
 vec2 uv=vUv; float t=uTime;
 float horizon=.77+sin(t*.22)*.008;
 float depth=max(horizon-uv.y,.005);
 vec2 p=vec2((uv.x-.5)*uAspect,1.)/(depth+.13);
 p.y+=t*.25; p+=uPointer*.14;
 float h=water(p,t);
 vec2 e=vec2(.04,0.);
 vec3 normal=normalize(vec3((water(p+e,t)-h)*2.8,.28,(water(p+e.yx,t)-h)*2.8));
 vec3 light=normalize(vec3(.25,1.,.65));
 float spec=pow(max(dot(normal,light),0.),18.);
 float ripple=pow(max(0.,sin(h*14.+p.y*2.)),10.);
 float gleam=exp(-pow((uv.x-.6+sin(p.y*.8+t*.3)*.045)*2.8,2.));
 vec3 sea=mix(vec3(.015,.06,.105),vec3(.035,.24,.32),smoothstep(0.,.85,uv.y));
 sea+=vec3(.16,.48,.57)*spec*gleam*.72;
 sea+=vec3(.07,.23,.29)*ripple*(.3+.7*gleam)*smoothstep(.03,.25,depth);
 sea+=vec3(.07,.21,.26)*h*.16;
 float sky=smoothstep(horizon-.025,horizon+.02,uv.y);
 vec3 skyColor=mix(vec3(.07,.23,.32),vec3(.015,.08,.14),smoothstep(horizon,1.,uv.y));
 skyColor+=vec3(.1,.22,.24)*exp(-length((uv-vec2(.6,horizon+.015))*vec2(2.5,12.)));
 vec3 color=mix(sea,skyColor,sky);
 color+=vec3(.12,.3,.34)*exp(-abs(uv.y-horizon)*85.);
 // Darker behind the lettering, with brighter open water on the right.
 color*=mix(.58,1.,smoothstep(.05,.85,uv.x));
 color*=mix(.4,1.,smoothstep(0.,.4,uv.y));
 gl_FragColor=vec4(color,1.);
}`;

export default function OceanWaves() {
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
  return <div ref={host} className="ocean-waves" aria-hidden="true" />;
}

