/* Pong4 — minimalista, 100% pantalla, 4 palas
   - Palas = 1/3 del lado. Controles: P1 QA, P2 XC, P3 NM, P4 PÑ(;).
   - Gol elimina ese lado; gana el último en pie (3 eliminados).
   - Bola acelera poco a poco y SE REINICIA al mínimo TRAS CADA ELIMINACIÓN.
*/
(() => {
  // Utilidades
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const rand=(a,b)=>a+Math.random()*(b-a);
  function unitVec(){
    let x,y,m; do{const a=rand(0,Math.PI*2); x=Math.cos(a); y=Math.sin(a); m=Math.hypot(x,y);}
    while(Math.abs(x)<0.35 && Math.abs(y)<0.35); return {x:x/m,y:y/m};
  }

  // Canvas / HUD
  const canvas=document.getElementById('game'), ctx=canvas.getContext('2d');
  const statusEl=document.getElementById('status'), timerEl=document.getElementById('timer'), aliveEl=document.getElementById('alive');
  const setStatus=(cls,txt)=>{ statusEl.className=`badge ${cls}`; statusEl.textContent=txt; };

  function fit(){ const dpr=devicePixelRatio||1; canvas.width=Math.floor(innerWidth*dpr); canvas.height=Math.floor(innerHeight*dpr); }
  addEventListener('resize',fit,{passive:true}); fit();
  const W=()=>canvas.width, H=()=>canvas.height;

  // Parámetros
  const PADDLE_LEN_FRAC = 1/3; // 1/3 del lado
  const PADDLE_THICK_FR = 0.018; // relativo al minDim
  const PADDLE_SPEED_FR = 0.85;  // fracción de lado/seg
  const BALL_R_FR   = 0.012;
  const BALL_V0_FR  = 0.07;   // velocidad base muy lenta
  const BALL_GROWTH = 0.010;  // aceleración exponencial suave
  const BALL_VMAX_FR= 1.2;    // límite superior

  // Estado jugadores
  const players = {
    P1:{side:'left',  alive:true, pos:0.5, up:false,  down:false}, // QA
    P2:{side:'top',   alive:true, pos:0.5, left:false,right:false}, // XC
    P3:{side:'bottom',alive:true, pos:0.5, left:false,right:false}, // NM
    P4:{side:'right', alive:true, pos:0.5, up:false,  down:false}, // PÑ(;)
  };
  const updateAlive=()=> aliveEl.textContent=`Vivos: ${Object.keys(players).filter(k=>players[k].alive).join(',')}`;

  // Pelota
  const ball={x:0,y:0,r:0,dx:0,dy:0,speed:0};
  const center=()=>{ ball.x=W()/2; ball.y=H()/2; };
  const serveSlow=()=>{ // === clave: reinicia velocidad tras cada eliminación
    const md=Math.min(W(),H());
    const v=unitVec(); ball.dx=v.x; ball.dy=v.y;
    ball.speed = BALL_V0_FR * md;
    center();
  };

  // Partida
  let warmup=true, warmLeft=3, over=false, winner=null, eliminated=0, justScored=false;

  function resetRound(keep=true){
    const md=Math.min(W(),H());
    ball.r=Math.max(6,Math.round(md*BALL_R_FR));
    serveSlow(); // siempre empezar lento
    if(!keep){
      Object.values(players).forEach(p=>p.alive=true);
      eliminated=0; over=false; winner=null; warmup=true; warmLeft=3;
      setStatus('live','Preparados…'); timerEl.textContent='3'; updateAlive();
    }
  }
  resetRound(false);

  // Controles
  const down=new Set();
  addEventListener('keydown',e=>{
    const k=e.key.toLowerCase(); if(k==='ñ'||k===';') e.preventDefault();
    if(down.has(k)) return; down.add(k);
    switch(k){
      case 'q': players.P1.up=true; break;   case 'a': players.P1.down=true; break;
      case 'x': players.P2.left=true; break; case 'c': players.P2.right=true; break;
      case 'n': players.P3.left=true; break; case 'm': players.P3.right=true; break;
      case 'p': players.P4.up=true; break;   case 'ñ': case ';': players.P4.down=true; break;
      case 'r': if(over) resetRound(false); break;
    }
  },{passive:false});
  addEventListener('keyup',e=>{
    const k=e.key.toLowerCase(); down.delete(k);
    switch(k){
      case 'q': players.P1.up=false; break;   case 'a': players.P1.down=false; break;
      case 'x': players.P2.left=false; break; case 'c': players.P2.right=false; break;
      case 'n': players.P3.left=false; break; case 'm': players.P3.right=false; break;
      case 'p': players.P4.up=false; break;   case 'ñ': case ';': players.P4.down=false; break;
    }
  },{passive:false});

  // Geometría palas
  function paddleRect(p){
    const w=W(),h=H(),md=Math.min(w,h),th=Math.max(8,Math.round(md*PADDLE_THICK_FR));
    if(p.side==='left'||p.side==='right'){
      const len=Math.round(h*PADDLE_LEN_FRAC);
      const y=clamp(Math.round(p.pos*h-len/2),0,h-len);
      const x=(p.side==='left')?0:w-th;
      return{x,y,w:th,h:len};
    }else{
      const len=Math.round(w*PADDLE_LEN_FRAC);
      const x=clamp(Math.round(p.pos*w-len/2),0,w-len);
      const y=(p.side==='top')?0:h-th;
      return{x,y,w:len,h:th};
    }
  }
  function movePaddles(dt){
    const v=PADDLE_SPEED_FR;
    if(players.P1.alive){ if(players.P1.up)players.P1.pos-=v*dt; if(players.P1.down)players.P1.pos+=v*dt; players.P1.pos=clamp(players.P1.pos,PADDLE_LEN_FRAC/2,1-PADDLE_LEN_FRAC/2); }
    if(players.P4.alive){ if(players.P4.up)players.P4.pos-=v*dt; if(players.P4.down)players.P4.pos+=v*dt; players.P4.pos=clamp(players.P4.pos,PADDLE_LEN_FRAC/2,1-PADDLE_LEN_FRAC/2); }
    if(players.P2.alive){ if(players.P2.left)players.P2.pos-=v*dt; if(players.P2.right)players.P2.pos+=v*dt; players.P2.pos=clamp(players.P2.pos,PADDLE_LEN_FRAC/2,1-PADDLE_LEN_FRAC/2); }
    if(players.P3.alive){ if(players.P3.left)players.P3.pos-=v*dt; if(players.P3.right)players.P3.pos+=v*dt; players.P3.pos=clamp(players.P3.pos,PADDLE_LEN_FRAC/2,1-PADDLE_LEN_FRAC/2); }
  }

  // Colisiones
  function reflect(nx,ny,tilt=0){
    const dot=ball.dx*nx+ball.dy*ny; ball.dx-=2*dot*nx; ball.dy-=2*dot*ny;
    const c=Math.cos(tilt), s=Math.sin(tilt);
    const rx=ball.dx*c-ball.dy*s, ry=ball.dx*s+ball.dy*c, m=Math.hypot(rx,ry)||1;
    ball.dx=rx/m; ball.dy=ry/m;
  }
  function collidePaddles(){
    const r=ball.r;
    if(players.P1.alive){ const pr=paddleRect(players.P1);
      if(ball.x-r<=pr.x+pr.w && ball.y>=pr.y && ball.y<=pr.y+pr.h && ball.dx<0){ ball.x=pr.x+pr.w+r; const t=((ball.y-pr.y)/pr.h)*2-1; reflect(1,0,t*0.35); }
    }
    if(players.P4.alive){ const pr=paddleRect(players.P4);
      if(ball.x+r>=pr.x && ball.y>=pr.y && ball.y<=pr.y+pr.h && ball.dx>0){ ball.x=pr.x-r; const t=((ball.y-pr.y)/pr.h)*2-1; reflect(-1,0,t*0.35); }
    }
    if(players.P2.alive){ const pr=paddleRect(players.P2);
      if(ball.y-r<=pr.y+pr.h && ball.x>=pr.x && ball.x<=pr.x+pr.w && ball.dy<0){ ball.y=pr.y+pr.h+r; const t=((ball.x-pr.x)/pr.w)*2-1; reflect(0,1,t*0.35); }
    }
    if(players.P3.alive){ const pr=paddleRect(players.P3);
      if(ball.y+r>=pr.y && ball.x>=pr.x && ball.x<=pr.x+pr.w && ball.dy>0){ ball.y=pr.y-r; const t=((ball.x-pr.x)/pr.w)*2-1; reflect(0,-1,t*0.35); }
    }
  }
  function wallsAndGoals(){
    const r=ball.r,w=W(),h=H();
    if(ball.y-r<=0){ if(players.P2.alive && !warmup) return goal('P2'); ball.y=r; ball.dy=Math.abs(ball.dy); }
    if(ball.x-r<=0){ if(players.P1.alive && !warmup) return goal('P1'); ball.x=r; ball.dx=Math.abs(ball.dx); }
    if(ball.x+r>=w){ if(players.P4.alive && !warmup) return goal('P4'); ball.x=w-r; ball.dx=-Math.abs(ball.dx); }
    if(ball.y+r>=h){ if(players.P3.alive && !warmup) return goal('P3'); ball.y=h-r; ball.dy=-Math.abs(ball.dy); }
    return false;
  }
  function goal(pid){
    if(!players[pid].alive) return false;
    players[pid].alive=false; eliminated++; updateAlive();
    if(eliminated>=3){
      winner=Object.keys(players).find(k=>players[k].alive)||'—';
      over=true; setStatus('over',`¡Ganador: ${winner}! (R reinicia)`); timerEl.textContent='—';
      return true;
    }
    // === clave: tras eliminar, saque lento (reinicia aceleración)
    setStatus('live',`Gol a ${pid}. ¡Sigue!`);
    serveSlow();
    // evitar re-gol inmediato un frame
    justScored=true;
    return true;
  }

  // Bucle
  let last=performance.now();
  function loop(t){
    const dt=Math.min(0.033,(t-last)/1000); last=t;

    if(over){ draw(); return requestAnimationFrame(loop); }

    if(warmup){
      warmLeft-=dt; timerEl.textContent=String(Math.max(1,Math.ceil(warmLeft)));
      if(warmLeft<=0){ warmup=false; setStatus('live','¡A jugar!'); timerEl.textContent='—'; }
      center(); draw(); return requestAnimationFrame(loop);
    }

    movePaddles(dt);
    if(!justScored){
      // Acelera poco a poco hasta la siguiente eliminación
      const md=Math.min(W(),H());
      ball.speed=Math.min(BALL_VMAX_FR*md, ball.speed*(1+BALL_GROWTH*dt));
      ball.x+=ball.dx*ball.speed*dt; ball.y+=ball.dy*ball.speed*dt;
      collidePaddles(); wallsAndGoals();
    } else {
      justScored=false; // un frame de gracia
    }

    draw(); requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  // Render
  function draw(){
    const w=W(),h=H();
    ctx.clearRect(0,0,w,h);
    const g=ctx.createLinearGradient(0,0,w,h); g.addColorStop(0,'#0b0f14'); g.addColorStop(1,'#10161f');
    ctx.fillStyle=g; ctx.fillRect(0,0,w,h);

    ctx.strokeStyle='rgba(255,255,255,0.12)'; ctx.lineWidth=Math.max(2,Math.round(Math.min(w,h)*0.003));
    ctx.strokeRect(1,1,w-2,h-2);

    ctx.setLineDash([8,8]); ctx.beginPath(); ctx.moveTo(w/2,10); ctx.lineTo(w/2,h-10);
    ctx.strokeStyle='rgba(255,255,255,0.08)'; ctx.stroke(); ctx.setLineDash([]);

    ctx.fillStyle='#e5e7eb';
    for(const k of ['P1','P2','P3','P4']){
      const p=players[k], r=paddleRect(p);
      if(p.alive) roundRect(r.x,r.y,r.w,r.h,6,true); else sideGlow(p.side);
    }

    ctx.beginPath(); ctx.arc(ball.x,ball.y,ball.r,0,Math.PI*2); ctx.fillStyle='#fff'; ctx.fill();

    if(over) banner(`GANADOR: ${winner}`);
    else if(warmup) banner(`Preparados… ${Math.max(1,Math.ceil(warmupLeft))}`);
  }
  function roundRect(x,y,w,h,r=6,fill=true){
    const rr=Math.min(r,w/2,h/2);
    ctx.beginPath();
    ctx.moveTo(x+rr,y);
    ctx.arcTo(x+w,y,x+w,y+h,rr);
    ctx.arcTo(x+w,y+h,x,y+h,rr);
    ctx.arcTo(x,y+h,x,y,rr);
    ctx.arcTo(x,y,x+w,y,rr);
    if(fill) ctx.fill();
  }
  function sideGlow(side){
    const w=W(),h=H(); ctx.save(); ctx.globalAlpha=0.18; ctx.fillStyle='#f87171';
    if(side==='left')ctx.fillRect(0,0,Math.max(24,w*0.03),h);
    if(side==='right')ctx.fillRect(w-Math.max(24,w*0.03),0,Math.max(24,w*0.03),h);
    if(side==='top')ctx.fillRect(0,0,w,Math.max(24,h*0.03));
    if(side==='bottom')ctx.fillRect(0,h-Math.max(24,h*0.03),w,Math.max(24,h*0.03));
    ctx.restore();
  }
  function banner(text){
    const w=W(),h=H(); ctx.save();
    ctx.globalAlpha=0.85; ctx.fillStyle='rgba(0,0,0,0.42)';
    ctx.fillRect(w*0.15,h*0.42,w*0.70,h*0.16);
    ctx.globalAlpha=1; ctx.fillStyle='#60a5fa';
    ctx.font=`${Math.floor(h*0.08)}px system-ui, sans-serif`;
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(text,w/2,h/2); ctx.restore();
  }
})();
