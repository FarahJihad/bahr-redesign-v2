
import {useEffect,useRef} from 'react';
import gsap from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);
export default function BuildInvitation(){
 const root=useRef<HTMLAnchorElement>(null);
 useEffect(()=>{
  const media=gsap.matchMedia();
  media.add('(prefers-reduced-motion: no-preference)',()=>{
   const el=root.current!;
   const context=gsap.context(()=>{
    gsap.fromTo('.invitation-project-image',{scale:1.02,yPercent:5},{scale:1.16,yPercent:0,ease:'none',scrollTrigger:{trigger:el,start:'top bottom',end:'top 18%',scrub:.7}});
    const entrance=gsap.timeline({scrollTrigger:{trigger:el,start:'top 95%',end:'top 18%',scrub:.55,invalidateOnRefresh:true}});
    entrance.fromTo('.build-water-scene',{opacity:0},{opacity:1,duration:.55,ease:'none'},0).fromTo('.invitation-questions',{opacity:0,y:18},{opacity:1,y:0,duration:.4,ease:'power2.out'},.2).fromTo('.build-burn-eyebrow',{opacity:0,y:10},{opacity:1,y:0,duration:.25},.35).fromTo('.build-burn-message',{opacity:0,y:24,scale:.97},{opacity:1,y:0,scale:1,duration:.45,ease:'power2.out'},.45);

    const sequence=gsap.timeline({scrollTrigger:{trigger:el,refreshPriority:-20,start:()=>window.matchMedia('(max-width:700px)').matches?'top top':'top 18%',end:()=>`+=${innerHeight*(window.matchMedia('(max-width:700px)').matches?.72:1.4)}`,pin:true,scrub:1,invalidateOnRefresh:true}});
    sequence.set(el,{'--trail':0,'--echo-opacity':0})
      .set('.build-intro,.build-word,.build-invitation-caption',{opacity:0})
      .to({},{duration:.25})
      .to('.build-burn-message',{scale:1.18,duration:1,ease:'power1.in'},'burn')
      .to('.burn-glyph',{opacity:0,filter:'blur(7px)',y:-12,textShadow:'-3px 0 #f47f8c,3px 0 #7de7ff',duration:.5,stagger:{amount:.6,from:'center'},ease:'power2.in'},'burn+=.15')
      .to('.build-burn-eyebrow',{opacity:0,duration:.3},'burn')
      .to('.invitation-questions',{opacity:0,y:-18,duration:.6},'burn')
      .fromTo('.build-water-scene',{opacity:1},{opacity:0,duration:.7,immediateRender:false},'burn+=.15')
      .fromTo('.build-intro,.build-word,.build-invitation-caption',{opacity:0,y:24},{opacity:1,y:0,duration:.6,stagger:.08},'>')
      .to({},{duration:.4})
      .to(el,{'--trail':1.15,'--echo-opacity':1,duration:1,ease:'power2.inOut'})
      .to('.build-intro',{opacity:0,duration:.3},'<')
      .to({},{duration:.45});
    const descent=gsap.timeline({scrollTrigger:{trigger:el,refreshPriority:-21,start:()=>sequence.scrollTrigger!.end,end:()=>`+=${innerHeight*.38}`,scrub:1,invalidateOnRefresh:true}});
    descent.to('.build-invitation-caption',{opacity:0,duration:.2})
      .to('.build-letter-2 .build-letter-face',{opacity:0,duration:.12})
      .fromTo('.build-contact-replacement',{opacity:0,width:()=>parseFloat(getComputedStyle(el.querySelector('.build-word')!).fontSize)*.13,height:()=>parseFloat(getComputedStyle(el.querySelector('.build-word')!).fontSize)*.72,xPercent:-50,yPercent:-50,x:0,y:0,rotation:0},{opacity:1,duration:.12},'<')
      .to('.build-contact-replacement',{y:()=>el.querySelector<HTMLElement>('.build-word')!.getBoundingClientRect().height*1.02,rotation:24,duration:1,ease:'power2.inOut'})
      .to({},{duration:.18})
      .to('.build-contact-replacement',{rotation:0,width:()=>parseFloat(getComputedStyle(el.querySelector('.build-word')!).fontSize)*(window.matchMedia('(max-width:700px)').matches?2:1),height:()=>parseFloat(getComputedStyle(el.querySelector('.build-word')!).fontSize)*(window.matchMedia('(max-width:700px)').matches?.5:.24),duration:1.15,ease:'power2.inOut'})
      .fromTo('.build-contact-label',{opacity:0},{opacity:1,duration:.4})
      .to({},{duration:.65});
   },el);
   const letters=Array.from(el.querySelectorAll<HTMLElement>('.build-letter-0,.build-letter-4'));
   const movers=letters.map(letter=>({x:gsap.quickTo(letter,'x',{duration:1.1,ease:'power3.out'}),y:gsap.quickTo(letter,'y',{duration:1.1,ease:'power3.out'})}));
   const move=(e:PointerEvent)=>{if(e.pointerType!=='mouse')return;const r=el.getBoundingClientRect();const x=(e.clientX-r.left)/r.width-.5;const y=(e.clientY-r.top)/r.height-.5;movers.forEach((m,i)=>{m.x(x*(8+i*2));m.y(y*(10+i*2));});};
   const leave=()=>movers.forEach(m=>{m.x(0);m.y(0);});
   el.addEventListener('pointermove',move);el.addEventListener('pointerleave',leave);
   return()=>{el.removeEventListener('pointermove',move);el.removeEventListener('pointerleave',leave);movers.forEach(m=>{m.x.tween.kill();m.y.tween.kill();});context.revert();};
  });return()=>media.revert();
 },[]);
 return <a ref={root} className="build-invitation" href="mailto:dive@b7r.agency" aria-label="Build with Bahr — start a conversation"><span className="build-water-scene" aria-hidden="true"><img className="invitation-project-image" src="/lineup-screen.jpg" alt="" /></span><span className="invitation-questions" aria-hidden="true"><span>?</span></span><span className="build-burn-scene" aria-hidden="true"><span className="build-burn-eyebrow">THE NEXT CHAPTER</span><span className="build-burn-message">{["YOUR PROJECT","COULD BE NEXT"].map((line)=><span className="burn-line" key={line}>{line.split("").map((letter,i)=><span className="burn-glyph" key={i} style={{'--glyph-delay':`${i*.075}s`} as React.CSSProperties}>{letter===" "?"\u00a0":letter}</span>)}</span>)}</span></span><span className="build-intro">LET’S</span><span className="build-word" aria-hidden="true">{'BUILD'.split('').map((letter,i)=><span className="build-slot" key={i}><span className={`build-letter build-letter-${i}`}><span className="build-letter-face">{letter}</span>{Array.from({length:5},(_,layer)=><span className="build-letter-trail" key={layer} style={{'--layer':layer+1} as React.CSSProperties}>{letter}</span>)}</span>{i===2&&<span className="build-contact-replacement" aria-hidden="true"><span className="build-contact-label">CONTACT US</span></span>}</span>)}</span><span className="build-invitation-caption">START SOMETHING EXTRAORDINARY <span>↗</span></span></a>;
}
