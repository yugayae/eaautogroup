// site-functions.js

// === ИНИЦИАЛИЗАЦИЯ ===
document.addEventListener('DOMContentLoaded', () => {
  console.log('Сайт загружен!');
  initYearSelect();
  initSliders();
  initCarSearchForm();
  initCalculatorForm();
  loadTikTokVideos();
});

// === ПОДБОР АВТО ===
function initYearSelect() {
  const yearSelect = document.getElementById('year');
  if (!yearSelect) return;
  const currentYear = new Date().getFullYear();
  for (let year = currentYear; year >= 2000; year--) {
    const option = document.createElement('option');
    option.value = year;
    option.textContent = year;
    yearSelect.appendChild(option);
  }
}

function initCarSearchForm() {
  const form = document.getElementById('carSearchForm');
  if (!form) return;
  form.addEventListener('submit', e => {
    e.preventDefault();
    const requestData = {
      brand: document.getElementById('brand').value,
      model: document.getElementById('model').value,
      year: document.getElementById('year').value || 'не указан',
      mileage: document.getElementById('mileage').value || 'не важен',
      priceMin: document.getElementById('price-min').value || 'не указана',
      priceMax: document.getElementById('price-max').value || 'не указана',
      phone: document.getElementById('client-phone').value
    };

    const message = `🚗 *Новый запрос на подбор авто*:\n\nМарка: *${requestData.brand}*\nМодель: ${requestData.model || 'не указана'}\nГод: ${requestData.year}\nПробег: ${requestData.mileage}\nЦена: $${requestData.priceMin} — $${requestData.priceMax}\n\n📞 Контакты: ${requestData.phone}\n\n_Запрос отправлен с сайта_`;

    sendToTelegram(message); // 🔴 Запрос отправки в Telegram (форма подбора)
  });
}

// === ТЕЛЕГРАМ ===
function sendToTelegram(message) {
  const botToken = 'ВАШ_ТОКЕН_БОТА'; // 🔴 Укажите здесь токен вашего Telegram-бота
  const chatId = 'ID_ЧАТА_МЕНЕДЖЕРОВ'; // 🔴 Укажите здесь chat_id менеджера или группы

  fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
      parse_mode: 'Markdown'
    })
  })
    .then(response => response.json())
    .then(data => {
      if (data.ok) {
        alert('✅ Ваш запрос отправлен!');
        const form = document.getElementById('carSearchForm');
        if (form) form.reset();
      } else {
        alert('⚠️ Ошибка отправки. Попробуйте позже.');
      }
    })
    .catch(error => {
      console.error('Telegram Error:', error);
      alert('⚠️ Ошибка соединения с Telegram.');
    });
}

// === ПОЛЗУНКИ ===
function initSliders() {
  const sliders = [
    { id: 'car-year', display: 'year-display', suffix: '' },
    { id: 'engine-volume', display: 'volume-display', suffix: ' см³' },
    { id: 'car-price', display: 'price-display', suffix: ' $' }
  ];

  sliders.forEach(({ id, display, suffix }) => {
    const slider = document.getElementById(id);
    const output = document.getElementById(display);
    if (slider && output) {
      output.textContent = slider.value + suffix;
      slider.addEventListener('input', () => {
        output.textContent = slider.value + suffix;
      });
    }
  });
}

// === КАЛЬКУЛЯТОР ===
function initCalculatorForm() {
  const form = document.getElementById('calculator-form');
  const btn = document.getElementById('contact-manager');
  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      calculateCost();
    });
  }
  if (btn) {
    btn.addEventListener('click', () => {
      // 🔴 Здесь можно вызвать sendToTelegram с другим сообщением (расчет)
      alert('Функция отправки заявки на расчет будет реализована позже.');
    });
  }
}

function calculateCost() {
  const country = document.getElementById('country').value;
  const carYear = parseInt(document.getElementById('car-year').value);
  const engineType = document.getElementById('engine-type').value;
  const engineVolume = parseInt(document.getElementById('engine-volume').value);
  const carPrice = parseInt(document.getElementById('car-price').value);
  const deliveryMethod = document.getElementById('delivery-method').value;

  if (!country || !engineType || !deliveryMethod) {
    alert('Пожалуйста, заполните все поля!');
    return;
  }

  let deliveryCost = deliveryMethod === 'container'
    ? (engineVolume > 2000 ? 2500 : 2000)
    : (engineVolume > 2000 ? 3000 : 2500);

  const carAge = 2025 - carYear;
  let ageFactor = 1;
  if (carAge > 15) ageFactor = 2;
  else if (carAge > 10) ageFactor = 1.5;
  else if (carAge > 5) ageFactor = 1.2;

  let customsDuty = 0, vat = 0, additionalFees = 0;

  switch (country) {
    case 'russia':
      customsDuty = carPrice * (engineType === 'electric' ? 0.1 : 0.15) * ageFactor;
      vat = carPrice * 0.2;
      additionalFees = engineVolume > 2000 ? 1500 : 1000;
      break;
    case 'ukraine':
      customsDuty = carPrice * 0.1 * ageFactor;
      vat = carPrice * 0.2;
      additionalFees = 500;
      break;
    case 'belarus':
      customsDuty = carPrice * 0.15 * ageFactor;
      vat = carPrice * 0.2;
      additionalFees = 700;
      break;
    case 'kazakhstan':
      customsDuty = carPrice * 0.1 * ageFactor;
      vat = carPrice * 0.12;
      additionalFees = 600;
      break;
    case 'kyrgyzstan':
      customsDuty = carPrice * 0.1 * ageFactor;
      vat = carPrice * 0.12;
      additionalFees = 500;
      break;
  }

  const totalCost = carPrice + deliveryCost + customsDuty + vat + additionalFees;

  document.getElementById('car-price-result').textContent = carPrice.toLocaleString() + ' USD';
  document.getElementById('delivery-cost').textContent = deliveryCost.toLocaleString() + ' USD';
  document.getElementById('customs-duty').textContent = customsDuty.toLocaleString() + ' USD';
  document.getElementById('vat').textContent = vat.toLocaleString() + ' USD';
  document.getElementById('additional-fees').textContent = additionalFees.toLocaleString() + ' USD';
  document.getElementById('total-cost').textContent = totalCost.toLocaleString() + ' USD';

  document.getElementById('result').style.display = 'block';
}

// === TIKTOK ОБЗОРЫ ===
function loadTikTokVideos() {
  const API_URL = "https://api.sheetbest.com/sheets/c17a7d59-ab57-414a-af89-f55acde8154e"; // 🔴 Замени на свой API
  const container = document.getElementById("video-list");
  if (!container) return;

  fetch(API_URL)
    .then(res => res.json())
    .then(data => {
      data.forEach(entry => {
        const link = entry["Ссылка на TikTok"];
        if (link && link.includes("tiktok.com")) {
          const div = document.createElement("div");
          div.className = "video";
          div.innerHTML = `
            <blockquote class="tiktok-embed" cite="${link}" data-video-id="" style="max-width: 100%;">
              <a href="${link}">${link}</a>
            </blockquote>
          `;
          container.appendChild(div);
        }
      });

      const script = document.createElement("script");
      script.src = "https://www.tiktok.com/embed.js";
      document.body.appendChild(script);
    });
}

function loadTikTokVideos() {
  const API_URL = "https://api.sheetbest.com/sheets/c17a7d59-ab57-414a-af89-f55acde8154e"; // Замени на свою ссылку
  const container = document.getElementById("video-list");
  if (!container) {
    console.warn("Не найден контейнер #video-list");
    return;
  }

  fetch(API_URL)
    .then(res => {
      if (!res.ok) throw new Error("Ошибка загрузки API");
      return res.json();
    })
    .then(data => {
      console.log("Данные из API:", data);

      if (!Array.isArray(data) || data.length === 0) {
        console.warn("Пустой массив данных");
        return;
      }

      let count = 0;

      data.forEach((entry, index) => {
        const link = entry["Ссылка на TikTok"];
        if (!link || !link.includes("tiktok.com")) {
          console.warn(`Пропущена запись [${index}]: некорректная ссылка`, link);
          return;
        }

        const div = document.createElement("div");
        div.className = "video";
        div.innerHTML = `
          <blockquote class="tiktok-embed" cite="${link}" style="max-width: 100%;">
            <a href="${link}">${link}</a>
          </blockquote>
        `;
        container.appendChild(div);
        count++;
      });

      console.log(`Добавлено видео: ${count}`);

      // Подключаем TikTok embed.js
      const script = document.createElement("script");
      script.src = "https://www.tiktok.com/embed.js";
      document.body.appendChild(script);
    })
    .catch(error => {
      console.error("Ошибка загрузки TikTok видео:", error);
    });
}


src="https://www.tiktok.com/embed.js"

async function loadTikTokVideos() {
  const container = document.getElementById("video-list");
  container.innerHTML = "Загрузка видео...";

  try {
    const response = await fetch("https://api.sheetbest.com/sheets/c17a7d59-ab57-414a-af89-f55acde8154e");
    const data = await response.json();

    console.log("Данные из API:", data);
    let count = 0;

    container.innerHTML = "";

    data.forEach((entry, index) => {
      // автоопределение поля со ссылкой
      const rawUrl = Object.values(entry).find(v => typeof v === "string" && v.includes("tiktok.com"));
      if (!rawUrl) {
        console.warn(`Пропущена запись [${index}]: некорректная ссылка`, rawUrl);
        return;
      }

      const videoId = extractVideoId(rawUrl);
      if (!videoId) {
        console.warn(`Пропущена запись [${index}]: не удалось извлечь ID`, rawUrl);
        return;
      }

      const embedUrl = `https://www.tiktok.com/embed/${videoId}`;

      const iframe = document.createElement("iframe");
      iframe.src = embedUrl;
      iframe.width = "325";
      iframe.height = "600";
      iframe.style = "border:none; margin: 10px;";
      iframe.allow = "autoplay; encrypted-media";
      iframe.loading = "lazy";

      container.appendChild(iframe);
      count++;
    });

    console.log("Добавлено видео:", count);
    if (window.tiktokEmbedLoad) {
      window.tiktokEmbedLoad();
    }

    if (count === 0) {
      container.innerHTML = "Нет доступных видео.";
    }
  } catch (error) {
    console.error("Ошибка загрузки TikTok-видео:", error);
    container.innerHTML = "Ошибка загрузки видео.";
  }
}

function extractVideoId(url) {
  const match = url.match(/video\/(\d+)/);
  return match ? match[1] : null;
}

document.addEventListener("DOMContentLoaded", loadTikTokVideos);
