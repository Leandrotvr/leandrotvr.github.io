const canvasIds = ['canvas1', 'canvas2', 'canvas3', 'canvas4'];
const controls = [
    { left: '1', rotate: '2', right: '3' },
    { left: '8', rotate: '9', right: '0' },
    { left: 'z', rotate: 'x', right: 'c' },
    { left: 'b', rotate: 'n', right: 'm' }
];

const tetrominos = [
    [[1,1,1,1]], // I
    [[1,1],[1,1]], // O
    [[0,1,0],[1,1,1]], // T
    [[0,1,1],[1,1,0]], // S
    [[1,1,0],[0,1,1]], // Z
    [[1,0,0],[1,1,1]], // J
    [[0,0,1],[1,1,1]]  // L
];

const colors = ['cyan', 'yellow', 'purple', 'green', 'red', 'blue', 'orange'];

class Player {
    constructor(canvasId, controls, index) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.grid = Array(20).fill().map(() => Array(10).fill(0));
        this.piece = null;
        this.pieceX = 0;
        this.pieceY = 0;
        this.controls = controls;
        this.active = true;
        this.dropInterval = 1000; // Start at 1 second
        this.lastDrop = Date.now();
        this.index = index; // Player number (0-based)
        this.spawnPiece();
    }

    spawnPiece() {
        const type = Math.floor(Math.random() * tetrominos.length);
        this.piece = tetrominos[type];
        this.pieceX = Math.floor((10 - this.piece[0].length) / 2);
        this.pieceY = 0;
        this.color = colors[type];
        if (this.collision(0, 0)) {
            this.active = false; // Player is out
        }
    }

    collision(dx, dy, piece = this.piece) {
        for (let y = 0; y < piece.length; y++) {
            for (let x = 0; x < piece[y].length; x++) {
                if (piece[y][x]) {
                    const newX = this.pieceX + x + dx;
                    const newY = this.pieceY + y + dy;
                    if (newX < 0 || newX >= 10 || newY >= 20 || (newY >= 0 && this.grid[newY][newX])) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    move(dx) {
        if (this.active && !this.collision(dx, 0)) {
            this.pieceX += dx;
        }
    }

    rotate() {
        if (!this.active) return;
        const rotated = Array(this.piece[0].length).fill().map(() => Array(this.piece.length).fill(0));
        for (let y = 0; y < this.piece.length; y++) {
            for (let x = 0; x < this.piece[y].length; x++) {
                rotated[x][this.piece.length - 1 - y] = this.piece[y][x];
            }
        }
        if (!this.collision(0, 0, rotated)) {
            this.piece = rotated;
        }
    }

    drop() {
        if (!this.active) return;
        if (!this.collision(0, 1)) {
            this.pieceY++;
        } else {
            this.lock();
        }
    }

    lock() {
        for (let y = 0; y < this.piece.length; y++) {
            for (let x = 0; x < this.piece[y].length; x++) {
                if (this.piece[y][x]) {
                    const gridY = this.pieceY + y;
                    if (gridY >= 0) {
                        this.grid[gridY][this.pieceX + x] = this.color;
                    }
                }
            }
        }
        this.clearLines();
        this.spawnPiece();
    }

    clearLines() {
        this.grid = this.grid.filter(row => row.some(cell => !cell));
        while (this.grid.length < 20) {
            this.grid.unshift(Array(10).fill(0));
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        const blockSize = 20;
        // Draw grid
        for (let y = 0; y < 20; y++) {
            for (let x = 0; x < 10; x++) {
                if (this.grid[y][x]) {
                    this.ctx.fillStyle = this.grid[y][x];
                    this.ctx.fillRect(x * blockSize, y * blockSize, blockSize - 1, blockSize - 1);
                }
            }
        }
        // Draw piece
        if (this.active) {
            this.ctx.fillStyle = this.color;
            for (let y = 0; y < this.piece.length; y++) {
                for (let x = 0; x < this.piece[y].length; x++) {
                    if (this.piece[y][x]) {
                        this.ctx.fillRect((this.pieceX + x) * blockSize, (this.pieceY + y) * blockSize, blockSize - 1, blockSize - 1);
                    }
                }
            }
        }
    }

    drawWinMessage(message) {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = 'white';
        this.ctx.font = '20px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(message, this.canvas.width / 2, this.canvas.height / 2);
    }

    update() {
        if (!this.active) {
            this.draw(); // Redraw static board for inactive players
            return;
        }
        if (Date.now() - this.lastDrop > this.dropInterval) {
            this.drop();
            this.lastDrop = Date.now();
        }
        this.draw();
    }
}

const players = canvasIds.map((id, i) => new Player(id, controls[i], i));
let gameRunning = true;

document.addEventListener('keydown', (e) => {
    if (!gameRunning) return;
    players.forEach(player => {
        if (e.key === player.controls.left) player.move(-1);
        if (e.key === player.controls.right) player.move(1);
        if (e.key === player.controls.rotate) player.rotate();
    });
});

let lastSpeedIncrease = Date.now();
function gameLoop() {
    if (!gameRunning) return;

    // Increase speed every 10 seconds by 20%
    if (Date.now() - lastSpeedIncrease > 10000) {
        players.forEach(player => {
            if (player.active) {
                player.dropInterval *= 0.8; // 20% faster
            }
        });
        lastSpeedIncrease = Date.now();
    }

    // Update players
    players.forEach(player => player.update());

    // Check for win condition
    const activePlayers = players.filter(player => player.active);
    if (activePlayers.length <= 1) {
        gameRunning = false;
        if (activePlayers.length === 1) {
            const winner = activePlayers[0];
            players.forEach(player => {
                const message = player === winner ? `Player ${player.index + 1} Wins!` : 'Game Over';
                player.drawWinMessage(message);
            });
        } else {
            players.forEach(player => player.drawWinMessage('No Winner'));
        }
        return; // Stop the game loop
    }

    requestAnimationFrame(gameLoop);
}

gameLoop();