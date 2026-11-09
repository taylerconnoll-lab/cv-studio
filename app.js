/* CV Studio: single-page CV builder. No build step, no backend. */
'use strict';

/* The CV sheet's own styles. Injected into the page and reused verbatim by the HTML export. */
const CV_CSS = `
.paper{width:794px;min-height:1123px;background:#fff;color:var(--cv-text);font-family:var(--cv-body),sans-serif;font-size:var(--cv-size);line-height:var(--cv-lh);display:flex;flex-direction:column;position:relative;box-shadow:0 2px 6px rgba(0,0,0,.18),0 12px 32px rgba(0,0,0,.18)}
.stage .paper{transform:scale(var(--s,1));transform-origin:0 0}
.paper h1,.paper h2{margin:0}
.paper [contenteditable]{outline:0;min-width:1ch}
.paper ul{margin:.25em 0 0;padding-left:1.15em}
.paper li{margin:.1em 0}
.paper p{margin:0 0 .5em}
.hd{padding:34px var(--cv-pad) 6px}
.hd .name{font-family:var(--cv-head),sans-serif;font-size:2.7em;line-height:1.1;font-weight:700;letter-spacing:.01em}
.hd .role{font-size:1.25em;color:var(--cv-accent);margin-top:4px}
.hd .contact{margin-top:8px;font-size:.92em;opacity:.85}
.paper[data-hdr="centre"] .hd{text-align:center}
.paper[data-hdr="banner"] .hd{background:var(--cv-accent);color:var(--cv-hd-text);padding:38px var(--cv-pad) 26px;margin-bottom:0}
.paper[data-hdr="banner"] .hd .role{color:var(--cv-hd-text);opacity:.92}
.cols{flex:1;display:grid;grid-template-columns:minmax(0,1fr)}
.paper[data-layout="left"] .cols{grid-template-columns:32% minmax(0,1fr)}
.paper[data-layout="right"] .cols{grid-template-columns:minmax(0,1fr) 32%}
.col{padding:18px var(--cv-pad) 30px;min-width:0}
.paper:not([data-layout="one"]) .col.main{padding-left:28px;padding-right:28px}
.paper:not([data-layout="one"]) .col.side{background:var(--cv-side);color:var(--cv-side-text);padding:22px 20px 30px}
.paper[data-layout="left"] .col.main{padding-right:var(--cv-pad)}
.paper[data-layout="right"] .col.main{padding-left:var(--cv-pad)}
.sec{position:relative;margin-bottom:var(--cv-gap)}
.sec-title{font-family:var(--cv-head),sans-serif;font-weight:700;color:var(--cv-accent);margin-bottom:7px}
.paper[data-hs="caps"] .sec-title{text-transform:uppercase;letter-spacing:.09em;font-size:.95em}
.paper[data-hs="rule"] .sec-title{text-transform:uppercase;letter-spacing:.08em;font-size:.95em;border-bottom:1.5px solid var(--cv-accent);padding-bottom:3px}
.paper[data-hs="bar"] .sec-title{border-left:4px solid var(--cv-accent);padding-left:9px;font-size:1.1em}
.paper[data-hs="plain"] .sec-title{font-size:1.3em}
.col.side .sec-title{color:var(--cv-side-text)}
.col.side .sec-title{border-color:var(--cv-side-text)}
.entry{margin-bottom:.75em}
.row{display:flex;justify-content:space-between;gap:12px;align-items:baseline}
.row .t{font-weight:700}
.row .d{white-space:nowrap;font-size:.9em;opacity:.75}
.sub{opacity:.85;font-style:italic}
.col.main .sec[data-kind="skills"] .sec-body ul{columns:2;column-gap:28px}
.paper[data-layout="one"] .sec[data-kind="certs"] .sec-body ul{columns:2;column-gap:28px}
`;
/* Styles for an imported PDF page, also reused verbatim by the HTML export. */
const PDF_CSS = `
.pdfwrap{width:794px}
.stage .pdfwrap{transform:scale(var(--s,1));transform-origin:0 0}
.pdfpage{position:relative;width:794px;background:#fff;margin:0 0 18px;box-shadow:0 2px 6px rgba(0,0,0,.18),0 12px 32px rgba(0,0,0,.18)}
.pdfpage .bg{position:absolute;left:0;top:0;width:100%;height:100%;display:block;user-select:none;pointer-events:none}
.tbw{position:absolute}
.tbx{white-space:nowrap;line-height:1;outline:0;position:relative;min-width:1ch;margin:0}
.cov{display:none;position:absolute}
.cov.on{display:block}
.tbw:not(.live) .tbx,.tbw:not(.live) .tbx *{color:transparent!important}
.shp{position:absolute;background:transparent;box-sizing:border-box}
.shp.live{background:var(--c)}
.shp.del{display:none}
.shp .sx{position:absolute;right:-9px;top:-9px;z-index:50;display:flex;gap:2px;align-items:center;font:12px sans-serif}
.shp .sx button{width:18px;height:18px;padding:0;border:0;border-radius:50%;background:#d93025;color:#fff;font:700 13px/18px sans-serif;cursor:pointer;box-shadow:0 1px 3px rgba(0,0,0,.4)}
.shp .sx input[type=color]{width:18px;height:18px;padding:0;border:2px solid #fff;border-radius:50%;box-shadow:0 1px 3px rgba(0,0,0,.4);cursor:pointer;background:none}
@media print{.sx{display:none!important}}
`;
for(const [id,css] of [['cvcss',CV_CSS],['pdfcss',PDF_CSS]]){const st=document.createElement('style');st.id=id;st.textContent=css;document.head.append(st)}

const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const uid=()=>Math.random().toString(36).slice(2,9);
const E=(t,d,s,bs)=>`<div class="entry"><div class="row"><b class="t">${t}</b><span class="d">${d}</span></div><div class="sub">${s}</div>${bs?UL(bs):''}</div>`;
const UL=a=>'<ul>'+a.map(x=>'<li>'+x+'</li>').join('')+'</ul>';
const P=t=>`<p>${t}</p>`;

/* mode: how "add" extends a section */
const KINDS={
  summary:{t:'Profile',m:'para',h:P("Operations leader with 10+ years' experience managing teams, suppliers and budgets across multi-site environments. Known for tightening processes, cutting costs and keeping standards high. Looking for a role where I can lead day-to-day delivery and improve how the business runs.")},
  experience:{t:'Work Experience',m:'entry',h:E('Operations Manager','Mar 2021 – Present','Northgate Facilities, London',['Led a team of 18 across three sites, keeping service levels above 98%','Renegotiated 12 supplier contracts, saving £140k a year','Introduced a planned maintenance schedule that cut call-outs by 30%'])+E('Site Supervisor','Jun 2017 – Feb 2021','Harbour &amp; Co, Bristol',['Ran daily operations and contractor visits for a 40,000 sq ft site','Led monthly health and safety audits with no major findings'])},
  education:{t:'Education',m:'entry',h:E('BA Business Management','2013 – 2016','University of Leeds',['2:1, dissertation on supply chain resilience'])+E('A Levels','2011 – 2013','Hillcrest College',null)},
  skills:{t:'Skills',m:'item',h:UL(['Budget &amp; P&amp;L control','Supplier &amp; contract management','Health, safety &amp; compliance','Team leadership','Process improvement','Stakeholder management'])},
  certs:{t:'Certifications',m:'item',h:UL(['IOSH Managing Safely (2023)','NEBOSH General Certificate (2022)','First Aid at Work (2024)'])},
  languages:{t:'Languages',m:'item',h:UL(['English (native)','Spanish (conversational)'])},
  interests:{t:'Interests',m:'item',h:UL(['Golf','Trail running','Volunteering at a local food bank'])},
  projects:{t:'Projects',m:'entry',h:E('Warehouse Relocation','2023','Project lead, Northgate Facilities',['Moved 4,000 pallets in one weekend with no lost stock'])},
  volunteering:{t:'Volunteering',m:'entry',h:E('Fundraising Organiser','2020 – Present','Local charity golf day',['Raised £12,000 across three events'])},
  research:{t:'Research Experience',m:'entry',h:E('Research Assistant','2019 – 2022','Department of Engineering, University of Leeds',['Collected and analysed field data for a three-year funded study'])},
  teaching:{t:'Teaching',m:'entry',h:E('Teaching Assistant, Operations Management','2020 – 2022','University of Leeds',['Ran weekly seminars for 40 students'])},
  publications:{t:'Publications',m:'item',h:UL(['Morgan, A. &amp; Ellis, J. (2022). Planned maintenance and reliability in multi-site estates. <i>Journal of Facilities Management</i>, 20(3), 211–230.'])},
  awards:{t:'Awards',m:'item',h:UL(['Employee of the Year, Northgate Facilities (2023)','Regional Safety Award (2022)'])},
  highlights:{t:'Career Highlights',m:'item',h:UL(['Cut annual maintenance spend by 18% without lowering service levels','Delivered a £2m refurbishment on time and on budget','Built a supplier scorecard now used across the group'])},
  golf:{t:'Golf &amp; Community',m:'item',h:UL(['Single-figure handicap golfer','Volunteer caddy at professional tour events','Organiser of charity golf fundraising days'])},
  references:{t:'References',m:'para',h:P('Available on request.')},
  custom:{t:'New Section',m:'para',h:P('Add your own text here.')}
};

/* secs: [kind, column (m=main, s=side), optional title] */
const PRESETS=[
 {id:'chrono',n:'Chronological',d:'Most recent job first. The standard choice.',layout:'one',hdr:'classic',hs:'rule',accent:'#1f4f82',
  secs:[['summary','m'],['experience','m'],['education','m'],['skills','m'],['certs','m']]},
 {id:'modern',n:'Modern sidebar',d:'Skills and details in a side column.',layout:'left',hdr:'classic',hs:'caps',accent:'#0f6b5e',side:'#eef3f2',
  secs:[['summary','m'],['experience','m'],['education','m'],['skills','s'],['languages','s'],['certs','s'],['interests','s']]},
 {id:'functional',n:'Functional',d:'Skills first, for gaps or a change of field.',layout:'one',hdr:'classic',hs:'bar',accent:'#7a1f3d',
  secs:[['summary','m'],['skills','m','Key Skills'],['highlights','m','Selected Achievements'],['experience','m','Employment History'],['education','m']]},
 {id:'combo',n:'Combination',d:'Skills summary, then dated experience.',layout:'one',hdr:'centre',hs:'rule',accent:'#2d6a2f',
  secs:[['summary','m'],['skills','m','Core Competencies'],['experience','m'],['education','m'],['certs','m']]},
 {id:'academic',n:'Academic',d:'Research, publications and teaching.',layout:'one',hdr:'centre',hs:'plain',accent:'#1c1c1c',font:'Source Serif 4',
  secs:[['education','m'],['research','m'],['publications','m'],['teaching','m'],['awards','m'],['references','m']]},
 {id:'exec',n:'Executive',d:'Leadership impact up front.',layout:'one',hdr:'banner',hs:'caps',accent:'#1f2a37',
  secs:[['summary','m','Executive Profile'],['highlights','m','Leadership Highlights'],['experience','m'],['education','m'],['awards','m','Boards &amp; Recognition']]},
 {id:'grad',n:'Graduate',d:'Education, projects and potential.',layout:'left',hdr:'classic',hs:'bar',accent:'#4a3a8c',side:'#efedf7',
  secs:[['summary','m','Personal Statement'],['education','m'],['projects','m'],['volunteering','m'],['skills','s'],['languages','s'],['interests','s']]},
 {id:'creative',n:'Creative',d:'Bold header, work samples first.',layout:'right',hdr:'banner',hs:'plain',accent:'#b4551d',side:'#f6efe9',font:'Raleway',
  secs:[['summary','m'],['projects','m','Selected Work'],['experience','m'],['skills','s'],['awards','s'],['interests','s']]},
 {id:'tech',n:'Technical / IT',d:'Skills and projects near the top.',layout:'one',hdr:'classic',hs:'rule',accent:'#0b7285',
  secs:[['summary','m'],['skills','m','Technical Skills'],['experience','m'],['projects','m'],['education','m'],['certs','m']]},
 {id:'change',n:'Career change',d:'Transferable skills over job titles.',layout:'one',hdr:'classic',hs:'caps',accent:'#a8321f',
  secs:[['summary','m','Career Objective'],['skills','m','Transferable Skills'],['highlights','m'],['experience','m'],['education','m'],['certs','m']]},
 {id:'hospitality',n:'Hospitality & F&B',d:'Venues, teams and guest experience.',layout:'left',hdr:'classic',hs:'caps',accent:'#8a6d1d',side:'#f3f0e6',
  secs:[['summary','m'],['experience','m'],['education','m'],['skills','s','Core Expertise'],['certs','s','Licences &amp; Training'],['languages','s']]},
 {id:'golf',n:'Golf industry',d:'Playing record and club operations.',layout:'right',hdr:'classic',hs:'rule',accent:'#2d6a2f',side:'#edf3ec',
  secs:[['summary','m'],['experience','m'],['education','m'],['golf','s'],['skills','s'],['certs','s']]},
 {id:'fm',n:'Facilities management',d:'Compliance, contractors and budgets.',layout:'one',hdr:'classic',hs:'rule',accent:'#1f4f82',
  secs:[['summary','m'],['skills','m','Core Expertise'],['experience','m'],['certs','m','Compliance &amp; Qualifications'],['education','m']]},
 {id:'gov',n:'Government / public sector',d:'Detailed roles, clear dates, references.',layout:'one',hdr:'classic',hs:'plain',accent:'#1c1c1c',font:'Arial',
  secs:[['summary','m','Objective'],['experience','m'],['education','m'],['certs','m','Training &amp; Certifications'],['references','m']]}
];

const FONTS=['Lato','Open Sans','Roboto','Montserrat','Raleway','Oswald','Merriweather','Playfair Display','Source Serif 4','Libre Baskerville','EB Garamond','Georgia','Arial','Times New Roman'];
const ACCENTS=['#1f4f82','#0f6b5e','#7a1f3d','#b4551d','#4a3a8c','#1f2a37','#2d6a2f','#a8321f','#0b7285','#8a6d1d'];
const SIDES=['#f1f3f6','#eef3f2','#efedf7','#f6efe9','#e4ecf5','#1f2a37','#16423c','#2a2140'];
const TEXTS=['#1f2328','#000000','#2b3a4a','#3a3a3a'];
const SIZES=[8,9,10,11,12,13,14,16,18,20,24,28,32,40];
const KEY='cvstudio:v1';
let S;
const paper=$('#paper'), stage=$('#stage'), pdfwrap=$('#pdfwrap');
const secById=id=>S.sections.find(s=>s.id===id);
const stack=n=>{const serif=['Merriweather','Playfair Display','Source Serif 4','Libre Baskerville','EB Garamond','Georgia','Times New Roman'].includes(n);return `'${n}', ${serif?'Georgia, serif':'Arial, sans-serif'}`};
const lum=h=>{const n=parseInt(h.slice(1),16);return (.299*(n>>16&255)+.587*(n>>8&255)+.114*(n&255))/255};

function makeSec(kind,col,title){const k=KINDS[kind];return {id:uid(),kind,title:title||k.t,col:col||'m',html:k.h,te:false}}

function applyPreset(p){
  const used=new Set(), next=[];
  p.secs.forEach(([kind,col,title])=>{
    let s=S.sections.find(x=>x.kind===kind&&!used.has(x.id));
    if(!s&&S.pool[kind]){s=S.pool[kind];delete S.pool[kind]}
    if(!s)s=makeSec(kind,col,title);
    s.col=col; if(!s.te)s.title=title||KINDS[kind].t;
    used.add(s.id); next.push(s);
  });
  S.sections.forEach(s=>{if(!used.has(s.id)&&s.kind!=='custom'&&!S.pool[s.kind])S.pool[s.kind]=s});
  S.sections=next; S.type=p.id; S.layout=p.layout; S.hdr=p.hdr; S.hs=p.hs; S.accent=p.accent;
  if(p.side)S.side=p.side;
  if(p.font){S.head=p.font;S.body=p.font}
}

function fresh(){
  S={type:'chrono',layout:'one',hdr:'classic',hs:'rule',accent:'#1f4f82',side:'#f1f3f6',text:'#1f2328',head:'Lato',body:'Lato',size:10.5,lh:1.45,gap:16,pad:40,
     header:{name:'Alex Morgan',role:'Operations Manager',contact:'London, UK &nbsp;|&nbsp; 07700 900123 &nbsp;|&nbsp; alex.morgan@example.com'},sections:[],pool:{}};
  applyPreset(PRESETS[0]);
}
function load(){try{const j=JSON.parse(localStorage.getItem(KEY));if(j&&Array.isArray(j.sections)&&j.header)return j}catch(e){}return null}
function save(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}
let st;const saveSoon=()=>{clearTimeout(st);st=setTimeout(save,400)};

function applyVars(){
  const s=paper.style;
  s.setProperty('--cv-accent',S.accent); s.setProperty('--cv-text',S.text); s.setProperty('--cv-side',S.side);
  s.setProperty('--cv-side-text',lum(S.side)<.5?'#ffffff':S.text);
  s.setProperty('--cv-hd-text',lum(S.accent)<.6?'#ffffff':'#111111');
  s.setProperty('--cv-head',stack(S.head)); s.setProperty('--cv-body',stack(S.body));
  s.setProperty('--cv-size',S.size+'pt'); s.setProperty('--cv-lh',S.lh); s.setProperty('--cv-gap',S.gap+'px'); s.setProperty('--cv-pad',S.pad+'px');
  paper.dataset.layout=S.layout; paper.dataset.hdr=S.hdr; paper.dataset.hs=S.hs;
}

function secHTML(s){
  const side=S.layout!=='one';
  return `<section class="sec" data-id="${s.id}" data-kind="${s.kind}">
<div class="sec-ctl no-export" contenteditable="false">
<button class="hdl" draggable="true" title="Drag to move" aria-label="Drag to move section">⠿</button>
<button data-act="up" title="Move up" aria-label="Move up">↑</button>
<button data-act="down" title="Move down" aria-label="Move down">↓</button>
${side?'<button data-act="swap" title="Move to other column" aria-label="Move to other column">⇄</button>':''}
<button data-act="add" title="Add an entry" aria-label="Add an entry">+</button>
<button data-act="del" title="Remove section" aria-label="Remove section">×</button></div>
<h2 class="sec-title" contenteditable="true" data-st spellcheck="false">${s.title}</h2>
<div class="sec-body" contenteditable="true" data-sb>${s.html}</div></section>`;
}
function setMode(){
  const p=S.mode==='pdf';document.body.dataset.mode=p?'pdf':'tpl';
  paper.hidden=p;$('#guides').hidden=p;pdfwrap.hidden=!p;
  const act=$('.tabs [aria-selected="true"]').dataset.tab;
  ['type','style','sec'].forEach(t=>{$('#p-'+t).hidden=p||t!==act});
  $('#p-pdf').hidden=!p;$('.tabs').hidden=p;if(p)$('#pdfname').textContent=S.pdf.name+'.pdf';
}
function render(){
  setMode();if(S.mode==='pdf'){renderPdf();return}
  applyVars();
  const H=S.header;
  const hd=`<header class="hd"><div class="name" contenteditable="true" data-f="name">${H.name}</div><div class="role" contenteditable="true" data-f="role">${H.role}</div><div class="contact" contenteditable="true" data-f="contact">${H.contact}</div></header>`;
  const col=(c,cls)=>`<div class="col ${cls}" data-col="${c}">${S.sections.filter(s=>S.layout==='one'||s.col===c).map(secHTML).join('')}</div>`;
  const cols=S.layout==='one'?col('m','main'):S.layout==='left'?col('s','side')+col('m','main'):col('m','main')+col('s','side');
  paper.innerHTML=hd+`<div class="cols">${cols}</div>`;
  fit(); syncPanel(); saveSoon();
}

function fit(){
  const c=$('.canvas'),cs=getComputedStyle(c);
  const w=c.clientWidth-parseFloat(cs.paddingLeft)-parseFloat(cs.paddingRight)-(window.innerWidth>900?40:0);
  const s=Math.min(1,Math.max(.3,w/794));
  stage.style.setProperty('--s',s);
  if(S.mode==='pdf'){stage.style.height=Math.ceil(pdfwrap.offsetHeight*s)+'px';$('#guides').innerHTML='';return}
  stage.style.height=Math.ceil(paper.offsetHeight*s)+'px';
  const g=$('#guides'); g.innerHTML='';
  const h=paper.offsetHeight;
  for(let k=1;k*1123<h-4;k++){const i=document.createElement('i');i.style.top=(k*1123*s)+'px';g.append(i)}
}

/* ---------- editing on the sheet ---------- */
function syncEl(el){
  if(el.classList&&el.classList.contains('tbx')){const w=el.closest('.tbw'),b=allBoxes().find(x=>x.id===w.dataset.id);if(b){b.html=el.innerHTML;setLive(b.id,b.o==null||b.html!==b.o||b.x!==b.ox||b.y!==b.oy)}saveSoon();return}
  if(el.dataset.f){S.header[el.dataset.f]=el.innerHTML}
  else{const sec=el.closest('.sec'),s=sec&&secById(sec.dataset.id);if(!s)return;
    if(el.hasAttribute('data-st')){s.title=el.innerHTML;s.te=true}else s.html=el.innerHTML}
  saveSoon(); requestAnimationFrame(fit);
}
paper.addEventListener('input',e=>{const el=e.target.closest('[data-f],[data-st],[data-sb]');if(el)syncEl(el)});
paper.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.closest('[data-st]'))e.preventDefault()});
paper.addEventListener('paste',e=>{
  const el=e.target.closest('[contenteditable="true"]');if(!el)return;
  e.preventDefault();const t=(e.clipboardData||window.clipboardData).getData('text/plain');
  document.execCommand('insertText',false,t);
});

function move(id,dir){
  const a=S.sections,i=a.findIndex(s=>s.id===id);if(i<0)return;
  const col=S.layout==='one'?null:a[i].col;let j=i+dir;
  while(j>=0&&j<a.length&&col!==null&&a[j].col!==col)j+=dir;
  if(j<0||j>=a.length)return;[a[i],a[j]]=[a[j],a[i]];render();
}
function addEntry(id){
  const s=secById(id),m=KINDS[s.kind].m,d=document.createElement('div');d.innerHTML=s.html;
  if(m==='entry')d.insertAdjacentHTML('beforeend',E('Role or title','Year – Year','Organisation, Location',['Describe what you did and the result']));
  else if(m==='item'){let ul=d.querySelector('ul');if(!ul){ul=document.createElement('ul');d.append(ul)}ul.insertAdjacentHTML('beforeend','<li>New item</li>')}
  else d.insertAdjacentHTML('beforeend','<p>New paragraph</p>');
  s.html=d.innerHTML;render();
}
function removeSec(id){
  const i=S.sections.findIndex(s=>s.id===id);if(i<0)return;
  const [s]=S.sections.splice(i,1);if(s.kind!=='custom')S.pool[s.kind]=s;render();
}
function act(a,id){
  if(a==='up')move(id,-1);else if(a==='down')move(id,1);
  else if(a==='swap'){const s=secById(id);s.col=s.col==='m'?'s':'m';S.sections=S.sections.filter(x=>x!==s).concat(s);render()}
  else if(a==='add')addEntry(id);else if(a==='del')removeSec(id);
}
paper.addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(b)act(b.dataset.act,b.closest('.sec').dataset.id)});

/* drag a section between and within columns */
let dragId=null,dropRef=undefined;
const clearLine=()=>$$('.drop-line',paper).forEach(n=>n.remove());
paper.addEventListener('dragstart',e=>{
  const h=e.target.closest('.hdl');if(!h)return;
  const sec=h.closest('.sec');dragId=sec.dataset.id;
  e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',dragId);
  try{e.dataTransfer.setDragImage(sec,24,12)}catch(_){}
  setTimeout(()=>sec.classList.add('dragging'),0);
});
paper.addEventListener('dragover',e=>{
  if(!dragId)return;const col=e.target.closest('.col');if(!col)return;e.preventDefault();
  const secs=$$('.sec:not(.dragging)',col);let ref=null;
  for(const s of secs){const r=s.getBoundingClientRect();if(e.clientY<r.top+r.height/2){ref=s;break}}
  const key=col.dataset.col+':'+(ref?ref.dataset.id:'end');if(key===dropRef)return;dropRef=key;
  clearLine();const line=document.createElement('div');line.className='drop-line no-export';
  ref?col.insertBefore(line,ref):col.append(line);
});
paper.addEventListener('drop',e=>{
  if(!dragId)return;const col=e.target.closest('.col');if(!col)return;e.preventDefault();
  const line=$('.drop-line',paper);const nxt=line&&line.nextElementSibling;
  const refId=nxt&&nxt.classList.contains('sec')?nxt.dataset.id:null;
  const s=secById(dragId);const arr=S.sections.filter(x=>x!==s);
  s.col=S.layout==='one'?s.col:col.dataset.col;
  let idx=refId?arr.findIndex(x=>x.id===refId):-1;
  if(idx<0){let last=-1;arr.forEach((x,i)=>{if(S.layout==='one'||x.col===s.col)last=i});idx=last+1}
  arr.splice(idx,0,s);S.sections=arr;dragId=null;dropRef=undefined;render();
});
paper.addEventListener('dragend',()=>{dragId=null;dropRef=undefined;clearLine();$$('.dragging',paper).forEach(n=>n.classList.remove('dragging'))});

/* ---------- side panel ---------- */
function press(root,val){$$('button',root).forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.v===val)))}
function swatches(el,list,key){
  el.innerHTML='';
  list.forEach(c=>{const b=document.createElement('button');b.style.background=c;b.dataset.c=c;b.title=c;b.setAttribute('aria-label','Colour '+c);
    b.onclick=()=>{S[key]=c;applyVars();syncPanel();saveSoon()};el.append(b)});
  const i=document.createElement('input');i.type='color';i.setAttribute('aria-label','Custom colour');i.value=S[key];
  i.oninput=()=>{S[key]=i.value;applyVars();syncPanel(true);saveSoon()};el.append(i);
}
function syncPanel(keepColor){
  $$('.type',$('#types')).forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.id===S.type)));
  press($('#s-layout'),S.layout);press($('#s-hdr'),S.hdr);press($('#s-hs'),S.hs);
  [['#sw-accent','accent'],['#sw-side','side'],['#sw-text','text']].forEach(([sel,key])=>{
    const el=$(sel);$$('button',el).forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.c.toLowerCase()===S[key].toLowerCase())));
    const i=$('input',el);if(i&&!keepColor)i.value=S[key]});
  $('#f-head').value=S.head;$('#f-body').value=S.body;
  [['size',' pt'],['lh',''],['gap',' px'],['pad',' px']].forEach(([k,u])=>{$('#r-'+k).value=S[k];$('#o-'+k).textContent=S[k]+u});
  const nm=s=>s.title.replace(/<[^>]*>/g,'').replace(/&amp;/g,'&')||'Untitled';
  $('#seclist').innerHTML=S.sections.map(s=>`<div class="secrow" data-id="${s.id}"><div class="n">${nm(s)}${S.layout!=='one'?`<em>${s.col==='s'?'side':'main'}</em>`:''}</div><div class="mini"><button data-act="up" aria-label="Move up">↑</button><button data-act="down" aria-label="Move down">↓</button>${S.layout!=='one'?'<button data-act="swap" aria-label="Move to other column">⇄</button>':''}<button data-act="del" aria-label="Remove">×</button></div></div>`).join('');
  const rem=Object.keys(S.pool);$('#removedwrap').hidden=!rem.length;
  $('#removed').innerHTML=rem.map(k=>`<button class="chip" data-restore="${k}">${S.pool[k].title.replace(/<[^>]*>/g,'')}</button>`).join('');
}
function buildPanel(){
  $('#types').innerHTML=PRESETS.map(p=>`<button class="type" data-id="${p.id}" aria-pressed="false"><b>${p.n.replace('&','&amp;')}</b><span>${p.d}</span></button>`).join('');
  $('#addlist').innerHTML=Object.keys(KINDS).map(k=>`<button class="chip" data-add="${k}">+ ${KINDS[k].t.replace(/<[^>]*>/g,'').replace(/&amp;/g,'&')}</button>`).join('');
  swatches($('#sw-accent'),ACCENTS,'accent');swatches($('#sw-side'),SIDES,'side');swatches($('#sw-text'),TEXTS,'text');
  ['#f-head','#f-body'].forEach(s=>{$(s).innerHTML=FONTS.map(f=>`<option>${f}</option>`).join('')});
  $('#fFont').insertAdjacentHTML('beforeend',FONTS.map(f=>`<option>${f}</option>`).join(''));
  $('#fSize').insertAdjacentHTML('beforeend',SIZES.map(n=>`<option value="${n}">${n}</option>`).join(''));
}
$('#types').addEventListener('click',e=>{const b=e.target.closest('.type');if(!b)return;applyPreset(PRESETS.find(p=>p.id===b.dataset.id));render()});
[['#s-layout','layout'],['#s-hdr','hdr'],['#s-hs','hs']].forEach(([sel,k])=>$(sel).addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;S[k]=b.dataset.v;render()}));
$('#f-head').onchange=e=>{S.head=e.target.value;applyVars();fit();saveSoon()};
$('#f-body').onchange=e=>{S.body=e.target.value;applyVars();fit();saveSoon()};
['size','lh','gap','pad'].forEach(k=>$('#r-'+k).addEventListener('input',e=>{S[k]=parseFloat(e.target.value);applyVars();syncPanel(true);fit();saveSoon()}));
$('#seclist').addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(b)act(b.dataset.act,b.closest('.secrow').dataset.id)});
$('#addlist').addEventListener('click',e=>{const b=e.target.closest('[data-add]');if(!b)return;S.sections.push(makeSec(b.dataset.add,'m'));render()});
$('#removed').addEventListener('click',e=>{const b=e.target.closest('[data-restore]');if(!b)return;const s=S.pool[b.dataset.restore];delete S.pool[b.dataset.restore];S.sections.push(s);render()});
$$('.tabs button').forEach(b=>b.onclick=()=>{
  $$('.tabs button').forEach(x=>x.setAttribute('aria-selected',String(x===b)));
  ['type','style','sec'].forEach(t=>$('#p-'+t).hidden=(t!==b.dataset.tab));
});
/* ---------- formatting toolbar ---------- */
let saved=null;
const hostOf=n=>(n&&(n.nodeType===1?n:n.parentElement)||null)?.closest('[contenteditable="true"]');
document.addEventListener('selectionchange',()=>{
  const sel=getSelection();if(!sel.rangeCount)return;
  const r=sel.getRangeAt(0),h=hostOf(r.commonAncestorContainer);
  if(h&&(paper.contains(h)||pdfwrap.contains(h)))saved=r.cloneRange();
});
function withSel(fn,expand=true){
  if(!saved){toast('Click in the text you want to change first.');return}
  const host=hostOf(saved.commonAncestorContainer);if(!host)return;
  host.focus();const sel=getSelection();sel.removeAllRanges();
  const r=saved.cloneRange();if(expand&&r.collapsed)r.selectNodeContents(host);
  sel.addRange(r);document.execCommand('styleWithCSS',false,true);
  fn();
  const h=hostOf(getSelection().anchorNode)||host;syncEl(h);
  if(getSelection().rangeCount)saved=getSelection().getRangeAt(0).cloneRange();
}
$('#tb').addEventListener('mousedown',e=>{if(e.target.closest('button'))e.preventDefault()});
$('#tb').addEventListener('click',e=>{
  const b=e.target.closest('[data-cmd]');if(!b)return;
  const c=b.dataset.cmd,keep=['insertUnorderedList','justifyLeft','justifyCenter','justifyRight','undo','redo'].includes(c);
  withSel(()=>document.execCommand(c,false,null),!keep);
});
$('#fFont').onchange=e=>{const v=e.target.value;if(v)withSel(()=>document.execCommand('fontName',false,v));e.target.value=''};
$('#fSize').onchange=e=>{
  const px=parseInt(e.target.value,10);e.target.value='';if(!px)return;
  withSel(()=>{
    document.execCommand('fontSize',false,'7');
    $$('font[size="7"],span[style*="xxx-large"]').forEach(f=>{
      const sp=document.createElement('span');sp.style.fontSize=px+'px';
      while(f.firstChild)sp.append(f.firstChild);
      $$('[style*="font-size"]',sp).forEach(x=>x.style.fontSize='');f.replaceWith(sp);
    });
  });
};
$('#fColor').addEventListener('change',e=>withSel(()=>document.execCommand('foreColor',false,e.target.value)));

/* ---------- saving ---------- */
function toast(m,ms=3200){const t=$('#toast');t.textContent=m;t.hidden=false;clearTimeout(toast.t);toast.t=setTimeout(()=>{t.hidden=true},ms)}

const MIME={pdf:'application/pdf',html:'text/html;charset=utf-8',json:'application/json;charset=utf-8'};
/* Normal browser download: Blob + temporary <a download>. Works in any modern browser. */
function dlSave(filename,data){
  try{
    const ext=filename.split('.').pop().toLowerCase();
    const blob=data instanceof Blob?data:new Blob([data],{type:MIME[ext]||'application/octet-stream'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url;a.download=filename;a.rel='noopener';a.style.display='none';
    document.body.append(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),30000);
    return true;
  }catch(e){toast('Could not save: '+((e&&e.message)||'unknown error'));return false}
}
const plain=h=>{const d=document.createElement('div');d.innerHTML=h;return d.textContent.trim()};
const fname=()=>S.mode==='pdf'?(S.pdf.name.replace(/[^\w\- ]+/g,'').trim().replace(/\s+/g,'_')||'CV')+'_edited':(plain(S.header.name).replace(/[^\w\- ]+/g,'').trim().replace(/\s+/g,'_')||'CV')+'_CV';

/* CDN libraries: if the primary CDN failed, try a second one before giving up. */
const LIB_FALLBACKS={
  html2canvas:'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js',
  jspdf:'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js'
};
const loadScript=src=>new Promise((res,rej)=>{const s=document.createElement('script');s.src=src;s.onload=res;s.onerror=()=>rej(new Error('failed to load '+src));document.head.append(s)});
async function ensureLibs(){
  if(!window.html2canvas)await loadScript(LIB_FALLBACKS.html2canvas);
  if(!window.jspdf)await loadScript(LIB_FALLBACKS.jspdf);
  if(!window.html2canvas||!window.jspdf)throw new Error('PDF tools did not load');
}
/* Last resort when the PDF libraries are unreachable: print the clean CV (browser's own Save as PDF). */
function printFallback(){
  const f=document.createElement('iframe');
  f.style.cssText='position:fixed;right:0;bottom:0;width:0;height:0;border:0';
  f.srcdoc=buildHTML();
  f.onload=()=>{setTimeout(()=>{try{f.contentWindow.focus();f.contentWindow.print()}catch(e){toast('Please use Save as HTML, then print that file.')}},400);setTimeout(()=>f.remove(),60000)};
  document.body.append(f);
}

async function exportPDF(){
  const btn=$('#b-pdf');btn.disabled=true;btn.textContent='Preparing PDF…';
  try{
    try{await ensureLibs()}
    catch(e){toast('PDF tools could not load, so opening the print dialog instead. Choose Save as PDF there.',6000);printFallback();return}
    if(S.mode==='pdf'){const d=await pdfModePDF();if(dlSave(fname()+'.pdf',d))toast('PDF saved.');return}
    if(document.fonts&&document.fonts.ready)await document.fonts.ready;if(document.activeElement)document.activeElement.blur();
    paper.style.transform='none';paper.style.boxShadow='none';
    const canvas=await html2canvas(paper,{scale:2,backgroundColor:'#ffffff',useCORS:true,ignoreElements:el=>el.classList&&el.classList.contains('no-export')});
    paper.style.transform='';paper.style.boxShadow='';
    const W=canvas.width,ph=Math.round(W*297/210),pages=Math.max(1,Math.ceil((canvas.height-4)/ph));
    const pdf=new window.jspdf.jsPDF({unit:'pt',format:'a4',orientation:'p'});
    const pw=pdf.internal.pageSize.getWidth(),pgh=pdf.internal.pageSize.getHeight();
    for(let i=0;i<pages;i++){
      const c=document.createElement('canvas');c.width=W;c.height=ph;const x=c.getContext('2d');
      x.fillStyle='#fff';x.fillRect(0,0,W,ph);const h=Math.min(ph,canvas.height-i*ph);
      x.drawImage(canvas,0,i*ph,W,h,0,0,W,h);if(i)pdf.addPage();
      pdf.addImage(c.toDataURL('image/jpeg',.92),'JPEG',0,0,pw,pgh);
    }
    if(dlSave(fname()+'.pdf',pdf.output('arraybuffer')))toast('PDF ready. It is a picture of the page, so see the note below the sheet for text-based PDFs.',5000);
  }catch(e){toast('Could not make the PDF: '+(e.message||e))}
  finally{pdfwrap.style.transform='';paper.style.transform='';paper.style.boxShadow='';btn.disabled=false;btn.textContent='Save as PDF';fit()}
}
function buildHTML(){
  if(S.mode==='pdf')return buildPdfHTML();
  const c=paper.cloneNode(true);
  $$('.no-export',c).forEach(n=>n.remove());$$('[contenteditable]',c).forEach(n=>n.removeAttribute('contenteditable'));
  c.style.removeProperty('transform');
  const fonts=$('#gfonts').href;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${plain(S.header.name)||'CV'}</title><link rel="stylesheet" href="${fonts}"><style>${CV_CSS}
*{-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{margin:0;background:#e4e7ec;display:flex;flex-direction:column;align-items:center;padding:24px 0;font-family:sans-serif}
.np{margin-bottom:16px;padding:9px 16px;font:14px sans-serif;cursor:pointer}
@page{size:A4;margin:0}
@media print{body{background:#fff;padding:0}.np{display:none}.paper{box-shadow:none!important}}
</style></head><body><button class="np" onclick="window.print()">Print or save as PDF</button>${c.outerHTML}</body></html>`;
}
$('#b-pdf').onclick=exportPDF;
$('#b-html').onclick=()=>{if(dlSave(fname()+'.html',buildHTML()))toast('Saved. Open the file and choose Print, then Save as PDF for text that applications can read.',5000)};
$('#b-json').onclick=()=>{save();if(dlSave(fname()+'_draft.json',JSON.stringify(S,null,1)))toast('Draft saved.')};
$('#b-open').onclick=()=>$('#f-open').click();
$('#f-open').onchange=async e=>{
  const f=e.target.files[0];e.target.value='';if(!f)return;
  try{const j=JSON.parse(await f.text());
    if(!Array.isArray(j.sections)||!j.header)throw new Error('not a CV Studio draft');
    fresh();S=Object.assign(S,j);S.pool=j.pool||{};render();toast('Draft opened.');
  }catch(err){toast('That file is not a CV Studio draft.')}
};

/* ---------- import an existing PDF and edit it in place ---------- */
const esc=t=>t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const hex=(r,g,b)=>'#'+[r,g,b].map(v=>v.toString(16).padStart(2,'0')).join('');
let pdfjsReady;
function ensurePdfjs(){
  if(window.pdfjsLib&&pdfjsReady)return pdfjsReady;
  const bases=['https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/','https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/'];
  pdfjsReady=(async()=>{
    let err;
    for(const base of bases){
      try{
        if(!window.pdfjsLib)await loadScript(base+'pdf.min.js');
        window.pdfjsLib.GlobalWorkerOptions.workerSrc=base+'pdf.worker.min.js';return;
      }catch(e){err=e}
    }
    throw new Error('Could not load the PDF reader'+(err?'':''));
  })();
  pdfjsReady.catch(()=>{pdfjsReady=null});return pdfjsReady;
}
function pickFont(name,fam){
  const n=(name||'').replace(/^[A-Z]{6}\+/,'').replace(/[^a-z]/gi,'').toLowerCase();
  for(const f of FONTS)if(n.includes(f.toLowerCase().replace(/\s/g,'')))return f;
  if(/arial|helvet/.test(n))return 'Arial';
  if(/times|minion|palatino|cambria|garamond|georgia|serif/.test(n)&&!/sans/.test(n)||fam==='serif')return 'Source Serif 4';
  return 'Lato';
}

/* ---------- coloured blocks and highlights: pulled out of the PDF so they can be recoloured, moved and deleted ---------- */
function bgAround(ctx,cw,ch,bx,by,bw,bh){
  const pts=[[bx-3,by+bh/2],[bx+bw+3,by+bh/2],[bx+bw/2,by-3],[bx+bw/2,by+bh+3],[bx-3,by-3],[bx+bw+3,by-3],[bx-3,by+bh+3],[bx+bw+3,by+bh+3]],cnt={};
  pts.forEach(([px,py])=>{px=Math.min(cw-1,Math.max(0,Math.round(px)));py=Math.min(ch-1,Math.max(0,Math.round(py)));
    const d=ctx.getImageData(px,py,1,1).data,k=(d[0]>>4)+'-'+(d[1]>>4)+'-'+(d[2]>>4);(cnt[k]=cnt[k]||{n:0,d}).n++});
  const d=Object.values(cnt).sort((a,b)=>b.n-a.n)[0].d;return hex(d[0],d[1],d[2]);
}
async function readShapes(page,vp,ctx,cw,ch,R){
  const OPS=pdfjsLib.OPS,list=await page.getOperatorList(),fa=list.fnArray,aa=list.argsArray,found=[];
  const T=(m,n)=>[m[0]*n[0]+m[2]*n[1],m[1]*n[0]+m[3]*n[1],m[0]*n[2]+m[2]*n[3],m[1]*n[2]+m[3]*n[3],m[0]*n[4]+m[2]*n[5]+m[4],m[1]*n[4]+m[3]*n[5]+m[5]];
  const toRgb=a=>{if(!a)return null;if(typeof a[0]==='string'){const h=a[0].replace('#','');return h.length===6?[0,2,4].map(i=>parseInt(h.substr(i,2),16)):null}return a.length>=3?[a[0],a[1],a[2]].map(v=>Math.round(v)):null};
  const FILL=new Set([OPS.fill,OPS.eoFill,OPS.fillStroke,OPS.eoFillStroke,OPS.closeFillStroke,OPS.closeEOFillStroke]);
  const ENDP=new Set([OPS.stroke,OPS.closeStroke,OPS.endPath]);
  let ctm=[1,0,0,1,0,0],st=[],fill=[0,0,0],alpha=1,subs=[],cur=null;
  const bbox=sub=>{
    if(sub.some(p=>!p))return null;let pts=sub;if(pts.length===5&&pts[0][0]===pts[4][0]&&pts[0][1]===pts[4][1])pts=pts.slice(0,4);
    if(pts.length!==4)return null;const M=T(vp.transform,ctm);if(Math.abs(M[1])>1e-3||Math.abs(M[2])>1e-3)return null;
    const q=pts.map(([x,y])=>[M[0]*x+M[2]*y+M[4],M[1]*x+M[3]*y+M[5]]);
    const xs=q.map(p=>p[0]),ys=q.map(p=>p[1]),x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys);
    const ok=q.every(([x,y])=>(Math.abs(x-x0)<.6||Math.abs(x-x1)<.6)&&(Math.abs(y-y0)<.6||Math.abs(y-y1)<.6));
    return ok?{x:x0,y:y0,w:x1-x0,h:y1-y0}:null;
  };
  for(let i=0;i<fa.length;i++){
    const fn=fa[i],a=aa[i];
    if(fn===OPS.save)st.push([ctm.slice(),fill,alpha]);
    else if(fn===OPS.restore){const t=st.pop();if(t){ctm=t[0];fill=t[1];alpha=t[2]}}
    else if(fn===OPS.transform)ctm=T(ctm,a);
    else if(fn===OPS.paintFormXObjectBegin){st.push([ctm.slice(),fill,alpha]);if(a&&a[0])ctm=T(ctm,a[0])}
    else if(fn===OPS.paintFormXObjectEnd){const t=st.pop();if(t){ctm=t[0];fill=t[1];alpha=t[2]}}
    else if(fn===OPS.setFillRGBColor)fill=toRgb(a);
    else if(fn===OPS.setFillColorN||fn===OPS.setFillColorSpace)fill=(fn===OPS.setFillColorN&&a&&typeof a[0]==='number'&&a.length===3)?toRgb(a):(fn===OPS.setFillColorN?null:fill);
    else if(fn===OPS.setGState){(a[0]||[]).forEach(([k,v])=>{if(k==='ca'&&typeof v==='number')alpha=v})}
    else if(fn===OPS.constructPath){
      const o=a[0],c=a[1];let k=0;
      for(const op of o){
        if(op===OPS.moveTo){cur=[[c[k],c[k+1]]];subs.push(cur);k+=2}
        else if(op===OPS.lineTo){if(!cur){cur=[];subs.push(cur)}cur.push([c[k],c[k+1]]);k+=2}
        else if(op===OPS.curveTo){if(cur)cur.push(null);k+=6}
        else if(op===OPS.curveTo2||op===OPS.curveTo3){if(cur)cur.push(null);k+=4}
        else if(op===OPS.closePath){}
        else if(op===OPS.rectangle){const x=c[k],y=c[k+1],w=c[k+2],h=c[k+3];k+=4;subs.push([[x,y],[x+w,y],[x+w,y+h],[x,y+h]]);cur=null}
      }
    }
    else if(FILL.has(fn)){
      if(fill)subs.forEach(sb=>{const r=bbox(sb);if(r)found.push({...r,rgb:fill,a:alpha})});
      subs=[];cur=null;
    }
    else if(ENDP.has(fn)||fn===OPS.clip||fn===OPS.eoClip){if(!ENDP.has(fn)&&fn!==OPS.endPath){/* clip keeps path until endPath */}else{subs=[];cur=null}}
  }
  const W=vp.width,H=vp.height,seen=new Set(),out=[];
  found.forEach(f=>{
    const white=f.rgb.every(v=>v>=250)&&f.a>=.95;if(white)return;
    if(f.w*f.h>W*H*.85)return;
    const thin=Math.min(f.w,f.h)<=4&&Math.max(f.w,f.h)>=30;
    if(!thin&&(f.w*f.h<150||Math.min(f.w,f.h)<4))return;
    const key=[f.x,f.y,f.w,f.h].map(v=>Math.round(v)).join(',');if(seen.has(key))return;seen.add(key);
    out.push({id:uid(),x:+f.x.toFixed(1),y:+f.y.toFixed(1),w:+f.w.toFixed(1),h:+f.h.toFixed(1),c:hex(...f.rgb),a:+f.a.toFixed(2),k:thin?'rule':'block',live:false,del:false});
  });
  try{
    const ann=await page.getAnnotations({intent:'display'});
    ann.filter(a=>a.subtype==='Highlight').forEach(a=>{
      const col=a.color&&a.color.length>=3?[a.color[0],a.color[1],a.color[2]].map(v=>Math.round(v)):[255,255,0];
      const quads=Array.isArray(a.quadPoints)&&a.quadPoints.length?a.quadPoints:null;
      const rects=quads?quads.map(q=>{const pts=Array.isArray(q)?q:[];const xs=pts.map(p=>p.x!==undefined?p.x:p[0]),ys=pts.map(p=>p.y!==undefined?p.y:p[1]);
        return xs.length?[Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys)]:a.rect}):[a.rect];
      rects.forEach(rc=>{if(!rc)return;const v=vp.convertToViewportRectangle(rc),x0=Math.min(v[0],v[2]),x1=Math.max(v[0],v[2]),y0=Math.min(v[1],v[3]),y1=Math.max(v[1],v[3]);
        out.push({id:uid(),x:+x0.toFixed(1),y:+y0.toFixed(1),w:+(x1-x0).toFixed(1),h:+(y1-y0).toFixed(1),c:hex(...col),a:1,k:'highlight',live:false,del:false})});
    });
  }catch(e){}
  out.sort((a,b)=>b.w*b.h-a.w*a.h);
  return out.slice(0,80).map(sh=>{const bx=Math.max(0,Math.floor((sh.x-1)*R)),by=Math.max(0,Math.floor((sh.y-1)*R)),bw=Math.min(cw-bx,Math.ceil((sh.w+2)*R)),bh=Math.min(ch-by,Math.ceil((sh.h+2)*R));
    sh.bg=bgAround(ctx,cw,ch,bx,by,Math.max(1,bw),Math.max(1,bh));return sh});
}
async function readPage(page){
  const W=794,R=2,v1=page.getViewport({scale:1}),cs=W/v1.width,vp=page.getViewport({scale:cs}),vpr=page.getViewport({scale:cs*R});
  const cv=document.createElement('canvas');cv.width=Math.round(vpr.width);cv.height=Math.round(vpr.height);
  const ctx=cv.getContext('2d',{willReadFrequently:true});
  await page.render({canvasContext:ctx,viewport:vpr}).promise;
  const tc=await page.getTextContent(),finfo={};
  const info=n=>finfo[n]||(finfo[n]=(()=>{let nm='';try{nm=page.commonObjs.get(n).name||''}catch(e){}
    const fam=(tc.styles[n]||{}).fontFamily||'';return{font:pickFont(nm,fam),bold:/bold|black|heavy|semibold|demi/i.test(nm),italic:/italic|oblique/i.test(nm)}})());
  let its=tc.items.filter(i=>i.str&&i.str.trim()).map(i=>{const t=i.transform,[x,y]=vp.convertToViewportPoint(t[4],t[5]);
    return{x,y,fs:Math.hypot(t[0],t[1])*cs,w:i.width*cs,s:i.str,f:info(i.fontName)}}).filter(i=>i.fs>2);
  its.sort((a,b)=>a.y-b.y);const rows=[];
  its.forEach(i=>{const r=rows.find(r=>Math.abs(r.y-i.y)<=Math.max(2,i.fs*.3));r?r.items.push(i):rows.push({y:i.y,items:[i]})});
  const runs=[];
  rows.forEach(r=>{r.items.sort((a,b)=>a.x-b.x);let c=null;
    r.items.forEach(i=>{
      const gap=c?i.x-c.xEnd:0;
      if(c&&Math.abs(i.fs-c.fs)<1.2&&gap<=c.fs*.7&&gap>=-c.fs*.5){
        const sp=gap>c.fs*.12&&!/\s$/.test(c.last)&&!/^\s/.test(i.s)?' ':'';
        c.segs.push({t:sp+i.s,b:i.f.bold,i:i.f.italic});c.last=i.s;c.xEnd=i.x+i.w;
      }else{c={x:i.x,y:i.y,fs:i.fs,xEnd:i.x+i.w,last:i.s,f:i.f,segs:[{t:i.s,b:i.f.bold,i:i.f.italic}]};runs.push(c)}
    })});
  const boxes=[],covers=[],cw=cv.width,ch=cv.height;
  runs.forEach(r=>{
    const bx=Math.max(0,Math.floor(r.x*R)),by=Math.max(0,Math.floor((r.y-r.fs*.86)*R)),bw=Math.min(cw-bx,Math.ceil((r.xEnd-r.x)*R)+2),bh=Math.min(ch-by,Math.ceil(r.fs*1.1*R));
    if(bw<2||bh<2){return}
    const pts=[[bx-3,by+bh/2],[bx+bw+3,by+bh/2],[bx+bw/2,by-3],[bx+bw/2,by+bh+3],[bx-3,by-3],[bx+bw+3,by-3],[bx-3,by+bh+3],[bx+bw+3,by+bh+3]],cnt={};
    pts.forEach(([px,py])=>{px=Math.min(cw-1,Math.max(0,Math.round(px)));py=Math.min(ch-1,Math.max(0,Math.round(py)));
      const d=ctx.getImageData(px,py,1,1).data,k=(d[0]>>4)+'-'+(d[1]>>4)+'-'+(d[2]>>4);(cnt[k]=cnt[k]||{n:0,d}).n++});
    const bg=Object.values(cnt).sort((a,b)=>b.n-a.n)[0].d;
    const px=ctx.getImageData(bx,by,bw,bh).data;let best=0,tc2=null;
    for(let k=0;k<px.length;k+=4){const dd=Math.abs(px[k]-bg[0])+Math.abs(px[k+1]-bg[1])+Math.abs(px[k+2]-bg[2]);if(dd>best){best=dd;tc2=[px[k],px[k+1],px[k+2]]}}
    const bl=(bg[0]*.299+bg[1]*.587+bg[2]*.114)/255;
    r.bg=hex(bg[0],bg[1],bg[2]);r.rect=[bx,by,bw,bh];
    r.color=best>90&&tc2?hex(...tc2):(bl>.5?'#000000':'#ffffff');
  });
  runs.forEach(r=>{if(!r.rect)return;
    const html=r.segs.map(s=>{let h=esc(s.t);
      if(s.b!==r.f.bold)h=s.b?`<b>${h}</b>`:`<span style="font-weight:400">${h}</span>`;
      if(s.i!==r.f.italic)h=s.i?`<i>${h}</i>`:`<span style="font-style:normal">${h}</span>`;return h}).join('');
    const id=uid();boxes.push({id,x:+r.x.toFixed(1),by:r.y,w:r.xEnd-r.x,fs:+r.fs.toFixed(2),color:r.color,font:r.f.font,bold:r.f.bold,italic:r.f.italic,html,o:html,live:false});
    covers.push({id,x:+((r.rect[0]-1)/R).toFixed(1),y:+(r.rect[1]/R).toFixed(1),w:+((r.rect[2]+2)/R).toFixed(1),h:+(r.rect[3]/R).toFixed(1),c:r.bg,on:false});
  });
  let shapes=[];
  try{shapes=await readShapes(page,vp,ctx,cw,ch,R)}catch(e){console.warn('shapes',e)}
  shapes.forEach(sh=>covers.push({id:sh.id,x:+(sh.x-1).toFixed(1),y:+(sh.y-1).toFixed(1),w:+(sh.w+2).toFixed(1),h:+(sh.h+2).toFixed(1),c:sh.bg,on:false}));
  return{h:Math.round(vp.height),bg:cv.toDataURL('image/jpeg',.92),boxes,covers,shapes};
}
async function importPdf(file){
  const btn=$('#b-import');btn.disabled=true;toast('Reading the PDF…',60000);
  try{
    await ensurePdfjs();
    const doc=await pdfjsLib.getDocument({data:new Uint8Array(await file.arrayBuffer()),isEvalSupported:false}).promise;
    const pages=[];for(let i=1;i<=Math.min(doc.numPages,4);i++)pages.push(await readPage(await doc.getPage(i)));
    const n=pages.reduce((a,p)=>a+p.boxes.length,0);
    S.mode='pdf';S.pdf={name:file.name.replace(/\.pdf$/i,''),pages};pundo=[];render();
    toast(n?`Imported ${pages.length} page${pages.length>1?'s':''}. Click any text to edit it in place.`+(doc.numPages>4?' Only the first 4 pages were imported.':''):'No text found, so this PDF may be a scan. You can still add text boxes.',5000);
  }catch(e){toast('Could not read that PDF: '+(e.message||e),6000)}
  finally{btn.disabled=false}
}
const boxFont=b=>`font-family:${stack(b.font)};font-size:${b.fs}px;font-weight:${b.bold?700:400};font-style:${b.italic?'italic':'normal'};color:${b.color}`;
const ctlHTML=b=>{
  const B=(act,label,title)=>`<button data-bx="${act}" title="${title}" aria-label="${title}">${label}</button>`;
  let h=`<button class="grip" title="Drag this line" aria-label="Drag this line">⠿</button>`;
  if(b.hd)h+=`<button class="sgrip" title="Drag the whole section" aria-label="Drag the whole section">⇕</button>`+B('su','Sec ↑','Move section up')+B('sd','Sec ↓','Move section down')+B('sa','＋ Entry','Add an entry to this section')+B('sx','Del sec','Delete this whole section');
  if(b.ent)h+=B('eu','Entry ↑','Move entry up')+B('ed','Entry ↓','Move entry down')+B('ea','＋ Below','Add an entry below this one')+B('ex','Del entry','Delete this whole entry');
  h+=`<button data-bx="hd" aria-pressed="${!!b.hd}" title="${b.hd?'Section heading (click to unmark)':'Mark as a section heading'}" aria-label="Section heading">H</button>`;
  h+=`<button data-bx="ent" aria-pressed="${!!b.ent}" title="${b.ent?'First line of an entry (click to unmark)':'Mark as the first line of an entry (a job, a degree)'}" aria-label="Entry start">E</button>`;
  return h+B('del','×','Delete this line');
};
const boxHTML=b=>`<div class="tbw${b.live?' live':''}" data-id="${b.id}" style="left:${b.x}px;top:${b.y==null?0:b.y}px"><div class="tbc no-export" contenteditable="false">${ctlHTML(b)}</div><div class="tbx" contenteditable="true" spellcheck="false" style="${boxFont(b)}">${b.html}</div></div>`;
const allBoxes=()=>S.pdf.pages.flatMap(p=>p.boxes);
const scaleNow=()=>parseFloat(stage.style.getPropertyValue('--s'))||1;
function layoutBoxes(){
  const s=scaleNow(),pend=$$('.tbw',pdfwrap).filter(w=>{const b=allBoxes().find(x=>x.id===w.dataset.id);return b&&b.y==null});
  pend.forEach(w=>{const b=allBoxes().find(x=>x.id===w.dataset.id),el=w.querySelector('.tbx');
    const nat=el.getBoundingClientRect().width/s;if(b.w>0&&nat>b.w*1.03){b.fs=+(b.fs*Math.max(b.w/nat,.88)).toFixed(2);el.style.fontSize=b.fs+'px'}});
  const offs=pend.map(w=>{const el=w.querySelector('.tbx'),mk=document.createElement('span');mk.style.cssText='display:inline-block;width:0;height:0';el.append(mk);
    const o=(mk.getBoundingClientRect().bottom-el.getBoundingClientRect().top)/s;mk.remove();return o});
  pend.forEach((w,i)=>{const b=allBoxes().find(x=>x.id===w.dataset.id);b.y=+(b.by-offs[i]).toFixed(1);b.ox=b.x;b.oy=b.y;w.style.top=b.y+'px'});
}
const hexRgba=(h,a)=>{const n=parseInt(h.slice(1),16);return `rgba(${n>>16&255},${n>>8&255},${n&255},${a})`};
const shapeLabel=sh=>sh.k==='highlight'?'Highlight':sh.k==='rule'?'Line':'Colour block';
const shapeStyle=sh=>`left:${sh.x}px;top:${sh.y}px;width:${sh.w}px;height:${sh.h}px;--c:${hexRgba(sh.c,sh.a)}`;
const shapeHTML=sh=>`<div class="shp ${sh.k}${sh.live?' live':''}${sh.del?' del':''}" data-sid="${sh.id}" tabindex="0" style="${shapeStyle(sh)}"><div class="tbc no-export" contenteditable="false"><span class="tag">${shapeLabel(sh)}</span><input type="color" class="shc" value="${sh.c}" title="Change colour" aria-label="Change colour"><button class="sgr" title="Drag to move" aria-label="Drag to move">⠿</button><button data-sh="del" title="Delete" aria-label="Delete">×</button></div><div class="sx no-export" contenteditable="false"><input type="color" class="shc" value="${sh.c}" title="Change colour" aria-label="Change colour"><button data-sh="del" title="Delete this ${shapeLabel(sh).toLowerCase()}" aria-label="Delete">×</button></div><div class="rsz no-export" title="Drag to resize"></div></div>`;
const allShapes=()=>S.pdf.pages.flatMap(p=>p.shapes||[]);
const shapePage=sh=>S.pdf.pages.findIndex(p=>(p.shapes||[]).includes(sh));
/* the first edit of a shape wipes the original pixels (cover) and redraws it as a real object; text that sat on it is redrawn as live text */
function liveShape(sh){
  if(sh.live)return;sh.live=true;
  const pi=shapePage(sh),pg=S.pdf.pages[pi];
  const cov=pg.covers.find(c=>c.id===sh.id);if(cov)cov.on=true;
  const el=pdfwrap.querySelector(`.shp[data-sid="${sh.id}"]`);if(el)el.classList.add('live');
  const cel=pdfwrap.querySelector(`.pdfpage[data-p="${pi}"] .cov[data-id="${sh.id}"]`);if(cel)cel.classList.add('on');
  pg.covers.forEach(c=>{
    if(c.id===sh.id)return;const ov=Math.min(c.x+c.w,sh.x+sh.w+1)-Math.max(c.x,sh.x-1),oh=Math.min(c.y+c.h,sh.y+sh.h+1)-Math.max(c.y,sh.y-1);
    if(ov<=0||oh<=0)return;
    const b=allBoxes().find(x=>x.id===c.id);if(!b)return;
    setLive(b.id,true);
    if(c.x>=sh.x-2&&c.y>=sh.y-2&&c.x+c.w<=sh.x+sh.w+2&&c.y+c.h<=sh.y+sh.h+2){c.c=sh.bg;const e=pdfwrap.querySelector(`.pdfpage[data-p="${pi}"] .cov[data-id="${c.id}"]`);if(e)e.style.background=sh.bg}
  });
  saveSoon();
}
function paintShape(sh){
  const el=pdfwrap.querySelector(`.shp[data-sid="${sh.id}"]`);if(!el)return;
  el.setAttribute('style',shapeStyle(sh));el.classList.toggle('del',!!sh.del);
  el.querySelectorAll('.shc').forEach(i=>{if(i.value!==sh.c)i.value=sh.c});
}
function refreshShapesUI(){
  const box=$('#pdfshapes');if(!box)return;
  const all=S.pdf.pages.flatMap((p,pi)=>(p.shapes||[]).map(sh=>({sh,pi})));
  $('#shapeshead').hidden=!all.length;
  box.innerHTML=all.map(({sh,pi})=>`<div class="secrow shrow${sh.del?' gone':''}" data-shid="${sh.id}"><div class="n"><i class="sw" style="background:${sh.c}"></i>${shapeLabel(sh)} · page ${pi+1} · ${Math.round(sh.w)}×${Math.round(sh.h)}${sh.del?' (deleted)':''}</div><div class="mini">${sh.del?'<button data-sl="un" aria-label="Restore" title="Restore">↺</button>':`<input type="color" class="slc" value="${sh.c}" aria-label="Colour" title="Change colour"><button data-sl="go" aria-label="Show on page" title="Show on the page">⌖</button><button data-sl="del" aria-label="Delete" title="Delete">×</button>`}</div></div>`).join('');
}
function deleteShape(sh){snapPdf();liveShape(sh);sh.del=true;paintShape(sh);refreshShapesUI();saveSoon()}
$('#pdfshapes').addEventListener('click',e=>{
  const b=e.target.closest('[data-sl]');if(!b)return;const sh=allShapes().find(x=>x.id===b.closest('.shrow').dataset.shid);if(!sh)return;
  if(b.dataset.sl==='del')deleteShape(sh);
  else if(b.dataset.sl==='un'){snapPdf();sh.del=false;paintShape(sh);refreshShapesUI();saveSoon()}
  else{const el=pdfwrap.querySelector(`.shp[data-sid="${sh.id}"]`);if(el){el.scrollIntoView({block:'center'});el.focus();el.classList.add('flash');setTimeout(()=>el.classList.remove('flash'),1400)}}
});
$('#pdfshapes').addEventListener('input',e=>{
  const i=e.target.closest('.slc');if(!i)return;const sh=allShapes().find(x=>x.id===i.closest('.shrow').dataset.shid);if(!sh)return;
  liveShape(sh);sh.c=i.value;paintShape(sh);i.closest('.shrow').querySelector('.sw').style.background=sh.c;saveSoon();
});
$('#pdfshapes').addEventListener('pointerdown',e=>{if(e.target.closest('.slc')&&!$('#pdfshapes').dataset.snap){$('#pdfshapes').dataset.snap=1;snapPdf()}});
$('#pdfshapes').addEventListener('change',()=>{delete $('#pdfshapes').dataset.snap});
pdfwrap.addEventListener('input',e=>{
  const i=e.target.closest('.shc');if(!i)return;const sh=allShapes().find(x=>x.id===i.closest('.shp').dataset.sid);if(!sh)return;
  if(!i.dataset.snap){i.dataset.snap=1;snapPdf()}
  liveShape(sh);sh.c=i.value;paintShape(sh);refreshShapesUI();saveSoon();
});
pdfwrap.addEventListener('change',e=>{const i=e.target.closest('.shc');if(i)delete i.dataset.snap});
pdfwrap.addEventListener('click',e=>{const b=e.target.closest('[data-sh="del"]');if(!b)return;const sh=allShapes().find(x=>x.id===b.closest('.shp').dataset.sid);if(sh)deleteShape(sh)});
pdfwrap.addEventListener('pointerdown',e=>{
  const g=e.target.closest('.sgr,.rsz');if(!g)return;e.preventDefault();e.stopPropagation();
  const el=g.closest('.shp'),sh=allShapes().find(x=>x.id===el.dataset.sid);if(!sh)return;
  snapPdf();liveShape(sh);const s=scaleNow(),sx=e.clientX,sy=e.clientY,o={x:sh.x,y:sh.y,w:sh.w,h:sh.h},resize=g.classList.contains('rsz');
  const mv=ev=>{const dx=(ev.clientX-sx)/s,dy=(ev.clientY-sy)/s;
    if(resize){sh.w=+Math.max(2,o.w+dx).toFixed(1);sh.h=+Math.max(2,o.h+dy).toFixed(1)}else{sh.x=+(o.x+dx).toFixed(1);sh.y=+(o.y+dy).toFixed(1)}
    paintShape(sh)};
  const up=()=>{document.removeEventListener('pointermove',mv);document.removeEventListener('pointerup',up);refreshShapesUI();saveSoon()};
  document.addEventListener('pointermove',mv);document.addEventListener('pointerup',up);
});
function renderPdf(){
  pdfwrap.innerHTML=S.pdf.pages.map((p,i)=>`<div class="pdfpage" data-p="${i}" style="height:${p.h}px"><img class="bg" src="${p.bg}" alt="" draggable="false">${(p.covers||[]).map(c=>`<div class="cov${c.on?' on':''}" data-id="${c.id}" style="left:${c.x}px;top:${c.y}px;width:${c.w}px;height:${c.h}px;background:${c.c}"></div>`).join('')}${(p.shapes||[]).map(shapeHTML).join('')}${p.boxes.map(boxHTML).join('')}</div>`).join('');
  fit();layoutBoxes();fit();
  if(!S.pdf.hd){S.pdf.hd=1;pdfFrames();detectHeadings();detectEntries()}
  else if(!S.pdf.sp){pdfFrames();detectEntries()}
  refreshPdfUI();saveSoon();
}
function setLive(id,on){
  const b=allBoxes().find(x=>x.id===id);if(!b||!!b.live===on)return;b.live=on;
  const w=pdfwrap.querySelector(`.tbw[data-id="${id}"]`);if(w)w.classList.toggle('live',on);
  S.pdf.pages.forEach((p,i)=>{const c=(p.covers||[]).find(x=>x.id===id);if(!c)return;c.on=on;
    const el=pdfwrap.querySelector(`.pdfpage[data-p="${i}"] .cov[data-id="${id}"]`);if(el)el.classList.toggle('on',on)});
  saveSoon();
}
pdfwrap.addEventListener('beforeinput',e=>{const el=e.target.closest('.tbx');if(el)setLive(el.closest('.tbw').dataset.id,true)});
pdfwrap.addEventListener('input',e=>{const el=e.target.closest('.tbx');if(el)syncEl(el)});
pdfwrap.addEventListener('paste',e=>{const el=e.target.closest('.tbx');if(!el)return;e.preventDefault();document.execCommand('insertText',false,(e.clipboardData||window.clipboardData).getData('text/plain'))});
pdfwrap.addEventListener('click',e=>{const b=e.target.closest('[data-bx]');if(!b)return;
  const w=b.closest('.tbw'),id=w.dataset.id,box=allBoxes().find(x=>x.id===id),a=b.dataset.bx;
  if(a==='hd'){box.hd=!box.hd;if(box.hd)box.ent=false;refreshPdfUI();saveSoon()}
  else if(a==='ent'){box.ent=!box.ent;if(box.ent)box.hd=false;refreshPdfUI();saveSoon()}
  else if(a==='del')deleteLine(id);
  else if(a==='su'||a==='sd')moveSection(id,a==='su'?-1:1);
  else if(a==='sa')addEntry(id,'sec',0);
  else if(a==='sx')deleteSection(id);
  else if(a==='eu'||a==='ed')moveEntry(id,a==='eu'?-1:1);
  else if(a==='ea')addEntry(id,'entry',1);
  else if(a==='ex')deleteEntry(id)});
pdfwrap.addEventListener('pointerdown',e=>{
  const g=e.target.closest('.grip');if(!g)return;e.preventDefault();
  const w=g.closest('.tbw'),b=allBoxes().find(x=>x.id===w.dataset.id),s=scaleNow();
  setLive(b.id,true);const sx=e.clientX,sy=e.clientY,ox=b.x,oy=b.y;
  const mv=ev=>{b.x=+(ox+(ev.clientX-sx)/s).toFixed(1);b.y=+(oy+(ev.clientY-sy)/s).toFixed(1);w.style.left=b.x+'px';w.style.top=b.y+'px'};
  const up=()=>{document.removeEventListener('pointermove',mv);document.removeEventListener('pointerup',up);saveSoon()};
  document.addEventListener('pointermove',mv);document.addEventListener('pointerup',up);
});
$('#b-addbox').onclick=()=>{
  const pgs=$$('.pdfpage',pdfwrap);let pi=0,top=60;const s=scaleNow();
  pgs.forEach((p,i)=>{const r=p.getBoundingClientRect();if(r.bottom>140&&pi===0&&i>=0&&!pgs.slice(0,i).some(q=>q.getBoundingClientRect().bottom>140)){pi=i;top=Math.max(40,(120-r.top)/s)}});
  const b={id:uid(),x:80,y:+top.toFixed(1),by:0,w:0,fs:12,color:'#000000',font:'Lato',bold:false,italic:false,html:'New text',live:true};
  S.pdf.pages[pi].boxes.push(b);pgs[pi].insertAdjacentHTML('beforeend',boxHTML(b));saveSoon();
  const el=pgs[pi].querySelector(`[data-id="${b.id}"] .tbx`);el.focus();document.execCommand('selectAll');
};
$('#b-back').onclick=()=>{S.mode='tpl';pundo=[];render()};
$('#b-import').onclick=()=>$('#f-pdf').click();
$('#f-pdf').onchange=e=>{const f=e.target.files[0];e.target.value='';if(f)importPdf(f)};

/* ---------- structure of an imported PDF: sections > entries > lines ----------
   A "row" is one printed line (all boxes on a shared baseline). A section is a heading row plus what is under it.
   An entry is one job or degree: its title/company/date lines and its bullets, kept together.
   Every layout change (move, add, delete, spacing) rebuilds this structure and re-lays the page(s) from it,
   so gaps and left alignment stay uniform. */
const HEAD_RE=/^((professional|personal|career|executive|key|core|technical|relevant|selected|work|employment|additional|academic|clinical|leadership|volunteer)\s)?(profile|summary|objective|statement|experience|history|education|qualifications?|skills|competenc(y|ies)|expertise|achievements|highlights|certifications?|licen[cs]es|training|languages|interests|hobbies|projects|references|awards|publications|volunteering|research|teaching|memberships?|affiliations?|about( me)?|contact( details)?|details|courses|accomplishments|strengths)(\s(&|and)\s[a-z]+)*$/i;
const MONTH='(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\\.?';
const DATE_RE=new RegExp(`(?:${MONTH}\\s+)?(?:19|20)\\d{2}\\s*(?:–|—|-|to)\\s*(?:present|current|now|(?:${MONTH}\\s+)?(?:19|20)\\d{2})`,'i');
const boxText=b=>b.html.replace(/<[^>]+>/g,'').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&nbsp;/g,' ').trim();
const normH=t=>t.replace(/[^a-z& ]/gi,' ').replace(/\s+/g,' ').trim().toLowerCase();
function pdfRows(){
  const rows=[];
  S.pdf.pages.forEach((p,pi)=>{
    p.boxes.filter(b=>b.oy!=null&&b.y!=null).sort((a,b)=>a.y-b.y||a.x-b.x).forEach(b=>{
      const r=rows.find(r=>r.pi===pi&&Math.abs(r.y-b.y)<=Math.max(2,b.fs*.45));
      if(r){r.boxes.push(b);r.fs=Math.max(r.fs,b.fs)}else rows.push({pi,y:b.y,fs:b.fs,boxes:[b]});
    });
  });
  rows.forEach(r=>{r.boxes.sort((a,b)=>a.x-b.x);r.lead=r.boxes[0];r.x=r.lead.x;r.h=r.fs*1.15});
  return rows;
}
function pdfColumns(rows){
  const xs=rows.map(r=>r.x).sort((a,b)=>a-b),cl=[];
  xs.forEach(x=>{const c=cl[cl.length-1];if(c&&x-c.max<=12){c.n++;c.max=x;c.sum+=x}else cl.push({n:1,max:x,sum:x})});
  const m=[];cl.filter(c=>c.n>=5).map(c=>c.sum/c.n).forEach(x=>{if(!m.length||x-m[m.length-1]>150)m.push(x)});
  return m.length?m:[0];
}
const colOf=(cols,x)=>{let bi=0;cols.forEach((c,i)=>{if(Math.abs(x-c)<Math.abs(x-cols[bi]))bi=i});return bi};
/* The text area of every page, measured once from the original layout and then kept fixed. */
function pdfFrames(){
  if(S.pdf.frames&&S.pdf.fv===2&&S.pdf.frames.length===S.pdf.pages.length)return S.pdf.frames;
  const o=allBoxes().filter(b=>b.oy!=null);
  const ct=o.length?Math.min(...o.map(b=>b.oy)):0,cb=o.length?Math.max(...o.map(b=>b.oy+b.fs*1.15)):1000;
  S.pdf.frames=S.pdf.pages.map(()=>({ct,cb}));S.pdf.fv=2;return S.pdf.frames;
}
function flowMap(){
  const fr=pdfFrames().map(f=>({...f})),F=[];
  const calc=()=>{let a=0;fr.forEach((f,i)=>{F[i]=a;a+=f.cb-f.ct})};calc();
  return{fr,F,to:(pi,y)=>F[pi]+(y-fr[pi].ct),
    from:f=>{for(let k=0;k<fr.length;k++){if(k===fr.length-1||f<F[k+1])return{pi:k,y:fr[k].ct+(f-F[k])}}},
    end:k=>F[k]+(fr[k].cb-fr[k].ct),addPage(){fr.push({...fr[fr.length-1]});calc()}};
}
function detectHeadings(){
  const rows=pdfRows();if(!rows.length)return;
  const sig=r=>[Math.round(r.lead.fs),r.lead.bold?1:0,r.lead.color].join('|');
  const cnt={};rows.forEach(r=>{const k=sig(r);cnt[k]=(cnt[k]||0)+boxText(r.lead).length});
  const body=Object.keys(cnt).sort((a,b)=>cnt[b]-cnt[a])[0],bodyFs=parseFloat(body);
  const short=r=>{const t=boxText(r.lead);return t.length>2&&t.length<=45&&r.boxes.length<=2};
  const cols=pdfColumns(rows),fm=flowMap();
  rows.forEach(r=>{r.col=colOf(cols,r.x);r.f=fm.to(r.pi,r.y)});
  const gapsBefore=new Map(),allGaps=[];
  cols.forEach((_,ci)=>{const rs=rows.filter(r=>r.col===ci).sort((a,b)=>a.f-b.f);
    rs.forEach((r,i)=>{if(i){const g=r.f-rs[i-1].f;gapsBefore.set(r,g);allGaps.push(g)}else gapsBefore.set(r,Infinity)})});
  allGaps.sort((a,b)=>a-b);
  const tight=allGaps.filter(g=>g>=bodyFs*.8),lo=tight[0]||0,near=tight.filter(g=>g<=lo*1.2);
  const pitch=near.length?near[Math.floor(near.length/2)]:0; /* the normal line-to-line distance */
  S.pdf.pitch=pitch;
  const looksLikeHeading=r=>{const t=boxText(r.lead);
    return t.length<=40&&/^[A-Z0-9]/.test(t)&&!/[.,;:!?]$/.test(t)&&HEAD_RE.test(normH(t))&&gapsBefore.get(r)>=pitch*1.25};
  const heads=new Set(rows.filter(looksLikeHeading));
  if(heads.size>=2){const ks=new Set([...heads].map(sig));rows.forEach(r=>{if(sig(r)!==body&&ks.has(sig(r))&&short(r))heads.add(r)})}
  else rows.forEach(r=>{if(short(r)&&r.boxes.length===1&&sig(r)!==body&&(r.lead.bold||r.lead.fs>=bodyFs*1.12)&&!/[.,;:]$/.test(boxText(r.lead)))heads.add(r)});
  allBoxes().forEach(b=>{b.hd=false});rows.forEach(r=>{r.lead.hd=heads.has(r)});
}
const rowIsDate=r=>r.boxes.some(b=>DATE_RE.test(boxText(b)));
/* entries: each dated block (job, degree) starts at its title line; classify every gap so layout can be rebuilt uniformly */
function detectEntries(){
  const pitch=S.pdf.pitch||16;
  allBoxes().forEach(b=>{b.ent=false});
  const m=pdfModel();
  m.cols.forEach(col=>col.secs.forEach(sc=>{
    const rs=sc.pre,dates=rs.filter(rowIsDate);
    dates.forEach(dr=>{
      let j=rs.indexOf(dr);
      const solo=dr.boxes.every(b=>DATE_RE.test(boxText(b))||!boxText(b));
      if(solo){let up=0;while(j>0&&up<2&&!rowIsDate(rs[j-1])&&rs[j].f-rs[j-1].f<=pitch*1.2&&!/[.!?:;]$/.test(boxText(rs[j-1].lead))&&boxText(rs[j-1].lead).length<=70){j--;up++}}
      rs[j].lead.ent=true;
    });
  }));
  const m2=pdfModel(),by={line:[],item:[],entry:[],sec:[],head:[]};
  m2.cols.forEach(col=>{
    const rows=col.secs.flatMap(secRows);
    rows.forEach((r,i)=>{
      if(!i){r.lead.pv=null;r.lead.d0=null;return}
      const prev=rows[i-1],d=r.f-prev.f;
      r.lead.gc=d<=pitch*1.2?'line':'item';r.lead.pv=prev.lead.id;r.lead.d0=d;
      by[rowClass(r,prev)].push(Math.round(d*2)/2);
    });
  });
  const mode=a=>{if(!a.length)return null;const c={};a.forEach(v=>c[v]=(c[v]||0)+1);return +Object.keys(c).sort((x,y)=>c[y]-c[x])[0]};
  const item=mode(by.item)||pitch*1.5;
  S.pdf.sp={line:mode(by.line)||pitch,item,entry:mode(by.entry)||item,sec:mode(by.sec)||item,head:mode(by.head)||item};
  S.pdf.mult={line:1,item:1,entry:1,sec:1};
}
const secRows=sc=>[...(sc.head?[sc.head]:[]),...sc.pre,...sc.entries.flatMap(e=>e.rows)];
function rowClass(r,prev){
  if(r.lead.hd)return 'sec';
  if(prev&&prev.lead.hd)return 'head';
  if(r.lead.ent)return 'entry';
  return r.lead.gc==='item'?'item':'line';
}
function pdfModel(){
  const rows=pdfRows(),colsx=pdfColumns(rows),fm=flowMap();
  rows.forEach(r=>{r.col=colOf(colsx,r.x);r.f=fm.to(r.pi,r.y)});
  const cols=colsx.map((_,ci)=>{
    const rs=rows.filter(r=>r.col===ci).sort((a,b)=>a.f-b.f),secs=[];let sec=null,ent=null;
    rs.forEach(r=>{
      if(r.lead.hd){sec={id:r.lead.id,head:r,pre:[],entries:[],col:ci};secs.push(sec);ent=null;return}
      if(!sec){sec={id:'top'+ci,head:null,pre:[],entries:[],col:ci};secs.push(sec)}
      if(r.lead.ent){ent={id:r.lead.id,rows:[],sec};sec.entries.push(ent)}
      (ent?ent.rows:sec.pre).push(r);
    });
    secs.forEach(sc=>{const all=secRows(sc);sc.title=sc.head?boxText(sc.head.lead):'Header';sc.T=Math.min(...all.map(r=>r.f));sc.B=Math.max(...all.map(r=>r.f+r.h))});
    return{secs};
  });
  return{cols,fm,colsx};
}
/* ---- undo for layout changes ---- */
let pundo=[];
function snapPdf(){
  pundo.push({j:JSON.stringify({p:S.pdf.pages.map(p=>({h:p.h,boxes:p.boxes,covers:p.covers,shapes:p.shapes||[],auto:p.auto})),fr:S.pdf.frames,mult:S.pdf.mult}),bg:S.pdf.pages.map(p=>p.bg)});
  if(pundo.length>25)pundo.shift();syncUndo();
}
function undoPdf(){
  const u=pundo.pop();if(!u)return;const d=JSON.parse(u.j);
  S.pdf.pages=d.p.map((p,i)=>({...p,bg:u.bg[i]}));S.pdf.frames=d.fr;S.pdf.mult=d.mult;syncUndo();renderPdf();
}
function syncUndo(){const b=$('#b-pundo');if(b)b.disabled=!pundo.length}
function blankPage(h){
  const c=document.createElement('canvas');c.width=1588;c.height=Math.round(h*2);const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);
  return{h,bg:c.toDataURL('image/jpeg',.6),boxes:[],covers:[],auto:true};
}
/* ---- the one layout routine: assign every row of every column a position, in order, with uniform spacing ---- */
function reflow(model,structural){
  const fm=model.fm,sp=S.pdf.sp,mu=S.pdf.mult,all=[];
  const mult=c=>({line:mu.line,item:mu.item,entry:mu.entry,sec:mu.sec,head:mu.item}[c]||1);
  model.cols.forEach(col=>{
    const rows=col.secs.flatMap(secRows);let prev=null;
    rows.forEach((r,i)=>{
      let f;
      if(!i){f=r.f;r.same=true}
      else{const cls=rowClass(r,prev);r.same=r.lead.pv===prev.lead.id&&r.lead.d0!=null;r.base=r.same?r.lead.d0:sp[cls];f=prev.nf+r.base*mult(cls)}
      let k=fm.from(f).pi,guard=0;
      while(f+r.h>fm.end(k)+.01&&guard++<60){if(k===fm.fr.length-1)fm.addPage();f=fm.F[k+1];k++}
      r.nf=f;prev=r;all.push(r);
    });
  });
  all.forEach(r=>{const l=fm.from(r.nf);r.npi=l.pi;r.ny=+l.y.toFixed(1)});
  const pages=S.pdf.pages,h0=pages[0].h;
  while(pages.length<fm.fr.length){pages.push(blankPage(h0));structural=true}
  S.pdf.frames=pages.map(()=>({...fm.fr[0]}));
  const alive=new Set();
  all.forEach(r=>{
    r.boxes.forEach(b=>{
      alive.add(b);
      const cur=pages.findIndex(p=>p.boxes.includes(b)),ny=+(r.ny+(b.y-r.y)).toFixed(1);
      const moved=cur<0||Math.abs(ny-b.y)>.4||cur!==r.npi;
      if(cur!==r.npi){if(cur>=0)pages[cur].boxes=pages[cur].boxes.filter(x=>x!==b);pages[r.npi].boxes.push(b);structural=true}
      if(cur<0){b.oy=ny;b.ox=b.x;structural=true}
      b.y=ny;
      if(moved&&!b.live)setLive(b.id,true);
      else if(moved)S.pdf.pages.forEach(p=>{const c=(p.covers||[]).find(x=>x.id===b.id);if(c)c.on=true});
    });
    /* remember the spacing now in force between neighbours so later layout keeps it */
    if(!r.same){r.lead.d0=r.base}
  });
  all.forEach((r,i)=>{});
  model.cols.forEach(col=>{const rows=col.secs.flatMap(secRows);rows.forEach((r,i)=>{r.lead.pv=i?rows[i-1].lead.id:null;if(!i)r.lead.d0=null})});
  while(pages.length>1&&pages[pages.length-1].auto&&!pages[pages.length-1].boxes.length){pages.pop();structural=true}
  S.pdf.frames=pages.map(()=>({...fm.fr[0]}));
  if(structural)renderPdf();
  else{
    all.forEach(r=>r.boxes.forEach(b=>{const w=pdfwrap.querySelector(`.tbw[data-id="${b.id}"]`);if(w)w.style.top=b.y+'px'}));
    fit();refreshPdfUI();saveSoon();
  }
}
/* ---- operations (each takes an undo snapshot first) ---- */
const findSec=(m,id)=>{for(const c of m.cols)for(const sc of c.secs)if((sc.head&&sc.head.lead.id===id)||sc.id===id)return{col:c,sec:sc}};
const findEntry=(m,id)=>{for(const c of m.cols)for(const sc of c.secs)for(const e of sc.entries)if(e.rows[0].lead.id===id)return{col:c,sec:sc,ent:e}};
function dropBoxes(rows){rows.forEach(r=>r.boxes.forEach(b=>{setLive(b.id,true);S.pdf.pages.forEach(p=>{p.boxes=p.boxes.filter(x=>x!==b)})}))}
function moveSectionTo(m,sec,idx){
  const col=m.cols[sec.col],from=col.secs.indexOf(sec),min=col.secs[0].head?0:1;
  idx=Math.max(min,Math.min(col.secs.length-1,idx));if(idx===from)return;
  snapPdf();col.secs.splice(from,1);col.secs.splice(idx,0,sec);reflow(m);
}
function moveSection(id,dir){
  const m=pdfModel(),f=findSec(m,id);if(!f||!f.sec.head)return;
  const i=f.col.secs.indexOf(f.sec),j=i+dir;
  if(j<(f.col.secs[0].head?0:1)||j>=f.col.secs.length){toast(dir<0?'That section is already first.':'That section is already last.');return}
  moveSectionTo(m,f.sec,j);
}
function moveEntry(id,dir){
  const m=pdfModel(),f=findEntry(m,id);if(!f)return;
  const es=f.sec.entries,i=es.indexOf(f.ent),j=i+dir;
  if(j<0||j>=es.length){toast(dir<0?'That is already the first entry in this section.':'That is already the last entry in this section.');return}
  snapPdf();es.splice(i,1);es.splice(j,0,f.ent);reflow(m);
}
function deleteEntry(id){
  const m=pdfModel(),f=findEntry(m,id);if(!f)return;
  snapPdf();dropBoxes(f.ent.rows);f.sec.entries.splice(f.sec.entries.indexOf(f.ent),1);reflow(m,true);toast('Entry deleted. Use Undo layout change to bring it back.',4500);
}
function deleteSection(id){
  const m=pdfModel(),f=findSec(m,id);if(!f)return;
  snapPdf();dropBoxes(secRows(f.sec));f.col.secs.splice(f.col.secs.indexOf(f.sec),1);reflow(m,true);toast('Section deleted. Use Undo layout change to bring it back.',4500);
}
function deleteLine(id){
  const m=pdfModel();let hit=null;
  m.cols.forEach(c=>c.secs.forEach(sc=>{[sc.head,...sc.pre,...sc.entries.flatMap(e=>e.rows)].forEach(r=>{if(r&&r.boxes.some(b=>b.id===id))hit={r,sc}})}));
  if(!hit)return;snapPdf();
  const {r,sc}=hit,b=r.boxes.find(x=>x.id===id);
  if(r.boxes.length>1){setLive(id,true);S.pdf.pages.forEach(p=>{p.boxes=p.boxes.filter(x=>x!==b)});if(r.lead===b){r.boxes.splice(r.boxes.indexOf(b),1);r.boxes[0].hd=b.hd;r.boxes[0].ent=b.ent}renderPdf();return}
  dropBoxes([r]);
  /* if a heading or entry's first line is deleted, hand its role to the next line so the structure survives */
  const all=secRows(sc);const nxt=all[all.indexOf(r)+1];
  if(r===sc.head){sc.head=null}
  else if(r.lead.ent){const e=sc.entries.find(x=>x.rows[0]===r);if(e){e.rows.shift();if(e.rows.length){e.rows[0].lead.ent=true}else sc.entries.splice(sc.entries.indexOf(e),1)}}
  else{sc.pre=sc.pre.filter(x=>x!==r);sc.entries.forEach(e=>{e.rows=e.rows.filter(x=>x!==r)})}
  reflow(m,true);
}
/* A new entry copies the layout of an existing one: same fonts, sizes, indents and line gaps, with placeholder text. */
function placeholderFor(r,i,dateIdx,tpl){
  return b=>{
    const t=boxText(b),pre=(t.match(/^[•·\-–▪●]\s*/)||[''])[0];
    if(DATE_RE.test(t))return pre+'Mon YYYY–Present';
    if(i===0)return b===r.lead?'Job title | Company, Location':'Location';
    if(i<=dateIdx)return 'Company, Location';
    return pre+'Describe what you did and the result.';
  };
}
function setText(html,text){
  const d=document.createElement('div');d.innerHTML=html;
  const w=document.createTreeWalker(d,NodeFilter.SHOW_TEXT);let n,first=true;
  while((n=w.nextNode())){if(first){n.nodeValue=text;first=false}else n.nodeValue=''}
  if(first)d.textContent=text;return d.innerHTML;
}
function addEntry(id,mode,offset){
  const m=pdfModel();let sec,tpl,index;
  if(mode==='sec'){const f=findSec(m,id);if(!f)return;sec=f.sec;tpl=sec.entries[0];index=0}
  else{const f=findEntry(m,id);if(!f)return;sec=f.sec;tpl=f.ent;index=sec.entries.indexOf(f.ent)+offset}
  if(!tpl){toast('This section has no entry to copy the layout from. Hover the first line of an entry and press E to mark it, then try again.',6000);return}
  snapPdf();
  const rs=tpl.rows,dIdx=Math.max(0,rs.findIndex(rowIsDate));
  const keep=rs.filter((r,i)=>i<=dIdx||r.lead.gc==='item').slice(0,dIdx+1+3);
  const idx=new Map(rs.map((r,i)=>[r,i]));
  const rows=keep.map((r,k)=>{
    const ph=placeholderFor(r,k,keep.findIndex(rowIsDate)<0?0:keep.findIndex(rowIsDate),tpl);
    const boxes=r.boxes.map(b=>{const c={...b,id:uid(),html:setText(b.html,ph(b)),o:null,live:true,hd:false,ent:k===0,d0:null,pv:null};delete c.w;return c});
    return{pi:r.pi,y:r.y,fs:r.fs,boxes,lead:boxes[0],x:r.x,h:r.h,f:r.f,col:r.col,isNew:true};
  });
  sec.entries.splice(index,0,{id:rows[0].lead.id,rows,sec});
  reflow(m,true);
  const nid=rows[0].lead.id;setTimeout(()=>{const el=pdfwrap.querySelector(`.tbw[data-id="${nid}"] .tbx`);if(el){el.scrollIntoView({block:'center'});el.focus();document.execCommand('selectAll')}},60);
  toast('Entry added in the same format. Type over the placeholder text.',5000);
}
/* ---- side-panel list, spacing sliders ---- */
function refreshPdfUI(){
  allBoxes().forEach(b=>{const w=pdfwrap.querySelector(`.tbw[data-id="${b.id}"] .tbc`);if(w)w.innerHTML=ctlHTML(b)});
  const m=pdfModel(),box=$('#pdfsecs');if(!box)return;
  const lbl=sc=>/experience|employment|work|career/i.test(sc.title)?'＋ Add work experience':'＋ Add entry';
  box.innerHTML=m.cols.map((col,ci)=>col.secs.map((sc,si)=>{
    const upOk=sc.head&&si>(col.secs[0].head?0:1),dnOk=sc.head&&si<col.secs.length-1;
    let h=`<div class="secrow" data-sid="${sc.id}"><div class="n">${esc(sc.title)}${m.cols.length>1?`<em>col ${ci+1}</em>`:''}</div><div class="mini"><button data-pa="su" aria-label="Move section up"${upOk?'':' disabled'}>↑</button><button data-pa="sd" aria-label="Move section down"${dnOk?'':' disabled'}>↓</button><button data-pa="sx" aria-label="Delete section"${sc.head?'':' disabled'}>×</button></div></div>`;
    sc.entries.forEach((e,ei)=>{const t=esc(boxText(e.rows[0].lead)).slice(0,60);
      h+=`<div class="secrow sub" data-eid="${e.rows[0].lead.id}"><div class="n" title="${t}">${t}</div><div class="mini"><button data-pa="eu" aria-label="Move entry up"${ei?'':' disabled'}>↑</button><button data-pa="ed" aria-label="Move entry down"${ei<sc.entries.length-1?'':' disabled'}>↓</button><button data-pa="ea" aria-label="Add entry below" title="Add an entry below">＋</button><button data-pa="ex" aria-label="Delete entry">×</button></div></div>`});
    if(sc.entries.length)h+=`<div class="addrow"><button class="chip" data-pa="sa" data-sid="${sc.id}">${lbl(sc)}</button></div>`;
    return h}).join('')).join('');
  const mu=S.pdf.mult||{line:1,item:1,entry:1,sec:1};
  ['line','item','entry','sec'].forEach(k=>{const r=$('#sp-'+k),o=$('#so-'+k);if(r&&document.activeElement!==r){r.value=Math.round(mu[k]*100)}if(o)o.textContent=Math.round(mu[k]*100)+'%'});
  refreshShapesUI();syncUndo();
}
$('#pdfsecs').addEventListener('click',e=>{
  const b=e.target.closest('[data-pa]');if(!b||b.disabled)return;const a=b.dataset.pa;
  const row=b.closest('[data-sid],[data-eid]'),sid=b.dataset.sid||(row&&row.dataset.sid),eid=row&&row.dataset.eid;
  if(a==='su'||a==='sd'){const m=pdfModel(),f=findSec(m,sid);if(f&&f.sec.head)moveSection(f.sec.head.lead.id,a==='su'?-1:1)}
  else if(a==='sx'){const m=pdfModel(),f=findSec(m,sid);if(f&&f.sec.head)deleteSection(f.sec.head.lead.id)}
  else if(a==='sa'){const m=pdfModel(),f=findSec(m,sid);if(f&&f.sec.head)addEntry(f.sec.head.lead.id,'sec',0)}
  else if(a==='eu'||a==='ed')moveEntry(eid,a==='eu'?-1:1);
  else if(a==='ea')addEntry(eid,'entry',1);
  else if(a==='ex')deleteEntry(eid);
});
['line','item','entry','sec'].forEach(k=>{
  const r=$('#sp-'+k);
  r.addEventListener('pointerdown',()=>snapPdf());r.addEventListener('keydown',()=>{if(!r.dataset.k){r.dataset.k=1;snapPdf()}});r.addEventListener('keyup',()=>{delete r.dataset.k});
  r.addEventListener('input',()=>{S.pdf.mult[k]=r.value/100;$('#so-'+k).textContent=r.value+'%';reflow(pdfModel())});
});
$('#b-sp-reset').onclick=()=>{snapPdf();S.pdf.mult={line:1,item:1,entry:1,sec:1};reflow(pdfModel())};
$('#b-pundo').onclick=undoPdf;
/* drag a whole section by the ⇕ handle on its heading */
pdfwrap.addEventListener('pointerdown',e=>{
  const g=e.target.closest('.sgrip');if(!g)return;e.preventDefault();e.stopPropagation();
  const id=g.closest('.tbw').dataset.id,m=pdfModel(),f=findSec(m,id);if(!f||!f.sec.head)return;
  const sec=f.sec,secs=f.col.secs,others=secs.filter(x=>x!==sec),s=scaleNow(),min=secs[0].head?0:1;
  let target=secs.indexOf(sec),line=null;
  const place=ev=>{
    const pgs=$$('.pdfpage',pdfwrap),pi=pgs.findIndex(p=>{const r=p.getBoundingClientRect();return ev.clientY>=r.top&&ev.clientY<=r.bottom});
    if(pi<0)return;const r=pgs[pi].getBoundingClientRect(),fl=m.fm.to(pi,(ev.clientY-r.top)/s);
    target=Math.max(min,others.filter(x=>(x.T+x.B)/2<fl).length);
    const bf=target<others.length?others[target].T-4:others[others.length-1].B+2,loc=m.fm.from(bf);
    if(!line){line=document.createElement('div');line.className='sdrop no-export'}
    pgs[loc.pi].append(line);line.style.top=loc.y+'px';
  };
  const mv=ev=>place(ev);
  const up=()=>{document.removeEventListener('pointermove',mv);document.removeEventListener('pointerup',up);if(line)line.remove();moveSectionTo(m,sec,target)};
  document.addEventListener('pointermove',mv);document.addEventListener('pointerup',up);
});
async function pdfModePDF(){
  if(document.fonts&&document.fonts.ready)await document.fonts.ready;if(document.activeElement)document.activeElement.blur();
  pdfwrap.style.transform='none';const pgs=$$('.pdfpage',pdfwrap);pgs.forEach(p=>{p.style.boxShadow='none'});
  const {jsPDF}=window.jspdf;let pdf=null;
  try{
    for(let i=0;i<pgs.length;i++){
      const cv=await html2canvas(pgs[i],{scale:2,backgroundColor:'#ffffff',useCORS:true,ignoreElements:el=>el.classList&&el.classList.contains('no-export')});
      const w=594.75,h=S.pdf.pages[i].h*.75,o=h>w?'p':'l';
      if(!pdf)pdf=new jsPDF({unit:'pt',format:[w,h],orientation:o});else pdf.addPage([w,h],o);
      pdf.addImage(cv.toDataURL('image/jpeg',.92),'JPEG',0,0,w,h);
    }
  }finally{pgs.forEach(p=>{p.style.boxShadow=''});pdfwrap.style.transform=''}
  return pdf.output('arraybuffer');
}
function buildPdfHTML(){
  const c=pdfwrap.cloneNode(true);$$('.no-export',c).forEach(n=>n.remove());$$('[contenteditable]',c).forEach(n=>n.removeAttribute('contenteditable'));
  const fonts=$('#gfonts').href;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(S.pdf.name)}</title><link rel="stylesheet" href="${fonts}"><style>${PDF_CSS}
*{-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{margin:0;background:#e4e7ec;display:flex;flex-direction:column;align-items:center;padding:24px 0;font-family:sans-serif}
.np{margin-bottom:16px;padding:9px 16px;font:14px sans-serif;cursor:pointer}
@page{size:794px ${S.pdf.pages[0].h}px;margin:0}
@media print{body{background:#fff;padding:0}.np{display:none}.pdfpage{box-shadow:none!important;margin:0!important;break-after:page}}
</style></head><body><button class="np" onclick="window.print()">Print or save as PDF</button>${c.outerHTML}</body></html>`;
}

/* ---------- start ---------- */
const stored=load();if(stored){fresh();S=Object.assign(S,stored);S.pool=stored.pool||{}}else fresh();
buildPanel();render();
const ro=new ResizeObserver(()=>fit());ro.observe(paper);ro.observe(pdfwrap);
window.addEventListener('resize',fit);
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(fit);
