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
  const semanticSearch = (function searchFactory(){
  const stop=new Set("a an the and or but for with without in on at to of by is are was were be been it its this that those these i me my you your we they us from how what where which who when can do does have has want need please find finding look looking search searching tool tools using use get show tell give across multiple different many any some available best right good related about information info public online".split(" "));
  const norm=s=>String(s??"").normalize("NFKD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
  const stem=s=>s.length>5&&s.endsWith("ies")?s.slice(0,-3)+"y":s.length>4&&s.endsWith("s")&&!s.endsWith("ss")?s.slice(0,-1):s;
  const words=s=>norm(s).split(/\s+/).filter(Boolean).map(stem).filter(w=>w.length>1&&!stop.has(w));
  const synonyms=[
    "archive history historical snapshot wayback cached previous old",
    "username handle alias account profile",
    "image picture photo photograph",
    "metadata exif geotag embedded",
    "map geolocation gps coordinate location",
    "domain dns subdomain hostname",
    "certificate ssl tls crt",
    "breach leak compromised exposed",
    "malware virus threat hash",
    "company business corporate corporation",
    "satellite imagery earth aerial",
    "document pdf file"
  ].map(x=>[...new Set(words(x))]);
  const intents=[
    {name:"website archives",test:[/\b(old|past|previous|earlier|historical|archived|deleted)\b.*\b(websites?|webpages?|pages?|sites?|urls?)\b/,/\b(websites?|webpages?|sites?|urls?)\b.*\b(old|history|archive|previous|snapshot|20\d\d|19\d\d)\b/,/\b(wayback|web history|archived page)\b/],terms:"wayback archive snapshot historical webpage",picks:["wayback machine"]},
    {name:"username research",test:[/\b(usernames?|handles?|aliases|nicknames?)\b/,/\b(social|online)\b.*\b(profiles?|accounts?)\b/],terms:"username profile sherlock account handle",picks:["sherlock"]},
    {name:"image metadata",test:[/\b(photo|image|picture|file)\b.*\b(metadata|exif|geotag|gps|taken|camera)\b/,/\b(metadata|exif|geotag)\b.*\b(image|photo|picture|file)\b/],terms:"exif metadata geotag photo",picks:["exiftool"]},
    {name:"reverse image search",test:[/\b(reverse|origin|source|similar)\b.*\b(photo|picture|image)\b/,/\b(photo|picture|image)\b.*\b(reverse|origin|source)\b/],terms:"reverse image tineye similar",picks:["tineye"]},
    {name:"domain research",test:[/\b(domain|domains|website)\b.*\b(dns|subdomains?|records?|ownership|whois)\b/,/\b(dns|subdomains?|whois)\b/],terms:"domain dns subdomain whois",picks:["crt.sh","theharvester"]},
    {name:"certificate transparency",test:[/\b(ssl|tls|certificates?|https)\b.*\b(domain|search|transparency)\b/,/\b(certificate transparency|crt sh)\b/],terms:"certificate crt transparency domain",picks:["crt.sh"]},
    {name:"geographic imagery",test:[/\b(satellite|aerial)\b.*\b(photos?|pictures?|images?|maps?|imagery)\b/,/\b(map|earth)\b.*\b(satellite|aerial)\b/],terms:"satellite imagery earth map",picks:["google earth","openstreetmap"]},
    {name:"breach awareness",test:[/\b(email|password|account)\b.*\b(breach|leak|exposed|compromised)\b/,/\b(breach|leak)\b.*\b(email|account|password)\b/],terms:"breach leak exposed email",picks:["have i been pwned"]},
    {name:"public business records",test:[/\b(company|business|corporation)\b.*\b(owner|ownership|registry|register|directors?|records?)\b/,/\b(who owns)\b.*\b(company|business)\b/],terms:"company business registry corporate",picks:["opencorporates"]},
    {name:"malware analysis",test:[/\b(file|url|hash|attachment)\b.*\b(malware|virus|suspicious|threat|safe)\b/,/\b(malware|virus|threat)\b.*\b(file|hash|scan)\b/],terms:"malware hash virustotal threat",picks:["virustotal"]}
  ];
  let docs=[],idf=new Map(),vocab=new Set(),corrections=new Map();
  function distance(a,b,max){
    if(Math.abs(a.length-b.length)>max)return max+1;
    let row=Array.from({length:b.length+1},(_,j)=>j);
    for(let i=1;i<=a.length;i++){
      const next=[i];let low=i;
      for(let j=1;j<=b.length;j++){next[j]=Math.min(next[j-1]+1,row[j]+1,row[j-1]+(a[i-1]===b[j-1]?0:1));low=Math.min(low,next[j]);}
      if(low>max)return max+1;row=next;
    }
    return row[b.length];
  }
  function typo(w){
    if(vocab.has(w)||w.length<4)return[];
    if(corrections.has(w))return corrections.get(w);
    const max=w.length>=9?2:1;
    const result=[];
    for(const candidate of vocab)if(candidate.slice(0,2)===w.slice(0,2)&&Math.abs(candidate.length-w.length)<=max){
      const d=distance(w,candidate,max);if(d<=max)result.push([candidate,d]);
    }
    result.sort((a,b)=>a[1]-b[1]||a[0].localeCompare(b[0]));
    const corrected=result.slice(0,3).map(x=>x[0]);corrections.set(w,corrected);return corrected;
  }
  function build(tools){
    const df=new Map();vocab=new Set();corrections=new Map();
    docs=tools.map(t=>{
      const tf=new Map();
      function add(text,weight,primary=false){
        for(const w of words(Array.isArray(text)?text.join(" "):text)){tf.set(w,(tf.get(w)||0)+weight);if(primary)vocab.add(w);}
      }
      add(t.name,8,true);add(t.category,4.5,true);add(t.categoryPath,3.5,true);
      add(t.categories||[],3,true);add(t.tags||[],4,true);add(t.summary,2.8,true);
      add(t.when,1.4);add(t.input,1.2);add(t.output,1.2);
      if(norm(t.description)!==norm(t.summary))add(t.description,0.8);
      add(t.uses||[],0.5);
      for(const w of tf.keys())df.set(w,(df.get(w)||0)+1);
      return {tool:t,tf,title:norm(t.name),strong:norm([t.name,t.category,t.categoryPath,(t.tags||[]).join(" "),t.summary].join(" "))};
    });
    idf=new Map([...df].map(([w,f])=>[w,Math.log(1+(docs.length-f+0.5)/(f+0.5))]));
  }
  function search(input){
    const raw=norm(input),orig=[...new Set(words(raw))];
    if(!orig.length)return docs.map(d=>({id:d.tool.id,score:0,reason:""}));
    const active=intents.filter(c=>c.test.some(re=>re.test(raw)));
    const expanded=new Map(), put=(w,value)=>{w=stem(w);if(!stop.has(w))expanded.set(w,Math.max(value,expanded.get(w)||0));};
    for(const w of orig){
      put(w,4);
      for(const group of synonyms)if(group.includes(w))for(const member of group)if(member!==w)put(member,0.48);
      for(const correction of typo(w))put(correction,2.8);
    }
    for(const c of active)for(const w of words(c.terms))put(w,1.7);
    const results=[];
    for(const d of docs){
      let score=0,direct=0,related=0;
      for(const [w,weight] of expanded){
        const tf=d.tf.get(w)||0;if(!tf)continue;
        score+=weight*(idf.get(w)||0.15)*(1.8*tf/(tf+3.2));
        if(orig.includes(w))direct++;else related++;
      }
      for(const c of active){
        const hits=words(c.terms).reduce((n,w)=>n+(d.strong.includes(w)?1:0),0);
        if(hits>=2)score+=Math.min(24,hits*4.2);
        if(c.picks.some(name=>d.title===name||d.title.startsWith(name+" ")))score+=32;
      }
      if(d.title===raw)score+=150;
      else if(d.title.startsWith(raw))score+=78;
      else if(raw.length>=5&&d.title.includes(raw))score+=45;
      else if(raw.length>=7&&d.strong.includes(raw))score+=11;
      if(direct>=2)score+=7+Math.min(6,direct*1.5);
      if(!direct&&!related&&!active.some(c=>c.picks.some(name=>d.title.startsWith(name))))continue;
      if(score<1.2)continue;
      results.push({id:d.tool.id,score,reason:direct?"Keyword match":active.length?"Related: "+active[0].name:"Related terms"});
    }
    results.sort((a,b)=>b.score-a.score||a.id.localeCompare(b.id));
    return results;
  }
  return {build,search};
})();
  let includeUnverified = false;
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
    pricing.textContent=t.pricing==="unknown"?"Not verified":t.pricing==="free"?"100% Free (source-listed)":"Free tier + paid (source-listed)";
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
    article.append(top,h,cat,desc);
    if(query && t._matchReason && t._matchReason!=="Keyword match") {
      const hint=document.createElement("small");hint.className="related-note";hint.textContent=t._matchReason;article.append(hint);
    }
    article.append(btn);return article;
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
    const scored=semanticSearch.search(query);
    const ranks=new Map(scored.map((hit,index)=>[hit.id,{index,reason:hit.reason}]));
    currentMatches=tools.filter(t=>(t.pricing===mode || (includeUnverified && t.pricing==="unknown")) &&
      (category==="all"||t.categories.includes(category)) &&
      (!favoritesOnly||favorites.has(t.id)) &&
      (!words.length||ranks.has(t.id)));
    currentMatches.sort((a,b)=>words.length
      ? ranks.get(a.id).index-ranks.get(b.id).index
      : b._quality-a._quality||a.name.localeCompare(b.name));
    for(const t of currentMatches)t._matchReason=words.length?ranks.get(t.id)?.reason:"";
    currentShown=0;$("tools").replaceChildren();loadNext();
    $("empty").hidden=currentMatches.length>0;
    $("count").textContent=`${currentMatches.length.toLocaleString()} matches · ${words.length?"smart relevance":"recommended first"}`;
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
    if(t.sourceRepository){
      const area=$("guideActions");
      const p=document.createElement("p");p.className="meta";
      p.textContent="Imported reference: "+t.sourceRepository+" (source collection: "+(t.sourceLicense||"license not recorded")+"). Provider licensing and status may differ.";
      area.append(p);
      const source=document.createElement("a");source.className="actionlink";
      source.href="https://github.com/"+t.sourceRepository;source.target="_blank";source.rel="noopener noreferrer";
      source.textContent="Source collection ↗";area.append(source);
    }
    $("detail").showModal();
  };
  function categoryChips() {
    const counts=new Map();
    for(const t of tools.filter(t=>t.pricing!=="unknown"))for(const c of t.categories)counts.set(c,(counts.get(c)||0)+1);
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
  function decorateImported(t) {
    if(t.reviewStatus!=="needs-review")return t;
    const label=t.sourceCategory||t.category;
    const github=/^https:\/\/github\.com\//i.test(t.url);
    return {...t,
      type:github?"Public GitHub project":"Online OSINT reference",
      description:(t.summary||"")+" This is an imported discovery listing. Check the linked official source for full capabilities and current availability.",
      when:"Use as a starting point for authorized research related to "+label+". Independently confirm that the tool supports your intended task.",
      where:github?"Open its GitHub page and review the setup instructions, supported systems, and maintenance status.":"Open the linked provider page in a browser; mobile support and login requirements are unknown.",
      how:["Open the official tool link, and confirm the service or repository is still available.","Read its documentation, license, current pricing, supported inputs, and usage limits.","Start with a permitted public query or your own authorized research materials.","Review the available results without assuming they are complete or accurate.","Confirm significant findings against an independent public source, noting the date and original URL."],
      uses:["Discover tools for public-source research in "+label+".","Compare this resource with other options in the same category.","Cross-check public observations rather than treating a single result as proof."],
      restrictions:[t.pricing==="unknown"?"Pricing and free access are not confirmed; this entry is included only when you enable unverified candidates.":"The cost tier comes from a recent community list and is not independently confirmed.","This URL has not been live-tested; it may have changed or become unavailable.","Third-party costs, account requirements, rate limits, geographic restrictions, or API quotas may apply.","Respect privacy, consent, applicable laws, and the provider's terms. Do not access private accounts."],
      tags:[t.sourceCategory||"",t.category||"","unverified"],
      docs:t.url,pricingNote:t.pricing==="unknown"?"Pricing unverified. A free tier must not be assumed.":t.pricing==="free"?"A recent source directory labels this as free/open-source; check actual provider and dependency costs.":"A recent source directory labels this freemium; confirm current plan limits.",
      statusSource:"Imported from "+(t.sourceRepository||"an external source")+". Link not independently checked.",
      imported:t.imported||"2026-11-13"
    };
  }
  function addReviewControl() {
    const label=document.createElement("label");label.className="review-optin";
    const check=document.createElement("input");check.type="checkbox";check.id="includeUnverified";
    const text=document.createElement("span");text.textContent="Include unverified research listings";
    const number=document.createElement("strong");number.id="unverifiedCount";
    label.append(check,text,number);
    const note=document.createElement("p");note.className="review-caption";
    note.textContent="These extra sources may be outdated or paid. They're excluded from the free/freemium results unless you opt in.";
    document.querySelector(".filters").after(label,note);
    check.addEventListener("change",()=>{includeUnverified=check.checked;render();});
    const unknown=tools.filter(t=>t.pricing==="unknown").length;
    number.textContent="+"+unknown.toLocaleString();
    const total=document.createElement("p");total.className="catalog-total";
    total.textContent=tools.length.toLocaleString()+" indexed OSINT listings — "+unknown.toLocaleString()+" pricing-unverified candidates";
    document.querySelector(".searchwrap").after(total);
  }
  init = async function() {
    try {
      const catalogPaths=["./tools.json","./imports/tools-1.json","./imports/tools-2.json","./imports/tools-3.json","./imports/tools-4.json"];
      const responses=await Promise.all(catalogPaths.map(path=>fetch(path,{cache:"no-cache"})));
      if(responses.some(response=>!response.ok))throw Error("Catalog unavailable");
      const groups=await Promise.all(responses.map(response=>response.json()));
      if(groups.some(group=>!Array.isArray(group)))throw Error("Invalid catalog data");
      const data=groups.flat();
      tools=data.filter(t=>t&&["free","freemium","unknown"].includes(t.pricing)&&safeURL(t.url))
        .map(t=>decorateImported(t)).map(t=>({...t,
          categories:Array.isArray(t.categories)?t.categories:[t.category],
          tags:t.tags||[],uses:t.uses||[],how:t.how||[],restrictions:t.restrictions||[],
          _search:arrays(t).join(" ").toLowerCase(),_quality:quality(t)
        }));
      semanticSearch.build(tools);
      const categories=[...new Set(tools.flatMap(t=>t.categories))].sort();
      for(const c of categories) {
        const o=document.createElement("option");o.value=c;o.textContent=c;$("category").append(o);
      }
      categoryChips();
      addReviewControl();
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
