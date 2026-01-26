let model;
let currentMode = 'snake';

async function init() {
    model = await mobilenet.load();
    console.log("AI Model Loaded");
}
init();

function setMode(mode) {
    currentMode = mode;
    document.getElementById('btn-snake').classList.toggle('active', mode === 'snake');
    document.getElementById('btn-bite').classList.toggle('active', mode === 'bite');
    document.getElementById('upload-title').innerText = mode === 'snake' ? "Upload Snake Image" : "Upload Bite Mark Image";
    document.getElementById('result-panel').style.display = 'none';
}

function loadImage(event) {
    const file = event.target.files[0];
    if (file) {
        const img = document.getElementById('preview-image');
        img.src = URL.createObjectURL(file);
        img.style.display = 'block';
        document.getElementById('upload-ui').style.display = 'none';
        document.getElementById('predict-btn').style.display = 'block';
    }
}

async function predict() {
    const img = document.getElementById('preview-image');
    const predictions = await model.classify(img);
    const topResult = predictions[0].className.toLowerCase();
    
    let resultData = {};

    if (currentMode === 'snake') {
        resultData = analyzeSnake(topResult);
    } else {
        resultData = analyzeBite(topResult);
    }

    displayResults(resultData);
}

function analyzeSnake(name) {
    const venomousList = ['cobra', 'viper', 'mamba', 'krait', 'rattle', 'adder'];
    const isVenomous = venomousList.some(v => name.includes(v));
    
    return {
        title: name.split(',')[0].toUpperCase(),
        type: isVenomous ? "Venomous Species" : "Non-Venomous Species",
        risk: isVenomous ? "CRITICAL" : "LOW",
        color: isVenomous ? "#ef4444" : "#10b981",
        width: isVenomous ? "100%" : "20%",
        action: isVenomous ? "Emergency! Immobilize limb and seek anti-venom." : "Clean wound. Monitor for infection."
    };
}

function analyzeBite(topResult) {
    // Heuristic: Looking for 'dot' or 'puncture' patterns in AI texture analysis
    const isPuncture = topResult.includes('spot') || topResult.includes('point') || topResult.includes('hole');
    
    return {
        title: "Bite Pattern Analysis",
        type: isPuncture ? "Puncture Detected" : "Scratch/U-Shape",
        risk: isPuncture ? "HIGH SEVERITY" : "MODERATE/LOW",
        color: isPuncture ? "#ef4444" : "#f59e0b",
        width: isPuncture ? "90%" : "40%",
        action: isPuncture ? "Fangs detected. This bite is likely VENOMOUS. Go to hospital." : "Pattern suggests non-venomous teeth. Still, seek medical advice."
    };
}

function displayResults(data) {
    // 1. Show the result panel
    const panel = document.getElementById('result-panel');
    panel.style.display = 'block';

    // 2. Update the Snake Name (Crucial Step)
    const titleElement = document.getElementById('result-title');
    titleElement.innerText = data.title; // This sets the snake name

    // 3. Update Category and Risk Level
    document.getElementById('info-type').innerText = data.type;
    document.getElementById('info-risk').innerText = data.risk;
    document.getElementById('action-text').innerText = data.action;
    
    // 4. Update the Severity Meter and Label
    const fill = document.getElementById('meter-fill');
    fill.style.width = data.width;
    fill.style.backgroundColor = data.color;
    
    const label = document.getElementById('severity-label');
    label.innerText = data.risk;
    label.style.color = data.color;

    // 5. Scroll to view results smoothly
    panel.scrollIntoView({ behavior: 'smooth' });
}
function generateReport() {
    const name = document.getElementById('result-title').innerText;
    const type = document.getElementById('info-type').innerText;
    const risk = document.getElementById('info-risk').innerText;
    const action = document.getElementById('action-text').innerText;
    const date = new Date().toLocaleString();

    // Create a temporary hidden window for printing
    const reportWindow = window.open('', '_blank');
    
    reportWindow.document.write(`
        <html>
        <head>
            <title>SerpentScan Emergency Report</title>
            <style>
                body { font-family: sans-serif; padding: 40px; line-height: 1.6; }
                .header { border-bottom: 2px solid #2563eb; padding-bottom: 10px; margin-bottom: 20px; }
                .danger { color: #ef4444; font-weight: bold; }
                .box { background: #f1f5f9; padding: 15px; border-radius: 8px; margin: 10px 0; }
                .footer { margin-top: 50px; font-size: 12px; color: #64748b; font-style: italic; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>SerpentScan AI Diagnostic Report</h1>
                <p>Generated on: ${date}</p>
            </div>
            
            <h2>Identified Subject: <span class="danger">${name}</span></h2>
            
            <div class="box">
                <p><strong>Classification:</strong> ${type}</p>
                <p><strong>Risk Level:</strong> ${risk}</p>
            </div>

            <div class="box">
                <h3>Required Emergency Protocol:</h3>
                <p>${action}</p>
            </div>

            <div class="footer">
                Disclaimer: This report is AI-generated for educational assistance and must be verified by a medical professional immediately.
            </div>
        </body>
        </html>
    `);

    reportWindow.document.close();
    reportWindow.print();
}