'use strict';
const demos=window.VITRON_DEMOS;
const names={image:'Image',video:'Video','3d':'3D'};
const gallery=document.querySelector('#gallery');
const viewer=document.querySelector('#viewer');
const PLAY_ICON='<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><polygon points="6,4 20,12 6,20"/></svg>';
const PAUSE_ICON='<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><rect x="5" y="4" width="4" height="16"/><rect x="15" y="4" width="4" height="16"/></svg>';
const escapeHTML=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function media(d,key){const video=d.inputVideo&&d.outputVideo;const label=key==='ref'?'Reference':key==='input'?'Input':'VitronEdit output';const typeLabel=video?'Video':d.modality==='image'?'Image':'Sampled frame';if(key==='ref')return `<div><div class="media-label"><span>${label}</span><span>Image</span></div><div class="media-shell"><img src="${escapeHTML(d.ref)}" alt="Reference image: ${escapeHTML(d.instruction)}" loading="lazy"></div></div>`;if(key==='input'&&d.mask)return `<div><div class="media-label"><span>Input + Mask</span><span>Drag to compare</span></div><div class="media-shell mask-compare" data-mask-compare><img src="${escapeHTML(d.input[0])}" alt="Source image" loading="lazy"><img src="${escapeHTML(d.mask)}" alt="Mask" class="mask-overlay" loading="lazy"><div class="mask-divider"><div class="mask-handle"></div></div></div></div>`;return `<div><div class="media-label"><span>${label}</span><span>${typeLabel}</span></div><div class="media-shell">${video?`<video src="${escapeHTML(d[key+'Video'])}" muted playsinline preload="metadata" aria-label="${key} video: ${escapeHTML(d.instruction)}"></video>`:`<img src="${escapeHTML(d[key][0])}" alt="${key==='input'?'Original':'Edited'} ${names[d.modality]}: ${escapeHTML(d.instruction)}" loading="lazy" data-side="${key}">`}</div></div>`;}
function card(d,featured=false){const el=document.createElement('article');el.className=featured?'featured-card':'demo-card';const hasVideo=d.inputVideo&&d.outputVideo;const pairClass=d.ref?'pair pair-triple':'pair';el.innerHTML=`<div class="demo-top"><h3>"${escapeHTML(d.instruction)}"</h3><span class="tag">${names[d.modality]}</span></div><div class="${pairClass}">${d.ref?media(d,'ref'):''}${media(d,'input')}${media(d,'output')}</div><div class="demo-bottom">${hasVideo?`<div class="video-controls"><button type="button" class="play-btn" data-play aria-label="Play both">${PLAY_ICON}</button><input type="range" min="0" max="100" value="0" aria-label="Seek both videos"></div>`:d.input.length>1?`<label class="frame-control">${d.modality==='3d'?'View':'Frame'} <span data-frame>1 / ${d.input.length}</span><input type="range" min="0" max="${d.input.length-1}" value="0" step="1" aria-label="Compare sampled ${d.modality==='3d'?'views':'frames'}"></label>`:'<span>Paired editing result</span>'}<button class="text-button" type="button" data-expand>View larger</button></div>`;
 const range=el.querySelector('input');if(range&&!hasVideo)range.addEventListener('input',()=>{const i=Number(range.value);el.querySelectorAll('[data-side]').forEach(img=>img.src=d[img.dataset.side][i]);el.querySelector('[data-frame]').textContent=`${i+1} / ${d.input.length}`;});
 if(hasVideo){const videos=[...el.querySelectorAll('video')];const play=el.querySelector('[data-play]');let playing=false;const stop=()=>{videos.forEach(v=>v.pause());playing=false;play.innerHTML=PLAY_ICON;};play.addEventListener('click',async()=>{if(playing){stop();return;}try{await Promise.all(videos.map(v=>v.play()));playing=true;play.innerHTML=PAUSE_ICON;}catch{stop();}});range.addEventListener('input',()=>{const duration=Math.min(...videos.map(v=>v.duration));if(Number.isFinite(duration))videos.forEach(v=>v.currentTime=duration*Number(range.value)/100);});videos[0].addEventListener('timeupdate',()=>{if(Number.isFinite(videos[0].duration))range.value=100*videos[0].currentTime/videos[0].duration;if(playing&&Math.abs(videos[1].currentTime-videos[0].currentTime)>.15)videos[1].currentTime=videos[0].currentTime;});videos.forEach(v=>v.addEventListener('ended',stop));videos.forEach(v=>v.addEventListener('error',()=>{stop();play.disabled=true;}));}
 const mc=el.querySelector('[data-mask-compare]');if(mc){const overlay=mc.querySelector('.mask-overlay');const divider=mc.querySelector('.mask-divider');let pos=50;function setPos(p){pos=Math.max(0,Math.min(100,p));overlay.style.clipPath=`inset(0 0 0 ${pos}%)`;divider.style.left=pos+'%';}setPos(50);let dragging=false;function onMove(e){if(!dragging)return;const rect=mc.getBoundingClientRect();const x=(e.touches?e.touches[0].clientX:e.clientX)-rect.left;setPos(x/rect.width*100);}mc.addEventListener('mousedown',e=>{dragging=true;onMove(e);});mc.addEventListener('touchstart',e=>{dragging=true;onMove(e);},{passive:true});document.addEventListener('mousemove',onMove);document.addEventListener('touchmove',onMove,{passive:true});document.addEventListener('mouseup',()=>dragging=false);document.addEventListener('touchend',()=>dragging=false);}
 el.querySelector('[data-expand]').addEventListener('click',()=>{document.querySelector('#viewer-title').textContent=d.instruction;const content=document.querySelector('#viewer-content');content.replaceChildren(card(d,true));content.querySelector('[data-expand]').remove();viewer.showModal();});return el;}
const PAGE_SIZE=6;
let currentFilter='all';
let currentPage=0;
function render(filter,page){
  if(filter!==undefined)currentFilter=filter;
  if(page!==undefined)currentPage=page;
  gallery.querySelectorAll('video').forEach(v=>v.pause());
  const list=demos.filter(d=>currentFilter==='all'||d.modality===currentFilter);
  const totalPages=Math.ceil(list.length/PAGE_SIZE);
  if(currentPage>=totalPages)currentPage=totalPages-1;
  if(currentPage<0)currentPage=0;
  const start=currentPage*PAGE_SIZE;
  const pageItems=list.slice(start,start+PAGE_SIZE);
  gallery.replaceChildren(...pageItems.map(d=>card(d)));
  document.querySelector('#demo-count').textContent=`${list.length} editing demonstrations`;
  document.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.filter===currentFilter)));
  const pager=document.querySelector('#pager');
  if(totalPages>1){
    pager.style.display='';
    pager.querySelector('[data-prev]').disabled=currentPage===0;
    pager.querySelector('[data-next]').disabled=currentPage===totalPages-1;
    pager.querySelector('[data-page-info]').textContent=`${currentPage+1} / ${totalPages}`;
  }else{pager.style.display='none';}
}
document.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>render(b.dataset.filter,0)));
document.querySelector('[data-prev]').addEventListener('click',()=>{render(undefined,currentPage-1);document.querySelector('#demos').scrollIntoView({behavior:'smooth'});});
document.querySelector('[data-next]').addEventListener('click',()=>{render(undefined,currentPage+1);document.querySelector('#demos').scrollIntoView({behavior:'smooth'});});
document.querySelector('#featured').append(card(demos.find(d=>d.id==='panda')||demos[0],true));render('all',0);
document.querySelector('#close-viewer').addEventListener('click',()=>viewer.close());viewer.addEventListener('close',()=>{viewer.querySelectorAll('video').forEach(v=>v.pause());document.querySelector('#viewer-content').replaceChildren();});viewer.addEventListener('click',e=>{if(e.target===viewer){const r=viewer.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)viewer.close();}});

// Track section positions after scrolling, resizing, and demo filtering.
const sectionLinks=[...document.querySelectorAll('.section-nav a')];
const sections=sectionLinks.map(link=>document.querySelector(link.getAttribute('href')));
let sectionUpdateQueued=false;
function updateSectionNavigation(){
  sectionUpdateQueued=false;
  const threshold=window.innerWidth<1000?90:120;
  let current=0;
  sections.forEach((section,index)=>{if(section.getBoundingClientRect().top<=threshold)current=index;});
  if(window.scrollY>0&&window.scrollY+window.innerHeight>=document.documentElement.scrollHeight-3)current=sections.length-1;
  sectionLinks.forEach((link,index)=>{if(index===current)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');});
}
function queueSectionUpdate(){if(!sectionUpdateQueued){sectionUpdateQueued=true;requestAnimationFrame(updateSectionNavigation);}}
window.addEventListener('scroll',queueSectionUpdate,{passive:true});
window.addEventListener('resize',queueSectionUpdate);
window.addEventListener('load',queueSectionUpdate);
new ResizeObserver(queueSectionUpdate).observe(document.querySelector('main'));
updateSectionNavigation();
