import BuildInvitation from './components/BuildInvitation';
import LiquidMark from './components/LiquidMark';

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  ArrowDown,
  ArrowUpRight,
  Menu,
  X,
} from "lucide-react";


import HeroMark from "./components/HeroMark";
import OceanWaves from "./components/OceanWaves";
import DepthGallery from "./components/DepthGallery";
import "./App.css";
import "./styles/responsive-layout.css";

gsap.registerPlugin(ScrollTrigger);

const navigation = [
  { id: "about", label: "Agency" },
  { id: "services", label: "Expertise" },
  { id: "work", label: "Work" },
  { id: "contact", label: "Contact" },
];

function App() {
  const sceneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const media = gsap.matchMedia();
    media.add('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)', () => {
      const title = sceneRef.current?.querySelector<HTMLElement>('.hero-title');
      if (!title) return;
      const ink = title.querySelectorAll('.hero-title-ink');
      const x = gsap.quickTo(ink, 'x', { duration: .65, ease: 'power3.out' });
      const y = gsap.quickTo(ink, 'y', { duration: .65, ease: 'power3.out' });
      const move = (event: PointerEvent) => {
        const box = title.getBoundingClientRect();
        x(gsap.utils.clamp(-4, 4, ((event.clientX - box.left) / box.width - .5) * 8));
        y(gsap.utils.clamp(-2, 2, ((event.clientY - box.top) / box.height - .5) * 4));
      };
      const reset = () => { x(0); y(0); };
      title.addEventListener('pointermove', move); title.addEventListener('pointerleave', reset);
      return () => { title.removeEventListener('pointermove', move); title.removeEventListener('pointerleave', reset); };
    }, sceneRef);
    return () => media.revert();
  }, []);

  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("home");

  useEffect(() => {
    const updateNavbar = () => {
      setIsScrolled(window.scrollY > 80);
    };

    window.addEventListener("scroll", updateNavbar, {
      passive: true,
    });

    updateNavbar();

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const context = gsap.context(() => {
      if (!reducedMotion && sceneRef.current) {
        const intro = gsap.timeline({
          defaults: {
            ease: "power3.out",
          },
        });

        intro
          .from(".hero-eyebrow", {
            opacity: 0,
            y: 25,
            duration: 0.7,
          })
          .from(
            ".hero-title .title-line",
            {
              opacity: 0,
              y: 90,
              duration: 1,
              stagger: 0.12,
            },
            "-=0.4"
          )
          .from(
            ".hero-principles > span, .hero-supporting",
            {
              opacity: 0,
              y: 25,
              duration: 0.7,
            },
            "-=0.5"
          );

        gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
        const descent = gsap.timeline({
          scrollTrigger: {
            trigger: sceneRef.current,
            start: "top top",
            end: "bottom bottom",
            scrub: 0.8,
            invalidateOnRefresh: true,
          },
        });

        descent
          .to(
            ".hero-content, .hero-brand",
            {
              yPercent: -22,
              scale: 1.16,
              opacity: 0,
              duration: 0.45,
              ease: "none",
            },
            0
          )
          .to(
            ".ocean-surface",
            {
              yPercent: -80,
              scale: 0.7,
              opacity: 0,
              duration: 0.8,
              ease: "none",
            },
            0
          )
          .to(
            ".light-rays",
            {
              yPercent: -40,
              scale: 1.5,
              opacity: 0,
              duration: 0.8,
              ease: "none",
            },
            0
          )
          .to(
            ".depth-fog",
            {
              scale: 1.4,
              opacity: 0.75,
              duration: 0.8,
              ease: "none",
            },
            0
          )
          .to(
            ".hero-bottom",
            {
              opacity: 0,
              y: 30,
              duration: 0.3,
              ease: "none",
            },
            0.1
          )
          .to(
            ".ocean-darkness",
            {
              opacity: 0.85,
              duration: 0.65,
              ease: "none",
            },
            0.15
          )
          .fromTo(
            ".depth-reveal",
            {
              y: 75,
              autoAlpha: 0,
            },
            {
              y: 0,
              autoAlpha: 1,
              duration: 0.32,
              ease: "power2.out",
            },
            0.6
          )
          .from('.discovery-line', { yPercent: 80, opacity: 0, stagger: .04, duration: .35, ease: 'power3.out' }, .66)
          .from('.depth-reveal p', { y: 12, opacity: 0, duration: .2 }, .95)
          .to({}, { duration: .55 }, 1.1)
          .fromTo('.discovery-light-pass', { xPercent: -160, opacity: 0 }, { xPercent: 160, opacity: .6, duration: .65, ease: 'sine.inOut' }, 1.55)
          .to('.depth-reveal h2', { scale: 1.12, y: 38, opacity: 0, filter: 'blur(6px)', duration: .9, ease: 'power2.in' }, 1.65)
          .to('.depth-reveal .eyebrow', { opacity: 0, duration: .35 }, 1.85)
          .to('.discovery-light-pass', { opacity: 0, duration: .2 }, 2.15)
          .to('.depth-reveal p', { opacity: 0, duration: .3 }, 1.7)
          .to({}, { duration: .2 });
        });
      }

      if (!reducedMotion) {
        gsap.from('.agency-manifesto-word', {
          color: '#48606e', stagger: .12, duration: .3, ease: 'none',
          scrollTrigger: { trigger: '#about', start: 'top 25%', end: 'bottom 90%', scrub: .5 },
        });
        gsap.fromTo('.agency-signature', { y: 25, rotation: -3, opacity: .85 }, {
          y: -20, rotation: 2, opacity: 1, ease: 'none',
          scrollTrigger: { trigger: '#about', start: 'top bottom', end: 'bottom top', scrub: 1 },
        });
        gsap.from('.agency-header-line', { yPercent: 105, stagger: .12, duration: 1, ease: 'power3.out',
          scrollTrigger: { trigger: '#about', start: 'top 65%', toggleActions: 'play none none reverse' },
        });
      }

      gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
        const cards = gsap.utils.toArray<HTMLElement>('.expertise-card');
        gsap.set(cards, { opacity: 0, scale: .7, z: -300 });
        const journey = gsap.timeline({ scrollTrigger: { trigger: '#services', refreshPriority:0, start: 'top top', end: () => '+=' + innerHeight * (window.matchMedia('(max-width:700px)').matches ? 2.6 : 3.2), pin: true, scrub: .8, invalidateOnRefresh: true } });
        journey.to('.expertise-intro', { opacity: 0, scale: 1.12, duration: .65 }).to({}, { duration: .12 });
        cards.forEach((card, i) => {
          journey.fromTo(card, { opacity: 0, scale: .7, z: -300, filter: 'blur(9px)' }, { opacity: 1, scale: 1, z: 0, filter: 'blur(0px)', duration: .75 })
            .fromTo(card.querySelectorAll('.expertise-word'), { yPercent: 65, rotationX: -35, opacity: 0 }, { yPercent: 0, rotationX: 0, opacity: 1, stagger: .18, duration: 1.1, ease: 'power2.out' }, '<')
            .to('#services', { '--service-angle': `${i * 14 - 20}deg`, '--service-hue': [198,214,183,202][i], duration: 1.3, ease: 'sine.inOut' }, '<')
            .to('.expertise-progress-fill', { scaleX: (i + 1) / cards.length, duration: .3 }, '<')
            .to('.expertise-light-sculpture', { rotation: i * 2 - 3, scale: 1.08 + i * .035, xPercent: i % 2 ? 2 : -2, duration: 1.3, ease: 'sine.inOut' }, '<')
            .to({}, { duration: 1.1 });
          if (i < cards.length - 1) journey.to(card, { opacity: 0, scale: 1.2, z: 180, filter: 'blur(8px)', duration: .65 });
        });
        journey.to(cards[cards.length-1],{y:-65,opacity:.15,scale:.96,duration:.8,ease:'power2.inOut'}).to('.expertise-caption',{opacity:0,duration:.4},'<').to('.expertise-atmosphere',{'--bridge-light':1,duration:.8},'<');
      });
      if (!reducedMotion) {
        gsap.from('.contact-email,.contact-details',{y:25,opacity:0,stagger:.15,duration:.8,ease:'power2.out',scrollTrigger:{trigger:'.contact-email',start:'top 95%',toggleActions:'play none none reverse'}});
      }
      navigation.forEach(({ id }) => {
        const element = document.getElementById(id);

        if (!element) return;

        ScrollTrigger.create({
          trigger: element,
          start: "top 45%",
          end: "bottom 45%",
          onEnter: () => setActiveSection(id),
          onEnterBack: () => setActiveSection(id),
        });
      });

      ScrollTrigger.create({
        trigger: "#home",
        start: "top top",
        endTrigger: "#about",
        end: "top center",
        onEnter: () => setActiveSection("home"),
        onEnterBack: () => setActiveSection("home"),
      });
    });

    const navigateSection = (event: MouseEvent) => {
      const anchor = (event.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
      const id = anchor?.getAttribute('href')?.slice(1);
      if (!id) return;
      const pinned = ScrollTrigger.getAll().find(t => t.trigger?.id === id && t.vars.pin);
      if (!pinned) return;
      event.preventDefault();history.replaceState(null, '', '#' + id);
      window.scrollTo({top:pinned.start+1,behavior:'smooth'});
    };
    document.addEventListener('click', navigateSection);
    ScrollTrigger.sort();
    const refreshFrame = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => {
      cancelAnimationFrame(refreshFrame);document.removeEventListener('click', navigateSection);
      window.removeEventListener("scroll", updateNavbar);
      context.revert();
    };
  }, []);

  useEffect(() => {
    if (!menuOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [menuOpen]);

  return (
    <main>
      {/* FLOATING NAVIGATION */}
      <header
        className={`site-header ${
          isScrolled ? "scrolled" : ""
        }`}
      >
        <nav
          className="navbar"
          aria-label="Main navigation"
        >
          <a
            href="#home"
            className="logo"
            onClick={() => setMenuOpen(false)}
          >
            <img src="/bahr-mark.svg" alt="" className="nav-brand-mark" />
            BAHR
          </a>

          <div className="nav-links">
            {navigation.slice(0, 3).map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                aria-current={activeSection === item.id ? "location" : undefined}
                className={
                  activeSection === item.id ? "active" : ""
                }
              >
                {item.label}
              </a>
            ))}
          </div>

          <a
            className="nav-cta"
            href="#contact"
          >
            LET'S TALK <ArrowUpRight size={16} />
          </a>

          <button
            className="menu-toggle"
            type="button"
            aria-label={
              menuOpen ? "Close menu" : "Open menu"
            }
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? (
              <X size={22} />
            ) : (
              <Menu size={22} />
            )}
          </button>
        </nav>

        <div
          id="mobile-menu"
          className={`mobile-menu ${
            menuOpen ? "open" : ""
          }`}
          inert={!menuOpen}
        >
          {navigation.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={() => setMenuOpen(false)}
            >
              {item.label}
            </a>
          ))}
        </div>
      </header>

      {/* THE DESCENT HERO */}
      <div
        className="descent-scene"
        ref={sceneRef}
      >
        <section
          className="hero"
          id="home"
        >
          <div
            className="ocean-environment"
            aria-hidden="true"
          >
            <OceanWaves />
            <div className="ocean-surface" />

            <div className="light-rays">
              <span className="ray ray-one" />
              <span className="ray ray-two" />
              <span className="ray ray-three" />
              <span className="ray ray-four" />
            </div>

            <div className="depth-fog" />
            <div className="ocean-darkness" />
            <div className="ocean-vignette" />
          </div>

          <div className="hero-brand"><HeroMark /></div>
          <div className="hero-content">
            <p className="hero-eyebrow">
              INDEPENDENT DIGITAL AGENCY — JEDDAH
            </p>

            <h1 className="hero-title">
              <span className="title-mask">
                <span className="title-line">
                  <span className="hero-title-ink">BEYOND</span>
                </span>
              </span>

              <span className="title-mask">
                <span className="title-line">
                  <span className="hero-title-ink">THE SURFACE</span>
                  
                </span>
              </span>
            </h1>

            <div className="hero-description">
              <p className="hero-principles">
                <span>Design with <em>depth</em></span>
                <span>Technology with <em>purpose</em></span>
              </p>
              <p className="hero-supporting">Digital experiences engineered<br />to go deeper</p>
            </div>
          </div>

          <div className="hero-bottom">
            <a
              href="#about"
              className="scroll-cue"
            >
              SCROLL TO EXPLORE
              <ArrowDown size={18} />
            </a>

            <span>THE DESCENT</span>
          </div>

          <svg className="discovery-filter" aria-hidden="true" width="0" height="0"><defs><filter id="discovery-water-distortion" x="-15%" y="-20%" width="130%" height="160%"><feTurbulence type="fractalNoise" baseFrequency="0.012 0.06" numOctaves="2" seed="4" result="waves" /><feDisplacementMap className="discovery-displacement" in="SourceGraphic" in2="waves" scale="0" xChannelSelector="R" yChannelSelector="G" /></filter></defs></svg>
          <div className="depth-reveal">
            <span className="eyebrow">
              THE DISCOVERY
            </span>

            <h2 aria-label="GREAT IDEAS GO DEEPER"><span className="discovery-light-pass" aria-hidden="true" /><span className="discovery-line discovery-first">GREAT IDEAS</span><span className="discovery-line discovery-second">GO <em>DEEPER</em></span></h2>

            <p>
              There is always more beneath the surface.
            </p>
          </div>
        </section>
      </div>

      {/* AGENCY */}
      <section id="about" className="content-section about-section">
        <div className="agency-stage">
          <div className="agency-section-top"><span className="eyebrow">THE AGENCY</span><span>JEDDAH ROOTS / WIDER PERSPECTIVE</span></div>
          <div className="agency-signature"><LiquidMark /></div>
          <h2 className="agency-editorial-title"><span><span className="agency-header-line">Independent minds</span></span><span><span className="agency-header-line">Extraordinary <em>depth</em></span></span></h2>
          <div className="agency-manifesto-layout">
            <span className="agency-margin-label">THIS IS BAHR</span>
            <p className="agency-manifesto"><span className="agency-introduction">{'Bahr is an independent digital agency based in Jeddah'.split(' ').map((word,i) => <span className="agency-manifesto-word" key={`intro-${i}`}>{word} </span>)}</span><span className="agency-manifesto-break" />{'We bring thoughtful design and purposeful engineering together to create ambitious digital experiences'.split(' ').map((word,i) => <span className={`agency-manifesto-word ${['thoughtful','design','purposeful','engineering'].includes(word) ? 'agency-accent-word' : ''}`} key={`detail-${i}`}>{word} </span>)}</p>
          </div>
          <div className="agency-bottom-rule"><span>DESIGN WITH DEPTH / TECHNOLOGY WITH PURPOSE</span><a className="text-link agency-link" href="#services">EXPLORE OUR EXPERTISE <ArrowUpRight size={18} /></a></div>
        </div>
      </section>
      <section id="services" className="content-section services-section" onPointerMove={e=>{if(e.pointerType!=="mouse")return;const r=e.currentTarget.getBoundingClientRect();e.currentTarget.style.setProperty("--light-x",`${(e.clientX-r.left)/r.width*100}%`);e.currentTarget.style.setProperty("--light-y",`${(e.clientY-r.top)/r.height*100}%`);}} onPointerLeave={e=>{e.currentTarget.style.setProperty("--light-x","50%");e.currentTarget.style.setProperty("--light-y","50%");}}>
        <div className="expertise-atmosphere" aria-hidden="true"><i /><i /><i /><img className="expertise-light-sculpture" src="/bahr-contours.svg" alt="" /></div>
        <span className="eyebrow expertise-label">OUR EXPERTISE</span>
        <div className="expertise-intro"><h2 className="section-title">BUILT WITH<br /><em>PURPOSE</em></h2><p className="expertise-intro-copy">Four disciplines / One deeper perspective</p></div>
        <div className="expertise-window"><div className="expertise-track">{[
          { title: 'Web Platforms', tags: 'DESIGN / DEVELOPMENT / WEBGL', copy: 'Distinctive websites and capable platforms, shaped around your audience and built to grow with your business' },
          { title: 'AI & Automation', tags: 'AI AGENTS / INTEGRATIONS / WORKFLOWS', copy: 'Purposeful AI and connected workflows that turn complex tasks into simple, useful experiences' },
          { title: 'Mobile Applications', tags: 'IOS / ANDROID / REACT NATIVE', copy: 'Thoughtful mobile products that feel natural to use, from the first interaction to everyday moments' },
          { title: 'Product Design', tags: 'STRATEGY / UX / UI / PROTOTYPING', copy: 'Clear ideas brought to life through research, intuitive interfaces and details that make a difference' },
        ].map(service => <article className="expertise-card" key={service.title}><span className="expertise-tags">{service.tags}</span><h3 aria-label={service.title}>{service.title.split(" ").map((word, i) => <span className="expertise-word-mask" key={i}><span className="expertise-word" aria-hidden="true">{word}</span></span>)}</h3><p>{service.copy}</p><a href="#contact" className="text-link">LET'S BUILD IT <ArrowUpRight size={18} /></a><span className="expertise-card-glow" aria-hidden="true" /></article>)}</div></div>
        <div className="expertise-caption"><span>IDEAS INTO EXPERIENCES</span><span>SCROLL TO GO DEEPER</span></div><div className="expertise-progress"><span className="expertise-progress-fill" /></div>
      </section>

      {/* NEW CINEMATIC PROJECT GALLERY */}
      <DepthGallery />

      <footer id="contact" className="contact-section contact-finale">
        <div className="contact-horizon" aria-hidden="true" />
        <div className="contact-topline"><span className="eyebrow">YOUR NEXT CHAPTER</span><span>STARTS WITH A CONVERSATION</span></div>
        <div className="contact-main"><div className="contact-message"><BuildInvitation /><p>Tell us where you want to go<br />We'll build the way there</p></div></div>
        <a className="contact-email" href="mailto:dive@b7r.agency"><span className="contact-email-label">START A CONVERSATION</span><span className="contact-email-address">dive@b7r.agency</span><ArrowUpRight aria-hidden="true" /></a>
        <div className="bahr-footer-grid">
          <div className="bahr-footer-column"><span className="footer-label">EXPERTISE</span><a href="#services">Web Platforms</a><a href="#services">AI &amp; Automation</a><a href="#services">Mobile Applications</a><a href="#services">Product Design</a></div>
          <div className="bahr-footer-column"><span className="footer-label">EXPLORE</span><a href="#about">The Agency</a><a href="#work">Selected Work</a><a href="https://www.linkedin.com/company/bybahr" target="_blank" rel="noopener noreferrer">LinkedIn <span className="mobile-decoration">↗</span></a></div>
          <div className="bahr-footer-brand"><a href="#home" className="footer-brand"><img src="/bahr-mark.svg" alt="" />BAHR</a><h3>Design with depth</h3><p>An independent digital agency bringing thoughtful design and purposeful engineering together</p><span>Jeddah, Saudi Arabia</span></div>
          <div className="bahr-footer-column"><span className="footer-label">KEEP IN TOUCH</span><a href="mailto:dive@b7r.agency">dive@b7r.agency</a><a href="#home">Back to the surface <span className="mobile-decoration">↑</span></a><span className="footer-copyright">© {new Date().getFullYear()} Bahr Agency<br />Made of depth</span></div>
        </div>
      </footer>
    </main>
  );
}

export default App;




















