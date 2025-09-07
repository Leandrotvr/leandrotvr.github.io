/* ===== CONFIG ===== */
const W=900,H=520;
const PADDLE_H=110,PADDLE_W=14;
const PADDLE_BOTTOM_W=120,PADDLE_BOTTOM_H=14;
const PADDLE_SPEED=6;
let   BALL_SPEED=5.2;
const BALL_MAX_SPEED=15;
const BALL_ACCEL=1.045;
const ROUND_TIME=60_000;

/* ===== DOM ===== */
const canvas=document.getElementById('game');
const ctx=canvas.getContext('2d');
const hud={s1:byId('s1'),s2:byId('s2'),s3:byId('s3'),t:byId('time'),status:byId('status')};
function byId(id){return document.getElementById(id)}

/* ===== INPUT ===== */
const keys=new Set();
window.addEventListener('keydown',e=>keys.add(e.key.toLowerCase()));
window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));

/* ===== STATE ===== */
let running=false,last=0,timeLeft=ROUND_TIME;
let scores={p1:0,p2:0,p3:0};
let fieldTheme,ballSkin,caric1,caric2,caric3;

const p1={x:24,y:H/2-PADDLE_H/2,w:PADDLE_W,h:PADDLE_H};
const p2={x:W-24-PADDLE_W,y:H/2-PADDLE_H/2,w:PADDLE_W,h:PADDLE_H};
const p3={x:W/2-PADDLE_BOTTOM_W/2,y:H-24-PADDLE_BOTTOM_H,w:PADDLE_BOTTOM_W,h:PADDLE_BOTTOM_H};

let ball=resetBall();

/* ===== UI ===== */
byId('btnStart').onclick=()=>{ if(!running){ running=true; hud.status.textContent='Jugando'; requestAnimationFrame(loop);} };
byId('btnPause').onclick =()=>{ running=false; hud.status.textContent='Pausa'; };
byId('btnReset').onclick =()=> resetAll();

/* ===== TAUNTS (20 frases + 20 anims) ===== */
const TAUNTS=[
 "¡Afuera los que no sirven!","¿Otra vez? 😂","¡Poné las pilas! 😜","Manos de manteca 🧈",
 "Eso fue triste… 😢","Te durmieron 😴","Sin manos 🤲","Qué nivel, eh… 👀",
 "Esa dolió 💥","Uy, uy, uy… 🙈","Nice try! 😉","Too slow! 🐌",
 "Better luck next time! 🍀","Get gud! 😎","Oops! 💫","Try harder! 💪",
 "You got roasted! 🔥","Embarrassing… 😬","Qué papelón 🤡","Se te cayó el wifi 📶"
];
const TAUNT_ANIMS=[
 "shake","wiggle","bounce","pop","spin","wobble","slideL","slideR","slideU","slideD",
 "jelly","pulse","skew","flipX","flipY","swing","breath","rainbow","spark","zoom"
];
let taunt=null; // {texto,x,y,t0,anim,ttl,color}

/* ===== AUDIO (20 SFX con WebAudio) ===== */
const AudioCtx=window.AudioContext||window.webkitAudioContext;
const actx=new AudioCtx();
function beep({type='sine',f=440,d=0.08,g=0.2,slide=0}={}){
  const o=actx.createOscillator(), v=actx.createGain();
  o.type=type; o.frequency.setValueAtTime(f,actx.currentTime);
  if(slide) o.frequency.exponentialRampToValueAtTime(Math.max(50,f*slide), actx.currentTime+d);
  v.gain.setValueAtTime(0,actx.currentTime); v.gain.linearRampToValueAtTime(g,actx.currentTime+0.01);
  v.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime+d);
  o.connect(v).connect(actx.destination); o.start(); o.stop(actx.currentTime+d);
}
function noise({d=0.12,g=0.2,lp=1200}={}){
  const buffer=actx.createBuffer(1, actx.sampleRate*d, actx.sampleRate);
  const data=buffer.getChannelData(0); for(let i=0;i<data.length;i++) data[i]=Math.random()*2-1;
  const src=actx.createBufferSource(); src.buffer=buffer;
  const biq=actx.createBiquadFilter(); biq.type='lowpass'; biq.frequency.value=lp;
  const v=actx.createGain(); v.gain.value=g;
  src.connect(biq).connect(v).connect(actx.destination); src.start();
}
const SOUND_FUNS=[
 ()=>beep({type:'square',f:520,slide:0.5}),
 ()=>beep({type:'triangle',f:330,d:0.12}),
 ()=>beep({type:'sawtooth',f:260,d:0.1}),
 ()=>beep({type:'sine',f:880,d:0.06}),
 ()=>{beep({type:'square',f:700,d:0.05}); setTimeout(()=>beep({type:'square',f:500,d:0.05}),60);},
 ()=>noise({d:0.08,lp:1000}),
 ()=>{beep({type:'triangle',f:400,d:0.05}); noise({d:0.05,lp:1800})},
 ()=>beep({type:'sine',f:300,slide:0.6}),
 ()=>beep({type:'sawtooth',f:200,slide:0.4}),
 ()=>noise({d:0.12,lp:800}),
 ()=>beep({type:'square',f:440,d:0.08}),
 ()=>beep({type:'triangle',f:540,d:0.08}),
 ()=>beep({type:'square',f:180,d:0.06}),
 ()=>beep({type:'sine',f:650,d:0.07}),
 ()=>beep({type:'sawtooth',f:900,d:0.04}),
 ()=>noise({d:0.06,lp:500}),
 ()=>{beep({type:'sine',f:500,d:0.03}); setTimeout(()=>beep({type:'sine',f:600,d:0.03}),40);},
 ()=>{noise({d:0.04,lp:1500}); setTimeout(()=>beep({type:'triangle',f:700,d:0.04}),50);},
 ()=>beep({type:'triangle',f:260,d:0.09,slide:0.7}),
 ()=>beep({type:'square',f:360,d:0.09,slide:0.5})
];
// ambiente cada 6–12 s
let nextAmbience=Date.now()+rnd(6000,12000);

/* ===== DISEÑOS (20/20/20) ===== */
const CARICATURES=[...Array(20)].map((_,i)=>({
  body: palette(i).body, eye: palette(i).eye, mouth: palette(i).mouth,
  hat: i%4===0, beard: i%5===0, blush: i%3===0, emoji: ["😜","😏","🤪","😬","🤡","🧐","😈","😉","😂","🥴","🤭","😹","🙃","😎","😝","😛","🤠","🫠","😤","😇"][i]
}));
function palette(i){
  const bodies=['#ffb703','#90be6d','#ff6b6b','#ffd166','#4cc9f0','#f72585','#b5179e','#4361ee','#3a86ff','#06d6a0','#f94144','#90e0ef','#00b4d8','#ff9f1c','#d0ebff','#b8c0ff','#caffbf','#ffd6a5','#e9ff70','#ffadad'];
  const eyes  =['#1b1b1b','#0f172a','#000','#222','#101010','#1a1a1a','#2b2b2b','#111','#050505','#000','#111','#1a1a1a','#151515','#000','#0a0a0a','#121212','#060606','#0e0e0e','#1d1d1d','#000'];
  const mouths=['#7c3f00','#6d6875','#7a1e00','#6a040f','#3a0ca3','#ff006e','#003566','#641220','#720026','#e85d04','#9d0208','#370617','#1b263b','#3a5a40','#001219','#3d405b','#1d3557','#5a189a','#8338ec','#2a9d8f'];
  return {body:bodies[i%20], eye:eyes[i%20], mouth:mouths[i%20]};
}
const BALL_SKINS=[
  'classic','stripe','target','yin','tri','quad','emoji','star','soccer','beach',
  'ring','dotgrid','candy','smile','bolt','moon','sun','checker','swirl','caps'
];
const FIELD_THEMES=[
  ['#0c1530','#2b375a','#3b4a7a'],['#2b2a33','#7c7b86','#bcbad1'],['#1b2d2a','#3a5a40','#a3b18a'],
  ['#2d132c','#801336','#c72c41'],['#1d3557','#457b9d','#a8dadc'],['#0b090a','#3a0ca3','#f72585'],
  ['#0a0f0d','#0b6e4f','#6bbf59'],['#0b132b','#1c2541','#5bc0be'],['#331e36','#413c58','#a3c4f3'],
  ['#201e1f','#5f0f40','#fb8b24'],['#080708','#3772ff','#df2935'],['#001219','#005f73','#94d2bd'],
  ['#22162b','#451f55','#f6d743'],['#2f1d2e','#5c2751','#f7b2bd'],['#1a1423','#3d314a','#bfc0c0'],
  ['#161a1d','#660708','#ba181b'],['#0f110c','#23231a','#8daa9d'],['#001233','#001845','#ffd60a'],
  ['#111d4a','#06bcee','#ffd166'],['#1f2041','#ffc857','#e9724c']
];

/* ===== LOOP ===== */
function loop(ts){
  if(!running) return;
  if(!last) last=ts;
  const dt=ts-last; last=ts;
  update(dt); draw();
  if(running) requestAnimationFrame(loop);
}

/* ===== UPDATE ===== */
function update(dt){
  // tiempo
  timeLeft-=dt;
  if(timeLeft<=0){ timeLeft=0; running=false; finalizar(); }
  hud.t.textContent=(timeLeft/1000).toFixed(1);

  // input
  if(keys.has('q')) p1.y-=PADDLE_SPEED;
  if(keys.has('a')) p1.y+=PADDLE_SPEED;
  if(keys.has('p')) p2.y-=PADDLE_SPEED;
  if(keys.has('ñ')) p2.y+=PADDLE_SPEED;
  if(keys.has('v')) p3.x-=PADDLE_SPEED;
  if(keys.has('b')) p3.x+=PADDLE_SPEED;

  // límites
  p1.y=clamp(p1.y,12,H-p1.h-120);
  p2.y=clamp(p2.y,12,H-p2.h-120);
  p3.x=clamp(p3.x,12,W-p3.w-12);

  // pelota
  ball.x+=ball.vx; ball.y+=ball.vy;

  // pared superior
  if(ball.y<=12){ ball.y=12; ball.vy*=-1; playHitWall(); }

  // goles
  if(ball.x<0){ scores.p1++; actualizarScores(); punto('P1',p1); return; }
  if(ball.x>W){ scores.p2++; actualizarScores(); punto('P2',p2); return; }
  if(ball.y>H){ scores.p3++; actualizarScores(); punto('P3',p3); return; }

  // colisiones
  if(collides(ball,p1)){ reflectFromVerticalPaddle(ball,p1); playHitPaddle(); }
  if(collides(ball,p2)){ reflectFromVerticalPaddle(ball,p2); playHitPaddle(); }
  if(collides(ball,p3)){ reflectFromHorizontalPaddle(ball,p3); playHitPaddle(); }

  // taunt vida
  if(taunt && Date.now()-taunt.t0>taunt.ttl) taunt=null;

  // sonidos ambiente
  if(Date.now()>nextAmbience){ rand(SOUND_FUNS)(); nextAmbience=Date.now()+rnd(6000,12000); }
}

/* ===== DRAW ===== */
function draw(){
  // campo
  drawFieldTheme(fieldTheme);

  // palas caricaturas
  drawCaricaturePaddle(p1,caric1,'L');
  drawCaricaturePaddle(p2,caric2,'R');
  drawCaricaturePaddle(p3,caric3,'B');

  // pelota
  drawBall(ball,ballSkin);

  // zona P3
  ctx.strokeStyle='#ffffff22'; ctx.lineWidth=2; ctx.strokeRect(12,H-120,W-24,108);

  // burla
  if(taunt) drawTaunt();
}

/* ===== COLLISION ===== */
function collides(b,p){ return b.x+b.r>p.x && b.x-b.r<p.x+p.w && b.y+b.r>p.y && b.y-b.r<p.y+p.h; }
function reflectFromVerticalPaddle(b,p){
  if(b.vx<0) b.x=p.x+p.w+b.r; else b.x=p.x-b.r;
  const hit=(b.y-(p.y+p.h/2))/(p.h/2);
  b.vx=-b.vx*BALL_ACCEL; b.vy+=hit*2.2; limitBallSpeed(b);
}
function reflectFromHorizontalPaddle(b,p){
  if(b.vy>0) b.y=p.y-b.r; else b.y=p.y+p.h+b.r;
  const hit=(b.x-(p.x+p.w/2))/(p.w/2);
  b.vy=-b.vy*BALL_ACCEL; b.vx+=hit*2.2; limitBallSpeed(b);
}
function limitBallSpeed(b){
  const s=Math.hypot(b.vx,b.vy);
  if(s>BALL_MAX_SPEED){ b.vx*=BALL_MAX_SPEED/s; b.vy*=BALL_MAX_SPEED/s; }
}

/* ===== GOAL ===== */
function punto(player,paddle){
  BALL_SPEED*=1.08;
  hud.status.textContent=`Afuera los que no sirven (${player})`;
  const texto=rand(TAUNTS);
  taunt={texto,x:paddle.x+paddle.w/2,y:paddle.y-12,t0:Date.now(),ttl:1500,anim:rand(TAUNT_ANIMS),color:'#ff4b82'};
  if(player==='P1') taunt.x=paddle.x+60;
  if(player==='P2') taunt.x=paddle.x-60;
  if(player==='P3') taunt.y=paddle.y-20;

  rand(SOUND_FUNS)(); setTimeout(()=>rand(SOUND_FUNS)(),100);

  ball=resetBall();
}

/* ===== RESET ===== */
function resetBall(){
  const a=randomAngle();
  return {x:W/2,y:H/2-40,r:8,vx:Math.cos(a)*BALL_SPEED,vy:Math.sin(a)*BALL_SPEED};
}
function resetAll(){
  scores={p1:0,p2:0,p3:0}; actualizarScores();
  timeLeft=ROUND_TIME; hud.t.textContent=(timeLeft/1000).toFixed(1);
  hud.status.textContent='Listo';
  last=0; running=false; ball=resetBall(); BALL_SPEED=5.2; taunt=null;
  p1.y=H/2-PADDLE_H/2; p2.y=H/2-PADDLE_H/2; p3.x=W/2-PADDLE_BOTTOM_W/2;
  fieldTheme=rand(FIELD_THEMES); ballSkin=rand(BALL_SKINS);
  caric1=rand(CARICATURES); caric2=rand(CARICATURES); caric3=rand(CARICATURES);
  draw();
}

/* ===== DRAW: PADDLES ===== */
function drawCaricaturePaddle(p,face,side){
  ctx.save();
  ctx.fillStyle=face.body;
  roundRect(ctx,p.x,p.y,p.w,p.h,8,true,false);
  // cara
  const cx= side==='B' ? p.x+p.w/2 : (side==='L'? p.x+p.w+10 : p.x-10);
  const cy= side==='B' ? p.y-14 : p.y+p.h/2;
  const rx= side==='B' ? 16 : 14, ry= side==='B' ? 12 : 18;
  ctx.translate(cx,cy);
  ctx.rotate(Math.sin(perf()*0.002+cx)*0.02);
  ctx.fillStyle=face.body; ellipse(0,0,rx,ry,true);
  ctx.fillStyle=face.eye; ellipse(-rx*0.35,-ry*0.1,3,3,true); ellipse(rx*0.35,-ry*0.1,3,3,true);
  if(face.blush){ ctx.fillStyle="#ff8fabaa"; ellipse(-rx*0.5,ry*0.3,4,2,true); ellipse(rx*0.5,ry*0.3,4,2,true); }
  ctx.strokeStyle=face.mouth; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(0,ry*0.2,rx*0.35,0,Math.PI,false); ctx.stroke();
  if(face.hat){ ctx.fillStyle="#222"; ctx.fillRect(-rx, -ry-6, rx*2,4); ellipse(0,-ry-10,rx*0.9,4,true); }
  if(face.beard){ ctx.fillStyle="#3b2f2f"; ellipse(0,ry*0.55,rx*0.8,6,true); }
  ctx.globalAlpha=0.9; ctx.fillStyle="#fff"; ctx.font="16px system-ui"; ctx.textAlign="center";
  ctx.fillText(face.emoji,0,-ry-6);
  ctx.restore();
}

/* ===== DRAW: BALL SKINS ===== */
function drawBall(b,skin){
  ctx.save(); ctx.translate(b.x,b.y);
  switch(skin){
    case 'classic': fillCircle('#eaf2ff',b.r); break;
    case 'stripe': fillCircle('#fff',b.r); stripe(b.r); break;
    case 'target': bullseye(b.r); break;
    case 'yin': yinYang(b.r); break;
    case 'tri': patternTri(b.r); break;
    case 'quad': quadPie(b.r); break;
    case 'emoji': fillCircle('#ffd166',b.r); faceSmile(b.r); break;
    case 'star': starball(b.r); break;
    case 'soccer': soccer(b.r); break;
    case 'beach': beach(b.r); break;
    case 'ring': fillCircle('#caffbf',b.r); ring(b.r); break;
    case 'dotgrid': dotGrid(b.r); break;
    case 'candy': swirl(b.r,'#ffcad4','#9bf6ff'); break;
    case 'smile': fillCircle('#fff59d',b.r); faceSmile(b.r,true); break;
    case 'bolt': fillCircle('#e0fbfc',b.r); bolt(b.r); break;
    case 'moon': moon(b.r); break;
    case 'sun': sun(b.r); break;
    case 'checker': checker(b.r); break;
    case 'swirl': swirl(b.r,'#ffd6a5','#bdb2ff'); break;
    case 'caps': caps(b.r); break;
  }
  ctx.restore();
}

/* ===== DRAW: FIELD ===== */
function drawFieldTheme(theme){
  const [bg,border,line]=theme;
  const g=ctx.createLinearGradient(0,0,0,H);
  g.addColorStop(0,shade(bg,0.0)); g.addColorStop(1,shade(bg,-0.2));
  ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
  ctx.strokeStyle=border; ctx.lineWidth=8; ctx.strokeRect(8,8,W-16,H-16);
  ctx.setLineDash([10,14]); ctx.strokeStyle=line; ctx.lineWidth=3;
  ctx.beginPath(); ctx.moveTo(W/2,16); ctx.lineTo(W/2,H-16-120); ctx.stroke(); ctx.setLineDash([]);
  ctx.globalAlpha=0.12; ctx.fillStyle=line;
  for(let i=0;i<6;i++){ ctx.beginPath(); ctx.arc(rnd(40,W-40),rnd(40,H-160),rnd(10,40),0,Math.PI*2); ctx.fill(); }
  ctx.globalAlpha=1;
}

/* ===== TAUNT DRAW (20 anims) ===== */
function drawTaunt(){
  ctx.save();
  const k=(Date.now()-taunt.t0)/taunt.ttl; const e=Math.max(0,1-k);
  let x=taunt.x, y=taunt.y, s=1, r=0, skew=0;
  switch(taunt.anim){
    case 'shake': x+=Math.sin(perf()*0.06)*6; break;
    case 'wiggle': r=Math.sin(perf()*0.01)*0.25; break;
    case 'bounce': y-=Math.abs(Math.sin(perf()*0.008))*14; break;
    case 'pop': s=1+0.4*e; break;
    case 'spin': r=perf()*0.01; break;
    case 'wobble': r=Math.sin(perf()*0.02)*0.4; s=1+Math.sin(perf()*0.04)*0.05; break;
    case 'slideL': x-=e*40; break;
    case 'slideR': x+=e*40; break;
    case 'slideU': y-=e*40; break;
    case 'slideD': y+=e*40; break;
    case 'jelly': s=1+Math.sin(perf()*0.05)*0.2; break;
    case 'pulse': s=1+Math.sin(perf()*0.08)*0.1; break;
    case 'skew': skew=Math.sin(perf()*0.05)*0.3; break;
    case 'flipX': r=Math.PI*(e); break;
    case 'flipY': r=Math.PI*(e); break;
    case 'swing': r=Math.sin(perf()*0.02)*0.6; break;
    case 'breath': s=1+Math.sin(perf()*0.02)*0.15; break;
    case 'rainbow': ; break;
    case 'spark': ; break;
    case 'zoom': s=1+0.8*e; break;
  }
  ctx.translate(x,y); if(skew){ ctx.transform(1,0,skew,1,0,0); } ctx.rotate(r); ctx.scale(s,s);
  const color = taunt.anim==='rainbow' ? hsl(perf()%360,90,60) : taunt.color;
  const text=taunt.texto, pad=10;
  ctx.font='bold 18px system-ui'; ctx.textAlign='center';
  const w=ctx.measureText(text).width+pad*2, h=30;
  ctx.globalAlpha=0.85*e+0.15;
  ctx.fillStyle='#000c'; roundRect(ctx,-w/2,-h-6,w,h,10,true,false);
  ctx.fillStyle=color; ctx.fillText(text,0,-h/2-6+6);
  if(taunt.anim==='spark'){
    ctx.globalAlpha=0.6*e;
    for(let i=0;i<8;i++){ ctx.fillStyle=hsl((perf()+i*40)%360,90,60);
      const a=i*Math.PI/4, rr=18+Math.sin(perf()*0.03+i)*6;
      ctx.fillRect(Math.cos(a)*rr, -h-6+Math.sin(a)*rr, 3,3);
    }
  }
  ctx.restore();
}

/* ===== SFX HELPERS ===== */
function playHitPaddle(){ rand(SOUND_FUNS)(); }
function playHitWall(){ rand(SOUND_FUNS)(); }

/* ===== DRAW UTILS ===== */
function roundRect(ctx,x,y,w,h,r,fill,stroke){
  if(w<2*r)r=w/2; if(h<2*r)r=h/2;
  ctx.beginPath(); ctx.moveTo(x+r,y);
  ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r);
  ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r);
  if(fill) ctx.fill(); if(stroke) ctx.stroke();
}
function ellipse(x,y,rx,ry,fill){
  ctx.beginPath();
  for(let i=0;i<Math.PI*2;i+=Math.PI/24){
    const px=x+rx*Math.cos(i), py=y+ry*Math.sin(i);
    i===0?ctx.moveTo(px,py):ctx.lineTo(px,py);
  }
  ctx.closePath(); if(fill) ctx.fill(); else ctx.stroke();
}
function fillCircle(color,r){ ctx.fillStyle=color; ctx.beginPath(); ctx.arc(0,0,r,0,Math.PI*2); ctx.fill(); }
function stripe(r){ ctx.strokeStyle='#0005'; ctx.lineWidth=4; for(let y=-r;y<=r;y+=6){ ctx.beginPath(); ctx.moveTo(-r,y); ctx.lineTo(r,y); ctx.stroke(); } }
function bullseye(r){ for(let i=0;i<5;i++){ fillCircle(i%2? '#fff':'#ff6b6b', r*(1-i*0.2)); } }
function yinYang(r){
  fillCircle('#fff',r); ctx.fillStyle='#000'; ctx.beginPath(); ctx.arc(0,0,r,Math.PI/2, -Math.PI/2); ctx.fill();
  fillCircle('#000',r/2); ctx.translate(0,-r/2); fillCircle('#fff',r/6); ctx.translate(0,r); fillCircle('#000',r/6);
}
function patternTri(r){ fillCircle('#a0c4ff',r); ctx.strokeStyle='#4361ee88'; for(let a=0;a<6;a++){ ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r); ctx.stroke(); } }
function quadPie(r){ ['#ffadad','#ffd6a5','#caffbf','#9bf6ff'].forEach((c,i)=>{ ctx.beginPath(); ctx.moveTo(0,0); ctx.fillStyle=c; ctx.arc(0,0,r,i*Math.PI/2,(i+1)*Math.PI/2); ctx.fill();}); }
function faceSmile(r,eyes=false){
  ctx.strokeStyle='#000'; ctx.beginPath(); ctx.arc(0,r*0.1,r*0.5,0,Math.PI); ctx.stroke();
  ctx.save(); ctx.translate(-r*0.3,-r*0.2); fillCircle('#000',eyes?3:2); ctx.restore();
  ctx.save(); ctx.translate(r*0.3,-r*0.2); fillCircle('#000',eyes?3:2); ctx.restore();
}
function starball(r){ fillCircle('#ffe066',r); ctx.fillStyle='#ff006e'; star(0,0,r*0.7,5); }
function star(x,y,R,n){ ctx.beginPath(); for(let i=0;i<n*2;i++){ const a=i*Math.PI/n; const rr=i%2?R*0.45:R; const px=x+Math.cos(a)*rr, py=y+Math.sin(a)*rr; i?ctx.lineTo(px,py):ctx.moveTo(px,py);} ctx.closePath(); ctx.fill(); }
function soccer(r){ fillCircle('#fff',r); ctx.strokeStyle='#111'; for(let a=0;a<Math.PI*2;a+=Math.PI/3){ ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r); ctx.stroke(); } }
function beach(r){ quadPie(r); }
function ring(r){ ctx.strokeStyle='#1b1b1b'; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(0,0,r*0.6,0,Math.PI*2); ctx.stroke(); }
function dotGrid(r){ fillCircle('#e0fbfc',r); ctx.fillStyle='#3a86ff66'; for(let x=-r;x<=r;x+=6)for(let y=-r;y<=r;y+=6) if(x*x+y*y<=r*r) ctx.fillRect(x,y,1.8,1.8); }
function swirl(r,c1,c2){ for(let i=0;i<20;i++){ ctx.strokeStyle=i%2?c1:c2; ctx.beginPath(); ctx.arc(0,0,r-i*0.4,i*0.6,i*0.6+2.2); ctx.stroke(); } }
function bolt(r){ ctx.fillStyle='#ffd60a'; ctx.beginPath(); ctx.moveTo(-r*0.2,-r*0.8); ctx.lineTo(r*0.1,-r*0.1); ctx.lineTo(-r*0.05,-r*0.1); ctx.lineTo(r*0.2,r*0.8); ctx.closePath(); ctx.fill(); }
function moon(r){ fillCircle('#adb5bd',r); ctx.globalCompositeOperation='destination-out'; fillCircle('#000',r*0.7); ctx.globalCompositeOperation='source-over'; }
function sun(r){ fillCircle('#ffd166',r); ctx.strokeStyle='#ff9f1c'; for(let i=0;i<12;i++){ ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(Math.cos(i)*r*1.4,Math.sin(i)*r*1.4); ctx.stroke(); } }
function checker(r){ fillCircle('#fff',r); ctx.fillStyle='#111'; for(let x=-r;x<r;x+=r/3) for(let y=-r;y<r;y+=r/3) if(((x+y)/r)&1) ctx.fillRect(x,y,r/3,r/3); }
function caps(r){ fillCircle('#caf0f8',r); ctx.fillStyle='#03045e'; ctx.font='bold 12px system-ui'; ctx.textAlign='center'; ctx.fillText('LOL',0,4); }

/* ===== HELPERS ===== */
function actualizarScores(){ hud.s1.textContent=scores.p1; hud.s2.textContent=scores.p2; hud.s3.textContent=scores.p3; }
function ganador(){ const a=[['P1',scores.p1],['P2',scores.p2],['P3',scores.p3]].sort((x,y)=>x[1]-y[1]); const m=a[0][1]; return {etiqueta:a.filter(x=>x[1]===m).map(x=>x[0]).join(' & '),goles:m}; }
function finalizar(){
  const g=ganador(); hud.status.textContent=`Fin • Ganador: ${g.etiqueta} (menos goles: ${g.goles})`;
  ctx.save(); ctx.fillStyle='#000a'; ctx.fillRect(0,0,W,H);
  ctx.fillStyle='#eaf2ff'; ctx.textAlign='center'; ctx.font='bold 34px system-ui'; ctx.fillText('¡Fin del juego!',W/2,H/2-30);
  ctx.font='600 24px system-ui'; ctx.fillText(`Ganador: ${g.etiqueta} (menos goles: ${g.goles})`,W/2,H/2+10);
  ctx.font='16px system-ui'; ctx.fillText('⟲ Reinicia para jugar otra ronda',W/2,H/2+40); ctx.restore();
}
function perf(){ return performance.now(); }
function randomAngle(){
  for(;;){ const a=Math.random()*Math.PI*2; const deg=a*180/Math.PI; const m=(deg+360)%360;
    const near=[0,90,180,270].some(ax=>Math.abs(((m-ax+540)%360)-180)<10);
    if(!near) return a;
  }
}
function clamp(v,min,max){ return Math.max(min,Math.min(max,v)); }
function rnd(a,b){ return Math.floor(Math.random()*(b-a+1))+a; }
function rand(arr){ return arr[(Math.random()*arr.length)|0]; }
function shade(hex,amt){
  const c=parseInt(hex.slice(1),16); let r=(c>>16)+Math.round(255*amt), g=((c>>8)&255)+Math.round(255*amt), b=(c&255)+Math.round(255*amt);
  r=Math.max(0,Math.min(255,r)); g=Math.max(0,Math.min(255,g)); b=Math.max(0,Math.min(255,b)); return '#'+((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1);
}
function hsl(h,s,l){ return `hsl(${h},${s}%,${l}%)`; }

/* ===== INIT ===== */
resetAll(); draw();
// corre sólo tras botón iniciar por políticas de audio del navegador
