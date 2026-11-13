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

(function siteUpgrade() {
  const PAGE_SIZE = 36;
  const PICKS = new Map(Object.entries({
    "exiftool":36,"wayback machine":35,"openstreetmap":34,"sherlock":32,
    "theharvester":32,"spiderfoot":32,"virustotal":30,"shodan":29,
    "censys":29,"crt.sh":31,"urlscan.io":29,"wikimedia commons":29,
    "wikidata":29,"bellingcat":30,"amass":28,"subfinder":28,
    "maigret":28,"google earth":28,"opencorporates":27,
    "wireshark":28,"have i been pwned":30,"tineye":28,"dnsdumpster":28
  }));
  let currentMatches = [], currentShown = 0;
  const safeURL = raw => {
    try { const u = new URL(raw); return ["http:","https:"].includes(u.protocol) ? u.href : null; }
    catch { return null; }
  };
  const normalized = s => String(s || "").trim().toLowerCase();
  const arrays = t => [
    t.name,t.category,t.categoryPath,...(t.categories||[]),...(t.categoryPaths||[]),
    t.summary,t.description,t.when,t.where,t.input,t.output,...(t.tags||[]),
    ...(t.uses||[]),...(t.restrictions||[])
  ].filter(Boolean);
  const pickBonus = t => PICKS.get(normalized(t.name)) || 0;
  function quality(t) {
    let points = 20 + pickBonus(t);
    if (t.independentLinkVerified === true) points += 10;
    if (t.requiresRegistration === false) points += 7;
    if (safeURL(t.docs) && safeURL(t.docs) !== safeURL(t.url)) points += 6;
    if (/^https:\/\/github\.com\//i.test(t.url||"")) points += 5;
    if ((t.how||[]).length >= 4) points += 4;
    if ((t.uses||[]).length >= 2) points += 3;
    return points;
  }
  function relevance(t, words) {
    if (!words.length) return 0;
    const name = normalized(t.name), phrase=words.join(" ");
    const cats=normalized([t.category,t.categoryPath,...t.categories].join(" "));
    const tags=normalized((t.tags||[]).join(" "));
    const summary=normalized(t.summary);
    let score = name===phrase ? 500 : name.startsWith(phrase) ? 300 : name.includes(phrase) ? 200 : 0;
    for (const w of words) {
      score += name===w ? 100 : name.startsWith(w) ? 85 : name.includes(w) ? 70 : 0;
      if (cats.includes(w)) score+=35;
      if (tags.includes(w)) score+=22;
      if (summary.includes(w)) score+=12;
    }
    return score;
  }
  const more = document.createElement("button");
  more.id="loadMore"; more.className="load-more";
  more.type="button";
  $("tools").after(more);
  function makeCard(t) {
    const article=document.createElement("article");article.className="tile";
    const top=document.createElement("div");top.className="tile-top";
    const pricing=document.createElement("span");pricing.className=`pill ${t.pricing==="freemium"?"paid":""}`;
    pricing.textContent=t.pricing==="free"?"100% Free (listed)":"Free tier + paid";
    top.append(pricing);
    if (pickBonus(t)) {
      const pick=document.createElement("span");pick.className="pill editor-pick";pick.textContent="Editor's pick";
      pick.title="Editorially selected, not an uptime or safety certification";top.append(pick);
    }
    const star=document.createElement("button");star.type="button";
    star.className=`star ${favorites.has(t.id)?"active":""}`;
    star.textContent=favorites.has(t.id)?"★":"☆";
    star.setAttribute("aria-label",favorites.has(t.id)?"Remove favorite":"Add favorite");
    star.onclick=()=>{favorites.has(t.id)?favorites.delete(t.id):favorites.add(t.id);saveFavorites();render();};
    top.append(star);
    const h=document.createElement("h3");h.textContent=t.name;
    const cat=document.createElement("span");cat.className="cat";cat.textContent=t.categoryPath||t.category;
    const desc=document.createElement("p");desc.textContent=t.summary||t.description||"";
    const btn=document.createElement("button");btn.type="button";btn.className="learn";btn.textContent="View full guide →";
    btn.onclick=()=>showGuide(t);
    article.append(top,h,cat,desc,btn);return article;
  }
  function loadNext() {
    const fragment=document.createDocumentFragment();
    const batch=currentMatches.slice(currentShown,currentShown+PAGE_SIZE);
    for(const t of batch)fragment.append(makeCard(t));
    $("tools").append(fragment);
    currentShown+=batch.length;
    more.hidden=currentShown>=currentMatches.length;
    more.textContent=`Show more (${(currentMatches.length-currentShown).toLocaleString()} remaining)`;
  }
  more.onclick=loadNext;
  render = function() {
    const words=normalized(query).split(/\s+/).filter(Boolean);
    currentMatches=tools.filter(t=>
      t.pricing===mode &&
      (category==="all"||t.categories.includes(category)) &&
      (!favoritesOnly||favorites.has(t.id)) &&
      words.every(w=>t._search.includes(w))
    );
    currentMatches.sort((a,b)=>
      relevance(b,words)-relevance(a,words) ||
      b._quality-a._quality || a.name.localeCompare(b.name)
    );
    currentShown=0;$("tools").replaceChildren();loadNext();
    $("empty").hidden=currentMatches.length>0;
    $("count").textContent=`${currentMatches.length.toLocaleString()} matches · ${words.length?"best match first":"recommended first"}`;
    $("modeToggle").classList.toggle("on",mode==="freemium");
    $("modeToggle").setAttribute("aria-checked",String(mode==="freemium"));
    $("modeToggle").setAttribute("aria-label",mode==="free"?"Show freemium tools":"Show free tools");
    $("freeText").classList.toggle("selected",mode==="free");
    $("paidText").classList.toggle("selected",mode==="freemium");
    document.querySelectorAll(".category-chip").forEach(b=>{
      const selected=b.dataset.cat===category;
      b.classList.toggle("active",selected);b.setAttribute("aria-pressed",String(selected));
    });
  };
  showGuide = function(t) {
    $("detailTitle").textContent=t.name;
    $("detailCat").textContent=`${t.categoryPath||t.category} • ${t.type||""}`;
    const line=(label,value)=>value?`<p><strong>${escapeHTML(label)}:</strong> ${escapeHTML(value)}</p>`:"";
    const bullets=(values,ordered=false)=> {
      const tag=ordered?"ol":"ul";
      return `<${tag}>${(values||[]).map(v=>`<li>${escapeHTML(v)}</li>`).join("")}</${tag}>`;
    };
    $("detailBody").innerHTML=`
      <p>${escapeHTML(t.description||t.summary||"")}</p>
      ${line("Input",t.input)}${line("Output",t.output)}${line("Research mode",t.opsec)}
      <h3>When should I use it?</h3><p>${escapeHTML(t.when)}</p>
      <h3>Where does it work?</h3><p>${escapeHTML(t.where)}</p>
      <h3>How to get started</h3>${bullets(t.how,true)}
      <h3>Practical use cases</h3>${bullets(t.uses)}
      <h3>Restrictions and limitations</h3>${bullets(t.restrictions)}
      <h3>Pricing and source status</h3><p>${escapeHTML(t.pricingNote)}</p>
      <p class="meta">${escapeHTML(t.statusSource||"Status unknown")}. ${t.independentLinkVerified?"Link independently checked":"Link not independently live-tested"}. Imported ${escapeHTML(t.imported||"date unknown")}.</p>
      <div id="guideActions"></div>`;
    const links=$("guideActions");
    for(const [label,raw] of [["Official website / project",t.url],["Documentation",t.docs]]) {
      const url=safeURL(raw);if(!url)continue;
      if(label==="Documentation"&&url===safeURL(t.url))continue;
      const a=document.createElement("a");a.className="actionlink";a.href=url;
      a.target="_blank";a.rel="noopener noreferrer";a.textContent=label+" ↗";links.append(a);
    }
    $("detail").showModal();
  };
  function categoryChips() {
    const counts=new Map();
    for(const t of tools)for(const c of t.categories)counts.set(c,(counts.get(c)||0)+1);
    const primary=[...counts.entries()].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).slice(0,10).map(x=>x[0]);
    const box=document.createElement("div");
    box.className="category-chips";box.setAttribute("aria-label","Quick category filters");
    for(const c of ["all",...primary]) {
      const b=document.createElement("button");b.type="button";b.className="category-chip";
      b.dataset.cat=c;b.textContent=c==="all"?"All tools":c;
      b.onclick=()=>{category=c;$("category").value=c;render();};box.append(b);
    }
    document.querySelector(".filters").after(box);
  }
  init = async function() {
    try {
      const response=await fetch("./tools.json",{cache:"no-cache"});
      if(!response.ok)throw Error("Catalog unavailable");
      const data=await response.json();if(!Array.isArray(data))throw Error("Invalid data");
      tools=data.filter(t=>t&&["free","freemium"].includes(t.pricing)&&safeURL(t.url))
        .map(t=>({...t,
          categories:Array.isArray(t.categories)?t.categories:[t.category],
          tags:t.tags||[],uses:t.uses||[],how:t.how||[],restrictions:t.restrictions||[],
          _search:arrays(t).join(" ").toLowerCase(),_quality:quality(t)
        }));
      const categories=[...new Set(tools.flatMap(t=>t.categories))].sort();
      for(const c of categories) {
        const o=document.createElement("option");o.value=c;o.textContent=c;$("category").append(o);
      }
      categoryChips();
      render();
    }catch(err){
      $("count").textContent="Could not load catalog";
      $("empty").hidden=false;
      $("empty").textContent="Unable to load the catalog. Use GitHub Pages or start a local web server.";
    }
    if("serviceWorker" in navigator && location.protocol==="https:")navigator.serviceWorker.register("./sw.js").catch(()=>{});
  };
})();
init();
