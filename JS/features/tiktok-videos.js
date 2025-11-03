// Упрощённый tiktok-videos.js — minimal, pagination, JSONP fallback, hover-load embeds.

const TIKTOK_API_URL = "https://script.google.com/macros/s/AKfycbyLHO_O19I7wubGDdiwo8TTUaD65T2rd32YetL1HwK8zhmy18-AA5bym41NbpyL8sTi/exec";
const AUTO_REFRESH_MS = 60_000; // автообновление каждые 60s

let embedScriptLoaded = false;
let lastDataHash = "";

function ensureEmbedScript() {
  if (embedScriptLoaded) return Promise.resolve();
  return new Promise((resolve) => {
    if (document.querySelector('script[src="https://www.tiktok.com/embed.js"]')) {
      embedScriptLoaded = true;
      resolve();
      return;
    }
    const s = document.createElement('script');
    s.src = 'https://www.tiktok.com/embed.js';
    s.async = true;
    s.onload = () => {
      embedScriptLoaded = true;
      resolve();
    };
    s.onerror = () => {
      // не фатально — embeds могут не отобразиться
      resolve();
    };
    document.body.appendChild(s);
  });
}

function jsonpFetch(url, timeout = 8000) {
  return new Promise((resolve, reject) => {
    const cb = '__tiktok_cb_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
    const sep = url.includes('?') ? '&' : '?';
    const script = document.createElement('script');
    let done = false;
    function cleanup() {
      if (script.parentNode) script.parentNode.removeChild(script);
      try { delete window[cb]; } catch (e) { window[cb] = undefined; }
      if (timer) clearTimeout(timer);
    }
    window[cb] = function(data) {
      if (done) return;
      done = true;
      cleanup();
      resolve(data);
    };
    script.src = `${url}${sep}callback=${cb}`;
    script.onerror = function() {
      if (done) return;
      done = true;
      cleanup();
      reject(new Error('JSONP script error'));
    };
    const timer = setTimeout(() => {
      if (done) return;
      done = true;
      cleanup();
      reject(new Error('JSONP timeout'));
    }, timeout);
    document.head.appendChild(script);
  });
}

async function fetchApi(apiUrl) {
  try {
    const res = await fetch(apiUrl, { cache: 'no-store', mode: 'cors', credentials: 'omit' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const ct = (res.headers.get('content-type') || '').toLowerCase();
    if (ct.includes('application/json')) return await res.json();
    const txt = await res.text();
    try { return JSON.parse(txt); } catch { 
      // попытка извлечь ссылки из текста
      return Array.from(new Set((txt.match(/https?:\/\/(?:www\.)?tiktok\.com\/[^\s"'><)]+/g) || [])));
    }
  } catch (err) {
    // fallback на JSONP (Apps Script должен поддерживать callback)
    try {
      return await jsonpFetch(apiUrl);
    } catch (e) {
      throw err;
    }
  }
}

function normalizeList(raw) {
  if (!raw) return [];
  // если объект {url:...} или [{url:...}, ...] -> массив строк
  if (!Array.isArray(raw) && typeof raw === 'object') {
    // возможно Google sheets возвращает {table:...} - не обрабатываем подробно, берем пусто
    return [];
  }
  const arr = Array.isArray(raw) ? raw : [];
  const out = arr.map(item => {
    if (!item) return null;
    if (typeof item === 'string') return item.trim();
    if (typeof item === 'object') {
      return (item.url || item.link || item['Ссылка на TikTok'] || item.tiktok || "").trim() || null;
    }
    return null;
  }).filter(Boolean).map(s => s.split('?')[0].replace(/\/+$/, ''));
  // уникальные
  return Array.from(new Set(out));
}

function createControls(container, onChange) {
  const controls = document.createElement('div');
  controls.className = 'tiktok-controls';
  controls.style.margin = '10px 0;display:flex;gap:8px;align-items:center';

  const pageSizeLabel = document.createElement('label');
  pageSizeLabel.textContent = 'На странице:';
  pageSizeLabel.style.marginRight = '6px';

  const pageSizeSel = document.createElement('select');
  [10,20,30].forEach(n => {
    const opt = document.createElement('option');
    opt.value = String(n);
    opt.textContent = String(n);
    pageSizeSel.appendChild(opt);
  });
  pageSizeSel.value = '10';

  const prevBtn = document.createElement('button');
  prevBtn.textContent = '←';
  prevBtn.style.minWidth = '36px';
  const nextBtn = document.createElement('button');
  nextBtn.textContent = '→';
  nextBtn.style.minWidth = '36px';

  const pageInfo = document.createElement('span');
  pageInfo.style.minWidth = '120px';

  const refreshBtn = document.createElement('button');
  refreshBtn.textContent = 'Обновить';

  controls.appendChild(pageSizeLabel);
  controls.appendChild(pageSizeSel);
  controls.appendChild(prevBtn);
  controls.appendChild(pageInfo);
  controls.appendChild(nextBtn);
  controls.appendChild(refreshBtn);

  container.prepend(controls);

  return { pageSizeSel, prevBtn, nextBtn, pageInfo, refreshBtn, onChange };
}

function createCard(link) {
  const card = document.createElement('div');
  card.className = 'tiktok-card';
  card.style = 'width:100%;max-width:420px;margin:8px;padding:8px;border:1px solid #eee;border-radius:6px;box-sizing:border-box;transition:opacity .35s';
  // simple placeholder preview + play icon
  card.innerHTML = `
    <div class="preview" style="position:relative;padding-top:56.25%;background:#f7f7f7;border-radius:4px;overflow:hidden;">
      <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#666;font-weight:600">TikTok</div>
      <div class="play" style="position:absolute;left:10px;bottom:10px;background:rgba(0,0,0,.6);color:#fff;padding:6px;border-radius:4px;font-size:12px">Открыть</div>
    </div>
    <div style="margin-top:8px;word-break:break-all"><a href="${link}" target="_blank" rel="noopener noreferrer">${link}</a></div>
    <div class="embed" style="display:none;margin-top:8px"></div>
  `;
  // hover or click -> load embed (once)
  let loaded = false;
  const preview = card.querySelector('.preview');
  const embed = card.querySelector('.embed');

  function load() {
    if (loaded) return;
    loaded = true;
    // create tiktok embed blockquote
    const bq = document.createElement('blockquote');
    bq.className = 'tiktok-embed';
    bq.setAttribute('cite', link);
    const idMatch = link.match(/\/video\/([^\/\?]+)/);
    if (idMatch) bq.setAttribute('data-video-id', idMatch[1]);
    const a = document.createElement('a');
    a.href = link;
    a.textContent = link;
    bq.appendChild(a);
    embed.innerHTML = '';
    embed.appendChild(bq);
    embed.style.display = 'block';
    preview.style.display = 'none';
    ensureEmbedScript().then(() => {
      try { if (window.tiktokEmbeds && typeof window.tiktokEmbeds.render === 'function') window.tiktokEmbeds.render(); }
      catch (e) {}
    });
  }

  preview.addEventListener('mouseenter', () => { /* UX: only preview */ });
  preview.addEventListener('click', load);
  card.addEventListener('mouseenter', () => {
    // optional: lazy load on hover (short delay)
    card._hoverTimer = setTimeout(load, 250);
  });
  card.addEventListener('mouseleave', () => {
    if (card._hoverTimer) clearTimeout(card._hoverTimer);
  });

  return card;
}

function applyFade(el) {
  el.style.opacity = '0';
  requestAnimationFrame(() => { el.style.transition = 'opacity .35s'; el.style.opacity = '1'; });
}

async function renderPagination(container, links) {
  // clear old controls/contents
  container.innerHTML = '';
  // inject simple CSS for layout + fade
  if (!document.getElementById('tiktok-simple-styles')) {
    const style = document.createElement('style');
    style.id = 'tiktok-simple-styles';
    style.textContent = `
      #video-list .list { display:flex;flex-wrap:wrap;gap:12px;align-items:flex-start; }
    `;
    document.head.appendChild(style);
  }

  const ctrl = createControls(container);
  let pageSize = Number(ctrl.pageSizeSel.value) || 10;
  let pageIndex = 0;
  const listWrap = document.createElement('div');
  listWrap.className = 'list';
  listWrap.style.transition = 'opacity .35s';
  container.appendChild(listWrap);

  function updateInfo() {
    const total = links.length;
    const pages = Math.max(1, Math.ceil(total / pageSize));
    ctrl.pageInfo.textContent = `Страница ${pageIndex + 1} / ${pages} (всего ${total})`;
    ctrl.prevBtn.disabled = pageIndex === 0;
    ctrl.nextBtn.disabled = pageIndex >= pages - 1;
  }

  function showPage(idx) {
    pageIndex = Math.max(0, Math.min(idx, Math.ceil(links.length / pageSize) - 1));
    listWrap.innerHTML = '';
    const start = pageIndex * pageSize;
    const slice = links.slice(start, start + pageSize);
    slice.forEach(link => {
      const card = createCard(link);
      listWrap.appendChild(card);
    });
    applyFade(listWrap);
    updateInfo();
  }

  ctrl.pageSizeSel.addEventListener('change', () => {
    pageSize = Number(ctrl.pageSizeSel.value) || 10;
    pageIndex = 0;
    showPage(0);
  });
  ctrl.prevBtn.addEventListener('click', () => showPage(pageIndex - 1));
  ctrl.nextBtn.addEventListener('click', () => showPage(pageIndex + 1));
  ctrl.refreshBtn.addEventListener('click', () => loadAndRender(container, true));

  showPage(0);
}

function hashData(arr) {
  try { return JSON.stringify(arr).slice(0, 10000); } catch { return String(arr.length); }
}

async function loadAndRender(container, force = false) {
  const API_URL = (container.dataset.api || window.TIKTOK_API_URL || TIKTOK_API_URL).trim();
  try {
    const raw = await fetchApi(API_URL);
    const list = normalizeList(raw);
    const h = hashData(list);
    if (!force && h === lastDataHash) return;
    lastDataHash = h;
    // keep only latest links and rebuild pagination
    await renderPagination(container, list);
  } catch (e) {
    container.innerHTML = `<div style="padding:12px;color:#8a6d3b">Ошибка загрузки списка: ${String(e.message || e)}</div>`;
  }
}

function initSimpleTikTok() {
  const container = document.getElementById('video-list');
  if (!container) return;
  // ensure container empty and has basic styling
  container.innerHTML = '';
  container.style.minHeight = '40px';
  // initial load
  loadAndRender(container);
  // auto-refresh
  setInterval(() => loadAndRender(container), AUTO_REFRESH_MS);
}

// auto init
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initSimpleTikTok);
else initSimpleTikTok();
