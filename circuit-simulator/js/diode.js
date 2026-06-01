/* ============================================================
   다이오드 시뮬레이터 (diode.js)
   물리 모델: 다이오드 방정식의 지수적 무릎 + 보호저항에 의한
   선형 제한을 합친 소프트플러스 근사
     I(V) = (Vt_eff/Rp)·ln(1 + e^((V-Vth)/Vt_eff))    [A]
   - V ≪ Vth 이면 I ≈ 0 (지수적으로 작음)
   - V ≫ Vth 이면 I ≈ (V-Vth)/Rp (보호저항 제한 선형영역)
   ============================================================ */
(function(){
  const VTH=0.7;      // 문턱 전압 (V)
  const RP=100;       // 보호 저항 (Ω)
  const VT_EFF=0.05;  // 접합 완만도 (n·V_T 근사)
  const I_ON=0.5;     // 도통 판정 기준 전류 (mA)

  const S={voltage:0,isForward:true,playing:true};
  const electrons=Array.from({length:10},(_,i)=>({t:i/10}));
  let ctx,W,H,lastT=0,chart=null;

  // mA 단위 전류
  function calcI(v,fwd){
    if(!fwd) return -0.02;           // 역방향 포화전류(누설)
    if(v<=0) return 0;
    const iA=(VT_EFF/RP)*Math.log(1+Math.exp((v-VTH)/VT_EFF));
    return iA*1000;
  }

  function resize(){
    const r=initCanvas(document.getElementById('d-canvas'));
    ctx=r.ctx; W=r.w; H=r.h;
    draw();
  }

  function draw(){
    if(!ctx) return;
    ctx.clearRect(0,0,W,H);
    const cx=W/2,cy=H/2;
    const I=calcI(S.voltage,S.isForward);
    const on=S.isForward&&I>I_ON;

    ctx.fillStyle='#f8fafc'; ctx.fillRect(0,0,W,H);

    const L=55,R=W-55,T=cy-60,B=cy+60;
    drawWire(ctx,[{x:L,y:cy},{x:L,y:T},{x:R,y:T},{x:R,y:cy}]);
    drawWire(ctx,[{x:L,y:cy},{x:L,y:B},{x:R,y:B},{x:R,y:cy}]);

    ctx.fillStyle='#d1fae5'; ctx.strokeStyle='#059669'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.roundRect(cx-90,cy-22,85,44,4); ctx.fill(); ctx.stroke();
    ctx.fillStyle='#065f46'; ctx.font='bold 13px sans-serif';
    ctx.textAlign='center'; ctx.fillText('N형',cx-48,cy+5);
    ['e⁻','e⁻','e⁻'].forEach((t,i)=>{
      ctx.fillStyle='#2563eb'; ctx.font='10px sans-serif';
      ctx.fillText(t,cx-76+i*22,cy-8);
    });

    ctx.fillStyle=on?'rgba(239,68,68,.2)':'#fee2e2';
    ctx.strokeStyle=on?'#ef4444':'#dc2626'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.roundRect(cx+5,cy-22,85,44,4); ctx.fill(); ctx.stroke();
    ctx.fillStyle=on?'#ef4444':'#7f1d1d'; ctx.font='bold 13px sans-serif';
    ctx.textAlign='center'; ctx.fillText('P형',cx+48,cy+5);
    ['+','+','+'].forEach((t,i)=>{
      ctx.fillStyle='#ef4444'; ctx.font='11px sans-serif';
      ctx.fillText(t,cx+18+i*22,cy-8);
    });

    ctx.strokeStyle='#7c3aed'; ctx.lineWidth=1.5; ctx.setLineDash([4,3]);
    ctx.beginPath(); ctx.moveTo(cx,cy-26); ctx.lineTo(cx,cy+26); ctx.stroke();
    ctx.setLineDash([]); ctx.fillStyle='#7c3aed'; ctx.font='9px sans-serif';
    ctx.textAlign='center'; ctx.fillText('PN접합',cx,cy-28);

    drawBattSym(ctx,L,cy);
    ctx.fillStyle='#374151'; ctx.font='10px sans-serif'; ctx.textAlign='center';
    ctx.fillText((S.isForward?S.voltage:-S.voltage).toFixed(1)+'V',L,cy+36);

    drawResistor(ctx,R-5,T,44,14);

    ctx.fillStyle=on?'#059669':'#6b7280'; ctx.font='bold 11px sans-serif';
    ctx.textAlign='center';
    ctx.fillText(`I = ${Math.max(I,0).toFixed(1)} mA`,cx,cy+38);

    if(on) drawArrow(ctx,cx-25,cy+50,cx+25,cy+50,'#059669');

    if(!S.isForward){
      ctx.strokeStyle='rgba(239,68,68,.5)'; ctx.lineWidth=2; ctx.setLineDash([5,3]);
      ctx.beginPath(); ctx.moveTo(cx-85,cy-20); ctx.lineTo(cx+88,cy+20); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx+88,cy-20); ctx.lineTo(cx-85,cy+20); ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  function getPath(){
    const cx=W/2,cy=H/2;
    return [{x:60,y:cy},{x:cx-25,y:cy},{x:cx+25,y:cy},{x:W-60,y:cy}];
  }

  function updateInfo(I){
    const v=S.isForward?S.voltage:-S.voltage;
    const on=S.isForward&&I>I_ON;
    document.getElementById('d-iv').textContent=fmt(v,2,'V');
    document.getElementById('d-ii').textContent=fmt(I,2,'mA');
    document.getElementById('d-ir').textContent=
      I>0.1?fmt(S.voltage/(I/1000),0,'Ω'):'∞ Ω';
    document.getElementById('d-istate').textContent=
      !S.isForward?'역방향 차단':on?'순방향 도통':'차단(V<문턱)';
    const b=document.getElementById('d-badge');
    b.className='badge '+(on?'badge-on':'badge-off');
    b.textContent=on?'ON':(!S.isForward?'역방향':'OFF');
  }

  function buildChart(){
    const el=document.getElementById('d-chart'); if(!el) return;
    const labels=[],fwd=[];
    for(let v=0;v<=6;v+=0.05){
      labels.push(v.toFixed(2));
      fwd.push(calcI(v,true));
    }
    chart=new Chart(el,{
      type:'line',
      data:{labels,datasets:[
        {label:'순방향 전류(mA)',data:fwd,borderColor:'#2563eb',
         backgroundColor:'rgba(37,99,235,.08)',borderWidth:2.5,pointRadius:0,tension:.3},
        {label:'현재 동작점',data:[],borderColor:'#ef4444',
         backgroundColor:'#ef4444',pointRadius:8,showLine:false,spanGaps:false},
      ]},
      options:{responsive:true,maintainAspectRatio:false,
        plugins:{legend:{position:'top'}},
        scales:{
          x:{title:{display:true,text:'전압 (V)'},
             ticks:{callback:(v,i)=>i%20===0?labels[i]:'',maxTicksLimit:9}},
          y:{title:{display:true,text:'전류 (mA)'},min:0,max:60},
        }},
    });
  }

  function updateMarker(){
    if(!chart) return;
    const I=calcI(S.voltage,S.isForward);
    chart.data.datasets[1].data=chart.data.labels.map(l=>{
      const tv=S.isForward?S.voltage:-S.voltage;
      return Math.abs(parseFloat(l)-Math.abs(tv))<0.04?Math.max(I,0):null;
    });
    chart.update('none');
  }

  function loop(now){
    if(!S.playing) return;
    requestAnimationFrame(loop);
    const dt=calcDt(lastT,now); lastT=now;
    const I=calcI(S.voltage,S.isForward);
    const on=S.isForward&&I>I_ON;
    const spd=clamp(I/60,.02,.35);
    if(on) electrons.forEach(e=>{ e.t=(e.t+spd*dt*2)%1; });
    draw();
    if(on&&ctx){
      const p=getPath();
      electrons.forEach(e=>{ const pt=ptOnPath(p,e.t); drawElectron(ctx,pt.x,pt.y); });
    }
    updateInfo(I);
  }

  function reset(){
    S.voltage=0; S.isForward=true;
    document.getElementById('d-vslider').value=0;
    document.getElementById('d-vdisp').textContent='0.00 V';
    document.querySelectorAll('#d-bias-grp .toggle-btn').forEach((b,i)=>
      b.classList.toggle('active',i===0));
    electrons.forEach((e,i)=>{ e.t=i/electrons.length; });
    updateMarker();
  }

  function init(){
    resize(); buildChart();
    bindSlider('d-vslider','d-vdisp','V',2,v=>{ S.voltage=v; updateMarker(); });
    initToggle('d-bias-grp',val=>{ S.isForward=val==='forward'; updateMarker(); });
    document.getElementById('d-play').addEventListener('click',()=>{
      S.playing=!S.playing;
      document.getElementById('d-play').textContent=S.playing?'⏸ 일시정지':'▶ 재생';
      if(S.playing){ lastT=performance.now(); loop(lastT); }
    });
    document.getElementById('d-reset').addEventListener('click',reset);
    initPrin('d-pbtn','d-ppanel');
    window.addEventListener('resize',resize);
    lastT=performance.now(); loop(lastT);
  }

  onReady(init);
})();
