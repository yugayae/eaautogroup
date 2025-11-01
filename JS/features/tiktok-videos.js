// Полная замена файла tiktok-videos.js — загружает список ссылок из Google Apps Script и отображает TikTok embeds.
// Настройте data-api на контейнере <div id="video-list" data-api="ВАШ_URL"></div> или измените TIKTOK_API_URL ниже.

const TIKTOK_API_URL = "https://script.google.com/macros/s/AKfycbyLHO_O19I7wubGDdiwo8TTUaD65T2rd32YetL1HwK8zhmy18-AA5bym41NbpyL8sTi/exec";

const DEV_MODE = false;
const DEV_TEST_VIDEOS = [
  // Примеры для локальной отладки:
  // "https://www.tiktok.com/@scout2015/video/6718335390845095173",
];

// Кэш для oEmbed
const oEmbedCache = new Map();
let embedScriptLoaded = false;

async function fetchTikTokOEmbed(videoUrl) {
  if (oEmbedCache.has(videoUrl)) return oEmbedCache.get(videoUrl);

  try {
    const oEmbedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(videoUrl)}`;
    const res = await fetch(oEmbedUrl, { method: 'GET', headers: { 'Accept': 'application/json' }, mode: 'cors', credentials: 'omit' });
    if (!res.ok) throw new Error(`oEmbed HTTP ${res.status}`);
    const data = await res.json();
    oEmbedCache.set(videoUrl, data);
    return data;
  } catch (e) {
    console.warn("[tiktok] oEmbed failed for", videoUrl, e);
    return { title: "Видео TikTok", author_name: "", thumbnail_url: "", html: "" };
  }
}

function createVideoCard(videoUrl, oEmbedData) {
  const div = document.createElement("div");
  div.className = "video-card";
  div.dataset.videoUrl = videoUrl;

  const title = (oEmbedData && oEmbedData.title) ? oEmbedData.title : "Видео TikTok";
  const author = (oEmbedData && oEmbedData.author_name) ? oEmbedData.author_name : "";

  let preview = (oEmbedData && oEmbedData.thumbnail_url) ? oEmbedData.thumbnail_url : "";
  if (!preview && oEmbedData && oEmbedData.html) {
    const m = oEmbedData.html.match(/<img[^>]+src="([^"]+)"/);
    if (m) preview = m[1];
  }
  if (!preview) preview = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'%3E%3Crect fill='%23e0e0e0' width='400' height='400'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23999' font-family='Arial' font-size='18'%3ETikTok%3C/text%3E%3C/svg%3E";

  div.innerHTML = `
    <div class="video-preview">
      <img src="${preview}" alt="${title}" class="preview-image" loading="lazy">
      <div class="play-overlay">
        <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="30" cy="30" r="30" fill="rgba(0,0,0,0.6)"/>
          <path d="M23 18L23 42L42 30L23 18Z" fill="white"/>
        </svg>
      </div>
    </div>
    <div class="video-info">
      <p class="video-title">${escapeHtml(title)}</p>
      ${author ? `<p class="video-author">@${escapeHtml(author)}</p>` : ''}
    </div>
    <div class="video-embed-container" style="display:none;"></div>
  `;

  let embedLoaded = false;
  let hoverTimeout = null;

  div.addEventListener('mouseenter', () => {
    hoverTimeout = setTimeout(() => {
      if (!embedLoaded) {
        loadVideoEmbed(div, videoUrl);
        embedLoaded = true;
      }
      const embedContainer = div.querySelector('.video-embed-container');
      const previewEl = div.querySelector('.video-preview');
      if (embedContainer && embedContainer.children.length > 0) {
        embedContainer.style.display = 'block';
        if (previewEl) previewEl.style.display = 'none';
      }
    }, 250);
  });

  div.addEventListener('mouseleave', () => {
    if (hoverTimeout) clearTimeout(hoverTimeout);
    const embedContainer = div.querySelector('.video-embed-container');
    const previewEl = div.querySelector('.video-preview');
    if (embedContainer && previewEl) {
      embedContainer.style.display = 'none';
      previewEl.style.display = 'block';
    }
  });

  return div;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function loadVideoEmbed(cardElement, videoUrl) {
  const embedContainer = cardElement.querySelector('.video-embed-container');
  if (!embedContainer || embedContainer.children.length > 0) return;

  const blockquote = document.createElement('blockquote');
  blockquote.className = 'tiktok-embed';
  blockquote.setAttribute('cite', videoUrl);
  const idMatch = videoUrl.match(/\/video\/([^\/\?]+)/);
  if (idMatch) blockquote.setAttribute('data-video-id', idMatch[1]);
  blockquote.style.maxWidth = '100%';
  const a = document.createElement('a');
  a.href = videoUrl;
  a.textContent = videoUrl;
  blockquote.appendChild(a);
  embedContainer.appendChild(blockquote);

  if (!embedScriptLoaded) {
    const existing = document.querySelector('script[src="https://www.tiktok.com/embed.js"]');
    if (existing) {
      if (!existing._wrapped) {
        const prev = existing.onload;
        existing.onload = function() {
          if (typeof prev === 'function') prev();
          embedScriptLoaded = true;
          setTimeout(() => { if (window.tiktokEmbeds && typeof window.tiktokEmbeds.render === 'function') window.tiktokEmbeds.render(); }, 150);
        };
        existing._wrapped = true;
      }
    } else {
      const s = document.createElement('script');
      s.src = 'https://www.tiktok.com/embed.js';
      s.async = true;
      s.onload = () => {
        embedScriptLoaded = true;
        setTimeout(() => { if (window.tiktokEmbeds && typeof window.tiktokEmbeds.render === 'function') window.tiktokEmbeds.render(); }, 150);
      };
      s.onerror = () => console.warn('[tiktok] embed.js load error');
      document.body.appendChild(s);
    }
  } else {
    setTimeout(() => { if (window.tiktokEmbeds && typeof window.tiktokEmbeds.render === 'function') window.tiktokEmbeds.render(); }, 150);
  }
}

function loadViaJSONP(url) {
  return new Promise((resolve, reject) => {
    // Попытка через XHR
    try {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', url, true);
      xhr.setRequestHeader('Accept', 'application/json, text/plain, */*');
      xhr.onload = function() {
        if (xhr.status >= 200 && xhr.status < 300) {
          try { resolve(JSON.parse(xhr.responseText)); }
          catch (e) {
            const urls = Array.from(new Set((xhr.responseText.match(/https?:\/\/(?:www\.)?tiktok\.com\/[^\s"'><)]+/g) || [])));
            resolve(urls);
          }
        } else reject(new Error('HTTP ' + xhr.status));
      };
      xhr.onerror = function() { reject(new Error('XHR error')); };
      xhr.send();
    } catch (e) {
      reject(e);
    }
  });
}

async function loadTikTokVideos() {
  const container = document.getElementById('video-list');
  if (!container) {
    console.warn('[tiktok] container #video-list not found');
    return;
  }

  const isLocal = ['localhost','127.0.0.1'].includes(window.location.hostname);
  if (DEV_MODE && isLocal && DEV_TEST_VIDEOS.length) {
    container.innerHTML = '';
    const cards = await Promise.all(DEV_TEST_VIDEOS.map(async (l) => createVideoCard(l, await fetchTikTokOEmbed(l))));
    cards.forEach(c => c && container.appendChild(c));
    return;
  }

  const API_URL = (container.dataset.api || window.TIKTOK_API_URL || TIKTOK_API_URL).trim();
  console.log('[tiktok] API URL:', API_URL);

  try {
    let data;
    try {
      const res = await fetch(API_URL, { cache: 'no-store', mode: 'cors', credentials: 'omit' });
      if (!res.ok) throw new Error('API HTTP ' + res.status);
      const ct = (res.headers.get('content-type') || '').toLowerCase();
      if (ct.includes('application/json')) data = await res.json();
      else {
        const txt = await res.text();
        try { data = JSON.parse(txt); } catch (e) {
          data = Array.from(new Set((txt.match(/https?:\/\/(?:www\.)?tiktok\.com\/[^\s"'><)]+/g) || [])));
        }
      }
    } catch (fetchErr) {
      console.warn('[tiktok] fetch error', fetchErr);
      data = await loadViaJSONP(API_URL);
    }

    // Нормализация форматов
    if (!data) data = [];
    // Если массив объектов [{url:...}, ...]
    if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object' && !Array.isArray(data[0])) {
      const mapped = data.map(it => {
        if (!it) return null;
        if (typeof it === 'string') return it;
        return it.url || it.link || it['Ссылка на TikTok'] || it.tiktok || null;
      }).filter(Boolean);
      if (mapped.length) data = mapped;
    }

    // Если таблица (массив массивов)
    if (Array.isArray(data) && Array.isArray(data[0])) {
      data = data.map(row => {
        if (typeof row[0] === 'string') return row[0];
        // ищем строку с tiktok ссылкой
        for (const cell of row) {
          if (typeof cell === 'string' && cell.includes('tiktok.com')) return cell;
        }
        return null;
      }).filter(Boolean);
    }

    // Если ответ — объект gviz (Google Spreadsheets JSON)
    if (data && typeof data === 'object' && data.table && Array.isArray(data.table.rows)) {
      data = data.table.rows.map(r => {
        const cells = r.c || [];
        for (const c of cells) {
          if (c && typeof c.v === 'string' && c.v.includes('tiktok.com')) return c.v;
        }
        return null;
      }).filter(Boolean);
    }

    if (!Array.isArray(data) || data.length === 0) {
      container.innerHTML = `<div style="padding:12px;border:1px solid #f0ad4e;background:#fff3cd;border-radius:4px;color:#8a6d3b">Видео не найдены. Проверьте ответ API и CORS (см. консоль).</div>`;
      console.log('[tiktok] data', data);
      return;
    }

    container.innerHTML = '';
    const cards = await Promise.all(data.map(async (entry, idx) => {
      let link = null;
      if (typeof entry === 'string') link = entry;
      else if (entry && typeof entry === 'object') link = entry.url || entry.link || entry['Ссылка на TikTok'] || entry.tiktok || null;
      if (!link && Array.isArray(entry)) link = entry.find(i => typeof i === 'string' && i.includes('tiktok.com')) || entry[0];
      if (!link || !link.includes('tiktok.com')) {
        console.warn('[tiktok] skip entry', idx, entry);
        return null;
      }
      link = link.trim();
      const oEmbed = await fetchTikTokOEmbed(link);
      return createVideoCard(link, oEmbed);
    }));

    cards.forEach(c => { if (c) container.appendChild(c); });

  } catch (err) {
    console.error('[tiktok] load error', err);
    const isCors = err.message && (err.message.includes('fetch') || err.message.includes('Failed to fetch') || err instanceof TypeError);
    container.innerHTML = isCors
      ? `<div style="color:#8a6d3b;padding:16px;border:1px solid #ffc107;background:#fff3cd;border-radius:6px">
           <strong>Проблема загрузки данных (возможно CORS).</strong><br>
           Проверьте, что Google Apps Script развернут как веб-приложение с доступом «Все, включая анонимных пользователей» и что он возвращает JSON.<br>
           Как временное решение для локальной отладки включите DEV_MODE в tiktok-videos.js.
         </div>`
      : `<div style="color:red">Ошибка: ${escapeHtml(err.message || String(err))}</div>`;
  }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', loadTikTokVideos);
else loadTikTokVideos();
