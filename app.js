'use strict';
const demos=window.VITRON_DEMOS;
const names={image:'Image',video:'Video','3d':'3D'};
const gallery=document.querySelector('#gallery');
const viewer=document.querySelector('#viewer');
const escapeHTML=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function media(d,key){const video=d.inputVideo&&d.outputVideo;return `<div><div class="media-label"><span>${key==='input'?'Input':'Vitron-E output'}</span><span>${video?'Video':d.modality==='image'?'Image':'Sampled frame'}</span></div><div class="media-shell">${video?`<video src="${escapeHTML(d[key+'Video'])}" poster="${escapeHTML(d[key][0])}" muted playsinline preload="none" aria-label="${key} video: ${escapeHTML(d.instruction)}"></video>`:`<img src="${escapeHTML(d[key][0])}" alt="${key==='input'?'Original':'Edited'} ${names[d.modality]}: ${escapeHTML(d.instruction)}" loading="lazy" data-side="${key}">`}</div></div>`;}
function card(d,featured=false){const el=document.createElement('article');el.className=featured?'featured-card':'demo-card';const hasVideo=d.inputVideo&&d.outputVideo;el.innerHTML=`<div class="demo-top"><h3>“${escapeHTML(d.instruction)}”</h3><span class="tag">${names[d.modality]}</span></div><div class="pair">${media(d,'input')}${media(d,'output')}</div><div class="demo-bottom">${hasVideo?'<div class="video-controls"><button type="button" data-play>Play both</button><input type="range" min="0" max="100" value="0" aria-label="Seek both videos"></div>':d.input.length>1?`<label class="frame-control">${d.modality==='3d'?'View':'Frame'} <span data-frame>1 / ${d.input.length}</span><input type="range" min="0" max="${d.input.length-1}" value="0" step="1" aria-label="Compare sampled ${d.modality==='3d'?'views':'frames'}"></label>`:'<span>Paired editing result</span>'}<button class="text-button" type="button" data-expand>View larger</button></div>`;
 const range=el.querySelector('input');if(range&&!hasVideo)range.addEventListener('input',()=>{const i=Number(range.value);el.querySelectorAll('[data-side]').forEach(img=>img.src=d[img.dataset.side][i]);el.querySelector('[data-frame]').textContent=`${i+1} / ${d.input.length}`;});
 if(hasVideo){const videos=[...el.querySelectorAll('video')];const play=el.querySelector('[data-play]');let playing=false;const stop=()=>{videos.forEach(v=>v.pause());playing=false;play.textContent='Play both';};play.addEventListener('click',async()=>{if(playing){stop();return;}try{await Promise.all(videos.map(v=>v.play()));playing=true;play.textContent='Pause both';}catch{stop();play.textContent='Retry playback';}});range.addEventListener('input',()=>{const duration=Math.min(...videos.map(v=>v.duration));if(Number.isFinite(duration))videos.forEach(v=>v.currentTime=duration*Number(range.value)/100);});videos[0].addEventListener('timeupdate',()=>{if(Number.isFinite(videos[0].duration))range.value=100*videos[0].currentTime/videos[0].duration;if(playing&&Math.abs(videos[1].currentTime-videos[0].currentTime)>.15)videos[1].currentTime=videos[0].currentTime;});videos.forEach(v=>v.addEventListener('ended',stop));videos.forEach(v=>v.addEventListener('error',()=>{stop();play.textContent='Video unavailable';play.disabled=true;}));}
 el.querySelector('[data-expand]').addEventListener('click',()=>{document.querySelector('#viewer-title').textContent=d.instruction;const content=document.querySelector('#viewer-content');content.replaceChildren(card(d,true));content.querySelector('[data-expand]').remove();viewer.showModal();});return el;}
function render(filter){gallery.querySelectorAll('video').forEach(v=>v.pause());const list=demos.filter(d=>filter==='all'||d.modality===filter);gallery.replaceChildren(...list.map(d=>card(d)));document.querySelector('#demo-count').textContent=`${list.length} editing demonstrations`;document.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.filter===filter)));}
document.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>render(b.dataset.filter)));
document.querySelector('#featured').append(card(demos.find(d=>d.id==='panda')||demos[0],true));render('all');
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
