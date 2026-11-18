(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const projects = window.AHMAD_PROJECTS || [];
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const preview = $('#project-preview'), figure = $('.figure-dialog');
  let current = null, trigger = null;
  const groupFor = p => projects.filter(x => x.slug.startsWith('hntb-') === p.slug.startsWith('hntb-'));
  function showProject(slug, source) {
    const p = projects.find(x => x.slug === slug);
    if (!p || !preview) return;
    current = p;
    if (!preview.open) trigger = source || document.activeElement;
    const group = groupFor(p), n = group.indexOf(p);
    $('.preview-position', preview).textContent = `${String(n + 1).padStart(2, '0')} / ${String(group.length).padStart(2, '0')} · ${p.slug.startsWith('hntb-') ? 'INTERNSHIP' : 'PROJECT LIBRARY'}`;
    $('#preview-kind').textContent = `${p.kind} · ${p.category}`;
    $('#preview-title').textContent = p.title;
    $('#preview-summary').textContent = p.summary;
    $('#preview-work').innerHTML = p.work.map(w => `<li>${esc(w)}</li>`).join('');
    $('#preview-tools').innerHTML = p.tools.split(',').map(t => `<span>${esc(t.trim())}</span>`).join('');
    $('#preview-note').textContent = p.note;
    $('#preview-files').innerHTML = p.files.map(f => `<a class="download" href="${esc(f.url)}">${esc(f.label)}<span aria-hidden="true">↗</span></a>`).join('');
    $('#preview-full').href = p.url;
    const pdf = p.files.find(f => f.url.toLowerCase().endsWith('.pdf'));
    $('#preview-pdf').href = pdf?.url || p.url;
    $('#preview-pdf').textContent = p.slug.startsWith('hntb-') ? 'Resume source ↗' : 'Open PDF ↗';
    $('[data-preview-tab="report"]', preview).textContent = p.slug.startsWith('hntb-') ? 'Resume preview' : 'PDF preview';
    $('.preview-files-title').textContent = p.slug.startsWith('hntb-') ? 'Experience source' : 'Project files';
    $('.copy-status', preview).textContent = '';
    switchPreview('overview');
    if (!preview.open) { preview.showModal(); document.body.classList.add('dialog-open'); }
    $('.preview-content', preview).scrollTop = 0;
  }
  function switchPreview(tab) {
    const report = tab === 'report';
    $('#preview-overview').hidden = report;
    $('#preview-report').hidden = !report;
    $$('[data-preview-tab]', preview).forEach(b => b.setAttribute('aria-pressed', String(b.dataset.previewTab === tab)));
    const frame = $('iframe', preview);
    if (report && current) {
      frame.src = (current.files.find(f => f.url.endsWith('.pdf'))?.url || '') + '#view=FitH';
      frame.title = `${current.title} — PDF`;
    } else frame.removeAttribute('src');
  }
  function openFigure(src, alt, caption = '') {
    if (!figure) return;
    trigger = document.activeElement;
    $('img', figure).src = src; $('img', figure).alt = alt;
    $('.figure-caption', figure).textContent = caption || alt;
    figure.showModal(); document.body.classList.add('dialog-open');
  }
  $$('[data-preview]').forEach(b => b.addEventListener('click', () => showProject(b.dataset.preview, b)));
  $$('[data-preview-step]').forEach(b => b.addEventListener('click', () => {
    if (!current) return;
    const group = groupFor(current), next = (group.indexOf(current) + Number(b.dataset.previewStep) + group.length) % group.length;
    showProject(group[next].slug);
  }));
  $$('[data-preview-tab]').forEach(b => b.addEventListener('click', () => switchPreview(b.dataset.previewTab)));
  $$('[data-close-dialog]').forEach(b => b.addEventListener('click', () => b.closest('dialog').close()));
  $$('dialog').forEach(d => {
    d.addEventListener('click', e => {
      if (e.target !== d) return;
      const r = d.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) d.close();
    });
    d.addEventListener('close', () => {
      document.body.classList.remove('dialog-open');
      $('iframe', d)?.removeAttribute('src');
      trigger?.focus({preventScroll:true});
    });
  });
  $$('[data-image]').forEach(b => b.addEventListener('click', () => openFigure(b.dataset.image, b.dataset.imageAlt)));
  async function copyLink(path, status) {
    const url = new URL(path, location.origin).href;
    try { await navigator.clipboard.writeText(url); status.textContent = 'Link copied'; }
    catch { status.replaceChildren(); const link = document.createElement('a'); link.href = url; link.textContent = 'Project link — right-click to copy'; status.append(link); }
  }
  $('.copy-project')?.addEventListener('click', () => current && copyLink(current.url, $('.copy-status', preview)));
  $$('[data-share]').forEach(b => b.addEventListener('click', () => copyLink(b.dataset.share, $('.page-copy-status'))));

  // Search and subject filters work together; direct file links remain available.
  const field = $('#project-search'), rows = $$('.projectrow'), filters = $$('[data-category-filter]');
  let category = 'all';
  function filterProjects() {
    const term = field?.value.trim().toLowerCase() || '';
    let n = 0;
    rows.forEach(r => { r.hidden = (category !== 'all' && r.dataset.category !== category) || !r.dataset.search.includes(term); if (!r.hidden) n++; });
    if ($('.entry-count')) $('.entry-count').textContent = `${n} of ${rows.length} projects`;
    if ($('.no-results')) $('.no-results').hidden = n !== 0;
    if ($('.clear-filters')) $('.clear-filters').hidden = !term && category === 'all';
    filters.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.categoryFilter === category)));
  }
  field?.addEventListener('input', filterProjects);
  filters.forEach(b => b.addEventListener('click', () => {category = b.dataset.categoryFilter; filterProjects();}));
  $('.clear-filters')?.addEventListener('click', () => {field.value = ''; category = 'all'; filterProjects(); field.focus({preventScroll:true});});
  document.addEventListener('keydown', e => {
    if (e.key === '/' && field && !e.ctrlKey && !e.metaKey && !e.altKey && !preview?.open && !figure?.open && !e.target.closest('input,textarea,[contenteditable="true"]')) {
      e.preventDefault(); field.focus(); field.scrollIntoView({block:'center',behavior:reduceMotion ? 'instant' : 'smooth'});
    }
  });

  // Interactive viewing of original report images, without invented map data.
  $$('.map-explorer').forEach(explorer => {
    const img = $('.map-image', explorer), viewport = $('.map-viewport', explorer);
    let zoom = 1, x = 0, y = 0, drag = null;
    const outputs = {
      network: {src:'/assets/travel-demand-map.png',alt:'Illustrative AM peak-hour traffic assignment from the eight-zone Lafayette model.',caption:'Illustrative internal commuter assignment. Educational pilot; no independent traffic-count validation.'},
      fit: {src:'/assets/gravity-model-results.png',alt:'Actual comparison of gravity-model and employment-only benchmark error for the Lafayette pilot.',caption:'In-sample model fit: MAE falls from 12.98 to 8.38 relationships per O-D cell. This is not independent traffic-count validation.'}
    };
    let view = 'network';
    function draw() {
      const limitX = viewport.clientWidth * (zoom - 1) / 2, limitY = viewport.clientHeight * (zoom - 1) / 2;
      x = Math.max(-limitX, Math.min(limitX, x)); y = Math.max(-limitY, Math.min(limitY, y));
      img.style.transform = `translate(${x}px,${y}px) scale(${zoom})`;
      $('.zoom-value', explorer).textContent = `${Math.round(zoom * 100)}%`;
      viewport.classList.toggle('is-zoomed', zoom > 1);
      $('[data-map-action="out"]', explorer).disabled = zoom <= 1;
      $('[data-map-action="in"]', explorer).disabled = zoom >= 3;
    }
    function changeZoom(delta) {zoom = Math.max(1, Math.min(3, +(zoom + delta).toFixed(2))); if (zoom === 1) x = y = 0; draw();}
    $$('[data-map-action]', explorer).forEach(b => b.addEventListener('click', () => {
      if (b.dataset.mapAction === 'reset') {zoom=1;x=y=0;draw();} else changeZoom(b.dataset.mapAction === 'in' ? .25 : -.25);
    }));
    $$('[data-map-view]', explorer).forEach(b => b.addEventListener('click', () => {
      view = b.dataset.mapView; const output = outputs[view];
      img.src = output.src; img.alt = output.alt; $('.map-caption', explorer).textContent = output.caption;
      $$('[data-map-view]', explorer).forEach(t => t.setAttribute('aria-pressed', String(t === b)));
      zoom=1;x=y=0;draw();
    }));
    $('.expand-map', explorer).addEventListener('click', () => openFigure(outputs[view].src, outputs[view].alt, outputs[view].caption));
    viewport.addEventListener('pointerdown', e => {
      if (zoom <= 1 || (e.pointerType === 'mouse' && e.button !== 0)) return;
      drag={sx:e.clientX,sy:e.clientY,x,y}; viewport.setPointerCapture(e.pointerId); viewport.classList.add('is-dragging');
    });
    viewport.addEventListener('pointermove', e => {if (!drag) return; x=drag.x+e.clientX-drag.sx;y=drag.y+e.clientY-drag.sy;draw();});
    function endDrag(){drag=null;viewport.classList.remove('is-dragging');}
    viewport.addEventListener('pointerup',endDrag);viewport.addEventListener('pointercancel',endDrag);viewport.addEventListener('lostpointercapture',endDrag);
    viewport.addEventListener('keydown', e => {
      if (['+','=','-','0','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)) e.preventDefault();
      if(e.key==='+'||e.key==='=')changeZoom(.25);else if(e.key==='-')changeZoom(-.25);else if(e.key==='0'){zoom=1;x=y=0;draw();}
      else if(e.key==='ArrowLeft')x+=35;else if(e.key==='ArrowRight')x-=35;else if(e.key==='ArrowUp')y+=35;else if(e.key==='ArrowDown')y-=35;
      draw();
    });
    addEventListener('resize',draw,{passive:true});draw();
  });
  $$('.validation-lab').forEach(lab => {
    const states = {
      random: {score:'0.541',width:'54.1%',text:'Random validation: training and test records come from the same geographic pool.'},
      geographic: {score:'0.467',width:'46.7%',text:'Geographic validation: performance is lower when the model is tested in a held-out geographic area.'}
    };
    $$('[data-validation]',lab).forEach(b=>b.addEventListener('click',()=>{
      const d=states[b.dataset.validation];$('.validation-score',lab).textContent=d.score;$('.score-fill',lab).style.width=d.width;$('.validation-explanation',lab).textContent=d.text;
      $$('[data-validation]',lab).forEach(t=>t.setAttribute('aria-pressed',String(t===b)));
      lab.classList.toggle('geographic',b.dataset.validation==='geographic');
    }));
  });

  // Restrained motion; essential content is visible if scripts or animation fail.
  if (!reduceMotion && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => entries.forEach(e => {if (e.isIntersecting) {e.target.classList.add('entered');observer.unobserve(e.target);}}),{threshold:.08});
    $$('.feature,.sectionhead,.job,.next-project').forEach(el=>{el.classList.add('reveal');observer.observe(el);});
  }
  let ticking=false;
  function updateScroll(){
    const max=document.documentElement.scrollHeight-innerHeight;
    $('.reading-progress span').style.transform=`scaleX(${max>0?scrollY/max:0})`;
    $('header').classList.toggle('scrolled',scrollY>20);
    $('.back-top')?.classList.toggle('is-visible',scrollY>650);
    ticking=false;
  }
  addEventListener('scroll',()=>{if(!ticking){ticking=true;requestAnimationFrame(updateScroll);}},{passive:true});updateScroll();
})();
