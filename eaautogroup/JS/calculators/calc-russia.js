// calculateRussianFees(priceUSD, engineVolume, engineType, age, isElectric, batteryCapacity = 0, rates = {})
// priceUSD - цена в USD (Number)
// engineVolume - см³ (Number)
// engineType - строка ('petrol','diesel','hybrid','electric' или локализованный)
// age - возраст авто в годах (Number)
// isElectric - булев (true/false) — дополнительно для надёжности можно определить по engineType
// rates - объект с курсами: { rub: RUB_per_USD, eur: EUR_per_USD } (fallback внутри)

function calculateRussianFees(priceUSD, engineVolume, engineType, age, isElectric, batteryCapacity = 0, rates = {}) {
  // --- валидация / приведение типов ---
  priceUSD = Number(priceUSD) || 0;
  engineVolume = Number(engineVolume) || 0;
  age = Number(age) || 0;
  batteryCapacity = Number(batteryCapacity) || 0;
  engineType = (engineType || '').toString().toLowerCase();

  // --- безопасное определение электрокара ---
  // isElectric может быть передано как true/false, или engineType может содержать "electric"/"электро"
  const electricDetected = Boolean(isElectric) ||
                           engineType === 'electric' ||
                           engineType.indexOf('элект') !== -1 ||
                           engineType.indexOf('elect') !== -1;

  // --- курсы (fallback) ---
  const usdToRub = Number(rates.rub) || 90;    // RUB за 1 USD
  const eurPerUSD = Number(rates.eur) || 0.91; // EUR за 1 USD
  // 1 EUR = (usdToRub / eurPerUSD) RUB
  const rubPerEUR = eurPerUSD > 0 ? (usdToRub / eurPerUSD) : usdToRub;

  // --- результаты в RUB (локальная валюта) ---
  let priceRUB = priceUSD * usdToRub;
  let dutyRUB = 0;
  let exciseRUB = 0;
  let recyclingRUB = 0;
  let vatRUB = 0;
  const details = [];

  details.push(`Входные: цена ${priceUSD} USD = ${priceRUB.toFixed(2)} RUB (курс ${usdToRub} RUB/USD), объём ${engineVolume} см³, возраст ${age} лет, электрокар=${electricDetected}`);

  if (electricDetected) {
    // льгота для электрокаров (примерно — в твоём проекте так задавали)
    dutyRUB = 0;
    exciseRUB = 0;
    // утилизационный сбор в локальной валюте (примерная ставка, можно заменить на реальные)
    recyclingRUB = 1700;
    details.push(`Электрокар: пошлина 0, акциз 0, утильсбор ${recyclingRUB.toFixed(2)} RUB`);
  } else {
    // --- Пошлина ---
    // используем модель: для новых (<=1 год) — 15%, для <=3 или <=5 и т.д. (пример)
    // а также минимальная пошлина = 2.5 EUR * см³ (переведём в рубли)
    const isNew = age <= 1;
    const dutyRate = isNew ? 0.15 : 0.2; // 15% для новых, 20% для остальных (пример)
    const dutyByPercentRUB = priceUSD * dutyRate * usdToRub;
    const minDutyEUR = engineVolume * 2.5; // 2.5 EUR/см³
    const minDutyRUB = minDutyEUR * rubPerEUR;
    dutyRUB = Math.max(dutyByPercentRUB, minDutyRUB);
    details.push(`Пошлина: max(${(priceUSD).toFixed(2)}USD × ${dutyRate*100}% × ${usdToRub} = ${dutyByPercentRUB.toFixed(2)} RUB, ${engineVolume}×2.5€×${rubPerEUR.toFixed(2)} = ${minDutyRUB.toFixed(2)} RUB) => ${dutyRUB.toFixed(2)} RUB`);

    // --- Акциз (упрощённо) ---
    // применяем простую модель: для больших объёмов есть ставка (пример)
    if (engineVolume > 3000) {
      exciseRUB = engineVolume * 47; // 47 RUB/см³ для больших моторов (пример из твоего кода)
      details.push(`Акциз: 47 руб/см³ × ${engineVolume} = ${exciseRUB.toFixed(2)} RUB`);
    } else {
      exciseRUB = 0;
      details.push('Акциз: 0 (объём ≤ 3000 см³ в упрощённой модели)');
    }

    // --- Утилизационный сбор ---
    recyclingRUB = engineVolume <= 2000 ? 3400 : 5200;
    details.push(`Утилизационный сбор: ${recyclingRUB.toFixed(2)} RUB`);
  }

  // --- НДС 20% (в РФ) ---
  vatRUB = 0.20 * (priceRUB + dutyRUB + exciseRUB);
  details.push(`НДС (20%): 20% × (${priceRUB.toFixed(2)} + ${dutyRUB.toFixed(2)} + ${exciseRUB.toFixed(2)}) = ${vatRUB.toFixed(2)} RUB`);

  // --- Итого ---
  const totalLocalRUB = priceRUB + dutyRUB + exciseRUB + recyclingRUB + vatRUB;
  const totalUSD = totalLocalRUB / usdToRub;
  const totalEUR = totalUSD * eurPerUSD;

  // --- Гарантируем числа (никакого NaN) ---
  function num(v){ return Number.isFinite(v) ? Number(v.toFixed(2)) : 0; }

  return {
    priceUSD: num(priceUSD),
    priceRUB: num(priceRUB),
    dutyRUB: num(dutyRUB),
    exciseRUB: num(exciseRUB),
    recyclingRUB: num(recyclingRUB),
    vatRUB: num(vatRUB),
    totalLocalRUB: num(totalLocalRUB),
    totalUSD: num(totalUSD),
    totalEUR: num(totalEUR),
    details: details.join('\\n'),
    currency: 'rub'
  };
}