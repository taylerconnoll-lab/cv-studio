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
{const st=document.createElement('style');st.id='cvcss';st.textContent=CV_CSS;document.head.append(st)}

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
const paper=$('#paper'), stage=$('#stage');
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
function render(){
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
  stage.style.height=Math.ceil(paper.offsetHeight*s)+'px';
  const g=$('#guides'); g.innerHTML='';
  const h=paper.offsetHeight;
  for(let k=1;k*1123<h-4;k++){const i=document.createElement('i');i.style.top=(k*1123*s)+'px';g.append(i)}
}

/* ---------- editing on the sheet ---------- */
function syncEl(el){
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
  if(h&&paper.contains(h))saved=r.cloneRange();
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
    $$('font[size="7"],span[style*="xxx-large"]',paper).forEach(f=>{
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
const fname=()=>(plain(S.header.name).replace(/[^\w\- ]+/g,'').trim().replace(/\s+/g,'_')||'CV')+'_CV';

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
  finally{paper.style.transform='';paper.style.boxShadow='';btn.disabled=false;btn.textContent='Save as PDF';fit()}
}
function buildHTML(){
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

/* ---------- start ---------- */
const stored=load();if(stored){fresh();S=Object.assign(S,stored);S.pool=stored.pool||{}}else fresh();
buildPanel();render();
new ResizeObserver(()=>fit()).observe(paper);
window.addEventListener('resize',fit);
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(fit);
