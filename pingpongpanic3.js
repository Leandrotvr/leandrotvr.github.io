/* PING PONG PANIC 3 - Minimalista, 3 jugadores
   Reglas: el que recibe un gol queda eliminado; gana el último en pie.
   Calentamiento: 15 s (no elimina ni puntúa).
   Velocidad de la bola: empieza muy lenta y sube de forma MUY gradual.
   Controles:
     - P1 (izq): Q (arriba), A (abajo)
     - P2 (der): P (arriba), Ñ (abajo)  | alternativa para Ñ: ';'
     - P3 (abajo): V (izq), B (der)
*/

(() => {
  // === Utilidades ===========================================================
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rand = (a, b) => a + Math.random() * (b - a);

  // dir aleatoria no muy plana
  function randomUnitVector() {
    let x, y, m;
    do {
      const ang = rand(0, Math.PI * 2);
      x = Math.cos(ang);
      y = Math.sin(ang);
      m = Math.hypot(x, y);
    } while (Math.abs(x) < 0.35 && Math.abs(y) < 0.35); // evita ángulos sosos
    return { x: x / m, y: y / m };
  }

  // === Lienzo ===============================================================
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');

  // Mantener resolución interna cuadrada en función del tamaño CSS:
  function fitInternalResolution() {
    const rect = canvas.getBoundingClientRect();
    const size = Math.round(Math.min(rect.width, rect.height));
    // resolución "real" más alta para nitidez
    const scale = window.devicePixelRatio || 1;
    const px = Math.max(480, Math.min(900, Math.floor(size * scale)));
    canvas.width = px;
    canvas.height = px;
  }
  fitInternalResolution();
  window.addEventListener('resize', fitInternalResolution);

  const W = () => canvas.width, H = () => canvas.height;

  // === HUD ==================================================================
  const elStatus = document.getElementById('status');
  const elTimer  = document.getElementById('timer');
  const elAlive  = document.getElementById('alive');

  function setStatus(mode, text) {
    elStatus.classList.remove('warmup', 'live', 'over');
    elStatus.classList.add(mode);
    elStatus.textContent = text;
  }

  function updateAliveBadge() {
    const vivos = [];
    if (players.P1.alive) vivos.push('P1');
    if (players.P2.alive) vivos.push('P2');
    if (players.P3.alive) vivos.push('P3');
    elAlive.textContent = `Vivos: ${vivos.join(',') || '—'}`;
  }

  // === Entidades ============================================================
  const paddleThickness = 14; // grosor
  const paddleLen = 0.22;     // % del lado
  const paddleSpeed = 480;    // px/s

  const players = {
    P1: { // izquierda (vertical)
      side: 'left',
      alive: true,
      y: 0.5,
      len: paddleLen,
      up: false,
      down: false
    },
    P2: { // derecha (vertical)
      side: 'right',
      alive: true,
      y: 0.5,
      len: paddleLen,
      up: false,
      down: false
    },
    P3: { // abajo (horizontal)
      side: 'bottom',
      alive: true,
      x: 0.5,
      len: paddleLen,
      left: false,
      right: false
    }
  };

  const ball = {
    x: 0.5,
    y: 0.5,
    r: 8,
    dirx: 0,
    diry: 0,
    speed: 80,           // muy lenta al inicio (px/s)
    speedGrowth: 0.005,  // +0.5% por segundo (MUY paulatina)
    maxSpeed: 950
  };

  // estados de juego
  let warmup = true;
  let warmupLeft = 15.0; // s
  let gameOver = false;
  let winner = null;

  function resetRound(keepEliminations = true) {
    // bola al centro y velocidad reiniciada (súper lenta)
    ball.x = 0.5;
    ball.y = 0.5;
    ball.speed = 80;
    const v = randomUnitVector();
    ball.dirx = v.x;
    ball.diry = v.y;
    // recolocar palas
    if (!keepEliminations) {
      players.P1.alive = players.P2.alive = players.P3.alive = true;
      winner = null;
      gameOver = false;
      warmup = true;
      warmupLeft = 15.0;
      setStatus('warmup', 'Calentamiento…');
      elTimer.textContent = Math.ceil(warmupLeft).toString();
    }
    updateAliveBadge();
  }
  resetRound();

  // === Controles ============================================================
  const down = new Set();
  const keymap = {
    // P1
    q: () => { players.P1.up = true; },
    a: () => { players.P1.down = true; },
    // P2
    p: () => { players.P2.up = true; },
    'ñ': () => { players.P2.down = true; },
    ';': () => { players.P2.down = true; }, // alternativa por layouts
    // P3
    v: () => { players.P3.left = true; },
    b: () => { players.P3.right = true; }
  };
  const keyupmap = {
    q: () => { players.P1.up = false; },
    a: () => { players.P1.down = false; },
    p: () => { players.P2.up = false; },
    'ñ': () => { players.P2.down = false; },
    ';': () => { players.P2.down = false; },
    v: () => { players.P3.left = false; },
    b: () => { players.P3.right = false; },
    // reset
    r: () => { if (gameOver) resetRound(false); }
  };

  window.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    if (down.has(k)) return;
    down.add(k);
    (keymap[k] || (()=>{}))();
  });
  window.addEventListener('keyup', (e) => {
    const k = e.key.toLowerCase();
    down.delete(k);
    (keyupmap[k] || (()=>{}))();
  });

  // === Física y colisiones ==================================================
  function paddleRect(p, w, h) {
    const L = Math.floor((p.len * h)); // longitud real en px (para verticales)
    if (p.side === 'left') {
      const cy = Math.floor(p.y * h);
      return { x: 0, y: clamp(cy - L/2, 0, h - L), w: paddleThickness, h: L };
    }
    if (p.side === 'right') {
      const cy = Math.floor(p.y * h);
      return { x: w - paddleThickness, y: clamp(cy - L/2, 0, h - L), w: paddleThickness, h: L };
    }
    // bottom (horizontal)
    const Lx = Math.floor((p.len * w));
    const cx = Math.floor(p.x * w);
    return { x: clamp(cx - Lx/2, 0, w - Lx), y: h - paddleThickness, w: Lx, h: paddleThickness };
  }

  function movePaddles(dt) {
    const w = W(), h = H();
    const dy = paddleSpeed * dt;
    const dx = paddleSpeed * dt;

    if (players.P1.alive) {
      if (players.P1.up)   players.P1.y -= dy / h;
      if (players.P1.down) players.P1.y += dy / h;
      players.P1.y = clamp(players.P1.y, players.P1.len/2, 1 - players.P1.len/2);
    }
    if (players.P2.alive) {
      if (players.P2.up)   players.P2.y -= dy / h;
      if (players.P2.down) players.P2.y += dy / h;
      players.P2.y = clamp(players.P2.y, players.P2.len/2, 1 - players.P2.len/2);
    }
    if (players.P3.alive) {
      if (players.P3.left)  players.P3.x -= dx / w;
      if (players.P3.right) players.P3.x += dx / w;
      players.P3.x = clamp(players.P3.x, players.P3.len/2, 1 - players.P3.len/2);
    }
  }

  function reflectOnPaddle(rect, normalX, normalY, hitOffset = 0) {
    // proyección y rebote con pequeño desvío según dónde golpee
    // normalX/Y define la normal de la superficie (e.g., izquierda/derecha: ±1,0; abajo: 0,-1)
    const dot = ball.dirx * normalX + ball.diry * normalY;
    // reflejo ideal
    ball.dirx = ball.dirx - 2 * dot * normalX;
    ball.diry = ball.diry - 2 * dot * normalY;
    // rotación leve en función del offset (para evitar ciclos perfectos)
    const tilt = clamp(hitOffset, -1, 1) * 0.35; // ±0.35 rad aprox
    const cos = Math.cos(tilt), sin = Math.sin(tilt);
    const rx = ball.dirx * cos - ball.diry * sin;
    const ry = ball.dirx * sin + ball.diry * cos;
    const m = Math.hypot(rx, ry) || 1;
    ball.dirx = rx / m;
    ball.diry = ry / m;
  }

  // Devuelve true si fue gol contra un jugador vivo
  function handleWallsAndGoals(dt) {
    const w = W(), h = H();
    const r = ball.r;

    // Top: siempre pared
    if (ball.y - r <= 0) {
      ball.y = r;
      ball.diry = Math.abs(ball.diry);
    }

    // Left
    if (ball.x - r <= 0) {
      if (players.P1.alive && !warmup) {
        eliminate('P1');
        return true;
      } else {
        ball.x = r;
        ball.dirx = Math.abs(ball.dirx);
      }
    }

    // Right
    if (ball.x + r >= w) {
      if (players.P2.alive && !warmup) {
        eliminate('P2');
        return true;
      } else {
        ball.x = w - r;
        ball.dirx = -Math.abs(ball.dirx);
      }
    }

    // Bottom
    if (ball.y + r >= h) {
      if (players.P3.alive && !warmup) {
        eliminate('P3');
        return true;
      } else {
        ball.y = h - r;
        ball.diry = -Math.abs(ball.diry);
      }
    }

    return false;
  }

  function handlePaddleCollisions() {
    const w = W(), h = H(), r = ball.r;

    // P1 (left)
    if (players.P1.alive) {
      const pr = paddleRect(players.P1, w, h);
      if (ball.x - r <= pr.x + pr.w && ball.y >= pr.y && ball.y <= pr.y + pr.h && ball.dirx < 0) {
        ball.x = pr.x + pr.w + r; // reubicar fuera de la pala
        const offset = ((ball.y - pr.y) / pr.h) * 2 - 1; // [-1,1]
        reflectOnPaddle(pr, 1, 0, offset);
      }
    }

    // P2 (right)
    if (players.P2.alive) {
      const pr = paddleRect(players.P2, w, h);
      if (ball.x + r >= pr.x && ball.y >= pr.y && ball.y <= pr.y + pr.h && ball.dirx > 0) {
        ball.x = pr.x - r;
        const offset = ((ball.y - pr.y) / pr.h) * 2 - 1;
        reflectOnPaddle(pr, -1, 0, offset);
      }
    }

    // P3 (bottom)
    if (players.P3.alive) {
      const pr = paddleRect(players.P3, w, h);
      if (ball.y + r >= pr.y && ball.x >= pr.x && ball.x <= pr.x + pr.w && ball.diry > 0) {
        ball.y = pr.y - r;
        const offset = ((ball.x - pr.x) / pr.w) * 2 - 1;
        reflectOnPaddle(pr, 0, -1, offset);
      }
    }
  }

  function eliminate(pid) {
    players[pid].alive = false;
    updateAliveBadge();

    // ¿quién queda?
    const aliveList = Object.keys(players).filter(k => players[k].alive);
    if (aliveList.length === 1) {
      winner = aliveList[0];
      gameOver = true;
      setStatus('over', `¡Ganador: ${winner}! (R para reiniciar)`);
      elTimer.textContent = '—';
      return;
    }

    // Seguir jugando: reiniciar bola con random
    resetRound(true);
  }

  // === Bucle ================================================================
  let last = performance.now();

  function frame(now) {
    const dt = Math.min(0.033, (now - last) / 1000); // clamp dt
    last = now;

    step(dt);
    draw();

    requestAnimationFrame(frame);
  }

  function step(dt) {
    if (gameOver) return;

    // Calentamiento
    if (warmup) {
      warmupLeft -= dt;
      if (warmupLeft <= 0) {
        warmup = false;
        setStatus('live', '¡Partido en serio!');
        elTimer.textContent = '—';
      } else {
        elTimer.textContent = String(Math.ceil(warmupLeft));
      }
    }

    movePaddles(dt);

    // mover bola
    ball.speed = Math.min(ball.maxSpeed, ball.speed * (1 + ball.speedGrowth * dt)); // subida paulatina
    const w = W(), h = H();
    ball.x += ball.dirx * ball.speed * dt;
    ball.y += ball.diry * ball.speed * dt;

    // colisiones
    handlePaddleCollisions();

    // paredes / goles
    const goal = handleWallsAndGoals(dt);
    if (goal) {
      // si no terminó el juego, ya se hizo resetRound(true)
      // durante calentamiento, no elimina, así que nunca entra aquí
    }
  }

  // === Render ===============================================================
  function draw() {
    const w = W(), h = H();

    // fondo
    ctx.clearRect(0, 0, w, h);

    // líneas sutiles ya están vía CSS; dibujamos límites más claros:
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, w-2, h-2);

    // palas
    ctx.fillStyle = '#e5e7eb';
    if (players.P1.alive) {
      const r1 = paddleRect(players.P1, w, h);
      roundRect(ctx, r1.x, r1.y, r1.w, r1.h, 6, true);
    } else {
      // indicar pared sólida donde estaba P1
      drawSideGlow('left');
    }

    if (players.P2.alive) {
      const r2 = paddleRect(players.P2, w, h);
      roundRect(ctx, r2.x, r2.y, r2.w, r2.h, 6, true);
    } else {
      drawSideGlow('right');
    }

    if (players.P3.alive) {
      const r3 = paddleRect(players.P3, w, h);
      roundRect(ctx, r3.x, r3.y, r3.w, r3.h, 6, true);
    } else {
      drawSideGlow('bottom');
    }

    // bola
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI*2);
    ctx.fill();

    // rótulos estado
    if (warmup) {
      drawBanner('CALENTAMIENTO', '#60a5fa');
    } else if (gameOver) {
      drawBanner(`GANADOR: ${winner}`, '#f87171');
    } else {
      // discreto: partido en serio ya está en el badge
    }
  }

  function roundRect(ctx, x, y, w, h, r = 6, fill = true) {
    const rr = Math.min(r, w/2, h/2);
    ctx.beginPath();
    ctx.moveTo(x+rr, y);
    ctx.arcTo(x+w, y, x+w, y+h, rr);
    ctx.arcTo(x+w, y+h, x, y+h, rr);
    ctx.arcTo(x, y+h, x, y, rr);
    ctx.arcTo(x, y, x+w, y, rr);
    if (fill) ctx.fill();
  }

  function drawBanner(text, color) {
    const w = W(), h = H();
    ctx.save();
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    const pad = 12;
    ctx.fillRect(0, h*0.42, w, h*0.16);
    ctx.globalAlpha = 1;
    ctx.fillStyle = color;
    ctx.font = `${Math.floor(h*0.06)}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, w/2, h/2);
    ctx.restore();
  }

  function drawSideGlow(side) {
    const w = W(), h = H();
    const g = ctx.createLinearGradient(
      side === 'left' ? 0 : side === 'right' ? w : 0,
      side === 'bottom' ? h : 0,
      side === 'left' ? 40 : side === 'right' ? w-40 : 0,
      side === 'bottom' ? h-40 : 0
    );
    g.addColorStop(0, 'rgba(248,113,113,0.28)');
    g.addColorStop(1, 'rgba(248,113,113,0.03)');
    ctx.fillStyle = g;

    if (side === 'left')  ctx.fillRect(0, 0, 40, h);
    if (side === 'right') ctx.fillRect(w-40, 0, 40, h);
    if (side === 'bottom')ctx.fillRect(0, h-40, w, 40);
  }

  // iniciar bucle
  requestAnimationFrame(frame);

  // === Validación mínima (evitar errores comunes) ===========================
  // Si el usuario no tiene layout español, ofrecer tecla alternativa para Ñ.
  // (No interrumpe el juego.)
  setTimeout(() => {
    const isSpanish = Intl.DateTimeFormat().resolvedOptions().locale.toLowerCase().includes('es');
    if (!isSpanish) {
      console.info('Sugerencia: si tu teclado no tiene "Ñ", usa ";" para bajar P2.');
    }
  }, 0);
})();


