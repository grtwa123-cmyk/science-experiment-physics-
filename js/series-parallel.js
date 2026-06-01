/* ============================================================
   직렬·병렬 저항 시뮬레이터 (series-parallel.js)
   물리 모델:
     직렬  R = R₁ + R₂
     병렬  R = (R₁·R₂)/(R₁+R₂)
     (전원 V = 5V 고정,  I = V/R)
   ============================================================ */
(function(){
  const VS=5;
  const S={r1:100,r2:200,mode:'series',playing:true};
  const e1=Array.from({length:8},(_,i)=>({t:i/8}));
  const e2=Array.from({length:8},(_,i)=>({t:i/8+.5}));
  let ctx,W,H,lastT=0,chart=null;

  const calcR=(r1,r2,m)=>m==='series'?r1+r2:(r1*r2)/(r1+r2);

  function resize(){
    const r=initCanvas(document.getElementById('sp-canvas'));
    ctx=r.ctx; W=r.w; H=r.h;
    draw();
  }

  function getSeriesPath(){
    const L=65,R=W-65,T=70,B=H-70;
    return [{x:L,y:B},{x:L,y:T},{x:(L+R)/2-50,y:T},
            {x:(L+R)/2+50,y:T},{x:R,y:T},{x:R,y:B},{x:L,y:B}];
  }
  function getParPath1(){
    const L=65,R=W-65,mid=H/2,top=mid-50;
    return [{x:L,y:mid},{x:L,y:top},{x:R,y:top},{x:R,y:mid}];
  }
  function getParPath2(){
    const L=65,R=W-65,mid=H/2,bot=mid+50;
    return [{x:R,y:mid},{x:R,y:bot},{x:L,y:bot},{x:L,y:mid}];
  }

  function draw(){
    if(!ctx) return;
    ctx.clearRect(0,0,W,H);
    const rT=calcR(S.r1,S.r2,S.mode), iT=VS/rT*1000;
    const L=65,R=W-65,cx=(L+R)/2;

    ctx.fillStyle='#f8fafc'; ctx.fillRect(0,0,W,H);

    if(S.mode==='series'){
      const T=70,B=H-70;
      drawWire(ctx,[{x:L,y:B},{x:L,y:T},{x:cx-55,y:T}]);
      drawWire(ctx,[{x:cx+55,y:T},{x:R,y:T},{x:R,y:B},{x:L,y:B}]);
      drawResistor(ctx,cx-70,T,55,18,'#dc2626');
      drawResistor(ctx,cx+70,T,55,18,'#059669');
      ctx.fillStyle='#dc2626'; ctx.font='bold 11px sans-serif'; ctx.textAlign='center';
      ctx.fillText('R₁='+S.r1+'Ω',cx-70,T-16);
      ctx.fillStyle='#059669'; ctx.fillText('R₂='+S.r2+'Ω',cx+70,T-16);
      drawBattSym(ctx,L,(T+B)/2);
      ctx.fillStyle='#1e40af'; ctx.font='bold 11px sans-serif'; ctx.textAlign='center';
      ctx.fillText(`R합성=${rT.toFixed(0)}Ω | I=${iT.toFixed(2)}mA`,cx,B+22);
    } else {
      const mid=H/2,top=mid-50,bot=mid+50;
      drawWire(ctx,[{x:L,y:top-10},{x:L,y:bot+10}]);
      drawWire(ctx,[{x:R,y:top-10},{x:R,y:bot+10}]);
      drawWire(ctx,[{x:L,y:top},{x:cx-40,y:top}]);
      drawWire(ctx,[{x:cx+40,y:top},{x:R,y:top}]);
      drawWire(ctx,[{x:L,y:bot},{x:cx-40,y:bot}]);
      drawWire(ctx,[{x:cx+40,y:bot},{x:R,y:bot}]);
      drawResistor(ctx,cx,top,65,18,'#dc2626');
      drawResistor(ctx,cx,bot,65,18,'#059669');
      ctx.fillStyle='#dc2626'; ctx.font='bold 11px sans-serif'; ctx.textAlign='center';
      ctx.fillText('R₁='+S.r1+'Ω',cx,top-14);
      ctx.fillStyle='#059669'; ctx.fillText('R₂='+S.r2+'Ω',cx,bot+28);
      const i1=VS/S.r1*1000, i2=VS/S.r2*1000;
      ctx.fillStyle='#dc2626'; ctx.font='10px sans-serif';
      ctx.fillText(`I₁=${i1.toFixed(1)}mA`,cx,top+26);
      ctx.fillStyle='#059669';
      ctx.fillText(`I₂=${i2.toFixed(1)}mA`,cx,bot-8);
      drawBattSym(ctx,L-28,mid);
      ctx.fillStyle='#1e40af'; ctx.font='bold 11px sans-serif'; ctx.textAlign='center';
      ctx.fillText(`R합성=${rT.toFixed(1)}Ω | I=${iT.toFixed(2)}mA`,cx,mid+80);
    }
  }

  function updateInfo(){
    const rT=calcR(S.r1,S.r2,S.mode), iT=VS/rT*1000;
    document.getElementById('sp-ir1').textContent=S.r1+' Ω';
    document.getElementById('sp-ir2').textContent=S.r2+' Ω';
    document.getElementById('sp-irtotal').textContent=fmt(rT,1,'Ω');
    document.getElementById('sp-iformula').textContent=
      S.mode==='series'?'R=R₁+R₂':'1/R=1/R₁+1/R₂';
    document.getElementById('sp-ii').textContent=fmt(iT,2,'mA');
  }

  function buildChart(){
    const el=document.getElementById('sp-chart'); if(!el) return;
    chart=new Chart(el,{type:'bar',
      data:{
        labels:['R₁','R₂','직렬 합성','병렬 합성'],
        datasets:[{label:'저항(Ω)',
          data:[S.r1,S.r2,calcR(S.r1,S.r2,'series'),calcR(S.r1,S.r2,'parallel')],
          backgroundColor:['#fca5a5','#6ee7b7','#ef4444','#2563eb'],
          borderColor:['#dc2626','#059669','#b91c1c','#1d4ed8'],
          borderWidth:2,borderRadius:6}]},
      options:{responsive:true,maintainAspectRatio:false,
        plugins:{legend:{display:false}},
        scales:{y:{title:{display:true,text:'저항(Ω)'},min:0}}},
    });
  }

  function updateChart(){
    if(!chart) return;
    chart.data.datasets[0].data=[S.r1,S.r2,
      calcR(S.r1,S.r2,'series'),calcR(S.r1,S.r2,'parallel')];
    chart.update();
  }

  function loop(now){
    if(!S.playing) return;
    requestAnimationFrame(loop);
    const dt=calcDt(lastT,now); lastT=now;
    const rT=calcR(S.r1,S.r2,S.mode), iT=VS/rT*1000;
    const spd=clamp(iT/100,.02,.5);

    if(S.mode==='series'){
      [...e1,...e2].forEach(e=>{ e.t=(e.t+spd*dt*2)%1; });
    } else {
      const s1=clamp(VS/S.r1*1000/100,.01,.5);
      const s2=clamp(VS/S.r2*1000/100,.01,.5);
      e1.forEach(e=>{ e.t=(e.t+s1*dt*2)%1; });
      e2.forEach(e=>{ e.t=(e.t+s2*dt*2)%1; });
    }

    draw();
    if(ctx){
      if(S.mode==='series'){
        const p=getSeriesPath();
        [...e1,...e2].forEach(e=>{
          const pt=ptOnPath(p,e.t); drawElectron(ctx,pt.x,pt.y);
        });
      } else {
        const p1=getParPath1();
        e1.forEach(e=>{ const pt=ptOnPath(p1,e.t); drawElectron(ctx,pt.x,pt.y); });
        const p2=getParPath2();
        e2.forEach(e=>{ const pt=ptOnPath(p2,e.t); drawElectron(ctx,pt.x,pt.y); });
      }
    }
    updateInfo();
  }

  function reset(){
    S.r1=100; S.r2=200; S.mode='series';
    document.getElementById('sp-r1slider').value=100;
    document.getElementById('sp-r2slider').value=200;
    document.getElementById('sp-r1disp').textContent='100 Ω';
    document.getElementById('sp-r2disp').textContent='200 Ω';
    document.querySelectorAll('#sp-mode-grp .toggle-btn').forEach((b,i)=>
      b.classList.toggle('active',i===0));
    e1.forEach((e,i)=>{ e.t=i/e1.length; });
    e2.forEach((e,i)=>{ e.t=i/e2.length+.5; });
    updateChart();
  }

  function init(){
    resize(); buildChart();
    bindSlider('sp-r1slider','sp-r1disp','Ω',0,v=>{ S.r1=v; updateChart(); });
    bindSlider('sp-r2slider','sp-r2disp','Ω',0,v=>{ S.r2=v; updateChart(); });
    initToggle('sp-mode-grp',val=>{
      S.mode=val;
      e1.forEach((e,i)=>{ e.t=i/e1.length; });
      e2.forEach((e,i)=>{ e.t=i/e2.length+.5; });
    });
    document.getElementById('sp-play').addEventListener('click',()=>{
      S.playing=!S.playing;
      document.getElementById('sp-play').textContent=S.playing?'⏸ 일시정지':'▶ 재생';
      if(S.playing){ lastT=performance.now(); loop(lastT); }
    });
    document.getElementById('sp-reset').addEventListener('click',reset);
    initPrin('sp-pbtn','sp-ppanel');
    window.addEventListener('resize',resize);
    lastT=performance.now(); loop(lastT);
  }

  onReady(init);
})();
