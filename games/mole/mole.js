// 打地鼠独立页：30 秒限时，命中"啵升"音，落空轻点声，结束胜利音。
let score=0,remaining=30,mole=-1;
function nextMole(){
 let next=Math.floor(Math.random()*9);
 if(next===mole)next=(next+1)%9;
 mole=next;drawMole();
}
function drawMole(){
 $('#gameMeter').textContent=`得分 ${score} · 剩余 ${remaining} 秒`;
 GameShell.gamePanel(remaining?'小地鼠在哪里？':'这一轮完成啦！',remaining?'点击冒出头的小地鼠，每次命中得 1 分。':`你找到了 ${score} 只小地鼠，再来挑战一次吧。`,
  `<div class="mole-board">${Array.from({length:9},(_,i)=>`<button class="hole ${i===mole?'occupied':''}" data-hole="${i}" aria-label="${i===mole?'地鼠':'空洞'} ${i+1}"><span>${i===mole?'🐹':''}</span></button>`).join('')}</div>`,
  remaining?'':'<button class="primary" data-restart>再玩一次</button>');
 stage.querySelectorAll('[data-hole]').forEach(b=>b.onclick=()=>{
  if(GameShell.state.paused||remaining<=0)return;
  if(+b.dataset.hole===mole){score++;GameAudio.sfx('hit');mole=-1;drawMole();}
  else GameAudio.sfx('tap');
 });
 stage.querySelector('[data-restart]')?.addEventListener('click',reset);
}
function reset(){
 GameShell.nextEpoch();
 GameShell.setPaused(false);
 score=0;remaining=30;mole=-1;
 drawMole();
 let ticks=0;
 GameShell.every(500,()=>{
  if(GameShell.state.paused||document.hidden)return;
  ticks++;
  if(ticks%2===0){
   remaining--;
   if(remaining<=0){GameShell.nextEpoch();mole=-1;drawMole();GameAudio.sfx('win');return;}
  }
  if(ticks%3===0)nextMole();
 });
}
const stage=$('#stage');
GameShell.buildToolbar('打地鼠',reset);
reset();
