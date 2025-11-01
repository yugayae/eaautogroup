// calc-kazakhstan.js
// Функция calculateKazakhstanFees(priceUSD, engineType, engineVolume, age, isElectric, batteryCapacity = 0, rates)
function calculateKazakhstanFees(price, engineType, engineVolume, age, isElectric, batteryCapacity = 0, rates = {}) {
  const kztPerUSD = rates.kzt || 470;
  const details = [];
  let duty = 0; // в KZT
  let excise = 0;
  let vat = 0;
  let recycling = 0;

  const priceKZT = price * kztPerUSD;
  details.push(`Цена: ${price.toFixed(2)} USD × ${kztPerUSD.toFixed(2)} = ${priceKZT.toFixed(2)} KZT`);

  if (isElectric) {
    // Предполагаемая льгота: пошлина 0, НДС 0, но есть условный утильсбор
    duty = 0;
    vat = 0;
    recycling = 229000; // пример фиксированного KZT
    details.push(`Электрокар: пошлина и НДС освобождены (в примере). Утильсбор: ${recycling} KZT`);
  } else {
    duty = priceKZT * 0.15; // 15%
    // Акциз — условно 0 для небольших объёмов, для больших — процент от цены
    excise = engineVolume > 1500 ? priceKZT * 0.1 : 0;
    recycling = engineVolume <= 1000 ? 294900 : 688100; // примерные ставки в KZT
    vat = 0.12 * (priceKZT + duty + excise);
    details.push(`Пошлина 15%: ${duty.toFixed(2)} KZT`);
    details.push(`Акциз: ${excise.toFixed(2)} KZT`);
    details.push(`Утильсбор: ${recycling} KZT`);
    details.push(`НДС 12%: ${vat.toFixed(2)} KZT`);
  }

  const totalLocal = priceKZT + duty + excise + vat + recycling;
  const totalUSD = totalLocal / (kztPerUSD || 1);
  const totalEUR = totalUSD * (rates.eur || 0.91);

  return {
    price: priceKZT,
    duty,
    excise,
    vat,
    recycling,
    total: totalLocal,
    totalUSD,
    totalEUR,
    details: details.join('\n'),
    currency: 'kzt'
  };
}