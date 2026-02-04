// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path'); // <--- Import 'path' module

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(cors());
app.use(bodyParser.json());

// --- NEW: SERVE FRONTEND ---
// This tells the server: "Look for HTML/CSS/JS files in the ../frontend folder"
app.use(express.static(path.join(__dirname, '../frontend')));

// --- IN-MEMORY DATA STORE ---
let sensorData = {
    1: { id: 1, name: "North Zone", moisture: 60, temp: 75, ph: 6.5 },
    2: { id: 2, name: "East Zone",  moisture: 50, temp: 76, ph: 6.2 },
    3: { id: 3, name: "South Zone", moisture: 45, temp: 78, ph: 6.0 }
};

// --- API ENDPOINTS ---

app.get('/api/sensors', (req, res) => {
    res.json(Object.values(sensorData));
});

app.post('/api/update', (req, res) => {
    const { id, moisture, temp, ph } = req.body;

    if (sensorData[id]) {
        sensorData[id].moisture = moisture;
        sensorData[id].temp = temp;
        sensorData[id].ph = ph;

        io.emit('sensor-update', sensorData[id]);

        if (moisture < 30) {
            io.emit('alert', {
                type: 'red',
                text: `CRITICAL: ${sensorData[id].name} moisture critical at ${moisture}%!`
            });
        } else if (moisture < 50) {
             io.emit('alert', {
                type: 'yellow',
                text: `Caution: ${sensorData[id].name} is drying out.`
            });
        }

        console.log(`[UPDATE] ${sensorData[id].name}: ${moisture}% Moisture`);
        res.status(200).send("Updated");
    } else {
        res.status(404).send("Sensor ID not found");
    }
});

// --- SERVER START ---
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`🚀 PrecisionPulse Backend running on http://localhost:${PORT}`);
});