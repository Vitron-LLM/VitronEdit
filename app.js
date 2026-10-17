'use strict';
const demos=window.VITRON_DEMOS;
const names={image:'Image',video:'Video','3d':'3D'};
const viewer=document.querySelector('#viewer');
const PLAY_ICON='<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><polygon points="6,4 20,12 6,20"/></svg>';
const PAUSE_ICON='<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><rect x="5" y="4" width="4" height="16"/><rect x="15" y="4" width="4" height="16"/></svg>';
const PLAYBACK_SPEED={'3d':0.5};
const videoCards=new WeakMap();
const videoObserver=new IntersectionObserver(entries=>entries.forEach(e=>{const s=videoCards.get(e.target);if(!s)return;if(!e.isIntersecting)s.pause();else if(!s.userPaused)s.play();}),{threshold:.25});
const forgetVideoCards=root=>root.querySelectorAll('article').forEach(a=>{videoObserver.unobserve(a);videoCards.get(a)?.pause();});
const escapeHTML=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function media(d,key){const video=d.inputVideo&&d.outputVideo;const label=key==='ref'?'Reference':key==='input'?'Input':'VitronEdit output';const typeLabel=video?'Video':d.modality==='image'?'Image':'Sampled frame';if(key==='ref')return `<div><div class="media-label"><span>${label}</span><span>Image</span></div><div class="media-shell"><img src="${escapeHTML(d.ref)}" alt="Reference image: ${escapeHTML(d.instruction)}" loading="lazy"></div></div>`;if(key==='input'&&d.mask)return `<div><div class="media-label"><span>Input + Mask</span><span>Drag to compare</span></div><div class="media-shell mask-compare" data-mask-compare><img src="${escapeHTML(d.input[0])}" alt="Source image" loading="lazy"><img src="${escapeHTML(d.mask)}" alt="Mask" class="mask-overlay" loading="lazy"><div class="mask-divider"><div class="mask-handle"></div></div></div></div>`;return `<div><div class="media-label"><span>${label}</span><span>${typeLabel}</span></div><div class="media-shell">${video?`<video src="${escapeHTML(d[key+'Video'])}" muted loop playsinline preload="none" aria-label="${key} video: ${escapeHTML(d.instruction)}"></video>`:`<img src="${escapeHTML(d[key][0])}" alt="${key==='input'?'Original':'Edited'} ${names[d.modality]}: ${escapeHTML(d.instruction)}" loading="lazy" data-side="${key}">`}</div></div>`;}
function card(d,featured=false){const el=document.createElement('article');el.className=featured?'featured-card':'demo-card';const hasVideo=d.inputVideo&&d.outputVideo;const pairClass=d.ref?'pair pair-triple':'pair';el.innerHTML=`<div class="demo-top"><h3>"${escapeHTML(d.instruction)}"</h3><span class="tag">${names[d.modality]}</span></div><div class="${pairClass}">${d.ref?media(d,'ref'):''}${media(d,'input')}${media(d,'output')}</div><div class="demo-bottom">${hasVideo?`<div class="video-controls"><button type="button" class="play-btn" data-play aria-label="Play both">${PLAY_ICON}</button><input type="range" min="0" max="100" step="0.1" value="0" aria-label="Seek both videos"></div>`:d.input.length>1?`<label class="frame-control">${d.modality==='3d'?'View':'Frame'} <span data-frame>1 / ${d.input.length}</span><input type="range" min="0" max="${d.input.length-1}" value="0" step="1" aria-label="Compare sampled ${d.modality==='3d'?'views':'frames'}"></label>`:'<span>Paired editing result</span>'}<button class="text-button" type="button" data-expand>View larger</button></div>`;
 const range=el.querySelector('input');if(range&&!hasVideo)range.addEventListener('input',()=>{const i=Number(range.value);el.querySelectorAll('[data-side]').forEach(img=>img.src=d[img.dataset.side][i]);el.querySelector('[data-frame]').textContent=`${i+1} / ${d.input.length}`;});
 if(hasVideo){const videos=[...el.querySelectorAll('video')];const play=el.querySelector('[data-play]');const state={userPaused:false,play:()=>Promise.all(videos.map(v=>v.play())).catch(()=>{}),pause:()=>videos.forEach(v=>v.pause())};videoCards.set(el,state);play.addEventListener('click',()=>{if(videos[0].paused){state.userPaused=false;state.play();}else{state.userPaused=true;state.pause();}});videos[0].addEventListener('play',()=>{play.innerHTML=PAUSE_ICON;play.setAttribute('aria-label','Pause both');});videos[0].addEventListener('pause',()=>{play.innerHTML=PLAY_ICON;play.setAttribute('aria-label','Play both');});const fitRates=()=>{const dur=videos.map(v=>v.duration);if(!dur.every(Number.isFinite))return;const longest=Math.max(...dur);const speed=PLAYBACK_SPEED[d.modality]??1;videos.forEach((v,i)=>{v.defaultPlaybackRate=v.playbackRate=speed*dur[i]/longest;});};videos.forEach(v=>v.addEventListener('loadedmetadata',fitRates));range.addEventListener('input',()=>{videos.forEach(v=>{if(Number.isFinite(v.duration))v.currentTime=v.duration*Number(range.value)/100;});});videos[0].addEventListener('timeupdate',()=>{if(!Number.isFinite(videos[0].duration))return;const p=videos[0].currentTime/videos[0].duration;range.value=100*p;if(videos[0].paused||!Number.isFinite(videos[1].duration))return;const t=p*videos[1].duration;if(Math.abs(videos[1].currentTime-t)>.2)videos[1].currentTime=t;});videos.forEach(v=>v.addEventListener('error',()=>{state.pause();play.disabled=true;}));videoObserver.observe(el);}
 const mc=el.querySelector('[data-mask-compare]');if(mc){const overlay=mc.querySelector('.mask-overlay');const divider=mc.querySelector('.mask-divider');let pos=50;function setPos(p){pos=Math.max(0,Math.min(100,p));overlay.style.clipPath=`inset(0 0 0 ${pos}%)`;divider.style.left=pos+'%';}setPos(50);let dragging=false;function onMove(e){if(!dragging)return;const rect=mc.getBoundingClientRect();const x=(e.touches?e.touches[0].clientX:e.clientX)-rect.left;setPos(x/rect.width*100);}mc.addEventListener('mousedown',e=>{dragging=true;onMove(e);});mc.addEventListener('touchstart',e=>{dragging=true;onMove(e);},{passive:true});document.addEventListener('mousemove',onMove);document.addEventListener('touchmove',onMove,{passive:true});document.addEventListener('mouseup',()=>dragging=false);document.addEventListener('touchend',()=>dragging=false);}
 el.querySelector('[data-expand]').addEventListener('click',()=>{document.querySelector('#viewer-title').textContent=d.instruction;const content=document.querySelector('#viewer-content');content.replaceChildren(card(d,true));content.querySelector('[data-expand]').remove();viewer.showModal();});return el;}
for(const modality of ['image','video','3d']){
  const gallery=document.getElementById(`${modality}-gallery`);
  gallery.replaceChildren(...demos.filter(d=>d.modality===modality).map(d=>card(d)));
}
// Hero tracks open the same paired-media viewer as the gallery.
document.querySelectorAll('[data-hero-demo]').forEach(button=>button.addEventListener('click',()=>{
  const demo=demos.find(d=>d.id===button.dataset.heroDemo);
  document.querySelector('#viewer-title').textContent=demo.instruction;
  const content=document.querySelector('#viewer-content');
  content.replaceChildren(card(demo,true));
  content.querySelector('[data-expand]').remove();
  viewer.showModal();
}));
const editingFlow=document.querySelector('.editing-flow');
const flowToggle=document.querySelector('#toggle-flow');
flowToggle.addEventListener('click',()=>{
  const paused=editingFlow.classList.toggle('is-paused');
  flowToggle.textContent=paused?'Resume animation':'Pause animation';
  flowToggle.setAttribute('aria-pressed',String(paused));
});
// Suspend the loop outside the viewport without changing the user's pause choice.
new IntersectionObserver(entries=>{
  editingFlow.classList.toggle('is-out-of-view',!entries[0].isIntersecting);
}).observe(editingFlow);
document.addEventListener('visibilitychange',()=>{
  editingFlow.classList.toggle('is-page-hidden',document.hidden);
});
document.querySelector('#close-viewer').addEventListener('click',()=>viewer.close());viewer.addEventListener('close',()=>{forgetVideoCards(viewer);document.querySelector('#viewer-content').replaceChildren();});viewer.addEventListener('click',e=>{if(e.target===viewer){const r=viewer.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)viewer.close();}});

// Track section positions after scrolling, resizing, and media loading.
const sectionLinks=[...document.querySelectorAll('.section-nav a')];
const sections=sectionLinks.map(link=>document.querySelector(link.getAttribute('href')));
let sectionUpdateQueued=false;
function updateSectionNavigation(){
  sectionUpdateQueued=false;
  const threshold=window.innerWidth<1500?90:120;
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
