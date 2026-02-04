// utils/simulator.js
const axios = require('axios');

const API_URL = 'http://localhost:3000/api/update';

// Simulating 3 specific zones to match your Dashboard
const ZONES = [
    { id: 1, name: "North Zone" },
    { id: 2, name: "East Zone" },
    { id: 3, name: "South Zone" }
];

// Helper to generate random number in range
const random = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);
const randomFloat = (min, max) => (Math.random() * (max - min) + min).toFixed(1);

console.log("🌱 PrecisionPulse Simulator Started...");
console.log("📡 Sending sensor data every 3 seconds...");

setInterval(() => {
    // Pick a random zone to update
    const zone = ZONES[Math.floor(Math.random() * ZONES.length)];

    // Generate random realistic data
    // Moisture varies between 20% (Dry) and 90% (Wet)
    const payload = {
        id: zone.id,
        moisture: random(20, 90),
        temp: random(70, 95),     // Temp in Fahrenheit
        ph: randomFloat(5.5, 7.5) // pH level
    };

    // Send the fake data to your own server
    axios.post(API_URL, payload)
        .then(() => {
            // Log success nicely
            console.log(` -> Sent: ${zone.name} | Moisture: ${payload.moisture}% | Temp: ${payload.temp}°F`);
        })
        .catch(error => {
            console.error(`❌ Error sending data: Is the server running?`);
        });

}, 3000); // 3000ms = 3 seconds