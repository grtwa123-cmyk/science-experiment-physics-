/* ============================================================
   NPN 트랜지스터 시뮬레이터 (transistor.js)
   물리 모델 (교과서 표준):
     IB  = (VB - VBE_ON) / RB          (VB ≥ VBE_ON 일 때)
     VBE = min(VB, VBE_ON)             (도통 시 약 0.7V로 고정)
     IC  = β·IB                        (활성 영역)
     포화: IC = (Vcc - VCE_SAT)/RC,  VCE = VCE_SAT
     활성: VCE = Vcc - IC·RC
   ============================================================ */
(function(){
  const BETA=100, VBE_ON=0.7, RB=10000, RC=220, VCE_SAT=0.2;
  const S={vb:0,vcc:5,playing:true};
  const bElec=Array.from({length:6},(_,i)=>({t:i/6}));
  const cElec=Array.from({length:8},(_,i)=>({t:i/8}));
  let ctx,W,H,lastT=0,chart=null;

  function calcP(vb,vcc){
    const vbSrc=Math.max(vb,0);
    const vbe=Math.min(vbSrc,VBE_ON);           // 베이스-이미터 접합 전압
    // 차단: 베이스가 문턱 미만이거나 컬렉터 전원이 사실상 없음
    if(vbSrc<VBE_ON||vcc<=VCE_SAT)
      return {ib:0,ic:0,vce:Math.max(vcc,0),vbe:vbe,region:'cutoff'};
    const ib_A=(vbSrc-VBE_ON)/RB;
    const ib_uA=ib_A*1e6;
    const ic_act=BETA*ib_A;
    const ic_sat=(vcc-VCE_SAT)/RC;
    if(ic_act>=ic_sat)
      return {ib:ib_uA,ic:ic_sat*1000,vce:VCE_SAT,vbe:VBE_ON,region:'saturation'};
    return {ib:ib_uA,ic:ic_act*1000,vce:vcc-ic_act*RC,vbe:VBE_ON,region:'active'};
  }

  const rlabel=r=>r==='cutoff'?'차단':r==='active'?'활성':'포화';

  function resize(){
    const r=initCanvas(document.getElementById('tr-canvas'));
    ctx=r.ctx; W=r.w; H=r.h;
    draw();
  }

  function draw(){
    if(!ctx) return;
    ctx.clearRect(0,0,W,H);
    const p=calcP(S.vb,S.vcc);
    const on=p.region!=='cutoff';
    const bx=W*.42, cy=H*.50;

    ctx.fillStyle='#f8fafc'; ctx.fillRect(0,0,W,H);

    ctx.fillStyle=on?'#dbeafe':'#f3f4f6';
    ctx.strokeStyle=on?'#2563eb':'#9ca3af'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.arc(bx,cy,32,0,Math.PI*2); ctx.fill(); ctx.stroke();
    ctx.fillStyle=on?'#1e40af':'#6b7280';
    ctx.font='bold 10px sans-serif'; ctx.textAlign='center';
    ctx.fillText('NPN',bx,cy+4);

    drawWire(ctx,[{x:W*.10,y:cy},{x:bx-32,y:cy}]);
    ctx.fillStyle='#7c3aed'; ctx.font='bold 11px sans-serif';
    ctx.textAlign='right'; ctx.fillText('B',bx-36,cy+4);
    drawBattSym(ctx,W*.10,cy+20);
    ctx.fillStyle='#374151'; ctx.font='10px sans-serif';
    ctx.textAlign='center'; ctx.fillText('Vᴮ='+S.vb.toFixed(2)+'V',W*.10,cy-14);

    drawWire(ctx,[{x:bx,y:H*.12},{x:bx,y:cy-32}]);
    const ledOn=on&&p.ic>1;
    ctx.fillStyle=ledOn?`rgba(16,185,129,${clamp(p.ic/20,.1,1)*.9+.1})`:'#d1d5db';
    ctx.strokeStyle=ledOn?'#059669':'#9ca3af'; ctx.lineWidth=1.8;
    ctx.beginPath();
    ctx.moveTo(bx-10,H*.20); ctx.lineTo(bx-10,H*.30); ctx.lineTo(bx+10,H*.25);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(bx+10,H*.20); ctx.lineTo(bx+10,H*.30); ctx.stroke();
    if(ledOn){
      const br=clamp(p.ic/20,.1,1);
      ctx.globalAlpha=br;
      drawArrow(ctx,bx+14,H*.22,bx+26,H*.15,'#f59e0b',1.5);
      drawArrow(ctx,bx+14,H*.28,bx+26,H*.22,'#f59e0b',1.5);
      ctx.globalAlpha=1;
    }
    ctx.fillStyle='#374151'; ctx.font='bold 10px sans-serif';
    ctx.textAlign='center'; ctx.fillText('C',bx+16,cy-36);
    ctx.fillText('Vcc='+S.vcc.toFixed(1)+'V',bx,H*.07);

    drawWire(ctx,[{x:bx,y:cy+32},{x:bx,y:H*.88}]);
    [14,9,4].forEach((w,i)=>{
      ctx.strokeStyle='#374151'; ctx.lineWidth=1.5+i*.3;
      ctx.beginPath();
      ctx.moveTo(bx-w,H*.88+i*5); ctx.lineTo(bx+w,H*.88+i*5); ctx.stroke();
    });
    ctx.fillStyle='#374151'; ctx.font='bold 11px sans-serif';
    ctx.textAlign='left'; ctx.fillText('E',bx+16,cy+44);

    const ix=W*.66, iy=cy-44;
    ctx.fillStyle='#fff'; ctx.strokeStyle='#e2e8f0'; ctx.lineWidth=1;
    ctx.beginPath(); ctx.roundRect(ix,iy,120,96,8); ctx.fill(); ctx.stroke();
    ctx.fillStyle='#374151'; ctx.font='10px sans-serif'; ctx.textAlign='left';
    [`Iᴮ = ${p.ib.toFixed(1)} μA`,`Iᴄ = ${p.ic.toFixed(2)} mA`,
     `Vce = ${p.vce.toFixed(2)} V`,`β = 100`,`영역: ${rlabel(p.region)}`]
    .forEach((l,i)=>ctx.fillText(l,ix+8,iy+16+i*16));
  }

  function getBPath(){
    const bx=W*.42,cy=H*.5;
    return [{x:bx,y:H*.78},{x:bx,y:cy+20},{x:bx-10,y:cy},
            {x:W*.18,y:cy},{x:W*.10,y:cy}];
  }
  function getCPath(){
    const bx=W*.42,cy=H*.5;
    return [{x:bx,y:H*.12},{x:bx,y:cy-20},{x:bx+5,y:cy},
            {x:bx,y:cy+20},{x:bx,y:H*.78}];
  }

  function updateInfo(p){
    document.getElementById('tr-ivbe').textContent=fmt(p.vbe,2,'V');
    document.getElementById('tr-iib').textContent=fmt(p.ib,1,'μA');
    document.getElementById('tr-iic').textContent=fmt(p.ic,2,'mA');
    document.getElementById('tr-ivce').textContent=fmt(p.vce,2,'V');
    document.getElementById('tr-iregion').textContent=rlabel(p.region);
    const b=document.getElementById('tr-badge');
    b.className='badge '+
      (p.region==='cutoff'?'badge-cutoff':p.region==='active'?'badge-active':'badge-saturate');
    b.textContent=rlabel(p.region);
  }

  function buildChart(){
    const el=document.getElementById('tr-chart'); if(!el) return;
    const labels=[],data=[];
    for(let ib=0;ib<=200;ib+=2){
      labels.push(ib+' μA');
      const ia=BETA*ib*1e-6*1000;
      const isat=(S.vcc-VCE_SAT)/RC*1000;
      data.push(Math.min(ia,isat));
    }
    chart=new Chart(el,{type:'line',
      data:{labels,datasets:[
        {label:'Iᴄ(mA)',data,borderColor:'#10b981',
         backgroundColor:'rgba(16,185,129,.1)',borderWidth:2.5,pointRadius:0,tension:.2},
        {label:'현재 동작점',data:[],borderColor:'#ef4444',
         backgroundColor:'#ef4444',pointRadius:10,showLine:false,spanGaps:false},
      ]},
      options:{responsive:true,maintainAspectRatio:false,
        plugins:{legend:{position:'top'}},
        scales:{
          x:{title:{display:true,text:'Iᴮ(μA)'},
             ticks:{callback:(v,i)=>i%20===0?labels[i]:'',maxTicksLimit:11}},
          y:{title:{display:true,text:'Iᴄ(mA)'},min:0},
        }},
    });
  }

  function updateMarker(){
    if(!chart) return;
    const p=calcP(S.vb,S.vcc);
    // 포화시 Ic는 Ib와 무관하게 일정하므로 그래프 곡선과 동일한 y로 마커 표시
    const isat=(S.vcc-VCE_SAT)/RC*1000;
    const idx=Math.round(clamp(p.ib,0,200)/2);
    chart.data.datasets[1].data=chart.data.labels.map((_,i)=>
      i===idx?Math.min(p.ic,isat):null);
    chart.update('none');
  }

  function loop(now){
    if(!S.playing) return;
    requestAnimationFrame(loop);
    const dt=calcDt(lastT,now); lastT=now;
    const p=calcP(S.vb,S.vcc);
    const on=p.region!=='cutoff';
    const bs=clamp(p.ib/200,.01,.3), cs=clamp(p.ic/30,.02,.5);
    if(on){
      bElec.forEach(e=>{ e.t=(e.t+bs*dt*2)%1; });
      cElec.forEach(e=>{ e.t=(e.t+cs*dt*2)%1; });
    }
    draw();
    if(on&&ctx){
      const bp=getBPath(); bElec.forEach(e=>{
        const pt=ptOnPath(bp,e.t); drawElectron(ctx,pt.x,pt.y,4,'#7c3aed');
      });
      const cp=getCPath(); cElec.forEach(e=>{
        const pt=ptOnPath(cp,e.t); drawElectron(ctx,pt.x,pt.y,5,'#10b981');
      });
    }
    updateInfo(p);
  }

  function reset(){
    S.vb=0; S.vcc=5;
    document.getElementById('tr-vbslider').value=0;
    document.getElementById('tr-vccslider').value=5;
    document.getElementById('tr-vbdisp').textContent='0.00 V';
    document.getElementById('tr-vccdisp').textContent='5.00 V';
    bElec.forEach((e,i)=>{ e.t=i/bElec.length; });
    cElec.forEach((e,i)=>{ e.t=i/cElec.length; });
    updateMarker();
  }

  function init(){
    resize(); buildChart();
    bindSlider('tr-vbslider','tr-vbdisp','V',2,v=>{ S.vb=v; updateMarker(); });
    bindSlider('tr-vccslider','tr-vccdisp','V',1,v=>{ S.vcc=v; updateMarker(); });
    document.getElementById('tr-play').addEventListener('click',()=>{
      S.playing=!S.playing;
      document.getElementById('tr-play').textContent=S.playing?'⏸ 일시정지':'▶ 재생';
      if(S.playing){ lastT=performance.now(); loop(lastT); }
    });
    document.getElementById('tr-reset').addEventListener('click',reset);
    initPrin('tr-pbtn','tr-ppanel');
    window.addEventListener('resize',resize);
    lastT=performance.now(); loop(lastT);
  }

  onReady(init);
})();
