const canvas = document.getElementById('pongCanvas');
const ctx = canvas.getContext('2d');
const messageDiv = document.getElementById('message');

// Configuración del juego
const paddleWidth = 10, paddleHeight = 60;
const ballSize = 10;                 // diámetro
const r = ballSize / 2;              // radio
const paddleSpeed = 5;

let player1Y = canvas.height / 2 - paddleHeight / 2;
let player2Y = canvas.height / 2 - paddleHeight / 2;

let ballX = canvas.width / 2;
let ballY = canvas.height / 2;
let ballSpeedX = 4;
let ballSpeedY = 4;

let player1Score = 0;
let player2Score = 0;
let gameOver = false;

const ballSpeedIncrease = 0.1; // incremento gradual
const maxSpeed = 12;           // tope de velocidad

// Controles (Jugador 1: Q/W | Jugador 2: O/P)
const keys = {
  'q': false, // arriba J1
  'w': false, // abajo  J1
  'o': false, // arriba J2
  'p': false  // abajo  J2
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
  if (e.key === 'F5') resetGame();
});

// Movimiento de paletas
document.addEventListener('keydown', (e) => {
  if (e.key in keys) {
    keys[e.key] = true;
    e.preventDefault();
  }
});
document.addEventListener('keyup', (e) => {
  if (e.key in keys) {
    keys[e.key] = false;
    e.preventDefault();
  }
});

function movePaddles() {
  if (keys['q'] && player1Y > 0) player1Y -= paddleSpeed;
  if (keys['w'] && player1Y < canvas.height - paddleHeight) player1Y += paddleSpeed;

  if (keys['o'] && player2Y > 0) player2Y -= paddleSpeed;
  if (keys['p'] && player2Y < canvas.height - paddleHeight) player2Y += paddleSpeed;
}

function moveBall() {
  if (gameOver) return;

  ballX += ballSpeedX;
  ballY += ballSpeedY;

  // Aumentar velocidad progresiva con tope
  ballSpeedX += (ballSpeedX > 0 ? ballSpeedIncrease : -ballSpeedIncrease);
  ballSpeedY += (ballSpeedY > 0 ? ballSpeedIncrease : -ballSpeedIncrease);
  if (Math.abs(ballSpeedX) > maxSpeed) ballSpeedX = maxSpeed * Math.sign(ballSpeedX);
  if (Math.abs(ballSpeedY) > maxSpeed) ballSpeedY = maxSpeed * Math.sign(ballSpeedY);

  // Rebote en bordes superior/inferior usando radio
  if (ballY - r <= 0 || ballY + r >= canvas.height) {
    ballSpeedY = -ballSpeedY;
    // Corrige penetración
    ballY = Math.max(r, Math.min(canvas.height - r, ballY));
  }

  // Colisiones con paletas usando AABB-círculo simple
  // Paleta izquierda (Jugador 1)
  if (
    ballX - r <= paddleWidth &&
    ballY + r >= player1Y &&
    ballY - r <= player1Y + paddleHeight &&
    ballSpeedX < 0
  ) {
    ballSpeedX = -ballSpeedX;
    // Ajuste fino: añade efecto según punto de impacto
    const hitPos = (ballY - (player1Y + paddleHeight / 2)) / (paddleHeight / 2);
    ballSpeedY += hitPos; // leve desvío
    // Saca la pelota fuera de la paleta para evitar pegado
    ballX = paddleWidth + r;
  }

  // Paleta derecha (Jugador 2)
  if (
    ballX + r >= canvas.width - paddleWidth &&
    ballY + r >= player2Y &&
    ballY - r <= player2Y + paddleHeight &&
    ballSpeedX > 0
  ) {
    ballSpeedX = -ballSpeedX;
    const hitPos = (ballY - (player2Y + paddleHeight / 2)) / (paddleHeight / 2);
    ballSpeedY += hitPos;
    ballX = canvas.width - paddleWidth - r;
  }

  // Puntuación y fin del juego (un punto termina la partida)
  if (ballX - r <= 0) {
    player2Score++;
    endGame("¡Jugador 2 gana!");
  } else if (ballX + r >= canvas.width) {
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
  messageDiv.innerHTML = `<strong>${message}</strong><br>${taunts[Math.floor(Math.random() * taunts.length)]}`;
}

function draw() {
  // Limpiar canvas
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Paletas
  ctx.fillStyle = '#ff4444';
  ctx.fillRect(0, player1Y, paddleWidth, paddleHeight);
  ctx.fillRect(canvas.width - paddleWidth, player2Y, paddleWidth, paddleHeight);

  // Pelota
  ctx.beginPath();
  ctx.arc(ballX, ballY, r, 0, Math.PI * 2);
  ctx.fillStyle = '#ff4444';
  ctx.fill();
  ctx.closePath();

  // Línea central
  ctx.setLineDash([5, 15]);
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2, 0);
  ctx.lineTo(canvas.width / 2, canvas.height);
  ctx.strokeStyle = '#ff4444';
  ctx.stroke();
  ctx.setLineDash([]);

  // Texto de controles
  ctx.fillStyle = '#ff4444';
  ctx.font = '16px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('Jugador 1: Q (arriba), W (abajo)', 10, 20);
  ctx.textAlign = 'right';
  ctx.fillText('Jugador 2: O (arriba), P (abajo)', canvas.width - 10, 20);
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
