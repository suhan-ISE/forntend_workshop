// AIRDRAW FUTURE - Neural Hand-Tracking Drawing Engine
// Uses MediaPipe Tasks Vision for robust browser-side AI processing.

import { HandLandmarker, FilesetResolver } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3";

/* --- DOM Elements --- */
const welcomeScreen = document.getElementById('welcome-screen');
const appInterface = document.getElementById('app-interface');
const cameraBox = document.getElementById('camera-permission-box');
const loadingBox = document.getElementById('loading-box');
const errorBox = document.getElementById('error-box');

const video = document.getElementById('webcam');
const previewCanvas = document.getElementById('preview-canvas');
const previewCtx = previewCanvas.getContext('2d');
const drawingCanvas = document.getElementById('drawing-canvas');
const drawingCtx = drawingCanvas.getContext('2d', { willReadFrequently: true });
const cursorCanvas = document.getElementById('cursor-canvas');
const cursorCtx = cursorCanvas.getContext('2d');

/* --- State Variables --- */
let handLandmarker = null;
let webcamRunning = false;
let lastVideoTime = -1;
let animationFrameId = null;

let isPinching = false;
let currentPath = [];
const history = []; // Array of drawing paths
let historyIndex = -1;

const STATE = {
    tool: 'pen', // 'pen' or 'eraser'
    color: '#00ffff',
    size: 8,
    smoothing: 0.5,
    threshold: 0.06 // Pinch detection threshold
};

let canvasWidth, canvasHeight;

/* --- Initialization & MediaPipe Setup --- */

// Bind UI Events
document.getElementById('btn-activate-camera').addEventListener('click', initializeApp);
document.getElementById('btn-retry').addEventListener('click', () => {
    errorBox.classList.add('hidden');
    cameraBox.classList.remove('hidden');
});

async function initializeApp() {
    cameraBox.classList.add('hidden');
    loadingBox.classList.remove('hidden');

    try {
        // 1. Initialize MediaPipe HandLandmarker
        const vision = await FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
        );
        handLandmarker = await HandLandmarker.createFromOptions(vision, {
            baseOptions: {
                modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
                delegate: "GPU"
            },
            runningMode: "VIDEO",
            numHands: 1,
            minHandDetectionConfidence: 0.6,
            minTrackingConfidence: 0.6
        });

        // 2. Request Camera Access
        const constraints = { video: { width: 640, height: 480, facingMode: "user" } };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = stream;
        
        video.addEventListener('loadeddata', () => {
            webcamRunning = true;
            resizeCanvases();
            
            // Hide welcome, show app
            welcomeScreen.classList.remove('active');
            setTimeout(() => {
                welcomeScreen.classList.add('hidden');
                appInterface.classList.remove('hidden');
                document.getElementById('status-cam-dot').classList.add('active');
            }, 500);

            // Start Tracking Loop
            predictWebcam();
        });

    } catch (err) {
        console.error("Initialization Error:", err);
        loadingBox.classList.add('hidden');
        errorBox.classList.remove('hidden');
        document.getElementById('error-message').innerText = `ERROR: ${err.message.toUpperCase()}`;
    }
}

/* --- Tracking & Render Loop --- */

async function predictWebcam() {
    if (!webcamRunning) return;

    // Process frame if new
    if (video.currentTime !== lastVideoTime) {
        lastVideoTime = video.currentTime;
        
        // Sync preview canvas size
        if (previewCanvas.width !== video.videoWidth) {
            previewCanvas.width = video.videoWidth;
            previewCanvas.height = video.videoHeight;
        }

        // Draw camera feed to PIP Preview
        previewCtx.save();
        previewCtx.drawImage(video, 0, 0, previewCanvas.width, previewCanvas.height);
        
        // Detect Hands
        let startTimeMs = performance.now();
        const results = handLandmarker.detectForVideo(video, startTimeMs);

        // Clear cursor layer
        cursorCtx.clearRect(0, 0, canvasWidth, canvasHeight);

        const statusHandDot = document.getElementById('status-hand-dot');
        const gestureMetric = document.getElementById('metric-gesture');

        if (results.landmarks && results.landmarks.length > 0) {
            statusHandDot.classList.add('active');
            
            const landmarks = results.landmarks[0];
            
            // Draw skeleton on PIP preview
            drawPreviewLandmarks(landmarks);

            // Calculate Gesture (Pinch)
            const thumbTip = landmarks[4];
            const indexTip = landmarks[8];
            
            // Calculate 3D distance between thumb and index
            const distance = Math.hypot(
                thumbTip.x - indexTip.x, 
                thumbTip.y - indexTip.y, 
                thumbTip.z - indexTip.z
            );

            // Map index finger to drawing canvas coordinates
            // MediaPipe gives normalized coords (0 to 1). Webcam is horizontally mirrored visually.
            // We flip X so moving hand right moves pointer right.
            const pointerX = (1 - indexTip.x) * canvasWidth;
            const pointerY = indexTip.y * canvasHeight;

            const wasPinching = isPinching;
            isPinching = distance < STATE.threshold;

            if (isPinching) {
                gestureMetric.innerText = "DRAWING";
                gestureMetric.style.color = "var(--success)";
                handleDrawing(pointerX, pointerY, wasPinching);
                drawCursor(pointerX, pointerY, true);
            } else {
                gestureMetric.innerText = "HOVER (OPEN)";
                gestureMetric.style.color = "var(--neon-cyan)";
                endDrawingStroke();
                drawCursor(pointerX, pointerY, false);
            }

        } else {
            // No hands detected
            statusHandDot.classList.remove('active');
            gestureMetric.innerText = "SEARCHING...";
            gestureMetric.style.color = "var(--text-dim)";
            endDrawingStroke();
        }
        
        previewCtx.restore();
    }

    // Loop
    if (webcamRunning) {
        animationFrameId = window.requestAnimationFrame(predictWebcam);
    }
}

/* --- Drawing Engine --- */

function handleDrawing(x, y, wasPinching) {
    if (!wasPinching) {
        // Start new stroke
        currentPath = [{ x, y }];
        
        // Setup Context
        drawingCtx.beginPath();
        drawingCtx.moveTo(x, y);
        applyBrushSettings(drawingCtx, STATE.tool, STATE.color, STATE.size);
    } else {
        // Continue stroke
        currentPath.push({ x, y });
        drawingCtx.lineTo(x, y);
        drawingCtx.stroke();
    }
}

function endDrawingStroke() {
    if (currentPath.length > 0) {
        drawingCtx.closePath();
        // Save to history
        saveToHistory({
            tool: STATE.tool,
            color: STATE.color,
            size: STATE.size,
            points: [...currentPath]
        });
        currentPath = [];
        updateMetrics();
    }
}

function applyBrushSettings(ctx, tool, color, size) {
    ctx.lineWidth = size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    if (tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.strokeStyle = 'rgba(0,0,0,1)';
        ctx.shadowBlur = 0;
    } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = color;
        // Futuristic Neon Glow effect
        ctx.shadowColor = color;
        ctx.shadowBlur = size * 1.5;
    }
}

function drawCursor(x, y, active) {
    cursorCtx.beginPath();
    cursorCtx.arc(x, y, STATE.size / 2 + (active ? 4 : 2), 0, 2 * Math.PI);
    cursorCtx.fillStyle = active ? STATE.color : 'transparent';
    cursorCtx.strokeStyle = active ? '#fff' : STATE.color;
    cursorCtx.lineWidth = 2;
    cursorCtx.shadowColor = STATE.color;
    cursorCtx.shadowBlur = 10;
    cursorCtx.fill();
    cursorCtx.stroke();
}

function drawPreviewLandmarks(landmarks) {
    previewCtx.fillStyle = '#00ffff';
    previewCtx.strokeStyle = '#ff00ff';
    previewCtx.lineWidth = 2;

    // Draw connections (simple map)
    const connections = [
        [0,1,2,3,4], // Thumb
        [0,5,6,7,8], // Index
        [9,10,11,12], // Middle (simplified, connecting to wrist usually via 0->9)
        [13,14,15,16], // Ring
        [17,18,19,20], // Pinky
        [5,9,13,17,0]  // Palm base
    ];

    previewCtx.beginPath();
    connections.forEach(segment => {
        for(let i=0; i<segment.length-1; i++) {
            const p1 = landmarks[segment[i]];
            const p2 = landmarks[segment[i+1]];
            previewCtx.moveTo(p1.x * previewCanvas.width, p1.y * previewCanvas.height);
            previewCtx.lineTo(p2.x * previewCanvas.width, p2.y * previewCanvas.height);
        }
    });
    previewCtx.stroke();

    // Draw points
    landmarks.forEach(lm => {
        previewCtx.beginPath();
        previewCtx.arc(lm.x * previewCanvas.width, lm.y * previewCanvas.height, 3, 0, 2*Math.PI);
        previewCtx.fill();
    });
}

/* --- History (Undo/Redo) --- */

function saveToHistory(strokeData) {
    // If we are currently back in history, remove future redo states
    if (historyIndex < history.length - 1) {
        history.splice(historyIndex + 1);
    }
    history.push(strokeData);
    // Limit history size to prevent memory leaks
    if (history.length > 50) history.shift();
    else historyIndex++;
    updateUIStates();
}

function redrawHistory() {
    drawingCtx.clearRect(0, 0, canvasWidth, canvasHeight);
    
    for (let i = 0; i <= historyIndex; i++) {
        const stroke = history[i];
        if (stroke.points.length === 0) continue;
        
        drawingCtx.beginPath();
        applyBrushSettings(drawingCtx, stroke.tool, stroke.color, stroke.size);
        drawingCtx.moveTo(stroke.points[0].x, stroke.points[0].y);
        
        for (let j = 1; j < stroke.points.length; j++) {
            drawingCtx.lineTo(stroke.points[j].x, stroke.points[j].y);
        }
        drawingCtx.stroke();
        drawingCtx.closePath();
    }
}

document.getElementById('btn-undo').addEventListener('click', () => {
    if (historyIndex >= 0) {
        historyIndex--;
        redrawHistory();
        updateUIStates();
    }
});

document.getElementById('btn-redo').addEventListener('click', () => {
    if (historyIndex < history.length - 1) {
        historyIndex++;
        redrawHistory();
        updateUIStates();
    }
});

function updateUIStates() {
    document.getElementById('btn-undo').disabled = historyIndex < 0;
    document.getElementById('btn-redo').disabled = historyIndex >= history.length - 1;
    document.getElementById('metric-strokes').innerText = historyIndex + 1;
}

/* --- UI Controls & Export --- */

// Tools
document.querySelectorAll('.tool-btn[data-tool]').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.tool-btn[data-tool]').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        STATE.tool = e.currentTarget.dataset.tool;
        document.getElementById('metric-tool').innerText = STATE.tool.toUpperCase();
    });
});

// Color
document.getElementById('color-picker').addEventListener('input', (e) => {
    STATE.color = e.target.value;
    STATE.tool = 'pen'; // auto-switch to pen
    document.querySelector('.tool-btn[data-tool="pen"]').click();
});
document.querySelectorAll('.c-dot').forEach(dot => {
    dot.addEventListener('click', (e) => {
        STATE.color = e.currentTarget.dataset.color;
        document.getElementById('color-picker').value = STATE.color;
        document.querySelector('.tool-btn[data-tool="pen"]').click();
    });
});

// Size
document.getElementById('size-slider').addEventListener('input', (e) => {
    STATE.size = parseInt(e.target.value);
});

// Clear Canvas
document.getElementById('btn-clear').addEventListener('click', () => {
    if(confirm("SYSTEM PROMPT: Clear drawing canvas permanently?")) {
        history.length = 0;
        historyIndex = -1;
        redrawHistory();
        updateUIStates();
    }
});

// Fullscreen
document.getElementById('btn-fullscreen').addEventListener('click', () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.error(`Error attempting to enable fullscreen: ${err.message}`);
        });
    } else {
        document.exitFullscreen();
    }
});

// Export PNG
document.getElementById('btn-export').addEventListener('click', () => {
    try {
        // Create composite canvas to merge dark background and drawing
        const comp = document.createElement('canvas');
        comp.width = canvasWidth; comp.height = canvasHeight;
        const ctx = comp.getContext('2d');
        
        // Fill background
        ctx.fillStyle = '#07090f'; 
        ctx.fillRect(0, 0, comp.width, comp.height);
        
        // Draw grid for futuristic look
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        for(let i=0; i<comp.width; i+=30) { ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,comp.height); ctx.stroke(); }
        for(let i=0; i<comp.height; i+=30) { ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(comp.width,i); ctx.stroke(); }
        
        // Overlay drawing
        ctx.drawImage(drawingCanvas, 0, 0);

        const dataUrl = comp.toDataURL('image/png');
        const link = document.createElement('a');
        const timestamp = new Date().getTime();
        link.download = `AIRDRAW_SYS_${timestamp}.png`;
        link.href = dataUrl;
        link.click();
        
        // Notification flash
        document.body.style.boxShadow = "inset 0 0 50px var(--success)";
        setTimeout(() => document.body.style.boxShadow = "none", 300);
    } catch (e) {
        alert("EXPORT FAILED. Canvas may contain cross-origin data.");
    }
});

// Toggle Preview PIP
document.getElementById('btn-toggle-preview').addEventListener('click', () => {
    const container = document.getElementById('preview-container');
    container.classList.toggle('collapsed');
});

// Stop Camera / Shutdown
document.getElementById('btn-stop-camera').addEventListener('click', () => {
    if(confirm("SHUTDOWN SENSORS? This will halt tracking.")) {
        webcamRunning = false;
        if(video.srcObject) {
            video.srcObject.getTracks().forEach(track => track.stop());
        }
        if(animationFrameId) cancelAnimationFrame(animationFrameId);
        
        appInterface.classList.add('hidden');
        welcomeScreen.classList.remove('hidden');
        welcomeScreen.classList.add('active');
        cameraBox.classList.remove('hidden');
        loadingBox.classList.add('hidden');
    }
});

/* --- Utilities & Resizing --- */

function resizeCanvases() {
    canvasWidth = window.innerWidth;
    canvasHeight = window.innerHeight;
    
    [drawingCanvas, cursorCanvas, document.getElementById('bg-canvas')].forEach(c => {
        c.width = canvasWidth;
        c.height = canvasHeight;
    });

    redrawHistory(); // Ensure drawing is retained and scaled correctly
}

window.addEventListener('resize', resizeCanvases);

function updateMetrics() {
    document.getElementById('metric-strokes').innerText = historyIndex + 1;
}

/* --- Keyboard Shortcuts --- */
window.addEventListener('keydown', (e) => {
    // Undo: Ctrl+Z or Cmd+Z
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        document.getElementById('btn-undo').click();
    }
    // Redo: Ctrl+Y or Cmd+Shift+Z
    if (((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') || 
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z')) {
        e.preventDefault();
        document.getElementById('btn-redo').click();
    }
    // Tools
    if (e.key.toLowerCase() === 'b') document.querySelector('.tool-btn[data-tool="pen"]').click();
    if (e.key.toLowerCase() === 'e') document.querySelector('.tool-btn[data-tool="eraser"]').click();
});