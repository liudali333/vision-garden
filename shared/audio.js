// 睛彩乐园统一音效引擎：WebAudio 合成，无外部音频文件。
// 每个小游戏有专属音色，通过 GameAudio.sfx(name, arg) 播放。
// 开关状态保存在浏览器 localStorage（与旧版本共用同一个 key）。
window.GameAudio=(()=>{
 let context,enabled=true;
 try{enabled=localStorage.getItem('vision-garden-sound')!=='off';}catch{}
 function wake(){
  try{
   const Audio=window.AudioContext||window.webkitAudioContext;
   if(!Audio)return null;
   if(!context)context=new Audio();
   if(context.state==='suspended')context.resume().catch(()=>{});
   return context;
  }catch{return null;}
 }
 // 统一主音量倍数：所有音效整体放大（原音量偏轻，笔记本喇叭几乎听不见）
 const MASTER=3.2,CEIL=.5;
 // 单个音调：f 起始频率，to 结束频率（滑音），d 时长（秒），v 音量，type 波形
 function tone({f=640,to=null,d=.075,type='sine',v=.055}={}){
  if(!enabled||document.hidden)return;
  const ctx=wake();if(!ctx)return;
  try{
   const osc=ctx.createOscillator(),gain=ctx.createGain(),now=ctx.currentTime;
   const level=Math.min(CEIL,v*MASTER);
   osc.type=type;
   osc.frequency.setValueAtTime(f,now);
   osc.frequency.exponentialRampToValueAtTime(to||f*.7,now+d);
   gain.gain.setValueAtTime(.001,now);
   gain.gain.exponentialRampToValueAtTime(level,now+.008);
   gain.gain.exponentialRampToValueAtTime(.001,now+d);
   osc.connect(gain);gain.connect(ctx.destination);
   osc.onended=()=>{osc.disconnect();gain.disconnect();};
   osc.start(now);osc.stop(now+d+.01);
  }catch{}
 }
 // 各游戏专属音色表
 const presets={
  // 通用
  tap:()=>tone({f:620,d:.06}),
  select:()=>tone({f:720,d:.06,v:.05}),
  win:()=>[523,659,784].forEach((f,i)=>setTimeout(()=>tone({f,d:.12,v:.05}),i*110)),
  // 动物填色
  correct:()=>tone({f:760,d:.08}),
  wrong:()=>tone({f:190,d:.2,type:'square',v:.035}),
  // 寻点描画
  pop:()=>tone({f:990,d:.05,v:.05}),
  // 打地鼠
  hit:()=>tone({f:430,d:.12,to:960}),
  miss:()=>tone({f:320,d:.25,to:150,v:.04}),
  // 瓶子倒墨水
  pour:()=>tone({f:840,d:.55,type:'triangle',to:300,v:.04}),
  // 彩色挪车
  drive:()=>tone({f:150,d:.5,type:'sawtooth',to:230,v:.03}),
  blocked:()=>{tone({f:180,d:.09,type:'square',v:.04});setTimeout(()=>tone({f:150,d:.12,type:'square',v:.04}),90);},
  // 快上车
  arrive:()=>tone({f:520,d:.1}),
  chime:tone2=>tone({f:600+(tone2||0)*70,d:.09}),
  depart:()=>{tone({f:523,d:.09});setTimeout(()=>tone({f:784,d:.14}),90);},
 };
 function sfx(name,arg){if(!presets[name])return;presets[name](arg);}
 function syncButtons(){
  const label=enabled?'🔊 音效开':'🔇 音效关';
  document.querySelectorAll('[data-sound-toggle]').forEach(b=>{b.textContent=label;b.setAttribute('aria-pressed',String(enabled));});
  const bus=document.querySelector('#busAudioButton');
  if(bus)bus.textContent=label;
 }
 function setEnabled(value){
  enabled=!!value;
  try{localStorage.setItem('vision-garden-sound',enabled?'on':'off');}catch{}
  syncButtons();
  if(enabled)sfx('tap');
 }
 // 兼容旧调用：GameAudio.play(频率, 时长)
 function play(frequency=640,duration=.075){tone({f:frequency,d:duration});}
 return{
  get enabled(){return enabled;},wake,play,sfx,setEnabled,
  toggle(){setEnabled(!enabled);},
  sync:syncButtons,
 };
})();
GameAudio.sync();
