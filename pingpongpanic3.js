/* PING PONG PANIC 3 - 3 jugadores (fix: ganador no se anuncia en el 1er gol)
   Reglas: el que recibe un gol queda eliminado; gana el último en pie.
   Calentamiento: 15 s.
   Velocidad: arranca muy lenta y sube de forma MUY gradual.
   Controles:
     - P1 (izq): Q (arriba), A (abajo)
     - P2 (der): P (arriba), Ñ (abajo)  | alternativa para Ñ: ';'
     - P3 (abajo): V (izq), B (der)
*/

(() => {
  // === Utilidades ===========================================================
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rand = (a, b) => a + Math.random() * (b - a);

  function randomUnitVector() {
    let x, y, m;
    do {
      const ang = rand(0, Math.PI * 2);
      x = Math.cos(ang);
      y = Math.sin(ang);
      m = Math.hypot(x, y);
    } while (Math.abs(x) < 0.35 && Math.abs(y) < 0.35);
    return { x: x / m, y: y / m };
  }

  // === Lienzo ===============================================================
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');

  function fitInternalResolution() {
    const rect = canvas.getBoundingClientRect();
    const size = Math.round(Math.min(rect.width, rect.height));
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

  const setStatus = (mode, text) => {
    elStatus.classList.remove('warmup', 'live', 'over');
    elStatus.classList.add(mode);
    elStatus.textContent = text;
  };

  function updateAliveBadge() {
    const vivos = [];
    if (players.P1.alive) vivos.push('P1');
    if (players.P2.alive) vivos.push('P2');
    if (players.P3.alive) vivos.push('P3');
    elAlive.textContent = `Vivos: ${vivos.join(',') || '—'}`;
  }

  // === Entidades ============================================================
  const paddleThickness = 14;
  const paddleLen = 0.22;
  const paddleSpeed = 480;

  const players = {
    P1: { side: 'left',   alive: true, y: 0.5, len: paddleLen, up: false,  down: false },
    P2: { side: 'right',  alive: true, y: 0.5, len: paddleLen, up: false,  down: false },
    P3: { side: 'bottom', alive: true, x: 0.5, len: paddleLen, left: false, right: false }
  };

  const ball = {
    x: 0.5, y: 0.5, r: 8,
    dirx: 0, diry: 0,
    speed: 80,            // muy lenta al inicio
    speedGrowth: 0.005,   // +0.5% por segundo
    maxSpeed: 950
  };

  // estados
  let warmup = true;
  let warmupLeft = 15.0; // s
  let gameOver = false;
  let winner = null;
  let eliminatedCount = 0;     // <--- NUEVO
  let goalJustHappened = false; // <--- evita doble proceso en el mismo frame

  function resetRound(keepEliminations = true) {
    // bola al centro, velocidad reiniciada, dirección aleatoria
    ball.x = 0.5; ball.y = 0.5; ball.speed = 80;
    const v = randomUnitVector();
    ball.dirx = v.x; ball.diry = v.y;

    // reset completo (para tecla R)
    if (!keepEliminations) {
      players.P1.alive = players.P2.alive = players.P3.alive = true;
      eliminatedCount = 0;
      winner = null;
      gameOver = false;
      warmup = true;
      warmupLeft = 15.0;
      setStatus('warmup', 'Calentamiento…');
      elTimer.textContent = String(Math.ceil(warmupLeft));
    }
    updateAliveBadge();
    goalJustHappened = false;
  }
  resetRound();

  // === Controles ============================================================
  const down = new Set();
  const keymap = {
    q: () => { players.P1.up = true; },
    a: () => { players.P1.down = true; },
    p: () => { players.P2.up = true; },
    'ñ': () => { players.P2.down = true; },
    ';': () => { players.P2.down = true; },
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

  // === Geometría palas ======================================================
  function paddleRect(p, w, h) {
    const L = Math.floor(p.len * h);
    if (p.side === 'left') {
      const cy = Math.floor(p.y * h);
      return { x: 0, y: clamp(cy - L/2, 0, h - L), w: paddleThickness, h: L };
    }
    if (p.side === 'right') {
      const cy = Math.floor(p.y * h);
      return { x: w - paddleThickness, y: clamp(cy - L/2, 0, h - L), w: paddleThickness, h: L };
    }
    const Lx = Math.floor(p.len * w);
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

  function reflectOnPaddle(normalX, normalY, hitOffset = 0) {
    const dot = ball.dirx * normalX + ball.diry * normalY;
    ball.dirx = ball.dirx - 2 * dot * normalX;
    ball.diry = ball.diry - 2 * dot * normalY;
    const tilt = clamp(hitOffset, -1, 1) * 0.35;
    const cos = Math.cos(tilt), sin = Math.sin(tilt);
    const rx = ball.dirx * cos - ball.diry * sin;
    const ry = ball.dirx * sin + ball.diry * cos;
    const m = Math.hypot(rx, ry) || 1;
    ball.dirx = rx / m; ball.diry = ry / m;
  }

  // === Goles / paredes ======================================================
  function handleWallsAndGoals() {
    const w = W(), h = H(), r = ball.r;

    // Top: pared
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

    if (players.P1.alive) {
      const pr = paddleRect(players.P1, w, h);
      if (ball.x - r <= pr.x + pr.w && ball.y >= pr.y && ball.y <= pr.y + pr.h && ball.dirx < 0) {
        ball.x = pr.x + pr.w + r;
        const offset = ((ball.y - pr.y) / pr.h) * 2 - 1;
        reflectOnPaddle(1, 0, offset);
      }
    }
    if (players.P2.alive) {
      const pr = paddleRect(players.P2, w, h);
      if (ball.x + r >= pr.x && ball.y >= pr.y && ball.y <= pr.y + pr.h && ball.dirx > 0) {
        ball.x = pr.x - r;
        const offset = ((ball.y - pr.y) / pr.h) * 2 - 1;
        reflectOnPaddle(-1, 0, offset);
      }
    }
    if (players.P3.alive) {
      const pr = paddleRect(players.P3, w, h);
      if (ball.y + r >= pr.y && ball.x >= pr.x && ball.x <= pr.x + pr.w && ball.diry > 0) {
        ball.y = pr.y - r;
        const offset = ((ball.x - pr.x) / pr.w) * 2 - 1;
        reflectOnPaddle(0, -1, offset);
      }
    }
  }

  // Declarar eliminación segura y ganar solo con 2 eliminados
  function eliminate(pid) {
    if (!players[pid].alive) return; // idempotente
    players[pid].alive = false;
    eliminatedCount += 1;
    updateAliveBadge();

    if (eliminatedCount >= 2) {
      // Hay solo 1 vivo -> ganador
      winner = Object.keys(players).find(k => players[k].alive) || '—';
      gameOver = true;
      setStatus('over', `¡Ganador: ${winner}! (R para reiniciar)`);
      elTimer.textContent = '—';
      return;
    }

    // Si aún quedan 2 o más vivos, nueva salida de balón
    resetRound(true);
    setStatus(warmup ? 'warmup' : 'live', warmup ? 'Calentamiento…' : '¡Partido en serio!');
  }

  // === Bucle ================================================================
  let last = performance.now();

  function frame(now) {
    const dt = Math.min(0.033, (now - last) / 1000);
    last = now;

    step(dt);
    draw();
    requestAnimationFrame(frame);
  }

  function step(dt) {
    if (gameOver) return;

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

    // mover bola y colisiones solo si no acaba de haber gol en este frame
    if (!goalJustHappened) {
      ball.speed = Math.min(ball.maxSpeed, ball.speed * (1 + ball.speedGrowth * dt));
      ball.x += ball.dirx * ball.speed * dt;
      ball.y += ball.diry * ball.speed * dt;

      handlePaddleCollisions();

      if (handleWallsAndGoals()) {
        goalJustHappened = true; // evita doble proceso
      }
    } else {
      // limpiamos el flag tras aplicar resetRound() en eliminate()
      goalJustHappened = false;
    }
  }

  // === Render ===============================================================
  function draw() {
    const w = W(), h = H();
    ctx.clearRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, w-2, h-2);

    ctx.fillStyle = '#e5e7eb';
    if (players.P1.alive) {
      const r1 = paddleRect(players.P1, w, h);
      roundRect(ctx, r1.x, r1.y, r1.w, r1.h, 6, true);
    } else drawSideGlow('left');

    if (players.P2.alive) {
      const r2 = paddleRect(players.P2, w, h);
      roundRect(ctx, r2.x, r2.y, r2.w, r2.h, 6, true);
    } else drawSideGlow('right');

    if (players.P3.alive) {
      const r3 = paddleRect(players.P3, w, h);
      roundRect(ctx, r3.x, r3.y, r3.w, r3.h, 6, true);
    } else drawSideGlow('bottom');

    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI*2);
    ctx.fill();

    if (warmup) drawBanner('CALENTAMIENTO', '#60a5fa');
    else if (gameOver) drawBanner(`GANADOR: ${winner}`, '#f87171');
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

  // Aviso de teclado sin Ñ
  setTimeout(() => {
    const isSpanish = Intl.DateTimeFormat().resolvedOptions().locale.toLowerCase().includes('es');
    if (!isSpanish) console.info('Sugerencia: si tu teclado no tiene "Ñ", usa ";" para P2 abajo.');
  }, 0);
})();
