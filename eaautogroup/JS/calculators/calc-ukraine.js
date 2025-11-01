// calc-ukraine.js
// Функция calculateUkraineFees(priceUSD, engineType, engineVolume, age, isElectric, batteryCapacity = 0, rates)
function calculateUkraineFees(price, engineType, engineVolume, age, isElectric, batteryCapacity = 0, rates = {}) {
  const uahPerUSD = rates.uah || 36.5;
  const details = [];
  let duty = 0;     // в UAH
  let excise = 0;   // в UAH
  let vat = 0;      // в UAH
  let recycling = 0;

  // Цена в гривнах
  const priceUAH = price * uahPerUSD;
  details.push(`Цена: ${price.toFixed(2)} USD × ${uahPerUSD.toFixed(2)} = ${priceUAH.toFixed(2)} UAH`);

  if (isElectric) {
    // Акциз: 1 EUR/кВт·ч * (EUR->UAH) -> преобразуем: 1 EUR = eurPerUSD * USD
    const eurPerUSD = rates.eur || 0.91;
    const eurToUah = (uahPerUSD / eurPerUSD);
    excise = batteryCapacity * 1 * eurToUah; // в UAH
    duty = 0;
    vat = 0; // льгота по НДС для ввоза электрокаров (в реальности уточнять)
    details.push(`Электрокар: акциз ${batteryCapacity} кВт·ч × 1€/кВт·ч × ${eurToUah.toFixed(2)} = ${excise.toFixed(2)} UAH`);
  } else {
    // Пошлина 10% от цены (в UAH)
    duty = price * 0.1 * uahPerUSD;
    // Акциз: базовая ставка зависит от типа двигателя
    const baseRate = engineType === 'diesel' ? 75 : 50; // условно, в гривнах за см³/1000
    excise = baseRate * (engineVolume / 1000) * (age <= 5 ? 1 : 1.5);
    // НДС 20% от (стоимость + пошлина + акциз)
    vat = 0.2 * (priceUAH + duty + excise);
    details.push(`Пошлина 10%: ${duty.toFixed(2)} UAH`);
    details.push(`Акциз: ${baseRate} × ${engineVolume/1000} × возрастный множитель = ${excise.toFixed(2)} UAH`);
    details.push(`НДС 20% от (цена+пошлина+акциз): ${vat.toFixed(2)} UAH`);
  }

  const totalLocal = priceUAH + duty + excise + vat + recycling;
  const totalUSD = totalLocal / (uahPerUSD || 1);
  const totalEUR = totalUSD * (rates.eur || 0.91);

  return {
    price: priceUAH,
    duty,
    excise,
    vat,
    recycling,
    total: totalLocal,
    totalUSD,
    totalEUR,
    details: details.join('\n'),
    currency: 'uah'
  };
}