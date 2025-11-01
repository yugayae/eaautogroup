// === ПОДБОР АВТО ===
// Марка → Модели
const modelOptions = {
  "Hyundai": ["Accent", "Avante", "Casper", "Equus", "Genesis", "Grandeur", "i30", "i40", "IONIQ5", "IONIQ6", "KONA", "MaxCruz", "Nexo", "Palisade", "Santa Fe", "Sonata", "Starex", "Staria", "Tucson", "Veloster", "Venue", "Other"],
  "Kia": ["Carens", "Carnival", "EV3", "EV6", "EV9", "Forte", "K3", "K5", "K7", "K8", "K9", "Mohave", "Morning", "Niro", "Pride", "Ray", "Seltos", "Sportage", "Sorento", "Stinger", "Stonic", "Other"],
  "Genesis": ["EQ900", "G70", "G80", "G90", "GV60", "GV70", "GV80", "Other"],
  "SsangYong": ["Actyon", "Korando", "Musso Khan", "Rexton", "Tivoli", "Torres", "Other"],
  "Chevrolet": ["Bolt", "Comaro", "Captiva", "Colorado", "Corvette", "Cruze", "Damas", "Equinox", "G2X", "Impala", "Malibu", "Matiz", "Orlando", "Spark", "Silverado", "Suburban", "Tahoe", "Traiblazer", "Traverse", "Trax", "Other" ],
  "Renault": ["Clio", "Grand Koleos", "QM3", "QM6", "SM6", "SM7", "XM3", "Other"],
  "BMW": ["1 Series", "2 Series", "3 Series", "4 Series", "5 Series", "6 Series", "7 Series", "8 Series", "Grand Turismo (GT)", "i Series", "M Series", "X Series", "Z Series", "Other"],
  "Audi": ["A3", "A4", "A5", "A6", "A7", "A8", "e-Tron", "e-Tron GT", "Q2", "Q3", "Q4 e-Tron", "Q5", "Q7", "Q8", "R8", "RS e-Tron GT", "RS Q8", "RS5", "RS7", "S4", "S6", "S7", "S8", "SQ5", "SQ8", "TT", "Other"],
  "Lexus": ["RX", "NX", "ES", "LS", "CT", "GS", "IS", "LC", "RC", "UX", "Other"],
  "LandRover": ["Defender", "Discavery", "Discavery Sport", "Freelander", "Range Rover", "Range Rover Evoque", "Range Rover Sport", "Range Rover Velar", "Other"],
  "Lincoln": ["Aviator", "Continental", "Corsair", "MKC", "MKS", "MKX", "MKZ", "Nautilus", "Navigator", "Other"],
  "Ford": ["Bronco", "Expedition", "Explorer", "Focus", "Fusion", "Mustang", "Ranger", "Taurus", "Other"],
  "Jeep": ["Avenger", "Cherokee", "Compass", "Gladiator", "Renegade", "Wrangler", "Other"],
  "Mini": ["Clubman", "Cooper", "Cooper Convertible", "Cooper SE", "Countryman", "Coupe", "Paceman", "Roadster", "Other"],
  "Jaguar": ["E-PACE", "F-PACE", "F-TYPE", "I-PACE", "XE", "XF", "XJ", "XK", "Other"],
  "Cadillac": ["ATS", "BLS", "CT4", "CT5", "CT6", "CT9", "Escalade", "Lyric", "SRX", "XT5", "XT6", "Other"],
  "Volvo": ["C30", "S60", "S80", "S90", "V40", "V60", "V90", "XC40", "XC60", "XC70", "XC90", "Other"],
  "Toyota": ["86", "Alphard", "Avalon", "Crown", "Camry", "FJ Cruiser", "GR86", "Highlander", "Prius", "RAV4", "Land Cruiser", "Corolla", "Sienna", "Supra", "Wish", "Other"],
  "Nissan": ["370Z", "Altima", "Cube", "Juke", "Leaf", "Maxima", "Morano", "Pathfinder", "Qashqai", "Quest", "Rogue", "X-Trail", "Other"],
  "Honda": ["Civic", "Accord", "CR-V", "Fit", "Crosstour", "HR-V", "Odyssey", "Pilot", "Other"],
  "Peugeot": ["208", "2008", "308", "3008", "408", "508", "5008", "e-208", "Expert", "Other"],
  "AstonMartin": ["DB11", "DBS", "DBX", "Rapide", "Vanquish", "Vantage", "Other"],
  "Bentley": ["Bentayga", "Continental", "Mulsanne", "Other"],
  "Chrysler": ["200", "300C", "Grand Voyager", "Other"],
  "Dodge": ["Challenger", "Changer", "Other"],
  "Ferrari": ["296", "458", "488", "California", "FR Berlinetta", "F430", "F8 Tributo", "FF", "Portofino", "Roma", "Other"],
  "GMC": ["Canyon", "Sierra", "Savana", "Other"],
  "Hummer": ["H1", "H2", "H3"],
  "Infiniti": ["FX", "G", "JX", "M", "Q30", "Q50", "Q60", "Q70", "QX", "QX30", "QX50", "QX60", "QX70", "Other"],
  "Lamborghini": ["Aventador", "Huracan", "Urus", "Other"],
  "Maserati": ["Ghibli", "Grand Cabrio", "Grand Turismo", "Grecale", "Levante", "Quattroporte", "Other"],
  "McLaren": ["650S", "720S", "750S", "600LT", "570S", "GT", "Other"],
  "Mercedes-Benz": ["A-Class", "AMG GT", "B-Class", "C-Class", "CL-Class", "CLA-Class", "CLE", "CLK-Class", "CLS-Class", "E-Class", "EQA", "EQB", "EQC", "EQE", "EQS", "G-Class", "GLA-Class", "GLB-Class", "GLC-Class", "GLE-Class", "GLK-Class", "GLS-Class", "M-Class", "Mattress", "S-Class", "SL-Class", "SLC-Class", "SLK-Class", "SLS-Class", "SL-Class", "Sprinter", "V-Class", "Other"],
  "Porsche": ["911", "Boxter", "Cayenne", "Macan", "Panamera", "Taycan", "Other"],
  "Rolls-Royce": ["Cullinan", "Ghost", "Race", "Other"],
  "Tesla": ["Model 3", "Model S", "Model X", "Model Y", "Other"],
  "Volkswagen": ["Arteon", "Beetle", "CC", "Golf", "ID4", "Jetta", "Passat", "Phaeton", "Polo", "Scirocco", "T-Roc", "Tiguan", "Tauareq", "Other"]    
};

function initCarForm() {
  const brandSelect = document.getElementById("brand");
  const modelSelect = document.getElementById("model");

  if (!brandSelect || !modelSelect) {
    console.warn('initCarForm: элементы brand или model не найдены');
    return;
  }

  brandSelect.addEventListener("change", () => {
    const selectedBrand = brandSelect.value;
    modelSelect.innerHTML = "<option value=''>Выберите модель</option>";

    if (modelOptions[selectedBrand]) {
      modelOptions[selectedBrand].forEach(model => {
        const opt = document.createElement("option");
        opt.value = model;
        opt.textContent = model;
        modelSelect.appendChild(opt);
      });
    }
  });
}

function initYearSelect() {
  const yearSelect = document.getElementById('year');
  if (!yearSelect) return;
  
  const currentYear = new Date().getFullYear();
  yearSelect.innerHTML = '<option value="">Любой</option>';
  
  // Сокращаем выбор до 2015 года и выше
  for (let y = currentYear; y >= 2015; y--) {
    const opt = document.createElement('option');
    opt.value = y;
    opt.textContent = y;
    yearSelect.appendChild(opt);
  }
}

function initMileageSelect() {
  const mileageSelect = document.getElementById("mileage");
  if (!mileageSelect) return;
  
  for (let km = 10000; km <= 200000; km += 10000) {
    const opt = document.createElement("option");
    opt.value = km;
    opt.textContent = `До ${km.toLocaleString()} км`;
    mileageSelect.appendChild(opt);
  }
}

function initCarSearchForm() {
  const form = document.getElementById("carSearchForm");
  if (!form) {
    console.warn('initCarSearchForm: форма carSearchForm не найдена');
    return;
  }

  // Telegram отправка
  const TELEGRAM_TOKEN = "7665563305:AAEcVRNb5PABMpSygrU7Hwa8h33M6EGlWIo"; // ← ВСТАВЬ СВОЙ ТОКЕН
  const TELEGRAM_CHAT_ID = "152136216"; // ← ВСТАВЬ СВОЙ CHAT ID

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const brand = document.getElementById("brand")?.value || "";
    const model = document.getElementById("model")?.value || "";
    const year = document.getElementById("year")?.value || "Любой";
    const mileage = document.getElementById("mileage")?.value || "Не важно";
    const priceMin = document.getElementById("price-min")?.value || "Не указано";
    const priceMax = document.getElementById("price-max")?.value || "Не указано";
    const phone = document.getElementById("client-phone")?.value || "";
    const trim = document.getElementById("trim")?.value || "Не указано";
    const allowPaint = document.getElementById("allow-paint")?.checked ? "Да" : "Нет";
    const allowReplacement = document.getElementById("allow-replacement")?.checked ? "Да" : "Нет";

    if (!phone) {
      alert("Пожалуйста, укажите ваш контактный номер");
      return;
    }

    const message = `
🚗 <b>Запрос на подбор авто</b>
<b>Марка:</b> ${brand}
<b>Модель:</b> ${model}
<b>Комплектация:</b> ${trim}
<b>Год выпуска:</b> ${year}
<b>Пробег:</b> До ${mileage.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} км
<b>Цена от:</b> $${priceMin}
<b>Цена до:</b> $${priceMax}
<b>Допустим окрас:</b> ${allowPaint}
<b>Допустима замена:</b> ${allowReplacement}
<b>Контакт:</b> ${phone}
`;

    fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: "HTML"
      })
    })
    .then(res => {
      if (res.ok) {
        alert("Заявка успешно отправлена менеджеру!");
        form.reset();
        const modelSelect = document.getElementById("model");
        if (modelSelect) {
          modelSelect.innerHTML = "<option value=''>Сначала выберите марку</option>";
        }
      } else {
        alert("Ошибка при отправке.");
      }
    })
    .catch(err => {
      alert("Ошибка подключения к Telegram.");
      console.error(err);
    });
  });
}

// Инициализация всех функций
function initCarSelection() {
  initCarForm();
  initYearSelect();
  initMileageSelect();
  initCarSearchForm();
}

// Автоматическая инициализация при загрузке DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCarSelection);
} else {
  initCarSelection();
}

// Экспорт функций для использования в других скриптах
window.CarSelection = {
  initCarForm,
  initYearSelect,
  initMileageSelect,
  initCarSearchForm,
  initCarSelection
};
