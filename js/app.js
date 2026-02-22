// Small static client-side app that fetches Open-Meteo data and renders cards
const resorts = [
  { id: 'chamonix', name: 'Chamonix', lat: 45.9237, lon: 6.8694 },
  { id: 'verbier', name: 'Verbier', lat: 46.0999, lon: 7.2167 },
  { id: 'zermatt', name: 'Zermatt', lat: 46.0197, lon: 7.7500 },
  { id: 'la-clusaz', name: 'La Clusaz', lat:45.8922, lon:6.4243 },
  { id: 'les-gets', name: 'Les Gets', lat:46.1840, lon:6.6868 }
];

const resortsEl = document.getElementById('resorts');

function weatherCodeToIcon(code){
  // simplified mapping
  if(code === 0) return {icon:'☀️', txt:'Clear'};
  if(code <= 3) return {icon:'⛅', txt:'Partly cloudy'};
  if(code === 45 || code === 48) return {icon:'🌫️', txt:'Fog'};
  if(code >= 51 && code <= 67) return {icon:'🌧️', txt:'Drizzle/Rain'};
  if(code >= 71 && code <= 77) return {icon:'❄️', txt:'Snow'};
  if(code >= 80 && code <= 82) return {icon:'🌦️', txt:'Showers'};
  if(code >= 95) return {icon:'⛈️', txt:'Thunderstorm'};
  return {icon:'🌥️', txt:'Cloudy'};
}

async function fetchResort(resort){
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', resort.lat);
  url.searchParams.set('longitude', resort.lon);
  url.searchParams.set('current_weather', 'true');
  url.searchParams.set('daily', 'weathercode,temperature_2m_max,temperature_2m_min');
  url.searchParams.set('timezone', 'auto');

  const resp = await fetch(url.toString(), {cache: 'no-store'});
  if(!resp.ok) throw new Error('Fetch error');
  return resp.json();
}

function createCard(resort){
  const el = document.createElement('article');
  el.className = 'card';
  el.id = `resort-${resort.id}`;
  el.innerHTML = `
    <div class="head">
      <div>
        <div class="resort-name">${resort.name}</div>
        <div class="meta">Lat ${resort.lat.toFixed(2)}, Lon ${resort.lon.toFixed(2)}</div>
      </div>
      <div style="text-align:right">
        <div class="icon" aria-hidden>⏳</div>
        <div class="temp">—</div>
      </div>
    </div>
    <div class="forecast" aria-hidden></div>
  `;
  return el;
}

function renderForecast(card, data){
  const iconEl = card.querySelector('.icon');
  const tempEl = card.querySelector('.temp');
  const fcEl = card.querySelector('.forecast');
  const cw = data.current_weather;
  const daily = data.daily;
  const map = weatherCodeToIcon(cw.weathercode);
  iconEl.textContent = map.icon;
  iconEl.setAttribute('title', map.txt);
  tempEl.textContent = `${Math.round(cw.temperature)}°C`;

  fcEl.innerHTML = '';
  if(daily && daily.time && daily.time.length){
    for(let i=0;i<Math.min(3,daily.time.length);i++){
      const d = document.createElement('div'); d.className='day';
      const code = daily.weathercode[i];
      const icons = weatherCodeToIcon(code);
      d.innerHTML = `<div style="font-size:1.05rem">${icons.icon}</div><div style="margin-top:6px">${daily.time[i].split('T')[0]}<br><small>${Math.round(daily.temperature_2m_max[i])} / ${Math.round(daily.temperature_2m_min[i])}°C</small></div>`;
      fcEl.appendChild(d);
    }
  }
}

async function init(){
  resorts.forEach(r=>resortsEl.appendChild(createCard(r)));

  for(const resort of resorts){
    const card = document.getElementById(`resort-${resort.id}`);
    try{
      const data = await fetchResort(resort);
      renderForecast(card, data);
    }catch(err){
      card.querySelector('.icon').textContent = '⚠️';
      card.querySelector('.temp').textContent = 'N/A';
      const errEl = document.createElement('div'); errEl.className='meta'; errEl.textContent = 'Unable to load data';
      card.appendChild(errEl);
    }
  }
}

document.addEventListener('DOMContentLoaded', init);
