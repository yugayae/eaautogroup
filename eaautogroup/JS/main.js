// safe-main.js — не перезаписывает существующие глобальные функции
(function() {
  // only define initCalculatorForm if it's missing
  if (typeof window.initCalculatorForm !== 'function') {
    window.initCalculatorForm = function() {
      const form = document.getElementById('customs-calc-form');
      if (!form) {
        console.warn('initCalculatorForm: form #customs-calc-form not found');
        return;
      }
      form.addEventListener('submit', async function(e) {
        e.preventDefault();
        try {
          // read inputs
          const country = (document.getElementById('calc-country')?.value || '').toLowerCase();
          const year = parseInt(document.getElementById('calc-car-year')?.value || '0', 10);
          const engineType = document.getElementById('calc-engine-type')?.value || '';
          const engineVolume = parseInt(document.getElementById('calc-engine-volume')?.value || '0', 10) || 0;
          const price = parseFloat(document.getElementById('calc-car-price')?.value || '0') || 0;
          const isElectric = !!document.getElementById('electric-checkbox')?.checked;
          const batteryCapacity = isElectric ? parseFloat(document.getElementById('battery-capacity')?.value || '0') || 0 : 0;
          const age = new Date().getFullYear() - (isNaN(year) ? new Date().getFullYear() : year);

          // get rates (fallback to safe backup)
          let rates = { rub:90, eur:0.91, uah:36.5, byn:3.2, kzt:470, kgs:89 };
          if (typeof fetchExchangeRates === 'function') {
            try { rates = await fetchExchangeRates(); }
            catch(err) { console.warn('fetchExchangeRates failed, using fallback', err); }
          }

          // choose calculator
          const map = {
            'russia': 'calculateRussianFees',
            'ukraine': 'calculateUkraineFees',
            'belarus': 'calculateBelarusFees',
            'kazakhstan': 'calculateKazakhstanFees',
            'kyrgyzstan': 'calculateKyrgyzstanFees'
          };
          const fnName = map[country];
          if (!fnName) { throw new Error('Страна не выбрана или не поддерживается: ' + country); }
          const calcFn = window[fnName];
          if (typeof calcFn !== 'function') throw new Error(`Функция ${fnName} не найдена`);

          // call calc function (most calculators accept: price, engineType, engineVolume, age, isElectric, batteryCapacity, rates)
          const result = calcFn(price, engineType, engineVolume, age, isElectric, batteryCapacity, rates);

          // If the calc returned a Promise (async), await it
          const finalResult = (result && typeof result.then === 'function') ? await result : result;

          // display: if displayResults exists, use it; otherwise fallback to a safe renderer
          if (typeof window.displayResults === 'function') {
            window.displayResults(finalResult, country, rates);
          } else {
            // basic fallback rendering into known IDs
            const currencyMap = { russia:'RUB', ukraine:'UAH', belarus:'BYN', kazakhstan:'KZT', kyrgyzstan:'KGS' };
            const local = currencyMap[country] || '';
            document.getElementById('car-price-result').textContent = (finalResult.price || price).toLocaleString() + ' USD';
            document.getElementById('customs-duty').textContent = ((finalResult.duty||0)).toFixed(2) + ' ' + local;
            if (document.getElementById('excise-row')) {
              document.getElementById('excise-row').style.display = (finalResult.excise && finalResult.excise>0) ? 'table-row' : 'none';
              document.getElementById('excise-fee').textContent = (finalResult.excise||0).toFixed(2) + ' ' + local;
            }
            document.getElementById('vat').textContent = ((finalResult.vat||0)).toFixed(2) + ' ' + local;
            if (document.getElementById('recycling-row')) {
              document.getElementById('recycling-row').style.display = (finalResult.recycling && finalResult.recycling>0) ? 'table-row' : 'none';
              document.getElementById('recycling-fee').textContent = (finalResult.recycling||0).toFixed(2) + ' ' + local;
            }
            document.getElementById('total-fees').textContent = (((finalResult.duty||0)+(finalResult.excise||0)+(finalResult.vat||0)+(finalResult.recycling||0))).toFixed(2) + ' ' + local;
            document.getElementById('total-usd').textContent = ((finalResult.totalUSD || finalResult.total || 0)).toFixed(2) + ' USD';
            document.getElementById('total-eur').textContent = ((finalResult.totalEUR || 0)).toFixed(2) + ' EUR';
            document.getElementById('total-local').textContent = ((finalResult.total || 0)).toFixed(2) + ' ' + local;
            document.getElementById('calculation-details').textContent = finalResult.details || JSON.stringify(finalResult, null, 2);
            document.getElementById('customs-result').style.display = 'block';
          }
        } catch (err) {
          console.error('Calculation error:', err);
          alert('Ошибка при расчёте: ' + (err && err.message ? err.message : err));
        }
      });
    };
  } // end define initCalculatorForm

  // If there's no displayResults, we don't create it — we just left the fallback inside submit handler
  // Finally call initCalculatorForm if DOM already loaded
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    try { window.initCalculatorForm(); } catch(e){ console.warn('initCalculatorForm call failed:', e); }
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      try { window.initCalculatorForm(); } catch(e){ console.warn('initCalculatorForm call failed:', e); }
    });
  }
})();