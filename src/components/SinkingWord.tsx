import { useEffect, useRef } from 'react';
import * as THREE from 'three';
const fragment = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uText;
uniform float uProgress;
uniform float uTime;
void main(){
 vec2 uv=vUv;
 float impact=sin(clamp(uProgress*1.6,0.,1.)*3.14159);
 float wave=.61+sin(uv.x*8.-uTime*.4)*.003+sin(uv.x*17.-uProgress*8.)*.006*impact;
 float depth=max(wave-uv.y,0.);
 float underwater=1.-smoothstep(wave-.01,wave+.01,uv.y);
 vec2 sampleUv=uv;
 sampleUv.y+=uProgress*.72;
 float lens=exp(-abs(uv.y-wave)*55.);
 sampleUv.x+=(uv.x-.5)*.028*underwater;
 sampleUv.y+=.012*underwater+sin(uv.x*11.-uProgress*5.)*.007*lens;
 
 vec4 text=texture2D(uText,sampleUv);
 float softness=underwater*clamp(depth*2.5,0.,.55);
 vec4 blur=(texture2D(uText,sampleUv+vec2(.006,.003))+texture2D(uText,sampleUv-vec2(.006,.003)))*.5;
 text=mix(text,blur,softness);
 vec3 tint=mix(vec3(.52,.84,.96),vec3(.12,.38,.5),clamp(depth*3.,0.,1.));
 float caustic=pow(.5+.5*sin(uv.x*9.+uv.y*5.-uTime*.4),14.);
 tint+=caustic*.055*underwater;
 float alpha=text.a*exp(-depth*4.5);
 alpha*=1.-smoothstep(.9,1.,uProgress);
 float contact=exp(-abs(uv.y-wave)*160.)*text.a*uProgress*(1.-uProgress)*.35;
 float sprayAlpha=0.; vec3 sprayColor=vec3(0.);
 float splashTime=clamp((uProgress-.04)*2.,0.,1.3);
 float splashGate=smoothstep(.015,.08,uProgress)*(1.-smoothstep(.65,.88,uProgress));
 for(int i=0;i<32;i++){
  float seed=float(i);
  float rnd=fract(sin(seed*127.1+13.)*43758.54);
  float rnd2=fract(sin(seed*73.7+5.)*12345.67);
  float birth=rnd*.13;
  float age=max(0.,splashTime-birth);
  float x=.08+rnd2*.84+(rnd-.5)*age*.24;
  float y=.61+(.32+rnd*.45)*age-.7*age*age;
  vec2 q=(uv-vec2(x,y))/vec2(.004+rnd*.0045,.006+rnd*.006);
  float body=(1.-smoothstep(.55,1.,length(q)))*splashGate*step(birth,splashTime)*smoothstep(.57,.61,y);
  float rim=pow(clamp(length(q),0.,1.),3.);
  float glint=exp(-length(q-vec2(-.25,.35))*5.);
  vec3 drop=mix(vec3(.13,.42,.55),vec3(.77,.94,1.),rim*.55+glint);
  sprayColor+=drop*body; sprayAlpha=max(sprayAlpha,body*.8);
 }
 // Water droplets are lit volumes; no outlined splash artwork.
  float bubbles=0.;
 for(int j=0;j<10;j++){
  float k=float(j);float r=fract(sin(k*43.5+6.)*13758.);
  float age=clamp((uProgress-.25-r*.12)*1.7,0.,1.);
  vec2 center=vec2(.14+r*.7+sin(age*4.+k)*.008,.26+age*.32);
  float radius=.0035+r*.002;
  float d=length((uv-center)*vec2(1.,1.3))/radius;
  float ring=(1.-smoothstep(.08,.35,abs(d-.75)))*.25;
  bubbles+=ring*smoothstep(.02,.12,age)*(1.-smoothstep(.6,.9,age));
 }
  float surfaceGate=smoothstep(.04,.16,uProgress)*(1.-smoothstep(.7,.95,uProgress));
 float surfaceLight=exp(-abs(uv.y-wave)*140.)*exp(-pow((uv.x-.5)*2.3,4.))*surfaceGate*.24;
 float spread=.15+uProgress*.47;
 float ringDistance=length((uv-vec2(.5,wave))*vec2(1.,5.));
 float wake=exp(-abs(ringDistance-spread)*170.)*surfaceGate*.12;
 float finalAlpha=max(alpha,max(sprayAlpha,max(bubbles,surfaceLight+wake)));
 vec3 outColor=mix(tint+contact,sprayColor/max(sprayAlpha,.001),sprayAlpha);
 outColor=mix(outColor,vec3(.55,.85,.94),clamp(bubbles,0.,1.));
 outColor=mix(outColor,vec3(.65,.91,1.),clamp((surfaceLight+wake)*3.,0.,.7));
 gl_FragColor=vec4(outColor,finalAlpha);
}`;
export default function SinkingWord(){
 const host=useRef<HTMLSpanElement>(null);
 useEffect(()=>{
  const el=host.current!; let disposed=false; let renderer:THREE.WebGLRenderer;
  try{renderer=new THREE.WebGLRenderer({alpha:true,antialias:true});}catch{return;}
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setClearColor(0,0);el.appendChild(renderer.domElement);
  const source=document.createElement('canvas');source.width=1200;source.height=720;
  const texture=new THREE.CanvasTexture(source);texture.colorSpace=THREE.SRGBColorSpace;
  const uniforms={uText:{value:texture},uProgress:{value:0},uTime:{value:0}};
  const material=new THREE.ShaderMaterial({uniforms,transparent:true,depthWrite:false,fragmentShader:fragment,vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position,1.);}'});
  const geometry=new THREE.PlaneGeometry(2,2);const scene=new THREE.Scene();scene.add(new THREE.Mesh(geometry,material));const camera=new THREE.Camera();
  const resize=()=>{
    const b=el.getBoundingClientRect(); renderer.setSize(b.width*1.14,b.height*2.5);
    const style=getComputedStyle(el.querySelector('em')!); const fontSize=parseFloat(style.fontSize);
    const resolution=3; source.width=Math.max(1,Math.round(b.width*1.14*resolution));source.height=Math.max(1,Math.round(b.height*2.5*resolution));
    const c=source.getContext('2d')!;c.clearRect(0,0,source.width,source.height);c.fillStyle='#ffffff';
    c.font=`${style.fontStyle} ${style.fontWeight} ${fontSize*resolution}px ${style.fontFamily}`;
    c.textAlign='center';c.textBaseline='top';c.letterSpacing=`${(parseFloat(style.letterSpacing)||0)*resolution}px`;
    c.fillText('DEEPER',source.width/2,fontSize*.1*resolution);texture.needsUpdate=true;
  };
  const observer=new ResizeObserver(resize);observer.observe(el);document.fonts.ready.then(()=>{if(!disposed){resize();el.classList.add('gpu-ready');}});
  let frame=0;let visible=false;const reduced=matchMedia('(prefers-reduced-motion:reduce)');
  const tick=(now:number)=>{if(disposed)return; if(visible&&!document.hidden){uniforms.uProgress.value=parseFloat(getComputedStyle(el).getPropertyValue('--submerge'))||0;uniforms.uTime.value=reduced.matches?0:now*.001;renderer.render(scene,camera);}frame=requestAnimationFrame(tick);};
  const intersection=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;});intersection.observe(el);frame=requestAnimationFrame(tick);resize();
  return()=>{disposed=true;cancelAnimationFrame(frame);observer.disconnect();intersection.disconnect();geometry.dispose();material.dispose();texture.dispose();renderer.dispose();renderer.domElement.remove();el.classList.remove('gpu-ready');};
 },[]);
 return <span ref={host} className="discovery-water-word"><em className="discovery-deeper">DEEPER</em></span>;
}




