/* ============================================================
   옴의 법칙 시뮬레이터 (ohm.js)
   물리 모델: I = V / R  (mA),  P = V·I (mW)
   ============================================================ */
(function(){
  const S={voltage:0,resistance:100,playing:true};
  const electrons=Array.from({length:12},(_,i)=>({t:i/12}));
  let ctx,W,H,lastT=0,chart=null;

  const calcI=(v,r)=>r>0?(v/r)*1000:0;

  function resize(){
    const r=initCanvas(document.getElementById('ohm-canvas'));
    ctx=r.ctx; W=r.w; H=r.h;
    draw();
  }

  function getPath(){
    const L=70,R=W-70,T=65,B=H-65;
    return [{x:L,y:B},{x:L,y:T},{x:R,y:T},{x:R,y:B},{x:L,y:B}];
  }

  function draw(){
    if(!ctx) return;
    ctx.clearRect(0,0,W,H);
    const I=calcI(S.voltage,S.resistance);
    const P=S.voltage*I;
    const L=70,R=W-70,T=65,B=H-65;
    const cx=(L+R)/2;

    ctx.fillStyle='#f8fafc'; ctx.fillRect(0,0,W,H);
    drawWire(ctx,getPath());

    drawBattSym(ctx,L,(T+B)/2);
    ctx.fillStyle='#374151'; ctx.font='10px sans-serif'; ctx.textAlign='center';
    ctx.fillText(S.voltage.toFixed(1)+'V',L,(T+B)/2+34);
    ctx.fillStyle='#ef4444'; ctx.font='bold 11px sans-serif';
    ctx.fillText('V = '+S.voltage.toFixed(1)+'V',L-40,(T+B)/2);

    drawResistor(ctx,cx,T,60,18);
    ctx.fillStyle='#92400e'; ctx.font='11px sans-serif'; ctx.textAlign='center';
    ctx.fillText('R = '+S.resistance+'Ω',cx,T-16);

    const fx=R-55,fy=(T+B)/2-22;
    ctx.fillStyle='#eff6ff'; ctx.strokeStyle='#bfdbfe'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.roundRect(fx,fy,110,48,8); ctx.fill(); ctx.stroke();
    ctx.fillStyle='#1e40af'; ctx.font='bold 13px sans-serif'; ctx.textAlign='center';
    ctx.fillText('V = I × R',fx+55,fy+18);
    ctx.fillStyle='#3b82f6'; ctx.font='10px sans-serif';
    ctx.fillText('P = '+P.toFixed(1)+' mW',fx+55,fy+36);

    ctx.fillStyle='#2563eb'; ctx.font='bold 11px sans-serif'; ctx.textAlign='center';
    ctx.fillText('I = '+I.toFixed(2)+' mA',cx,B+22);

    if(I>5){
      const a=clamp(I/100,.1,.8);
      for(let i=0;i<4;i++){
        const hx=cx-20+i*14;
        const hy=T-8-(Date.now()/200+i*90)%14;
        ctx.globalAlpha=a*.6;
        ctx.fillStyle='#f59e0b';
        ctx.beginPath(); ctx.arc(hx,hy,3,0,Math.PI*2); ctx.fill();
        ctx.globalAlpha=1;
      }
    }
  }

  function updateInfo(I){
    document.getElementById('ohm-iv').textContent=fmt(S.voltage,2,'V');
    document.getElementById('ohm-ir').textContent=fmt(S.resistance,0,'Ω');
    document.getElementById('ohm-ii').textContent=fmt(I,2,'mA');
    document.getElementById('ohm-ip').textContent=fmt(S.voltage*I,2,'mW');
  }

  function buildChart(){
    const el=document.getElementById('ohm-chart'); if(!el) return;
    const labels=[];
    for(let v=0;v<=12;v+=0.5) labels.push(v.toFixed(1));
    chart=new Chart(el,{type:'line',
      data:{labels,datasets:[
        {label:'R=100Ω',data:labels.map(l=>parseFloat(l)/100*1000),
         borderColor:'#ef4444',borderWidth:2,pointRadius:0,tension:.1},
        {label:'R=250Ω',data:labels.map(l=>parseFloat(l)/250*1000),
         borderColor:'#10b981',borderWidth:2,pointRadius:0,tension:.1},
        {label:'R=500Ω',data:labels.map(l=>parseFloat(l)/500*1000),
         borderColor:'#2563eb',borderWidth:2,pointRadius:0,tension:.1},
        {label:'현재값',data:[],borderColor:'#7c3aed',
         backgroundColor:'#7c3aed',pointRadius:9,showLine:false,spanGaps:false},
      ]},
      options:{responsive:true,maintainAspectRatio:false,
        plugins:{legend:{position:'top'}},
        scales:{
          x:{title:{display:true,text:'전압 V(V)'}},
          y:{title:{display:true,text:'전류 I(mA)'},min:0},
        }},
    });
  }

  function updateMarker(){
    if(!chart) return;
    const I=calcI(S.voltage,S.resistance);
    chart.data.datasets[3].data=chart.data.labels.map(l=>
      Math.abs(parseFloat(l)-S.voltage)<0.3?I:null);
    chart.update('none');
  }

  function loop(now){
    if(!S.playing) return;
    requestAnimationFrame(loop);
    const dt=calcDt(lastT,now); lastT=now;
    const I=calcI(S.voltage,S.resistance);
    const spd=clamp(I/120,0,.5);
    electrons.forEach(e=>{ e.t=(e.t+spd*dt*2)%1; });
    draw();
    if(spd>0.001&&ctx){
      const path=getPath();
      electrons.forEach(e=>{ const pt=ptOnPath(path,e.t); drawElectron(ctx,pt.x,pt.y); });
    }
    updateInfo(I);
  }

  function reset(){
    S.voltage=0; S.resistance=100;
    document.getElementById('ohm-vslider').value=0;
    document.getElementById('ohm-rslider').value=100;
    document.getElementById('ohm-vdisp').textContent='0.00 V';
    document.getElementById('ohm-rdisp').textContent='100 Ω';
    electrons.forEach((e,i)=>{ e.t=i/electrons.length; });
    updateMarker();
  }

  function init(){
    resize(); buildChart();
    bindSlider('ohm-vslider','ohm-vdisp','V',2,v=>{ S.voltage=v; updateMarker(); });
    bindSlider('ohm-rslider','ohm-rdisp','Ω',0,v=>{ S.resistance=v; updateMarker(); });
    document.getElementById('ohm-play').addEventListener('click',()=>{
      S.playing=!S.playing;
      document.getElementById('ohm-play').textContent=S.playing?'⏸ 일시정지':'▶ 재생';
      if(S.playing){ lastT=performance.now(); loop(lastT); }
    });
    document.getElementById('ohm-reset').addEventListener('click',reset);
    initPrin('ohm-pbtn','ohm-ppanel');
    window.addEventListener('resize',resize);
    lastT=performance.now(); loop(lastT);
  }

  onReady(init);
})();
