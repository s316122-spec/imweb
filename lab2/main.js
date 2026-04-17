const video = document.getElementById('webcam');
const snapBtn = document.getElementById('snap-btn');
const downloadBtn = document.getElementById('download-btn');
const countdownEl = document.getElementById('countdown');
const flashEl = document.getElementById('flash');
const canvas = document.getElementById('photo-canvas');
const resultPreview = document.getElementById('result-preview');
const filterBtns = document.querySelectorAll('.filter-btn');

let currentFilter = 'none';
let capturedPhotos = [];
const TOTAL_PHOTOS = 3;
const COUNTDOWN_SECONDS = 3;

// Initialize Webcam
async function initWebcam() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                width: { ideal: 1280 },
                height: { ideal: 960 },
                facingMode: 'user'
            }, 
            audio: false 
        });
        video.srcObject = stream;
    } catch (err) {
        console.error("Error accessing webcam: ", err);
        alert("無法讀取攝影機，請確保已授權權限喔！🐰");
    }
}

// Filter Selection
filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
        video.style.filter = currentFilter === 'none' ? '' : currentFilter;
    });
});

// Capture Sequence
snapBtn.addEventListener('click', async () => {
    snapBtn.disabled = true;
    capturedPhotos = [];
    resultPreview.innerHTML = '<div class="placeholder-msg">正在準備拍攝...✨</div>';
    
    for (let i = 0; i < TOTAL_PHOTOS; i++) {
        await runCountdown(COUNTDOWN_SECONDS);
        takePhoto();
        await new Promise(resolve => setTimeout(resolve, 500)); // Short pause between shots
    }
    
    generateStrip();
    snapBtn.disabled = false;
    downloadBtn.disabled = false;
});

// Countdown Logic
function runCountdown(seconds) {
    return new Promise(resolve => {
        let count = seconds;
        countdownEl.textContent = count;
        
        const timer = setInterval(() => {
            count--;
            if (count > 0) {
                countdownEl.textContent = count;
            } else {
                clearInterval(timer);
                countdownEl.textContent = '';
                resolve();
            }
        }, 1000);
    });
}

// Take Single Photo
function takePhoto() {
    // Flash effect
    flashEl.classList.remove('flash-active');
    void flashEl.offsetWidth; // Trigger reflow
    flashEl.classList.add('flash-active');
    
    // Draw to hidden canvas
    const context = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Mirror the image for the capture too
    context.translate(canvas.width, 0);
    context.scale(-1, 1);
    
    // Apply current filter to canvas
    if (currentFilter !== 'none') {
        context.filter = currentFilter;
    }
    
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Save photo data
    capturedPhotos.push(canvas.toDataURL('image/jpeg'));
}

// Generate 3-Cut Strip
function generateStrip() {
    const stripCanvas = document.createElement('canvas');
    const ctx = stripCanvas.getContext('2d');
    
    const imgWidth = 600;
    const imgHeight = 450;
    const padding = 20;
    const headerHeight = 60;
    const footerHeight = 100;
    
    stripCanvas.width = imgWidth + (padding * 2);
    stripCanvas.height = (imgHeight * TOTAL_PHOTOS) + (padding * (TOTAL_PHOTOS + 1)) + headerHeight + footerHeight;
    
    // Background (Premium Pink/White)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, stripCanvas.width, stripCanvas.height);
    
    // Border/Decorative Frame
    ctx.strokeStyle = '#ffc8dd';
    ctx.lineWidth = 10;
    ctx.strokeRect(5, 5, stripCanvas.width - 10, stripCanvas.height - 10);

    // Draw Title/Header
    ctx.fillStyle = '#ffafcc';
    ctx.font = 'bold 30px "Microsoft JhengHei", Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🌸 魚皮的世界 🌸', stripCanvas.width / 2, padding + 35);

    // Draw each photo
    let loadedCount = 0;
    capturedPhotos.forEach((dataUrl, index) => {
        const img = new Image();
        img.onload = () => {
            const y = headerHeight + padding + (index * (imgHeight + padding));
            ctx.drawImage(img, padding, y, imgWidth, imgHeight);
            
            loadedCount++;
            if (loadedCount === TOTAL_PHOTOS) {
                // Draw Footer Decoration
                ctx.fillStyle = '#ffafcc';
                ctx.font = '24px "Microsoft JhengHei", Arial';
                ctx.fillText('✨ Magic Photo Booth ✨', stripCanvas.width / 2, stripCanvas.height - 50);
                ctx.font = '16px "Microsoft JhengHei", Arial';
                const date = new Date().toLocaleDateString();
                ctx.fillText(date, stripCanvas.width / 2, stripCanvas.height - 25);

                // Show Preview
                const stripDataUrl = stripCanvas.toDataURL('image/png');
                resultPreview.innerHTML = `<img src="${stripDataUrl}" class="strip-img" alt="Result Strip">`;
                
                // Set up Download
                downloadBtn.onclick = () => {
                    const link = document.createElement('a');
                    link.download = `magic-photo-${Date.now()}.png`;
                    link.href = stripDataUrl;
                    link.click();
                };
            }
        };
        img.src = dataUrl;
    });
}

// Start
initWebcam();
