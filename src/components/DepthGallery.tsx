import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);
import '../styles/depth-gallery.css';
const projects = [
 {name:'ALAGEELY',category:'LEGAL PORTFOLIO',scope:'Web design / Development / Brand identity',image:'/alageely-screen.png',url:'https://alageely.com/',color:'#cdbb94'},
 {name:'RIYADH RETINA',category:'HEALTHCARE EXPERIENCE',scope:'Web design / Development / SEO / Medical UX',image:'/retina-screen.png',url:'https://riyadhretina.com/',color:'#78dbe3'},
 {name:'SYC LEAGUE',category:'SPORTS PLATFORM',scope:'Web app / Live streaming / Dashboard / Mobile',image:'/syc-screen.png',url:'https://sycleague.com/en',color:'#b5dc6e'},
 {name:'LINEUP',category:'LIVE ENTERTAINMENT',scope:'Web design / Development / Content / SEO',image:'/lineup-screen.jpg',url:'https://bybahr.com/work/lineup/',color:'#ff945a'},
];
export default function DepthGallery(){
 const [active,setActive]=useState(0);const [direction,setDirection]=useState(1);const touch=useRef(0);
 const root=useRef<HTMLElement>(null);const scrollScene=useRef<ScrollTrigger|null>(null);
 useEffect(()=>{
  const media=gsap.matchMedia();
  media.add('(prefers-reduced-motion: no-preference)',()=>{
   const scene=root.current;if(!scene)return;
   const arrival=gsap.context(()=>{
    const reveal=gsap.timeline({scrollTrigger:{trigger:scene,refreshPriority:-9,start:'top 95%',end:'top top',scrub:.65,invalidateOnRefresh:true}});
    reveal.fromTo('.work-arrival',{y:95,scale:.92,clipPath:'inset(18% 12% 12% 12% round 28px)'},{y:0,scale:1,clipPath:'inset(0% 0% 0% 0% round 0px)',duration:1,ease:'power2.out'},0)
      .fromTo('.mirage-work-heading',{opacity:0,y:25},{opacity:1,y:0,duration:.35},.5)
      .fromTo('.mirage-work-controls',{opacity:0,y:20},{opacity:1,y:0,duration:.3},.7)
      .fromTo(scene,{'--arrival-light':0},{'--arrival-light':1,duration:1,ease:'none'},0);
   },scene);
   let last=0;
   const trigger=ScrollTrigger.create({trigger:scene,refreshPriority:-10,start:'top top',end:()=>`+=${innerHeight*(projects.length*(window.matchMedia('(max-width:700px)').matches?.75:.95))}`,pin:true,scrub:true,invalidateOnRefresh:true,onUpdate:self=>{
    const total=self.progress*projects.length;const index=Math.min(projects.length-1,Math.floor(total));const phase=Math.min(1,total-index);
    const bridge=0; const handoff=index===projects.length-1?gsap.utils.clamp(0,1,(phase-.72)/.28):0;
    scene.style.setProperty('--work-bridge',String(bridge)); scene.style.setProperty('--project-handoff',String(handoff)); scene.style.setProperty('--portfolio-chrome',String(1-handoff));
    if(index!==last){setDirection(index>last?1:-1);setActive(index);last=index;}
    const entry=Math.min(1,phase/.22);const exit=index<projects.length-1?Math.max(0,(phase-.78)/.22):0;
    scene.style.setProperty('--scroll-scale',String(.88+.12*entry-.05*exit-.18*bridge));
    scene.style.setProperty('--scroll-tilt',`${(1-entry)*5-exit*3}deg`);
    scene.style.setProperty('--scroll-lift',`${(1-entry)*45-exit*35-bridge*115}px`);
    scene.style.setProperty('--scroll-fade',String((1-exit*.7)*(1-bridge)));
    scene.style.setProperty('--work-progress',String(self.progress));
   }});scrollScene.current=trigger;
   return()=>{arrival.revert();trigger.kill();scrollScene.current=null;};
  });return()=>media.revert();
 },[]);
 const select=(index:number)=>{const t=scrollScene.current;if(t){window.scrollTo({top:t.start+(index+.35)/projects.length*(t.end-t.start),behavior:Math.abs(index-active)>1?'instant' as ScrollBehavior:'smooth'});}else{setDirection(index>active?1:-1);setActive(index);}};
 const prev=(active+projects.length-1)%projects.length,next=(active+1)%projects.length;
 const change=(step:number)=>{select((active+step+projects.length)%projects.length);};
 return <section ref={root} id="work" className="mirage-work" aria-label="Selected Work" style={{'--project-accent':projects[active].color} as React.CSSProperties}>
 <div className="work-arrival"><header className="mirage-work-heading"><span>SELECTED WORK</span><a className="work-all-link" href="https://bybahr.com/work/" target="_blank" rel="noreferrer">ALL PROJECTS <span className="mobile-decoration">↗</span></a></header>
 <div className="mirage-project-stage" onTouchStart={e=>{touch.current=e.touches[0].clientX;}} onTouchEnd={e=>{const delta=e.changedTouches[0].clientX-touch.current;if(Math.abs(delta)>50)change(delta<0?1:-1);}}>
 <button className="mirage-side mirage-side-prev" onClick={()=>change(-1)} aria-label={`Previous project: ${projects[prev].name}`}><img src={projects[prev].image} alt="" /><span>←</span></button>
 <a key={active} className={`mirage-project ${direction<0?'from-left':'from-right'}`} href={projects[active].url} target="_blank" rel="noreferrer" onPointerMove={e=>{if(e.pointerType!=='mouse')return;const r=e.currentTarget.getBoundingClientRect();e.currentTarget.style.setProperty('--pointer-x',`${(e.clientX-r.left)/r.width*100}%`);e.currentTarget.style.setProperty('--pointer-y',`${(e.clientY-r.top)/r.height*100}%`);e.currentTarget.style.setProperty('--image-x',`${((e.clientX-r.left)/r.width-.5)*-12}px`);e.currentTarget.style.setProperty('--image-y',`${((e.clientY-r.top)/r.height-.5)*-8}px`);}} onPointerLeave={e=>{e.currentTarget.style.setProperty('--image-x','0px');e.currentTarget.style.setProperty('--image-y','0px');}} aria-label={`Explore ${projects[active].name}`}>
 <img className="mirage-project-image" src={projects[active].image} alt={`${projects[active].name} website preview`} />
 <div className="mirage-project-shade" /><div className="mirage-project-title"><span>{projects[active].category}</span><h2>{projects[active].name}</h2><span className="mirage-project-invitation">EXPLORE THE EXPERIENCE <span className="mobile-decoration">↗</span></span></div><span className="mirage-project-cursor" aria-hidden="true">VIEW<br/>PROJECT ↗</span>
 </a>
 <button className="mirage-side mirage-side-next" onClick={()=>change(1)} aria-label={`Next project: ${projects[next].name}`}><img src={projects[next].image} alt="" /><span>→</span></button>
 </div>
 <div className="work-scroll-track" aria-hidden="true"><span /></div><footer className="mirage-work-controls"><button onClick={()=>change(-1)}><small>PREVIOUS</small><strong>{projects[prev].name}</strong></button><nav aria-label="Choose project">{projects.map((p,i)=><button key={p.name} onClick={()=>{select(i);}} aria-label={p.name} aria-current={i===active?'true':undefined}><span /></button>)}</nav><button onClick={()=>change(1)}><small>NEXT</small><strong>{projects[next].name}</strong></button></footer>
 </div><div className="work-next-chapter"><span>THE NEXT CHAPTER</span><p>YOUR PROJECT<br /><em>COULD BE NEXT</em></p><span>LET’S BUILD IT TOGETHER</span></div></section>;
}
