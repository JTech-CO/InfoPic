/* One Canvas renderer powers editing, review, thumbnails, and PNG export. */
'use strict';
(function (IP) {
  const BASE = 1080;
  const measureCache = new Map();
  const segmenter = typeof Intl.Segmenter === 'function' ? new Intl.Segmenter(undefined, { granularity: 'grapheme' }) : null;
  const isCJK = s => /[\u2E80-\u9FFF\uAC00-\uD7AF\uF900-\uFAFF\u3040-\u30FF]/u.test(s);
  const noStart = /[、。，．？！：；）」』】〕〉》,.;:!?%\)]/u;
  const noEnd = /[（「『【〔〈《\(]/u;
  function fontFamily(project) {
    return project.fontFamily === 'custom' && project.fontAssetId ? `"InfoPic-${project.fontAssetId}", ${IP.FONTS.sans}` : IP.FONTS[project.fontFamily] || IP.FONTS.sans;
  }
  function font(block, family) { return `${block.italic ? 'italic' : 'normal'} ${block.bold ? 700 : 400} ${block.size}px ${family}`; }
  function graphemes(text) {
    if (segmenter) return [...segmenter.segment(text)].map(s => ({ char: s.segment, index: s.index }));
    let index = 0; return Array.from(text).map(char => { const item = { char, index }; index += char.length; return item; });
  }
  function measure(ctx, text, fontValue) {
    const key = fontValue + '\u0000' + text;
    if (measureCache.has(key)) return measureCache.get(key);
    ctx.font = fontValue;
    const width = ctx.measureText(text).width;
    if (measureCache.size > 24000) measureCache.clear();
    measureCache.set(key, width); return width;
  }
  function wrap(ctx, block, width, family) {
    const f = font(block, family), glyphs = graphemes(block.text.replace(/\r\n?/g, '\n'));
    let line = [], lineWidth = 0;
    const lines = [];
    const trimEnd = list => { while (list.length && /[\t ]/.test(list.at(-1).char)) list.pop(); return list; };
    const push = list => { list = trimEnd(list); lines.push({ glyphs: list, width: list.reduce((sum, g) => sum + g.width, 0) }); };
    for (const g of glyphs) {
      if (g.char === '\n') { push(line); line = []; lineWidth = 0; continue; }
      g.char = g.char === '\t' ? '    ' : g.char;
      g.width = measure(ctx, g.char, f);
      g.color = IP.colorAt(block, g.index);
      g.backgroundColor = IP.colorAt(block, g.index, true);
      if (!line.length && g.char === ' ') continue;
      if (line.length && lineWidth + g.width > width) {
        let breakAt = -1;
        // Prefer word boundaries; CJK text may wrap between graphemes.
        for (let i = line.length - 1; i > 0; i--) {
          if (/\s/.test(line[i].char)) { breakAt = i; break; }
          if ((isCJK(line[i - 1].char) || isCJK(line[i].char)) && !noStart.test(line[i].char) && !noEnd.test(line[i - 1].char)) { breakAt = i; break; }
        }
        if (isCJK(g.char) && !noStart.test(g.char) && !noEnd.test(line.at(-1).char)) breakAt = line.length;
        // Keep closing punctuation with the preceding glyph; allow a tiny optical overhang.
        if (noStart.test(g.char) && lineWidth + g.width <= width + block.size * 0.55) {
          line.push(g); lineWidth += g.width; continue;
        }
        if (breakAt > 0) {
          const remainder = line.slice(breakAt); push(line.slice(0, breakAt));
          while (remainder.length && /\s/.test(remainder[0].char)) remainder.shift();
          line = remainder; lineWidth = line.reduce((sum, item) => sum + item.width, 0);
          if (lineWidth + g.width > width && line.length) { push(line); line = []; lineWidth = 0; }
        } else { push(line); line = []; lineWidth = 0; }
      }
      if (!line.length && g.char === ' ') continue;
      line.push(g); lineWidth += g.width;
    }
    if (line.length || block.text.endsWith('\n')) push(line);
    return { lines, font: f, height: lines.length * block.size * block.lineHeight };
  }
  function drawImageBackground(ctx, bg, assets, width, height) {
    const image = assets.images.get(bg.assetId);
    if (!image) return;
    const effects = bg.brightness !== 0 || bg.contrast !== 0 || bg.exposure !== 0 || bg.saturation !== 0;
    if (!effects) { drawFitted(ctx, image, width, height, bg); return; }
    const key = JSON.stringify([bg.assetId, bg.fit, bg.x, bg.y, bg.scale, bg.brightness, bg.contrast, bg.exposure, bg.saturation, width, height]);
    let surface = assets.effects.get(key);
    if (!surface) {
      surface = document.createElement('canvas'); surface.width = width; surface.height = height;
      const sc = surface.getContext('2d', { willReadFrequently: true });
      drawFitted(sc, image, width, height, bg);
      const pixels = sc.getImageData(0, 0, width, height), data = pixels.data;
      const lut = new Uint8ClampedArray(256);
      const exposure = 2 ** bg.exposure, bright = bg.brightness * 2.55;
      const c = Math.max(-254, Math.min(254, bg.contrast * 2.54)), factor = 259 * (c + 255) / (255 * (259 - c));
      for (let i = 0; i < 256; i++) lut[i] = factor * ((i * exposure + bright) - 128) + 128;
      const sat = 1 + bg.saturation / 100;
      for (let i = 0; i < data.length; i += 4) {
        if (!data[i + 3]) continue;
        const r = lut[data[i]], g = lut[data[i + 1]], b = lut[data[i + 2]];
        const y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        data[i] = y + (r - y) * sat; data[i + 1] = y + (g - y) * sat; data[i + 2] = y + (b - y) * sat;
      }
      sc.putImageData(pixels, 0, 0);
      // Bound retained pixel buffers to prevent runaway memory after slider edits.
      const retainedBytes = () => [...assets.effects.values()].reduce((total, c) => total + c.width * c.height * 4, 0);
      while (assets.effects.size && (assets.effects.size >= 8 || retainedBytes() + width * height * 4 > 48 * 1024 * 1024)) { const oldest = assets.effects.keys().next().value; const canvas = assets.effects.get(oldest); canvas.width = canvas.height = 1; assets.effects.delete(oldest); }
      assets.effects.set(key, surface);
    }
    ctx.drawImage(surface, 0, 0);
  }
  function drawFitted(ctx, image, width, height, bg) {
    const iw = image.naturalWidth, ih = image.naturalHeight;
    const fit = bg.fit === 'contain' ? Math.min(width / iw, height / ih) : Math.max(width / iw, height / ih);
    const scale = bg.scale / 100;
    const dw = (bg.fit === 'stretch' ? width : iw * fit) * scale;
    const dh = (bg.fit === 'stretch' ? height : ih * fit) * scale;
    const dx = (width - dw) * bg.x / 100, dy = (height - dh) * bg.y / 100;
    ctx.drawImage(image, dx, dy, dw, dh);
  }
  function drawFooter(ctx, project, slide, assets, height, family) {
    if (!slide.showBrand) return false;
    const b = project.brand, margin = 86, available = BASE - margin * 2;
    const logo = assets.images.get(b.logoId), logoH = 42;
    const logoW = logo ? Math.min(140, logoH * logo.naturalWidth / logo.naturalHeight) : 0;
    const actualLogoH = logo ? logoW * logo.naturalHeight / logo.naturalWidth : 0;
    ctx.save(); ctx.fillStyle = b.color; ctx.globalAlpha = b.opacity / 100; ctx.textBaseline = 'middle';
    ctx.font = `700 ${b.size}px ${family}`;
    const textW = ctx.measureText(b.text).width;
    ctx.font = `400 ${b.size * 0.88}px ${family}`;
    const handleW = ctx.measureText(b.handle).width;
    const logoGap = logo && b.text ? 16 : 0, handleGap = b.text && b.handle ? 24 : 0;
    const nameGroupW = logoW + logoGap + textW, total = nameGroupW + handleGap + handleW;
    const y = height - 80;
    let x = margin;
    if (b.align === 'center') x = (BASE - total) / 2;
    else if (b.align === 'right') x = BASE - margin - total;
    if (logo) ctx.drawImage(logo, x, y - actualLogoH / 2, logoW, actualLogoH);
    x += logoW + logoGap;
    ctx.font = `700 ${b.size}px ${family}`; ctx.fillText(b.text, x, y);
    ctx.font = `400 ${b.size * 0.88}px ${family}`;
    const handleX = b.align === 'split' ? BASE - margin - handleW : x + textW + handleGap;
    ctx.fillText(b.handle, handleX, y);
    ctx.restore(); return total > available;
  }
  function drawWatermark(ctx, project, slide, assets, height, family) {
    if (slide.type !== 'brand' || !slide.watermark.enabled) return;
    const w = slide.watermark, logo = assets.images.get(project.brand.logoId), width = BASE * w.width / 100, y = height * w.y / 100;
    ctx.save(); ctx.globalAlpha = w.opacity / 100;
    if (logo) {
      const scale = Math.min(width / logo.naturalWidth, height * .22 / logo.naturalHeight);
      const dw = logo.naturalWidth * scale, dh = logo.naturalHeight * scale;
      ctx.drawImage(logo, (BASE - dw) / 2, y - dh / 2, dw, dh);
    } else if (project.brand.text) {
      ctx.font = `700 100px ${family}`;
      const naturalWidth = ctx.measureText(project.brand.text).width;
      const size = Math.min(120, 100 * width / Math.max(1, naturalWidth));
      ctx.font = `700 ${size}px ${family}`; ctx.fillStyle = project.brand.color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(project.brand.text, BASE / 2, y);
    }
    ctx.restore();
  }
  function render(canvas, project, slide, assets, width = BASE) {
    width = Math.max(90, Math.round(width));
    const height = Math.round(width * (project.ratio === '9:16' ? 16 / 9 : 4 / 3)), scale = width / BASE;
    const baseHeight = height / scale;
    if (canvas.width !== width) canvas.width = width;
    if (canvas.height !== height) canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = slide.background.fill; ctx.fillRect(0, 0, width, height);
    drawImageBackground(ctx, slide.background, assets, width, height);
    ctx.scale(scale, scale);
    ctx.fontKerning = 'none';
    const bg = slide.background;
    if (bg.overlayOpacity > 0) {
      ctx.fillStyle = `rgba(0,0,0,${bg.overlayOpacity / 100})`; ctx.fillRect(0, 0, BASE, baseHeight);
    }
    const mode = bg.vignetteMode || 'bottom';
    if (bg.vignette > 0 && mode !== 'none') {
      const start = baseHeight * bg.vignetteStart / 100, reach = baseHeight - start;
      const drawEdge = top => {
        const gradient = ctx.createLinearGradient(0, top ? reach : start, 0, top ? 0 : baseHeight);
        gradient.addColorStop(0, 'rgba(0,0,0,0)');
        gradient.addColorStop(.57, `rgba(0,0,0,${bg.vignette / 100 * .52})`);
        gradient.addColorStop(1, `rgba(0,0,0,${bg.vignette / 100})`);
        ctx.fillStyle = gradient; ctx.fillRect(0, top ? 0 : start, BASE, reach);
      };
      if (mode === 'top' || mode === 'both') drawEdge(true);
      if (mode === 'bottom' || mode === 'both') drawEdge(false);
    }
    const family = fontFamily(project);
    drawWatermark(ctx, project, slide, assets, baseHeight, family);
    let y = baseHeight * slide.layout.top / 100, previousRole = null, separatorDrawn = false;
    const margin = BASE * slide.layout.margin / 100, textWidth = BASE - margin * 2;
    const boxes = [];
    for (const block of slide.blocks) {
      if (!block.text) continue;
      const layout = wrap(ctx, block, textWidth, family);
      if (slide.layout.divider && !separatorDrawn && previousRole && previousRole !== 'body' && block.role === 'body') {
        ctx.save(); ctx.globalAlpha = .22; ctx.strokeStyle = block.color; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(margin, y - slide.layout.gap / 2); ctx.lineTo(BASE - margin, y - slide.layout.gap / 2); ctx.stroke(); ctx.restore(); separatorDrawn = true;
      }
      ctx.font = layout.font; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      const lineH = block.size * block.lineHeight;
      for (let i = 0; i < layout.lines.length; i++) {
        const line = layout.lines[i];
        let x = margin + (block.align === 'center' ? (textWidth - line.width) / 2 : block.align === 'right' ? textWidth - line.width : 0);
        const baseline = y + i * lineH + (lineH - block.size) / 2 + block.size * .88;
        // Paint each contiguous background run once, then all glyphs. Wrapped lines
        // keep separate rectangles; no preview-only HTML styling is involved.
        const lineX = x, padX = block.size * .045, padY = block.size * .045;
        let offset = 0, run = null;
        const runs = [];
        let ascent = block.size * .78, descent = block.size * .10;
        for (const g of line.glyphs) {
          if (g.backgroundColor) {
            if (run && run.color === g.backgroundColor) run.width += g.width;
            else { run = { x: lineX + offset, width: g.width, color: g.backgroundColor }; runs.push(run); }
          } else run = null;
          const metrics = ctx.measureText(g.char);
          ascent = Math.max(ascent, metrics.actualBoundingBoxAscent || 0);
          descent = Math.max(descent, metrics.actualBoundingBoxDescent || 0);
          offset += g.width;
        }
        for (const r of runs) {
          ctx.fillStyle = r.color;
          ctx.fillRect(r.x - padX, baseline - ascent - padY, r.width + padX * 2, ascent + descent + padY * 2);
        }
        for (const g of line.glyphs) { ctx.fillStyle = g.color; ctx.fillText(g.char, x, baseline); x += g.width; }
        if (block.underline && line.glyphs.length) {
          let ux = lineX;
          const thickness = Math.max(1.5, block.size * .04), uy = baseline + descent + Math.max(2, block.size * .08);
          for (const g of line.glyphs) { ctx.fillStyle = g.color; ctx.fillRect(ux, uy, g.width, thickness); ux += g.width; }
        }
      }
      boxes.push({ id: block.id, x: margin, y, width: textWidth, height: layout.height });
      y += layout.height + slide.layout.gap; previousRole = block.role;
    }
    const safeBottom = baseHeight - (slide.showBrand ? 148 : 55);
    const overflow = boxes.some(b => b.y + b.height > safeBottom);
    const footerOverflow = drawFooter(ctx, project, slide, assets, baseHeight, family);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    return { width, height, baseHeight, boxes, overflow, footerOverflow, safeBottom };
  }
  IP.Renderer = { render, wrap, fontFamily, clearMetrics: () => measureCache.clear() };
})(window.InfoPic);

