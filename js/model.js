/* InfoPic — MIT. All project data stays in the browser. */
'use strict';
window.InfoPic = window.InfoPic || {};
(function (IP) {
  const VERSION = 2; // v1 documents migrate on import; v2 preserves caption drafts and background ranges.
  const uid = () => (globalThis.crypto?.randomUUID?.() || `ip-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`);
  const clone = value => JSON.parse(JSON.stringify(value));
  const ROLES = ['title', 'hook', 'subtitle', 'body'];
  const SIZES = { title: 108, hook: 86, subtitle: 62, body: 40 };
  const COLORS = ['#FFFFFF', '#000000', '#9CA3AF', '#FFC83D', '#B8E55C', '#72CFF8', '#FA7D92', '#FF9766', '#BEA5FF', '#66D3B2'];
  const FONTS = {
    sans: 'Arial, "Helvetica Neue", "Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans CJK KR", "Noto Sans CJK JP", "Noto Sans CJK SC", "Hiragino Kaku Gothic ProN", "Yu Gothic", Meiryo, "PingFang SC", "Microsoft YaHei", sans-serif',
    serif: 'Georgia, "Times New Roman", "Noto Serif CJK KR", "Noto Serif CJK JP", "Noto Serif CJK SC", "AppleMyungjo", Batang, "Yu Mincho", "Hiragino Mincho ProN", "Songti SC", SimSun, serif',
    system: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", "Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans CJK KR", "Noto Sans CJK JP", "Noto Sans CJK SC", "Yu Gothic", "Microsoft YaHei", sans-serif'
  };
  const color = (value, fallback = '#FFFFFF') => {
    if (typeof value !== 'string') return fallback;
    let v = value.trim();
    if (/^#?[0-9a-f]{3}$/i.test(v)) v = '#' + v.replace('#', '').split('').map(x => x + x).join('');
    if (/^#?[0-9a-f]{6}$/i.test(v)) return ('#' + v.replace('#', '')).toUpperCase();
    return fallback;
  };
  function block(role, text = '', extra = {}) {
    return { id: uid(), role, text, size: SIZES[role], color: '#FFFFFF', bold: role !== 'body', italic: false, align: 'left', lineHeight: role === 'body' ? 1.45 : 1.12, marks: [], backgroundColor: null, backgroundMarks: [], underline: false, ...extra };
  }
  const DEFAULT_LAYOUT = {
    cover: { top: 40, margin: 8, gap: 28, divider: false },
    content: { top: 31, margin: 8, gap: 32, divider: true },
    hook: { top: 39, margin: 8, gap: 36, divider: false },
    brand: { top: 28, margin: 10, gap: 34, divider: false }
  };
  function slide(type, blocks, extra = {}) {
    return {
      id: uid(), type, blocks, layout: clone(DEFAULT_LAYOUT[type]),
      background: { assetId: null, fill: '#25272E', fit: 'cover', x: 50, y: 50, scale: 100, brightness: 0, contrast: 0, exposure: 0, saturation: 0, vignette: 45, vignetteStart: 22, vignetteMode: 'bottom', overlayOpacity: 0 },
      showBrand: true,
      watermark: { enabled: type === 'brand', opacity: 20, width: 64, y: 75 },
      ...extra
    };
  }
  function contentSlide(index = 0, language = 'en', blank = false) {
    const en = [
      ['One card.\nOne clear idea.', 'Start with the point you want someone to remember.\n\nGive it a short heading, then add just enough context to make it useful.'],
      ['Make room\nfor the message.', 'Keep your words readable and your background quiet.\n\nA little space and one accent color can do more than a dozen decorations.'],
      ['Finish with\na reason to act.', 'Ask a thoughtful question. Suggest a practical next step.\n\nThen add your name, so a useful idea leads back to you.']
    ];
    const ko = [
      ['한 장에는\n하나의 생각만.', '독자가 기억했으면 하는 핵심부터 고른다.\n\n짧은 소제목을 붙이고, 이해에 필요한 설명만 남긴다.'],
      ['메시지가\n보일 공간을 만든다.', '글은 읽기 쉽게, 배경은 차분하게 정리한다.\n\n적당한 여백과 하나의 강조색이면 충분하다.'],
      ['다음 행동을\n떠올리게 한다.', '생각할 질문이나 바로 시도할 방법을 제안한다.\n\n마지막에는 이름을 남겨, 유용한 정보가 다시 나에게 연결되게 한다.']
    ];
    const pair = (language === 'ko' ? ko : en)[index % 3];
    return slide('content', [block('subtitle', blank ? '' : pair[0]), block('body', blank ? '' : pair[1])]);
  }
  function createProject(language = 'en', blank = false) {
    const ko = language === 'ko';
    const headline = ko ? '좋은 생각을\n저장하고 싶은\n콘텐츠로.' : 'Good ideas\ndeserve a\nbetter format.';
    const coverTitle = block('title', blank ? '' : headline, { lineHeight: 1.08 });
    if (!blank) {
      const start = headline.lastIndexOf('\n') + 1;
      coverTitle.marks = [{ start, end: headline.length, color: '#FFC83D' }];
    }
    return {
      name: ko ? '첫 번째 프로젝트' : 'My first project', ratio: '3:4',
      fontFamily: 'sans', fontAssetId: null,
      brand: { text: 'YOUR BRAND', handle: '@your.handle', logoId: null, color: '#FFFFFF', opacity: 90, size: 28, align: 'split' },
      slides: [
        slide('cover', [
          block('body', blank ? '' : (ko ? '생각을 선명하게' : 'IDEAS, IN FOCUS'), { size: 28, bold: true, color: '#BFC0C7' }),
          coverTitle,
          block('subtitle', blank ? '' : (ko ? '알고 있는 것을\n공유하고 싶은 이야기로.' : 'Turn what you know into\nsomething worth saving.'), { size: 46, bold: false, lineHeight: 1.28 })
        ]),
        ...[0, 1, 2].map(i => contentSlide(i, language, blank)),
        slide('hook', [block('hook', blank ? '' : (ko ? '다음에는 어떤\n생각을 나눌까?' : 'What will you\nshare next?'), { color: '#FFC83D' }), block('body', blank ? '' : (ko ? '유용한 생각 하나면 시작하기에 충분하다.' : 'One useful idea is a great place to start.'))]),
        slide('brand', [block('hook', blank ? '' : (ko ? '다시 찾아올\n이유가 있는 이야기.' : 'Ideas worth\ncoming back to.'), { align: 'center' }), block('body', blank ? '' : (ko ? '당신의 다음 이야기가 여기서 시작된다.' : 'Your next story starts here.'), { align: 'center' })])
      ]
    };
  }
  function applyRange(block, start, end, value, baseKey, marksKey) {
    const length = block.text.length;
    start = Math.max(0, Math.min(length, Number(start) || 0));
    end = Math.max(start, Math.min(length, Number(end) || 0));
    if (start >= end) { block[baseKey] = value; block[marksKey] = []; return; }
    const out = [];
    for (const mark of block[marksKey] || []) {
      if (mark.end <= start || mark.start >= end) out.push({ ...mark });
      else {
        if (mark.start < start) out.push({ ...mark, end: start });
        if (mark.end > end) out.push({ ...mark, start: end });
      }
    }
    out.push({ start, end, color: value });
    out.sort((a, b) => a.start - b.start);
    block[marksKey] = out.reduce((merged, mark) => {
      const last = merged.at(-1);
      if (last && last.end === mark.start && last.color === mark.color) last.end = mark.end;
      else merged.push(mark);
      return merged;
    }, []);
  }
  function applyColor(block, start, end, value) {
    applyRange(block, start, end, color(value, block.color), 'color', 'marks');
  }
  function applyBackgroundColor(block, start, end, value) {
    applyRange(block, start, end, value === null ? null : color(value), 'backgroundColor', 'backgroundMarks');
  }
  function colorAt(block, index, background = false) {
    let result = background ? (block.backgroundColor || null) : block.color;
    for (const mark of block[background ? 'backgroundMarks' : 'marks'] || []) {
      if (index >= mark.start && index < mark.end) result = mark.color;
    }
    return result;
  }
  function hasColorConflict(block) {
    // Check effective runs, not just the block defaults. Transparent areas do not conflict.
    for (let i = 0; i < block.text.length; i++) {
      if (/\s/.test(block.text[i])) continue;
      const bg = colorAt(block, i, true);
      if (bg && color(colorAt(block, i)) === color(bg)) return true;
    }
    return false;
  }
  // Ranges use UTF-16 offsets, matching browser text selection, including CJK and emoji.
  function editText(block, text) {
    text = String(text).replace(/\r\n?/g, '\n').slice(0, 6000);
    const old = block.text;
    let start = 0;
    while (start < old.length && start < text.length && old[start] === text[start]) start++;
    let oldEnd = old.length, newEnd = text.length;
    while (oldEnd > start && newEnd > start && old[oldEnd - 1] === text[newEnd - 1]) { oldEnd--; newEnd--; }
    const delta = (newEnd - start) - (oldEnd - start);
    for (const key of ['marks', 'backgroundMarks']) {
      block[key] = (block[key] || []).map(mark => {
        if (mark.end <= start) return mark;
        if (mark.start >= oldEnd) return { ...mark, start: mark.start + delta, end: mark.end + delta };
        return { ...mark, start: Math.min(mark.start, start), end: mark.end >= oldEnd ? mark.end + delta : newEnd };
      }).filter(m => m.end > m.start && m.start >= 0 && m.end <= text.length);
    }
    block.text = text;
  }
  const cleanTag = value => String(value ?? '').replace(/[\r\n\t]/g, ' ').replace(/^\s*#+\s*/, '').replace(/^\s+/, '').slice(0, 160);
  const tagText = value => cleanTag(value).trim();
  const formatTags = tags => tags.map(tagText).filter(Boolean).map(tag => '#' + tag).join('\n');
  const tagOffset = (tags, index) => tags.slice(0, index).map(tagText).filter(Boolean).reduce((n, tag) => n + tag.length + 2, 0) + 1;
  const STYLE_KEYS = ['role', 'text', 'size', 'color', 'bold', 'italic', 'align', 'lineHeight', 'marks', 'backgroundColor', 'backgroundMarks', 'underline'];
  function styleSnapshot(b) { return Object.fromEntries(STYLE_KEYS.map(k => [k, clone(b[k] ?? (k === 'backgroundColor' ? null : k.endsWith('Marks') || k === 'marks' ? [] : false))])); }
  function coverCaption(s) {
    return s.type === 'cover' ? s.blocks.find(b => b.captionMode) || [...s.blocks].reverse().find(b => b.role === 'subtitle') || null : null;
  }
  function switchCaption(s, mode) {
    if (s.type !== 'cover' || !['subtitle', 'hashtags'].includes(mode)) return null;
    let b = coverCaption(s);
    if (!b) {
      if (s.blocks.length >= 12) return null;
      b = block('subtitle', '', { size: 46, bold: false, lineHeight: 1.28 }); s.blocks.push(b);
    }
    const oldMode = b.captionMode || 'subtitle';
    if (oldMode === mode) { b.captionMode = mode; return b; }
    if (mode === 'hashtags') {
      b.subtitleDraft = styleSnapshot(b);
      b.tags = (b.tags || ['']).slice(0, 3).map(cleanTag);
      Object.assign(b, b.hashtagDraft || styleSnapshot(block('body', '', { size: 32, underline: true, lineHeight: 1.45 })));
      b.text = formatTags(b.tags);
    } else {
      b.hashtagDraft = styleSnapshot(b);
      Object.assign(b, b.subtitleDraft || styleSnapshot(block('subtitle', '', { size: 46, bold: false, lineHeight: 1.28 })));
    }
    b.captionMode = mode;
    return b;
  }
  const num = (v, low, high, def) => Number.isFinite(Number(v)) ? Math.min(high, Math.max(low, Number(v))) : def;
  const str = (v, max, def = '') => typeof v === 'string' ? v.slice(0, max) : def;
  const one = (v, choices, def) => choices.includes(v) ? v : def;
  function cleanStyle(b) {
    b = b && typeof b === 'object' ? b : {};
    const role = one(b.role, ROLES, 'body'), text = str(b.text, 6000).replace(/\r\n?/g, '\n');
    const marks = (key, nullable = false) => (Array.isArray(b[key]) ? b[key] : []).slice(0, 1000)
      .filter(m => m && Number.isInteger(m.start) && Number.isInteger(m.end) && m.start >= 0 && m.end > m.start && m.end <= text.length)
      .map(m => ({ start: m.start, end: m.end, color: nullable && m.color === null ? null : color(m.color) }));
    return { role, text, size: num(b.size, 18, 180, SIZES[role]), color: color(b.color), bold: !!b.bold, italic: !!b.italic,
      align: one(b.align, ['left', 'center', 'right'], 'left'), lineHeight: num(b.lineHeight, 1, 2, 1.25), marks: marks('marks'),
      backgroundColor: color(b.backgroundColor, null), backgroundMarks: marks('backgroundMarks', true), underline: !!b.underline };
  }
  function validateDocument(raw) {
    if (!raw || raw.format !== 'infopic-project' || ![1, VERSION].includes(raw.version) || !raw.project || !Array.isArray(raw.assets)) throw new Error('invalidProject');
    const p = raw.project;
    if (!Array.isArray(p.slides) || p.slides.length < 6 || p.slides.length > 9) throw new Error('invalidProject');
    const types = p.slides.map(s => s?.type);
    if (types[0] !== 'cover' || types.at(-2) !== 'hook' || types.at(-1) !== 'brand' || !types.slice(1, -2).every(t => t === 'content')) throw new Error('invalidProject');
    if (raw.assets.length > 40) throw new Error('tooManyAssets');
    const assetIds = new Set(), assets = [];
    for (const a of raw.assets) {
      if (!a || typeof a.id !== 'string' || !/^[\w-]{1,100}$/.test(a.id) || assetIds.has(a.id)) throw new Error('invalidProject');
      if (a.kind !== 'image' && a.kind !== 'font') throw new Error('invalidProject');
      if (typeof a.data !== 'string' || a.data.length > 45000000) throw new Error('invalidProject');
      const pattern = a.kind === 'image' ? /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=\r\n]+$/ : /^data:(font\/(ttf|otf|woff2?|sfnt)|application\/(octet-stream|font-woff|x-font-ttf|x-font-opentype));base64,[A-Za-z0-9+/=\r\n]+$/;
      if (!pattern.test(a.data)) throw new Error('invalidProject');
      assetIds.add(a.id);
      assets.push({ id: a.id, kind: a.kind, name: str(a.name, 160, 'Asset'), data: a.data });
    }
    const ref = (id, kind) => {
      if (id === null || id === undefined || id === '') return null;
      if (!assets.some(a => a.id === id && a.kind === kind)) throw new Error('missingAsset');
      return id;
    };
    const ids = new Set();
    const slides = p.slides.map(s => {
      if (!s || !Array.isArray(s.blocks) || s.blocks.length < 1 || s.blocks.length > 12) throw new Error('invalidProject');
      const type = s.type, bg = s.background || {}, l = s.layout || {}, w = s.watermark || {};
      let captionFound = false;
      const blocks = s.blocks.map(b => {
        if (!b || !ROLES.includes(b.role)) throw new Error('invalidProject');
        const result = block(b.role, '', cleanStyle(b));
        if (type === 'cover' && !captionFound && ['subtitle', 'hashtags'].includes(b.captionMode)) {
          captionFound = true; result.captionMode = b.captionMode;
          result.tags = (Array.isArray(b.tags) && b.tags.length ? b.tags : ['']).slice(0, 3).map(cleanTag);
          if (b.subtitleDraft) result.subtitleDraft = cleanStyle(b.subtitleDraft);
          if (b.hashtagDraft) result.hashtagDraft = cleanStyle(b.hashtagDraft);
          if (result.captionMode === 'hashtags') editText(result, formatTags(result.tags));
        }
        return result;
      });
      const item = slide(type, blocks, {
        layout: { top: num(l.top, 4, 82, DEFAULT_LAYOUT[type].top), margin: num(l.margin, 4, 20, 8), gap: num(l.gap, 8, 90, 28), divider: !!l.divider },
        background: { assetId: ref(bg.assetId, 'image'), fill: color(bg.fill, '#25272E'), fit: one(bg.fit, ['cover', 'contain', 'stretch'], 'cover'), x: num(bg.x, 0, 100, 50), y: num(bg.y, 0, 100, 50), scale: num(bg.scale, 50, 250, 100), brightness: num(bg.brightness, -50, 50, 0), contrast: num(bg.contrast, -100, 100, 0), exposure: num(bg.exposure, -2, 2, 0), saturation: num(bg.saturation, -100, 100, 0), vignette: num(bg.vignette, 0, 100, 45), vignetteStart: num(bg.vignetteStart, 0, 80, 22), vignetteMode: one(bg.vignetteMode, ['none', 'top', 'bottom', 'both'], 'bottom'), overlayOpacity: num(bg.overlayOpacity, 0, 100, 0) },
        showBrand: s.showBrand !== false,
        watermark: { enabled: !!w.enabled, opacity: num(w.opacity, 0, 100, 20), width: num(w.width, 10, 90, 64), y: num(w.y, 15, 85, 75) }
      });
      ids.add(item.id);
      return item;
    });
    const brand = p.brand || {};
    return {
      project: {
        name: str(p.name, 120, 'Untitled project'), ratio: one(p.ratio, ['3:4', '9:16'], '3:4'),
        fontFamily: one(p.fontFamily, ['sans', 'serif', 'system', 'custom'], 'sans'), fontAssetId: ref(p.fontAssetId, 'font'),
        brand: { text: str(brand.text, 100), handle: str(brand.handle, 100), logoId: ref(brand.logoId, 'image'), color: color(brand.color), opacity: num(brand.opacity, 0, 100, 90), size: num(brand.size, 18, 52, 28), align: one(brand.align, ['left', 'center', 'right', 'split'], 'split') },
        slides
      }, assets
    };
  }
  function referencedAssets(p) {
    return new Set([p.fontAssetId, p.brand.logoId, ...p.slides.map(s => s.background.assetId)].filter(Boolean));
  }
  Object.assign(IP, { VERSION, uid, clone, ROLES, SIZES, COLORS, FONTS, color, block, slide, DEFAULT_LAYOUT, contentSlide, createProject, applyColor, applyBackgroundColor, colorAt, hasColorConflict, editText, cleanTag, tagText, formatTags, tagOffset, coverCaption, switchCaption, validateDocument, referencedAssets, num });
})(window.InfoPic);

