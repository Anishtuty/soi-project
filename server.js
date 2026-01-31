const express = require('express');
const cors = require('cors');
const app = express();

// Middleware
app.use(cors()); // Allow frontend to talk to backend
app.use(express.json()); // Allow reading JSON data

// 1. Health Check Route
app.get('/', (req, res) => {
    res.send("SerpentGuard Backend Active");
});

// 2. Incident Logging Route
app.post('/log-incident', (req, res) => {
    const data = req.body;
    
    console.log("=================================");
    console.log("🚨 NEW SNAKE INCIDENT REPORTED");
    console.log(`TIME: ${data.time}`);
    console.log(`SPECIES: ${data.species}`);
    console.log(`RISK: ${data.risk}`);
    console.log(`CONFIDENCE: ${data.confidence}%`);
    console.log("=================================\n");

    res.send("Log Received");
});

// Start Server
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
});