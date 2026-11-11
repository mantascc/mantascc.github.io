
(function(){
  function rng(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
  function put(id,w,h,body){const el=document.getElementById(id);if(!el)return;const lab=el.closest('figure').querySelector('.plate-head span').textContent;el.innerHTML='<svg viewBox="0 0 '+w+' '+h+'" role="img" aria-label="'+lab+'">'+body+'</svg>'}
  const L=(x1,y1,x2,y2,c,sw,da)=>'<line x1="'+x1.toFixed(1)+'" y1="'+y1.toFixed(1)+'" x2="'+x2.toFixed(1)+'" y2="'+y2.toFixed(1)+'" class="'+(c||'ln')+'" stroke-width="'+(sw||1)+'"'+(da?' stroke-dasharray="'+da+'"':'')+'/>';
  const T=(x,y,s,a,c)=>'<text x="'+x.toFixed(1)+'" y="'+y.toFixed(1)+'"'+(a?' text-anchor="'+a+'"':'')+(c?' class="'+c+'"':'')+'>'+s+'</text>';
  const C=(x,y,r,c,sw)=>'<circle cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="'+r+'" class="'+(c||'dot')+'"'+(sw?' stroke-width="'+sw+'"':'')+'/>';
  const P=(d,c,sw,da)=>'<path d="'+d+'" class="'+(c||'ln')+'" stroke-width="'+(sw||1)+'"'+(da?' stroke-dasharray="'+da+'"':'')+'/>';
  const R=(x,y,w,h,fill,extra)=>'<rect x="'+x.toFixed(1)+'" y="'+y.toFixed(1)+'" width="'+Math.max(0,w).toFixed(1)+'" height="'+h.toFixed(1)+'" '+fill+(extra||'')+'/>';
  const sig=x=>1/(1+Math.exp(-x));
  // claim glyphs
  function G(type,x,y,s){s=s||5;
    if(type==='D')return R(x-s,y-s,2*s,2*s,'class="inkf"');
    if(type==='O')return R(x-s,y-s,2*s,2*s,'class="hol" stroke-width="1.3"')+R(x-s,y-s,s,2*s,'class="inkf"');
    if(type==='T')return C(x,y,s);
    if(type==='S')return C(x,y,s-1,'hol',1.4);
    if(type==='H')return P('M'+x+' '+(y-s)+' L'+(x+s)+' '+(y+s)+' L'+(x-s)+' '+(y+s)+' Z','hol',1.3);
    return '';
  }
  // marker styles for elements
  function M(k,x,y,r){r=r||3.2;
    if(k===0)return C(x,y,r);
    if(k===1)return C(x,y,r-.4,'hol',1.3);
    if(k===2)return R(x-r+.4,y-r+.4,2*r-.8,2*r-.8,'class="inkf"');
    if(k===3)return L(x-r,y-r,x+r,y+r,'ln',1.4)+L(x-r,y+r,x+r,y-r,'ln',1.4);
    return P('M'+x+' '+(y-r)+' L'+(x+r)+' '+(y+r*.8)+' L'+(x-r)+' '+(y+r*.8)+' Z','inkf',0);
  }

  /* 01 hysteresis */
  (function(){
    const W=420,H=290,x0=50,x1=400,y0=240,y1=26;let b='';
    for(let i=0;i<=4;i++){const y=y0-(y0-y1)*i/4;b+=L(x0,y,x1,y,'rl');}
    b+=L(x0,y0,x1,y0)+L(x0,y0,x0,y1);
    const curve=(c,s)=>{let d='';for(let i=0;i<=90;i++){const t=i/90,x=x0+(x1-x0)*t,v=sig((t-c)*s);d+=(i?'L':'M')+x.toFixed(1)+' '+(y0-(y0-y1)*v).toFixed(1);}return d};
    b+=P(curve(.62,20),'ln',2.2)+P(curve(.40,20),'ln',1.3,'5 4');
    b+=T(x0+(x1-x0)*.70,y0-(y0-y1)*.62,'heating →','start')+T(x0+(x1-x0)*.34,y0-(y0-y1)*.36,'← cooling','end','m');
    b+=T(x0-8,y1+4,'100%','end','m')+T(x0-8,y0+4,'0%','end','m');
    b+=T((x0+x1)/2,y0+32,'temperature','middle','m');
    b+=T(x0+(x1-x0)*.40,y0+15,'Ms','middle','m')+T(x0+(x1-x0)*.62,y0+15,'As','middle','m');
    // martensite inset (top-left, sheared), austenite inset (bottom-right, cubic)
    const s=13;let g='';
    const mx=76,my=46;
    for(let i=0;i<3;i++)for(let j=0;j<3;j++)g+=C(mx+i*s+j*6,my+j*s,2.6);
    for(let i=0;i<2;i++)for(let j=0;j<2;j++)g+=C(mx+s/2+i*s+j*6+3,my+s/2+j*s,2.6,'hol',1.2);
    const ax=300,ay=150;
    for(let i=0;i<3;i++)for(let j=0;j<3;j++)g+=C(ax+i*s,ay+j*s,2.6);
    for(let i=0;i<2;i++)for(let j=0;j<2;j++)g+=C(ax+s/2+i*s,ay+s/2+j*s,2.6,'hol',1.2);
    g+=T(mx-6,my+50,'martensite, cool','start','m')+T(ax-6,ay+50,'austenite, hot','start','m');
    b+=g;
    put('p-hyst',W,H,b);
  })();

  /* 02 magnetostriction */
  (function(){
    const W=420,H=250,x0=96,x1=400;let b='';
    const lx=v=>x0+(x1-x0)*(Math.log10(v)-1)/3; // 10..10000
    [10,100,1000,10000].forEach(v=>{const x=lx(v);b+=L(x,24,x,200,'rl')+T(x,218,v.toLocaleString('en-US'),'middle','m');});
    b+=T((x0+x1)/2,240,'strain, parts per million (log)','middle','m');
    const rows=[['Iron',20],['Galfenol',400],['Terfenol-D',2000]];
    rows.forEach((r,i)=>{const y=48+i*54;b+=T(x0-10,y+16,r[0],'end')+R(x0,y,lx(r[1])-x0,24,'fill="url(#dots)"')+R(x0,y,lx(r[1])-x0,24,'class="ln" fill="none"')+T(lx(r[1])+8,y+16,'≈'+r[1].toLocaleString('en-US'),'start','m');});
    b+=L(x0,24,x0,200);
    put('p-magneto',W,H,b);
  })();

  /* 03 cantor */
  (function(){
    const W=420,H=300,cx=210,cy=150;let b='';
    const els=['Fe','Cr','Mn','Ni','Co'];
    // lattice
    const r=rng(7),s=16,cols=9,rows=7,ox=cx-s*(cols-1)/2,oy=cy-s*(rows-1)/2;
    for(let i=0;i<cols;i++)b+=L(ox+i*s,oy,ox+i*s,oy+s*(rows-1),'rl');
    for(let j=0;j<rows;j++)b+=L(ox,oy+j*s,ox+s*(cols-1),oy+j*s,'rl');
    const bag=[];for(let i=0;i<cols*rows;i++)bag.push(i%5);for(let i=bag.length-1;i>0;i--){const k=Math.floor(r()*(i+1));[bag[i],bag[k]]=[bag[k],bag[i]];}
    let n=0;for(let j=0;j<rows;j++)for(let i=0;i<cols;i++)b+=M(bag[n++],ox+i*s,oy+j*s,3.4);
    // pentagon labels
    els.forEach((e,k)=>{const a=-Math.PI/2+k*2*Math.PI/5,R0=128,x=cx+Math.cos(a)*R0*1.25,y=cy+Math.sin(a)*R0*.92;b+=M(k,x-16,y-4,4.5)+T(x-6,y,e,'start','big')+T(x-6,y+14,'20%','start','m');});
    put('p-cantor',W,H,b);
  })();



  /* 06 glass */
  (function(){
    const W=420,H=250;let b='';const r=rng(31);
    // crystal
    for(let j=0;j<8;j++)for(let i=0;i<9;i++)b+=C(28+i*18,30+j*22,4.2);
    // glass: dart throwing with 5 sizes
    const sizes=[6.2,5,4.4,3.6,2.4];const pts=[];
    let tries=0;while(pts.length<120&&tries<6000){tries++;const k=Math.floor(r()*5),rr=sizes[k],x=240+rr+r()*(160-2*rr),y=22+rr+r()*(176-2*rr);if(pts.every(p=>Math.hypot(p[0]-x,p[1]-y)>p[2]+rr+1.2))pts.push([x,y,rr,k]);}
    pts.forEach(p=>{b+= (p[3]%2? C(p[0],p[1],p[2]-.6,'hol',1.2):C(p[0],p[1],p[2]));});
    b+=L(210,20,210,206,'rl');
    b+=T(100,232,'crystal: one repeating cell','middle','m')+T(320,232,'glass: Zr Ti Cu Ni Be, no order','middle','m');
    put('p-glass',W,H,b);
  })();

  /* 07 composition */
  (function(){
    const W=1000,H=330,x0=70,x1=960,y0=250,y1=70,lo=48,hi=56;let b='';
    const X=a=>x0+(x1-x0)*(a-lo)/(hi-lo);
    const at=w=>{const n=w/58.693,t=(100-w)/47.867;return 100*n/(n+t)};
    // band
    b+=R(X(at(54.5)),y1,X(at(57))-X(at(54.5)),y0-y1,'fill="url(#hatch)"','');
    b+=T(X(at(57))+8,y1+34,'industry range,','start','m')+T(X(at(57))+8,y1+48,'binary nitinol','start','m');
    for(let a=48;a<=56;a++){b+=L(X(a),y0,X(a),y0+6)+T(X(a),y0+22,a.toFixed(0),'middle');}
    b+=L(x0,y0,x1,y0)+T((x0+x1)/2,y0+44,'nickel, atomic %','middle','m');
    // top axis weight
    b+=L(x0,y1-34,x1,y1-34,'rl');
    for(let w=53;w<=60;w++){const x=X(at(w));if(x<x0||x>x1)continue;b+=L(x,y1-38,x,y1-30)+T(x,y1-44,w+' wt%','middle','m');}
    // room temp
    const yr=y0-(y0-y1)*.45;b+=L(x0,yr,x1,yr,'mu',1,'3 4')+T(x0+4,yr-6,'room temperature','start','m');
    // conceptual curve
    let d='';for(let i=0;i<=160;i++){const a=48+i*(51.6-48)/160;const v=.85-.95*sig((a-50.55)*4.2);d+=(i?'L':'M')+X(a).toFixed(1)+' '+(y0-(y0-y1)*v).toFixed(1);}
    b+=P(d,'ln',2.2);
    b+=T(X(48.2),y0-(y0-y1)*.88,'transforms warmer','start','m')+T(X(52.1),y0-(y0-y1)*.2,'transforms colder','start','m');
    // markers
    [[55,'55-Nitinol: memory effect'],[60,'60-Nitinol']].forEach(m=>{const x=X(at(m[0]));if(x>x1)return;b+=L(x,y1-30,x,y0,'ln',1.6)+C(x,y1-30,5)+'<rect x="'+(x+4)+'" y="'+(y1+2)+'" width="'+(m[1].length*6.8+8)+'" height="17" class="pap"/>'+T(x+8,y1+14,m[1],'start');});
    // screening ticks
    const r=rng(3);for(let i=0;i<34;i++){const a=48.4+r()*7.2;b+=L(X(a),y0-4,X(a),y0-14,'mu',1);}
    put('p-comp',W,H,b);
  })();

  /* 08 network */
  (function(){
    const W=1000,H=540;let b='';
    const N={
      ros:[110,100,'Roswell, 1947','alleged debris',1],
      wp:[380,100,'Wright-Patterson','AFRL · NASIC',0],
      bat:[640,100,'Battelle','Columbus, Ohio',0],
      nol:[880,100,'Naval Ordnance Lab','Nitinol 1959–62',0],
      nasa:[850,230,'NASA','Nitinol studies',0],
      roc:[110,230,'Rocketdyne','Mondaloy',0],
      leg:[470,280,'Legacy program','as alleged',1],
      sk:[160,390,'Skunk Works','and contractors',0],
      big:[690,210,'Bigelow (BAASS)','AAWSAP contractor',0],
      dia:[860,330,'DIA','AAWSAP / AATIP',0],
      dhs:[860,480,'DHS','Kona Blue',0],
      aaro:[470,480,'AARO','2022 onward',0],
      orn:[200,490,'Oak Ridge','ORNL',0]
    };
    const E=[
      ['ros','wp',1,'debris (claimed)'],
      ['wp','bat',0,'Ti contract, 1940s'],
      ['bat','nol',1,'Nitinol theory'],
      ['bat','nasa',0,'Nitinol work, 1968–72'],
      ['wp','roc',0,'AFRL co-develops Mondaloy'],
      ['leg','wp',1,''],
      ['leg','sk',1,'contractor custody (Grusch)'],
      ['dia','dhs',0,'Kona Blue proposal, 2011'],
      ['dia','big',0,''],
      ['big','leg',1,'alloys stored (disputed)'],
      ['dhs','leg',1,'expected transfer'],
      ['aaro','orn',0,'fragment analysis'],
      ['aaro','dhs',0,'Kona Blue review'],
      ['aaro','leg',1,'access disputed']
    ];
    E.forEach(e=>{const a=N[e[0]],c=N[e[1]];b+=L(a[0],a[1],c[0],c[1],e[2]?'mu':'ln',e[2]?1.3:1.6,e[2]?'6 5':'');if(e[3]){const mx=(a[0]+c[0])/2,my=(a[1]+c[1])/2+(a[1]===c[1]?-36:0);b+='<rect x="'+(mx-e[3].length*3.4-4)+'" y="'+(my-9)+'" width="'+(e[3].length*6.8+8)+'" height="16" class="pap"/>'+T(mx,my+3,e[3],'middle',e[2]?'m':'');}});
    Object.values(N).forEach(n=>{const w=Math.max(n[2].length,n[3].length)*7.4+24;b+='<rect x="'+(n[0]-w/2)+'" y="'+(n[1]-22)+'" width="'+w+'" height="44" class="hol" stroke-width="'+(n[4]?1.2:1.6)+'"'+(n[4]?' stroke-dasharray="5 4"':'')+'/>'+T(n[0],n[1]-3,n[2],'middle')+T(n[0],n[1]+13,n[3],'middle','m');});
    put('p-network',W,H,b);
  })();

  /* 09 timeline */
  (function(){
    const W=1000,H=330,y=170,xa=40,xb=520,xc=560,xd=970;let b='';
    const XY=yr=>xa+(xb-xa)*(yr-2004)/(2026-2004); // 2004..2026 start
    const XM=m=>xc+(xd-xc)*(m-1)/(11-1);             // Jan..Nov 2026
    b+=L(xa,y,xb,y,'ln',1.6)+L(xc,y,xd,y,'ln',1.6);
    b+=L(xb+6,y-8,xb+14,y+8)+L(xb+16,y-8,xb+24,y+8);
    [2004,2008,2012,2016,2020,2024].forEach(v=>{b+=L(XY(v),y-4,XY(v),y+4)+T(XY(v),y+20,v,'middle','m');});
    ['Jan','Mar','May','Jul','Sep','Nov'].forEach((m,i)=>{const x=XM(1+i*2);b+=L(x,y-4,x,y+4)+T(x,y+20,m,'middle','m');});
    b+=T(xc,y+38,'2026, by month','start','m')+T(xa,y+38,'2004 to 2025, by year','start','m');
    const ev=[
      [XY(2004.9),'T','Tic Tac, Nimitz',-1,1],
      [XY(2011.6),'D','Kona Blue approved, then ended',1,1],
      [XY(2014.8),'T','Graves squadron sightings',-1,2],
      [XY(2015.05),'T','Gallaudet exercise',1,2],
      [XY(2022.5),'D','AARO created',-1,1],
      [XY(2023.55),'T','Grusch, Fravor, Graves hearing',1,1],
      [XY(2024.3),'D','Kona Blue files released',-1,3],
      [XY(2024.87),'T','Gallaudet hearing',1,3],
      [XY(2025.7),'T','Wiggins hearing',-1,2],
      [XM(2.6),'D','Disclosure directive',-1,1],
      [XM(5.2),'D','PURSUE first release',1,1],
      [XM(6.5),'D','Governance board',-1,2],
      [XM(9.4),'D','NDA waiver, 6th release',1,2],
      [XM(10.4),'T','New hearing sought',-1,3],
      [XM(10.3),'D','7th release, Haut affidavit',1,3]
    ];
    ev.forEach(e=>{const dir=e[3],lane=e[4];const yy=y+dir*(30+lane*30);const rt=e[0]>780;b+=L(e[0],y,e[0],yy,'rl')+G(e[1],e[0],y,5)+G(e[1],e[0],yy,4)+T(e[0]+(rt?-8:8),yy+4,e[2],rt?'end':'start');});
    put('p-timeline',W,H,b);
  })();

  /* 10 isotopes */
  (function(){
    const W=1000,H=230,x0=290,x1=960;let b='';
    const rows=[['Earth average','',[.79,.10,.11]],['Ubatuba Mg, Powell 2022','within terrestrial limits',[.79,.10,.11]],['Ubatuba Mg, Nolan piece','reported off-normal, values unpublished',null]];
    const fills=['class="inkf"','fill="url(#dots)"','fill="url(#hatch)"'];
    rows.forEach((r,i)=>{const y=30+i*56;b+=T(x0-14,y+14,r[0],'end')+(r[1]?T(x0-14,y+30,r[1],'end','m'):'');
      if(r[2]){let cx=x0;r[2].forEach((f,k)=>{const w=(x1-x0)*f;b+=R(cx,y,w,22,fills[k])+R(cx,y,w,22,'class="ln" fill="none"');if(i===0)b+=T(cx+4,y-6,['²⁴Mg ≈79%','²⁵Mg ≈10%','²⁶Mg ≈11%'][k],'start','m');cx+=w;});}
      else{b+=R(x0,y,x1-x0,22,'fill="url(#hatch)" opacity=".35"')+R(x0,y,x1-x0,22,'class="ln" fill="none" stroke-dasharray="5 4"')+'<rect x="'+((x0+x1)/2-90)+'" y="'+(y+3)+'" width="180" height="16" class="pap"/>'+T((x0+x1)/2,y+15,'no published values','middle');}
    });
    put('p-iso',W,H,b);
  })();

  /* 11 matrix */
  (function(){
    const rows=[
      ['Engineered alloys'],
      ['Nitinol',2,2,2,0],['Terfenol-D',3,2,1,0],['Cantor alloy',5,2,2,0],['Vitreloy',5,3,3,0],
      ['Alleged UAP samples'],
      ['Council Bluffs, 1977','3+',1,1,0],['Ubatuba Mg (Powell)',1,2,1,0],['Ubatuba Mg (Nolan piece)',1,2,1,1],['Ubatuba Si (Nolan)',1,2,1,1],['Mg-Zn-Bi (AARO / ORNL)',3,1,1,0]
    ];
    const W=1000,c0=250,cs=[340,540,710,880];let y=60,b='';
    ['Principal elements','Process control','Structural novelty','Isotope anomaly'].forEach((h,i)=>b+=T(cs[i],34,h.toUpperCase(),'middle','m'));
    b+=L(20,44,980,44);
    rows.forEach(r=>{
      if(r.length===1){y+=10;b+=T(20,y+8,r[0].toUpperCase(),'start');b+=L(20,y+16,980,y+16,'rl');y+=34;return;}
      b+=T(c0,y+4,r[0],'end');
      const n=typeof r[1]==='number'?r[1]:3;for(let k=0;k<5;k++)b+=k<n?C(cs[0]-36+k*18,y,5):C(cs[0]-36+k*18,y,2,'dot');
      if(r[1]==='3+')b+=T(cs[0]+56,y+4,'+ mix','start','m');
      [r[2],r[3]].forEach((v,j)=>{for(let k=0;k<3;k++)b+=R(cs[j+1]-27+k*20,y-6,12,12,k<v?'class="inkf"':'class="hol" stroke-width="1"');});
      const xi=cs[3];b+=r[4]===1?C(xi,y,6,'hol',1.4)+'<path d="M'+xi+' '+(y-6)+' A6 6 0 0 1 '+xi+' '+(y+6)+' Z" class="inkf"/>':C(xi,y,6,'hol',1.4);
      y+=30;});
    b+=T(980,y+10,'○ none claimed · ◐ claimed, unpublished','end','m');
    put('p-matrix',W,y+24,b);
  })();
})();
