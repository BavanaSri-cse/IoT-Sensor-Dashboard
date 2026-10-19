/**
 * app.js – IoT Sensor Dashboard
 * Simulates real-time sensor data for:
 *   - Arduino Nano (Temp, Motion, Microphone, GPS)
 *   - Raspberry Pi 4 (Pressure, Light, Sound, GPIO LED)
 *   - NodeMCU ESP8266 (Soil Moisture, Humidity, Relay, Water Pump)
 */

'use strict';

/* ─────────────────────────────────────────────
   1. State
───────────────────────────────────────────── */
const state = {
  temp: 28,
  humidity: 72,
  soil: 68,
  pressure: 1013,
  light: 420,
  motion: true,
  sound: 62,

  // Agriculture
  agriSoil: 68,
  agriTemp: 28,
  agriHumidity: 72,
  pumpOn: false,

  // Toys
  toy1Bat: 78,
  toy2Bat: 45,

  // Devices
  arduinoLoad: 35,
  rpiCpu: 42,
  espSignal: -65,

  // LED
  ledOn: false,

  alertCount: 0,
  lastUpdate: Date.now(),
};

/* Sparkline history buffers */
const hist = {
  temp: [], humidity: [], soil: [], pressure: [], light: [],
  agriSoil: [], agriTemp: [], agriHumidity: [],
  arduinoLoad: [], rpiCpu: [], espSignal: [],
};
const HIST_MAX = 60;

/* ─────────────────────────────────────────────
   2. Utility helpers
───────────────────────────────────────────── */
function rand(min, max, step = 1) {
  const steps = (max - min) / step;
  return min + Math.round(Math.random() * steps) * step;
}

function walk(val, min, max, step) {
  const delta = (Math.random() - 0.5) * 2 * step;
  return Math.min(max, Math.max(min, +(val + delta).toFixed(1)));
}

function pushHist(key, val) {
  hist[key].push(val);
  if (hist[key].length > HIST_MAX) hist[key].shift();
}

function now() {
  return new Date().toLocaleTimeString('en-GB', { hour12: false });
}

/* ─────────────────────────────────────────────
   3. Simulate sensor tick
───────────────────────────────────────────── */
function tick() {
  state.temp      = walk(state.temp,      18, 42, 0.4);
  state.humidity  = walk(state.humidity,  30, 95, 0.6);
  state.soil      = walk(state.soil,      20, 95, 0.8);
  state.pressure  = walk(state.pressure, 990, 1030, 0.5);
  state.light     = walk(state.light,      50, 900, 12);
  state.sound     = walk(state.sound,      30, 90, 1.5);
  state.motion    = Math.random() > 0.3;

  state.agriSoil     = walk(state.agriSoil,     25, 95, 0.7);
  state.agriTemp     = walk(state.agriTemp,      18, 42, 0.3);
  state.agriHumidity = walk(state.agriHumidity,  35, 95, 0.5);

  state.arduinoLoad = walk(state.arduinoLoad,  5,  85, 3);
  state.rpiCpu      = walk(state.rpiCpu,        8,  90, 4);
  state.espSignal   = walk(state.espSignal,    -90, -30, 2);

  state.toy1Bat = Math.max(1, state.toy1Bat - (Math.random() > 0.97 ? 1 : 0));
  state.toy2Bat = Math.max(1, state.toy2Bat - (Math.random() > 0.94 ? 1 : 0));

  // Auto-pump when soil < 40%
  if (!state.pumpOn && state.agriSoil < 40) {
    state.pumpOn = true;
    addAlert(`Pump AUTO-ON: Soil moisture critical (${state.agriSoil.toFixed(0)}%)`, 'warn');
    updatePumpUI();
  }
  if (state.pumpOn && state.agriSoil > 70) {
    state.pumpOn = false;
    addAlert(`Pump OFF: Soil moisture optimal (${state.agriSoil.toFixed(0)}%)`, 'info');
    updatePumpUI();
  }

  // Push history
  Object.keys(hist).forEach(k => {
    if (state[k] !== undefined) pushHist(k, state[k]);
  });

  // Random alert
  if (Math.random() < 0.04) generateAlert();

  state.lastUpdate = Date.now();
}

/* ─────────────────────────────────────────────
   4. DOM Update helpers
───────────────────────────────────────────── */
function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function setWidth(id, pct) {
  const el = document.getElementById(id);
  if (el) el.style.width = Math.min(100, Math.max(0, pct)) + '%';
}

/* ─────────────────────────────────────────────
   5. Update Overview KPI cards
───────────────────────────────────────────── */
function updateKPIs() {
  setText('kv-temp',     `${state.temp.toFixed(1)}°C`);
  setText('kv-humidity', `${state.humidity.toFixed(0)}%`);
  setText('kv-soil',     `${state.soil.toFixed(0)}%`);
  setText('kv-pressure', `${state.pressure.toFixed(0)} hPa`);
  setText('kv-light',    `${state.light.toFixed(0)} lux`);
  setText('kv-motion',   state.motion ? 'Detected' : 'None');

  const mi = document.getElementById('motion-indicator');
  if (mi) mi.className = 'motion-indicator' + (state.motion ? '' : ' inactive');
}

/* ─────────────────────────────────────────────
   6. Sparklines (SVG polylines)
───────────────────────────────────────────── */
function drawSparkline(svgId, data) {
  const svg = document.getElementById(svgId);
  if (!svg || data.length < 2) return;
  const W = 100, H = 30;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - ((v - min) / range) * H * 0.85 - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  svg.innerHTML = `
    <defs>
      <linearGradient id="sg-${svgId}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#00d4ff" stop-opacity="0.3"/>
        <stop offset="100%" stop-color="#00d4ff" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <polyline points="${pts}" fill="none" stroke="#00d4ff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  `;
}

function updateSparklines() {
  drawSparkline('spark-temp',     hist.temp);
  drawSparkline('spark-humidity', hist.humidity);
  drawSparkline('spark-soil',     hist.soil);
  drawSparkline('spark-pressure', hist.pressure);
  drawSparkline('spark-light',    hist.light);
}

/* ─────────────────────────────────────────────
   7. Alerts
───────────────────────────────────────────── */
const alertTypes = {
  warn: '⚠️',
  error: '🔴',
  info: 'ℹ️',
};

function addAlert(msg, type = 'warn') {
  state.alertCount++;
  setText('alert-count', state.alertCount);

  const list = document.getElementById('alert-list');
  if (!list) return;

  // Remove empty placeholder
  const empty = list.querySelector('.alert-empty');
  if (empty) empty.remove();

  const li = document.createElement('li');
  li.className = `alert-item ${type}`;
  li.innerHTML = `
    <span>${alertTypes[type] || '⚠️'}</span>
    <div>
      <div>${msg}</div>
      <div class="alert-time">${now()}</div>
    </div>
  `;
  list.prepend(li);

  // Keep only last 8 alerts
  const items = list.querySelectorAll('.alert-item');
  if (items.length > 8) items[items.length - 1].remove();
}

function generateAlert() {
  const alerts = [
    [`Temperature spike: ${state.temp.toFixed(1)}°C`, state.temp > 38 ? 'error' : 'warn'],
    [`Humidity low: ${state.humidity.toFixed(0)}%`, 'warn'],
    [`Soil moisture: ${state.soil.toFixed(0)}%`, state.soil < 35 ? 'error' : 'info'],
    [`Motion detected on Smart Toy 1`, 'info'],
    [`Battery low – Toy 2: ${state.toy2Bat}%`, state.toy2Bat < 20 ? 'error' : 'warn'],
    [`Light sensor: ${state.light.toFixed(0)} lux`, 'info'],
    [`Cloud sync OK – ThingSpeak`, 'info'],
  ];
  const pick = alerts[rand(0, alerts.length - 1)];
  addAlert(pick[0], pick[1]);
}

/* ─────────────────────────────────────────────
   8. GPS simulation
───────────────────────────────────────────── */
let gpsAngle = 0;
function updateGPS() {
  gpsAngle += 0.02;
  const wrapper = document.getElementById('gps-dot-wrapper');
  const coordsEl = document.getElementById('gps-coords');
  if (!wrapper || !coordsEl) return;

  const cx = 50 + Math.sin(gpsAngle) * 20;
  const cy = 50 + Math.cos(gpsAngle * 0.7) * 18;
  wrapper.style.left = cx + '%';
  wrapper.style.top  = cy + '%';
  wrapper.style.transform = 'translate(-50%,-50%)';

  const lat = (12.9716 + Math.sin(gpsAngle) * 0.005).toFixed(4);
  const lon = (77.5946 + Math.cos(gpsAngle * 0.7) * 0.005).toFixed(4);
  coordsEl.textContent = `Lat: ${lat}° N  |  Lon: ${lon}° E`;
}

/* ─────────────────────────────────────────────
   9. Agriculture Panel
───────────────────────────────────────────── */
function updateAgriPanel() {
  setText('agri-soil',     `${state.agriSoil.toFixed(0)}%`);
  setText('agri-temp',     `${state.agriTemp.toFixed(1)}°C`);
  setText('agri-humidity', `${state.agriHumidity.toFixed(0)}%`);
  setText('agri-relay',    state.pumpOn ? 'Active' : 'Standby');

  setWidth('soil-progress',     state.agriSoil);
  setWidth('temp-progress',     ((state.agriTemp - 0) / 50) * 100);
  setWidth('humidity-progress', state.agriHumidity);

  const ri = document.getElementById('relay-indicator');
  if (ri) ri.className = 'relay-indicator' + (state.pumpOn ? '' : ' off');

  // Pipeline visual
  const pipeRelay = document.getElementById('pipe-relay');
  const pipePump  = document.getElementById('pipe-pump');
  if (pipeRelay) pipeRelay.classList.toggle('active', state.pumpOn);
  if (pipePump)  pipePump.classList.toggle('active', state.pumpOn);
}

function updatePumpUI() {
  const btn   = document.getElementById('pump-toggle');
  const state_el = document.getElementById('pump-state');
  if (!btn || !state_el) return;
  btn.setAttribute('aria-pressed', state.pumpOn ? 'true' : 'false');
  state_el.textContent = state.pumpOn ? 'ON' : 'OFF';
  state_el.className = 'pump-state' + (state.pumpOn ? ' on' : '');
}

document.getElementById('pump-toggle')?.addEventListener('click', () => {
  state.pumpOn = !state.pumpOn;
  addAlert(`Pump manually ${state.pumpOn ? 'ON' : 'OFF'}`, 'info');
  updatePumpUI();
});

/* ─────────────────────────────────────────────
   10. Smart Toy Panel
───────────────────────────────────────────── */
function updateToyPanel() {
  setText('toy1-temp', `${state.temp.toFixed(1)}°C`);
  setText('toy1-motion', state.motion ? 'Detected' : 'None');
  setText('toy2-light', `${state.light.toFixed(0)} lux`);
  setText('toy2-pressure', `${state.pressure.toFixed(0)} hPa`);
  setText('toy2-sound', `${state.sound.toFixed(0)} dB`);

  setWidth('toy1-bat', state.toy1Bat);
  setWidth('toy2-bat', state.toy2Bat);
  setText('toy1-bat-pct', `${state.toy1Bat}%`);
  setText('toy2-bat-pct', `${state.toy2Bat}%`);

  setText('mob-temp', `${state.temp.toFixed(1)}°C`);
  setText('mob-bat',  `${state.toy1Bat}%`);

  // Alert banner
  const alertBanner = document.getElementById('mob-alert');
  if (alertBanner) {
    if (state.toy1Bat < 20 || state.toy2Bat < 20) {
      alertBanner.style.background = 'rgba(244,63,94,0.15)';
      alertBanner.style.borderColor = 'rgba(244,63,94,0.25)';
      alertBanner.style.color = '#f43f5e';
      alertBanner.textContent = '⚠️ Low battery alert!';
    } else {
      alertBanner.style.background = '';
      alertBanner.style.borderColor = '';
      alertBanner.style.color = '';
      alertBanner.textContent = '✓ All toys safe!';
    }
  }

  // Update mobile time
  const t = new Date();
  setText('mobile-time', `${String(t.getHours()).padStart(2,'0')}:${String(t.getMinutes()).padStart(2,'0')}`);
}

/* ─────────────────────────────────────────────
   11. Header status
───────────────────────────────────────────── */
function updateHeaderStatus() {
  const seconds = Math.floor((Date.now() - state.lastUpdate) / 1000);
  setText('last-update', seconds < 5 ? 'Just now' : `${seconds}s ago`);
}

/* ─────────────────────────────────────────────
   12. Charts initialisation
───────────────────────────────────────────── */
const CHART_DEFAULTS = {
  responsive: true,
  maintainAspectRatio: false,
  animation: { duration: 400 },
  plugins: { legend: { display: false }, tooltip: { enabled: true } },
  scales: {
    x: {
      grid: { color: 'rgba(255,255,255,0.05)' },
      ticks: { color: '#4a5578', font: { size: 9, family: 'JetBrains Mono' }, maxTicksLimit: 6 },
    },
    y: {
      grid: { color: 'rgba(255,255,255,0.05)' },
      ticks: { color: '#4a5578', font: { size: 9, family: 'JetBrains Mono' }, maxTicksLimit: 5 },
    },
  },
};

function makeLabels(n) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(Date.now() - (n - i) * 2000);
    return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`;
  });
}

/* Gradient helpers */
function cyanGrad(ctx) {
  const g = ctx.createLinearGradient(0, 0, 0, 220);
  g.addColorStop(0, 'rgba(0,212,255,0.35)');
  g.addColorStop(1, 'rgba(0,212,255,0)');
  return g;
}
function violetGrad(ctx) {
  const g = ctx.createLinearGradient(0, 0, 0, 220);
  g.addColorStop(0, 'rgba(124,58,237,0.35)');
  g.addColorStop(1, 'rgba(124,58,237,0)');
  return g;
}
function greenGrad(ctx) {
  const g = ctx.createLinearGradient(0, 0, 0, 220);
  g.addColorStop(0, 'rgba(16,185,129,0.35)');
  g.addColorStop(1, 'rgba(16,185,129,0)');
  return g;
}

/* Seed initial history */
for (let i = 0; i < 30; i++) tick();

/* --- Main Temp+Humidity Chart --- */
let chartTH;
(function initChartTH() {
  const ctx = document.getElementById('chart-temp-humidity')?.getContext('2d');
  if (!ctx) return;
  chartTH = new Chart(ctx, {
    type: 'line',
    data: {
      labels: makeLabels(hist.temp.length),
      datasets: [
        {
          label: 'Temperature (°C)',
          data: [...hist.temp],
          borderColor: '#f43f5e',
          backgroundColor: (c) => {
            const g = c.chart.ctx.createLinearGradient(0,0,0,220);
            g.addColorStop(0, 'rgba(244,63,94,0.3)');
            g.addColorStop(1, 'rgba(244,63,94,0)');
            return g;
          },
          borderWidth: 2, fill: true, tension: 0.4, pointRadius: 0,
        },
        {
          label: 'Humidity (%)',
          data: [...hist.humidity],
          borderColor: '#00d4ff',
          backgroundColor: (c) => {
            const g = c.chart.ctx.createLinearGradient(0,0,0,220);
            g.addColorStop(0, 'rgba(0,212,255,0.25)');
            g.addColorStop(1, 'rgba(0,212,255,0)');
            return g;
          },
          borderWidth: 2, fill: true, tension: 0.4, pointRadius: 0,
        },
      ],
    },
    options: {
      ...CHART_DEFAULTS,
      plugins: {
        legend: {
          display: true,
          labels: { color: '#8b9ec7', font: { size: 11 }, boxWidth: 12 },
        },
      },
    },
  });
})();

/* --- Donut Chart --- */
let chartDonut;
(function initDonut() {
  const ctx = document.getElementById('chart-donut')?.getContext('2d');
  if (!ctx) return;
  chartDonut = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Temperature', 'Humidity', 'Soil', 'Pressure', 'Light', 'Sound'],
      datasets: [{
        data: [22, 18, 15, 12, 20, 13],
        backgroundColor: ['#f43f5e','#00d4ff','#10b981','#3b82f6','#f59e0b','#7c3aed'],
        borderColor: 'rgba(8,12,24,0.8)',
        borderWidth: 3,
        hoverOffset: 6,
      }],
    },
    options: {
      ...CHART_DEFAULTS,
      cutout: '68%',
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
          labels: { color: '#8b9ec7', font: { size: 10 }, boxWidth: 10, padding: 8 },
        },
      },
    },
  });
})();

/* --- Pressure & Light Bar Chart --- */
let chartPL;
(function initPressureLight() {
  const ctx = document.getElementById('chart-pressure-light')?.getContext('2d');
  if (!ctx) return;
  chartPL = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: makeLabels(8),
      datasets: [
        {
          label: 'Pressure (hPa/10)',
          data: hist.pressure.slice(-8).map(v => v / 10),
          backgroundColor: 'rgba(59,130,246,0.5)',
          borderColor: '#3b82f6', borderWidth: 1, borderRadius: 4,
        },
        {
          label: 'Light (lux/10)',
          data: hist.light.slice(-8).map(v => v / 10),
          backgroundColor: 'rgba(245,158,11,0.4)',
          borderColor: '#f59e0b', borderWidth: 1, borderRadius: 4,
        },
      ],
    },
    options: {
      ...CHART_DEFAULTS,
      plugins: {
        legend: {
          display: true,
          labels: { color: '#8b9ec7', font: { size: 10 }, boxWidth: 10 },
        },
      },
    },
  });
})();

/* --- Agriculture Trend Chart --- */
let chartAgriTrend;
(function initAgriTrend() {
  const ctx = document.getElementById('chart-agri-trend')?.getContext('2d');
  if (!ctx) return;
  chartAgriTrend = new Chart(ctx, {
    type: 'line',
    data: {
      labels: makeLabels(hist.agriSoil.length),
      datasets: [
        {
          label: 'Soil Moisture (%)',
          data: [...hist.agriSoil],
          borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.15)',
          borderWidth: 2, fill: true, tension: 0.4, pointRadius: 0,
        },
        {
          label: 'Temperature (°C)',
          data: [...hist.agriTemp],
          borderColor: '#f43f5e', backgroundColor: 'rgba(244,63,94,0.1)',
          borderWidth: 2, fill: true, tension: 0.4, pointRadius: 0,
        },
        {
          label: 'Humidity (%)',
          data: [...hist.agriHumidity],
          borderColor: '#00d4ff', backgroundColor: 'rgba(0,212,255,0.08)',
          borderWidth: 2, fill: true, tension: 0.4, pointRadius: 0,
        },
      ],
    },
    options: {
      ...CHART_DEFAULTS,
      plugins: {
        legend: {
          display: true,
          labels: { color: '#8b9ec7', font: { size: 11 }, boxWidth: 12 },
        },
      },
    },
  });
})();

/* --- Irrigation Events Chart --- */
(function initIrrigation() {
  const ctx = document.getElementById('chart-irrigation')?.getContext('2d');
  if (!ctx) return;
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['06:00','08:00','10:00','12:00','14:00','16:00','18:00','20:00'],
      datasets: [{
        label: 'Duration (min)',
        data: [5, 0, 8, 0, 12, 0, 6, 4],
        backgroundColor: 'rgba(16,185,129,0.5)',
        borderColor: '#10b981', borderWidth: 1, borderRadius: 4,
      }],
    },
    options: { ...CHART_DEFAULTS },
  });
})();

/* --- Toy Battery Chart --- */
let chartToyBat;
(function initToyBat() {
  const ctx = document.getElementById('chart-toy-battery')?.getContext('2d');
  if (!ctx) return;
  chartToyBat = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Toy 1', 'Toy 2'],
      datasets: [{
        label: 'Battery %',
        data: [state.toy1Bat, state.toy2Bat],
        backgroundColor: ['rgba(16,185,129,0.6)', 'rgba(245,158,11,0.6)'],
        borderColor: ['#10b981', '#f59e0b'],
        borderWidth: 1, borderRadius: 4,
      }],
    },
    options: { ...CHART_DEFAULTS },
  });
})();

/* --- Arduino Load Chart --- */
let chartArduino;
(function initArduinoLoad() {
  const ctx = document.getElementById('chart-arduino-load')?.getContext('2d');
  if (!ctx) return;
  chartArduino = new Chart(ctx, {
    type: 'line',
    data: {
      labels: makeLabels(hist.arduinoLoad.length),
      datasets: [{
        data: [...hist.arduinoLoad],
        borderColor: '#00d4ff', backgroundColor: 'rgba(0,212,255,0.1)',
        borderWidth: 1.5, fill: true, tension: 0.4, pointRadius: 0,
      }],
    },
    options: { ...CHART_DEFAULTS },
  });
})();

/* --- RPi CPU Chart --- */
let chartRpi;
(function initRpiCpu() {
  const ctx = document.getElementById('chart-rpi-cpu')?.getContext('2d');
  if (!ctx) return;
  chartRpi = new Chart(ctx, {
    type: 'line',
    data: {
      labels: makeLabels(hist.rpiCpu.length),
      datasets: [{
        data: [...hist.rpiCpu],
        borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.1)',
        borderWidth: 1.5, fill: true, tension: 0.4, pointRadius: 0,
      }],
    },
    options: { ...CHART_DEFAULTS },
  });
})();

/* --- ESP Signal Chart --- */
let chartEsp;
(function initEspSignal() {
  const ctx = document.getElementById('chart-esp-signal')?.getContext('2d');
  if (!ctx) return;
  chartEsp = new Chart(ctx, {
    type: 'line',
    data: {
      labels: makeLabels(hist.espSignal.length),
      datasets: [{
        data: [...hist.espSignal],
        borderColor: '#7c3aed', backgroundColor: 'rgba(124,58,237,0.1)',
        borderWidth: 1.5, fill: true, tension: 0.4, pointRadius: 0,
      }],
    },
    options: { ...CHART_DEFAULTS },
  });
})();

/* ─────────────────────────────────────────────
   13. Chart updaters
───────────────────────────────────────────── */
function updateCharts() {
  const labels = makeLabels(hist.temp.length);

  if (chartTH) {
    chartTH.data.labels = labels;
    chartTH.data.datasets[0].data = [...hist.temp];
    chartTH.data.datasets[1].data = [...hist.humidity];
    chartTH.update('none');
  }

  if (chartAgriTrend) {
    chartAgriTrend.data.labels = makeLabels(hist.agriSoil.length);
    chartAgriTrend.data.datasets[0].data = [...hist.agriSoil];
    chartAgriTrend.data.datasets[1].data = [...hist.agriTemp];
    chartAgriTrend.data.datasets[2].data = [...hist.agriHumidity];
    chartAgriTrend.update('none');
  }

  if (chartPL) {
    chartPL.data.labels = makeLabels(hist.pressure.slice(-8).length);
    chartPL.data.datasets[0].data = hist.pressure.slice(-8).map(v => v / 10);
    chartPL.data.datasets[1].data = hist.light.slice(-8).map(v => v / 10);
    chartPL.update('none');
  }

  if (chartToyBat) {
    chartToyBat.data.datasets[0].data = [state.toy1Bat, state.toy2Bat];
    chartToyBat.update('none');
  }

  if (chartArduino) {
    chartArduino.data.labels = makeLabels(hist.arduinoLoad.length);
    chartArduino.data.datasets[0].data = [...hist.arduinoLoad];
    chartArduino.update('none');
  }

  if (chartRpi) {
    chartRpi.data.labels = makeLabels(hist.rpiCpu.length);
    chartRpi.data.datasets[0].data = [...hist.rpiCpu];
    chartRpi.update('none');
  }

  if (chartEsp) {
    chartEsp.data.labels = makeLabels(hist.espSignal.length);
    chartEsp.data.datasets[0].data = [...hist.espSignal];
    chartEsp.update('none');
  }
}

/* ─────────────────────────────────────────────
   14. GPIO Pin Layout
───────────────────────────────────────────── */
const GPIO_PINS = [
  // [pin_num, label, class]
  [1,'3V3','power3v3'],[2,'5V','power5v'],
  [3,'G2','gpio'],[4,'5V','power5v'],
  [5,'G3','gpio'],[6,'GND','gnd'],
  [7,'G4','gpio'],[8,'G14','gpio'],
  [9,'GND','gnd'],[10,'G15','gpio'],
  [11,'G17','gpio17'],[12,'G18','gpio'],
  [13,'G27','gpio'],[14,'GND','gnd'],
  [15,'G22','gpio'],[16,'G23','gpio'],
  [17,'3V3','power3v3'],[18,'G24','gpio'],
  [19,'G10','gpio'],[20,'GND','gnd'],
];

(function buildGpioPins() {
  const container = document.getElementById('gpio-pins');
  if (!container) return;
  GPIO_PINS.forEach(([num, label, cls]) => {
    const div = document.createElement('div');
    div.className = `gpio-pin ${cls}`;
    div.id = `gpin-${num}`;
    div.title = `Pin ${num}: ${label}`;
    div.textContent = label.length <= 3 ? label : num;
    container.appendChild(div);
  });
})();

/* ─────────────────────────────────────────────
   15. LED Toggle (GPIO17)
───────────────────────────────────────────── */
document.getElementById('led-toggle-btn')?.addEventListener('click', () => {
  state.ledOn = !state.ledOn;
  const led   = document.getElementById('circuit-led');
  const label = document.getElementById('led-state-label');
  const gpio17Pin = document.getElementById('gpin-11');

  if (led)   led.classList.toggle('led-on', state.ledOn);
  if (label) label.textContent = `LED: ${state.ledOn ? 'ON' : 'OFF'}`;
  if (gpio17Pin) gpio17Pin.classList.toggle('led-on', state.ledOn);
});

/* ─────────────────────────────────────────────
   16. Tab switching
───────────────────────────────────────────── */
document.querySelectorAll('.nav-tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-tab').forEach(b => {
      b.classList.remove('active');
      b.setAttribute('aria-selected', 'false');
    });
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));

    btn.classList.add('active');
    btn.setAttribute('aria-selected', 'true');
    const panel = document.getElementById(`panel-${btn.dataset.tab}`);
    if (panel) panel.classList.add('active');

    // Resize charts after tab switch
    setTimeout(() => {
      [chartTH, chartDonut, chartPL, chartAgriTrend, chartToyBat, chartArduino, chartRpi, chartEsp]
        .forEach(c => c?.resize());
    }, 50);
  });
});

/* ─────────────────────────────────────────────
   17. Main render loop
───────────────────────────────────────────── */
let frameCount = 0;
function render() {
  tick();
  updateKPIs();
  updateSparklines();
  updateAgriPanel();
  updateToyPanel();
  updateHeaderStatus();
  updateGPS();

  // Update charts every 5 frames to avoid redraws every 2s being too heavy
  frameCount++;
  if (frameCount % 2 === 0) updateCharts();
}

render(); // Initial render immediately

// Then update every 2 seconds
setInterval(render, 2000);

/* ─────────────────────────────────────────────
   18. Time range buttons (dummy filter)
───────────────────────────────────────────── */
document.querySelectorAll('.ctrl-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    btn.closest('.chart-controls')?.querySelectorAll('.ctrl-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});

console.log('%c IoT Dashboard Online ', 'background:#00d4ff;color:#000;font-weight:bold;padding:4px 12px;border-radius:4px;');
