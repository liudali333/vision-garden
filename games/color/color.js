// 动物填色独立页：从原 app.js 提取，音效改为专属音色。
const {colors,animals}=VGAnimals;
const stage=$('#stage');
// 规则：填错累计 2 次，整幅清空重新开始。
let animal='fox',selected=colors[0],fills={},history=[],mistakes={},feedbackTimer,wrongs=0;
function svg(preview=false){
 let a=animals[animal];
 return `<svg viewBox="0 0 480 410" preserveAspectRatio="xMidYMid meet" aria-label="${a.name}" xmlns="http://www.w3.org/2000/svg"><g stroke="#34443c" stroke-width="5" stroke-linejoin="round" stroke-linecap="round">${a.parts.map((p,i)=>`<path data-part="${i}" d="${p[0]}" fill="${preview?p[1]:(fills[i]||'#fffdf5')}"/>`).join('')}<path d="${a.detail}" fill="none" stroke-width="6"/></g></svg>`;
}
function render(){
 $('#preview').innerHTML=svg(true);
 $('#animalTitle').textContent=animals[animal].name;
 $('#workTitle').textContent=`给${animals[animal].name}涂上颜色`;
 stage.innerHTML=svg();
 progress();
 GameShell.background();
}
function progress(){
 const n=Object.keys(fills).length,total=animals[animal].parts.length;
 $('#progressText').textContent=`已填色 ${n} / ${total} 个区域`;
 $('#progressBar').style.width=n/total*100+'%';
}
function feedback(message){
 clearTimeout(feedbackTimer);
 $('#colorFeedback').textContent=message;
 feedbackTimer=setTimeout(()=>$('#colorFeedback').textContent='对照参考图，给每个部位填上相同的颜色。',3500);
}
function newRound(){fills={};mistakes={};history=[];wrongs=0;render();}
// 填错两次：整幅清空，从零开始
function restartAll(){
 fills={};mistakes={};history=[];wrongs=0;elapsed=0;
 $('#timer').textContent='00:00';
 render();
 const s=stage.querySelector('svg');
 if(s){s.classList.remove('reset');void s.getBoundingClientRect();s.classList.add('reset');setTimeout(()=>s.classList.remove('reset'),700);}
 GameAudio.sfx('wrong');
 feedback('填错 2 次，整幅已重置，重新来过');
}
$('#palette').innerHTML=colors.map((c,i)=>`<button class="swatch ${i===0?'selected':''}" title="色号 ${i+1}" data-color="${c}" style="background:${c}" aria-label="色号 ${i+1} ${c}"></button>`).join('');
$('#palette').onclick=e=>{
 const b=e.target.closest('[data-color]');if(!b)return;
 selected=b.dataset.color;
 document.querySelectorAll('.swatch').forEach(b=>b.classList.toggle('selected',b.dataset.color===selected));
 GameAudio.sfx('select');
};
stage.onclick=e=>{
 const p=e.target.closest('[data-part]');
 if(!p||GameShell.state.paused)return;
 const id=p.dataset.part,target=animals[animal].parts[id][1];
 if(selected.toUpperCase()!==target.toUpperCase()){
  mistakes[id]=(mistakes[id]||0)+1;
  wrongs++;
  if(wrongs>=2){restartAll();return;}
  p.classList.remove('wrong');void p.getBoundingClientRect();p.classList.add('wrong');
  GameAudio.sfx('wrong');
  feedback('颜色不匹配（已错 1 次），再错 1 次整幅重新开始');
  progress();return;
 }
 history.push({...fills});fills[id]=selected;mistakes[id]=0;
 p.classList.remove('wrong');p.setAttribute('fill',selected);
 const done=Object.keys(fills).length===animals[animal].parts.length;
 GameAudio.sfx(done?'win':'correct');
 feedback(done?'太棒了，所有部位都填对了！':'颜色正确，继续观察其他部位');
 progress();
};
document.querySelectorAll('[data-animal]').forEach(b=>b.onclick=()=>{animal=b.dataset.animal;document.querySelectorAll('[data-animal]').forEach(x=>x.classList.toggle('selected',x===b));GameAudio.sfx('select');newRound();});
$('#reset').onclick=newRound;
$('#undo').onclick=()=>{if(history.length){fills=history.pop();GameAudio.sfx('pop');render();}};
$('#pause').onclick=()=>GameShell.setPaused();
$('#fullscreen').onclick=()=>{if(document.fullscreenElement)document.exitFullscreen();else $('.layout').requestFullscreen?.();};
document.querySelectorAll('[data-sound-toggle]').forEach(b=>b.onclick=()=>GameAudio.toggle());
let elapsed=0;
setInterval(()=>{if(!GameShell.state.paused&&!document.hidden){elapsed++;$('#timer').textContent=String(Math.floor(elapsed/60)).padStart(2,'0')+':'+String(elapsed%60).padStart(2,'0');}},1000);
render();
