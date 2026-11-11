(()=>{
'use strict';
const chapters=[
 ['Shape memory','Heating traces one path. Cooling follows another.','The space between the curves is hysteresis.','An illustrative cycle, not a measured temperature series.'],
 ['Magnetic strain','Iron provides the baseline: approximately 20 ppm.','Galfenol and Terfenol-D produce much larger strains.','Read the logarithmic axis: equal distances are not equal increments.'],
 ['Five elements','Five principal elements, each at 20 atomic percent.','Different elements occupy one shared lattice.','Marker styles distinguish elements; positions are illustrative.'],
 ['Crystal & glass','A crystal repeats an ordered arrangement.','The glass illustration reveals irregular atomic packing.','These are structural sketches, not measured atomic positions.'],
 ['Nickel balance','Weight percent and atomic percent describe the same composition differently.','The band marks the industry range for binary Nitinol.','The curve shows a direction of change, not measured values.'],
 ['Institution network','Follow the institutions and the documented links.','Dashed connections represent claims or disputed relationships.','A connection is not proof of a shared origin.'],
 ['Disclosure timeline','The left-hand axis spans years, from 2004 onward.','After the break, the scale expands into months of 2026.','Markers preserve the case file’s distinction between records and testimony.'],
 ['Isotope evidence','Earth’s magnesium is approximately 79 / 10 / 11 percent.','The Powell fragment is represented within terrestrial limits.','The hatched Nolan row remains unknown: no published values.'],
 ['Complexity matrix','Compare element counts across engineered and alleged samples.','Process control and structural novelty are editorial ratings.','No sample here has a published, confirmed isotope anomaly.']
];
const $=id=>document.getElementById(id), figures=[...document.querySelectorAll('.plate')];
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let time=0,playing=false,active=-1,last=0,frame=0;
const clamp=v=>Math.max(0,Math.min(1,v));
chapters.forEach((c,i)=>{const b=document.createElement('button');b.innerHTML=`<span>${String(i+1).padStart(2,'0')}</span><span>${c[0]}</span>`;b.onclick=()=>seek(i*10);$('chapters').append(b)});
// Animate original SVG marks, retaining their measured positions and all evidence encodings.
const tracks=figures.map((f,chapter)=>{
 const svg=f.querySelector('svg');if(svg.viewBox.baseVal.width>600)f.querySelector('.svgbox').classList.add('wide');
 const nodes=[...svg.children];
 return nodes.map((el,i)=>{
  const tag=el.tagName.toLowerCase(), cls=el.getAttribute('class')||'';
  let start=.5+(i/Math.max(1,nodes.length-1))*5.3, duration=.65, mode='fade',length=0;
  if(cls==='rl')start=0;
  if(chapter===0&&tag==='path'){start=el.hasAttribute('stroke-dasharray')?3.5:1;duration=2.4;}
  if(chapter===1){const y=Number(el.getAttribute('y'));if(y>=48&&tag==='rect'){start=1+Math.floor((y-48)/54)*1.8;duration=1.4;mode='bar';}}
  if(chapter===3&&tag==='circle'){start=Number(el.getAttribute('cx'))<210?.5+i/72*2:3+(i-72)/120*3;}
  if(chapter===5){if(tag==='line'){start=el.hasAttribute('stroke-dasharray')?3.8:1;duration=1.5;}else start=0;}
  if(chapter===7){const y=Number(el.getAttribute('y'));start=y<70?.5:y<125?2.5:5;}
  if(chapter===8){const y=Number(el.getAttribute('y')||el.getAttribute('cy')||0);start=clamp(y/450)*5.5;}
  if((tag==='line'||tag==='path')&&!el.hasAttribute('stroke-dasharray')&&cls!=='inkf'&&cls!=='hol'&&el.getTotalLength){length=el.getTotalLength();if(length>25)mode='draw';}
  return {el,start,duration,mode,length,width:el.getAttribute('width')};
 });
});
function render(){
 const index=Math.min(8,Math.floor(time/10)), local=time-index*10;
 if(index!==active){active=index;figures.forEach((f,i)=>f.hidden=i!==index);[...$('chapters').children].forEach((b,i)=>b.setAttribute('aria-current',String(i===index)));}
 tracks[index].forEach(t=>{const p=(reduced.matches||(!playing&&local===0))?1:clamp((local-t.start)/t.duration),e=1-Math.pow(1-p,3);t.el.style.opacity=String(p===0?0:t.mode==='fade'?e:1);if(t.mode==='draw'){t.el.style.strokeDasharray=String(t.length);t.el.style.strokeDashoffset=String(t.length*(1-e));}if(t.mode==='bar')t.el.setAttribute('width',String(Number(t.width)*e));});
 const phase=Math.min(2,Math.floor(local/3.34));$('phase').textContent=['01 / Observe','02 / Compare','03 / Read carefully'][phase];$('insight').textContent=chapters[index][phase+1];$('play').disabled=playing;$('pause').disabled=!playing;$('play').textContent=time===90?'↻ Replay':'▶ Play';$('play').setAttribute('aria-label',time===90?'Replay walkthrough':'Play walkthrough');
}
function tick(now){if(!playing)return;if(last)time=Math.min(90,time+(now-last)/1000);last=now;if(time===90)playing=false;render();if(playing)frame=requestAnimationFrame(tick);}
function run(){cancelAnimationFrame(frame);last=0;if(playing)frame=requestAnimationFrame(tick);render();}
function seek(value){time=Math.max(0,Math.min(90,value));last=0;render();}
$('play').onclick=()=>{if(time===90)time=0;playing=true;run()};$('pause').onclick=()=>{playing=false;run()};
document.addEventListener('keydown',e=>{if(/INPUT|SELECT|BUTTON|A|TEXTAREA/.test(e.target.tagName)||e.altKey||e.metaKey||e.ctrlKey)return;if(e.code==='Space'){e.preventDefault();$(playing?'pause':'play').click()}if(e.code==='ArrowRight'){e.preventDefault();seek(Math.min(8,active+1)*10)}if(e.code==='ArrowLeft'){e.preventDefault();seek(Math.max(0,active-1)*10)}});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&playing){playing=false;run()}});reduced.addEventListener('change',render);render();
})();
