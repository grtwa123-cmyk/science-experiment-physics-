/* ============================================================
   LED 시뮬레이터 (led.js)
   물리 모델: 다이오드와 동일한 소프트플러스(지수적 무릎 + 보호저항).
   색상별 문턱 전압이 다르며, 밝기는 순방향 전류에 비례한다.
     I(V) = (Vt_eff/Rp)·ln(1 + e^((V-Vth)/Vt_eff))    [A]
     밝기 = clamp(I / I_ref, 0, 1)
   ============================================================ */
(function(){
  const RP=100;        // 보호 저항 (Ω)
  const VT_EFF=0.05;   // 접합 완만도
  const I_REF=20;      // 완전 점등 기준 전류 (mA)

  const COLS={
    red:  {thresh:1.8,col:'#ef4444',glow:'#fca5a5',photon:'#ff6b6b',name:'빨강'},
    green:{thresh:2.2,col:'#10b981',glow:'#6ee7b7',photon:'#34d399',name:'초록'},
    blue: {thresh:3.0,col:'#2563eb',glow:'#93c5fd',photon:'#60a5fa',name:'파랑'},
  };
  const S={voltage:0,colorKey:'red',playing:true};
  const electrons=Array.from({length:8},(_,i)=>({t:i/8}));
  const photons=[];
  let ctx,W,H,lastT=0,photonTimer=0,chart=null;

  function diodeMa(v,thresh){
    if(v<=0) return 0;
    const iA=(VT_EFF/RP)*Math.log(1+Math.exp((v-thresh)/VT_EFF));
    return iA*1000;
  }
  const calcI=v=>diodeMa(v,COLS[S.colorKey].thresh);
  const calcB=v=>clamp(calcI(v)/I_REF,0,1);

  function hexRgb(h){
    return [1,3,5].map(i=>parseInt(h.slice(i,i+2),16)).join(',');
  }

  function spawn(cx,cy,col){
    const a=Math.random()*Math.PI*2;
    photons.push({x:cx,y:cy,vx:Math.cos(a)*(1.5+Math.random()*2),
      vy:Math.sin(a)*(1.5+Math.random()*2)-1,life:1,col,sz:3+Math.random()*3});
    if(photons.length>40) photons.shift();
  }

  function resize(){
    const r=initCanvas(document.getElementById('led-canvas'));
    ctx=r.ctx; W=r.w; H=r.h;
    draw();
  }

  function draw(){
    if(!ctx) return;
    ctx.clearRect(0,0,W,H);
    const cfg=COLS[S.colorKey], br=calcB(S.voltage), on=br>0.01;
    const cx=W/2,cy=H/2;
    const L=55,R=W-55,T=cy-55,B=cy+55;

    ctx.fillStyle=on?`rgba(${hexRgb(cfg.glow)},${br*.12})`:'#f8fafc';
    ctx.fillRect(0,0,W,H);

    drawWire(ctx,[{x:L,y:cy},{x:L,y:T},{x:R,y:T},{x:R,y:cy}]);
    drawWire(ctx,[{x:L,y:cy},{x:L,y:B},{x:R,y:B},{x:R,y:cy}]);

    ctx.fillStyle='#d1fae5'; ctx.strokeStyle='#059669'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.roundRect(cx-85,cy-21,80,42,4); ctx.fill(); ctx.stroke();
    ctx.fillStyle='#065f46'; ctx.font='bold 12px sans-serif';
    ctx.textAlign='center'; ctx.fillText('N형',cx-45,cy+5);

    ctx.fillStyle=on?`rgba(${hexRgb(cfg.col)},.22)`:'#fee2e2';
    ctx.strokeStyle=on?cfg.col:'#dc2626'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.roundRect(cx+5,cy-21,80,42,4); ctx.fill(); ctx.stroke();
    ctx.fillStyle=on?cfg.col:'#7f1d1d'; ctx.font='bold 12px sans-serif';
    ctx.textAlign='center'; ctx.fillText('P형',cx+45,cy+5);

    ctx.fillStyle=on?cfg.col:'#9ca3af';
    ctx.strokeStyle=on?cfg.col:'#9ca3af'; ctx.lineWidth=2;
    ctx.beginPath();
    ctx.moveTo(cx-12,cy-14); ctx.lineTo(cx-12,cy+14); ctx.lineTo(cx+12,cy);
    ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(cx+12,cy-14); ctx.lineTo(cx+12,cy+14); ctx.stroke();

    if(on){
      const gr=ctx.createRadialGradient(cx,cy-10,0,cx,cy-10,30+br*60);
      gr.addColorStop(0,`rgba(${hexRgb(cfg.col)},${br*.7})`);
      gr.addColorStop(1,'rgba(255,255,255,0)');
      ctx.beginPath(); ctx.arc(cx,cy-10,30+br*60,0,Math.PI*2);
      ctx.fillStyle=gr; ctx.fill();
      for(let i=0;i<3;i++){
        const ang=-Math.PI/2+(i-1)*.5;
        ctx.globalAlpha=br;
        drawArrow(ctx,cx+18*Math.cos(ang),cy+18*Math.sin(ang),
          cx+46*Math.cos(ang),cy+46*Math.sin(ang),cfg.col,1.5);
        ctx.globalAlpha=1;
      }
    }

    drawBattSym(ctx,L,cy);
    ctx.fillStyle='#374151'; ctx.font='10px sans-serif';
    ctx.textAlign='center'; ctx.fillText(S.voltage.toFixed(1)+'V',L,cy+36);
    drawResistor(ctx,R,T,44,14);

    ctx.fillStyle='#1e40af'; ctx.font='11px sans-serif'; ctx.textAlign='center';
    ctx.fillText(`밝기: ${(br*100).toFixed(0)}% | I=${calcI(S.voltage).toFixed(1)}mA`,cx,cy+40);
  }

  function updateInfo(br){
    const cfg=COLS[S.colorKey], I=calcI(S.voltage), on=br>0.01;
    document.getElementById('led-iv').textContent=fmt(S.voltage,2,'V');
    document.getElementById('led-ii').textContent=fmt(I,1,'mA');
    document.getElementById('led-ibright').textContent=fmt(br*100,0,'%');
    document.getElementById('led-ithresh').textContent=fmt(cfg.thresh,2,'V');
    document.getElementById('led-istate').textContent=on?cfg.name+'빛 방출 중':'꺼짐(V<'+cfg.thresh+'V)';
    const b=document.getElementById('led-badge');
    b.className='badge '+(on?'badge-on':'badge-off');
    b.textContent=on?'ON':'OFF';
  }

  function buildChart(){
    const el=document.getElementById('led-chart'); if(!el) return;
    const labels=[];
    for(let v=0;v<=5;v+=0.05) labels.push(v.toFixed(2));
    const colors={red:'#ef4444',green:'#10b981',blue:'#2563eb'};
    const ds=Object.entries(COLS).map(([k,c])=>{
      const data=labels.map(l=>clamp(diodeMa(parseFloat(l),c.thresh)/I_REF*100,0,100));
      return {label:`${c.name}(Vth=${c.thresh}V)`,data,
              borderColor:colors[k],backgroundColor:colors[k]+'1a',
              borderWidth:2.5,pointRadius:0,tension:.3};
    });
    chart=new Chart(el,{type:'line',data:{labels,datasets:ds},
      options:{responsive:true,maintainAspectRatio:false,
        plugins:{legend:{position:'top'}},
        scales:{
          x:{title:{display:true,text:'전압(V)'},
             ticks:{callback:(v,i)=>i%20===0?labels[i]:'',maxTicksLimit:11}},
          y:{title:{display:true,text:'상대 밝기(%)'},min:0,max:105},
        }},
    });
  }

  function getPath(){
    return [{x:60,y:H/2},{x:W/2-30,y:H/2},{x:W/2+30,y:H/2},{x:W-60,y:H/2}];
  }

  function loop(now){
    if(!S.playing) return;
    requestAnimationFrame(loop);
    const dt=calcDt(lastT,now); lastT=now;
    const br=calcB(S.voltage), on=br>0.01;
    const spd=clamp(br*.4,.02,.4);
    if(on) electrons.forEach(e=>{ e.t=(e.t+spd*dt*2)%1; });

    if(on){ photonTimer+=dt;
      if(photonTimer>0.06+(.94*(1-br))){ photonTimer=0; spawn(W/2,H/2-10,COLS[S.colorKey].photon); }
    }
    for(let i=photons.length-1;i>=0;i--){
      const p=photons[i]; p.x+=p.vx; p.y+=p.vy; p.life-=dt*1.2;
      if(p.life<=0) photons.splice(i,1);
    }
    draw();
    if(on&&ctx){
      const path=getPath();
      electrons.forEach(e=>{ const pt=ptOnPath(path,e.t); drawElectron(ctx,pt.x,pt.y); });
    }
    photons.forEach(p=>{
      ctx.save(); ctx.globalAlpha=p.life;
      ctx.beginPath(); ctx.arc(p.x,p.y,p.sz,0,Math.PI*2);
      ctx.fillStyle=p.col; ctx.fill(); ctx.restore();
    });
    updateInfo(br);
  }

  function reset(){
    S.voltage=0; S.colorKey='red'; photons.length=0;
    document.getElementById('led-vslider').value=0;
    document.getElementById('led-vdisp').textContent='0.00 V';
    document.querySelectorAll('#led-color-grp .toggle-btn').forEach((b,i)=>
      b.classList.toggle('active',i===0));
    document.getElementById('led-thresh-disp').textContent='1.80 V';
    electrons.forEach((e,i)=>{ e.t=i/electrons.length; });
  }

  function init(){
    resize(); buildChart();
    bindSlider('led-vslider','led-vdisp','V',2,v=>{ S.voltage=v; });
    initToggle('led-color-grp',val=>{
      S.colorKey=val;
      const th=COLS[val].thresh;
      document.getElementById('led-thresh-disp').textContent=th.toFixed(2)+' V';
      document.getElementById('led-ithresh').textContent=th.toFixed(2)+' V';
      photons.length=0;
    });
    document.getElementById('led-play').addEventListener('click',()=>{
      S.playing=!S.playing;
      document.getElementById('led-play').textContent=S.playing?'⏸ 일시정지':'▶ 재생';
      if(S.playing){ lastT=performance.now(); loop(lastT); }
    });
    document.getElementById('led-reset').addEventListener('click',reset);
    initPrin('led-pbtn','led-ppanel');
    window.addEventListener('resize',resize);
    lastT=performance.now(); loop(lastT);
  }

  onReady(init);
})();
