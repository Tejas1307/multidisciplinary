let isAutoMode = true;

// 1. Initialize empty array (Data will come from Backend)
let sensors = [];

// Static Database for Crops (Client-side data)
const cropDB = [
    { name: "Tomatoes", match: 92, ph: "6.0-6.8", season: "Spring-Summer" },
    { name: "Bell Peppers", match: 88, ph: "6.0-6.5", season: "Spring-Summer" },
    { name: "Lettuce", match: 85, ph: "6.0-7.0", season: "Spring-Fall" },
    { name: "Carrots", match: 78, ph: "6.0-6.8", season: "Spring-Fall" }
];

// 2. MAIN FUNCTION: Fetch Live Data from Node.js Server
async function fetchLiveSensorData() {
    try {
        // Fetch from your local backend API
        const response = await fetch('http://localhost:3000/api/sensors');
        
        // Save the JSON data into our global 'sensors' array
        sensors = await response.json();
        
        // Calculate Averages based on real data
        // (Using 'reduce' to sum up values, then dividing by count)
        const avgMoisture = Math.round(sensors.reduce((a, b) => a + b.moisture, 0) / sensors.length);
        const avgTemp = Math.round(sensors.reduce((a, b) => a + b.temp, 0) / sensors.length);
        // ParseFloat needed because pH might be a string in JSON
        const avgPH = (sensors.reduce((a, b) => a + parseFloat(b.ph), 0) / sensors.length).toFixed(1);

        // Update Top Metrics (DOM Elements)
        document.getElementById('moisture-val').innerText = avgMoisture || "--";
        document.getElementById('temp-val').innerText = avgTemp || "--";
        document.getElementById('ph-val').innerText = avgPH || "--";
        document.getElementById('active-sensors').innerText = sensors.length;
        document.getElementById('sync-time').innerText = new Date().toLocaleTimeString();

        // Update Visual Components with new data
        updateInsight(avgMoisture);
        renderMapAndZones();
        renderIrrigation(); // Update switches based on new moisture
        renderAlerts();     // Generate alerts based on new critical levels

    } catch (error) {
        console.error("Error connecting to backend:", error);
        // Optional: Show an offline status if fetch fails
        document.getElementById('sync-time').innerText = "Offline (Backend not running)";
    }
}

// 3. Update the Real-Time Insight Gauge
function updateInsight(moisture) {
    if (!moisture) return; // Guard clause if data is missing

    const badge = document.getElementById('monitor-badge');
    const gauge = document.querySelector('.gauge-circle');
    const gaugeVal = document.getElementById('gauge-val');
    const insightText = document.getElementById('insight-text');
    const insightBox = document.getElementById('insight-box');
    const icon = document.querySelector('.insight-icon');

    gaugeVal.innerText = moisture;
    gauge.style.setProperty('--p', moisture);

    if (moisture > 60) {
        badge.className = 'status-badge optimal'; badge.innerText = 'Optimal';
        gauge.style.setProperty('--c', 'var(--primary)');
        insightBox.style.borderLeftColor = 'var(--primary)';
        icon.style.color = 'var(--primary)';
        insightText.innerText = "Soil moisture is ideal. No action needed.";
    } else if (moisture > 40) {
        badge.className = 'status-badge caution'; badge.innerText = 'Caution';
        gauge.style.setProperty('--c', 'var(--caution)');
        insightBox.style.borderLeftColor = 'var(--caution)';
        icon.style.color = 'var(--caution)';
        insightText.innerText = "Moisture dropping. Prepare to irrigate soon.";
    } else {
        badge.className = 'status-badge critical'; badge.innerText = 'Critical';
        gauge.style.setProperty('--c', 'var(--critical)');
        insightBox.style.borderLeftColor = 'var(--critical)';
        icon.style.color = 'var(--critical)';
        insightText.innerText = "CRITICAL: Soil too dry! Immediate irrigation required.";
    }
}

// 4. Render Field Map & Zone List
function renderMapAndZones() {
    const map = document.getElementById('field-map');
    const zoneList = document.getElementById('zone-list');
    
    // Clear previous renders
    map.innerHTML = ''; 
    zoneList.innerHTML = '';

    sensors.forEach(s => {
        // Determine color based on individual sensor moisture
        const color = s.moisture > 60 ? 'var(--primary)' : (s.moisture > 40 ? 'var(--caution)' : 'var(--critical)');
        
        // Map Pin
        const pin = document.createElement('div');
        pin.className = 'sensor-pin';
        // Note: In a real app, 'top'/'left' would come from DB. 
        // For simulation, we map ID to fixed positions or you can add coordinates to backend.
        // Here we default to some positions if missing, or assume backend sends them (simulator doesn't send pos, so let's add defaults)
        const positions = [
            { top: '25%', left: '30%' }, // North
            { top: '48%', left: '72%' }, // East
            { top: '75%', left: '42%' }  // South
        ];
        // Use ID-1 for array index, safe fallback
        const pos = positions[s.id - 1] || { top: '50%', left: '50%' };
        
        pin.style.top = pos.top; 
        pin.style.left = pos.left;
        pin.style.backgroundColor = color;
        map.appendChild(pin);

        // Zone List Item
        zoneList.innerHTML += `
            <div style="display:flex; justify-content:space-between; padding:10px; border-bottom:1px solid var(--border)">
                <span>${s.name}</span> <strong style="color:${color}">${s.moisture}%</strong>
            </div>
        `;
    });
}

// 5. Render Irrigation Controls
function renderIrrigation() {
    const container = document.getElementById('pump-controls');
    container.innerHTML = sensors.map((s, i) => `
        <div class="pump-item ${isAutoMode ? 'disabled' : ''}">
            <span>${s.name} Valve</span>
            <label class="switch">
                <input type="checkbox" ${s.moisture < 40 ? 'checked' : ''} ${isAutoMode ? 'disabled' : ''}>
                <span class="slider"></span>
            </label>
        </div>
    `).join('');
}

// 6. Dynamic Alerts based on Live Data
function renderAlerts() {
    const container = document.getElementById('alert-list');
    let alertsHTML = '';

    // Loop through sensors to find issues
    sensors.forEach(s => {
        if (s.moisture < 30) {
            alertsHTML += `<div class="alert-item red"><span>Critical: ${s.name} moisture critical at ${s.moisture}%</span></div>`;
        } else if (s.moisture < 50) {
            alertsHTML += `<div class="alert-item yellow"><span>Caution: ${s.name} is drying out (${s.moisture}%)</span></div>`;
        }
    });

    // Add a default success message if everything is good
    if (alertsHTML === '') {
        alertsHTML = `<div class="alert-item green"><span>System Nominal: All zones within optimal range.</span></div>`;
    }

    container.innerHTML = alertsHTML;
}

// 7. Static Render Functions (Run once)
function renderCrops() {
    const container = document.getElementById('crop-list');
    container.innerHTML = cropDB.map(c => `
        <div class="crop-item">
            <div style="display:flex; justify-content:space-between">
                <strong>${c.name}</strong> <small>${c.match}% Match</small>
            </div>
            <div class="progress-bg"><div class="progress-fill" style="width:${c.match}%"></div></div>
            <small>${c.season} | pH: ${c.ph}</small>
        </div>
    `).join('');
}

function renderWeather() {
    const container = document.getElementById('weather-display');
    container.innerHTML = `
        <div class="weather-current">
            <div class="current-left">
                <span style="font-size:0.8rem; color:var(--text-dim);">Current</span>
                <div class="current-temp">78°F</div>
                <div class="current-condition">Sunny, Clear Skies</div>
            </div>
            <i class="fas fa-sun big-sun-icon"></i>
        </div>
        <div class="weather-details">
            <div class="detail-box"><i class="fas fa-wind"></i><div class="detail-text"><span>Wind</span><strong>8 mph</strong></div></div>
            <div class="detail-box"><i class="fas fa-tint"></i><div class="detail-text"><span>Humidity</span><strong>45%</strong></div></div>
        </div>
        <div class="forecast-title">5-Day Forecast</div>
        <div class="forecast-grid">
            <div class="forecast-item"><span>Today</span><i class="fas fa-sun" style="color:#fcd34d"></i><strong>78°</strong></div>
            <div class="forecast-item"><span>Tue</span><i class="fas fa-cloud-sun" style="color:#94a3b8"></i><strong>72°</strong></div>
            <div class="forecast-item"><span>Wed</span><i class="fas fa-cloud-rain" style="color:#60a5fa"></i><strong>68°</strong></div>
            <div class="forecast-item"><span>Thu</span><i class="fas fa-sun" style="color:#fcd34d"></i><strong>75°</strong></div>
            <div class="forecast-item"><span>Fri</span><i class="fas fa-cloud" style="color:#94a3b8"></i><strong>70°</strong></div>
        </div>
    `;
}

// 8. Trends Chart (Static for now, connect to history API later)
function initTrends() {
    const ctx = document.getElementById('moistureChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', 'Now'],
            datasets: [{
                data: [62, 58, 55, 48, 52, 60, 65],
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: { responsive: true, plugins: { legend: { display: false } } }
    });
}

// UI Toggles
function toggleTheme() {
    const html = document.documentElement;
    const isDark = html.getAttribute('data-theme') === 'dark';
    const newTheme = isDark ? 'light' : 'dark';
    html.setAttribute('data-theme', newTheme);
    document.getElementById('theme-icon').className = isDark ? 'fas fa-sun' : 'fas fa-moon';
}

function toggleAutoMode() {
    isAutoMode = document.getElementById('auto-mode').checked;
    renderIrrigation();
}

// --- INITIALIZATION ---
renderCrops();
renderWeather();
initTrends();

// Start the Live Data Stream
// 1. Fetch immediately
fetchLiveSensorData();
// 2. Poll every 3 seconds to match Simulator speed
setInterval(fetchLiveSensorData, 3000);