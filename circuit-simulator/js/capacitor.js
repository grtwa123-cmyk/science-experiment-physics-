/* ============================================================
   축전기 충·방전 시뮬레이터 (capacitor.js)
   물리 모델 (RC 회로):
     τ = R·C
     충전  V(t) = V₀(1 - e^(-t/τ))
     방전  V(t) = V₀·e^(-t/τ)
     전류 크기  i(t) = (V₀/R)·e^(-t/τ)
   ============================================================ */
(function(){
  const S={
    v0:9, resistance:100, capacitance:1000,
    mode:'charge', running:false,
    elapsed:0, vc:0,
    tHistory:[], vcHistory:[]
  };
  const electrons=Array.from({length:10},(_,i)=>({t:i/10}));
  let ctx,W,H,lastT=0,chart=null;

  const getTau=()=>S.resistance*(S.capacitance*1e-6);
  const calcVc=t=>{
    const tau=getTau();
    return S.mode==='charge'
      ?S.v0*(1-Math.exp(-t/tau))
      :S.v0*Math.exp(-t/tau);
  };
  const calcI=t=>(S.v0/S.resistance)*Math.exp(-t/getTau())*1000;

  function resize(){
    const r=initCanvas(document.getElementById('cap-canvas'));
    ctx=r.ctx; W=r.w; H=r.h;
    draw();
  }

  function getPath(){
    const L=65,R=W-65,T=H/2-60,B=H/2+60;
    return [{x:L,y:B},{x:L,y:T},{x:R,y:T},{x:R,y:B},{x:L,y:B}];
  }

  function draw(){
    if(!ctx) return;
    ctx.clearRect(0,0,W,H);
    const tau=getTau();
    const ratio=clamp(S.vc/S.v0,0,1);
    const iMa=S.running?calcI(S.elapsed):0;
    const L=65,R=W-65,cy=H/2;
    const T=cy-60,B=cy+60,cx=W/2;

    ctx.fillStyle='#f8fafc'; ctx.fillRect(0,0,W,H);

    drawWire(ctx,[{x:L,y:T},{x:cx-14,y:T}]);
    drawWire(ctx,[{x:cx+14,y:T},{x:R,y:T}]);
    drawWire(ctx,[{x:L,y:B},{x:R,y:B}]);
    drawWire(ctx,[{x:L,y:T},{x:L,y:B}]);
    drawWire(ctx,[{x:R,y:T},{x:R,y:B}]);

    const pH=36, pW=5, gap=16;
    ctx.fillStyle='#2563eb'; ctx.fillRect(cx-gap/2-pW,T-pH/2,pW,pH);
    ctx.fillStyle='#ef4444'; ctx.fillRect(cx+gap/2,T-pH/2,pW,pH);

    const nc=Math.round(ratio*6);
    for(let i=0;i<nc;i++){
      const py=T-pH/2+5+i*5;
      ctx.fillStyle='#93c5fd'; ctx.font='8px sans-serif'; ctx.textAlign='center';
      ctx.fillText('−',cx-gap/2-pW-7,py+3);
      ctx.fillStyle='#fca5a5';
      ctx.fillText('+',cx+gap/2+pW+7,py+3);
    }

    ctx.fillStyle='#1e40af'; ctx.font='9px sans-serif'; ctx.textAlign='center';
    ctx.fillText('−극',cx-gap/2-pW,T-pH/2-6);
    ctx.fillStyle='#991b1b';
    ctx.fillText('+극',cx+gap/2+pW+2,T-pH/2-6);

    const gx=R+18, gH=B-T+20;
    ctx.fillStyle='#e5e7eb';
    ctx.beginPath(); ctx.roundRect(gx,T-10,16,gH,4); ctx.fill();
    const fH=gH*ratio;
    if(fH>0){
      const grd=ctx.createLinearGradient(0,B+10,0,B+10-fH);
      grd.addColorStop(0,'#2563eb'); grd.addColorStop(1,'#7c3aed');
      ctx.fillStyle=grd;
      ctx.beginPath(); ctx.roundRect(gx,B+10-fH,16,fH,4); ctx.fill();
    }
    ctx.fillStyle='#374151'; ctx.font='9px sans-serif'; ctx.textAlign='center';
    ctx.fillText('Vc',gx+8,T-16);
    ctx.fillText(S.vc.toFixed(1)+'V',gx+8,B+24);

    drawBattSym(ctx,L,cy);
    ctx.fillStyle='#374151'; ctx.font='10px sans-serif'; ctx.textAlign='center';
    ctx.fillText('V₀='+S.v0.toFixed(0)+'V',L,cy+36);

    drawResistor(ctx,R,cy,44,14);
    ctx.fillStyle='#92400e'; ctx.font='9px sans-serif'; ctx.textAlign='center';
    ctx.fillText(S.resistance+'Ω',R,cy+28);

    const bx=cx-55, by=cy+20;
    ctx.fillStyle='#faf5ff'; ctx.strokeStyle='#ddd6fe'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.roundRect(bx,by,110,54,8); ctx.fill(); ctx.stroke();
    ctx.fillStyle='#7c3aed'; ctx.font='bold 11px sans-serif'; ctx.textAlign='center';
    ctx.fillText('τ = '+tau.toFixed(2)+' s',cx,by+16);
    ctx.fillStyle='#4c1d95'; ctx.font='10px sans-serif';
    ctx.fillText('t = '+S.elapsed.toFixed(2)+' s',cx,by+32);
    ctx.fillText('Vc = '+S.vc.toFixed(2)+' V',cx,by+46);

    ctx.fillStyle=S.mode==='charge'?'#059669':'#dc2626';
    ctx.font='bold 12px sans-serif'; ctx.textAlign='center';
    ctx.fillText(S.mode==='charge'?'⬆ 충전 중':'⬇ 방전 중',cx,T-56);

    if(S.running&&iMa>0.1){
      ctx.globalAlpha=clamp(iMa/90,.1,1);
      drawArrow(ctx,L+10,T-2,L+36,T-2,'#7c3aed',2.5);
      ctx.globalAlpha=1;
    }
  }

  function updateInfo(iMa){
    const tau=getTau(), ratio=clamp(S.vc/S.v0,0,1);
    document.getElementById('cap-ivc').textContent=fmt(S.vc,2,'V');
    document.getElementById('cap-ii').textContent=fmt(iMa,2,'mA');
    document.getElementById('cap-itau').textContent=fmt(tau,2,'s');
    document.getElementById('cap-itime').textContent=fmt(S.elapsed,2,'s');
    document.getElementById('cap-ipct').textContent=fmt(ratio*100,1,'%');
  }

  function buildChart(){
    const el=document.getElementById('cap-chart'); if(!el) return;
    if(chart){ chart.destroy(); chart=null; }
    const tau=getTau(), total=tau*5;
    const labels=[],theory=[];
    for(let t=0;t<=total;t+=total/100){
      labels.push(t.toFixed(2));
      const v=S.mode==='charge'
        ?S.v0*(1-Math.exp(-t/tau))
        :S.v0*Math.exp(-t/tau);
      theory.push(parseFloat(v.toFixed(3)));
    }
    chart=new Chart(el,{type:'line',
      data:{labels,datasets:[
        {label:'이론 곡선',data:theory,borderColor:'#d1d5db',
         borderWidth:1.5,pointRadius:0,tension:.3,borderDash:[5,3]},
        {label:'실측 Vc(V)',data:[],
         borderColor:S.mode==='charge'?'#2563eb':'#ef4444',
         backgroundColor:S.mode==='charge'?'rgba(37,99,235,.08)':'rgba(239,68,68,.08)',
         borderWidth:2.5,pointRadius:0,tension:.3,fill:true,
         parsing:{xAxisKey:'x',yAxisKey:'y'}},
        {label:'τ 마커',data:[],borderColor:'#7c3aed',
         backgroundColor:'#7c3aed',pointRadius:8,pointStyle:'triangle',
         showLine:false,spanGaps:false,parsing:{xAxisKey:'x',yAxisKey:'y'}},
      ]},
      options:{responsive:true,maintainAspectRatio:false,
        plugins:{legend:{position:'top'}},
        scales:{
          x:{title:{display:true,text:'시간(s)'}},
          y:{title:{display:true,text:'전압 Vc(V)'},min:0,max:S.v0*1.05},
        }},
    });
  }

  function updateChart(){
    if(!chart) return;
    chart.data.datasets[1].data=S.vcHistory.map((v,i)=>({x:S.tHistory[i],y:v}));
    const tau=getTau();
    const vTau=S.mode==='charge'?S.v0*(1-Math.exp(-1)):S.v0*Math.exp(-1);
    chart.data.datasets[2].data=[{x:tau,y:vTau}];
    chart.update('none');
  }

  function loop(now){
    requestAnimationFrame(loop);
    const dt=calcDt(lastT,now); lastT=now;

    if(S.running){
      S.elapsed+=dt;
      S.vc=calcVc(S.elapsed);
      if(S.mode==='charge'&&S.vc>=S.v0*.999){
        S.vc=S.v0; S.running=false;
        document.getElementById('cap-start').textContent='▶ 시작';
        document.getElementById('cap-badge').className='badge badge-on';
        document.getElementById('cap-badge').textContent='충전 완료';
      }
      if(S.mode==='discharge'&&S.vc<=S.v0*.005){
        S.vc=0; S.running=false;
        document.getElementById('cap-start').textContent='▶ 시작';
        document.getElementById('cap-badge').className='badge badge-off';
        document.getElementById('cap-badge').textContent='방전 완료';
      }
      if(!S.tHistory.length||S.elapsed-S.tHistory[S.tHistory.length-1]>=0.05){
        S.tHistory.push(parseFloat(S.elapsed.toFixed(2)));
        S.vcHistory.push(parseFloat(S.vc.toFixed(3)));
        updateChart();
      }
    }

    const iMa=S.running?calcI(S.elapsed):0;
    const spd=clamp(iMa/90,0,.4);
    if(S.running&&spd>0.01)
      electrons.forEach(e=>{ e.t=(e.t+spd*dt*2)%1; });

    draw();
    if(S.running&&spd>0.01&&ctx){
      const path=getPath();
      const col=S.mode==='charge'?'#2563eb':'#ef4444';
      electrons.forEach(e=>{
        const t=S.mode==='charge'?e.t:(1-e.t+1)%1;
        const pt=ptOnPath(path,t); drawElectron(ctx,pt.x,pt.y,5,col);
      });
    }
    updateInfo(iMa);
  }

  function paramChanged(){
    S.elapsed=0; S.running=false;
    S.vc=S.mode==='charge'?0:S.v0;
    S.tHistory=[]; S.vcHistory=[];
    document.getElementById('cap-start').textContent='▶ 시작';
    document.getElementById('cap-badge').className='badge badge-off';
    document.getElementById('cap-badge').textContent='대기';
    buildChart();
  }

  function reset(){
    S.v0=9; S.resistance=100; S.capacitance=1000; S.mode='charge';
    S.running=false; S.elapsed=0; S.vc=0;
    S.tHistory=[]; S.vcHistory=[];
    document.getElementById('cap-v0slider').value=9;
    document.getElementById('cap-rslider').value=100;
    document.getElementById('cap-cslider').value=1000;
    document.getElementById('cap-v0disp').textContent='9.00 V';
    document.getElementById('cap-rdisp').textContent='100 Ω';
    document.getElementById('cap-cdisp').textContent='1000 μF';
    document.querySelectorAll('#cap-mode-grp .toggle-btn').forEach((b,i)=>
      b.classList.toggle('active',i===0));
    document.getElementById('cap-start').textContent='▶ 시작';
    document.getElementById('cap-badge').className='badge badge-off';
    document.getElementById('cap-badge').textContent='대기';
    electrons.forEach((e,i)=>{ e.t=i/electrons.length; });
    buildChart();
  }

  function init(){
    resize(); buildChart();
    bindSlider('cap-v0slider','cap-v0disp','V',2,v=>{ S.v0=v; paramChanged(); });
    bindSlider('cap-rslider','cap-rdisp','Ω',0,v=>{ S.resistance=v; paramChanged(); });
    bindSlider('cap-cslider','cap-cdisp','μF',0,v=>{ S.capacitance=v; paramChanged(); });
    initToggle('cap-mode-grp',val=>{
      S.mode=val;
      S.vc=val==='charge'?0:S.v0;
      paramChanged();
    });
    document.getElementById('cap-start').addEventListener('click',()=>{
      S.running=!S.running;
      const btn=document.getElementById('cap-start');
      if(S.running){
        btn.textContent='⏸ 일시정지';
        document.getElementById('cap-badge').className='badge badge-active';
        document.getElementById('cap-badge').textContent=
          S.mode==='charge'?'충전 중':'방전 중';
      } else {
        btn.textContent='▶ 재개';
        document.getElementById('cap-badge').className='badge badge-off';
        document.getElementById('cap-badge').textContent='일시정지';
      }
    });
    document.getElementById('cap-reset').addEventListener('click',reset);
    initPrin('cap-pbtn','cap-ppanel');
    window.addEventListener('resize',resize);
    lastT=performance.now(); loop(lastT);
  }

  onReady(init);
})();
