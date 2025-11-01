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

function loadViaJSONP(url, timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    const cbName = '__tiktok_cb_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
    const script = document.createElement('script');
    const sep = url.includes('?') ? '&' : '?';
    script.src = `${url}${sep}callback=${cbName}`;
    let timedOut = false;
    const cleanup = () => {
      if (script.parentNode) script.parentNode.removeChild(script);
      try { delete window[cbName]; } catch (e) { window[cbName] = undefined; }
      clearTimeout(timer);
    };
    window[cbName] = function(data) {
      if (timedOut) return;
      cleanup();
      resolve(data);
    };
    script.onerror = function(e) {
      cleanup();
      reject(new Error('JSONP script error'));
    };
    const timer = setTimeout(() => {
      timedOut = true;
      cleanup();
      reject(new Error('JSONP timeout'));
    }, timeoutMs);
    document.head.appendChild(script);
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
        if
