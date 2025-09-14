const canvas = document.getElementById('pongCanvas');
const ctx = canvas.getContext('2d');
const messageDiv = document.getElementById('message');

// Configuración del juego
const paddleWidth = 10, paddleHeight = 60;
const ballSize = 10;
let player1Y = canvas.height / 2 - paddleHeight / 2;
let player2Y = canvas.height / 2 - paddleHeight / 2;
let ballX = canvas.width / 2;
let ballY = canvas.height / 2;
let ballSpeedX = 4;
let ballSpeedY = 4;
let player1Score = 0;
let player2Score = 0;
let gameOver = false;
let ballSpeedIncrease = 0.1; // Incremento de velocidad por frame
let maxSpeed = 12; // Velocidad máxima

// Controles
let keys = {
    'z': false,
    'x': false,
    'ArrowLeft': false,
    'ArrowRight': false
};

// Frases provocativas
const taunts = [
    "¡Afuera los que no sirven!",
    "¡Se busca clásico!",
    "¡Demasiado lento, amigo!",
    "¡Vuelve cuando sepas jugar!",
    "¡Esto es Pong Picante, no para novatos!"
];

// Reiniciar juego con F5
document.addEventListener('keydown', (e) => {
    if (e.key === 'F5') {
        resetGame();
    }
});

// Movimiento de paletas
document.addEventListener('keydown', (e) => {
    if (e.key in keys) keys[e.key] = true;
});
document.addEventListener('keyup', (e) => {
    if (e.key in keys) keys[e.key] = false;
});

function movePaddles() {
    const paddleSpeed = 5;
    if (keys['z'] && player1Y > 0) player1Y -= paddleSpeed;
    if (keys['x'] && player1Y < canvas.height - paddleHeight) player1Y += paddleSpeed;
    if (keys['ArrowLeft'] && player2Y > 0) player2Y -= paddleSpeed;
    if (keys['ArrowRight'] && player2Y < canvas.height - paddleHeight) player2Y += paddleSpeed;
}

function moveBall() {
    if (gameOver) return;

    ballX += ballSpeedX;
    ballY += ballSpeedY;

    // Aumentar velocidad progresivamente
    ballSpeedX += ballSpeedX > 0 ? ballSpeedIncrease : -ballSpeedIncrease;
    ballSpeedY += ballSpeedY > 0 ? ballSpeedIncrease : -ballSpeedIncrease;
    if (Math.abs(ballSpeedX) > maxSpeed) ballSpeedX = maxSpeed * Math.sign(ballSpeedX);
    if (Math.abs(ballSpeedY) > maxSpeed) ballSpeedY = maxSpeed * Math.sign(ballSpeedY);

    // Rebote en bordes superior e inferior
    if (ballY <= 0 || ballY >= canvas.height) {
        ballSpeedY = -ballSpeedY;
    }

    // Rebote en paletas
    if (
        (ballX <= paddleWidth + ballSize && ballY >= player1Y && ballY <= player1Y + paddleHeight) ||
        (ballX >= canvas.width - paddleWidth - ballSize && ballY >= player2Y && ballY <= player2Y + paddleHeight)
    ) {
        ballSpeedX = -ballSpeedX;
    }

    // Puntuación y fin del juego
    if (ballX <= 0) {
        player2Score++;
        endGame("¡Jugador 2 gana!");
    } else if (ballX >= canvas.width - ballSize) {
        player1Score++;
        endGame("¡Jugador 1 gana!");
    }
}

function resetGame() {
    player1Y = canvas.height / 2 - paddleHeight / 2;
    player2Y = canvas.height / 2 - paddleHeight / 2;
    ballX = canvas.width / 2;
    ballY = canvas.height / 2;
    ballSpeedX = 4;
    ballSpeedY = 4;
    gameOver = false;
    messageDiv.textContent = '';
}

function endGame(message) {
    gameOver = true;
    messageDiv.textContent = `${message} ${taunts[Math.floor(Math.random() * taunts.length)]}`;
}

function draw() {
    // Limpiar canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Dibujar paletas
    ctx.fillStyle = '#ff4444';
    ctx.fillRect(0, player1Y, paddleWidth, paddleHeight);
    ctx.fillRect(canvas.width - paddleWidth, player2Y, paddleWidth, paddleHeight);

    // Dibujar pelota
    ctx.beginPath();
    ctx.arc(ballX, ballY, ballSize / 2, 0, Math.PI * 2);
    ctx.fillStyle = '#ff4444';
    ctx.fill();
    ctx.closePath();

    // Dibujar línea central
    ctx.setLineDash([5, 15]);
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.strokeStyle = '#ff4444';
    ctx.stroke();
    ctx.setLineDash([]);

    // Dibujar instrucciones de controles
    ctx.fillStyle = '#ff4444';
    ctx.font = '16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Jugador 1: Z (arriba), X (abajo)', 10, 20);
    ctx.textAlign = 'right';
    ctx.fillText('Jugador 2: ← (arriba), → (abajo)', canvas.width - 10, 20);
    ctx.textAlign = 'center';
    ctx.fillText('F5: Reiniciar Juego', canvas.width / 2, canvas.height - 20);
}

function gameLoop() {
    if (!gameOver) {
        movePaddles();
        moveBall();
    }
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();