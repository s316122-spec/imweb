// lab3/game.js
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const gameContainer = document.getElementById('game-container');

// UI Elements
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const scoreElement = document.getElementById('score');
const livesElement = document.getElementById('lives');
const finalScoreElement = document.getElementById('final-score');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');

// 遊戲設定
let canvasWidth = 600;
let canvasHeight = 800;
let gameLoopId;
let isGameOver = false;
let isPlaying = false;

// 遊戲狀態
let score = 0;
let lives = 3;
let frameCount = 0;

// 實體陣列
let player;
let bullets = [];
let enemies = [];
let particles = [];

// 星星背景
let stars = [];

// 響應式 Canvas
function resizeCanvas() {
    const rect = gameContainer.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    canvasWidth = canvas.width;
    canvasHeight = canvas.height;
    
    // 如果玩家存在，確保玩家在畫面內
    if (player) {
        player.y = canvasHeight - 60;
        if (player.x > canvasWidth) player.x = canvasWidth / 2;
    }
}
window.addEventListener('resize', resizeCanvas);

// --- 類別定義 ---

class Player {
    constructor() {
        this.size = 40;
        this.x = canvasWidth / 2;
        this.y = canvasHeight - 60;
        this.speed = 6;
        this.color = '#fca311';
        this.keys = { ArrowLeft: false, ArrowRight: false, a: false, d: false };
        this.cooldown = 0;
        this.fireRate = 15; // 每 15 幀發射一次
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // 畫貓貓飛船 (簡單形狀)
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(0, -this.size/2); // 車頭
        ctx.lineTo(this.size/2, this.size/2); // 右下
        ctx.lineTo(-this.size/2, this.size/2); // 左下
        ctx.closePath();
        ctx.fill();

        // 貓耳
        ctx.fillStyle = '#ffb703';
        ctx.beginPath();
        ctx.moveTo(-15, 0);
        ctx.lineTo(-25, -20);
        ctx.lineTo(-5, -5);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(15, 0);
        ctx.lineTo(25, -20);
        ctx.lineTo(5, -5);
        ctx.fill();

        // 引擎火焰
        if (Math.random() > 0.3) {
            ctx.fillStyle = '#ef233c';
            ctx.beginPath();
            ctx.moveTo(-10, this.size/2);
            ctx.lineTo(0, this.size/2 + 15 + Math.random() * 10);
            ctx.lineTo(10, this.size/2);
            ctx.fill();
        }
        
        ctx.restore();
    }

    update() {
        // 移動
        if (this.keys.ArrowLeft || this.keys.a) this.x -= this.speed;
        if (this.keys.ArrowRight || this.keys.d) this.x += this.speed;

        // 邊界限制
        this.x = Math.max(this.size/2, Math.min(canvasWidth - this.size/2, this.x));

        // 射擊冷卻
        if (this.cooldown > 0) this.cooldown--;
    }

    shoot() {
        if (this.cooldown === 0) {
            bullets.push(new Bullet(this.x, this.y - this.size/2));
            this.cooldown = this.fireRate;
            createParticles(this.x, this.y - this.size/2, '#fca311', 3, 2);
        }
    }
}

class Bullet {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 6;
        this.speed = 10;
        this.color = '#8ecae6'; // 毛線球顏色
        this.markedForDeletion = false;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // 發光效果
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.fill();
        ctx.restore();
    }

    update() {
        this.y -= this.speed;
        if (this.y < -this.radius) this.markedForDeletion = true;
    }
}

class Enemy {
    constructor() {
        this.radius = Math.random() * 10 + 15;
        this.x = Math.random() * (canvasWidth - this.radius * 2) + this.radius;
        this.y = -this.radius;
        // 難度隨分數提升，逐漸加快掉落速度
        const speedMultiplier = 1 + (score / 300); // 縮短分數級距，讓速度提升更有感
        this.speed = (Math.random() * 2.5 + 2) * speedMultiplier; // 提升基礎速度
        this.color = '#e63946';
        this.markedForDeletion = false;
        this.wobble = Math.random() * Math.PI * 2;
        this.wobbleSpeed = Math.random() * 0.05 + 0.02;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // 畫老鼠/外星生物
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // 耳朵
        ctx.fillStyle = '#8a0a1f';
        ctx.beginPath();
        ctx.arc(-this.radius*0.7, -this.radius*0.7, this.radius*0.4, 0, Math.PI*2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.radius*0.7, -this.radius*0.7, this.radius*0.4, 0, Math.PI*2);
        ctx.fill();

        // 眼睛
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(-this.radius*0.3, 0, this.radius*0.2, 0, Math.PI*2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.radius*0.3, 0, this.radius*0.2, 0, Math.PI*2);
        ctx.fill();
        
        ctx.restore();
    }

    update() {
        this.y += this.speed;
        // 稍微左右搖擺
        this.x += Math.sin(this.wobble) * 1;
        this.wobble += this.wobbleSpeed;

        // 邊界限制
        this.x = Math.max(this.radius, Math.min(canvasWidth - this.radius, this.x));

        if (this.y > canvasHeight + this.radius) {
            this.markedForDeletion = true;
            // 漏掉敵人扣命
            loseLife();
        }
    }
}

class Particle {
    constructor(x, y, color, speed) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.radius = Math.random() * 3 + 1;
        const angle = Math.random() * Math.PI * 2;
        const velocity = Math.random() * speed + 1;
        this.vx = Math.cos(angle) * velocity;
        this.vy = Math.sin(angle) * velocity;
        this.alpha = 1;
        this.decay = Math.random() * 0.02 + 0.02;
        this.markedForDeletion = false;
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.alpha -= this.decay;
        if (this.alpha <= 0) this.markedForDeletion = true;
    }
}

// --- 輔助函數 ---

function initStars() {
    stars = [];
    for (let i = 0; i < 100; i++) {
        stars.push({
            x: Math.random() * canvasWidth,
            y: Math.random() * canvasHeight,
            radius: Math.random() * 1.5,
            speed: Math.random() * 0.5 + 0.1
        });
    }
}

function drawBackground() {
    // 清除畫布
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // 畫星星
    ctx.fillStyle = '#fff';
    stars.forEach(star => {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // 星星移動
        star.y += star.speed;
        if (star.y > canvasHeight) {
            star.y = 0;
            star.x = Math.random() * canvasWidth;
        }
    });
}

function createParticles(x, y, color, amount, speed) {
    for (let i = 0; i < amount; i++) {
        particles.push(new Particle(x, y, color, speed));
    }
}

function loseLife() {
    lives--;
    updateUI();
    if (lives <= 0) {
        endGame();
    } else {
        // 受傷特效 (全畫面閃紅)
        gameContainer.style.boxShadow = "inset 0 0 50px rgba(230, 57, 70, 0.8)";
        setTimeout(() => {
            gameContainer.style.boxShadow = "0 10px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(252, 163, 17, 0.2)";
        }, 100);
    }
}

function updateUI() {
    scoreElement.innerText = score;
    livesElement.innerText = '❤️'.repeat(Math.max(0, lives));
}

// --- 遊戲核心迴圈 ---

function init() {
    resizeCanvas();
    initStars();
    player = new Player();
    bullets = [];
    enemies = [];
    particles = [];
    score = 0;
    lives = 3;
    frameCount = 0;
    isGameOver = false;
    updateUI();
    
    // 綁定鍵盤事件
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    // 綁定滑鼠/觸控事件
    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('pointermove', handlePointerMove);
}

function startGame() {
    init();
    isPlaying = true;
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    gameLoop();
}

function endGame() {
    isGameOver = true;
    isPlaying = false;
    
    // 移除事件監聽器避免記憶體洩漏與重複觸發
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);
    canvas.removeEventListener('pointerdown', handlePointerDown);
    canvas.removeEventListener('pointermove', handlePointerMove);
    
    finalScoreElement.innerText = `最終分數: ${score}`;
    gameOverScreen.classList.remove('hidden');
    
    // 爆發玩家碎片
    if (player) {
        createParticles(player.x, player.y, player.color, 30, 5);
        player = null; // 隱藏玩家
    }
}

function gameLoop() {
    if (isGameOver) return;
    
    drawBackground();
    
    // 玩家邏輯
    if (player) {
        player.update();
        player.draw();
        // 如果按下空白鍵，持續射擊
        if (player.keys[' ']) {
            player.shoot();
        }
    }

    // 子彈邏輯
    bullets.forEach((bullet, bIndex) => {
        bullet.update();
        bullet.draw();
        
        // 碰撞偵測 (子彈與敵人)
        enemies.forEach((enemy, eIndex) => {
            if (bullet.markedForDeletion || enemy.markedForDeletion) return;
            
            const dx = bullet.x - enemy.x;
            const dy = bullet.y - enemy.y;
            const distance = Math.hypot(dx, dy);
            
            if (distance < bullet.radius + enemy.radius) {
                // 擊中！
                bullet.markedForDeletion = true;
                enemy.markedForDeletion = true;
                score += 10;
                updateUI();
                createParticles(enemy.x, enemy.y, enemy.color, 15, 4);
                createParticles(enemy.x, enemy.y, '#fff', 5, 6);
            }
        });
    });

    // 敵人邏輯
    enemies.forEach((enemy, eIndex) => {
        enemy.update();
        enemy.draw();
        
        // 碰撞偵測 (敵人與玩家)
        if (player && !enemy.markedForDeletion) {
            const dx = player.x - enemy.x;
            const dy = player.y - enemy.y;
            const distance = Math.hypot(dx, dy);
            
            if (distance < enemy.radius + player.size/2.5) {
                // 玩家被撞到
                enemy.markedForDeletion = true;
                createParticles(enemy.x, enemy.y, enemy.color, 15, 4);
                loseLife();
            }
        }
    });

    // 粒子邏輯
    particles.forEach(particle => {
        particle.update();
        particle.draw();
    });

    // 陣列清理
    bullets = bullets.filter(b => !b.markedForDeletion);
    enemies = enemies.filter(e => !e.markedForDeletion);
    particles = particles.filter(p => !p.markedForDeletion);

    // 隨機生成敵人
    const spawnRate = Math.max(20, 60 - Math.floor(score / 50)); // 難度曲線
    if (frameCount % spawnRate === 0) {
        enemies.push(new Enemy());
    }

    frameCount++;
    gameLoopId = requestAnimationFrame(gameLoop);
}

// --- 控制輸入處理 ---

function handleKeyDown(e) {
    if (player && player.keys.hasOwnProperty(e.key)) {
        player.keys[e.key] = true;
    }
    if (e.key === ' ' && isPlaying) {
        player.keys[' '] = true; // 記錄空白鍵狀態
    }
}

function handleKeyUp(e) {
    if (player && player.keys.hasOwnProperty(e.key)) {
        player.keys[e.key] = false;
    }
    if (e.key === ' ' && isPlaying) {
        player.keys[' '] = false;
    }
}

function handlePointerDown(e) {
    if (!isPlaying) return;
    if (player) player.shoot();
}

function handlePointerMove(e) {
    if (!isPlaying || !player) return;
    // 滑鼠控制玩家位置
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    player.x = x;
}

// --- 按鈕事件綁定 ---

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

// 初始化畫面 (但不開始遊戲)
resizeCanvas();
initStars();
drawBackground();
