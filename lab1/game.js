// lab1/game.js

const songs = [
    {
        file: "Top Barry_INDEcompany - 一半一半「但是我不想要一半一半 一半一半，可我们俩这一段一段 已断已断。」【动态歌词MV】 - Cloud9 Music Channel.mp3",
        answer: "一半一半",
        options: ["一半一半", "一段一段", "如果可以", "那些你很冒險的夢"]
    },
    {
        file: "polar express - Gareth.T.mp3",
        answer: "polar express",
        options: ["polar express", "lonely christmas", "jingle bells", "last christmas"]
    },
    {
        file: "马也_Crabbit_Cole￼先生 - 海屿你(降调版￼￼) - 7_txxnn.mp3",
        answer: "海屿你",
        options: ["想見你", "海屿你", "大魚", "星辰大海"]
    }
];

// UI Elements
const startScreen = document.getElementById('start-screen');
const gameScreen = document.getElementById('game-screen');
const endScreen = document.getElementById('end-screen');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');

const record = document.getElementById('record');
const playBtn = document.getElementById('play-btn');
const playIcon = document.getElementById('play-icon');
const optionsContainer = document.getElementById('options-container');
const statusText = document.getElementById('status-text');
const progressText = document.getElementById('progress-text');
const finalScoreText = document.getElementById('final-score');

// 遊戲狀態
let currentSongIndex = 0;
let score = 0;
let isPlaying = false;
let audio = new Audio();
let isAnswered = false;

// 打亂陣列 (Fisher-Yates Shuffle)
function shuffle(array) {
    let currentIndex = array.length, randomIndex;
    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
}

function initGame() {
    currentSongIndex = 0;
    score = 0;
    shuffle(songs);
    songs.forEach(song => shuffle(song.options));
    
    startScreen.classList.add('hidden');
    endScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');
    
    loadSong();
}

function loadSong() {
    if (currentSongIndex >= songs.length) {
        endGame();
        return;
    }
    
    isAnswered = false;
    const currentSong = songs[currentSongIndex];
    audio.src = `lab1songs/${currentSong.file}`;
    audio.load();
    
    progressText.innerText = `第 ${currentSongIndex + 1} / ${songs.length} 題`;
    statusText.innerText = "聽聽看，這是哪首歌？";
    statusText.style.color = "#2a9d8f";
    
    renderOptions(currentSong);
    resetPlayer();
}

function renderOptions(song) {
    optionsContainer.innerHTML = '';
    const icons = ['🎵', '🎶', '🎧', '🎼']; // Different icons for flavor
    song.options.forEach((option, index) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        // Add a musical icon to each option
        const icon = icons[index % icons.length];
        btn.innerHTML = `<span class="music-icon">${icon}</span> <span>${option}</span>`;
        // Store the raw option text for checking
        btn.dataset.option = option;
        btn.onclick = () => checkAnswer(option, btn);
        optionsContainer.appendChild(btn);
    });
}

function togglePlay() {
    if (isPlaying) {
        audio.pause();
        record.classList.remove('playing');
        playIcon.innerText = "▶ 播放音樂";
    } else {
        audio.play();
        record.classList.add('playing');
        playIcon.innerText = "⏸ 暫停音樂";
    }
    isPlaying = !isPlaying;
}

function resetPlayer() {
    audio.pause();
    audio.currentTime = 0;
    isPlaying = false;
    record.classList.remove('playing');
    playIcon.innerText = "▶ 播放音樂";
}

function checkAnswer(selectedOption, btnElement) {
    if (isAnswered) return; // 已經答過這題就不能再選
    
    isAnswered = true;
    const currentSong = songs[currentSongIndex];
    const buttons = optionsContainer.querySelectorAll('.option-btn');
    
    // 找出正確答案的按鈕
    let correctBtn;
    buttons.forEach(btn => {
        btn.disabled = true; // 禁用所有按鈕
        if (btn.dataset.option === currentSong.answer) {
            correctBtn = btn;
        }
    });

    if (selectedOption === currentSong.answer) {
        // 答對了
        btnElement.classList.add('correct');
        statusText.innerText = "🎉 答對了！太厲害啦！";
        statusText.style.color = "#2a9d8f";
        score += 100;
    } else {
        // 答錯了
        btnElement.classList.add('wrong');
        correctBtn.classList.add('correct'); // 標示正確答案
        statusText.innerText = `❌ 答錯囉！正確答案是「${currentSong.answer}」`;
        statusText.style.color = "#e76f51";
    }
    
    // 停止音樂
    resetPlayer();
    
    // 延遲後進入下一題
    setTimeout(() => {
        currentSongIndex++;
        loadSong();
    }, 2500);
}

function endGame() {
    gameScreen.classList.add('hidden');
    endScreen.classList.remove('hidden');
    finalScoreText.innerText = `你的總分是：${score} 分！`;
    
    // 評價
    let evaluation = "";
    if (score === songs.length * 100) {
        evaluation = "🏆 完美！你根本是行走點唱機！";
    } else if (score > 0) {
        evaluation = "👏 不錯喔！再多聽幾次就滿分了！";
    } else {
        evaluation = "😅 哎呀，你是不是沒開聲音？";
    }
    document.getElementById('evaluation').innerText = evaluation;
}

// 事件綁定
startBtn.addEventListener('click', initGame);
restartBtn.addEventListener('click', initGame);
playBtn.addEventListener('click', togglePlay);

// 音樂播放完畢時自動暫停動畫
audio.addEventListener('ended', resetPlayer);
