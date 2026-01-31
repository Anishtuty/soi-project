let model;
let isModelReady = false;

// 1. DATASETS
const SNAKES = [
    { id: 'cobra', name: "Indian Cobra", venom: true, msg: "Neurotoxic. Immobilize. Seek ASV." },
    { id: 'viper', name: "Russell's Viper", venom: true, msg: "Hemotoxic. Severe Bleeding. Hospitalize." },
    { id: 'krait', name: "Common Krait", venom: true, msg: "Respiratory Failure. Monitor Breathing." },
    { id: 'rat snake', name: "Indian Rat Snake", venom: false, msg: "Non-Venomous. Clean wound." }
];
const WOUND_KEYS = ["skin", "bandage", "wound", "flesh", "hand", "leg", "nematode"];

// 2. INIT SYSTEM
async function init() {
    try {
        console.log("Loading MobileNet...");
        // Update connection status
        const statusLight = document.getElementById('connection-status');
        if(statusLight) statusLight.style.background = "orange"; // Loading

        model = await mobilenet.load();
        isModelReady = true;
        
        console.log("AI Ready");
        if(statusLight) statusLight.style.background = "#10b981"; // Green (Ready)
        checkServer();
    } catch (error) {
        alert("Error loading AI Model. Check your internet connection.");
        console.error(error);
    }
}

// 3. AUTO-PROCESS
async function startAutoProcess(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Safety Check: Is AI Ready?
    if (!isModelReady) {
        alert("Please wait for the AI to finish loading (Green Light).");
        return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
        // UI: Show Scanning
        const img = document.getElementById('view-img');
        img.src = e.target.result;
        img.style.display = "block";
        document.getElementById('upload-ui').style.display = "none";
        document.getElementById('scanner').style.display = "flex";
        document.getElementById('results').style.display = "none";

        // ACTION: Predict with Error Handling
        try {
            // Slight delay to ensure image renders before AI reads it
            setTimeout(async () => {
                const predictions = await model.classify(img, 10);
                processResults(predictions);
            }, 500); 
        } catch (err) {
            console.error(err);
            alert("AI Error: Could not read image. Try a clearer photo.");
            resetUI();
        }
    };
    reader.readAsDataURL(file);
}

// 4. LOGIC ENGINE
function processResults(predictions) {
    if (!predictions || predictions.length === 0) {
        alert("AI found no patterns.");
        resetUI();
        return;
    }

    const top = predictions[0];
    const confidence = Math.round(top.probability * 100);
    
    let match = null;
    let isWound = predictions.some(p => WOUND_KEYS.some(k => p.className.toLowerCase().includes(k)));
    let riskLevel = "UNKNOWN";

    for (let p of predictions) {
        match = SNAKES.find(s => p.className.toLowerCase().includes(s.id));
        if (match) break;
    }

    let result = {
        name: "Unknown Specimen",
        action: "Treat as VENOMOUS. Seek medical help.",
        isVenom: true,
        color: "#64748b",
        type: "Unknown"
    };

    if (confidence < 70 && !match) {
        result.name = "Unidentified (Low Confidence)";
        result.action = "AI uncertain. Assume High Risk. Do not approach.";
        result.color = "#f59e0b";
    } 
    else if (match) {
        result.name = match.name;
        result.action = match.msg;
        result.isVenom = match.venom;
        result.color = match.venom ? "#ef4444" : "#10b981";
        result.type = "Snake";
        riskLevel = match.venom ? "CRITICAL" : "SAFE";
    } 
    else if (isWound) {
        result.name = "Bite Pattern Analysis";
        result.action = "Check for Punctures (Venom) vs Scratches (Non-Venom).";
        result.color = "#ef4444";
        result.type = "Wound";
        riskLevel = "OBSERVATION REQUIRED";
    }

    updateUI(result, confidence);
    logToBackend(result.name, riskLevel, confidence);
}

function updateUI(data, conf) {
    document.getElementById('scanner').style.display = "none";
    document.getElementById('results').style.display = "block";
    
    const badge = document.getElementById('risk-badge');
    badge.innerText = data.isVenom ? "⚠️ HIGH RISK" : "✅ LOW RISK";
    badge.style.background = data.color;

    document.getElementById('species-name').innerText = data.name;
    document.getElementById('action-msg').innerText = data.action;
    
    const meter = document.getElementById('meter-fill');
    if(meter) {
        meter.style.width = conf + "%";
        meter.style.background = data.color;
    }
    
    const confVal = document.getElementById('conf-val');
    if(confVal) confVal.innerText = conf;

    document.getElementById('bite-guide').style.display = data.type === "Wound" ? "block" : "none";
}

function resetUI() {
    document.getElementById('scanner').style.display = "none";
    document.getElementById('upload-ui').style.display = "block";
    document.getElementById('view-img').style.display = "none";
}

// 5. SERVER CONNECTION (Fails safely if server is off)
async function checkServer() {
    try {
        await fetch('http://localhost:5000/');
        const status = document.getElementById('connection-status');
        if(status) {
            status.classList.add('online');
            status.title = "Server Online";
        }
    } catch (e) { console.log("Server Offline (Running in Standalone Mode)"); }
}

async function logToBackend(name, risk, conf) {
    const statusEl = document.getElementById('log-status');
    if(!statusEl) return;
    
    try {
        await fetch('http://localhost:5000/log-incident', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ species: name, risk: risk, confidence: conf, time: new Date() })
        });
        statusEl.innerText = "✅ Logged to server.";
    } catch (err) {
        statusEl.innerText = "⚠️ Offline Mode: Saved locally only.";
    }
}

init();