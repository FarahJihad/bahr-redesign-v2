const { chromium } = require('C:/Users/farah/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs = require('fs');
(async () => {
const browser = await chromium.launch({channel:'msedge',headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const results=[];
for (const [name,width,height] of [['desktop',1440,1000],['mobile',390,844],['small-mobile',320,640]]) {
 const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5173',{waitUntil:'networkidle'});
 await page.evaluate(()=>document.documentElement.style.scrollBehavior='auto');
 for(const [chapter,p] of [['opening',.08],['alageely',.33],['retina',.63],['syc',.92],['flight',.51]]) {
  await page.evaluate(p=>{const el=document.querySelector('#work');window.scrollTo({top:scrollY+el.getBoundingClientRect().top+p*(el.offsetHeight-innerHeight),behavior:'instant'});},p);
  await page.waitForTimeout(1500);
  const check=await page.evaluate(()=>{
   const caption=document.querySelector('.bahr-project-caption');const b=caption?.getBoundingClientRect();const canvas=document.querySelector('#work canvas');
   return {title:document.querySelector('.bahr-project-caption h2')?.textContent||'Opening',opacity:caption?getComputedStyle(caption).opacity:null,canvas:!!canvas,widthOverflow:document.documentElement.scrollWidth>innerWidth,captionFits:!b||(b.left>=0&&b.right<=innerWidth&&b.bottom<=innerHeight),webgl:!!canvas?.getContext('webgl2')};
  });
  results.push({name,chapter,...check,errors:[...errors]});
  if(chapter!=='flight') await page.screenshot({path:`../../${name}-${chapter}.png`});
 }
 await page.close();
}
fs.writeFileSync('../../verification.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});

