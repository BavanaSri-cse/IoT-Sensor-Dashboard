# 🌐 IoT Sensor Dashboard & Smart Monitoring System

A responsive, real-time IoT monitoring web dashboard simulating and visualizing sensor data from **Arduino Nano**, **Raspberry Pi 4**, and **NodeMCU ESP8266** microcontrollers.

---

## 🔗 Live Website Demo

* 🚀 **Official Live Website (GitHub Pages)**:  
  👉 **[https://bavanasri-cse.github.io/IoT-Sensor-Dashboard/](https://bavanasri-cse.github.io/IoT-Sensor-Dashboard/)**

* 📱 **Smart Toys Cloud Architecture Mirror**:  
  👉 **[https://bavanasri-cse.github.io/Smart-Toys-Cloud-Architecture/](https://bavanasri-cse.github.io/Smart-Toys-Cloud-Architecture/)**

---

## 🚀 Features

- **📊 Live Telemetry & Dynamic Charts**:
  - Temperature (°C), Humidity (%), Soil Moisture (%), Atmospheric Pressure (hPa), Ambient Light (lux), Motion, and Sound (dB).
  - Real-time animated sparklines and telemetry trends powered by Chart.js.
  
- **🌱 Smart Agriculture Section**:
  - Live soil moisture tracking.
  - Automated & manual irrigation pump control with relay feedback indicators.
  - Historical irrigation duration analysis.

- **🧸 Smart Toys Cloud Architecture**:
  - Multi-device tracking (Smart Teddy Bear & RC Car).
  - GPS location telemetry, microphone status, and battery percentage monitors.
  - Parent mobile app mockup interface with automated low-battery alerts.

- **⚡ Hardware Devices & Pinout Simulation**:
  - Arduino Nano (ATmega328P @ 16 MHz) specifications and sensor mapping.
  - Raspberry Pi 4 (Broadcom BCM2711) with an interactive **40-pin GPIO header visualizer**.
  - Interactive **GPIO17 LED circuit toggle** with instant feedback.
  - NodeMCU ESP8266 Wi-Fi signal strength and relay status.

---

## 🛠️ Tech Stack

- **Frontend**: HTML5, Modern CSS3 (Dark Glassmorphism, CSS Grid, Flexbox, Custom animations), Vanilla JavaScript (ES6+).
- **Visualization**: [Chart.js](https://www.chartjs.org/) for real-time sensor graphs.
- **Microcontroller Simulation**: Built-in dynamic sensor simulation engine with realistic walk algorithms and thresholds.

---

## 🖥️ How to Run Locally

### Option 1: Direct in Browser
Simply double-click `index.html` to open it directly in any modern web browser (Chrome, Edge, Firefox, Safari).

### Option 2: Using Built-in Local Server
Run the PowerShell server script:
```powershell
powershell -ExecutionPolicy Bypass -File server.ps1
```
Then visit:
👉 `http://localhost:3000/`

---

## 📁 Repository Structure

```text
├── index.html       # Main Dashboard UI shell and layouts
├── style.css        # Glassmorphism styling, layout tokens, and responsive design
├── app.js           # Real-time sensor simulation, state management, and Chart.js integration
├── server.ps1       # Lightweight native local HTTP/TCP web server
└── README.md        # Project documentation
```

---

## 📜 License
MIT License.
