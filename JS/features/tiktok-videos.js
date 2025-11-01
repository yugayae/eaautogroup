// ==========================================
// НАСТРОЙКА API ДЛЯ ТАБЛИЦЫ С ВИДЕО
// ==========================================
// Здесь укажите URL вашего API для загрузки таблицы с видео
// Можно использовать:
// - Google Apps Script (развернутое веб-приложение) ✓ РЕКОМЕНДУЕТСЯ
// - Google Sheets API (опубликованная таблица в формате CSV/JSON)
// - Собственный API endpoint
// - JSON файл на сервере
//
// Примеры:
// const TIKTOK_API_URL = "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec";
// const TIKTOK_API_URL = "https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/gviz/tq?tqx=out:json";
// const TIKTOK_API_URL = "https://your-api.com/api/videos.json";
// const TIKTOK_API_URL = "data/videos.json";
//
// ВАЖНО для Google Apps Script:
// 1. Ваш скрипт должен возвращать JSON в одном из форматов:
//    - Массив строк: ["https://tiktok.com/video/1", "https://tiktok.com/video/2"]
//    - Массив объектов: [{"url": "https://tiktok.com/video/1"}, {"link": "https://tiktok.com/video/2"}]
//    - Массив массивов (таблица): [["https://tiktok.com/video/1"], ["https://tiktok.com/video/2"]]
//
// 2. Для работы с локального хоста (localhost) добавьте функцию doOptions для CORS:
//    
//    function doOptions() {
//      return ContentService.createTextOutput('')
//        .setMimeType(ContentService.MimeType.JSON);
//    }
//    
//    function doGet() {
//      const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
//      const data = sheet.getDataRange().getValues();
//      
//      // Пропускаем заголовок, берем первый столбец и фильтруем только строки с TikTok ссылками
//      const links = data.slice(1)
//        .map(row => row[0])  // Берем первую ячейку каждой строки
//        .filter(link => {
//          // Проверяем, что это строка и содержит tiktok.com
//          return typeof link === 'string' && link.includes('tiktok.com');
//        })
//        .map(link => link.trim());  // Убираем пробелы
//      
//      return ContentService.createTextOutput(JSON.stringify(links))
//        .setMimeType(ContentService.MimeType.JSON);
//    }
//
// 3. При развертывании веб-приложения выберите:
//    - Выполнять от имени: Меня (ваш email)
//    - У кого есть доступ: Все (включая анонимных пользователей)
//    
//    ВАЖНО: Google Apps Script автоматически устанавливает CORS заголовки для веб-приложений,
//    поэтому обычно достаточно просто вернуть данные через ContentService
//
// Если не указано здесь, можно задать через:
// 1. data-api атрибут в HTML: <div id="video-list" data-api="YOUR_URL"></div>
// 2. Глобальную переменную: window.TIKTOK_API_URL = "YOUR_URL";
// ==========================================
const TIKTOK_API_URL = "https://script.google.com/macros/s/AKfycbwA_d0ahF15w5WarvZYBjT0GfuKU-rbiNoTni4e9az45c5TlbZKWHzecFUqFFOexURX/exec";

// ==========================================
// РЕЖИМ РАЗРАБОТКИ ДЛЯ ЛОКАЛЬНОГО ХОСТА
// ==========================================
// Если видео не загружаются с localhost из-за CORS, включите режим разработки:
// Установите DEV_MODE = true и добавьте тестовые ссылки на TikTok видео ниже
// ==========================================
const DEV_MODE = false; // Установите true для локальной разработки
const DEV_TEST_VIDEOS = [
  // Добавьте сюда тестовые ссылки на TikTok видео для разработки
  // Например:
  // "https://www.tiktok.com/@username/video/1234567890",
  // "https://www.tiktok.com/@username/video/0987654321",
];

// Кэш для oEmbed данных
const oEmbedCache = new Map();
let embedScriptLoaded = false;

// Функция для загрузки oEmbed данных из TikTok
async function fetchTikTokOEmbed(videoUrl) {
  // Проверяем кэш
  if (oEmbedCache.has(videoUrl)) {
    return oEmbedCache.get(videoUrl);
  }

  try {
    // Используем CORS proxy если нужно, но сначала пробуем напрямую
    const oEmbedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(videoUrl)}`;
    const response = await fetch(oEmbedUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    oEmbedCache.set(videoUrl, data);
    return data;
  } catch (error) {
    console.error(`Ошибка загрузки oEmbed для ${videoUrl}:`, error);
    
    // Fallback: возвращаем базовые данные если oEmbed недоступен
    return {
      title: "Видео TikTok",
      author_name: "",
      thumbnail_url: "",
      html: ""
    };
  }
}

// Функция для создания карточки видео с превью
function createVideoCard(videoUrl, oEmbedData) {
  const div = document.createElement("div");
  div.className = "video-card";
  div.dataset.videoUrl = videoUrl;

  // Извлекаем описание и превью из oEmbed
  // title содержит описание видео из TikTok
  const title = oEmbedData?.title || "Видео TikTok";
  const authorName = oEmbedData?.author_name || "";
  
  // Получаем превью изображение (приоритет: thumbnail_url > из HTML)
  let previewImg = oEmbedData?.thumbnail_url || "";
  
  // Если нет thumbnail_url, пытаемся извлечь из HTML
  if (!previewImg && oEmbedData?.html) {
    const imgMatch = oEmbedData.html.match(/<img[^>]+src="([^"]+)"/);
    if (imgMatch && imgMatch[1]) {
      previewImg = imgMatch[1];
    }
  }
  
  // Fallback: используем placeholder если превью не найдено
  if (!previewImg) {
    previewImg = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 400'%3E%3Crect fill='%23e0e0e0' width='400' height='400'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23999' font-family='Arial' font-size='18'%3ETikTok%3C/text%3E%3C/svg%3E";
  }

  div.innerHTML = `
    <div class="video-preview">
      <img src="${previewImg}" alt="${title}" class="preview-image" loading="lazy">
      <div class="play-overlay">
        <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="30" cy="30" r="30" fill="rgba(0,0,0,0.6)"/>
          <path d="M23 18L23 42L42 30L23 18Z" fill="white"/>
        </svg>
      </div>
    </div>
    <div class="video-info">
      <p class="video-title">${title}</p>
      ${authorName ? `<p class="video-author">@${authorName}</p>` : ''}
    </div>
    <div class="video-embed-container" style="display: none;"></div>
  `;

  // Обработчики для загрузки видео при наведении
  let embedLoaded = false;
  let hoverTimeout = null;

  div.addEventListener('mouseenter', function() {
    // Небольшая задержка перед загрузкой для лучшего UX
    hoverTimeout = setTimeout(() => {
      if (!embedLoaded) {
        loadVideoEmbed(div, videoUrl);
        embedLoaded = true;
      }
      // Показываем embed контейнер
      const embedContainer = div.querySelector('.video-embed-container');
      const preview = div.querySelector('.video-preview');
      if (embedContainer && embedContainer.children.length > 0) {
        embedContainer.style.display = 'block';
        preview.style.display = 'none';
      }
    }, 300);
  });

  div.addEventListener('mouseleave', function() {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
    }
    // Скрываем embed и показываем превью
    const embedContainer = div.querySelector('.video-embed-container');
    const preview = div.querySelector('.video-preview');
    if (embedContainer && preview) {
      embedContainer.style.display = 'none';
      preview.style.display = 'block';
    }
  });

  return div;
}

// Функция для загрузки embed блока
function loadVideoEmbed(cardElement, videoUrl) {
  const embedContainer = cardElement.querySelector('.video-embed-container');
  if (!embedContainer || embedContainer.children.length > 0) {
    return; // Уже загружено
  }

  // Создаем blockquote для TikTok embed
  const blockquote = document.createElement('blockquote');
  blockquote.className = 'tiktok-embed';
  blockquote.setAttribute('cite', videoUrl);
  // Надёжное извлечение id видео из URL (например .../video/1234567890123456789)
  const idMatch = videoUrl.match(/\/video\/([^\/\?]+)/);
  blockquote.setAttribute('data-video-id', idMatch ? idMatch[1] : '');
  blockquote.style.maxWidth = '100%';
  
  const link = document.createElement('a');
  link.href = videoUrl;
  link.textContent = videoUrl;
  blockquote.appendChild(link);
  
  embedContainer.appendChild(blockquote);

  // Загружаем embed.js если еще не загружен
  if (!embedScriptLoaded) {
    // Проверяем, не загружается ли уже скрипт
    const existingScript = document.querySelector('script[src="https://www.tiktok.com/embed.js"]');
    if (existingScript) {
      // Оборачиваем существующий onload, помечаем как загруженный только при срабатывании onload
      if (!existingScript._tiktokOnloadWrapped) {
        const prevOnload = existingScript.onload;
        existingScript.onload = function () {
          if (typeof prevOnload === 'function') prevOnload();
          embedScriptLoaded = true;
          setTimeout(() => {
            if (window.tiktokEmbeds && typeof window.tiktokEmbeds.render === 'function') {
              window.tiktokEmbeds.render();
            }
          }, 100);
        };
        existingScript._tiktokOnloadWrapped = true;
      }
    } else {
      const script = document.createElement('script');
      script.src = 'https://www.tiktok.com/embed.js';
      script.async = true;
      script.onload = () => {
        embedScriptLoaded = true;
        setTimeout(() => {
          if (window.tiktokEmbeds && typeof window.tiktokEmbeds.render === 'function') {
            window.tiktokEmbeds.render();
          }
        }, 100);
      };
      document.body.appendChild(script);
    }
  } else {
    // Если скрипт уже загружен, вызываем обработку с небольшой задержкой
    setTimeout(() => {
      if (window.tiktokEmbeds && typeof window.tiktokEmbeds.render === 'function') {
        window.tiktokEmbeds.render();
      }
    }, 100);
  }
}

// Функция для загрузки данных через JSONP (fallback при CORS ошибках)
function loadViaJSONP(url) {
  return new Promise((resolve, reject) => {
    // Пробуем загрузить через XMLHttpRequest как текст (работает лучше с CORS)
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.setRequestHeader('Accept', 'application/json, text/plain, */*');
    
    xhr.onload = function() {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          resolve(data);
        } catch (e) {
          // Если не JSON, пытаемся извлечь ссылки
          const urls = Array.from(new Set((xhr.responseText.match(/https?:\/\/(?:www\.)?tiktok\.com\/[^\s"'><)]+/g) || [])));
          resolve(urls.length > 0 ? urls : []);
        }
      } else {
        reject(new Error(`HTTP ${xhr.status}`));
      }
    };
    
    xhr.onerror = function() {
      // Если XMLHttpRequest тоже не работает, пробуем через динамический скрипт
      const callbackName = 'tiktokApiCallback_' + Date.now();
      window[callbackName] = function(data) {
        delete window[callbackName];
        document.body.removeChild(script);
        resolve(data);
      };
      
      const script = document.createElement('script');
      const separator = url.includes('?') ? '&' : '?';
      script.src = url + separator + 'callback=' + callbackName;
      script.onerror = function() {
        delete window[callbackName];
        document.body.removeChild(script);
        reject(new Error('Не удалось загрузить данные'));
      };
      document.body.appendChild(script);
    };
    
    try {
      xhr.send();
    } catch (e) {
      xhr.onerror();
    }
  });
}

// Основная функция загрузки видео
async function loadTikTokVideos() {
  const container = document.getElementById("video-list");
  
  if (!container) {
    console.warn("Не найден контейнер #video-list");
    return;
  }

  // Проверка режима разработки для локального хоста
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  
  if (DEV_MODE && isLocalhost && DEV_TEST_VIDEOS.length > 0) {
    console.log("🔧 Режим разработки: используем тестовые данные");
    container.innerHTML = "";
    
    // Используем тестовые данные для разработки
    const videoPromises = DEV_TEST_VIDEOS.map(async (link) => {
      const oEmbedData = await fetchTikTokOEmbed(link);
      const card = createVideoCard(link, oEmbedData);
      return card;
    });
    
    const cards = await Promise.all(videoPromises);
    cards.forEach(card => {
      if (card) {
        container.appendChild(card);
      }
    });
    return;
  }

  // Определяем URL API (приоритет: data-api > window.TIKTOK_API_URL > TIKTOK_API_URL из файла > fallback)
  const API_URL = container.dataset.api || window.TIKTOK_API_URL || TIKTOK_API_URL || "https://example.com/api/tiktok-videos.json";

  if (API_URL === "https://example.com/api/tiktok-videos.json") {
    console.warn("⚠️ ВНИМАНИЕ: Используется URL по умолчанию. Укажите свой API URL в начале файла tiktok-videos.js или через data-api атрибут.");
  }

  // Если localhost и CORS не работает, показываем подсказку
  if (isLocalhost && !DEV_MODE) {
    console.warn("💡 Подсказка: Если видео не загружаются из-за CORS, включите DEV_MODE = true в файле tiktok-videos.js");
  }

  try {
    let data;
    
    // Пытаемся загрузить через fetch
    try {
      const res = await fetch(API_URL, { 
        cache: "no-store",
        mode: 'cors',
        credentials: 'omit'
      });
      
      if (!res.ok) throw new Error(`Ошибка загрузки API: ${res.status}`);

      const contentType = (res.headers.get('content-type') || '').toLowerCase();

      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        // Попытка распарсить текст как JSON, иначе попытка извлечь ссылки из текста
        const text = await res.text();
        try {
          data = JSON.parse(text);
        } catch (err) {
          // Простой парсинг: ищем все URL вида https://www.tiktok.com/...
          const urls = Array.from(new Set((text.match(/https?:\/\/(?:www\.)?tiktok\.com\/[^\s"'><)]+/g) || [])));
          data = urls;
        }
      }
    } catch (fetchError) {
      // Если CORS ошибка, пробуем через JSONP для Google Apps Script
      if (fetchError.name === 'TypeError' || fetchError.message.includes('fetch') || fetchError.message.includes('CORS')) {
        console.warn("CORS ошибка, пробуем JSONP подход...");
        data = await loadViaJSONP(API_URL);
      } else {
        throw fetchError;
      }
    }

    // Обработка Google Sheets ответа
    if (data && typeof data === 'object' && data.table) {
      // Если это ответ от Google Sheets API (gviz format)
      const rows = data.table.rows || [];
      data = rows.map(row => {
        const cells = row.c || [];
        // Ищем ссылку TikTok в любой ячейке
        for (let cell of cells) {
          if (cell && cell.v && typeof cell.v === 'string' && cell.v.includes('tiktok.com')) {
            return cell.v;
          }
        }
        return null;
      }).filter(Boolean);
    }

    console.log("Данные из API:", data);

    if (!Array.isArray(data) || data.length === 0) {
      container.innerHTML = "<p>Видео не найдены</p>";
      return;
    }

    // Обработка формата таблицы (массив массивов)
    // Если первый элемент - это массив, преобразуем в плоский формат
    if (Array.isArray(data[0]) && !Array.isArray(data[0][0])) {
      // Это таблица: преобразуем каждый массив в объект или строку
      data = data.map(row => {
        // Если строка - вернем её, иначе вернем первый элемент массива со ссылкой
        if (typeof row[0] === 'string' && row[0].includes('tiktok.com')) {
          return row[0];
        }
        // Или возвращаем весь массив как объект
        return row;
      });
    }

    container.innerHTML = "";

    // Обрабатываем все ссылки параллельно
    const videoPromises = data.map(async (entry, index) => {
      // Допустимые форматы: строка (url) или объект с полем link/url/Ссылка на TikTok
      let link = null;
      if (typeof entry === 'string') {
        link = entry;
      } else if (Array.isArray(entry)) {
        // Обработка массива: ищем первую ссылку TikTok
        link = entry.find(item => typeof item === 'string' && item.includes('tiktok.com')) || entry[0];
      } else if (entry && typeof entry === 'object') {
        link = entry.link || entry.url || entry["Ссылка на TikTok"] || entry.tiktok || entry[0];
      }

      if (!link || !link.includes("tiktok.com")) {
        console.warn(`Пропущена запись [${index}]: некорректная ссылка`, entry);
        return null;
      }

      // Нормализуем ссылку (убираем пробелы)
      link = link.trim();

      // Загружаем oEmbed данные (падает при CORS — в этом случае будет использован fallback)
      const oEmbedData = await fetchTikTokOEmbed(link);
      
      // Создаем карточку видео
      const card = createVideoCard(link, oEmbedData);
      return card;
    });

    // Ждем загрузки всех карточек
    const cards = await Promise.all(videoPromises);
    
    // Добавляем карточки в контейнер (фильтруем null значения)
    cards.forEach(card => {
      if (card) {
        container.appendChild(card);
      }
    });

  } catch (error) {
    console.error("Ошибка загрузки видео:", error);
    
    let errorMessage = `Ошибка загрузки видео: ${error.message}`;
    
    // Специальное сообщение для CORS ошибок
    if (error.message.includes('fetch') || error.message.includes('Failed to fetch') || error.name === 'TypeError') {
      errorMessage = `
        <div style="color: red; padding: 20px; background: #fff3cd; border: 2px solid #ffc107; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0;">⚠️ Проблема с CORS (загрузкой данных)</h3>
          <p><strong>Причина:</strong> Google Apps Script блокирует запросы с локального хоста (localhost).</p>
          <p><strong>Решение:</strong></p>
          <ol>
            <li>Убедитесь, что ваш Google Apps Script правильно настроен (БЕЗ .setHeaders() - этот метод не существует):</li>
            <pre style="background: #f5f5f5; padding: 10px; border-radius: 3px; overflow-x: auto;">
function doOptions() {
  return ContentService.createTextOutput('')
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = sheet.getDataRange().getValues();
  
  // Фильтруем только строки с TikTok ссылками (проверяем тип!)
  const links = data.slice(1)
    .map(row => row[0])
    .filter(link => typeof link === 'string' && link.includes('tiktok.com'))
    .map(link => link.trim());
  
  return ContentService.createTextOutput(JSON.stringify(links))
    .setMimeType(ContentService.MimeType.JSON);
}</pre>
            <p><small>Google Apps Script автоматически устанавливает CORS заголовки для веб-приложений.</small></p>
            <li><strong>Быстрое решение для локальной разработки:</strong> Включите режим разработки в файле <code>tiktok-videos.js</code>:
              <ul style="margin-top: 10px;">
                <li>Найдите строку: <code>const DEV_MODE = false;</code></li>
                <li>Измените на: <code>const DEV_MODE = true;</code></li>
                <li>Добавьте тестовые ссылки TikTok в массив <code>DEV_TEST_VIDEOS</code></li>
              </ul>
            </li>
            <li>Или используйте хостинг для тестирования (GitHub Pages, Netlify и т.д.)</li>
            <li>Или разверните сайт на реальном домене</li>
          </ol>
          <p style="margin-bottom: 0;"><small>Режим разработки автоматически включается только на localhost и позволяет использовать тестовые данные без CORS проблем.</small></p>
        </div>
      `;
    }
    
    container.innerHTML = errorMessage;
  }
}

// Автоматическая загрузка при готовности DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadTikTokVideos);
} else {
  loadTikTokVideos();
}
