(function(){
  "use strict";

  /* ---------- 农历生日换算 ---------- */
  function nextBirthday(now){
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    for(let y=now.getFullYear(); y<=now.getFullYear()+1; y++){
      const solar = Lunar.fromYmd(y, 4, 10).getSolar();
      const d = new Date(solar.getYear(), solar.getMonth()-1, solar.getDay());
      if(d >= today) return d;
    }
    return null;
  }
  function prevBirthday(now){
    for(let y=now.getFullYear(); y>=now.getFullYear()-1; y--){
      const solar = Lunar.fromYmd(y, 4, 10).getSolar();
      const d = new Date(solar.getYear(), solar.getMonth()-1, solar.getDay());
      if(d < new Date(now.getFullYear(), now.getMonth(), now.getDate())) return d;
    }
    return null;
  }

  const WEEK = ['日','一','二','三','四','五','六'];
  const target = nextBirthday(new Date());
  const prev = prevBirthday(new Date());

  /* 周岁数字蜡烛：1999 年出生，每年自动 +1 */
  const BIRTH_YEAR = 1999;
  const age = Math.max(1, target.getFullYear() - BIRTH_YEAR);
  (function setAgeCandles(){
    const s = String(age);
    const tensEl = document.getElementById('ageTens');
    const onesEl = document.getElementById('ageOnes');
    onesEl.textContent = s.slice(-1);
    if(s.length > 1){
      tensEl.textContent = s[0];
    }else{
      document.getElementById('tensGroup').style.display = 'none';
      document.getElementById('onesGroup').setAttribute('transform','translate(-15,0)');
    }
  })();

  document.getElementById('targetText').innerHTML =
    '下一个农历生日是 <strong>' +
    target.getFullYear() + ' 年 ' + (target.getMonth()+1) + ' 月 ' + target.getDate() + ' 日' +
    '（星期' + WEEK[target.getDay()] + '）· 届时满 ' + age + ' 周岁</strong>';

  const elD=document.getElementById('d'), elH=document.getElementById('h'),
        elM=document.getElementById('m'), elS=document.getElementById('s'),
        fill=document.getElementById('fill'), pct=document.getElementById('pct');
  const pad = n => String(n).padStart(2,'0');

  function tick(){
    const now = new Date();
    const end = new Date(target.getFullYear(), target.getMonth(), target.getDate(), 0,0,0);
    let diff = end - now;
    if(diff <= 0 && diff > -86400000){
      document.body.classList.add('is-today');
      if(!tick.celebrating){ tick.celebrating = true; celebrate(); }
      return;
    }
    if(diff <= 0){ location.reload(); return; }
    const dd = Math.floor(diff/86400000); diff -= dd*86400000;
    const hh = Math.floor(diff/3600000);  diff -= hh*3600000;
    const mm = Math.floor(diff/60000);    diff -= mm*60000;
    const ss = Math.floor(diff/1000);
    elD.textContent = dd; elH.textContent = pad(hh);
    elM.textContent = pad(mm); elS.textContent = pad(ss);

    const span = end - prev;
    const p = Math.min(100, Math.max(0, (now - prev)/span*100));
    fill.style.width = p.toFixed(2) + '%';
    pct.textContent = p.toFixed(1) + '%';

    const totalSec = Math.max(0, end - now);
    document.getElementById('wks').textContent = Math.floor(totalSec/604800000);
    document.getElementById('hrs').textContent = Math.floor(totalSec/3600000).toLocaleString();
    document.getElementById('sleeps').textContent = Math.ceil(totalSec/86400000);
    document.getElementById('cups').textContent = Math.floor(totalSec/86400000*0.5);
  }
  tick();
  setInterval(tick, 1000);

  /* ---------- 光点与彩带（同一画布） ---------- */
  const canvas = document.getElementById('fx');
  const ctx = canvas.getContext('2d');
  const CONFETTI_COLORS = ['#F0A868','#E07856','#F2CC8F','#E8B4B8','#F2E6D8'];
  let confetti = [], embers = [];

  function resize(){ canvas.width = innerWidth; canvas.height = innerHeight; }
  addEventListener('resize', resize); resize();

  /* 烛光上升光点：从蛋糕/蜡烛区域缓缓升起 */
  function spawnEmber(){
    embers.push({
      x: innerWidth/2 + (Math.random()-0.5) * innerWidth * 0.32,
      y: innerHeight * (0.52 + Math.random()*0.14),
      r: 0.8 + Math.random()*2.2,
      vy: -(0.25 + Math.random()*0.55),
      sway: Math.random()*Math.PI*2,
      swaySpeed: 0.008 + Math.random()*0.02,
      life: 1,
      decay: 0.0022 + Math.random()*0.003,
      warm: Math.random() < 0.75
    });
  }

  function burst(x, y, n){
    for(let i=0;i<n;i++){
      confetti.push({
        x, y,
        vx:(Math.random()-0.5)*13,
        vy:-(3.5+Math.random()*8),
        w:4+Math.random()*6, h:7+Math.random()*7,
        rot:Math.random()*Math.PI*2,
        vr:(Math.random()-0.5)*0.28,
        color:CONFETTI_COLORS[(Math.random()*CONFETTI_COLORS.length)|0],
        star: Math.random() < 0.3,
        life:1, decay:0.004+Math.random()*0.006,
        wob:Math.random()*Math.PI*2
      });
    }
  }

  function drawStar(r){
    ctx.beginPath();
    for(let i=0;i<8;i++){
      const ang = i*Math.PI/4, rad = i%2===0 ? r : r*0.45;
      ctx.lineTo(Math.cos(ang)*rad, Math.sin(ang)*rad);
    }
    ctx.closePath(); ctx.fill();
  }

  function loop(){
    ctx.clearRect(0,0,canvas.width,canvas.height);

    /* 光点 */
    if(Math.random() < 0.55 && embers.length < 90) spawnEmber();
    embers = embers.filter(p => p.life > 0 && p.y > -10);
    for(const p of embers){
      p.sway += p.swaySpeed;
      p.x += Math.sin(p.sway) * 0.5;
      p.y += p.vy;
      p.life -= p.decay;
      const a = Math.max(0, p.life) * (0.5 + 0.5*Math.sin(p.sway*3));
      ctx.save();
      ctx.globalAlpha = a * 0.9;
      ctx.shadowBlur = 10;
      ctx.shadowColor = p.warm ? 'rgba(255,190,110,.9)' : 'rgba(255,230,190,.9)';
      ctx.fillStyle = p.warm ? '#FFD9A0' : '#FFF3E0';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
      ctx.fill();
      ctx.restore();
    }

    /* 彩带 */
    confetti = confetti.filter(p=>p.life>0);
    for(const p of confetti){
      p.vy += 0.15;
      p.vx *= 0.992; p.vy *= 0.995;
      p.wob += 0.15;
      p.x += p.vx + Math.sin(p.wob)*0.8;
      p.y += p.vy;
      p.rot += p.vr;
      p.life -= p.decay;
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.shadowBlur = 6;
      ctx.shadowColor = p.color;
      if(p.star){ drawStar(4.5); }
      else{ ctx.fillRect(-p.w/2, -p.h/2, p.w, p.h*Math.abs(Math.sin(p.wob))*0.6+0.4*p.h); }
      ctx.restore();
    }
    requestAnimationFrame(loop);
  }
  loop();

  addEventListener('pointerdown', e => burst(e.clientX, e.clientY, 80));
  setTimeout(()=>{ burst(innerWidth/2, innerHeight*0.3, 110); }, 500);

  function celebrate(){
    let k=0;
    const iv = setInterval(()=>{
      burst(Math.random()*innerWidth, innerHeight*0.2, 70);
      if(++k>9) clearInterval(iv);
    }, 450);
  }
})();
