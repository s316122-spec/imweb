/* lab4/board.js (Hand Tracking Logic) */

// UI 元素
const videoElement = document.getElementById('input_video');
const canvasElement = document.getElementById('output_canvas');
const canvasCtx = canvasElement.getContext('2d');
const statusText = document.getElementById('status-text');

const virtualCursor = document.getElementById('virtual-cursor');
const progressCircle = document.querySelector('.progress-ring__circle');
const targetCards = document.querySelectorAll('.target-card');

const modal = document.getElementById('content-modal');
const modalTitle = document.getElementById('modal-title');
const modalBody = document.getElementById('modal-body');

// 圓周長設定 (對應 CSS 中的 163.36)
const circumference = 163.36;
progressCircle.style.strokeDasharray = `${circumference} ${circumference}`;
progressCircle.style.strokeDashoffset = circumference;

// 二林工商內容資料庫
const boardData = {
    'cheer-1': {
        title: '🎉 感謝您的加油！',
        content: '<p style="text-align: center; font-size: 1.5rem; color: #e63946;">收到您的熱情鼓勵！<br>二林工商全體師生感謝您的支持！</p><div style="font-size: 5rem; text-align: center; margin-top: 20px;">🎊</div>'
    }
};

// 懸停觸發相關變數
let hoverTimer = null;
let currentHoveredCard = null;
let hoverProgress = 0;
let isModalOpen = false;

const HOVER_TIME_REQUIRED = 2000; // 懸停 2 秒觸發 (毫秒)
const FPS = 30; // 更新進度條的頻率

// 設定虛擬游標的進度條
function setProgress(percent) {
    const offset = circumference - (percent / 100) * circumference;
    progressCircle.style.strokeDashoffset = offset;
}

// 檢查游標是否與卡片重疊 (Collision Detection)
function checkCollision(cursorX, cursorY) {
    if (isModalOpen) {
        // 如果 Modal 開啟中，我們需要偵測游標是否在 Modal 的「外面」來關閉它
        // Modal 本身佔滿全螢幕，但 Modal-content 只有中間一塊
        const modalContent = document.querySelector('.modal-content').getBoundingClientRect();
        
        // 為了避免一打開就馬上關閉，我們給予一點緩衝空間 (例如超出 modal-content 一點點才算)
        const isOutside = (
            cursorX < modalContent.left - 50 ||
            cursorX > modalContent.right + 50 ||
            cursorY < modalContent.top - 50 ||
            cursorY > modalContent.bottom + 50
        );

        if (isOutside) {
            handleModalCloseHover();
        } else {
            resetHover(); // 在 modal 內不累計關閉進度
        }
        return; // Modal 開啟時不偵測底下的卡片
    }

    // Modal 未開啟，偵測卡片
    let foundHover = false;

    for (let card of targetCards) {
        const rect = card.getBoundingClientRect();
        // 簡單的 AABB 碰撞偵測
        if (cursorX >= rect.left && cursorX <= rect.right &&
            cursorY >= rect.top && cursorY <= rect.bottom) {
            
            foundHover = true;
            if (currentHoveredCard !== card) {
                // 新的懸停對象
                resetHover();
                currentHoveredCard = card;
                card.classList.add('hovering');
                startHoverTimer(() => openModal(card.getAttribute('data-id')));
            }
            break; // 找到一個重疊就跳出
        }
    }

    if (!foundHover && !isModalOpen) {
        resetHover();
    }
}

// 處理關閉 Modal 的懸停 (將手移到旁邊)
let closeHoverTimer = null;
function handleModalCloseHover() {
    if (!closeHoverTimer) {
        hoverProgress = 0;
        closeHoverTimer = setInterval(() => {
            hoverProgress += (1000 / FPS) / HOVER_TIME_REQUIRED * 100;
            setProgress(Math.min(hoverProgress, 100));
            
            if (hoverProgress >= 100) {
                closeModal();
            }
        }, 1000 / FPS);
    }
}

// 開始計算懸停時間
function startHoverTimer(callback) {
    if (hoverTimer) return;
    
    hoverProgress = 0;
    hoverTimer = setInterval(() => {
        hoverProgress += (1000 / FPS) / HOVER_TIME_REQUIRED * 100;
        setProgress(Math.min(hoverProgress, 100));
        
        if (hoverProgress >= 100) {
            resetHover(); // 觸發後重置進度
            callback();
        }
    }, 1000 / FPS);
}

// 重置所有懸停狀態
function resetHover() {
    if (hoverTimer) clearInterval(hoverTimer);
    if (closeHoverTimer) clearInterval(closeHoverTimer);
    hoverTimer = null;
    closeHoverTimer = null;
    hoverProgress = 0;
    setProgress(0);
    
    if (currentHoveredCard) {
        currentHoveredCard.classList.remove('hovering');
        currentHoveredCard = null;
    }
}

// 開啟內容視窗
function openModal(id) {
    const data = boardData[id];
    if (data) {
        modalTitle.innerHTML = data.title;
        modalBody.innerHTML = data.content;
        modal.classList.remove('hidden');
        isModalOpen = true;
        // 等待一下再允許關閉，避免手還在原處就立刻觸發關閉
        setTimeout(() => {
            resetHover();
        }, 500);
    }
}

// 關閉內容視窗
function closeModal() {
    modal.classList.add('hidden');
    isModalOpen = false;
    resetHover();
}

// --- MediaPipe Hands 邏輯 ---

function onResults(results) {
    // 設定小畫面 Canvas 大小
    canvasElement.width = videoElement.videoWidth;
    canvasElement.height = videoElement.videoHeight;
    
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        statusText.innerText = "手部偵測中 ✋";
        virtualCursor.style.display = 'block';

        const landmarks = results.multiHandLandmarks[0]; // 只取第一隻手
        
        // 在小畫面上畫出骨架
        drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {color: '#00FF00', lineWidth: 2});
        drawLandmarks(canvasCtx, landmarks, {color: '#FF0000', lineWidth: 1, radius: 2});

        // 取得食指指尖 (Index Finger Tip - 節點 8)
        const indexFingerTip = landmarks[8];
        
        // 將食指的正規化座標 (0~1) 轉換為螢幕實際座標
        // 注意：Webcam 通常是鏡像的，所以在 X 軸上做了 1 - indexFingerTip.x 的反轉 (或依據 CSS scaleX(-1) 而定)
        // 因為我在 CSS video 已經做 scaleX(-1)，這裡取原始 x 即可，但為了操作直覺，我們讓他像滑鼠一樣
        
        // 假設螢幕就是 Window 的寬高
        const screenW = window.innerWidth;
        const screenH = window.innerHeight;
        
        // 為了操作像照鏡子，X座標翻轉
        const cursorX = (1 - indexFingerTip.x) * screenW; 
        const cursorY = indexFingerTip.y * screenH;

        // 移動虛擬游標
        virtualCursor.style.left = `${cursorX}px`;
        virtualCursor.style.top = `${cursorY}px`;

        // 產生手勢拖尾粒子
        if (Math.random() < 0.25) {
            createHandSparkle(cursorX, cursorY);
        }

        // 進行碰撞偵測與懸停邏輯
        checkCollision(cursorX, cursorY);
    } else {
        statusText.innerText = "請將手舉至鏡頭前";
        virtualCursor.style.display = 'none';
        resetHover(); // 沒看到手就重置進度
    }
    
    canvasCtx.restore();
}

// 初始化 MediaPipe Hands
const hands = new Hands({locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
}});

hands.setOptions({
    maxNumHands: 1, // 只偵測一隻手，效能較好
    modelComplexity: 1,
    minDetectionConfidence: 0.7,
    minTrackingConfidence: 0.7
});

hands.onResults(onResults);

// 啟動攝影機
const camera = new Camera(videoElement, {
    onFrame: async () => {
        await hands.send({image: videoElement});
    },
    width: 640,
    height: 480
});

// 開始執行
camera.start().then(() => {
    statusText.innerText = "尋找手部中...";
}).catch((err) => {
    statusText.innerText = "攝影機啟動失敗，請確認權限！";
    console.error(err);
});

// 產生手勢拖尾粒子
function createHandSparkle(x, y) {
    const sparkle = document.createElement('div');
    sparkle.className = 'sparkle';
    sparkle.innerText = ['✨', '⭐', '🌟', '💫', '🔮'][Math.floor(Math.random() * 5)];
    sparkle.style.left = x + 'px';
    sparkle.style.top = y + 'px';
    document.body.appendChild(sparkle);

    const moveX = (Math.random() - 0.5) * 80;
    const moveY = (Math.random() - 0.5) * 80;

    sparkle.style.setProperty('--move-x', `${moveX}px`);
    sparkle.style.setProperty('--move-y', `${moveY}px`);

    setTimeout(() => {
        sparkle.remove();
    }, 1000);
}
