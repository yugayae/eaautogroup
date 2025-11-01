// calc-belarus.js
// Функция calculateBelarusFees(priceUSD, engineType, engineVolume, age, isElectric, batteryCapacity = 0, rates)
function calculateBelarusFees(price, engineType, engineVolume, age, isElectric, batteryCapacity = 0, rates = {}) {
  const bynPerUSD = rates.byn || 3.2;
  const details = [];
  let duty = 0; // в BYN
  let excise = 0;
  let vat = 0;
  let recycling = 0;

  const priceBYN = price * bynPerUSD;
  details.push(`Цена: ${price.toFixed(2)} USD × ${bynPerUSD.toFixed(2)} = ${priceBYN.toFixed(2)} BYN`);

  if (isElectric) {
    // В Беларуси часто есть льготы по пошлине — ставим 0, НДС 0 (пример)
    duty = 0;
    vat = 0;
    // Условный утильсбор (можно корректировать)
    recycling = 1700 / bynPerUSD; // переводим в BYN (пример)
    details.push(`Электрокар: пошлина и НДС не начисляются (по установленным льготам).`);
    details.push(`Утилизационный сбор (пример): ${recycling.toFixed(2)} BYN`);
  } else {
    // Пошлина (условно 15% от цены)
    duty = priceBYN * 0.15;
    // Акциз — на примере: 0.3 BYN/см³ (условно)
    excise = engineVolume * (engineType === 'diesel' ? 0.4 : 0.3);
    vat = 0.2 * (priceBYN + duty + excise);
    details.push(`Пошлина 15%: ${duty.toFixed(2)} BYN`);
    details.push(`Акциз: ${excise.toFixed(2)} BYN`);
    details.push(`НДС 20%: ${vat.toFixed(2)} BYN`);
  }

  const totalLocal = priceBYN + duty + excise + vat + recycling;
  const totalUSD = totalLocal / (bynPerUSD || 1);
  const totalEUR = totalUSD * (rates.eur || 0.91);

  return {
    price: priceBYN,
    duty,
    excise,
    vat,
    recycling,
    total: totalLocal,
    totalUSD,
    totalEUR,
    details: details.join('\n'),
    currency: 'byn'
  };
}