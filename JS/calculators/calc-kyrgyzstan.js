// calc-kyrgyzstan.js
// Функция calculateKyrgyzstanFees(priceUSD, engineType, engineVolume, age, isElectric, batteryCapacity = 0, rates)
function calculateKyrgyzstanFees(price, engineType, engineVolume, age, isElectric, batteryCapacity = 0, rates = {}) {
  const kgsPerUSD = rates.kgs || 89;
  const details = [];
  let duty = 0; // в KGS
  let excise = 0;
  let vat = 0;
  let recycling = 0;

  const priceKGS = price * kgsPerUSD;
  details.push(`Цена: ${price.toFixed(2)} USD × ${kgsPerUSD.toFixed(2)} = ${priceKGS.toFixed(2)} KGS`);

  if (isElectric) {
    // Условные льготы: пошлина и НДС не взимаются (пример)
    duty = 0;
    vat = 0;
    details.push(`Электрокар: освобождён от пошлины и НДС (пример)`);
  } else {
    if (age <= 3) {
      duty = priceKGS * 0.15;
    } else if (age <= 8) {
      const fixed = engineVolume * 0.6;
      const percent = priceKGS * 0.2;
      duty = Math.max(fixed, percent);
    } else {
      duty = engineVolume * 2.5;
    }
    vat = 0.12 * (priceKGS + duty);
    details.push(`Пошлина: ${duty.toFixed(2)} KGS`);
    details.push(`НДС 12%: ${vat.toFixed(2)} KGS`);
  }

  const totalLocal = priceKGS + duty + excise + vat + recycling;
  const totalUSD = totalLocal / (kgsPerUSD || 1);
  const totalEUR = totalUSD * (rates.eur || 0.91);

  return {
    price: priceKGS,
    duty,
    excise,
    vat,
    recycling,
    total: totalLocal,
    totalUSD,
    totalEUR,
    details: details.join('\n'),
    currency: 'kgs'
  };
}