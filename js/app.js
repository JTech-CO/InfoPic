'use strict';
(function (IP) {
  const $ = (id) => document.getElementById(id);
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const icons = {
    folder: '<path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/>',
    chevronDown: '<path d="m7 10 5 5 5-5"/>', chevronUp: '<path d="m7 14 5-5 5 5"/>',
    download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v4h16v-4"/>', upload: '<path d="M12 16V4m-5 5 5-5 5 5M4 17v4h16v-4"/>',
    undo: '<path d="m8 5-5 5 5 5M3 10h10a7 7 0 0 1 7 7v2"/>', redo: '<path d="m16 5 5 5-5 5m5-5H11a7 7 0 0 0-7 7v2"/>',
    languages: '<path d="M3 5h11M8 3v2m4 0c-1 6-4 8-8 10m1-7c1 3 4 5 7 7m2 5 4-10 4 10m-6-3h4"/>',
    moon: '<path d="M20 15A8.5 8.5 0 0 1 9 4a8.5 8.5 0 1 0 11 11Z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>', minus: '<path d="M5 12h14"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    type: '<path d="M4 5h16M12 5v15m-4 0h8M4 5v3m16-3v3"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8" cy="8" r="1.5"/><path d="m3 17 6-6 4 4 3-3 5 5"/>',
    stamp: '<path d="M5 15h14l2 5H3Zm3-5V6a4 4 0 0 1 8 0v4l2 2v3H6v-3Z"/>',
    sliders: '<path d="M4 6h8m5 0h3M4 12h3m5 0h8M4 18h10m5 0h1"/><circle cx="14" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="16" cy="18" r="2"/>',
    shield: '<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6Zm-4 9 3 3 5-6"/>',
    pencil: '<path d="m15 4 5 5M4 20l5-1L21 7a2 2 0 0 0 0-3l-1-1a2 2 0 0 0-3 0L5 15Z"/>',
    lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V6a4 4 0 0 1 8 0v4"/>',
    grip: '<path d="M9 5h.01M15 5h.01M9 12h.01M15 12h.01M9 19h.01M15 19h.01" stroke-width="3"/>',
    left: '<path d="M4 5h16M4 10h10M4 15h16M4 20h10"/>', center: '<path d="M4 5h16M7 10h10M4 15h16M7 20h10"/>', right: '<path d="M4 5h16M10 10h10M4 15h16M10 20h10"/>',
    trash: '<path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7"/>',
    copy: '<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V3H3v13h5"/>',
    arrowUp: '<path d="M12 20V4m-6 6 6-6 6 6"/>', arrowDown: '<path d="M12 4v16m-6-6 6 6 6-6"/>',
    close: '<path d="m6 6 12 12M6 18 18 6"/>',
    file: '<path d="M14 3H5v18h14V8Zm0 0v5h5M8 13h8m-8 4h8"/>',
    save: '<path d="M4 3h14l3 3v15H3V3Zm3 0v6h10V3M7 21v-8h10v8"/>',
    reset: '<path d="M3 10a9 9 0 1 1 2 8M3 3v7h7"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v.01"/>', check: '<path d="m5 12 4 4L19 6"/>',
    zip: '<path d="M14 3H5v18h14V8Zm0 0v5h5M10 3v2m0 2v2m0 2v2m-1 3h2v3H9Z"/>'
  };
  const icon = name => `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${icons[name] || icons.file}</svg>`;
  function prefs() { try { return JSON.parse(localStorage.getItem('infopic-ui') || '{}'); } catch (_) { return {}; } }
  const preference = prefs();
  const state = {
    project: IP.createProject(), assets: new IP.AssetStore(),
    lang: preference.lang === 'ko' ? 'ko' : 'en', theme: preference.theme === 'dark' ? 'dark' : 'light',
    keepLocal: preference.keepLocal === true, activeSlide: null, activeBlock: null, tab: 'write',
    selection: { start: 0, end: 0, blockId: null }, undo: [], redo: [], lastKey: null, lastAt: 0,
    dirty: false, exporting: false, cancelExport: false, exportWidth: 1080, previewResult: null,
    confirmCallback: null, drag: null, backupTimer: null, backupSerial: Promise.resolve(), busy: 0
  };
  state.activeSlide = state.project.slides[0].id; state.activeBlock = state.project.slides[0].blocks[1].id;
  const t = (key) => IP.messages[state.lang][key] ?? IP.messages.en[key] ?? key;
  const slide = () => state.project.slides.find(s => s.id === state.activeSlide) || state.project.slides[0];
  const block = () => slide().blocks.find(b => b.id === state.activeBlock) || slide().blocks[0];
  const countContent = () => state.project.slides.length - 3;
  const labelSlide = s => s.type === 'content' ? `${t('content')} ${state.project.slides.filter(x => x.type === 'content').findIndex(x => x.id === s.id) + 1}` : t(s.type);
  function documentValue() { return { format: 'infopic-project', version: IP.VERSION, project: IP.clone(state.project), assets: state.assets.serialized(state.project) }; }
  function savePrefs() { try { localStorage.setItem('infopic-ui', JSON.stringify({ lang: state.lang, theme: state.theme, keepLocal: state.keepLocal })); } catch (_) { /* Private browsing may disable local preferences. */ } }
  let toastTimer;
  function toast(message) { clearTimeout(toastTimer); $('toastRegion').innerHTML = `<div class="toast">${esc(message)}</div>`; toastTimer = setTimeout(() => { $('toastRegion').textContent = ''; }, 4200); }
  function busy(show, key = 'busy') { state.busy = Math.max(0, state.busy + (show ? 1 : -1)); $('busyText').textContent = t(key); $('busyIndicator').hidden = !state.busy; }
  function fail(error, fallback = 'fileReadFailed') { console.error('[InfoPic]', error); toast(t(IP.messages.en[error?.message] ? error.message : fallback)); }
  function queueBackup() {
    clearTimeout(state.backupTimer);
    if (!state.keepLocal) return;
    state.backupTimer = setTimeout(() => {
      const snapshot = documentValue();
      state.backupSerial = state.backupSerial.catch(() => {}).then(() => state.keepLocal ? IP.backup.put(snapshot) : undefined).catch(() => {
        state.keepLocal = false; savePrefs(); syncChrome(); toast(t('backupFailed'));
      });
    }, 750);
  }
  function ensureSelection() {
    if (!state.project.slides.some(s => s.id === state.activeSlide)) state.activeSlide = state.project.slides[0].id;
    if (!slide().blocks.some(b => b.id === state.activeBlock)) state.activeBlock = slide().blocks.find(b => b.role !== 'body')?.id || slide().blocks[0].id;
    if (state.selection.blockId !== state.activeBlock) state.selection = { start: 0, end: 0, blockId: state.activeBlock };
  }
  function change(mutator, options = {}) {
    const now = Date.now(), key = options.key || null;
    const before = JSON.stringify(state.project);
    mutator(state.project);
    if (JSON.stringify(state.project) === before) return;
    if (!key || key !== state.lastKey || now - state.lastAt > 1100) {
      state.undo.push(before); if (state.undo.length > 40) state.undo.shift();
    }
    state.lastKey = key; state.lastAt = now; state.redo = []; state.dirty = true;
    ensureSelection(); syncChrome(); schedulePreview(); scheduleSidebar();
    if (options.editor !== false) renderEditor();
    queueBackup();
  }
  function undo(redo = false) {
    const from = redo ? state.redo : state.undo, to = redo ? state.undo : state.redo;
    if (!from.length || state.exporting) return;
    to.push(JSON.stringify(state.project)); state.project = JSON.parse(from.pop());
    state.lastKey = null; state.dirty = true; ensureSelection(); renderAll(); queueBackup();
  }
  let previewFrame = null, sidebarTimer = null;
  function schedulePreview() { if (!previewFrame) previewFrame = requestAnimationFrame(() => { previewFrame = null; renderPreview(); }); }
  function scheduleSidebar() { clearTimeout(sidebarTimer); sidebarTimer = setTimeout(renderSidebar, 160); }
  function syncChrome() {
    document.documentElement.lang = state.lang; document.documentElement.dataset.theme = state.theme;
    document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
    document.querySelectorAll('[data-label]').forEach(el => { el.setAttribute('aria-label', t(el.dataset.label)); });
    document.querySelectorAll('[data-title]').forEach(el => { el.title = t(el.dataset.title); el.setAttribute('aria-label', t(el.dataset.title)); });
    $('languageLabel').textContent = state.lang === 'en' ? 'EN' : '한국어';
    $('languageButton').title = state.lang === 'en' ? '한국어로 전환' : 'Switch to English';
    $('languageButton').setAttribute('aria-label', $('languageButton').title);
    $('themeButton').innerHTML = icon(state.theme === 'light' ? 'moon' : 'sun');
    $('undoButton').disabled = !state.undo.length; $('redoButton').disabled = !state.redo.length;
    if (document.activeElement !== $('projectName')) $('projectName').value = state.project.name;
    $('projectName').setAttribute('aria-label', t('storyName'));
    $('storageStatus').textContent = t(state.keepLocal ? 'savedLocal' : 'memoryOnly');
    $('slideCount').textContent = state.project.slides.length;
    $('contentCount').textContent = `${countContent()}/6`;
    $('addContentButton').disabled = countContent() >= 6;
    $('canvasDimensions').textContent = `1080 × ${state.project.ratio === '9:16' ? '1920' : '1440'}`;
    $('currentSlideLabel').textContent = labelSlide(slide());
    $('editingTitle').textContent = labelSlide(slide());
    $('slidePosition').textContent = `${String(state.project.slides.findIndex(s => s.id === slide().id) + 1).padStart(2, '0')} / ${String(state.project.slides.length).padStart(2, '0')}`;
    document.querySelectorAll('[data-ratio]').forEach(el => { const yes = el.dataset.ratio === state.project.ratio; el.classList.toggle('selected', yes); el.setAttribute('aria-pressed', String(yes)); });
    document.querySelectorAll('[data-tab]').forEach(el => { const yes = el.dataset.tab === state.tab; el.setAttribute('aria-selected', String(yes)); el.tabIndex = yes ? 0 : -1; });
    $('editorPanel').setAttribute('aria-labelledby', `tab-${state.tab}`);
  }
  function renderAll() { ensureSelection(); syncChrome(); renderSidebar(); renderEditor(); renderPreview(); }
  function renderSidebar() {
    if (state.drag?.moved) return;
    clearTimeout(sidebarTimer);
    const list = $('storyList'), sx = list.scrollLeft, sy = list.scrollTop;
    const focusId = list.contains(document.activeElement) ? document.activeElement.closest('[data-slide-id]')?.dataset.slideId : null;
    list.innerHTML = state.project.slides.map(s => {
      const content = s.type === 'content', selected = s.id === state.activeSlide;
      const text = s.blocks.find(b => b.role !== 'body' && b.text)?.text || s.blocks.find(b => b.text)?.text || t('blockEmpty');
      return `<div class="slide-row${selected ? ' selected' : ''}" data-slide-id="${s.id}" data-type="${s.type}">
        ${content ? `<button class="drag-handle" data-action="drag-slide" aria-label="${esc(t('dragSlide'))}" title="${esc(t('dragSlide'))}">${icon('grip')}</button>` : '<span class="slide-fixed-spacer"></span>'}
        <button class="slide-select" data-action="select-slide" aria-label="${esc(labelSlide(s))}" aria-current="${selected ? 'true' : 'false'}">
          <canvas class="slide-thumb" data-thumb="${s.id}" width="135" height="180" aria-hidden="true"></canvas>
          <span class="slide-labels"><span class="slide-title">${esc(labelSlide(s))}</span>${content ? `<span class="slide-snippet">${esc(text.replace(/\n/g, ' '))}</span>` : `<span class="slide-type-icon">${icon('lock')}${esc(t('fixed'))}</span>`}</span>
        </button></div>`;
    }).join('');
    for (const s of state.project.slides) {
      const canvas = list.querySelector(`[data-thumb="${s.id}"]`);
      try { IP.Renderer.render(canvas, state.project, s, state.assets, 135); } catch (e) { console.warn('[InfoPic thumbnail]', e); }
    }
    list.scrollLeft = sx; list.scrollTop = sy;
    if (focusId) list.querySelector(`[data-slide-id="${focusId}"] .drag-handle`)?.focus({ preventScroll: true });
  }
  function fitPreview() {
    const area = $('canvasArea'), css = getComputedStyle(area);
    const aw = area.clientWidth - parseFloat(css.paddingLeft) - parseFloat(css.paddingRight);
    const ah = area.clientHeight - parseFloat(css.paddingTop) - parseFloat(css.paddingBottom);
    const ratio = state.project.ratio === '9:16' ? 9 / 16 : 3 / 4;
    const width = Math.max(1, Math.min(aw, ah * ratio));
    $('canvasFrame').style.width = `${width}px`; $('canvasFrame').style.height = `${width / ratio}px`;
  }
  function renderPreview() {
    try {
      state.previewResult = IP.Renderer.render($('previewCanvas'), state.project, slide(), state.assets, 1080);
      const warning = state.previewResult.overflow ? t('warningShort') : state.previewResult.footerOverflow ? t('warningFooter') : '';
      $('stageWarning').hidden = !warning; $('stageWarning').textContent = warning;
      $('previewCanvas').setAttribute('aria-label', `${labelSlide(slide())}: ${slide().blocks.map(b => b.text).filter(Boolean).join(' ')}`);
      fitPreview();
    } catch (e) { fail(e, 'exportFailed'); }
  }
  function field(label, id, control, extra = '') { return `<div class="field ${extra}"><label for="${id}">${esc(t(label))}</label>${control}</div>`; }
  function textInput(id, path, value, max = 100) { return `<input type="text" id="${id}" data-field="${path}" value="${esc(value)}" maxlength="${max}" autocomplete="off">`; }
  function range(path, label, value, min, max, step = 1, unit = '') {
    const id = 'field-' + path.replaceAll('.', '-');
    return `<div class="range-field"><div class="label-row"><label for="${id}">${esc(t(label))}</label><output for="${id}" data-output="${path}">${value}${unit}</output></div><input type="range" id="${id}" data-field="${path}" data-unit="${unit}" min="${min}" max="${max}" step="${step}" value="${value}"></div>`;
  }
  function check(path, label, checked) { return `<label class="check-row"><input type="checkbox" data-field="${path}" ${checked ? 'checked' : ''}><span>${esc(t(label))}</span></label>`; }
  function options(values, selected) { return values.map(([value, key]) => `<option value="${value}" ${selected === value ? 'selected' : ''}>${esc(t(key))}</option>`).join(''); }
  function hexControl(id, value, path, label = 'customColor') {
    return `<div class="color-custom"><input type="color" id="${id}-picker" data-color-field="${path}" value="${value}" aria-label="${esc(t(label))}"><input type="text" id="${id}-hex" class="hex-input" data-hex-field="${path}" value="${value}" maxlength="7" spellcheck="false" aria-label="${esc(t(label))}"></div>`;
  }
  function cardActions() {
    if (slide().type !== 'content') return '';
    const idx = state.project.slides.findIndex(s => s.id === slide().id);
    return `<div class="card-actions"><button class="icon-button bordered" data-action="move-slide-up" title="${esc(t('moveUp'))}" aria-label="${esc(t('moveUp'))}" ${idx === 1 ? 'disabled' : ''}>${icon('arrowUp')}</button><button class="icon-button bordered" data-action="move-slide-down" title="${esc(t('moveDown'))}" aria-label="${esc(t('moveDown'))}" ${idx === countContent() ? 'disabled' : ''}>${icon('arrowDown')}</button><button class="button outline" data-action="duplicate-slide" ${countContent() >= 6 ? 'disabled' : ''}>${icon('copy')}${esc(t('duplicate'))}</button><button class="button quiet danger-text" data-action="delete-slide" ${countContent() <= 3 ? 'disabled' : ''}>${icon('trash')}${esc(t('deleteCard'))}</button></div>`;
  }
  const expandedPins = new Set();
  function warningPin(id, message, visible) {
    return `<button type="button" id="${id}Pin" class="warning-pin" data-action="warning-pin" data-value="${id}" title="${esc(t(message))}" aria-label="${esc(t(message))}" aria-expanded="${expandedPins.has(id)}" aria-controls="${id}Note" ${visible ? '' : 'hidden'}>!</button>`;
  }
  function syncInlineWarnings() {
    const textConflict = IP.hasColorConflict(block());
    const opaque = !!slide().background.assetId && slide().background.overlayOpacity >= 100;
    const removeBackground = document.querySelector('[data-action="remove-text-background"]');
    if (removeBackground) removeBackground.disabled = !block().backgroundColor && !(block().backgroundMarks || []).some(m => m.color);
    for (const [id, visible] of [['colorConflict', textConflict], ['opaqueImage', opaque]]) {
      const pin = $(id + 'Pin'), note = $(id + 'Note');
      if (pin) { pin.hidden = !visible; pin.setAttribute('aria-expanded', String(visible && expandedPins.has(id))); }
      if (note) note.hidden = !visible || !expandedPins.has(id);
    }
  }
  function captionControl(s) {
    if (s.type !== 'cover') return '';
    const caption = IP.coverCaption(s), mode = caption?.captionMode || 'subtitle';
    return `<div class="caption-switch"><span class="field-label">${esc(t('coverCaption'))}</span><div class="segment-group" role="group" aria-label="${esc(t('coverCaption'))}">${['subtitle', 'hashtags'].map(v => `<button class="segment-button" data-action="caption-mode" data-value="${v}" aria-pressed="${mode === v}">${esc(t(v))}</button>`).join('')}</div></div>`;
  }
  function hashtagFields(b) {
    const tags = b.tags || [''];
    return `<div class="field"><p class="hint tight" style="margin-bottom:12px">${esc(t('hashtagsHelp'))}</p>${tags.map((tag, i) => `<div class="hashtag-field"><label for="hashtag-${i}">${esc(t('hashtagLabel').replace('{number}', i + 1))}</label><div class="hashtag-input-row"><span class="hashtag-prefix" aria-hidden="true">#</span><input type="text" id="hashtag-${i}" class="hashtag-input" data-tag-index="${i}" value="${esc(tag)}" maxlength="160" placeholder="${esc(t('hashtagPlaceholder'))}" autocomplete="off"><button class="icon-button" data-action="remove-hashtag" data-value="${i}" aria-label="${esc(t('removeHashtag').replace('{number}', i + 1))}" ${tags.length <= 1 && !tags[0] ? 'disabled' : ''}>${icon('close')}</button></div></div>`).join('')}<button class="button small quiet text-accent" data-action="add-hashtag" ${tags.length >= 3 ? 'disabled' : ''}>${icon('plus')}${esc(t('addHashtag'))}<span class="muted">${tags.length}/3</span></button><div id="selectionInfo" class="selection-info">${selectionLabel()}</div></div>`;
  }
  function textBackgroundField(b) {
    const value = selectionColor(true), selected = value || '#FFC83D';
    return `<div class="field background-color-field"><div class="label-row"><div class="label-with-pin"><span class="field-label" style="margin:0">${esc(t('textBackground'))}</span>${warningPin('colorConflict', 'sameColorWarning', IP.hasColorConflict(b))}</div><button class="button quiet clear-highlights" data-action="remove-text-background" title="${esc(t('backgroundScope'))}" ${!b.backgroundColor && !(b.backgroundMarks || []).some(m => m.color) ? 'disabled' : ''}>${esc(t('removeTextBackground'))}</button></div><div id="colorConflictNote" class="warning-note" role="status" ${expandedPins.has('colorConflict') && IP.hasColorConflict(b) ? '' : 'hidden'}>${esc(t('sameColorWarning'))}</div><div class="color-palette" role="group" aria-label="${esc(t('textBackground'))}">${IP.COLORS.map((c, i) => `<button class="color-swatch${c === value ? ' selected' : ''}" data-action="text-background" data-value="${c}" style="background-color:${c}" aria-label="${esc(t('paletteNames')[i])} ${c}" title="${esc(t('paletteNames')[i])} ${c}"></button>`).join('')}</div>${hexControl('textBackground', selected, 'block.backgroundColor', 'backgroundHex')}<p class="hint tight">${esc(t('backgroundHint'))}</p></div>`;
  }
  function writePanel() {
    const s = slide(), b = block(), index = s.blocks.indexOf(b);
    const currentColor = selectionColor();
    return `${captionControl(s)}<section class="panel-section"><div class="section-top"><span class="eyebrow">${esc(t('textBlocks'))}</span><span class="muted hint">${s.blocks.length}/12</span></div>
      <div class="block-list">${s.blocks.map(item => `<button class="block-chip${item.id === b.id ? ' selected' : ''}" data-action="select-block" data-block-id="${item.id}"><span class="role-mark">${item.captionMode === 'hashtags' ? '#' : item.role === 'body' ? '¶' : 'T'}</span><span class="chip-role">${esc(t(item.captionMode === 'hashtags' ? 'hashtags' : item.role))}</span><span class="chip-snippet">${esc(item.text.replace(/\n/g, ' ') || t('blockEmpty'))}</span></button>`).join('')}</div>
      <div class="block-tools"><button class="button small quiet text-accent" data-action="add-block" ${s.blocks.length >= 12 ? 'disabled' : ''}>${icon('plus')}${esc(t('addBlock'))}</button>
        <button class="icon-button" data-action="block-up" aria-label="${esc(t('blockUp'))}" title="${esc(t('blockUp'))}" ${index === 0 ? 'disabled' : ''}>${icon('arrowUp')}</button><button class="icon-button" data-action="block-down" aria-label="${esc(t('blockDown'))}" title="${esc(t('blockDown'))}" ${index === s.blocks.length - 1 ? 'disabled' : ''}>${icon('arrowDown')}</button><button class="icon-button" data-action="remove-block" aria-label="${esc(t('removeBlock'))}" title="${esc(t('removeBlock'))}" ${s.blocks.length <= 1 ? 'disabled' : ''}>${icon('trash')}</button>
      </div>
      ${b.captionMode === 'hashtags' ? hashtagFields(b) : `<div class="field"><div class="label-row"><label for="textEditor">${esc(t('text'))}</label><small id="charCount">${b.text.length} / 6000</small></div><textarea id="textEditor" data-field="block.text" maxlength="6000" placeholder="${esc(t('textPlaceholder'))}" spellcheck="true" rows="${b.role === 'body' ? 7 : 4}">${esc(b.text)}</textarea><div id="selectionInfo" class="selection-info">${selectionLabel()}</div></div>`}
      <div class="form-row">${field('role', 'blockRole', `<select id="blockRole" data-field="block.role">${options(IP.ROLES.map(r => [r, r]), b.role)}</select>`)}${field('fontSize', 'blockSize', `<input type="number" id="blockSize" data-field="block.size" min="18" max="180" value="${b.size}">`, 'narrow')}</div>
      <div class="format-row"><div class="button-group"><button class="icon-button font-bold" data-action="bold" aria-label="${esc(t('bold'))}" title="${esc(t('bold'))}" aria-pressed="${b.bold}">B</button><button class="icon-button font-italic" data-action="italic" aria-label="${esc(t('italic'))}" title="${esc(t('italic'))}" aria-pressed="${b.italic}">I</button></div><div class="button-group" role="group" aria-label="${esc(t('align'))}">${['left', 'center', 'right'].map(a => `<button class="icon-button" data-action="align" data-value="${a}" aria-pressed="${b.align === a}" title="${esc(t(a))}" aria-label="${esc(t(a))}">${icon(a)}</button>`).join('')}</div></div>
      <div class="field"><div class="label-row"><label>${esc(t('color'))}</label><button class="button quiet clear-highlights" data-action="clear-highlights" ${!b.marks.length ? 'disabled' : ''}>${esc(t('clearHighlights'))}</button></div><div class="color-palette" role="group" aria-label="${esc(t('color'))}">${IP.COLORS.map((c, i) => `<button class="color-swatch${c === currentColor ? ' selected' : ''}" data-action="text-color" data-value="${c}" style="background-color:${c}" aria-label="${esc(t('paletteNames')[i])} ${c}" title="${esc(t('paletteNames')[i])} ${c}"></button>`).join('')}</div>${hexControl('textColor', currentColor, 'block.color')}<p class="hint tight">${esc(t('selectHint'))}</p></div>
      ${b.captionMode === 'hashtags' ? check('block.underline', 'underline', b.underline) : ''}
      ${textBackgroundField(b)}
      <details id="typographyDetails"><summary>${esc(t('typography'))}</summary>
        ${field('font', 'fontFamily', `<select id="fontFamily" data-field="project.fontFamily">${options([['sans', 'sans'], ['serif', 'serif'], ['system', 'system'], ...(state.project.fontAssetId ? [['custom', 'custom']] : [])], state.project.fontFamily)}</select>`)}
        <button class="button outline full small" data-action="upload-font">${icon('upload')}${esc(t('uploadFont'))}</button>
        ${state.project.fontAssetId ? `<p class="asset-note">${esc(state.assets.items.get(state.project.fontAssetId)?.name || t('custom'))}</p>` : ''}
        <p class="hint tight">${esc(t('fontHelp'))}</p><div class="panel-section"></div>
        ${range('block.lineHeight', 'lineHeight', b.lineHeight, 1, 2, .05)}
        ${range('layout.top', 'top', s.layout.top, 4, 82, 1, '%')}
        ${range('layout.margin', 'margin', s.layout.margin, 4, 20, 1, '%')}
        ${range('layout.gap', 'gap', s.layout.gap, 8, 90, 1, ' px')}
        ${check('layout.divider', 'divider', s.layout.divider)}
        <button class="button outline full small" data-action="reset-layout">${icon('reset')}${esc(t('resetLayout'))}</button>
      </details></section>${cardActions()}`;
  }
  function imagePanel() {
    const bg = slide().background, asset = state.assets.items.get(bg.assetId), im = state.assets.images.get(bg.assetId), mode = bg.vignetteMode || 'bottom';
    return `<section class="panel-section"><div class="section-top"><span class="eyebrow">${esc(t('backgroundImage'))}</span></div>
      ${asset ? `<div class="image-file"><img src="${asset.data}" alt=""><div><strong>${esc(asset.name)}</strong><small>${im?.naturalWidth || ''} × ${im?.naturalHeight || ''}</small></div><button class="icon-button" data-action="remove-image" aria-label="${esc(t('removeImage'))}" title="${esc(t('removeImage'))}">${icon('trash')}</button></div>` : ''}
      <div class="dropzone" id="imageDropzone" role="button" tabindex="0" data-action="upload-image"><div class="drop-icon">${icon(asset ? 'upload' : 'image')}</div><strong>${esc(t(asset ? 'replaceImage' : 'uploadImage'))}</strong><small>${esc(t('dropImage'))}</small></div><p class="hint tight">${esc(t('imageHelp'))}</p>
    </section><section class="panel-section"><h2 class="subsection-title">${esc(t('backgroundLayers'))}</h2>
      <div class="label-row"><span class="field-label" style="margin:0">${esc(t('blackOverlay'))}</span>${warningPin('opaqueImage', 'opaqueImageWarning', !!asset && bg.overlayOpacity >= 100)}</div>
      ${range('background.overlayOpacity', 'overlayOpacity', bg.overlayOpacity || 0, 0, 100, 1, '%')}
      <div id="opaqueImageNote" class="warning-note" role="status" ${expandedPins.has('opaqueImage') && !!asset && bg.overlayOpacity >= 100 ? '' : 'hidden'}><p><strong>${esc(t('opaqueImageWarning'))}</strong></p><p>${esc(t('opaqueImageHelp'))}</p><div class="warning-actions"><button class="button outline small" data-action="keep-covered-image">${esc(t('keepImage'))}</button><button class="button outline small" data-action="delete-covered-image">${esc(t('deleteCoveredImage'))}</button></div></div>
      <p class="hint tight">${esc(t('overlayHint'))}</p>
      <div class="background-layer-controls"><span class="field-label">${esc(t('vignette'))}</span><div class="segment-group" role="group" aria-label="${esc(t('vignette'))}">${[['top', 'vignetteTop'], ['bottom', 'vignetteBottom'], ['both', 'vignetteBoth']].map(([v, key]) => `<button class="segment-button" data-action="vignette-mode" data-value="${v}" aria-pressed="${mode === v}">${esc(t(key))}</button>`).join('')}</div><p class="hint tight">${esc(t('vignetteHint'))}</p>
      <div class="vignette-controls" ${mode === 'none' ? 'hidden' : ''}>${range('background.vignette', 'vignetteStrength', bg.vignette, 0, 100, 1, '%')}${range('background.vignetteReach', 'vignetteReach', 100 - bg.vignetteStart, 20, 100, 1, '%')}</div>${mode === 'none' ? `<p class="hint tight">${esc(t('vignetteOff'))}</p>` : ''}</div>
    </section>
    <details id="imagePlacementDetails"><summary>${esc(t('imagePlacement'))}</summary>
      ${field('imageFit', 'imageFit', `<select id="imageFit" data-field="background.fit">${options([['cover', 'coverFit'], ['contain', 'containFit'], ['stretch', 'stretchFit']], bg.fit)}</select>`)}
      <div class="field"><span class="field-label">${esc(t('horizontal'))}</span><div class="segment-group">${[['0', 'left'], ['50', 'center'], ['100', 'right']].map(([v, k]) => `<button class="segment-button" data-action="image-x" data-value="${v}" aria-pressed="${bg.x === Number(v)}">${esc(t(k))}</button>`).join('')}</div></div>
      ${range('background.x', 'horizontal', bg.x, 0, 100, 1, '%')}${range('background.y', 'vertical', bg.y, 0, 100, 1, '%')}${range('background.scale', 'scale', bg.scale, 50, 250, 1, '%')}
      <button class="button quiet small text-accent" data-action="center-image">${icon('reset')}${esc(t('resetBackgroundPosition'))}</button>
      <div class="field" style="margin-top:18px"><span class="field-label">${esc(t('fillColor'))}</span>${hexControl('backgroundColor', bg.fill, 'background.fill')}</div>
    </details><details id="imageAdjustmentsDetails"><summary>${esc(t('adjustments'))}</summary>
      ${range('background.brightness', 'brightness', bg.brightness, -50, 50)}${range('background.contrast', 'contrast', bg.contrast, -100, 100)}${range('background.exposure', 'exposure', bg.exposure, -2, 2, .1)}${range('background.saturation', 'saturation', bg.saturation, -100, 100)}
    </details><section class="panel-section" style="margin-top:22px">
      <button class="button outline full small" data-action="reset-image">${icon('reset')}${esc(t('resetImage'))}</button>
      <button class="button quiet full small text-accent" data-action="apply-background" style="margin-top:10px">${icon('copy')}${esc(t('applyBackground'))}</button>
    </section>${cardActions()}`;
  }
  function brandPanel() {
    const b = state.project.brand, s = slide(), asset = state.assets.items.get(b.logoId);
    return `<section class="panel-section"><div class="section-top"><span class="eyebrow">${esc(t('globalBrand'))}</span></div><p class="hint" style="margin-bottom:20px">${esc(t('brandHelp'))}</p>
      ${field('brandName', 'brandName', textInput('brandName', 'brand.text', b.text))}
      ${field('brandHandle', 'brandHandle', textInput('brandHandle', 'brand.handle', b.handle))}
      <div class="field"><span class="field-label">${esc(t('brandLogo'))}</span>
      ${asset ? `<div class="image-file"><img src="${asset.data}" alt=""><div><strong>${esc(asset.name)}</strong><small>${esc(t('localOnly'))}</small></div><button class="icon-button" data-action="remove-logo" aria-label="${esc(t('removeLogo'))}">${icon('trash')}</button></div>` : ''}
      <button class="button outline full" data-action="upload-logo">${icon('upload')}${esc(t('uploadLogo'))}</button><p class="hint tight">${esc(t('logoHelp'))}</p></div>
      <div class="field"><span class="field-label">${esc(t('brandColor'))}</span>${hexControl('brandColor', b.color, 'brand.color')}</div>
      ${range('brand.opacity', 'opacity', b.opacity, 0, 100, 1, '%')}${range('brand.size', 'brandSize', b.size, 18, 52)}
      ${field('footerAlign', 'footerAlign', `<select id="footerAlign" data-field="brand.align">${options(['split', 'left', 'center', 'right'].map(v => [v, v]), b.align)}</select>`)}
      ${check('slide.showBrand', 'showFooter', s.showBrand)}
    </section><section class="panel-section"><h2 class="subsection-title">${esc(t('watermark'))}</h2><p class="hint" style="margin-bottom:18px">${esc(t('watermarkHelp'))}</p>
      ${s.type === 'brand' ? `${check('watermark.enabled', 'showWatermark', s.watermark.enabled)}${range('watermark.opacity', 'opacity', s.watermark.opacity, 0, 100, 1, '%')}${range('watermark.width', 'watermarkSize', s.watermark.width, 10, 90, 1, '%')}${range('watermark.y', 'watermarkY', s.watermark.y, 15, 85, 1, '%')}` : `<button class="button outline full" data-action="go-brand">${icon('stamp')}${esc(t('brand'))}</button>`}
    </section>${cardActions()}`;
  }
  function selectionLabel() { const s = state.selection; return s.blockId === block().id && s.end > s.start ? esc(t('selectedChars').replace('{count}', s.end - s.start)) : ''; }
  function selectionColor(background = false) {
    const b = block(), s = state.selection;
    return s.blockId === b.id && s.end > s.start ? IP.colorAt(b, s.start, background) : background ? b.backgroundColor : b.color;
  }
  function syncSelectionColors() {
    for (const [background, path, action] of [[false, 'block.color', 'text-color'], [true, 'block.backgroundColor', 'text-background']]) {
      const value = selectionColor(background);
      const picker = document.querySelector(`[data-color-field="${path}"]`), hex = document.querySelector(`[data-hex-field="${path}"]`);
      if (picker && picker !== document.activeElement) picker.value = value || '#FFC83D';
      if (hex && hex !== document.activeElement) hex.value = value || '#FFC83D';
      document.querySelectorAll(`[data-action="${action}"]`).forEach(btn => btn.classList.toggle('selected', btn.dataset.value === value));
    }
  }
  function renderEditor() {
    const panel = $('editorPanel'), scroll = panel.scrollTop, active = document.activeElement;
    const focusedId = panel.contains(active) ? active.id : null;
    const inputSelection = focusedId && /^(textarea|input)$/i.test(active.tagName) ? { start: active.selectionStart, end: active.selectionEnd } : null;
    const openDetails = new Set([...panel.querySelectorAll('details[open]')].map(d => d.id));
    panel.innerHTML = state.tab === 'write' ? writePanel() : state.tab === 'image' ? imagePanel() : brandPanel();
    panel.querySelectorAll('details').forEach(d => { d.open = openDetails.has(d.id); });
    syncInlineWarnings();
    panel.scrollTop = scroll;
    if (focusedId && $(focusedId)) {
      $(focusedId).focus({ preventScroll: true });
      if (inputSelection?.start != null) try { $(focusedId).setSelectionRange(inputSelection.start, inputSelection.end); } catch (_) { /* number and color inputs have no text selection. */ }
    } else if ($('textEditor') && state.selection.blockId === block().id) {
      const s = state.selection; $('textEditor').setSelectionRange(s.start, s.end);
    }
  }
  function selectSlide(id) {
    if (!state.project.slides.some(s => s.id === id)) return;
    state.activeSlide = id; state.activeBlock = null; state.selection = { start: 0, end: 0, blockId: null };
    state.lastKey = null; ensureSelection(); renderAll();
  }
  function setTab(tab) { state.tab = tab; state.selection = { start: 0, end: 0, blockId: state.activeBlock }; syncChrome(); renderEditor(); }
  function captureSelection() {
    const input = document.activeElement;
    if (!input || !(input.id === 'textEditor' || input.matches?.('.hashtag-input'))) return;
    const offset = input.matches('.hashtag-input') ? IP.tagOffset(block().tags, Number(input.dataset.tagIndex)) : 0;
    state.selection = { start: input.selectionStart + offset, end: input.selectionEnd + offset, blockId: block().id };
    if ($('selectionInfo')) $('selectionInfo').textContent = state.selection.end > state.selection.start ? t('selectedChars').replace('{count}', state.selection.end - state.selection.start) : '';
    syncSelectionColors();
  }
  function updateHashtag(input) {
    const b = block(), i = Number(input.dataset.tagIndex);
    if (slide().type !== 'cover' || b.captionMode !== 'hashtags' || !Number.isInteger(i) || i < 0 || i >= b.tags.length) return;
    const raw = input.value, value = IP.cleanTag(raw), caret = input.selectionStart;
    change(() => { const tags = [...b.tags]; tags[i] = value; IP.editText(b, IP.formatTags(tags)); b.tags = tags; }, { editor: false, key: 'hashtag-' + i });
    if (raw !== value) { input.value = value; const next = Math.max(0, caret - (raw.length - value.length)); input.setSelectionRange(next, next); }
    captureSelection(); syncInlineWarnings();
  }
  const numericBounds = {
    'block.size': [18, 180], 'block.lineHeight': [1, 2], 'layout.top': [4, 82], 'layout.margin': [4, 20], 'layout.gap': [8, 90],
    'background.x': [0, 100], 'background.y': [0, 100], 'background.scale': [50, 250], 'background.brightness': [-50, 50], 'background.contrast': [-100, 100], 'background.exposure': [-2, 2], 'background.saturation': [-100, 100], 'background.vignette': [0, 100], 'background.vignetteStart': [0, 80], 'background.vignetteReach': [20, 100], 'background.overlayOpacity': [0, 100],
    'brand.opacity': [0, 100], 'brand.size': [18, 52], 'watermark.opacity': [0, 100], 'watermark.width': [10, 90], 'watermark.y': [15, 85]
  };
  function updateField(input) {
    const path = input.dataset.field;
    if (!path) return;
    let value = input.type === 'checkbox' ? input.checked : input.value;
    if (numericBounds[path]) {
      if (!Number.isFinite(input.valueAsNumber)) return;
      const [min, max] = numericBounds[path]; value = IP.num(input.valueAsNumber, min, max, min);
    }
    const [root, prop] = path.split('.');
    const targets = { block: block(), layout: slide().layout, background: slide().background, brand: state.project.brand, watermark: slide().watermark, project: state.project, slide: slide() };
    const target = targets[root];
    if (!target || (!(prop in target) && path !== 'background.vignetteReach')) return;
    change(() => {
      if (path === 'block.text') IP.editText(block(), value);
      else if (path === 'block.role') { block().role = value; block().size = IP.SIZES[value]; block().bold = value !== 'body'; block().lineHeight = value === 'body' ? 1.45 : 1.12; }
      else if (path === 'background.vignetteReach') target.vignetteStart = 100 - value;
      else target[prop] = value;
    }, { editor: path === 'block.role', key: path });
    document.querySelectorAll(`[data-output="${path}"]`).forEach(out => { out.textContent = `${value}${input.dataset.unit || ''}`; });
    if (path === 'block.text') { if ($('charCount')) $('charCount').textContent = `${block().text.length} / 6000`; captureSelection(); }
    if (path === 'background.x') document.querySelectorAll('[data-action="image-x"]').forEach(btn => btn.setAttribute('aria-pressed', String(Number(btn.dataset.value) === value)));
    syncInlineWarnings();
  }
  function setColor(path, value, rerender = true) {
    const normalized = IP.color(value, '');
    if (!normalized) return false;
    if (path === 'block.color' || path === 'block.backgroundColor') {
      const b = block(), sel = state.selection.blockId === b.id ? state.selection : { start: 0, end: 0 };
      const fn = path === 'block.backgroundColor' ? IP.applyBackgroundColor : IP.applyColor;
      change(() => fn(b, sel.start, sel.end, normalized), { editor: rerender, key: path + ':' + sel.start + ':' + sel.end });
    } else {
      const [root, prop] = path.split('.'), target = root === 'background' ? slide().background : state.project.brand;
      change(() => { target[prop] = normalized; }, { editor: rerender, key: path });
    }
    if (!rerender) {
      const picker = document.querySelector(`[data-color-field="${path}"]`), hex = document.querySelector(`[data-hex-field="${path}"]`);
      if (picker) picker.value = normalized;
      if (hex && hex !== document.activeElement) hex.value = normalized;
      if (path.startsWith('block.')) syncSelectionColors();
    }
    syncInlineWarnings();
    return true;
  }
  function addContent(duplicate = false) {
    if (countContent() >= 6) { toast(t('maxContent')); return; }
    let s;
    if (duplicate && slide().type === 'content') {
      s = IP.clone(slide()); s.id = IP.uid(); s.blocks.forEach(b => { b.id = IP.uid(); });
    } else {
      s = IP.contentSlide(0, state.lang, true);
      s.background = IP.clone(slide().background);
    }
    const after = duplicate ? state.project.slides.findIndex(x => x.id === slide().id) + 1 : state.project.slides.length - 2;
    change(p => { p.slides.splice(after, 0, s); state.activeSlide = s.id; state.activeBlock = s.blocks[0].id; });
    renderSidebar(); toast(t('contentAdded'));
  }
  async function deleteContent() {
    if (slide().type !== 'content' || countContent() <= 3) { toast(t('minContent')); return; }
    const id = slide().id;
    if (!await ask(t('deleteCardConfirm').replace('{card}', labelSlide(slide())))) return;
    change(p => { const idx = p.slides.findIndex(s => s.id === id); p.slides.splice(idx, 1); state.activeSlide = p.slides[Math.max(1, idx - 1)].id; });
    renderSidebar(); toast(t('cardDeleted'));
  }
  function moveSlide(id, offset) {
    const i = state.project.slides.findIndex(s => s.id === id), next = i + offset;
    if (i < 1 || i > countContent() || next < 1 || next > countContent()) return;
    change(p => { const [moved] = p.slides.splice(i, 1); p.slides.splice(next, 0, moved); });
    renderSidebar(); toast(t('reordered'));
  }
  function reorderSlide(sourceId, targetId, after) {
    if (sourceId === targetId) return;
    const items = state.project.slides.filter(s => s.type === 'content');
    const source = items.find(s => s.id === sourceId);
    if (!source || !items.some(s => s.id === targetId)) return;
    const next = items.filter(s => s.id !== sourceId), target = next.findIndex(s => s.id === targetId);
    next.splice(target + (after ? 1 : 0), 0, source);
    change(p => { p.slides = [p.slides[0], ...next, ...p.slides.slice(-2)]; });
    renderSidebar(); toast(t('reordered'));
  }
  function moveBlock(offset) {
    const s = slide(), idx = s.blocks.findIndex(b => b.id === block().id), next = idx + offset;
    if (next < 0 || next >= s.blocks.length) return;
    change(() => { const [b] = s.blocks.splice(idx, 1); s.blocks.splice(next, 0, b); });
  }
  function addBlock(role) {
    if (slide().blocks.length >= 12) { toast(t('tooManyBlocks')); return; }
    const b = IP.block(role);
    change(() => { slide().blocks.push(b); state.activeBlock = b.id; });
    $('textEditor')?.focus();
  }
  function openMenu() {
    const menu = $('projectMenu');
    if (!menu.hidden) { closeMenu(); return; }
    menu.innerHTML = `<button class="menu-item" role="menuitem" data-action="new-project">${icon('plus')}${esc(t('newStory'))}</button><button class="menu-item" role="menuitem" data-action="open-project">${icon('folder')}${esc(t('openProject'))}</button><button class="menu-item" role="menuitem" data-action="save-project">${icon('save')}${esc(t('saveProject'))}<small>⌘ / Ctrl S</small></button><div class="menu-divider"></div><button class="menu-item" role="menuitem" data-action="add-content" ${countContent() >= 6 ? 'disabled' : ''}>${icon('plus')}${esc(t('addContent'))}<small>${countContent()}/6</small></button><label class="menu-check"><input type="checkbox" id="backupToggle" ${state.keepLocal ? 'checked' : ''}><span>${esc(t('keepLocal'))}</span></label><p class="hint menu-note">${esc(t('localLimit'))}</p><div class="menu-divider"></div><button class="menu-item" role="menuitem" data-action="about">${icon('shield')}${esc(t('about'))}</button>`;
    menu.hidden = false; $('projectMenuButton').setAttribute('aria-expanded', 'true');
  }
  function closeMenu() { $('projectMenu').hidden = true; $('projectMenuButton').setAttribute('aria-expanded', 'false'); }
  function showDialog(html, kind = '') {
    closeMenu(); const dialog = $('appDialog');
    dialog.className = `app-dialog ${kind}`; $('dialogContent').innerHTML = html;
    if (!dialog.open) dialog.showModal();
  }
  function dialogHeader(title) { return `<div class="dialog-header"><h2>${esc(title)}</h2><button class="icon-button" data-dialog="close" aria-label="${esc(t('close'))}">${icon('close')}</button></div>`; }
  function closeDialog() {
    if (state.exporting) { state.cancelExport = true; return; }
    $('appDialog').close();
    if (state.confirmCallback) { const cb = state.confirmCallback; state.confirmCallback = null; cb(false); }
  }
  function ask(message) {
    return new Promise(resolve => {
      state.confirmCallback = resolve;
      showDialog(`<div class="dialog-body">${dialogHeader(t('project'))}<p class="dialog-description">${esc(message)}</p><div class="dialog-actions"><button class="button outline" data-dialog="close">${esc(t('cancel'))}</button><button class="button primary" data-dialog="confirm">${esc(t('confirm'))}</button></div></div>`);
    });
  }
  async function newStoryDialog() {
    closeMenu();
    if (state.dirty && !await ask(t('unsavedWarning'))) return;
    showDialog(`<div class="dialog-body">${dialogHeader(t('newTitle'))}<p class="dialog-description">${esc(t('newDescription'))}</p><div class="dialog-choices"><button class="button outline" data-dialog="new-en">${icon('file')}${esc(t('exampleEn'))}</button><button class="button outline" data-dialog="new-ko">${icon('file')}${esc(t('exampleKo'))}</button><button class="button outline" data-dialog="new-blank">${icon('plus')}${esc(t('blankStory'))}</button></div></div>`);
  }
  function replaceWithNew(language, blank) {
    state.assets.dispose(); state.assets = new IP.AssetStore(); state.project = IP.createProject(language, blank);
    state.undo = []; state.redo = []; state.lastKey = null; state.dirty = false;
    state.activeSlide = state.project.slides[0].id; state.activeBlock = state.project.slides[0].blocks[1].id; state.tab = 'write';
    state.selection = { start: 0, end: 0, blockId: null }; closeDialog(); renderAll(); queueBackup();
  }
  function aboutDialog() {
    showDialog(`<div class="dialog-body">${dialogHeader('InfoPic.')}<p class="dialog-description"><strong>${esc(t('privacyShort'))}</strong><br><br>${esc(t('privacyBody'))}</p><h3 class="subsection-title">${esc(t('keyboard'))}</h3><p class="hint">${esc(t('keyboardHelp'))}</p><h3 class="subsection-title" style="margin-top:22px">${esc(t('font'))}</h3><p class="hint">${esc(t('fontHelp'))}</p><p class="hint">${esc(t('customFontWarning'))}</p><p class="hint" style="margin-top:22px">InfoPic 1.1.0 · MIT License</p></div>`);
  }
  function safeName(name) { return (String(name).replace(/[\\/:*?"<>|\x00-\x1F\x7F]/g, '').trim().replace(/\s+/g, '-').slice(0, 90) || 'infopic').replace(/\.+$/, '') || 'infopic'; }
  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = filename; a.rel = 'noopener'; a.style.display = 'none';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }
  function saveProject() {
    closeMenu();
    const json = JSON.stringify(documentValue());
    downloadBlob(new Blob([json], { type: 'application/json' }), `${safeName(state.project.name)}.infopic.json`);
    state.dirty = false; toast(t('savedToast'));
  }
  async function loadDocument(raw, restoring = false) {
    const data = IP.validateDocument(raw), nextAssets = new IP.AssetStore();
    try { await nextAssets.hydrate(data.assets); } catch (error) { nextAssets.dispose(); throw error; }
    state.assets.dispose(); state.assets = nextAssets; state.project = data.project;
    state.undo = []; state.redo = []; state.lastKey = null; state.dirty = false;
    state.activeSlide = state.project.slides[0].id; state.activeBlock = null; state.selection.blockId = null;
    IP.Renderer.clearMetrics(); renderAll();
    if (!restoring) { queueBackup(); toast(t('loadedToast')); }
  }
  async function importProject(file) {
    if (!file) return;
    if (file.size > 120 * 1024 * 1024) { toast(t('projectTooLarge')); return; }
    if (state.dirty && !await ask(t('unsavedWarning'))) return;
    busy(true, 'importing');
    try {
      let raw;
      try { raw = JSON.parse(await file.text()); } catch (_) { throw new Error('invalidProject'); }
      await loadDocument(raw);
    } catch (error) { fail(error, 'invalidProject'); }
    finally { busy(false); }
  }
  async function importImage(file, isLogo = false, targetId = state.activeSlide) {
    if (!file) return;
    busy(true, 'processing');
    try {
      if (state.assets.items.size >= 40) throw new Error('tooManyAssets');
      const store = state.assets, asset = await store.imageFromFile(file);
      if (store !== state.assets) return;
      if (isLogo) change(p => { p.brand.logoId = asset.id; });
      else change(p => { const s = p.slides.find(s => s.id === targetId); if (s) { s.background.assetId = asset.id; s.background.fit = 'cover'; s.background.x = s.background.y = 50; s.background.scale = 100; } });
      toast(t('imageLoaded'));
    } catch (error) { fail(error, 'invalidImage'); }
    finally { busy(false); }
  }
  async function importFont(file) {
    if (!file) return;
    busy(true);
    try {
      if (state.assets.items.size >= 40) throw new Error('tooManyAssets');
      const store = state.assets, asset = await store.fontFromFile(file);
      if (store !== state.assets) return;
      IP.Renderer.clearMetrics(); change(p => { p.fontAssetId = asset.id; p.fontFamily = 'custom'; }); toast(t('customFontLoaded'));
    } catch (error) { fail(error, 'invalidFont'); }
    finally { busy(false); }
  }
  function reviewStory() {
    showDialog(`<div class="dialog-body">${dialogHeader(t('reviewTitle'))}<p class="dialog-description">${esc(t('reviewHint'))}</p><div class="review-grid">${state.project.slides.map((s, idx) => `<button class="review-card${s.id === state.activeSlide ? ' selected' : ''}" data-dialog="review-select" data-id="${s.id}"><canvas data-review="${s.id}" aria-label="${esc(labelSlide(s))}"></canvas><span class="review-label"><span>${String(idx + 1).padStart(2, '0')}</span><strong>${esc(labelSlide(s))}</strong></span></button>`).join('')}</div></div>`, 'review-dialog');
    for (const s of state.project.slides) IP.Renderer.render(document.querySelector(`[data-review="${s.id}"]`), state.project, s, state.assets, 432);
  }
  function getWarnings() {
    const c = document.createElement('canvas'); let warnings = 0;
    for (const s of state.project.slides) { const r = IP.Renderer.render(c, state.project, s, state.assets, 135); if (r.overflow || r.footerOverflow) warnings++; }
    c.width = c.height = 1; return warnings;
  }
  function openExport(quick = false) {
    const warning = getWarnings();
    showDialog(`<div class="dialog-body">${dialogHeader(t('exportTitle'))}<p class="dialog-description">${esc(t('exportDescription'))}</p>
      <div class="export-summary"><canvas id="exportThumb" aria-hidden="true"></canvas><div><h3>${esc(state.project.name || t('untitled'))}</h3><p>${esc(t('exportCount').replace('{count}', state.project.slides.length))} · ${state.project.ratio} ${esc(t('portrait'))}</p><p id="exportDimensions"></p></div></div>
      ${warning ? `<div class="dialog-warning">${esc(t('exportWarning'))} (${warning})</div>` : ''}
      ${field('exportSize', 'exportWidth', `<select id="exportWidth">${[1080, 1620, 2160].map((w, i) => `<option value="${w}" ${w === state.exportWidth ? 'selected' : ''}>${w} px · ${esc(t(['standard', 'high', 'ultra'][i]))}</option>`).join('')}</select>`)}
      ${field('exportFilename', 'exportPrefix', `<input type="text" id="exportPrefix" value="${esc(safeName(state.project.name))}" maxlength="90">`)}
      <button class="button outline export-choice" data-dialog="export-current">${icon('image')}${esc(t('exportCurrent'))}<small>PNG</small></button>
      <button class="button primary export-choice" data-dialog="export-all">${icon('zip')}${esc(t('exportAll'))}<small>${state.project.slides.length} PNG</small></button>
      <div id="exportProgress" class="export-progress" hidden><span id="exportProgressLabel"></span><progress id="exportProgressBar" max="100" value="0"></progress><button class="button quiet small" data-dialog="cancel-export">${esc(t('cancel'))}</button></div>
      <p class="dialog-hint">${esc(t('exportFootnote'))}</p>
    </div>`);
    IP.Renderer.render($('exportThumb'), state.project, slide(), state.assets, 135); updateExportDimensions();
    if (quick && !(state.previewResult?.overflow || state.previewResult?.footerOverflow)) exportCards(false);
  }
  function updateExportDimensions() {
    const w = Number($('exportWidth')?.value || 1080), h = Math.round(w * (state.project.ratio === '9:16' ? 16 / 9 : 4 / 3));
    if ($('exportDimensions')) $('exportDimensions').textContent = `${w} × ${h} px`;
  }
  const yieldUI = () => new Promise(resolve => setTimeout(resolve, 24));
  async function exportCards(all) {
    if (state.exporting) return;
    state.exporting = true; state.cancelExport = false;
    const snapshot = IP.clone(state.project), currentId = state.activeSlide;
    const width = Number($('exportWidth').value); state.exportWidth = width;
    const prefix = safeName($('exportPrefix').value), selected = all ? snapshot.slides : snapshot.slides.filter(s => s.id === currentId);
    const writer = all ? new IP.ZipWriter() : null;
    $('dialogContent').querySelectorAll('button, input, select').forEach(b => { if (b.dataset.dialog !== 'cancel-export') b.disabled = true; });
    $('exportProgress').hidden = false;
    document.querySelector('[data-dialog="cancel-export"]')?.removeAttribute('hidden');
    const canvas = document.createElement('canvas');
    try {
      for (let i = 0; i < selected.length; i++) {
        if (state.cancelExport) throw new Error('exportCancelled');
        $('exportProgressLabel').textContent = `${t('exporting')} ${i + 1} / ${selected.length}`;
        $('exportProgressBar').value = Math.round(i / selected.length * 100);
        await yieldUI();
        if (state.cancelExport) throw new Error('exportCancelled');
        const s = selected[i];
        IP.Renderer.render(canvas, snapshot, s, state.assets, width);
        const blob = await IP.toBlob(canvas);
        const idx = snapshot.slides.findIndex(x => x.id === s.id) + 1;
        const contentIdx = s.type === 'content' ? `-${String(idx - 1).padStart(2, '0')}` : '';
        const filename = `${prefix}-${String(idx).padStart(2, '0')}-${s.type}${contentIdx}.png`;
        if (state.cancelExport) throw new Error('exportCancelled');
        if (writer) await writer.add(filename, blob); else downloadBlob(blob, filename);
      }
      if (state.cancelExport) throw new Error('exportCancelled');
      if (writer) downloadBlob(writer.finish(), `${prefix}-${snapshot.ratio.replace(':', 'x')}.zip`);
      $('exportProgressBar').value = 100;
      $('exportProgressLabel').textContent = '';
      $('exportProgress').hidden = true;
    } catch (error) {
      if (error.message === 'exportCancelled') { $('exportProgressLabel').textContent = t('exportCancelled'); toast(t('exportCancelled')); }
      else { fail(error, 'exportFailed'); $('exportProgressLabel').textContent = t('exportFailed'); }
    } finally {
      canvas.width = canvas.height = 1; state.exporting = false;
      $('dialogContent').querySelectorAll('button, input, select').forEach(b => { b.disabled = false; });
      document.querySelector('[data-dialog="cancel-export"]')?.setAttribute('hidden', '');
    }
  }
  async function action(name, target) {
    switch (name) {
      case 'select-block': state.activeBlock = target.dataset.blockId; state.selection = { start: 0, end: 0, blockId: state.activeBlock }; state.lastKey = null; renderEditor(); break;
      case 'add-block': showDialog(`<div class="dialog-body">${dialogHeader(t('addBlock'))}<p class="dialog-description">108 / 86 / 62 / 40 px</p><div class="dialog-choices">${IP.ROLES.map(r => `<button class="button outline" data-dialog="add-block-${r}">${icon('type')}${esc(t(r))} <span class="muted">${IP.SIZES[r]} px</span></button>`).join('')}</div></div>`); break;
      case 'block-up': moveBlock(-1); break;
      case 'block-down': moveBlock(1); break;
      case 'remove-block': if (slide().blocks.length > 1) { const id = block().id; change(() => { slide().blocks = slide().blocks.filter(b => b.id !== id); }); } break;
      case 'bold': change(() => { block().bold = !block().bold; }); break;
      case 'italic': change(() => { block().italic = !block().italic; }); break;
      case 'align': change(() => { block().align = target.dataset.value; }); break;
      case 'text-color': setColor('block.color', target.dataset.value); break;
      case 'clear-highlights': change(() => { block().marks = []; }); break;
      case 'text-background': setColor('block.backgroundColor', target.dataset.value); break;
      case 'remove-text-background': { const b = block(), sel = state.selection.blockId === b.id ? state.selection : { start: 0, end: 0 }; change(() => IP.applyBackgroundColor(b, sel.start, sel.end, null)); break; }
      case 'warning-pin': { const id = target.dataset.value; if (expandedPins.has(id)) expandedPins.delete(id); else expandedPins.add(id); syncInlineWarnings(); break; }
      case 'caption-mode': {
        if (slide().type !== 'cover') break;
        if (!IP.coverCaption(slide()) && slide().blocks.length >= 12) { toast(t('tooManyBlocks')); break; }
        change(() => { const b = IP.switchCaption(slide(), target.dataset.value); if (b) { state.activeBlock = b.id; state.selection = { start: 0, end: 0, blockId: b.id }; } });
        renderEditor(); break;
      }
      case 'add-hashtag': {
        if (block().captionMode !== 'hashtags') break;
        if (block().tags.length >= 3) { toast(t('maxHashtags')); break; }
        change(() => { block().tags.push(''); }); $('hashtag-' + (block().tags.length - 1))?.focus(); break;
      }
      case 'remove-hashtag': {
        const b = block(), i = Number(target.dataset.value);
        if (b.captionMode !== 'hashtags' || !Number.isInteger(i) || i < 0 || i >= b.tags.length) break;
        change(() => { const tags = [...b.tags]; tags.splice(i, 1); if (!tags.length) tags.push(''); IP.editText(b, IP.formatTags(tags)); b.tags = tags; state.selection = { start: 0, end: 0, blockId: b.id }; }); break;
      }
      case 'vignette-mode': {
        const bg = slide().background, next = target.dataset.value;
        if (!['top', 'bottom', 'both'].includes(next)) break;
        change(() => { bg.vignetteMode = (bg.vignetteMode || 'bottom') === next ? 'none' : next; if (bg.vignetteMode !== 'none' && bg.vignette === 0) bg.vignette = 45; }); break;
      }
      case 'keep-covered-image': expandedPins.delete('opaqueImage'); syncInlineWarnings(); break;
      case 'delete-covered-image': {
        const current = slide();
        if (current.background.assetId && current.background.overlayOpacity >= 100 && await ask(t('opaqueImageWarning'))) {
          change(() => { current.background.assetId = null; current.background.fill = '#000000'; current.background.overlayOpacity = 0; });
          expandedPins.delete('opaqueImage'); syncInlineWarnings();
        }
        break;
      }

      case 'upload-font': $('fontInput').click(); break;
      case 'reset-layout': change(() => { slide().layout = IP.clone(IP.DEFAULT_LAYOUT[slide().type]); }); toast(t('resetDone')); break;
      case 'upload-image': $('imageInput').dataset.target = state.activeSlide; $('imageInput').click(); break;
      case 'remove-image': change(() => { slide().background.assetId = null; }); break;
      case 'image-x': change(() => { slide().background.x = Number(target.dataset.value); }); break;
      case 'center-image': change(() => { Object.assign(slide().background, { x: 50, y: 50, scale: 100 }); }); break;
      case 'reset-image': change(() => { Object.assign(slide().background, { brightness: 0, contrast: 0, exposure: 0, saturation: 0, vignette: 0, vignetteStart: 22, vignetteMode: 'none', overlayOpacity: 0 }); }); break;
      case 'apply-background': { const bg = IP.clone(slide().background); if (await ask(t('applyBackgroundConfirm'))) { change(p => p.slides.forEach(s => { s.background = IP.clone(bg); })); toast(t('imageAllDone')); } break; }
      case 'upload-logo': $('logoInput').click(); break;
      case 'remove-logo': change(p => { p.brand.logoId = null; }); break;
      case 'go-brand': selectSlide(state.project.slides.at(-1).id); break;
      case 'move-slide-up': moveSlide(slide().id, -1); break;
      case 'move-slide-down': moveSlide(slide().id, 1); break;
      case 'duplicate-slide': addContent(true); break;
      case 'delete-slide': deleteContent(); break;
      case 'add-content': addContent(); closeMenu(); break;
      case 'new-project': newStoryDialog(); break;
      case 'open-project': closeMenu(); $('projectInput').click(); break;
      case 'save-project': saveProject(); break;
      case 'about': aboutDialog(); break;
    }
  }
  function bindEvents() {
    $('homeLink').addEventListener('click', e => { e.preventDefault(); aboutDialog(); });
    $('projectMenuButton').addEventListener('click', openMenu);
    document.addEventListener('pointerdown', e => { if (!e.target.closest('.project-menu-wrap')) closeMenu(); });
    $('projectMenu').addEventListener('click', e => { const el = e.target.closest('[data-action]'); if (el) action(el.dataset.action, el); });
    $('projectMenu').addEventListener('change', async e => {
      if (e.target.id !== 'backupToggle') return;
      state.keepLocal = e.target.checked; savePrefs(); syncChrome();
      clearTimeout(state.backupTimer);
      if (state.keepLocal) {
        try { await IP.backup.put(documentValue()); toast(t('backupSaved')); }
        catch (error) { state.keepLocal = false; savePrefs(); syncChrome(); e.target.checked = false; toast(t('backupFailed')); }
      } else {
        state.backupSerial = state.backupSerial.catch(() => {}).then(() => IP.backup.put(null)).then(() => toast(t('backupOff'))).catch(() => toast(t('backupFailed')));
      }
    });
    $('undoButton').addEventListener('click', () => undo()); $('redoButton').addEventListener('click', () => undo(true));
    $('languageButton').addEventListener('click', () => { state.lang = state.lang === 'en' ? 'ko' : 'en'; savePrefs(); renderAll(); toast(t('interfaceOnly')); });
    $('themeButton').addEventListener('click', () => { state.theme = state.theme === 'light' ? 'dark' : 'light'; savePrefs(); syncChrome(); });
    $('projectName').addEventListener('input', e => change(p => { p.name = e.target.value.slice(0, 120); }, { editor: false, key: 'name' }));
    $('projectName').addEventListener('blur', () => { if (!state.project.name.trim()) change(p => { p.name = t('untitled'); }, { editor: false }); });
    $('addContentButton').addEventListener('click', () => addContent());
    $('privacyButton').addEventListener('click', aboutDialog);
    $('reviewButton').addEventListener('click', reviewStory);
    $('exportButton').addEventListener('click', () => openExport());
    $('quickPngButton').addEventListener('click', () => openExport(true));
    document.querySelectorAll('[data-ratio]').forEach(el => el.addEventListener('click', () => change(p => { p.ratio = el.dataset.ratio; }, { editor: false })));
    document.querySelectorAll('[data-tab]').forEach(el => {
      el.addEventListener('click', () => setTab(el.dataset.tab));
      el.addEventListener('keydown', e => {
        if (!['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
        e.preventDefault(); const tabs = ['write', 'image', 'brand'], idx = tabs.indexOf(state.tab);
        setTab(tabs[(idx + (e.key === 'ArrowRight' ? 1 : 2)) % 3]); $(`tab-${state.tab}`).focus();
      });
    });
    $('storyList').addEventListener('click', e => {
      const button = e.target.closest('[data-action="select-slide"]');
      if (button && !state.drag?.moved) selectSlide(button.closest('[data-slide-id]').dataset.slideId);
    });
    $('storyList').addEventListener('keydown', e => {
      const handle = e.target.closest('[data-action="drag-slide"]');
      if (!handle || !['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) return;
      e.preventDefault(); const id = handle.closest('[data-slide-id]').dataset.slideId;
      moveSlide(id, ['ArrowUp', 'ArrowLeft'].includes(e.key) ? -1 : 1);
      $('storyList').querySelector(`[data-slide-id="${id}"] .drag-handle`)?.focus({ preventScroll: true });
    });
    $('storyList').addEventListener('pointerdown', startDrag);
    window.addEventListener('pointermove', continueDrag, { passive: false });
    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointercancel', cancelDrag);
    $('editorPanel').addEventListener('click', e => { const el = e.target.closest('[data-action]'); if (el && !el.disabled) action(el.dataset.action, el); });
    $('editorPanel').addEventListener('input', e => {
      const el = e.target;
      if (el.matches('.hashtag-input')) updateHashtag(el);
      if (el.matches('[data-field]') && el.type !== 'checkbox' && el.tagName !== 'SELECT') updateField(el);
      if (el.matches('[data-color-field]')) setColor(el.dataset.colorField, el.value, false);
      if (el.matches('[data-hex-field]') && /^#?[0-9a-f]{6}$/i.test(el.value)) setColor(el.dataset.hexField, el.value, false);
    });
    $('editorPanel').addEventListener('change', e => {
      const el = e.target;
      if (el.matches('[data-field]') && (el.type === 'checkbox' || el.tagName === 'SELECT')) updateField(el);
      if (el.matches('[data-hex-field]')) { if (!setColor(el.dataset.hexField, el.value)) { toast(t('colorInvalid')); renderEditor(); } }
      if (el.matches('[data-color-field]')) renderEditor();
      if (el.type === 'number') renderEditor();
    });
    $('editorPanel').addEventListener('pointerdown', e => { if (!e.target.matches('#textEditor, .hashtag-input')) captureSelection(); }, true);
    $('editorPanel').addEventListener('keyup', captureSelection);
    $('editorPanel').addEventListener('mouseup', captureSelection);
    $('editorPanel').addEventListener('select', captureSelection, true);
    document.addEventListener('selectionchange', captureSelection);
    $('editorPanel').addEventListener('keydown', e => {
      if (e.target.id === 'imageDropzone' && ['Enter', ' '].includes(e.key)) { e.preventDefault(); action('upload-image', e.target); }
    });
    for (const name of ['dragenter', 'dragover']) $('editorPanel').addEventListener(name, e => {
      const dropzone = e.target.closest('#imageDropzone'); if (!dropzone) return;
      e.preventDefault(); dropzone.classList.add('is-over'); e.dataTransfer.dropEffect = 'copy';
    });
    $('editorPanel').addEventListener('dragleave', e => { e.target.closest('#imageDropzone')?.classList.remove('is-over'); });
    $('editorPanel').addEventListener('drop', e => {
      const dropzone = e.target.closest('#imageDropzone'); if (!dropzone) return;
      e.preventDefault(); dropzone.classList.remove('is-over'); const file = e.dataTransfer.files[0]; if (file) importImage(file);
    });
    // Do not let an accidental file drop navigate the browser away from unsaved work.
    window.addEventListener('dragover', e => { if ([...e.dataTransfer.types].includes('Files')) e.preventDefault(); });
    window.addEventListener('drop', e => { if ([...e.dataTransfer.types].includes('Files')) e.preventDefault(); });
    $('imageInput').addEventListener('change', e => { importImage(e.target.files[0], false, e.target.dataset.target || state.activeSlide); e.target.value = ''; });
    $('logoInput').addEventListener('change', e => { importImage(e.target.files[0], true); e.target.value = ''; });
    $('fontInput').addEventListener('change', e => { importFont(e.target.files[0]); e.target.value = ''; });
    $('projectInput').addEventListener('change', e => { importProject(e.target.files[0]); e.target.value = ''; });
    $('previewCanvas').addEventListener('click', e => {
      const rect = e.target.getBoundingClientRect(), y = (e.clientY - rect.top) / rect.height * state.previewResult.baseHeight;
      const x = (e.clientX - rect.left) / rect.width * 1080;
      const found = state.previewResult.boxes.find(b => x >= b.x && x <= b.x + b.width && y >= b.y && y <= b.y + b.height);
      if (found) { state.activeBlock = found.id; state.selection = { start: 0, end: 0, blockId: found.id }; setTab('write'); }
    });
    $('dialogContent').addEventListener('click', async e => {
      const btn = e.target.closest('[data-dialog]'); if (!btn || btn.disabled) return;
      const a = btn.dataset.dialog;
      if (a === 'close') closeDialog();
      else if (a === 'confirm') { const cb = state.confirmCallback; state.confirmCallback = null; closeDialog(); cb?.(true); }
      else if (a === 'new-en') replaceWithNew('en', false);
      else if (a === 'new-ko') replaceWithNew('ko', false);
      else if (a === 'new-blank') replaceWithNew(state.lang, true);
      else if (a.startsWith('add-block-')) { closeDialog(); addBlock(a.replace('add-block-', '')); }
      else if (a === 'review-select') { closeDialog(); selectSlide(btn.dataset.id); }
      else if (a === 'export-current') exportCards(false);
      else if (a === 'export-all') exportCards(true);
      else if (a === 'cancel-export') state.cancelExport = true;
    });
    $('dialogContent').addEventListener('change', e => { if (e.target.id === 'exportWidth') updateExportDimensions(); });
    $('appDialog').addEventListener('cancel', e => { e.preventDefault(); closeDialog(); });
    $('appDialog').addEventListener('close', () => { if (state.confirmCallback) { const cb = state.confirmCallback; state.confirmCallback = null; cb(false); } });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeMenu();
      if (state.exporting || $('appDialog').open) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); saveProject(); }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.isComposing) { e.preventDefault(); undo(e.shiftKey); }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') { e.preventDefault(); undo(true); }
    });
    window.addEventListener('beforeunload', e => { if (state.dirty && !state.keepLocal) { e.preventDefault(); e.returnValue = ''; } });
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden' && state.keepLocal) { clearTimeout(state.backupTimer); state.backupSerial = state.backupSerial.catch(() => {}).then(() => IP.backup.put(documentValue())).catch(() => {}); } });
    if ('ResizeObserver' in window) new ResizeObserver(fitPreview).observe($('canvasArea'));
    window.addEventListener('resize', fitPreview);
  }
  let dragScrollTimer;
  function startDrag(e) {
    const handle = e.target.closest('[data-action="drag-slide"]');
    if (!handle || e.button !== 0 || state.exporting) return;
    e.preventDefault(); handle.focus({ preventScroll: true });
    const row = handle.closest('[data-slide-id]');
    state.drag = { sourceId: row.dataset.slideId, handle, pointerId: e.pointerId, x: e.clientX, y: e.clientY, currentX: e.clientX, currentY: e.clientY, moved: false, targetId: null, after: false };
    handle.setPointerCapture(e.pointerId);
  }
  function dragTarget() {
    const d = state.drag; if (!d?.moved) return;
    const horizontal = window.innerWidth <= 1100;
    document.querySelectorAll('.drop-before, .drop-after').forEach(el => el.classList.remove('drop-before', 'drop-after'));
    const under = document.elementFromPoint(d.currentX, d.currentY)?.closest('.slide-row[data-type="content"]');
    d.targetId = null;
    if (!under || under.dataset.slideId === d.sourceId) return;
    const rect = under.getBoundingClientRect();
    d.after = horizontal ? d.currentX > rect.left + rect.width / 2 : d.currentY > rect.top + rect.height / 2;
    d.targetId = under.dataset.slideId; under.classList.add(d.after ? 'drop-after' : 'drop-before');
  }
  function continueDrag(e) {
    const d = state.drag; if (!d || e.pointerId !== d.pointerId) return;
    d.currentX = e.clientX; d.currentY = e.clientY;
    if (!d.moved && Math.hypot(e.clientX - d.x, e.clientY - d.y) > 6) {
      d.moved = true; document.body.classList.add('is-reordering');
      $('storyList').querySelector(`[data-slide-id="${d.sourceId}"]`)?.classList.add('is-dragging');
      dragScrollTimer = setInterval(() => {
        if (!state.drag) return;
        const list = $('storyList'), r = list.getBoundingClientRect(), horizontal = window.innerWidth <= 1100;
        const pos = horizontal ? state.drag.currentX : state.drag.currentY, start = horizontal ? r.left : r.top, end = horizontal ? r.right : r.bottom;
        const delta = pos < start + 28 ? -10 : pos > end - 28 ? 10 : 0;
        if (horizontal) list.scrollLeft += delta; else list.scrollTop += delta;
        if (delta) dragTarget();
      }, 40);
    }
    if (d.moved) { e.preventDefault(); dragTarget(); }
  }
  function endDrag(e) {
    const d = state.drag; if (!d || e.pointerId !== d.pointerId) return;
    try { d.handle.releasePointerCapture(e.pointerId); } catch (_) { /* A layout change can release capture first. */ }
    clearInterval(dragScrollTimer); document.body.classList.remove('is-reordering');
    document.querySelectorAll('.is-dragging, .drop-before, .drop-after').forEach(el => el.classList.remove('is-dragging', 'drop-before', 'drop-after'));
    state.drag = null;
    if (d.moved && d.targetId) reorderSlide(d.sourceId, d.targetId, d.after);
  }
  function cancelDrag() {
    clearInterval(dragScrollTimer); state.drag = null; document.body.classList.remove('is-reordering');
    document.querySelectorAll('.is-dragging, .drop-before, .drop-after').forEach(el => el.classList.remove('is-dragging', 'drop-before', 'drop-after'));
  }
  async function init() {
    document.querySelectorAll('[data-icon]').forEach(el => { el.innerHTML = icon(el.dataset.icon); });
    bindEvents(); renderAll();
    if (state.keepLocal) {
      busy(true, 'importing');
      try { const saved = await IP.backup.get(); if (saved) await loadDocument(saved, true); }
      catch (error) { state.keepLocal = false; savePrefs(); syncChrome(); toast(t('backupFailed')); }
      finally { busy(false); }
    }
    document.fonts.ready.then(() => { IP.Renderer.clearMetrics(); renderPreview(); renderSidebar(); });
  }
  // Read-only snapshots for QA and browser-console inspection; not a network API.
  IP.app = Object.freeze({ getProject: () => IP.clone(state.project), getDocument: documentValue, getSelection: () => ({ slideId: state.activeSlide, blockId: state.activeBlock }), getDiagnostics: () => ({ contentCards: countContent(), undoSteps: state.undo.length, redoSteps: state.redo.length, assetCount: state.assets.items.size, exporting: state.exporting, preview: state.previewResult, language: state.lang, theme: state.theme, backup: state.keepLocal }) });
  init();
})(window.InfoPic);

