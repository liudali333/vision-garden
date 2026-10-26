// 瓶子倒墨水独立页：选瓶"嗒"声，倒水有水流滑音，倒错提示音，全部归位胜利音。
const inks=['#ee7769','#65a9dc','#e4ba4e'];
const inkNames=['珊瑚红','天空蓝','阳光黄'];
let bottles=[],bottleSelected=-1,pouring=false,turns=0,gameHistory=[];
const stage=$('#stage');
function waterWon(){return bottles.every(b=>!b.length||(b.length===7&&b.every(v=>v===b[0])));}
function pour(from,to){
 const a=bottles[from],b=bottles[to];
 if(from===to||!a.length||b.length===7||(b.length&&b.at(-1)!==a.at(-1)))return false;
 gameHistory.push(bottles.map(b=>[...b]));
 const c=a.at(-1);
 while(a.length&&a.at(-1)===c&&b.length<7)b.push(a.pop());
 turns++;
 return true;
}
function drawWater(message='先选一个瓶子，再点另一个瓶子倒入。'){
 $('#gameMeter').textContent=`已倒 ${turns} 次`;
 GameShell.gamePanel(waterWon()?'颜色全部归好啦！':'让每种颜色回到同一个瓶子',waterWon()?'太棒了！可以重新挑战，试试用更少的步数。':message,
  `<div class="bottle-board">${bottles.map((b,i)=>`<button class="bottle-wrap ${i===bottleSelected?'chosen':''}" data-bottle="${i}" aria-label="瓶子 ${i+1}，从底到顶 ${b.map(c=>inkNames[c]).join('、')||'空'}"><span class="bottle"><span class="liquid">${b.map(c=>`<i style="background:${inks[c]}"></i>`).join('')}</span></span><span>${i+1}</span></button>`).join('')}</div>`,
  `<div class="mini-actions"><button id="waterUndo" ${gameHistory.length?'':'disabled'}>↶ 撤销一步</button><span>只能倒入空瓶或相同顶层颜色 · 每瓶 7 滴</span></div>`);
 stage.querySelectorAll('[data-bottle]').forEach(b=>b.onclick=()=>{
  if(GameShell.state.paused||pouring||waterWon())return;
  let i=+b.dataset.bottle;
  if(bottleSelected<0){
   if(bottles[i].length){bottleSelected=i;GameAudio.sfx('select');}
   drawWater();return;
  }
  if(bottleSelected===i){bottleSelected=-1;drawWater();return;}
  const from=bottleSelected;bottleSelected=-1;
  if(from===i){drawWater();return;}
  if(!bottles[from].length||bottles[i].length===7||(bottles[i].length&&bottles[i].at(-1)!==bottles[from].at(-1))){
   GameAudio.sfx('wrong');
   drawWater('这个瓶子装不下或顶层颜色不同，请重新选择。');
   return;
  }
  pouring=true;
  const epoch=GameShell.state.epoch;
  GameAudio.sfx('pour');
  const source=stage.querySelector(`[data-bottle="${from}"]`),target=stage.querySelector(`[data-bottle="${i}"]`);
  source.classList.add('pouring');
  source.style.setProperty('--pour-direction',i>from?'1':'-1');
  source.style.setProperty('--pour-travel',Math.round((target.getBoundingClientRect().left-source.getBoundingClientRect().left)*.82)+'px');
  const stream=document.createElement('span');
  stream.className='pour-stream';
  stream.style.background=inks[bottles[from].at(-1)];
  source.append(stream);
  source.addEventListener('animationend',e=>{
   if(e.target!==source)return;
   if(epoch!==GameShell.state.epoch)return;
   pour(from,i);pouring=false;drawWater();
   if(waterWon())GameAudio.sfx('win');
  },{once:true});
 });
 $('#waterUndo').onclick=()=>{
  if(GameShell.state.paused||pouring||!gameHistory.length)return;
  bottles=gameHistory.pop();turns--;bottleSelected=-1;
  GameAudio.sfx('pop');drawWater();
 };
}
function reset(){
 GameShell.nextEpoch();
 GameShell.setPaused(false);
 bottles=[[0,1,2,0,1,2,0],[1,2,0,1,2,0,1],[2,0,1,2,0,1,2],[],[]];
 bottleSelected=-1;pouring=false;gameHistory=[];turns=0;
 drawWater();
}
GameShell.buildToolbar('瓶子倒墨水',reset);
reset();
