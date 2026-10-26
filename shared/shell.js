// 通用游戏页外壳：工具栏、暂停/重玩、训练背景自动轮播、通用面板。
// 背景按弱视训练标准随机轮番显示：红绿块 / 黑白块 / 黑白条纹 / 黑白红绿交替，
// 标准闪速每秒 2 次，无需手动调节。
const $=s=>document.querySelector(s);
window.GameShell=(()=>{
 const style=document.createElement('style');
 style.textContent='.tb-field{display:flex;align-items:center;gap:5px;font-size:12px;color:#5d776a}.tb-field select{padding:7px 8px;font-size:12px;border-radius:8px;border:1px solid #dfe8df;background:#fff;color:#38534c}.home-link{font-size:13px;color:#2d8063;text-decoration:none;font-weight:700;background:#edf3f0;padding:9px 12px;border-radius:10px}.home-link:hover{filter:brightness(.96)}';
 document.head.append(style);
 let paused=false,epoch=0,timer=null;
 const state={get paused(){return paused;},get epoch(){return epoch;}};
 // 弱视训练标准背景组合（键名对应 CSS 类名）
 const PATTERNS=[['checker','红绿块闪烁'],['blocks','黑白块闪烁'],['stripes','黑白条纹闪烁'],['mixed','黑白 / 红绿交替']];
 let pattern=PATTERNS[Math.floor(Math.random()*PATTERNS.length)][0];
 // 推进纪元并停掉当前循环（重开一局时调用）
 function nextEpoch(){epoch++;if(timer){clearInterval(timer);timer=null;}return epoch;}
 // 页面唯一循环：重开时先 nextEpoch 再 every
 function every(ms,fn){if(timer)clearInterval(timer);timer=setInterval(fn,ms);}
 // 随机换下一个背景，避免与当前重复
 function pickPattern(){
  if(PATTERNS.length<2)return;
  let next;
  do{next=PATTERNS[Math.floor(Math.random()*PATTERNS.length)];}while(next[0]===pattern);
  pattern=next[0];
  background();
 }
 // 训练背景：标准闪速每秒 2 次（CSS 默认 1s），随机轮播
 function background(){
  const stage=$('#stage');
  if(!stage)return;
  stage.className='stage '+pattern+(paused?' paused':'');
  stage.style.animationDuration='1s';
  const status=$('#status');
  if(status)status.textContent=paused?'已暂停':PATTERNS.find(p=>p[0]===pattern)[1];
  const pb=$('#pause')||$('#quickPause');
  if(pb)pb.textContent=paused?'▶ 继续':'Ⅱ 暂停';
 }
 function setPaused(v){paused=v===undefined?!paused:!!v;background();}
 // 每 5 秒随机轮换一次背景；暂停和切后台时自动停换
 setInterval(()=>{if(!paused&&!document.hidden)pickPattern();},5000);
 // 通用游戏面板（打地鼠 / 倒墨水 / 挪车使用）
 function gamePanel(title,help,body,actions=''){
  const stage=$('#stage');if(!stage)return;
  stage.innerHTML=`<div class="play-area"><div class="play-caption"><h2>${title}</h2><p>${help}</p></div>${body}${actions}</div>`;
 }
 // 沉浸式游戏页工具栏：首页 / 名称 / 计量 / 重玩 / 暂停 / 音效 / 全屏
 function buildToolbar(name,onReset){
  const layout=$('.layout');
  const bar=document.createElement('div');
  bar.className='game-toolbar';
  bar.innerHTML=`<a class="home-link" href="../../index.html">← 首页</a><strong>${name}</strong><span id="gameMeter" role="status" aria-live="polite"></span><button id="quickReset">↻ 重玩</button><button id="quickPause">Ⅱ 暂停</button><button data-sound-toggle>🔊 音效开</button><button id="tbFullscreen">⛶ 全屏</button>`;
  layout.append(bar);
  $('#quickReset').onclick=onReset;
  $('#quickPause').onclick=()=>setPaused();
  document.querySelectorAll('[data-sound-toggle]').forEach(b=>{b.textContent=GameAudio.enabled?'🔊 音效开':'🔇 音效关';b.onclick=()=>GameAudio.toggle();});
  $('#tbFullscreen').onclick=()=>{document.fullscreenElement?document.exitFullscreen():layout.requestFullscreen?.();};
  return bar;
 }
 // 空格键暂停 / 切后台自动暂停
 document.addEventListener('keydown',e=>{
  if(e.code==='Space'&&!['INPUT','SELECT','TEXTAREA','BUTTON'].includes(document.activeElement?.tagName)){e.preventDefault();setPaused();}
 });
 document.addEventListener('visibilitychange',()=>{if(document.hidden)setPaused(true);});
 return{$,state,PATTERNS,nextEpoch,every,background,setPaused,gamePanel,buildToolbar};
})();
