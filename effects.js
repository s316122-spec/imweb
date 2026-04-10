document.addEventListener('DOMContentLoaded', () => {
    // 1. 滑鼠軌跡特效 (閃亮星星落點)
    let isMouseMoving = false;
    let mouseTimeout;
    
    document.addEventListener('mousemove', (e) => {
        isMouseMoving = true;
        clearTimeout(mouseTimeout);
        mouseTimeout = setTimeout(() => isMouseMoving = false, 50);

        // 控制產生的頻率
        if (Math.random() < 0.15) { 
            createSparkle(e.clientX, e.clientY);
        }
    });

    function createSparkle(x, y) {
        const sparkle = document.createElement('div');
        sparkle.className = 'sparkle';
        sparkle.innerText = ['✨', '🌸', '💖', '⭐', '🎈'][Math.floor(Math.random() * 5)];
        sparkle.style.left = x + 'px';
        sparkle.style.top = y + 'px';
        document.body.appendChild(sparkle);

        const moveX = (Math.random() - 0.5) * 80;
        const moveY = (Math.random() - 0.5) * 80 + 30;

        sparkle.style.setProperty('--move-x', `${moveX}px`);
        sparkle.style.setProperty('--move-y', `${moveY}px`);

        setTimeout(() => {
            sparkle.remove();
        }, 1000);
    }

    // 2. 點擊爆發特效 (Click burst)
    document.addEventListener('click', (e) => {
        // 如果點擊的是 a 標籤，不影響它的默認行為，讓特效可以疊加顯示
        for(let i=0; i<8; i++) {
            createBurst(e.clientX, e.clientY);
        }
    });

    function createBurst(x, y) {
        const burst = document.createElement('div');
        burst.className = 'burst';
        burst.innerText = ['🌟', '🫧', '🎉', '🍀', '🍬'][Math.floor(Math.random() * 5)];
        burst.style.left = x + 'px';
        burst.style.top = y + 'px';
        document.body.appendChild(burst);

        const angle = Math.random() * Math.PI * 2;
        const radius = 60 + Math.random() * 60;
        const moveX = Math.cos(angle) * radius;
        const moveY = Math.sin(angle) * radius;

        burst.style.setProperty('--move-x', `${moveX}px`);
        burst.style.setProperty('--move-y', `${moveY}px`);

        setTimeout(() => {
            burst.remove();
        }, 800);
    }

    // 3. 背景透明浮動泡泡特效
    function createBubble() {
        const bubble = document.createElement('div');
        bubble.className = 'bg-bubble';
        bubble.style.left = Math.random() * 100 + 'vw';
        const size = Math.random() * 50 + 20; 
        bubble.style.width = size + 'px';
        bubble.style.height = size + 'px';
        
        bubble.style.background = 'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.3))';
        document.body.appendChild(bubble);

        setTimeout(() => {
            bubble.remove();
        }, 12000); 
    }
    
    // 首頁產生背景大泡泡
    if (document.body.classList.contains('home')) {
        setInterval(createBubble, 800);
    }
});
