(() => {
  'use strict';

  const CATEGORIES = [
    ['history','Geschichte & Zivilisation','Geschichte'],
    ['geography','Geografie & Welt','Geografie'],
    ['politics','Politik, Recht & Gesellschaft','Politik & Gesellschaft'],
    ['economy','Wirtschaft, Finanzen & Arbeit','Wirtschaft'],
    ['science','Physik, Chemie & Astronomie','Naturwissenschaften'],
    ['biology','Biologie, Mensch & Medizin','Biologie & Mensch'],
    ['earth','Erde, Umwelt & Klima','Erde & Klima'],
    ['technology','Technik, Ingenieurwesen & Digitalisierung','Technik & Digitales'],
    ['psychology','Psychologie & menschliches Verhalten','Psychologie'],
    ['language','Sprache, Literatur & Kommunikation','Sprache & Literatur'],
    ['culture','Kunst, Musik & Kultur','Kunst & Kultur'],
    ['philosophy','Philosophie, Religion & Weltbilder','Philosophie & Weltbilder']
  ].map(([id,title,shortTitle])=>({id,title,shortTitle}));

  const STORE = {
    get(key, fallback=null) { try { const v=localStorage.getItem('wz:'+key); return v===null?fallback:JSON.parse(v); } catch { return fallback; } },
    set(key, value) { localStorage.setItem('wz:'+key, JSON.stringify(value)); },
    del(key) { localStorage.removeItem('wz:'+key); }
  };

  const state = {
    view: 'start',
    lesson: null,
    lessonStep: 0,
    category: null,
    settings: false,
    search: { query:'', duration:null, level:null, unlearned:false, more:false, category:'', pack:'', includeDisabled:false },
    lessons: [],
    packs: [],
    baseLoaded: false,
    toast: ''
  };

  const progress = () => STORE.get('progress', {});
  const saveProgress = p => STORE.set('progress', p);
  const packEnabled = id => STORE.get('packEnabled:'+id, true);
  const setPackEnabled = (id,val) => STORE.set('packEnabled:'+id, !!val);
  const displayName = () => (STORE.get('name','')||'').trim();
  const themeMode = () => STORE.get('theme','system');

  function applyTheme() {
    const mode = themeMode();
    if (mode === 'system') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', mode);
    const dark = mode === 'dark' || (mode === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#061719' : '#0b777b');
  }
  applyTheme();
  matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', applyTheme);

  function escapeHtml(s='') { return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
  function cat(id) { return CATEGORIES.find(c=>c.id===id) || {id,title:id,shortTitle:id}; }
  function levelLabel(l) { return l==='special'?'Spezialwissen':l==='advanced'?'Erweitert':'Allgemein'; }
  function nowGreeting() { const h=new Date().getHours(); return h<11?'Guten Morgen':h<18?'Guten Tag':'Guten Abend'; }
  function pFor(id) { return progress()[id] || {mastery:0,completions:0,lastScore:0,lastLearnedAt:0,nextReviewAt:0}; }
  function activeLessons() { return state.lessons.filter(l=>packEnabled(l.packId)); }
  function weightedMastery(lessons) {
    if (!lessons.length) return 0;
    let num=0, den=0;
    lessons.forEach(l=>{ const w=Number(l.coverageWeight)|| (l.durationMinutes>=20?2.5:1); num += (pFor(l.id).mastery||0)*w; den+=w; });
    return den ? Math.round(num/den) : 0;
  }
  function packTitle(id) { return state.packs.find(p=>p.id===id)?.title || id; }
  function isDue(id) { const p=pFor(id); return p.completions>0 && p.nextReviewAt>0 && p.nextReviewAt<=Date.now(); }
  function funLesson(l) { const hay=[...(l.tags||[]),...(l.synonyms||[])].join(' ').toLowerCase(); return hay.includes('unnützes wissen') || hay.includes('unnuetzes wissen') || l.packId.includes('fun') || packTitle(l.packId).toLowerCase().includes('unnützes'); }

  async function loadBasePack() {
    const manifest = await fetch('./assets/packs/basis/manifest.json').then(r=>r.json());
    const lessons = await Promise.all(manifest.lessonFiles.map(f=>fetch('./assets/packs/basis/lessons/'+f).then(r=>r.json())));
    const pack = {id:manifest.id,title:manifest.title,version:manifest.version||1,description:manifest.description||'',author:manifest.author||'Wissenszeit',builtIn:true,lessonIds:lessons.map(l=>l.id)};
    const imported = STORE.get('importedPacks', {});
    const allPacks = {[pack.id]: {pack, lessons}, ...imported};
    state.packs = Object.values(allPacks).map(x=>x.pack);
    state.lessons = Object.values(allPacks).flatMap(x=>x.lessons.map(l=>({...l,packId:l.packId||x.pack.id,coverageWeight:l.coverageWeight ?? (l.durationMinutes>=20?2.5:1)})));
    state.baseLoaded=true;
  }

  function selectRecommendation(duration) {
    const lessons = activeLessons().filter(l=>l.durationMinutes===duration);
    if (!lessons.length) return null;
    const due = lessons.filter(l=>isDue(l.id));
    if (due.length) return due.sort((a,b)=>pFor(a.id).mastery-pFor(b.id).mastery)[0];
    const unlearned = lessons.filter(l=>pFor(l.id).completions===0);
    const pool = unlearned.length ? unlearned : lessons;
    const sorted = [...pool].sort((a,b)=>{
      const ma=pFor(a.id).mastery, mb=pFor(b.id).mastery;
      if (ma!==mb) return ma-mb;
      return Math.random()-.5;
    });
    return sorted[0];
  }

  function recommendedToday() {
    const twenty = selectRecommendation(20);
    return twenty || selectRecommendation(5);
  }

  function logoSvg() { return `<svg viewBox="0 0 64 64" aria-hidden="true"><path fill="#73e0d7" d="M9 14c8-2 15 0 21 5v31c-6-5-13-7-21-5z"/><path fill="#b4fff8" d="M55 14c-8-2-15 0-21 5v31c6-5 13-7 21-5z"/><path fill="#55c9c4" d="M30 19h4v31h-4z"/><path fill="#e6ffff" d="M49 7h5v27l-5 4z"/></svg>`; }

  function shell(content, active='start') {
    return `<div class="shell"><main class="page">${content}</main>${nav(active)}${state.settings?settingsSheet():''}${state.toast?`<div class="toast">${escapeHtml(state.toast)}</div>`:''}</div>`;
  }
  function nav(active) {
    const items=[['start','⌂','Start'],['search','⌕','Suche'],['knowledge','◈','Wissen'],['packs','▤','Pakete']];
    return `<nav class="nav"><div class="nav-inner">${items.map(([v,i,t])=>`<button data-nav="${v}" class="${active===v?'active':''}"><span class="nicon">${i}</span><span>${t}</span></button>`).join('')}</div></nav>`;
  }

  function header() {
    return `<section class="brand-header"><div class="brand-row"><div class="brand"><span class="logo">${logoSvg()}</span><span>Wissenszeit</span></div><button class="icon-btn" data-action="settings" aria-label="Einstellungen">⚙</button></div><div class="greeting">${nowGreeting()}, ${escapeHtml(displayName())}</div><p class="tagline">Kleine Schritte. Große Zusammenhänge.</p></section>`;
  }

  function lessonCard(l) {
    if(!l) return `<div class="card"><p class="empty">Noch keine passende Einheit vorhanden.</p></div>`;
    return `<article class="card recommend-card" data-open-lesson="${escapeHtml(l.id)}"><div class="meta-row"><span class="badge">◷ ${l.durationMinutes} Min</span><span>${escapeHtml(cat(l.categoryId).shortTitle)}</span><span>${escapeHtml(levelLabel(l.knowledgeLevel))}</span></div><div class="small" style="margin-top:6px">Lernpaket: ${escapeHtml(packTitle(l.packId))}</div><h3 class="card-title">${escapeHtml(l.title)}</h3><p class="summary">${escapeHtml(l.summary)}</p><div class="link-row"><span>Einheit öffnen</span><span>›</span></div></article>`;
  }

  function startView() {
    const rec=recommendedToday();
    const active=activeLessons();
    const mastery=weightedMastery(active);
    const learned=active.filter(l=>pFor(l.id).completions>0).length;
    const solid=active.filter(l=>pFor(l.id).mastery>=80).length;
    const fun=active.filter(funLesson);
    return shell(`${header()}<h2 class="section-title">Wie viel Zeit hast du?</h2><div class="time-grid"><button class="time-card five" data-duration="5"><span class="time-icon">ϟ</span><div><strong>5 Minuten</strong><span>Kurz lernen</span></div></button><button class="time-card twenty" data-duration="20"><span class="time-icon">▣</span><div><strong>20 Minuten</strong><span>Tiefer verstehen</span></div></button></div><h2 class="section-title">Heute für dich</h2>${lessonCard(rec)}${fun.length?`<section class="card fun-card"><div class="fun-top"><span class="fun-icon">◉</span><div><h3>Unnützes Wissen</h3><p>${fun.length} kuriose Inhalte · Wissen, das du nicht brauchst – aber behalten wirst.</p></div></div><button class="surprise" data-action="surprise">↻&nbsp;&nbsp;Überrasch mich</button></section>`:''}<h2 class="section-title">Mein Wissen</h2><section class="card"><div class="knowledge-summary"><div><div class="percent">${mastery} %</div><div class="small">im aktuell aktiven Wissenskatalog</div></div><div class="fun-icon">◈</div></div><div class="progress-track"><div class="progress-fill" style="width:${mastery}%"></div></div><div class="link-row"><span class="small">${learned} gelernt · ${solid} gefestigt</span><button class="chip" data-nav="knowledge">Details ›</button></div></section>`, 'start');
  }

  function filteredSearch() {
    const s=state.search; let list = s.includeDisabled ? state.lessons : activeLessons();
    const q=s.query.trim().toLowerCase();
    if(q) {
      const aliases={ai:'ki',weltall:'universum',atomkraft:'kernenergie',boerse:'börse'};
      const tokens=q.split(/\s+/).filter(Boolean).map(t=>aliases[t]||t);
      list=list.filter(l=>{
        const text=[l.title,...(l.path||[]),...(l.tags||[]),...(l.synonyms||[]),l.summary,packTitle(l.packId)].join(' ').toLowerCase();
        return text.includes(q)||tokens.every(t=>text.includes(t));
      });
    }
    if(s.duration) list=list.filter(l=>l.durationMinutes===s.duration);
    if(s.level) list=list.filter(l=>l.knowledgeLevel===s.level);
    if(s.unlearned) list=list.filter(l=>pFor(l.id).completions===0);
    if(s.category) list=list.filter(l=>l.categoryId===s.category);
    if(s.pack) list=list.filter(l=>l.packId===s.pack);
    return list.sort((a,b)=>a.title.localeCompare(b.title,'de'));
  }

  function searchView() {
    const s=state.search, results=filteredSearch();
    return shell(`<h1>Suche</h1><input class="searchbox" id="search-input" value="${escapeHtml(s.query)}" placeholder="Themen oder Tags durchsuchen" autocomplete="off"/><div class="filters" data-filter="duration"><button class="chip ${!s.duration?'active':''}" data-duration-filter="">Alle</button><button class="chip ${s.duration===5?'active':''}" data-duration-filter="5">5 Min</button><button class="chip ${s.duration===20?'active':''}" data-duration-filter="20">20 Min</button></div><div class="filters" data-filter="level"><button class="chip ${!s.level?'active':''}" data-level-filter="">Alle Stufen</button><button class="chip ${s.level==='general'?'active':''}" data-level-filter="general">Allgemein</button><button class="chip ${s.level==='advanced'?'active':''}" data-level-filter="advanced">Erweitert</button><button class="chip ${s.level==='special'?'active':''}" data-level-filter="special">Spezial</button></div><div class="filters"><button class="chip ${s.unlearned?'active':''}" data-action="toggle-unlearned">Nur ungelernt</button><button class="chip ${s.more?'active':''}" data-action="toggle-more">Weitere Filter</button></div>${s.more?`<div class="filter-panel"><label>Wissensbereich<select id="category-filter"><option value="">Alle Bereiche</option>${CATEGORIES.map(c=>`<option value="${c.id}" ${s.category===c.id?'selected':''}>${escapeHtml(c.title)}</option>`).join('')}</select></label><label>Lernpaket<select id="pack-filter"><option value="">Alle Lernpakete</option>${state.packs.map(p=>`<option value="${escapeHtml(p.id)}" ${s.pack===p.id?'selected':''}>${escapeHtml(p.title)}</option>`).join('')}</select></label><label style="display:flex;grid-template-columns:auto 1fr;align-items:center;gap:10px"><input id="disabled-filter" type="checkbox" ${s.includeDisabled?'checked':''}/> Deaktivierte Lernpakete einbeziehen</label></div>`:''}<div class="small" style="margin-top:16px">${results.length} Inhalte gefunden</div><div class="result-list">${results.length?results.map(l=>`<article class="result" data-open-lesson="${escapeHtml(l.id)}"><div class="meta-row"><span class="badge">${l.durationMinutes} Min</span><span>${escapeHtml(levelLabel(l.knowledgeLevel))}</span><span>${escapeHtml(cat(l.categoryId).shortTitle)}</span></div><h3>${escapeHtml(l.title)}</h3><p>${escapeHtml(packTitle(l.packId))}</p></article>`).join(''):`<div class="empty">Keine passenden Inhalte gefunden.</div>`}</div>`, 'search');
  }

  function knowledgeView() {
    const active=activeLessons(), total=weightedMastery(active);
    return shell(`<h1>Mein Wissen</h1><section class="card"><div class="small">Gesamtstand</div><div class="percent">${total} %</div><div class="small">im aktuell aktiven Wissenskatalog</div><div class="progress-track"><div class="progress-fill" style="width:${total}%"></div></div>${total===0?`<div class="small">Starte deine erste Einheit, um deinen Wissensstand aufzubauen.</div>`:''}</section><h2 class="section-title">12 Wissensbereiche</h2><div class="category-list">${CATEGORIES.map(c=>{const ls=active.filter(l=>l.categoryId===c.id), m=weightedMastery(ls);return `<article class="category-card" data-category="${c.id}"><div class="category-head"><div><strong>${escapeHtml(c.title)}</strong><div class="small">${ls.length} Inhalte</div></div><span class="pct">${m} % ›</span></div><div class="progress-track"><div class="progress-fill" style="width:${m}%"></div></div></article>`}).join('')}</div>`, 'knowledge');
  }

  function categoryView() {
    const c=cat(state.category), list=activeLessons().filter(l=>l.categoryId===c.id), m=weightedMastery(list);
    return shell(`<div class="lesson-top"><button class="back" data-action="back-knowledge">‹</button><div><div class="small">Wissensbereich</div><strong>${escapeHtml(c.title)}</strong></div></div><section class="card"><div class="percent">${m} %</div><div class="small">${list.length} aktive Inhalte</div><div class="progress-track"><div class="progress-fill" style="width:${m}%"></div></div></section><div class="result-list">${list.map(l=>`<article class="result" data-open-lesson="${escapeHtml(l.id)}"><div class="meta-row"><span class="badge">${l.durationMinutes} Min</span><span>${escapeHtml(levelLabel(l.knowledgeLevel))}</span></div><h3>${escapeHtml(l.title)}</h3><p>${escapeHtml((l.path||[]).join(' › '))}</p></article>`).join('')}</div>`, 'knowledge');
  }

  function packsView() {
    return shell(`<h1>Lernpakete</h1><p class="small">Aktive Pakete fließen in Empfehlungen, Suche, Wiederholungen und den Wissensstand ein.</p><div class="pack-list">${state.packs.map(p=>`<article class="pack"><div class="pack-head"><div><h3>${escapeHtml(p.title)}</h3><p>${escapeHtml(p.description)}</p><div class="small" style="margin-top:8px">${p.lessonIds.length} Inhalte · Version ${p.version}${p.builtIn?' · enthalten':''}</div></div><label class="switch"><input type="checkbox" data-pack-toggle="${escapeHtml(p.id)}" ${packEnabled(p.id)?'checked':''}/><span class="slider"></span></label></div></article>`).join('')}</div><div class="stack" style="margin-top:18px"><button class="primary-btn" data-action="import-pack">Lernpaket importieren</button></div>`, 'packs');
  }

  function settingsSheet() {
    const name=displayName(), theme=themeMode();
    return `<div class="settings-modal" data-action="close-settings"><section class="settings-sheet" onclick="event.stopPropagation()"><h2>Einstellungen</h2><div class="settings-row"><label>Name</label><input id="setting-name" value="${escapeHtml(name)}"/></div><div class="settings-row"><label>Darstellung</label><select id="setting-theme"><option value="system" ${theme==='system'?'selected':''}>System</option><option value="light" ${theme==='light'?'selected':''}>Hell</option><option value="dark" ${theme==='dark'?'selected':''}>Dunkel</option></select></div><div class="stack"><button class="primary-btn" data-action="save-settings">Speichern</button><button class="secondary-btn" data-action="close-settings">Schließen</button></div></section></div>`;
  }

  function sectionBlock(section, index=null) {
    if (!section) return '';
    const kicker = index === null ? '' : `<div class="small">Abschnitt ${index + 1}</div>`;
    return `<section class="section-card lesson-reading">${kicker}<h2>${escapeHtml(section.title)}</h2><p>${escapeHtml(section.body)}</p></section>`;
  }

  function misconceptionBlock(l) {
    return l.misconception ? `<section class="section-card misconception"><div class="step-kicker">Perspektive</div><h2>Typische Fehlannahme</h2><p>${escapeHtml(l.misconception)}</p></section>` : '';
  }

  function takeawaysBlock(l) {
    const items=l.keyTakeaways||[];
    if(!items.length) return '';
    return `<section class="section-card takeaways"><div class="step-kicker">Merken</div><h2>Das solltest du mitnehmen</h2><ul>${items.map(x=>`<li>${escapeHtml(x)}</li>`).join('')}</ul></section>`;
  }

  function recallBlock(l) {
    return `<section class="section-card recall-card"><div class="step-kicker">Aktiver Abruf</div><h2>Erkläre es mit deinen eigenen Worten</h2><p>${escapeHtml(l.recallPrompt||'Fasse den wichtigsten Gedanken dieser Einheit in eigenen Worten zusammen.')}</p><div class="recall-pause">Denk erst kurz selbst nach, bevor du die Musterantwort öffnest.</div><button class="secondary-btn" data-action="show-recall">Musterantwort anzeigen</button><div id="recall-answer" class="recall-answer">${escapeHtml(l.recallAnswer||'')}</div></section>`;
  }

  function quizBlock(l) {
    const answers=STORE.get('quiz:'+l.id,{}), questions=l.questions||[];
    if(!questions.length) return `<section class="section-card"><h2>Wissens-Check</h2><p>Für diese Einheit ist kein Quiz hinterlegt. Geh direkt zum nächsten Schritt.</p></section>`;
    return questions.map((q,qi)=>quizHtml(l,q,qi,answers[q.id])).join('');
  }

  function lessonSteps(l) {
    const sections=l.sections||[];
    if(l.durationMinutes<=5) {
      const cut=Math.max(1,Math.ceil(sections.length/2));
      const first=sections.slice(0,cut);
      const second=sections.slice(cut);
      return [
        {
          label:'Verstehen',
          title:'Worum geht es?',
          html:`<section class="relevant"><div class="step-kicker">Warum relevant?</div><div>${escapeHtml(l.whyRelevant||l.summary||'')}</div></section>${first.map((x,i)=>sectionBlock(x,i)).join('')}`
        },
        {
          label:'Vertiefen',
          title:'Den Gedanken festigen',
          html:`${second.map((x,i)=>sectionBlock(x,cut+i)).join('')}${misconceptionBlock(l)}${takeawaysBlock(l)}` || `<section class="section-card"><p>${escapeHtml(l.summary||'')}</p></section>`
        },
        {
          label:'Prüfen',
          title:'Wissens-Check',
          html:quizBlock(l)
        },
        {
          label:'Erinnern',
          title:'Aktiv erinnern',
          html:`${recallBlock(l)}${takeawaysBlock(l)}`
        }
      ];
    }

    // 20-Minuten-Einheiten: bewusst in neun kleine Etappen aufgeteilt.
    const n=sections.length;
    const a=Math.min(n,Math.max(1,Math.ceil(n*0.28)));
    const b=Math.min(n,Math.max(a+1,Math.ceil(n*0.55)));
    const c=Math.min(n,Math.max(b+1,Math.ceil(n*0.72)));
    const fundamentals=sections.slice(0,a);
    const connections=sections.slice(a,b);
    const examples=sections.slice(b,c);
    const perspectives=sections.slice(c);
    return [
      {
        label:'Orientierung',
        title:'Worum geht es?',
        html:`<section class="relevant"><div class="step-kicker">Warum relevant?</div><div>${escapeHtml(l.whyRelevant||l.summary||'')}</div></section><section class="section-card learning-goal"><div class="step-kicker">Lernziel</div><h2>Nach dieser Einheit kannst du …</h2><p>${escapeHtml(l.learningGoal||'die zentralen Zusammenhänge dieses Themas erklären.')}</p></section>`
      },
      {
        label:'Vorwissen',
        title:'Was weißt du schon?',
        html:`<section class="section-card preknowledge"><div class="step-kicker">Vorwissen aktivieren</div><h2>Bevor du weiterliest</h2><p>Was fällt dir zu „${escapeHtml(l.title)}“ bereits ein? Formuliere für dich zwei oder drei Gedanken – es geht noch nicht darum, richtig zu liegen.</p><div class="reflection">${escapeHtml(l.summary||'')}</div></section>`
      },
      {
        label:'Fundament',
        title:'Die Grundlagen',
        html:fundamentals.map((x,i)=>sectionBlock(x,i)).join('') || `<section class="section-card"><p>${escapeHtml(l.summary||'')}</p></section>`
      },
      {
        label:'Zusammenhang',
        title:'Wie hängt es zusammen?',
        html:connections.map((x,i)=>sectionBlock(x,a+i)).join('') || `<section class="section-card"><p>${escapeHtml(l.summary||'')}</p></section>`
      },
      {
        label:'Beispiel',
        title:'Vertiefung und Anwendung',
        html:examples.map((x,i)=>sectionBlock(x,b+i)).join('') || `<section class="section-card"><p>${escapeHtml(l.summary||'')}</p></section>`
      },
      {
        label:'Perspektive',
        title:'Einordnen und hinterfragen',
        html:`${perspectives.map((x,i)=>sectionBlock(x,c+i)).join('')}${misconceptionBlock(l)}` || misconceptionBlock(l) || `<section class="section-card"><p>${escapeHtml(l.summary||'')}</p></section>`
      },
      {
        label:'Wissens-Check',
        title:'Prüfe dein Verständnis',
        html:quizBlock(l)
      },
      {
        label:'Transfer',
        title:'Kannst du es selbst erklären?',
        html:recallBlock(l)
      },
      {
        label:'Abschluss',
        title:'Das bleibt hängen',
        html:`${takeawaysBlock(l)}<section class="section-card completion-card"><div class="step-kicker">Dein Wissensstand</div><div class="completion-mastery">${Math.round(pFor(l.id).mastery||0)} %</div><p>Mit dem Abschluss wird diese Einheit in deinen Lernfortschritt übernommen und für spätere Wiederholungen eingeplant.</p></section>`
      }
    ];
  }

  function lessonView(l) {
    const steps=lessonSteps(l);
    const stored=Number.isFinite(Number(state.lessonStep))?Number(state.lessonStep):0;
    const stepIndex=Math.max(0,Math.min(steps.length-1,stored));
    state.lessonStep=stepIndex;
    const step=steps[stepIndex];
    const pct=Math.round(((stepIndex+1)/steps.length)*100);
    const isFirst=stepIndex===0, isLast=stepIndex===steps.length-1;
    return `<div class="lesson-page"><main class="page lesson-shell"><div class="lesson-top"><button class="back" data-action="back" aria-label="Einheit verlassen">‹</button><div class="lesson-meta"><div class="small">${escapeHtml(cat(l.categoryId).shortTitle)} · ${l.durationMinutes} Min · ${escapeHtml(levelLabel(l.knowledgeLevel))}</div><div class="small">Lernpaket: ${escapeHtml(packTitle(l.packId))}</div></div></div><div class="lesson-progress-head"><div><span class="step-number">${stepIndex+1} von ${steps.length}</span><strong>${escapeHtml(step.label)}</strong></div><span>${pct} %</span></div><div class="lesson-progress-track"><div class="lesson-progress-fill" style="width:${pct}%"></div></div><h1>${escapeHtml(l.title)}</h1><div class="step-title">${escapeHtml(step.title)}</div><div class="lesson-step-content">${step.html}</div></main><footer class="lesson-footer"><div class="inner lesson-actions"><button class="secondary-btn lesson-prev" data-action="lesson-prev" ${isFirst?'disabled':''}>← Zurück</button>${isLast?`<button class="primary-btn lesson-next" data-action="complete-lesson">Einheit abschließen</button>`:`<button class="primary-btn lesson-next" data-action="lesson-next">Weiter →</button>`}</div></footer></div>`;
  }

  function quizHtml(l,q,qi,selected) {
    return `<section class="section-card quiz"><div class="small">Wissens-Check ${qi+1}</div><h2>${escapeHtml(q.prompt)}</h2>${q.options.map((o,i)=>{let cls='quiz-option'; if(selected!==undefined){ if(i===q.correctIndex) cls+=' correct'; else if(i===selected) cls+=' wrong'; } return `<button class="${cls}" data-quiz="${escapeHtml(q.id)}" data-choice="${i}" ${selected!==undefined?'disabled':''}>${escapeHtml(o)}</button>`}).join('')}${selected!==undefined?`<div class="feedback">${escapeHtml(q.explanation||'')}</div>`:''}</section>`;
  }

  function render() {
    const root=document.getElementById('app');
    if(!state.baseLoaded) { root.innerHTML=`<div class="onboarding"><div class="onboard-wrap"><div class="empty">Wissenszeit wird geladen …</div></div></div>`; return; }
    if(!displayName()) { root.innerHTML=onboarding(); bind(); return; }
    if(state.lesson) { root.innerHTML=lessonView(state.lesson); bind(); return; }
    if(state.view==='search') root.innerHTML=searchView();
    else if(state.view==='knowledge' && state.category) root.innerHTML=categoryView();
    else if(state.view==='knowledge') root.innerHTML=knowledgeView();
    else if(state.view==='packs') root.innerHTML=packsView();
    else root.innerHTML=startView();
    bind();
  }

  function onboarding() {
    return `<section class="onboarding"><div class="onboard-wrap"><div class="onboard-brand"><span class="logo">${logoSvg()}</span><div><strong>Wissenszeit</strong><span>Kleine Schritte. Große Zusammenhänge.</span></div></div><div class="onboard-card"><h1>Schön, dass du da bist.</h1><p>Wie dürfen wir dich nennen?</p><input id="onboard-name" class="name-input" placeholder="Name" autocomplete="name"/><button id="onboard-start" class="primary-btn" disabled>Wissenszeit starten →</button><p class="privacy">Dein Name und dein Lernstand bleiben ausschließlich auf diesem Gerät.</p></div></div></section>`;
  }

  function showToast(msg) { state.toast=msg; render(); setTimeout(()=>{state.toast='';render()},2200); }
  function openLesson(id) { state.lesson=state.lessons.find(l=>l.id===id)||null; state.lessonStep=Number(STORE.get('lessonStep:'+id,0))||0; window.scrollTo(0,0); render(); }
  function chooseDuration(d) { const l=selectRecommendation(d); if(l) openLesson(l.id); else showToast(`Keine ${d}-Minuten-Einheit verfügbar.`); }
  function surprise() { const list=activeLessons().filter(funLesson); const unseen=list.filter(l=>pFor(l.id).completions===0); const pool=unseen.length?unseen:list; if(pool.length) openLesson(pool[Math.floor(Math.random()*pool.length)].id); }
  function completeLesson() {
    const l=state.lesson; if(!l)return;
    const answers=STORE.get('quiz:'+l.id,{}); let correct=0,total=(l.questions||[]).length;
    (l.questions||[]).forEach(q=>{if(answers[q.id]===q.correctIndex)correct++});
    const all=progress(), old=all[l.id]||{mastery:0,completions:0};
    const score=total?correct/total:1;
    let mastery;
    if(!old.completions) mastery=45+score*25;
    else if(score<.5) mastery=Math.max(30,(old.mastery||0)-8);
    else mastery=Math.min(100,(old.mastery||0)+8+score*12);
    const days=mastery<60?1:mastery<75?3:mastery<90?7:21;
    all[l.id]={mastery,completions:(old.completions||0)+1,lastScore:score,lastLearnedAt:Date.now(),nextReviewAt:Date.now()+days*86400000};
    saveProgress(all); STORE.del('quiz:'+l.id); STORE.del('lessonStep:'+l.id); state.lessonStep=0; state.lesson=null; state.view='start'; showToast('Einheit abgeschlossen.');
  }

  async function unzipLearnpack(file) {
    const buf=await file.arrayBuffer(), dv=new DataView(buf), u8=new Uint8Array(buf);
    let eocd=-1; for(let i=u8.length-22;i>=Math.max(0,u8.length-65557);i--){ if(dv.getUint32(i,true)===0x06054b50){eocd=i;break;} }
    if(eocd<0) throw new Error('Ungültige ZIP-Datei.');
    const total=dv.getUint16(eocd+10,true), cdOffset=dv.getUint32(eocd+16,true); let off=cdOffset; const files={};
    const dec=new TextDecoder('utf-8');
    for(let n=0;n<total;n++){
      if(dv.getUint32(off,true)!==0x02014b50) throw new Error('ZIP-Verzeichnis beschädigt.');
      const method=dv.getUint16(off+10,true), compSize=dv.getUint32(off+20,true), nameLen=dv.getUint16(off+28,true), extraLen=dv.getUint16(off+30,true), commentLen=dv.getUint16(off+32,true), localOff=dv.getUint32(off+42,true);
      const name=dec.decode(u8.slice(off+46,off+46+nameLen));
      const localNameLen=dv.getUint16(localOff+26,true), localExtraLen=dv.getUint16(localOff+28,true), dataStart=localOff+30+localNameLen+localExtraLen;
      const compressed=u8.slice(dataStart,dataStart+compSize); let data;
      if(method===0) data=compressed;
      else if(method===8) {
        const ds=new DecompressionStream('deflate-raw');
        data=new Uint8Array(await new Response(new Blob([compressed]).stream().pipeThrough(ds)).arrayBuffer());
      } else throw new Error('Nicht unterstützte ZIP-Kompression: '+method);
      if(!name.endsWith('/')) files[name]=data;
      off += 46+nameLen+extraLen+commentLen;
    }
    return files;
  }

  async function importPack(file) {
    const files=await unzipLearnpack(file), dec=new TextDecoder('utf-8');
    if(!files['manifest.json']) throw new Error('manifest.json fehlt.');
    const manifest=JSON.parse(dec.decode(files['manifest.json']));
    if(manifest.schemaVersion!==1) throw new Error('Nicht unterstützte Paketversion.');
    const lessons=[];
    for(const f of manifest.lessonFiles||[]) {
      const key='lessons/'+f; if(files[key]) lessons.push(JSON.parse(dec.decode(files[key])));
    }
    if(!lessons.length) throw new Error('Keine Lerneinheiten gefunden.');
    const pack={id:manifest.id,title:manifest.title,version:manifest.version||1,description:manifest.description||'',author:manifest.author||'Wissenszeit',builtIn:false,lessonIds:lessons.map(l=>l.id)};
    const imported=STORE.get('importedPacks',{}); imported[pack.id]={pack,lessons}; STORE.set('importedPacks',imported); await loadBasePack(); render(); showToast(`${pack.title} importiert.`);
  }

  function bind() {
    document.querySelectorAll('[data-nav]').forEach(b=>b.onclick=()=>{state.view=b.dataset.nav;state.category=null;state.lesson=null;render();window.scrollTo(0,0)});
    document.querySelectorAll('[data-open-lesson]').forEach(x=>x.onclick=()=>openLesson(x.dataset.openLesson));
    document.querySelectorAll('[data-duration]').forEach(x=>x.onclick=()=>chooseDuration(Number(x.dataset.duration)));
    document.querySelector('[data-action="settings"]')?.addEventListener('click',()=>{state.settings=true;render()});
    document.querySelectorAll('[data-action="close-settings"]').forEach(x=>x.onclick=()=>{state.settings=false;render()});
    document.querySelector('[data-action="save-settings"]')?.addEventListener('click',()=>{const n=document.getElementById('setting-name').value.trim(); if(n)STORE.set('name',n);STORE.set('theme',document.getElementById('setting-theme').value);applyTheme();state.settings=false;render()});
    document.querySelector('[data-action="surprise"]')?.addEventListener('click',surprise);
    document.querySelectorAll('[data-category]').forEach(x=>x.onclick=()=>{state.category=x.dataset.category;render();window.scrollTo(0,0)});
    document.querySelector('[data-action="back-knowledge"]')?.addEventListener('click',()=>{state.category=null;render()});
    document.querySelector('[data-action="back"]')?.addEventListener('click',()=>{state.lesson=null;render()});
    document.querySelector('[data-action="lesson-prev"]')?.addEventListener('click',()=>{if(!state.lesson)return;state.lessonStep=Math.max(0,state.lessonStep-1);STORE.set('lessonStep:'+state.lesson.id,state.lessonStep);render();window.scrollTo(0,0)});
    document.querySelector('[data-action="lesson-next"]')?.addEventListener('click',()=>{if(!state.lesson)return;const total=lessonSteps(state.lesson).length;state.lessonStep=Math.min(total-1,state.lessonStep+1);STORE.set('lessonStep:'+state.lesson.id,state.lessonStep);render();window.scrollTo(0,0)});
    document.querySelector('[data-action="show-recall"]')?.addEventListener('click',()=>document.getElementById('recall-answer')?.classList.add('show'));
    document.querySelector('[data-action="complete-lesson"]')?.addEventListener('click',completeLesson);
    document.querySelectorAll('[data-quiz]').forEach(x=>x.onclick=()=>{const l=state.lesson, a=STORE.get('quiz:'+l.id,{});a[x.dataset.quiz]=Number(x.dataset.choice);STORE.set('quiz:'+l.id,a);render()});
    const name=document.getElementById('onboard-name'), start=document.getElementById('onboard-start');
    if(name&&start){name.oninput=()=>start.disabled=!name.value.trim();start.onclick=()=>{STORE.set('name',name.value.trim());render()};name.onkeydown=e=>{if(e.key==='Enter'&&name.value.trim())start.click()};}
    const si=document.getElementById('search-input'); if(si){si.oninput=e=>{state.search.query=e.target.value;render();setTimeout(()=>document.getElementById('search-input')?.focus(),0)};}
    document.querySelectorAll('[data-duration-filter]').forEach(x=>x.onclick=()=>{state.search.duration=x.dataset.durationFilter?Number(x.dataset.durationFilter):null;render()});
    document.querySelectorAll('[data-level-filter]').forEach(x=>x.onclick=()=>{state.search.level=x.dataset.levelFilter||null;render()});
    document.querySelector('[data-action="toggle-unlearned"]')?.addEventListener('click',()=>{state.search.unlearned=!state.search.unlearned;render()});
    document.querySelector('[data-action="toggle-more"]')?.addEventListener('click',()=>{state.search.more=!state.search.more;render()});
    document.getElementById('category-filter')?.addEventListener('change',e=>{state.search.category=e.target.value;render()});
    document.getElementById('pack-filter')?.addEventListener('change',e=>{state.search.pack=e.target.value;render()});
    document.getElementById('disabled-filter')?.addEventListener('change',e=>{state.search.includeDisabled=e.target.checked;render()});
    document.querySelectorAll('[data-pack-toggle]').forEach(x=>x.onchange=()=>{setPackEnabled(x.dataset.packToggle,x.checked);render()});
    document.querySelector('[data-action="import-pack"]')?.addEventListener('click',()=>document.getElementById('learnpack-input').click());
  }

  document.getElementById('learnpack-input').addEventListener('change',async e=>{
    const f=e.target.files?.[0]; if(!f)return; try{await importPack(f);}catch(err){console.error(err);showToast('Import fehlgeschlagen: '+err.message);} e.target.value='';
  });

  if('serviceWorker' in navigator) window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(console.error));
  loadBasePack().then(render).catch(err=>{console.error(err);document.getElementById('app').innerHTML=`<div class="onboarding"><div class="onboard-wrap"><div class="onboard-card"><h1>Wissenszeit konnte nicht geladen werden.</h1><p>${escapeHtml(err.message)}</p></div></div></div>`;});
})();
