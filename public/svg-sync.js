(() => {
  const esc = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;')
                    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');

  function wrapBlockById(text, id, k) {
    const reOpen = new RegExp(`<([a-zA-Z][\\w:-]*)\\b[^>]*\\bid=(["'])${id}\\2[^>]*>`);
    const m = reOpen.exec(text);
    if (!m) return text;
    const tag = m[1], openStart = m.index, openEnd = m.index + m[0].length;

    if (m[0].endsWith('/>')) {
      return text.slice(0, openStart) + `__MF_START_${k}__`
           + text.slice(openStart, openEnd) + `__MF_END_${k}__`
           + text.slice(openEnd);
    }
    let depth = 1, i = openEnd, reAny = new RegExp(`<\\/?${tag}\\b[^>]*>`,'g');
    reAny.lastIndex = i;
    for (;;) {
      const nx = reAny.exec(text);
      if (!nx) break;
      const tok = nx[0];
      if (tok.startsWith(`</${tag}`)) depth--;
      else if (!tok.endsWith('/>')) depth++;
      i = nx.index + tok.length;
      if (depth === 0) break;
    }
    return text.slice(0, openStart) + `__MF_START_${k}__`
         + text.slice(openStart, i) + `__MF_END_${k}__`
         + text.slice(i);
  }

  function markAllBlocks(svgText) {
    const ids = new Set(); let m;
    const re = /\bid=(["'])([^"']+)\1/g;
    while ((m = re.exec(svgText))) ids.add(m[2]);
    let txt = svgText, k = 0;
    for (const id of ids) { txt = wrapBlockById(txt, id, k); k++; }
    return { txt, total:k };
  }

  function wrapCommentsIntoSpans(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_COMMENT, null);
    const starts = new Map(); const pairs = []; let node;
    while ((node = walker.nextNode())) {
      const s = node.data.match(/^MF_START_(\d+)$/);
      const e = node.data.match(/^MF_END_(\d+)$/);
      if (s) starts.set(s[1], node);
      if (e) { const i=e[1], st=starts.get(i); if (st) pairs.push({i,startNode:st,endNode:node}); }
    }
    pairs.forEach(({i,startNode,endNode}) => {
      const range = document.createRange();
      range.setStartAfter(startNode); range.setEndBefore(endNode);
      const span = document.createElement('span');
      span.className = 'code-node'; span.dataset.mfI = i;
      const fragText = range.cloneContents().textContent || '';
      const m = fragText.match(/\bid\s*=\s*["']([^"']+)["']/);
      if (m) span.dataset.id = m[1];
      try { range.surroundContents(span); } catch {}
      startNode.remove(); endNode.remove();
    });
  }

  function bindSync(svgEl, codeEl) {
    const idMap = new Map();
    svgEl.querySelectorAll('[id]').forEach(n => idMap.set(n.id, n));

    const setSel = (id, on) => {
      const node = idMap.get(id);
      if (node) node.classList.toggle('is-selected', on);
      codeEl.querySelectorAll(`.code-node[data-id="${CSS.escape(id)}"]`)
            .forEach(n => n.classList.toggle('is-selected', on));
    };

    // código → svg
    codeEl.addEventListener('mouseover', e => {
      const t = e.target.closest('.code-node'); if (t) setSel(t.dataset.id, true);
    });
    codeEl.addEventListener('mouseout', e => {
      const t = e.target.closest('.code-node'); if (t) setSel(t.dataset.id, false);
    });

    // svg → código
    idMap.forEach((node, id) => {
      node.style.cursor = 'pointer';
      node.addEventListener('mouseenter', () => setSel(id, true), {passive:true});
      node.addEventListener('mouseleave', () => setSel(id, false), {passive:true});
    });
  }

  // Inicializa TODAS las slides .svg-code-sync
  document.querySelectorAll('.svg-code-sync').forEach(slide => {
    if (slide.dataset.syncInit === '1') return;
    slide.dataset.syncInit = '1';

    const codeEl = slide.querySelector('[data-role="svg-source"]');
    const stage  = slide.querySelector('[data-role="svg-stage"]');
    const svgURL = slide.dataset.svgUrl || '';
    if (!codeEl || !stage || !svgURL) return;

    fetch(svgURL).then(r => r.text()).then(svgText => {
      const { txt, total } = markAllBlocks(svgText);

      let html = esc(txt);
      for (let i = 0; i < total; i++) {
        html = html.replaceAll(esc(`__MF_START_${i}__`), `<!--MF_START_${i}-->`)
                   .replaceAll(esc(`__MF_END_${i}__`),   `<!--MF_END_${i}-->`);
      }
      codeEl.innerHTML = html;
      if (window.Prism?.highlightElement) window.Prism.highlightElement(codeEl);
      requestAnimationFrame(() => wrapCommentsIntoSpans(codeEl));

      stage.innerHTML = svgText;
      const svgEl = stage.querySelector('svg');
      if (svgEl) bindSync(svgEl, codeEl);
    });
  });

  // Resolve data-svg-url robustly and guard against HTML fallbacks (Vite, SPA routers, GH Pages)
function resolveURL(href) {
  // Works whether the module sits in <head> or is external; avoids null currentScript in modules
  return new URL(href, document.baseURI).toString();
}

async function fetchSVGText(svgHref) {
  const url = resolveURL(svgHref);
  const r = await fetch(url, {
    headers: { Accept: 'image/svg+xml,text/xml,application/xml;q=0.9,*/*;q=0.8' }
  });
  const text = await r.text();
  const ct = (r.headers.get('content-type') || '').toLowerCase();

  // Heuristics: if server fell back to index.html, content-type will be text/html
  // or the body will contain an HTML doctype/head tag.
  const looksHTML = ct.includes('text/html') || /<!doctype\s+html>|<html[\s>]/i.test(text);
  if (!r.ok || looksHTML) {
    throw new Error(
      `Expected SVG, got ${ct || 'unknown content'} from ${url}.` +
      ` Is the path correct and not caught by SPA fallback?`
    );
  }
  return text;
}

})();

