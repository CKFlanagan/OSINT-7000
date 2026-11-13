'use strict';
const $=id=>document.getElementById(id);
const favorites=new Set(JSON.parse(localStorage.getItem('osint7000-favorites')||'[]'));
let tools=[],mode='free',query='',category='all',favoritesOnly=false;
const escapeHTML=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function saveFavorites(){localStorage.setItem('osint7000-favorites',JSON.stringify([...favorites]));}
function render(){
 const active=tools.filter(t=>t.pricing===mode&& (category==='all'||t.category===category) && (!favoritesOnly||favorites.has(t.id)) && [t.name,t.category,t.summary,t.description,t.when,t.where,t.tags.join(' '),t.uses.join(' '),t.restrictions.join(' ')].join(' ').toLowerCase().includes(query));
 $('tools').replaceChildren();
 active.forEach(t=>{
  const card=document.createElement('article');card.className='tile';
  card.innerHTML=`<div class="tile-top"><span class="pill ${t.pricing==='freemium'?'paid':''}">${t.pricing==='free'?'100% Free':'Free tier + Paid'}</span><button class="star ${favorites.has(t.id)?'active':''}" aria-label="${favorites.has(t.id)?'Remove favorite':'Add favorite'}" title="Favorite">${favorites.has(t.id)?'★':'☆'}</button></div><h3>${escapeHTML(t.name)}</h3><span class="cat">${escapeHTML(t.category)}</span><p>${escapeHTML(t.summary)}</p><button class="learn">View full guide →</button>`;
  card.querySelector('.star').onclick=()=>{favorites.has(t.id)?favorites.delete(t.id):favorites.add(t.id);saveFavorites();render();};
  card.querySelector('.learn').onclick=()=>showGuide(t);
  $('tools').append(card);
 });
 $('empty').hidden=active.length!==0;
 $('count').textContent=`${active.length} of ${tools.filter(t=>t.pricing===mode).length} tools`;
 $('modeToggle').classList.toggle('on',mode==='freemium');
 $('modeToggle').setAttribute('aria-checked',String(mode==='freemium'));
 $('modeToggle').setAttribute('aria-label',mode==='free'?'Show freemium and paid-tier tools':'Show completely free tools');
 $('freeText').classList.toggle('selected',mode==='free');
 $('paidText').classList.toggle('selected',mode==='freemium');
}
function bulletList(items,ordered=false){const tag=ordered?'ol':'ul';return `<${tag}>${items.map(x=>`<li>${escapeHTML(x)}</li>`).join('')}</${tag}>`;}
function showGuide(t){
 $('detailCat').textContent=`${t.category} • ${t.type}`;$('detailTitle').textContent=t.name;
 $('detailBody').innerHTML=`<p>${escapeHTML(t.description)}</p><h3>When should I use it?</h3><p>${escapeHTML(t.when)}</p><h3>Where does it work?</h3><p>${escapeHTML(t.where)}</p><h3>How to get started</h3>${bulletList(t.how,true)}<h3>Practical use cases</h3>${bulletList(t.uses)}<h3>Restrictions and limitations</h3>${bulletList(t.restrictions)}<h3>Pricing details</h3><p>${escapeHTML(t.pricingNote)}</p><p class="meta">Last reviewed: ${escapeHTML(t.verified)}. Verify current terms on the official site.</p><a class="actionlink" target="_blank" rel="noopener noreferrer" href="${encodeURI(t.url)}">Official website ↗</a><a class="actionlink" target="_blank" rel="noopener noreferrer" href="${encodeURI(t.docs)}">Documentation ↗</a>`;
 $('detail').showModal();
}
$('close').onclick=()=>$('detail').close();
$('detail').addEventListener('click',e=>{if(e.target===$('detail'))$('detail').close();});
$('search').addEventListener('input',e=>{query=e.target.value.trim().toLowerCase();render();});
$('clear').onclick=()=>{$('search').value='';query='';render();$('search').focus();};
$('category').onchange=e=>{category=e.target.value;render();};
$('favoritesOnly').onchange=e=>{favoritesOnly=e.target.checked;render();};
$('modeToggle').onclick=()=>{mode=mode==='free'?'freemium':'free';localStorage.setItem('osint7000-mode',mode);render();};
async function init(){
 try{const response=await fetch('./tools.json');if(!response.ok)throw Error('Unable to load data');tools=await response.json();
  const categories=[...new Set(tools.map(x=>x.category))].sort();for(const c of categories){const o=document.createElement('option');o.value=c;o.textContent=c;$('category').append(o);}
  mode=localStorage.getItem('osint7000-mode')==='freemium'?'freemium':'free';render();
 }catch(e){$('empty').hidden=false;$('empty').textContent='Could not load tools. Open with a local web server (python3 -m http.server), not by double-clicking index.html.';}
 if('serviceWorker'in navigator&&location.protocol==='https:')navigator.serviceWorker.register('./sw.js').catch(()=>{});
}
init();
