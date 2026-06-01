/* ============================================================
   공통 유틸리티 (common.js)
   모든 시뮬레이터가 공유하는 수학·캔버스·UI 헬퍼
   ============================================================ */
'use strict';

/* ---------- 수학 ---------- */
const clamp  = (v,mn,mx) => Math.min(Math.max(v,mn),mx);
const lerp   = (a,b,t)   => a+(b-a)*clamp(t,0,1);
const fmt    = (v,d=2,u='') => isFinite(v) ? v.toFixed(d)+(u?' '+u:'') : '—';
const calcDt = (last,now) => Math.min((now-last)/1000, 0.05);

/* ---------- HiDPI 캔버스 초기화 ---------- */
function initCanvas(canvas){
  const dpr  = window.devicePixelRatio||1;
  const rect = canvas.getBoundingClientRect();
  const w    = rect.width || canvas.parentElement.clientWidth || 600;
  const h    = parseInt(canvas.style.height)||300;
  canvas.width  = w*dpr;
  canvas.height = h*dpr;
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr,0,0,dpr,0,0);
  return {ctx, w, h};
}

/* ---------- 경로 위 점 계산 ---------- */
function ptOnPath(path,t){
  if(path.length<2) return path[0]||{x:0,y:0};
  const lens=[];let total=0;
  for(let i=1;i<path.length;i++){
    const dx=path[i].x-path[i-1].x, dy=path[i].y-path[i-1].y;
    const l=Math.sqrt(dx*dx+dy*dy); lens.push(l); total+=l;
  }
  let tgt=t*total;
  for(let i=0;i<lens.length;i++){
    if(tgt<=lens[i]){
      const r=lens[i]>0?tgt/lens[i]:0;
      return {x:lerp(path[i].x,path[i+1].x,r),
              y:lerp(path[i].y,path[i+1].y,r)};
    }
    tgt-=lens[i];
  }
  return path[path.length-1];
}

/* ---------- 그리기 헬퍼 ---------- */
function drawElectron(ctx,x,y,r=5,col='#2563eb'){
  ctx.save();
  const g=ctx.createRadialGradient(x-r*.3,y-r*.3,0,x,y,r);
  g.addColorStop(0,'#93c5fd'); g.addColorStop(1,col);
  ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2);
  ctx.fillStyle=g; ctx.fill();
  ctx.strokeStyle='rgba(255,255,255,.5)'; ctx.lineWidth=.8; ctx.stroke();
  ctx.restore();
}

function drawWire(ctx,path,col='#374151',lw=2.5){
  if(path.length<2) return;
  ctx.save();
  ctx.strokeStyle=col; ctx.lineWidth=lw;
  ctx.lineJoin='round'; ctx.lineCap='round';
  ctx.beginPath(); ctx.moveTo(path[0].x,path[0].y);
  for(let i=1;i<path.length;i++) ctx.lineTo(path[i].x,path[i].y);
  ctx.stroke(); ctx.restore();
}

function drawResistor(ctx,x,y,w=50,h=18,col='#92400e'){
  ctx.save();
  ctx.fillStyle='#fef3c7'; ctx.strokeStyle=col; ctx.lineWidth=2;
  ctx.beginPath(); ctx.roundRect(x-w/2,y-h/2,w,h,3); ctx.fill(); ctx.stroke();
  const segs=5, sw=(w-12)/segs;
  ctx.beginPath(); ctx.strokeStyle=col; ctx.lineWidth=1.5;
  ctx.moveTo(x-w/2+6,y);
  for(let i=0;i<segs;i++){
    const sx=x-w/2+6+i*sw;
    ctx.lineTo(sx+sw/2,y-h/2+3); ctx.lineTo(sx+sw,y);
  }
  ctx.stroke(); ctx.restore();
}

function drawArrow(ctx,x1,y1,x2,y2,col='#10b981',lw=2){
  ctx.save();
  ctx.strokeStyle=col; ctx.fillStyle=col; ctx.lineWidth=lw;
  ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
  const a=Math.atan2(y2-y1,x2-x1);
  ctx.beginPath();
  ctx.moveTo(x2,y2);
  ctx.lineTo(x2-9*Math.cos(a-.4),y2-9*Math.sin(a-.4));
  ctx.lineTo(x2-9*Math.cos(a+.4),y2-9*Math.sin(a+.4));
  ctx.closePath(); ctx.fill(); ctx.restore();
}

function drawBattSym(ctx,x,y){
  ctx.save();
  [[24,3],[14,1.5],[24,3],[14,1.5]].forEach(([w,lw],i)=>{
    const yy=y-15+i*10;
    ctx.strokeStyle='#1f2937'; ctx.lineWidth=lw;
    ctx.beginPath(); ctx.moveTo(x-w/2,yy); ctx.lineTo(x+w/2,yy); ctx.stroke();
  });
  ctx.restore();
}

/* ---------- UI 바인딩 ---------- */
function initToggle(groupId,cb){
  const g=document.getElementById(groupId);
  if(!g) return;
  g.querySelectorAll('.toggle-btn').forEach(btn=>{
    btn.addEventListener('click',()=>{
      g.querySelectorAll('.toggle-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      cb(btn.dataset.value);
    });
  });
}

function bindSlider(id,dispId,unit,digits,cb){
  const sl=document.getElementById(id);
  const dp=document.getElementById(dispId);
  if(!sl) return ()=>0;
  const upd=()=>{
    const v=parseFloat(sl.value);
    if(dp) dp.textContent=fmt(v,digits,unit);
    cb(v);
  };
  sl.addEventListener('input',upd);
  upd();
  return ()=>parseFloat(sl.value);
}

function initPrin(btnId,panelId){
  const btn=document.getElementById(btnId);
  const panel=document.getElementById(panelId);
  if(!btn||!panel) return;
  btn.addEventListener('click',()=>{
    const open=panel.classList.toggle('open');
    btn.classList.toggle('open',open);
    btn.querySelector('.arr').textContent=open?'▲':'▼';
  });
}

/* ---------- 초기화 실행 헬퍼 ---------- */
/* 각 시뮬레이터 파일은 onReady(init) 로 진입점을 등록한다. */
function onReady(fn){
  if(document.readyState==='loading')
    document.addEventListener('DOMContentLoaded',fn);
  else fn();
}
