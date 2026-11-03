const starter=['NSSC','ALRM','ARLO','SNT','EXTR','CLFD','LTRX','UI','MSFT','GOOGL','AMZN','BRK.B','KO','PG','O'];
const names={NSSC:'NAPCO Security',ALRM:'Alarm.com',ARLO:'Arlo Technologies',SNT:'Senstar Technologies',EXTR:'Extreme Networks',CLFD:'Clearfield',LTRX:'Lantronix',UI:'Ubiquiti',MSFT:'Microsoft',GOOGL:'Alphabet',AMZN:'Amazon','BRK.B':'Berkshire Hathaway',KO:'Coca-Cola',PG:'Procter & Gamble',O:'Realty Income'};
let watch=JSON.parse(localStorage.getItem('watch-v1')||'null')||starter;const $=id=>document.getElementById(id);const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function tab(t){document.querySelectorAll('.pane').forEach(e=>e.classList.toggle('hidden',e.id!==t));document.querySelectorAll('.tab').forEach(e=>e.classList.toggle('active',e.dataset.tab===t))}document.querySelectorAll('.tab').forEach(b=>b.onclick=()=>tab(b.dataset.tab));
function renderWatch(){$('count').textContent=`${watch.length} stocks`;$('watchItems').innerHTML=watch.map(t=>`<div class="watchrow"><div><div class="watchname">${escape(t)}</div><div class="small">${escape(names[t]||'Public company')}</div></div><div><button data-open="${escape(t)}">Research</button> <button data-remove="${escape(t)}" aria-label="Remove ${escape(t)}">×</button></div></div>`).join('');document.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>{tab('research');$('researchTicker').value=b.dataset.open;analyze(b.dataset.open)});document.querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>{watch=watch.filter(x=>x!==b.dataset.remove);save()})}
function save(){localStorage.setItem('watch-v1',JSON.stringify(watch));renderWatch()};$('addForm').onsubmit=e=>{e.preventDefault();const t=$('tickerInput').value.trim().toUpperCase();if(!/^[A-Z][A-Z0-9.-]{0,9}$/.test(t))return alert('Enter a valid ticker');if(!watch.includes(t))watch.push(t);$('tickerInput').value='';save()};$('researchForm').onsubmit=e=>{e.preventDefault();analyze($('researchTicker').value.trim().toUpperCase())};
const money=n=>Number(n).toLocaleString('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0});const pct=n=>`${n.toFixed(2)}%`;const date=x=>x?.end||'—';
function ref(x,cik){if(!x)return '';const link=x.accession?`https://www.sec.gov/Archives/edgar/data/${Number(cik)}/${x.accession.replaceAll('-','')}/`:'';return `<small>SEC XBRL: ${escape(x.tag)} · ${escape(x.form)} · period ${escape(x.start||'instant')} to ${escape(x.end)} · filed ${escape(x.filed)} ${link?`· <a href="${link}" target="_blank" rel="noopener">Filing archive</a>`:''}</small>`}
function metric(title,result,formula,substitution,meaning,sources,warning=''){return `<article class="card"><div class="metrichead"><strong>${escape(title)}</strong><span class="pill">Calculated</span></div><div class="metric">${escape(result)}</div><p>${escape(meaning)}</p>${warning?`<p class="warning">${escape(warning)}</p>`:''}<details><summary>Show the math & sources</summary><p><b>Formula:</b> ${escape(formula)}</p><div class="math">${escape(substitution)}</div><p><b>Source fields:</b></p>${sources.join('<hr style="border-color:#293a51">')}</details></article>`}
function unavailable(title,why){return `<article class="card"><strong>${escape(title)}</strong><p class="muted">Not available: ${escape(why)}</p></article>`}
function getAnnual(data,key){return data.metrics[key]?.annual||[]}
function compare(a,b){if(!a||!b||b.value===0)return null;return (a.value-b.value)/Math.abs(b.value)*100}
async function analyze(t){$('status').textContent='Retrieving official SEC reports…';$('companyResult').innerHTML='';try{const r=await fetch(`/api/company?ticker=${encodeURIComponent(t)}`);const d=await r.json();if(!r.ok)throw Error(d.error||'Unable to load company');$('status').textContent=`SEC data retrieved ${new Date(d.retrievedAt).toLocaleString()} · Not real-time market prices`;
let html=`<div class="card"><div class="small">${escape(d.ticker)} · CIK ${escape(d.cik)}</div><h2 style="margin-top:6px">${escape(d.company)}</h2><p>Financial metrics are calculated from reported SEC XBRL data. Check source periods before comparing.</p></div>`;
const rev=getAnnual(d,'revenue');if(rev.length>=2){const g=compare(rev[0],rev[1]);html+=metric('Annual revenue growth',pct(g),'(Current annual revenue − Previous annual revenue) ÷ Previous annual revenue × 100',`(${money(rev[0].value)} − ${money(rev[1].value)}) ÷ ${money(rev[1].value)} × 100 = ${pct(g)}`,'Shows how quickly reported annual sales changed.',[ref(rev[0],d.cik),ref(rev[1],d.cik)],'Compare fiscal years and accounting definitions.')}else html+=unavailable('Annual revenue growth','Two comparable annual revenue values were not found.');
const ni=getAnnual(d,'netIncome');if(ni.length>=2){const g=compare(ni[0],ni[1]);html+=metric('Net income change',pct(g),'(Current net income − Prior net income) ÷ absolute prior net income × 100',`(${money(ni[0].value)} − ${money(ni[1].value)}) ÷ ${money(Math.abs(ni[1].value))} × 100 = ${pct(g)}`,'Shows the change in reported profit.',[ref(ni[0],d.cik),ref(ni[1],d.cik)],ni[1].value<=0?'Prior net income was zero or negative; percentage growth can be misleading.':'') }else html+=unavailable('Net income change','Two comparable annual values were not found.');
const oc=getAnnual(d,'operatingCash'),cap=getAnnual(d,'capex');const pair=oc.map(x=>({o:x,c:cap.find(y=>y.end===x.end)})).find(x=>x.c);if(pair){const fcf=pair.o.value-pair.c.value;html+=metric('Free cash flow (annual)',money(fcf),'Operating cash flow − capital expenditures',`${money(pair.o.value)} − ${money(pair.c.value)} = ${money(fcf)}`,'Cash generated from operations after reported purchases of property, plant and equipment.',[ref(pair.o,d.cik),ref(pair.c,d.cik)],'Simplified free cash flow definition; other capital spending tags may apply.')}else html+=unavailable('Free cash flow','Matching annual operating cash flow and capital expenditure values were not found.');
const cash=d.metrics.cash?.latest,liab=d.metrics.liabilities?.latest;if(cash&&liab)html+=metric('Cash / total liabilities',`${(cash.value/liab.value).toFixed(2)}×`,'Cash and equivalents ÷ total liabilities',`${money(cash.value)} ÷ ${money(liab.value)} = ${(cash.value/liab.value).toFixed(2)}×`,'A liquidity reference, not a complete debt or solvency measure.',[ref(cash,d.cik),ref(liab,d.cik)],cash.end!==liab.end?'These balance-sheet values come from different dates; do not rely on this comparison.':'');
html+=unavailable('Current P/E ratio','A verified current stock price is not connected yet. We will not invent one.');html+=unavailable('Dividend yield','A verified current stock price and current annual dividend rate are not connected yet.');
html+=`<div class="card"><h2>Official SEC filings</h2><p>Open the original reports and verify the statements.</p>${d.filings.map(f=>`<div class="watchrow"><span>${escape(f.form)} · ${escape(f.date)}</span><a href="${escape(f.url)}" target="_blank" rel="noopener">Open report ↗</a></div>`).join('')||'<p>No recent filings listed.</p>'}<p class="hint">Data quality note: SEC tags vary by company. These calculations use standardized US-GAAP fields and may omit company-specific extension tags. Always verify the original report.</p></div>`;
$('companyResult').innerHTML=html;}catch(e){$('status').innerHTML=`<span class="error">${escape(e.message)}. If running locally, check the server configuration and SEC access.</span>`}}
const lessons=[['P/E ratio','Stock price ÷ trailing twelve-month earnings per share. A low P/E does not automatically mean a bargain.'],['Revenue growth','(New revenue − old revenue) ÷ old revenue × 100. Compare the same fiscal periods.'],['Free cash flow','Operating cash flow − capital expenditures. Positive cash flow helps fund operations, growth, and dividends.'],['Dividend yield','Indicated annual dividend per share ÷ stock price × 100. Dividends are not guaranteed.'],['Dividend payout ratio','Annual dividends per share ÷ annual earnings per share × 100. REITs require additional analysis such as AFFO.'],['Value investing','Compare the stock price to sustainable earnings, cash flows, business risks, and competitors.'],['Risk management','Small stocks can have thin trading volume, dilution, customer concentration, and volatile earnings.']];$('learnCards').innerHTML=lessons.map(([t,d])=>`<article class="card"><strong>${escape(t)}</strong><p>${escape(d)}</p></article>`).join('');renderWatch();if('serviceWorker'in navigator)navigator.serviceWorker.register('/sw.js').catch(()=>{});

/* STOCK HUB — TWELVE DATA PRICE UPGRADE */

const stockQuoteCache = new Map();

async function loadStockQuote(ticker) {
  const response = await fetch(
    `/api/quote?ticker=${encodeURIComponent(ticker)}`
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Quote unavailable');
  }

  stockQuoteCache.set(ticker, data);
  return data;
}

function stockPriceCard(q) {
  const price = Number(q.price);
  const change = Number(q.change);
  const percent = Number(q.percentChange);

  if (!Number.isFinite(price) || q.price === null) {
    return '<article class="card">Stock price unavailable</article>';
  }

  const color = change >= 0 ? '#22c55e' : '#ef4444';

  return `
    <article class="card">
      <div class="small">MARKET PRICE · ${escape(q.ticker)}</div>
      <h2>$${price.toFixed(2)}</h2>
      <p style="color:${color};font-weight:bold">
        ${change >= 0 ? '+' : ''}${change.toFixed(2)}
        (${percent.toFixed(2)}%)
      </p>
      <p class="small">
        Source: Twelve Data<br>
        Quote time: ${escape(q.quoteDatetime || 'Unavailable')}<br>
        Price freshness depends on provider access.
      </p>
    </article>
  `;
}

async function showStockPrice(ticker) {
  try {
    const quote = await loadStockQuote(ticker);

    if ($('researchTicker').value.trim().toUpperCase() !== ticker) {
      return;
    }

    let container = document.getElementById('liveStockPrice');

    if (!container) {
      container = document.createElement('div');
      container.id = 'liveStockPrice';
      $('companyResult').before(container);
    }

    container.innerHTML = stockPriceCard(quote);
  } catch (error) {
    console.error('Stock quote error:', error);
  }
}

/* Add stock prices when research is requested */
const originalAnalyze = analyze;

analyze = async function(ticker) {
  const result = await originalAnalyze(ticker);
  await showStockPrice(ticker);
  return result;
};
