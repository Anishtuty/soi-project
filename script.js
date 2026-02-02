let model;
let currentMode = 'snake';

// Initialize AI Model
async function init() {
    try {
        model = await mobilenet.load();
        console.log("AI Model Loaded ✅");
    } catch (e) {
        console.error("AI failed to load:", e);
    }
}
init();

// Mode Switcher
function setMode(mode) {
    currentMode = mode;
    document.getElementById('btn-snake').classList.toggle('active', mode === 'snake');
    document.getElementById('btn-bite').classList.toggle('active', mode === 'bite');
    document.getElementById('upload-title').innerText = mode === 'snake' ? "Upload Snake Image" : "Upload Bite Mark Image";
    document.getElementById('result-panel').style.display = 'none'; // Clear results on switch
}

// 1. THIS FIXES THE UPLOAD
function loadImage(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = document.getElementById('preview-image');
            img.src = e.target.result;
            img.style.display = 'block'; 
            
            // Hide the placeholder UI and show the button
            document.getElementById('upload-ui').style.display = 'none';
            document.getElementById('predict-btn').style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
}

// 2. PREDICTION ENGINE
async function predict() {
    const img = document.getElementById('preview-image');
    if (!model) {
        alert("AI is still loading, please wait a moment.");
        return;
    }

    // Show result panel and set to "Analyzing..."
    document.getElementById('results').style.display = 'block';
    document.getElementById('species-name').innerText = "Analyzing...";

    const predictions = await model.classify(img);
    const topResult = predictions[0];
    const confidence = Math.round(topResult.probability * 100);

    let result = {
        name: topResult.className.split(',')[0],
        risk: "Unknown",
        action: "Please consult a professional.",
        color: "#64748b"
    };

    // Logic based on mode
    if (currentMode === 'snake') {
        if (result.name.toLowerCase().includes('cobra') || result.name.toLowerCase().includes('viper')) {
            result.risk = "CRITICAL";
            result.action = "Venomous snake detected. Seek immediate medical help!";
            result.color = "#ef4444";
        } else {
            result.risk = "Vigilance Required";
            result.action = "Non-venomous/Unknown. Keep distance.";
            result.color = "#f59e0b";
        }
    }

    updateUI(result, confidence);
}

function updateUI(data, conf) {
    document.getElementById('species-name').innerText = data.name;
    const riskBadge = document.getElementById('risk-badge');
    if (riskBadge) {
        riskBadge.innerText = data.risk;
        riskBadge.style.background = data.color;
    }
    // Update action and confidence
    const actionMsg = document.getElementById('action-msg');
    if (actionMsg) actionMsg.innerText = data.action;
    document.getElementById('conf-val').innerText = conf;
    
    const fill = document.getElementById('meter-fill');
    if (fill) {
        fill.style.width = conf + "%";
        fill.style.background = data.color;
    }
}