// currency-api.js          - 21.10.2025  
// Общие функции для получения курсов валют.

const CURRENCY_API_CONFIG = {
  ukraine: 'https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?json',
  belarus: 'https://api.nbrb.by/exrates/rates?periodicity=0',
  kazakhstan: 'https://api.nationalbank.kz/rss/get_rates.cfm?fdate=' + new Date().toISOString().split('T')[0],
  kyrgyzstan: 'https://www.nbkr.kg/XML/daily.xml',
  russia: 'https://www.cbr-xml-daily.ru/daily_json.js'
};

const BACKUP_RATES = {
  usd: 1,
  eur: 0.91,
  rub: 90,
  uah: 36.5,
  byn: 3.2,
  kzt: 470,
  kgs: 89
};

/**
 * fetchExchangeRates()
 * Возвращает объект курсов в формате:
 * { usd:1, eur: <EUR per USD>, rub: <RUB per USD>, uah, byn, kzt, kgs }
 *
 * Если API упали — возвращает BACKUP_RATES.
 */
async function fetchExchangeRates() {
  const rates = { ...BACKUP_RATES };

  try {
    // 1) Получаем данные ЦБ РФ (RUB и EUR через отношение EUR/USD)
    const russiaResp = await fetch(CURRENCY_API_CONFIG.russia);
    if (russiaResp.ok) {
      const russiaData = await russiaResp.json();
      if (russiaData.Valute && russiaData.Valute.USD) {
        rates.rub = russiaData.Valute.USD.Value; // RUB per USD
      }
      if (russiaData.Valute && russiaData.Valute.EUR) {
        // Valute.EUR.Value — цена 1 EUR в RUB.
        // Чтобы иметь eur per USD, можно compute: (EUR_in_RUB / USD_in_RUB) = EUR per USD
        const eurRub = russiaData.Valute.EUR.Value;
        const usdRub = russiaData.Valute.USD.Value;
        if (usdRub && eurRub) rates.eur = eurRub / usdRub;
      }
    }

    // 2) Параллельные запросы к остальным API — если один упадёт, используем backup для него
    const tasks = await Promise.allSettled([
      fetchUkraineRate(),
      fetchBelarusRate(),
      fetchKazakhstanRate(),
      fetchKyrgyzstanRate()
    ]);

    if (tasks[0].status === 'fulfilled' && tasks[0].value) rates.uah = tasks[0].value;
    if (tasks[1].status === 'fulfilled' && tasks[1].value) rates.byn = tasks[1].value;
    if (tasks[2].status === 'fulfilled' && tasks[2].value) rates.kzt = tasks[2].value;
    if (tasks[3].status === 'fulfilled' && tasks[3].value) rates.kgs = tasks[3].value;

    return rates;
  } catch (err) {
    console.warn('fetchExchangeRates: fallback to BACKUP_RATES', err);
    return rates;
  }
}

/* вспомогательные функции для каждого API */
/* Возвращают курс USD в локальной валюте (т.е. сколько локальной валюты за 1 USD) */

async function fetchUkraineRate() {
  try {
    const res = await fetch(CURRENCY_API_CONFIG.ukraine);
    if (!res.ok) throw new Error('UA fetch failed');
    const data = await res.json();
    const usd = data.find(x => x.cc === 'USD');
    return usd ? usd.rate : BACKUP_RATES.uah;
  } catch {
    return BACKUP_RATES.uah;
  }
}

async function fetchBelarusRate() {
  try {
    const res = await fetch(CURRENCY_API_CONFIG.belarus);
    if (!res.ok) throw new Error('BY fetch failed');
    const data = await res.json();
    const usd = data.find(x => x.Cur_Abbreviation === 'USD');
    return usd ? usd.Cur_OfficialRate : BACKUP_RATES.byn;
  } catch {
    return BACKUP_RATES.byn;
  }
}

async function fetchKazakhstanRate() {
  try {
    const res = await fetch(CURRENCY_API_CONFIG.kazakhstan);
    if (!res.ok) throw new Error('KZ fetch failed');
    const text = await res.text();
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, "text/xml");
    // В RSS ищем item с title USD, в description чаще всего курс на 1 USD в KZT
    const items = Array.from(xml.querySelectorAll('item'));
    const usdItem = items.find(i => (i.querySelector('title')?.textContent || '').trim() === 'USD');
    if (usdItem) {
      const desc = usdItem.querySelector('description')?.textContent;
      const value = parseFloat(desc);
      if (!isNaN(value)) return value;
    }
    return BACKUP_RATES.kzt;
  } catch {
    return BACKUP_RATES.kzt;
  }
}

async function fetchKyrgyzstanRate() {
  try {
    const res = await fetch(CURRENCY_API_CONFIG.kyrgyzstan);
    if (!res.ok) throw new Error('KG fetch failed');
    const text = await res.text();
    const parser = new DOMParser();
    const xml = parser.parseFromString(text, "text/xml");
    const node = xml.querySelector('Currency[ISOCode="USD"] Value');
    if (node) {
      const v = parseFloat(node.textContent);
      if (!isNaN(v)) return v;
    }
    return BACKUP_RATES.kgs;
  } catch {
    return BACKUP_RATES.kgs;
  }
}

// Экспорт (глобальная функция fetchExchangeRates доступна в window)