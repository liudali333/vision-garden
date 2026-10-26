// 彩色挪车独立页：出发引擎声，被挡"嘟嘟"提示，清场胜利音。
const lotSize=16;
const headings={ne:{dx:1,dy:-1,angle:45,name:'右上'},se:{dx:1,dy:1,angle:135,name:'右下'},sw:{dx:-1,dy:1,angle:225,name:'左下'},nw:{dx:-1,dy:-1,angle:315,name:'左上'}};
const stage=$('#stage');
let cars=[],gameHistory=[],turns=0,level=1,departing=false;
function carCells(c){return c.dir==='ne'||c.dir==='sw'?[[c.x+1,c.y],[c.x,c.y+1]]:[[c.x,c.y],[c.x+1,c.y+1]];}
// 出口判定：按真实车身（长1.84、宽0.76 格）做旋转矩形扫掠碰撞，
// 和画面一致——只要行进路线上有车挡着就开不出去，斜插在旁边的车也算。
const HL=0.92,HW=0.38;
function rectAxes(dir){const d=headings[dir],len=Math.hypot(d.dx,d.dy);return{ux:d.dx/len,uy:d.dy/len,px:-d.dy/len,py:d.dx/len};}
function rectsOverlap(aC,aDir,bC,bDir){
 const A=rectAxes(aDir),B=rectAxes(bDir);
 const dx=bC[0]-aC[0],dy=bC[1]-aC[1];
 for(const [ax,ay] of [[A.ux,A.uy],[A.px,A.py],[B.ux,B.uy],[B.px,B.py]]){
  const ra=HL*Math.abs(ax*A.ux+ay*A.uy)+HW*Math.abs(ax*A.px+ay*A.py);
  const rb=HL*Math.abs(ax*B.ux+ay*B.uy)+HW*Math.abs(ax*B.px+ay*B.py);
  if(Math.abs(ax*dx+ay*dy)>=ra+rb-1e-9)return false;
 }
 return true;
}
function canExit(c,board=cars){
 const d=headings[c.dir],len=Math.hypot(d.dx,d.dy),ux=d.dx/len,uy=d.dy/len;
 const sx=c.x+1,sy=c.y+1;
 for(let t=0;t<=lotSize*1.6;t+=0.1){
  const cx=sx+ux*t,cy=sy+uy*t;
  for(const o of board){
   if(o===c||o.gone)continue;
   const ox=o.x+1-sx,oy=o.y+1-sy;
   if(ox*ux+oy*uy<-2.2)continue;             // 在车身后方，不挡路
   if(Math.abs(ox*(-uy)+oy*ux)>1.8)continue; // 侧向太远，不挡路
   if(rectsOverlap([cx,cy],c.dir,[o.x+1,o.y+1],o.dir))return false;
  }
 }
 return true;
}
function makeTraffic(seed){
 let n=seed*7919+41;
 const random=()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;},paint=['#f25560','#11a6df','#33bb50','#ffce32','#ae6ade','#f28724'];
 let best=[];
 for(let attempt=0;attempt<12&&best.length<40;attempt++){
  const slots=Array.from({length:64},(_,i)=>[i%8*2,Math.floor(i/8)*2]);
  for(let i=slots.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[slots[i],slots[j]]=[slots[j],slots[i]];}
  const board=[],skipped=[];
  const place=([x,y])=>{
   const options=Object.keys(headings).map(dir=>({dir,near:board.filter(o=>Math.abs(o.x-x)<=2&&Math.abs(o.y-y)<=2&&o.dir===dir).length+random()})).filter(({dir})=>canExit({x,y,dir},board)).sort((a,b)=>a.near-b.near);
   if(!options.length)return false;
   board.push({x,y,dir:options[0].dir,color:paint[Math.floor(random()*paint.length)],gone:false});
   return true;
  };
  for(const slot of slots)if(!place(slot))skipped.push(slot);
  for(const slot of skipped)place(slot);
  if(board.length>best.length)best=board;
 }
 return best;
}
function vehicleSVG(c){
 const vertical=c.axis==='v';
 return `<svg class="vehicle-art" viewBox="${vertical?'0 0 64 120':'0 0 120 64'}" aria-hidden="true"><g transform="translate(${vertical?'32 60':'60 32'}) rotate(${headings[c.dir].angle}) translate(-32 -60)"><rect x="3" y="19" width="11" height="23" rx="4" fill="#26333a"/><rect x="50" y="19" width="11" height="23" rx="4" fill="#26333a"/><rect x="3" y="81" width="11" height="22" rx="4" fill="#26333a"/><rect x="50" y="81" width="11" height="22" rx="4" fill="#26333a"/><path d="M9 25Q9 6 24 5H40Q55 6 55 25V103Q55 114 44 115H20Q9 114 9 103Z" fill="${c.color}" stroke="#23364055" stroke-width="2"/><path d="M14 26Q14 12 25 11H39Q49 12 49 26" fill="none" stroke="#ffffff88" stroke-width="3"/><path d="M17 33H47L44 48H20Z" fill="#204b5b" stroke="#d0f4ff" stroke-width="2"/><path d="M20 86H44L47 100H17Z" fill="#204b5b" stroke="#d0f4ff" stroke-width="2"/><rect x="12" y="16" width="10" height="6" rx="2" fill="#fff9c8"/><rect x="42" y="16" width="10" height="6" rx="2" fill="#fff9c8"/><rect x="12" y="105" width="9" height="4" rx="1" fill="#ac2635"/><rect x="43" y="105" width="9" height="4" rx="1" fill="#ac2635"/><path d="M32 79V55M23 64L32 54L41 64" fill="none" stroke="#1b445966" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/><path d="M32 79V55M23 64L32 54L41 64" fill="none" stroke="white" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></g></svg>`;
}
function driveOut(index,button){
 if(GameShell.state.paused||departing||cars[index].gone)return;
 const c=cars[index];
 if(!canExit(c)){
  GameAudio.sfx('blocked');
  drawCars('斜向前方有车挡住啦，先让其他小车开走。',index);
  return;
 }
 departing=true;
 GameAudio.sfx('drive');
 const epoch=GameShell.state.epoch;
 button.classList.add('driving');button.disabled=true;
 const finish=()=>{
  if(epoch!==GameShell.state.epoch)return;
  gameHistory.push(cars.map(c=>({...c})));
  c.gone=true;turns++;departing=false;
  drawCars();
  if(!cars.some(c=>!c.gone))GameAudio.sfx('win');
 };
 button.addEventListener('animationend',finish,{once:true});
}
function drawCars(message='看车头和白色箭头，点击斜向小车，让它沿自己的方向驶出。',blocked=-1){
 const left=cars.filter(c=>!c.gone).length;
 $('#gameMeter').textContent=`第 ${level} 关 · 剩余 ${left} / ${cars.length} 辆`;
 GameShell.gamePanel(left?'让斜向小车们都开出去吧！':'全部小车都顺利出发啦！',left?message:'四个斜向出口畅通！再来挑战一组新的停车场。',
  `<div class="traffic-surround diagonal-surround"><div class="traffic-lot diagonal-lot">${cars.map((c,i)=>c.gone?'':`<button class="traffic-car diagonal-car ${blocked===i?'blocked':''}" data-traffic="${i}" aria-label="小车 ${i+1}，向${headings[c.dir].name}驶出" style="left:${c.x/lotSize*100}%;top:${c.y/lotSize*100}%;width:${2/lotSize*100}%;height:${2/lotSize*100}%;--exit-x:${headings[c.dir].dx*1400}%;--exit-y:${headings[c.dir].dy*1400}%">${vehicleSVG(c)}</button>`).join('')}</div></div>`,
  `<div class="mini-actions"><button id="trafficUndo" ${gameHistory.length?'':'disabled'}>↶ 撤销</button><span>点击车身沿箭头斜向驶出</span>${left?'':'<button id="trafficNext" class="primary">下一关 →</button>'}</div>`);
 stage.querySelectorAll('[data-traffic]').forEach(b=>b.onclick=()=>driveOut(+b.dataset.traffic,b));
 $('#trafficUndo').onclick=()=>{
  if(GameShell.state.paused||departing||!gameHistory.length)return;
  cars=gameHistory.pop();turns--;
  GameAudio.sfx('pop');drawCars();
 };
 $('#trafficNext')?.addEventListener('click',()=>{if(GameShell.state.paused)return;level++;reset();});
}
function reset(){
 GameShell.nextEpoch();
 GameShell.setPaused(false);
 cars=makeTraffic(level);
 departing=false;gameHistory=[];turns=0;
 drawCars();
}
GameShell.buildToolbar('彩色挪车',reset);
reset();
