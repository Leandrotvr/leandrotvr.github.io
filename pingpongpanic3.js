/* PING PONG PANIC 3 - 3 jugadores (fix audio + continuidad + coords px)
   - Audio robusto: cola de silbato/goles hasta que el usuario desbloquee sonido.
   - Tras primer gol el partido continúa; solo se elimina a quien recibe gol.
   - Pelota en píxeles siempre (centrado correcto).
   - Mantiene: emoji aleatorio, sonidos aleatorios (rebote/gol), 15s warmup,
               cuenta regresiva 3–2–1, silbato, “último en pie”.
*/
(() => {
  // === Utiles ===============================================================
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rand  = (a, b) => a + Math.random() * (b - a);
  const rint  = (a, b) => Math.floor(rand(a, b + 1));
  function randomUnitVector() {
    let x, y, m;
    do { const ang = rand(0, Math.PI * 2); x = Math.cos(ang); y = Math.sin(ang); m = Math.hypot(x, y); }
    while (Math.abs(x) < 0.35 && Math.abs(y) < 0.35);
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
    canvas.width = px; canvas.height = px;
    // Recentrar si estamos en cuenta atrás/inicio
    if (!startedInSerious && !gameOver) centerBall();
  }
  window.addEventListener('resize', fitInternalResolution);
  fitInternalResolution();

  const W = () => canvas.width, H = () => canvas.height;

  // === HUD ==================================================================
  const elStatus = document.getElementById('status');
  const elTimer  = document.getElementById('timer');
  const elAlive  = document.getElementById('alive');
  const setStatus = (mode, text) => { elStatus.className = `badge ${mode}`; elStatus.textContent = text; };
  function updateAliveBadge() {
    const vivos = [];
    if (players.P1.alive) vivos.push('P1');
    if (players.P2.alive) vivos.push('P2');
    if (players.P3.alive) vivos.push('P3');
    elAlive.textContent = `Vivos: ${vivos.join(',') || '—'}`;
  }

  // === Entidades ============================================================
  const paddleThickness = 14, paddleLen = 0.22, paddleSpeed = 480;
  const players = {
    P1: { side:'left',   alive:true, y:0.5, len:paddleLen, up:false,  down:false },
    P2: { side:'right',  alive:true, y:0.5, len:paddleLen, up:false,  down:false },
    P3: { side:'bottom', alive:true, x:0.5, len:paddleLen, left:false, right:false }
  };

  const EMOJIS = ['⚽','🏀','🏐','🎾','⚾','🏉','🥎','🏈'];
  let currentEmoji = EMOJIS[Math.floor(Math.random()*EMOJIS.length)];
  function rollEmoji(){ let e; do { e = EMOJIS[Math.floor(Math.random()*EMOJIS.length)]; } while (e === currentEmoji); currentEmoji = e; }

  const ball = { x: 0, y: 0, r: 10, dirx: 0, diry: 0, speed: 80, speedGrowth: 0.005, maxSpeed: 950 };
  function centerBall(){ ball.x = W()/2; ball.y = H()/2; }

  // estados
  let warmup = true, warmupLeft = 15.0;
  let countdownActive = false, countdownLeft = 0;
  let startedInSerious = false;
  let gameOver = false, winner = null;
  let eliminatedCount = 0, goalJustHappened = false;
  let emojiChangePending = false;

  function resetRound(keepEliminations = true) {
    if (!keepEliminations && emojiChangePending) { rollEmoji(); emojiChangePending = false; }
    centerBall();
    ball.speed = 80;
    const v = randomUnitVector(); ball.dirx = v.x; ball.diry = v.y;

    if (!keepEliminations) {
      players.P1.alive = players.P2.alive = players.P3.alive = true;
      eliminatedCount = 0; winner = null; gameOver = false;
      warmup = true; warmupLeft = 15.0; countdownActive = false; countdownLeft = 0; startedInSerious = false;
      setStatus('warmup','Calentamiento…'); elTimer.textContent = String(Math.ceil(warmupLeft));
    }
    updateAliveBadge(); goalJustHappened = false;
  }
  resetRound(true);

  // === Audio robusto ========================================================
  let audioCtx = null, master = null, audioReady = false, pending = [];
  function ensureAudio() {
    try {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        master = audioCtx.createGain(); master.gain.value = 0.6; master.connect(audioCtx.destination);
      }
      // Algunos navegadores requieren interacción antes de resume()
      const onResume = () => {
        audioCtx.resume().then(() => {
          audioReady = true;
          // drenar cola de sonidos pendientes
          const toPlay = pending.slice(); pending.length = 0;
          toPlay.forEach(fn => fn());
          window.removeEventListener('keydown', ensureAudioOnce);
          window.removeEventListener('mousedown', ensureAudioOnce);
          window.removeEventListener('touchstart', ensureAudioOnce);
        });
      };
      onResume();
    } catch { /* sin audio */ }
  }
  const ensureAudioOnce = () => ensureAudio();
  ['keydown','mousedown','touchstart'].forEach(ev => window.addEventListener(ev, ensureAudioOnce, {once:true}));

  function playOrQueue(fn){ if (audioReady) fn(); else pending.push(fn); }

  // Silbato
  function whistle() {
    playOrQueue(() => {
      try {
        const t0 = audioCtx.currentTime;
        const o1 = audioCtx.createOscillator(), g1 = audioCtx.createGain();
        const o2 = audioCtx.createOscillator(), g2 = audioCtx.createGain();
        o1.type='sine'; o2.type='sine';
        o1.frequency.setValueAtTime(1450, t0);
        o1.frequency.exponentialRampToValueAtTime(2200, t0+0.18);
        o2.frequency.setValueAtTime(900, t0);
        o2.frequency.exponentialRampToValueAtTime(1300, t0+0.18);
        g1.gain.setValueAtTime(0.0001, t0);
        g1.gain.exponentialRampToValueAtTime(0.35, t0+0.02);
        g1.gain.exponentialRampToValueAtTime(0.0001, t0+0.25);
        g2.gain.setValueAtTime(0.0001, t0);
        g2.gain.exponentialRampToValueAtTime(0.18, t0+0.02);
        g2.gain.exponentialRampToValueAtTime(0.0001, t0+0.22);
        o1.connect(g1).connect(master); o2.connect(g2).connect(master);
        o1.start(t0); o2.start(t0); o1.stop(t0+0.26); o2.stop(t0+0.24);
      } catch {}
    });
  }

  // Rebotes
  function playBounce(intensity = 0.5){
    playOrQueue(() => {
      try{
        const t = audioCtx.currentTime;
        const choice = rint(1,4);
        const pan = (audioCtx.createStereoPanner) ? audioCtx.createStereoPanner() : null;
        const gain = audioCtx.createGain();
        const v = 0.12 + 0.25 * Math.min(1, intensity);
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(v, t + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + rand(0.06, 0.14));
        let out = gain; if (pan){ pan.pan.value = rand(-0.5,0.5); out = pan; gain.connect(pan); }
        out.connect(master);

        if (choice === 1){
          const buffer = audioCtx.createBuffer(1, audioCtx.sampleRate*0.2, audioCtx.sampleRate);
          const data = buffer.getChannelData(0);
          for (let i=0;i<data.length;i++) data[i] = (Math.random()*2-1) * Math.pow(1 - i/data.length, 3);
          const src = audioCtx.createBufferSource(); src.buffer = buffer;
          const bp = audioCtx.createBiquadFilter(); bp.type='bandpass'; bp.frequency.value = rand(800,2000); bp.Q.value = rand(3,10);
          src.connect(bp).connect(gain); src.start(t);
        } else if (choice === 2){
          const o = audioCtx.createOscillator(); o.type=['sine','triangle'][rint(0,1)];
          o.frequency.setValueAtTime(rand(350,700), t);
          o.frequency.exponentialRampToValueAtTime(rand(600,1200), t+0.02);
          o.frequency.exponentialRampToValueAtTime(rand(250,500), t+0.08);
          o.connect(gain); o.start(t); o.stop(t+0.12);
        } else if (choice === 3){
          const o1 = audioCtx.createOscillator(), o2 = audioCtx.createOscillator();
          o1.type='square'; o2.type='triangle';
          const f = rand(500,900);
          o1.frequency.setValueAtTime(f, t); o2.frequency.setValueAtTime(f*1.2, t+0.004);
          const g1 = audioCtx.createGain(), g2 = audioCtx.createGain();
          g1.gain.setValueAtTime(0.0001, t); g1.gain.exponentialRampToValueAtTime(v*0.7, t+0.008); g1.gain.exponentialRampToValueAtTime(0.0001, t+0.07);
          g2.gain.setValueAtTime(0.0001, t+0.004); g2.gain.exponentialRampToValueAtTime(v*0.4, t+0.012); g2.gain.exponentialRampToValueAtTime(0.0001, t+0.06);
          o1.connect(g1).connect(gain); o2.connect(g2).connect(gain);
          o1.start(t); o2.start(t); o1.stop(t+0.08); o2.stop(t+0.07);
        } else {
          const noiseBuf = audioCtx.createBuffer(1, audioCtx.sampleRate*0.15, audioCtx.sampleRate);
          const d = noiseBuf.getChannelData(0); for (let i=0;i<d.length;i++) d[i] = (Math.random()*2-1) * Math.pow(1 - i/d.length, 2.5);
          const src = audioCtx.createBufferSource(); src.buffer = noiseBuf;
          const hp = audioCtx.createBiquadFilter(); hp.type='highpass'; hp.frequency.value = rand(1200,2200);
          src.connect(hp).connect(gain);
          const ping = audioCtx.createOscillator(); ping.type='sine'; ping.frequency.setValueAtTime(rand(900,1400), t);
          const gp = audioCtx.createGain(); gp.gain.value = v*0.3; ping.connect(gp).connect(gain);
          src.start(t); ping.start(t); src.stop(t+0.12); ping.stop(t+0.08);
        }
      } catch {}
    });
  }

  // Goles
  function playGoal(){
    playOrQueue(() => {
      try{
        const t = audioCtx.currentTime;
        const nb = audioCtx.createBuffer(1, audioCtx.sampleRate*0.5, audioCtx.sampleRate);
        const d = nb.getChannelData(0);
        for (let i=0;i<d.length;i++) d[i] = (Math.random()*2-1) * Math.pow(1 - i/d.length, 1.5);
        const src = audioCtx.createBufferSource(); src.buffer = nb;
        const bp = audioCtx.createBiquadFilter(); bp.type='bandpass'; bp.frequency.value = rand(400,1200); bp.Q.value = rand(2,6);
        const g = audioCtx.createGain();
        g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.7, t+0.02); g.gain.exponentialRampToValueAtTime(0.0001, t+0.35);
        src.connect(bp).connect(g).connect(master); src.start(t);
        const tones = rint(2,3);
        for (let k=0;k<tones;k++){
          const o = audioCtx.createOscillator(), gg = audioCtx.createGain();
          o.type = ['sine','triangle','square'][rint(0,2)];
          const f0 = rand(500,900), f1 = f0 * rand(0.45,0.7);
          const tt = t + k*0.05;
          o.frequency.setValueAtTime(f0, tt); o.frequency.exponentialRampToValueAtTime(f1, tt+0.25);
          gg.gain.setValueAtTime(0.0001, tt); gg.gain.exponentialRampToValueAtTime(0.4, tt+0.02); gg.gain.exponentialRampToValueAtTime(0.0001, tt+0.28);
          o.connect(gg).connect(master); o.start(tt); o.stop(tt+0.3);
        }
      } catch {}
    });
  }

  // === Controles ============================================================
  const down = new Set();
  const keymap = {
    q: () => { players.P1.up = true; }, a: () => { players.P1.down = true; },
    p: () => { players.P2.up = true; }, 'ñ': () => { players.P2.down = true; }, ';': () => { players.P2.down = true; },
    v: () => { players.P3.left = true; }, b: () => { players.P3.right = true; }
  };
  const keyupmap = {
    q: () => { players.P1.up = false; }, a: () => { players.P1.down = false; },
    p: () => { players.P2.up = false; }, 'ñ': () => { players.P2.down = false; }, ';': () => { players.P2.down = false; },
    v: () => { players.P3.left = false; }, b: () => { players.P3.right = false; },
    r: () => { if (gameOver) resetRound(false); }
  };
  window.addEventListener('keydown', e => { const k=e.key.toLowerCase(); if(down.has(k))return; down.add(k); (keymap[k]||(()=>{}))(); });
  window.addEventListener('keyup',   e => { const k=e.key.toLowerCase(); down.delete(k); (keyupmap[k]||(()=>{}))(); });

  // === Geometría palas ======================================================
  function paddleRect(p, w, h) {
    const L = Math.floor(p.len*h);
    if (p.side==='left'){ const cy=Math.floor(p.y*h); return {x:0,y:clamp(cy-L/2,0,h-L),w:paddleThickness,h:L}; }
    if (p.side==='right'){const cy=Math.floor(p.y*h); return {x:w-paddleThickness,y:clamp(cy-L/2,0,h-L),w:paddleThickness,h:L};}
    const Lx=Math.floor(p.len*w), cx=Math.floor(p.x*w);
    return {x:clamp(cx-Lx/2,0,w-Lx), y:h-paddleThickness, w:Lx, h:paddleThickness};
  }
  function movePaddles(dt){
    const w=W(),h=H(),dy=paddleSpeed*dt,dx=paddleSpeed*dt;
    if(players.P1.alive){ if(players.P1.up)players.P1.y-=dy/h; if(players.P1.down)players.P1.y+=dy/h; players.P1.y=clamp(players.P1.y,players.P1.len/2,1-players.P1.len/2); }
    if(players.P2.alive){ if(players.P2.up)players.P2.y-=dy/h; if(players.P2.down)players.P2.y+=dy/h; players.P2.y=clamp(players.P2.y,players.P2.len/2,1-players.P2.len/2); }
    if(players.P3.alive){ if(players.P3.left)players.P3.x-=dx/w; if(players.P3.right)players.P3.x+=dx/w; players.P3.x=clamp(players.P3.x,players.P3.len/2,1-players.P3.len/2); }
  }
  function reflectOnPaddle(nx,ny,hitOffset=0){
    const dot=ball.dirx*nx+ball.diry*ny;
    ball.dirx=ball.dirx-2*dot*nx; ball.diry=ball.diry-2*dot*ny;
    const tilt=clamp(hitOffset,-1,1)*0.35, c=Math.cos(tilt), s=Math.sin(tilt);
    const rx=ball.dirx*c-ball.diry*s, ry=ball.dirx*s+ball.diry*c, m=Math.hypot(rx,ry)||1;
    ball.dirx=rx/m; ball.diry=ry/m;
  }

  // === Goles / paredes (partido en serio) ==================================
  function handleWallsAndGoals(){
    const w=W(),h=H(),r=ball.r;
    if (ball.y - r <= 0){ ball.y = r; ball.diry = Math.abs(ball.diry); if (!countdownActive) playBounce(ball.speed/ball.maxSpeed); }
    if (ball.x - r <= 0){
      if (players.P1.alive && !warmup && !countdownActive){
        playGoal(); eliminate('P1'); return true;
      } else { ball.x = r; ball.dirx = Math.abs(ball.dirx); if (!countdownActive) playBounce(ball.speed/ball.maxSpeed); }
    }
    if (ball.x + r >= w){
      if (players.P2.alive && !warmup && !countdownActive){
        playGoal(); eliminate('P2'); return true;
      } else { ball.x = w - r; ball.dirx = -Math.abs(ball.dirx); if (!countdownActive) playBounce(ball.speed/ball.maxSpeed); }
    }
    if (ball.y + r >= h){
      if (players.P3.alive && !warmup && !countdownActive){
        playGoal(); eliminate('P3'); return true;
      } else { ball.y = h - r; ball.diry = -Math.abs(ball.diry); if (!countdownActive) playBounce(ball.speed/ball.maxSpeed); }
    }
    return false;
  }
  function handlePaddleCollisions(){
    const w=W(),h=H(),r=ball.r;
    if(players.P1.alive){ const pr=paddleRect(players.P1,w,h);
      if(ball.x - r <= pr.x + pr.w && ball.y>=pr.y && ball.y<=pr.y+pr.h && ball.dirx<0){
        ball.x=pr.x+pr.w+r; const off=((ball.y-pr.y)/pr.h)*2-1; reflectOnPaddle(1,0,off);
        if (!warmup && !countdownActive) playBounce(0.6 + 0.4*(ball.speed/ball.maxSpeed));
      }
    }
    if(players.P2.alive){ const pr=paddleRect(players.P2,w,h);
      if(ball.x + r >= pr.x && ball.y>=pr.y && ball.y<=pr.y+pr.h && ball.dirx>0){
        ball.x=pr.x-r; const off=((ball.y-pr.y)/pr.h)*2-1; reflectOnPaddle(-1,0,off);
        if (!warmup && !countdownActive) playBounce(0.6 + 0.4*(ball.speed/ball.maxSpeed));
      }
    }
    if(players.P3.alive){ const pr=paddleRect(players.P3,w,h);
      if(ball.y + r >= pr.y && ball.x>=pr.x && ball.x<=pr.x+pr.w && ball.diry>0){
        ball.y=pr.y-r; const off=((ball.x-pr.x)/pr.w)*2-1; reflectOnPaddle(0,-1,off);
        if (!warmup && !countdownActive) playBounce(0.6 + 0.4*(ball.speed/ball.maxSpeed));
      }
    }
  }

  // === Rebotes de calentamiento (sin goles/sonidos) =========================
  function warmupWallsBounce(){
    const w=W(),h=H(),r=ball.r;
    if (ball.y - r <= 0){ ball.y = r; ball.diry = Math.abs(ball.diry); }
    if (ball.x - r <= 0){ ball.x = r; ball.dirx = Math.abs(ball.dirx); }
    if (ball.x + r >= w){ ball.x = w - r; ball.dirx = -Math.abs(ball.dirx); }
    if (ball.y + r >= h){ ball.y = h - r; ball.diry = -Math.abs(ball.diry); }
  }
  function warmupPaddleCollisions(){
    const w=W(),h=H(),r=ball.r;
    if(players.P1.alive){ const pr=paddleRect(players.P1,w,h);
      if(ball.x - r <= pr.x + pr.w && ball.y>=pr.y && ball.y<=pr.y+pr.h && ball.dirx<0){ ball.x=pr.x+pr.w+r; const off=((ball.y-pr.y)/pr.h)*2-1; reflectOnPaddle(1,0,off); }
    }
    if(players.P2.alive){ const pr=paddleRect(players.P2,w,h);
      if(ball.x + r >= pr.x && ball.y>=pr.y && ball.y<=pr.y+pr.h && ball.dirx>0){ ball.x=pr.x-r; const off=((ball.y-pr.y)/pr.h)*2-1; reflectOnPaddle(-1,0,off); }
    }
    if(players.P3.alive){ const pr=paddleRect(players.P3,w,h);
      if(ball.y + r >= pr.y && ball.x>=pr.x && ball.x<=pr.x+pr.w && ball.diry>0){ ball.y=pr.y-r; const off=((ball.x-pr.x)/pr.w)*2-1; reflectOnPaddle(0,-1,off); }
    }
  }

  // === Eliminación / ganador ===============================================
  function eliminate(pid){
    if(!players[pid].alive) return;
    players[pid].alive=false; eliminatedCount++; updateAliveBadge();
    if (eliminatedCount >= 2){
      winner = Object.keys(players).find(k=>players[k].alive) || '—';
      gameOver = true; setStatus('over', `¡Ganador: ${winner}! (R para reiniciar)`); elTimer.textContent='—';
      emojiChangePending = true;
      return;
    }
    // continuar partido con vivos
    resetRound(true);
    startedInSerious = true;
    setStatus('live', '¡Partido en serio!');
  }

  // === Bucle ================================================================
  let last = performance.now();
  function frame(now){ const dt = Math.min(0.033, (now-last)/1000); last=now; step(dt); draw(); requestAnimationFrame(frame); }

  function step(dt){
    if (gameOver) return;

    if (warmup){
      warmupLeft -= dt;
      elTimer.textContent = String(Math.max(1, Math.ceil(warmupLeft)));
      movePaddles(dt);
      const warmupSpeed = 90;
      ball.x += ball.dirx * warmupSpeed * dt;
      ball.y += ball.diry * warmupSpeed * dt;
      warmupPaddleCollisions();
      warmupWallsBounce();

      if (warmupLeft <= 0){
        warmup = false;
        centerBall();
        const v = randomUnitVector(); ball.dirx = v.x; ball.diry = v.y;
        countdownActive = true; countdownLeft = 3.0; startedInSerious = false;
        setStatus('live', 'Preparados…');
      }
      return;
    }

    if (countdownActive){
      countdownLeft -= dt;
      elTimer.textContent = String(Math.max(1, Math.ceil(countdownLeft)));
      if (countdownLeft <= 0){
        countdownActive = false; elTimer.textContent = '—';
        setStatus('live','¡Partido en serio!'); whistle();
        startedInSerious = true;
      }
      return;
    }

    // Partido en serio
    movePaddles(dt);
    if (!goalJustHappened){
      ball.speed = Math.min(ball.maxSpeed, ball.speed * (1 + ball.speedGrowth * dt));
      ball.x += ball.dirx * ball.speed * dt;
      ball.y += ball.diry * ball.speed * dt;
      handlePaddleCollisions();
      if (handleWallsAndGoals()) goalJustHappened = true;
    } else { goalJustHappened = false; }
  }

  // === Render ===============================================================
  function draw(){
    const w=W(), h=H();
    ctx.clearRect(0,0,w,h);
    ctx.strokeStyle='rgba(255,255,255,0.15)'; ctx.lineWidth=2; ctx.strokeRect(1,1,w-2,h-2);

    ctx.fillStyle='#e5e7eb';
    if (players.P1.alive){ const r1=paddleRect(players.P1,w,h); roundRect(ctx,r1.x,r1.y,r1.w,r1.h,6,true); } else drawSideGlow('left');
    if (players.P2.alive){ const r2=paddleRect(players.P2,w,h); roundRect(ctx,r2.x,r2.y,r2.w,r2.h,6,true); } else drawSideGlow('right');
    if (players.P3.alive){ const r3=paddleRect(players.P3,w,h); roundRect(ctx,r3.x,r3.y,r3.w,r3.h,6,true); } else drawSideGlow('bottom');

    const fontSize = Math.floor(ball.r * 3.2);
    ctx.font = `${fontSize}px system-ui, "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(currentEmoji, ball.x, ball.y);

    if (warmup) drawBanner('CALENTAMIENTO', '#60a5fa');
    else if (countdownActive) drawBanner(String(Math.ceil(countdownLeft)), '#34d399');
    else if (gameOver) drawBanner(`GANADOR: ${winner}`, '#f87171');
  }

  function roundRect(ctx,x,y,w,h,r=6,fill=true){
    const rr=Math.min(r,w/2,h/2);
    ctx.beginPath();
    ctx.moveTo(x+rr,y);
    ctx.arcTo(x+w,y,x+w,y+h,rr);
    ctx.arcTo(x+w,y+h,x,y+h,rr);
    ctx.arcTo(x,y+h,x,y,rr);
    ctx.arcTo(x,y,x+w,y,rr);
    if(fill) ctx.fill();
  }
  function drawBanner(text,color){
    const w=W(),h=H();
    ctx.save();
    ctx.globalAlpha=0.85; ctx.fillStyle='rgba(0,0,0,0.35)'; ctx.fillRect(0,h*0.42,w,h*0.16);
    ctx.globalAlpha=1; ctx.fillStyle=color;
    ctx.font=`${Math.floor(h*0.08)}px system-ui, sans-serif`;
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(text,w/2,h/2); ctx.restore();
  }
  function drawSideGlow(side){
    const w=W(),h=H();
    const g=ctx.createLinearGradient(side==='left'?0:side==='right'?w:0, side==='bottom'?h:0, side==='left'?40:side==='right'?w-40:0, side==='bottom'?h-40:0);
    g.addColorStop(0,'rgba(248,113,113,0.28)'); g.addColorStop(1,'rgba(248,113,113,0.03)');
    ctx.fillStyle=g;
    if(side==='left')ctx.fillRect(0,0,40,h);
    if(side==='right')ctx.fillRect(w-40,0,40,h);
    if(side==='bottom')ctx.fillRect(0,h-40,w,40);
  }

  requestAnimationFrame(frame);

  // Tip teclado sin Ñ
  setTimeout(()=>{ const isEs=Intl.DateTimeFormat().resolvedOptions().locale.toLowerCase().includes('es'); if(!isEs) console.info('Tip: si tu teclado no tiene "Ñ", usa ";" para P2 abajo.'); },0);
})();
