const board = document.getElementById('game-board');
const movesElement = document.getElementById('moves');
const timeElement = document.getElementById('time');
const winScreen = document.getElementById('win-screen');
const finalStatsElement = document.getElementById('final-stats');
const restartBtn = document.getElementById('restart-btn');

const catEmojis = ['🐱', '😸', '😹', '😻', '😼', '😽', '🙀', '😿'];
let cards = [];
let hasFlippedCard = false;
let lockBoard = false;
let firstCard, secondCard;
let moves = 0;
let matches = 0;
let timer;
let seconds = 0;
let gameStarted = false;

function initGame() {
    // 重置狀態
    board.innerHTML = '';
    winScreen.classList.add('hidden');
    hasFlippedCard = false;
    lockBoard = false;
    firstCard = null;
    secondCard = null;
    moves = 0;
    matches = 0;
    seconds = 0;
    gameStarted = false;
    movesElement.textContent = moves;
    timeElement.textContent = seconds;
    clearInterval(timer);

    // 準備卡片 (8種表情，各2張)
    cards = [...catEmojis, ...catEmojis];
    cards.sort(() => 0.5 - Math.random()); // 洗牌

    // 產生 DOM 元素
    cards.forEach(emoji => {
        const cardElement = document.createElement('div');
        cardElement.classList.add('memory-card');
        cardElement.dataset.emoji = emoji;

        const frontFace = document.createElement('div');
        frontFace.classList.add('front-face');
        frontFace.textContent = emoji;

        const backFace = document.createElement('div');
        backFace.classList.add('back-face');
        backFace.textContent = '🐾';

        cardElement.appendChild(frontFace);
        cardElement.appendChild(backFace);
        
        cardElement.addEventListener('click', flipCard);
        board.appendChild(cardElement);
    });
}

function startTimer() {
    if (!gameStarted) {
        gameStarted = true;
        timer = setInterval(() => {
            seconds++;
            timeElement.textContent = seconds;
        }, 1000);
    }
}

function flipCard() {
    if (lockBoard) return;
    if (this === firstCard) return;

    startTimer();
    this.classList.add('flip');

    if (!hasFlippedCard) {
        // 第一次翻牌
        hasFlippedCard = true;
        firstCard = this;
        return;
    }

    // 第二次翻牌
    secondCard = this;
    moves++;
    movesElement.textContent = moves;
    checkForMatch();
}

function checkForMatch() {
    let isMatch = firstCard.dataset.emoji === secondCard.dataset.emoji;

    if (isMatch) {
        disableCards();
    } else {
        unflipCards();
    }
}

function disableCards() {
    firstCard.removeEventListener('click', flipCard);
    secondCard.removeEventListener('click', flipCard);
    
    firstCard.classList.add('match');
    secondCard.classList.add('match');

    resetBoard();
    matches++;

    // 檢查是否全部配對完成
    if (matches === catEmojis.length) {
        clearInterval(timer);
        setTimeout(() => {
            finalStatsElement.textContent = `總共花費了 ${moves} 步，用了 ${seconds} 秒！`;
            winScreen.classList.remove('hidden');
        }, 500);
    }
}

function unflipCards() {
    lockBoard = true;

    setTimeout(() => {
        firstCard.classList.remove('flip');
        secondCard.classList.remove('flip');
        resetBoard();
    }, 1000);
}

function resetBoard() {
    [hasFlippedCard, lockBoard] = [false, false];
    [firstCard, secondCard] = [null, null];
}

restartBtn.addEventListener('click', initGame);

// 載入時初始化
initGame();
