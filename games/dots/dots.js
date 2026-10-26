// 寻点描画独立页：绿点沿图案主线条依次出现（不再是随机散点），
// 点中一个点，线条就顺着手的位置显现一段；角色含非动物图案。
const {animals}=VGAnimals;
const stage=$('#stage');
const NS='http://www.w3.org/2000/svg';
const TOTAL=16;
let animal='car',hits=0;
function svg(preview=false){
 const a=animals[animal];
 return `<svg viewBox="0 0 480 410" preserveAspectRatio="xMidYMid meet" aria-label="${a.name}" xmlns="http://www.w3.org/2000/svg"><g stroke="#34443c" stroke-width="5" stroke-linejoin="round" stroke-linecap="round">${a.parts.map((p,i)=>`<path data-part="${i}" d="${p[0]}" fill="${preview?p[1]:'#fffdf5'}"/>`).join('')}<path d="${a.detail}" fill="none" stroke-width="6"/></g></svg>`;
}
// 绿点半径（SVG 用户单位）：固定小点，不需要手动调
const DOT_R=7;
function dotRadius(){return DOT_R;}
// 沿「主线条」等距取 TOTAL 个点：取最长的几条轮廓（主体），按长度比例分配点数
function samplePoints(shapeG){
 const items=[...shapeG.querySelectorAll('[data-part]')].map(p=>({p,len:p.getTotalLength()})).filter(i=>i.len>0);
 if(!items.length)return[{x:240,y:205}];
 items.sort((a,b)=>b.len-a.len);
 const max=items[0].len;
 const main=items.filter(i=>i.len>=max*0.55).slice(0,3);
 const sum=main.reduce((s,i)=>s+i.len,0)||1;
 const out=[];let used=0;
 main.forEach((item,i)=>{
  const last=i===main.length-1;
  const n=last?Math.max(1,TOTAL-used):Math.max(1,Math.round(TOTAL*item.len/sum));
  used+=n;
  for(let j=0;j<n;j++){
   const t=item.p.getPointAtLength(item.len*(j+0.5)/n);
   out.push({x:t.x,y:t.y});
  }
 });
 return out.slice(0,TOTAL);
}
function render(){
 $('#preview').innerHTML=svg(true);
 $('#animalTitle').textContent=animals[animal].name;
 $('#workTitle').textContent='沿绿点描出线条，看看藏着什么';
 stage.innerHTML=svg();
 const svgEl=stage.querySelector('svg');
 const shapeG=svgEl.querySelector('g');
 const pts=samplePoints(shapeG);
 // 半透明参考线：让孩子看得见这条线往哪走
 const ghost=shapeG.cloneNode(true);
 ghost.querySelectorAll('path').forEach(p=>p.removeAttribute('data-part'));
 ghost.setAttribute('opacity','.20');
 ghost.setAttribute('stroke','#7f978a');
 ghost.setAttribute('stroke-width','3');
 svgEl.insertBefore(ghost,shapeG);
 // 真实线条按进度显现
 shapeG.querySelectorAll('[data-part]').forEach(p=>{
  p.setAttribute('fill','none');
  p.setAttribute('pathLength','1');
  p.classList.add('reveal');
  p.style.strokeDashoffset=1-hits/TOTAL;
 });
 if(hits<TOTAL){
  const pt=pts[Math.min(hits,pts.length-1)];
  const layer=document.createElementNS(NS,'g');
  layer.setAttribute('class','dots-layer');
  svgEl.appendChild(layer);
  const c=document.createElementNS(NS,'circle');
  c.setAttribute('cx',pt.x.toFixed(1));
  c.setAttribute('cy',pt.y.toFixed(1));
  c.setAttribute('r',dotRadius());
  c.setAttribute('class','path-dot');
  c.setAttribute('role','button');
  c.setAttribute('tabindex','0');
  c.setAttribute('aria-label',`第 ${hits+1} 个绿点，共 ${TOTAL} 个`);
  c.addEventListener('click',hit);
  c.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();hit();}});
  layer.append(c);
 }else{
  // 描完：整幅真实配色图浮现出来
  stage.insertAdjacentHTML('beforeend',`<div class="finale">${svg(true)}</div><div class="complete">✦ 太棒了！你描出了${animals[animal].name}</div>`);
  GameAudio.sfx('win');
 }
 progress();
 GameShell.background();
}
function hit(){
 if(GameShell.state.paused)return;
 hits++;
 GameAudio.sfx('pop');
 const svgEl=stage.querySelector('svg');
 if(svgEl)svgEl.querySelectorAll('.reveal').forEach(p=>p.style.strokeDashoffset=1-hits/TOTAL);
 const epoch=GameShell.state.epoch;
 setTimeout(()=>{if(epoch===GameShell.state.epoch)render();},520);
}
function progress(){
 $('#progressText').textContent=`已描出 ${hits} / ${TOTAL} 个点`;
 $('#progressBar').style.width=hits/TOTAL*100+'%';
}
function newRound(){hits=0;render();}
document.querySelectorAll('[data-animal]').forEach(b=>b.onclick=()=>{animal=b.dataset.animal;document.querySelectorAll('[data-animal]').forEach(x=>x.classList.toggle('selected',x===b));GameAudio.sfx('select');newRound();});
$('#reset').onclick=newRound;
$('#pause').onclick=()=>GameShell.setPaused();
$('#fullscreen').onclick=()=>{if(document.fullscreenElement)document.exitFullscreen();else $('.layout').requestFullscreen?.();};
document.querySelectorAll('[data-sound-toggle]').forEach(b=>b.onclick=()=>GameAudio.toggle());
let elapsed=0;
setInterval(()=>{if(!GameShell.state.paused&&!document.hidden){elapsed++;$('#timer').textContent=String(Math.floor(elapsed/60)).padStart(2,'0')+':'+String(elapsed%60).padStart(2,'0');}},1000);
render();
