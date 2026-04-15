// ======================================================
// p5.js "pipeline" — Visualización del pipeline de PICTOS.net
// Adaptado de /cc para la presentación /pictos-chile (castellano)
// Carga SVGs vía fetch→Blob→ObjectURL con fallback local
// ======================================================

const P5_REGISTRY = new Map();

/**
 * Monta un sketch p5 dentro de cada .p5-host[data-sketch="pipeline"]
 * encontrado en la diapositiva activa. Se invoca desde main.js
 * tras la transición de Reveal.
 */
function mountP5In(sectionEl) {
  if (!sectionEl) return;
  sectionEl.querySelectorAll('.p5-host').forEach(host => {
    if (P5_REGISTRY.has(host)) return;
    const type = (host.dataset.sketch || '').toLowerCase();
    if (type !== 'pipeline') return;
    const inst = new p5(pipelineFactory(host), host);
    P5_REGISTRY.set(host, inst);
  });
}

/**
 * Desmonta el sketch p5 para liberar memoria cuando la diapositiva
 * deja de ser visible. Revoca los ObjectURL de los SVG cargados.
 */
function unmountP5In(sectionEl) {
  if (!sectionEl) return;
  sectionEl.querySelectorAll('.p5-host').forEach(host => {
    const inst = P5_REGISTRY.get(host);
    if (inst?.remove) inst.remove();
    P5_REGISTRY.delete(host);
    host.innerHTML = '';
  });
}

// Hooks de Reveal: monta/desmonta sketches al cambiar de slide
if (typeof window !== 'undefined') {
  const R = window.Reveal;
  const cur = () => (R?.getCurrentSlide ? R.getCurrentSlide() : null);
  if (R?.on) {
    R.on('ready', e => {
      document.querySelectorAll('.reveal .slides section').forEach(unmountP5In);
      mountP5In(e.currentSlide || cur());
    });
    R.on('slidechanged', e => { unmountP5In(e.previousSlide); mountP5In(e.currentSlide); });
    R.on('overviewhidden', () => {
      document.querySelectorAll('.reveal .slides section').forEach(unmountP5In);
      mountP5In(cur());
    });
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      const present = document.querySelector('.reveal .slides section.present');
      if (present) {
        document.querySelectorAll('.reveal .slides section').forEach(unmountP5In);
        mountP5In(present);
      }
    });
  }
}

// ---------- Carga SVG → HTMLImageElement vía Blob/ObjectURL ----------
async function loadSVGAsHTMLImage(primaryUrl, fallbackUrl, label) {
  const bust = (u) => u + (u.includes('?') ? '&' : '?') + 'cb=' + Date.now();

  async function fetchToImg(url) {
    const res = await fetch(bust(url), { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    const svgText = await res.text();
    const blob = new Blob([svgText], { type: 'image/svg+xml' });
    const objUrl = URL.createObjectURL(blob);
    const img = await new Promise((resolve, reject) => {
      const im = new Image();
      im.decoding = 'async';
      im.onload = () => resolve(im);
      im.onerror = reject;
      im.src = objUrl;
    });
    return { img, objUrl };
  }

  try {
    const { img, objUrl } = await fetchToImg(primaryUrl);
    return { img, used: primaryUrl, objUrl };
  } catch (e) {
    try {
      const { img, objUrl } = await fetchToImg(fallbackUrl);
      return { img, used: fallbackUrl, objUrl };
    } catch (e2) {
      return { img: null, used: fallbackUrl, objUrl: null };
    }
  }
}

// ======================================================
// Sketch del pipeline PICTOS.net (5 fases en castellano)
// ======================================================
function pipelineFactory(parentEl) {
  return function (p) {
    // URLs para los SVG de enunciado y pictograma
    const ABS_UTTER = 'https://herbertspencer.net/pictos-chile/svg/utterance.svg';
    const ABS_PICTO = 'https://herbertspencer.net/pictos-chile/svg/pictogram-g.svg';
    const LOC_UTTER = '/pictos-chile/svg/utterance.svg';
    const LOC_PICTO = '/pictos-chile/svg/pictogram-g.svg';

    let columns = [];
    let svgUtter = null, svgPicto = null;
    let urlUObj = null, urlPObj = null;

    // Dimensiones y tipografía
    const columnHeight = 300, labelSize = 14, labelFont = 'Lexend';
    const labelMarginNormal = 8, labelMarginImage = -80;

    /**
     * Colores de cada fase del pipeline.
     * Corresponden a las 5 fases: COMPRENDER, COMPONER, PRODUCIR, VECTORIZAR, ESTRUCTURAR
     */
    const COLORS = {
      "COMPRENDER": { r: 65, g: 47, b: 166 },
      "COMPONER":   { r: 161, g: 76, b: 87 },
      "PRODUCIR":   { r: 236, g: 98, b: 27 },
      "VECTORIZAR": { r: 112, g: 40, b: 11 },
      "ESTRUCTURAR":{ r: 44, g: 9, b: 2 }
    };

    const COLDEF = [
      { label: "Enunciado",    type: "image" },
      { label: "COMPRENDER",   type: "normal" },
      { label: "COMPONER",     type: "normal" },
      { label: "PRODUCIR",     type: "normal" },
      { label: "VECTORIZAR",   type: "normal" },
      { label: "ESTRUCTURAR",  type: "normal" },
      { label: "Pictograma",   type: "image" }
    ];

    // Estado de las conexiones animadas
    const BASE_ALPHA = 0, PEAK_ALPHA = 200;
    const BASE_STROKE = 0.25, PEAK_STROKE = 1.0;
    let connectionStates = [];
    let hover = null, dragging = null, dx = 0, dy = 0;
    let px = 0, py = 0;

    function toLocal(e) {
      const r = p.canvas.getBoundingClientRect();
      const t = e?.touches?.[0] || e?.changedTouches?.[0] || e;
      const cx = t?.clientX ?? 0, cy = t?.clientY ?? 0;
      return { x: (cx - r.left) * (p.width / r.width), y: (cy - r.top) * (p.height / r.height) };
    }
    function upd(e) { const v = toLocal(e); px = v.x; py = v.y; }

    p.setup = async function () {
      p.createCanvas(parentEl.clientWidth, parentEl.clientHeight);
      p.textFont(labelFont);
      p.textSize(labelSize);
      p.textAlign(p.CENTER, p.TOP);
      p.canvas.style.touchAction = 'none';

      const U = await loadSVGAsHTMLImage(ABS_UTTER, LOC_UTTER, 'enunciado');
      const P = await loadSVGAsHTMLImage(ABS_PICTO, LOC_PICTO, 'pictograma');
      svgUtter = U.img; urlUObj = U.objUrl;
      svgPicto = P.img; urlPObj = P.objUrl;

      generateColumns();
      p.canvas.addEventListener('pointermove', upd, { passive: true });
      p.canvas.addEventListener('pointerdown', upd, { passive: true });
      p.canvas.addEventListener('pointerup', upd, { passive: true });
    };

    p.remove = function () {
      try { if (urlUObj) URL.revokeObjectURL(urlUObj); } catch (_) {}
      try { if (urlPObj) URL.revokeObjectURL(urlPObj); } catch (_) {}
      p._removeElements?.();
      const cnv = p.canvas;
      cnv?.parentNode?.removeChild?.(cnv);
    };

    p.windowResized = function () {
      p.resizeCanvas(parentEl.clientWidth, parentEl.clientHeight);
      generateColumns();
    };

    p.draw = function () {
      p.clear();
      hover = null;
      detectHover(px, py);
      drawConnections();
      drawColumns();
    };

    // --- Interacción: arrastrar columnas ---
    p.mousePressed = function (e) {
      upd(e);
      for (const c of columns) {
        if (px >= c.left && px <= c.left + c.w && py >= c.top && py <= c.top + c.h) {
          dragging = c; dx = px - c.left; dy = py - c.top; break;
        }
      }
    };
    p.mouseDragged = function (e) {
      if (!dragging) return;
      upd(e);
      dragging.left = px - dx; dragging.top = py - dy;
      dragging.x = dragging.left + dragging.w / 2;
      if (dragging.type === 'image') {
        const cx = dragging.left + dragging.w / 2, cy = dragging.top + dragging.h / 2;
        for (const n of dragging.nodes) { n.x = cx; n.y = cy; }
      } else {
        const n = dragging.nodes.length, gap = dragging.h / (n + 1);
        for (let i = 0; i < n; i++) {
          dragging.nodes[i].x = dragging.left + dragging.w / 2;
          dragging.nodes[i].y = dragging.top + gap * (i + 1);
        }
      }
    };
    p.mouseReleased = () => { dragging = null; };

    /**
     * Genera las columnas del pipeline distribuyéndolas
     * horizontalmente en el canvas. Cada columna tiene nodos
     * que representan puntos de conexión para las líneas animadas.
     */
    function generateColumns() {
      columns = [];
      const spacing = p.width / (COLDEF.length + 1);
      for (let i = 0; i < COLDEF.length; i++) {
        const def = COLDEF[i];
        const cx = spacing * (i + 1);
        const w = spacing * 0.19;
        const yTop = p.height / 2 - columnHeight / 2;
        const isImage = def.type === 'image';
        const nodes = [];
        if (isImage) {
          for (let k = 0; k < 20; k++) nodes.push({ x: cx, y: yTop + columnHeight / 2 });
        } else {
          const gap = columnHeight / 21;
          for (let j = 0; j < 20; j++) nodes.push({ x: cx, y: yTop + gap * (j + 1) });
        }
        const colRGB = isImage ? { r: 230, g: 230, b: 230 } : (COLORS[def.label] || { r: 200, g: 80, b: 80 });
        columns.push({ label: def.label, type: def.type, x: cx, y: yTop, w, h: columnHeight, left: cx - w / 2, top: yTop, nodes, color: colRGB });
      }
      // Inicializar estados de conexión entre columnas adyacentes
      connectionStates = [];
      for (let i = 0; i < columns.length - 1; i++) {
        const a = columns[i].nodes.length, b = columns[i + 1].nodes.length;
        const rows = [];
        for (let ia = 0; ia < a; ia++) {
          const row = [];
          for (let ib = 0; ib < b; ib++) row.push({ progress: 0, state: 'idle' });
          rows.push(row);
        }
        connectionStates.push(rows);
      }
    }

    function detectHover(x, y) {
      if (dragging) return;
      for (const c of columns) {
        if (x >= c.left && x <= c.left + c.w && y >= c.top && y <= c.top + c.h) { hover = c; return; }
      }
    }

    /**
     * Dibuja las columnas del pipeline: rectángulos coloreados para las fases,
     * imágenes SVG para enunciado y pictograma, y etiquetas debajo.
     */
    function drawColumns() {
      p.rectMode(p.CORNER);
      for (const c of columns) {
        if (c.type === 'normal') {
          p.noStroke();
          p.fill(c.color.r, c.color.g, c.color.b, (c === hover ? 200 : 120));
          p.rect(c.left, c.top, c.w, c.h, 12);
        }
        if (c.type === 'image') {
          const el = (c.label === 'Enunciado') ? svgUtter : (c.label === 'Pictograma') ? svgPicto : null;
          if (el && el.naturalWidth && el.naturalHeight) {
            const drawW = 100;
            const ar = el.naturalWidth / el.naturalHeight;
            const drawH = drawW / (ar || 1);
            const ctx = p.drawingContext;
            ctx.imageSmoothingEnabled = true;
            ctx.drawImage(el, c.left + c.w / 2 - drawW / 2, c.top + c.h / 2 - drawH / 2, drawW, drawH);
          } else {
            p.noStroke(); p.fill(240);
            p.rect(c.left, c.top + c.h / 2 - 18, c.w, 36, 8);
            p.fill(120); p.textSize(12);
            p.text('cargando…', c.left + c.w / 2, c.top + c.h / 2 - 6);
            p.textSize(labelSize);
          }
        } else {
          p.noStroke();
          p.fill(c.color.r, c.color.g, c.color.b);
          for (const n of c.nodes) p.circle(n.x, n.y, 4);
        }
        p.noStroke(); p.fill(0); p.textSize(labelSize);
        const m = (c.type === 'image') ? labelMarginImage : labelMarginNormal;
        p.text(c.label, c.left + c.w / 2, c.top + c.h + m);
      }
    }

    /**
     * Dibuja las conexiones animadas entre columnas adyacentes.
     * Cada conexión parpadea aleatoriamente simulando flujo de datos.
     */
    function drawConnections() {
      if (!connectionStates.length) return;
      for (let i = 0; i < columns.length - 1; i++) {
        const A = columns[i], B = columns[i + 1];
        const col = (B.type === 'image' && B.label === 'Pictograma') ? { r: 0, g: 0, b: 0 } : B.color;
        const nodesA = A.nodes, nodesB = B.nodes, states = connectionStates[i];
        for (let ia = 0; ia < nodesA.length; ia++) {
          if (!states[ia]) continue;
          for (let ib = 0; ib < nodesB.length; ib++) {
            const n1 = nodesA[ia], n2 = nodesB[ib], st = states[ia][ib];
            if (st.state === 'idle') { if (p.random() < 0.001) { st.state = 'fading-in'; st.progress = 0; } }
            else if (st.state === 'fading-in') { st.progress += 0.04; if (st.progress >= 1) { st.progress = 1; st.state = 'fading-out'; } }
            else if (st.state === 'fading-out') { st.progress -= 0.02; if (st.progress <= 0) { st.progress = 0; st.state = 'idle'; } }
            if (st.progress > 0) {
              const t = st.progress < 0.5 ? 4 * st.progress ** 3 : 1 - Math.pow(-2 * st.progress + 2, 3) / 2;
              p.stroke(col.r, col.g, col.b, p.lerp(0, PEAK_ALPHA, t));
              p.strokeWeight(p.lerp(BASE_STROKE, PEAK_STROKE, t));
              p.line(n1.x, n1.y, n2.x, n2.y);
            }
          }
        }
      }
    }
  };
}
