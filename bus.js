// Five reserved bays, a continuous FIFO queue, and departure only when full.
const busPaint=[{name:'红色',hex:'#ec6571'},{name:'绿色',hex:'#42b888'},{name:'蓝色',hex:'#359ddd'},{name:'橙色',hex:'#f39843'},{name:'黄色',hex:'#e9bd36'},{name:'紫色',hex:'#a67bd5'}];
let busWave=1,busCars=[],busQueue=[],busPending=[],busBays=[],busBoarding=null,busDelivered=0,busUndo=[],busArrivalClock=0,busAdvanceClock=0,busOrder=0,busNotice='';
function startBusWave(){
 const rotate=busWave===1?0:(busWave-1)%6;
 const fleet=[[0,5],[1,8],[2,6],[2,9],[3,6],[4,6],[5,10],[0,9],[1,5],[2,12],[3,4],[4,10],[5,6],[0,6],[1,10],[2,4],[3,8],[4,4]];
 busCars=fleet.map(([tone,capacity],id)=>({id,tone:(tone+rotate)%6,capacity,load:0,status:'parked',bay:null,elapsed:0,order:0}));
 busPending=[[0,5],[1,8],[2,15],[3,6],[4,6],[5,10],[0,9],[2,12],[1,5],[4,10],[3,4],[5,6],[1,10],[0,6],[3,8],[2,4],[4,4]].map(([tone,count])=>({tone:(tone+rotate)%6,count}));
 busQueue=[];for(let i=0;i<4;i++){const group=busPending.shift();busQueue.push(...Array(group.count).fill(group.tone));}
 busBays=Array(5).fill(null);busBoarding=null;busDelivered=0;busUndo=[];busArrivalClock=0;busAdvanceClock=0;busOrder=0;busNotice='';turns=0;
}
function initBus(){startBusWave();gameTimer=setInterval(tickBus,100);}
function busSnapshot(){return JSON.stringify({cars:busCars,queue:busQueue,pending:busPending,bays:busBays,boarding:busBoarding,delivered:busDelivered,arrival:busArrivalClock,advance:busAdvanceClock,order:busOrder,turns});}
function dispatchBus(index){
 if(paused||activeGame!=='bus')return false;const car=busCars[index];if(!car||car.status!=='parked')return false;
 const bay=busBays.indexOf(null);if(bay<0){busNotice='5 个停靠位都满了。等车辆满载驶离，或撤销上次派车重新安排。';drawBus();return false;}
 window.GameAudio?.wake();busUndo.push(busSnapshot());car.status='arriving';car.bay=bay;car.elapsed=0;car.order=++busOrder;busBays[bay]=car.id;turns++;busNotice='';drawBus();return true;
}
function undoBusDispatch(){if(paused||!busUndo.length)return;const s=JSON.parse(busUndo.pop());busCars=s.cars;busQueue=s.queue;busPending=s.pending;busBays=s.bays;busBoarding=s.boarding;busDelivered=s.delivered;busArrivalClock=s.arrival;busAdvanceClock=s.advance;busOrder=s.order;turns=s.turns;busNotice='已恢复到上次派车前，可以重新选择车辆。';drawBus();}
function busMatch(){if(!busQueue.length)return null;return busCars.filter(c=>c.status==='docked'&&c.tone===busQueue[0]&&c.load<c.capacity).sort((a,b)=>a.order-b.order)[0]||null;}
function tickBus(){
 if(activeGame!=='bus'||paused||document.hidden)return;let changed=false;
 for(const c of busCars){if(c.status==='arriving'){c.elapsed+=100;if(c.elapsed>=800){c.status='docked';c.elapsed=0;changed=true;}}else if(c.status==='leaving'){c.elapsed+=100;if(c.elapsed>=800){c.status='gone';busNotice='';busBays[c.bay]=null;c.bay=null;c.elapsed=0;changed=true;}}}
 busArrivalClock+=100;
 if(busArrivalClock>=2000){busArrivalClock=0;if(busPending.length&&busQueue.length<64){const group=busPending[0],count=Math.min(group.count,64-busQueue.length);busQueue.push(...Array(count).fill(group.tone));group.count-=count;if(!group.count)busPending.shift();changed=true;}}
 if(busBoarding){busBoarding.elapsed+=100;if(busBoarding.elapsed>=400){const c=busCars[busBoarding.car];if(c.status==='docked'&&c.load<c.capacity&&busQueue[0]===c.tone){busQueue.shift();busNotice='';c.load++;busDelivered++;window.GameAudio?.play(600+c.tone*70,.09);if(c.load===c.capacity){c.status='leaving';c.elapsed=0;}}busBoarding=null;changed=true;}}
 if(!busBoarding){const car=busMatch();if(car){busBoarding={car:car.id,tone:car.tone,elapsed:0};changed=true;}}
 if(busCars.every(c=>c.status==='gone')&&!busQueue.length&&!busPending.length){busAdvanceClock+=100;if(busAdvanceClock>=1600){busWave++;startBusWave();changed=true;}}
 if(changed)drawBus();
}
function queueGroups(){const groups=[];for(const tone of busQueue){const last=groups.at(-1);if(last&&last.tone===tone)last.count++;else groups.push({tone,count:1});}return groups;}
function busPerson(tone,extra=''){return `<span class="waiting-person ${extra}" style="--person:${busPaint[tone].hex}" aria-hidden="true"><i class="person-head"></i><i class="person-body"></i></span>`;}
function coachSprite(car){const paint=busPaint[car.tone];return `<svg class="coach-art" viewBox="0 0 160 82" aria-hidden="true"><rect x="25" y="60" width="23" height="17" rx="7" fill="#32454b"/><rect x="111" y="60" width="23" height="17" rx="7" fill="#32454b"/><path d="M9 25Q9 11 24 11H128Q145 11 150 31V58Q150 68 138 68H23Q9 68 9 56Z" fill="${paint.hex}" stroke="#29494d66" stroke-width="2"/><path d="M15 28Q15 17 28 17H124" fill="none" stroke="#ffffff77" stroke-width="4"/><rect x="22" y="24" width="25" height="24" rx="4" fill="#305765"/><rect x="52" y="24" width="25" height="24" rx="4" fill="#305765"/><rect x="82" y="24" width="25" height="24" rx="4" fill="#305765"/><path d="M119 23H133L142 38V49H119Z" fill="#244b59"/><path d="M25 27H43M55 27H73M85 27H103" stroke="#b9e7ea" stroke-width="3"/><path d="M24 56H112" stroke="#ffffff66" stroke-width="8" stroke-dasharray="8 8"/><rect x="140" y="54" width="8" height="6" rx="2" fill="#fff4b8"/><rect x="12" y="54" width="6" height="6" rx="2" fill="#a53c4f"/></svg>`;}
function bayContent(index){const id=busBays[index];if(id===null)return `<div class="coach-bay empty"><span class="bay-number">${index+1}</span><span class="bay-outline">P</span><span class="bay-empty-label">空闲停靠位</span></div>`;const c=busCars[id],paint=busPaint[c.tone],boarding=busBoarding?.car===c.id;return `<div class="coach-bay occupied" style="--coach-color:${paint.hex}"><span class="bay-number">${index+1}</span>${boarding?`<div class="bay-rider" style="animation-delay:-${busBoarding.elapsed}ms">${busPerson(c.tone)}</div>`:''}<div class="docked-coach ${c.status}" style="animation-delay:-${c.elapsed}ms">${coachSprite(c)}</div><strong>${paint.name} · ${c.load} / ${c.capacity} 人</strong><span class="bay-load"><i style="width:${c.load/c.capacity*100}%"></i></span><small>${c.status==='arriving'?'正在进站':c.status==='leaving'?'已坐满，出发！':boarding?'同色乘客上车中':c.load?'还未坐满，继续等客':'等候同色乘客'}</small></div>`;}
function drawBus(){
 const groups=queueGroups(),head=busQueue[0],busy=busBays.filter(x=>x!==null).length,total=busCars.reduce((n,c)=>n+c.capacity,0),done=busCars.every(c=>c.status==='gone');
 const waiting=busQueue.length&&!busMatch()&&!busCars.some(c=>c.status==='arriving'&&c.tone===head);
 const message=busNotice||(done?'本轮全部满载出发！下一批乘客和车辆马上到站。':waiting&&busy===5?'车位已满，队首乘客正在等同色车。可以撤销派车，重新安排。':waiting?`队首是${busPaint[head].name}乘客，请从下方派一辆${busPaint[head].name}车。`:'点击停车场的车自动进站，按排队顺序接同色乘客，坐满才走。');
 $('#gameMeter').textContent=`第 ${busWave} 波 · 已接 ${busDelivered} / ${total} 人 · 车位 ${busy} / 5`;
 const markup=`<div class="dispatch-game"><section class="station-top"><div class="station-heading"><div><span class="station-kicker">COLOR BUS STATION</span><h2>快上车 · 彩色公交站</h2></div><div class="station-count">排队 <b>${busQueue.length}</b> 人<span>${busPending.length?'乘客持续进站中 →':'本轮乘客已全部到站'}</span></div></div><div class="station-queue"><span class="queue-start">队首<br>↓</span><div class="passenger-line" aria-label="${head===undefined?'暂无排队乘客':`队首${busPaint[head].name}，当前排队${busQueue.length}人`}">${busQueue.map((tone,i)=>busPerson(tone,i===0?(busBoarding?'front boarding':'front'):'')).join('')}${!busQueue.length?'<span class="queue-empty">下一批乘客正在赶来…</span>':''}</div></div><div class="queue-groups">${groups.slice(0,8).map(g=>`<span style="--group:${busPaint[g.tone].hex}"><i></i>${busPaint[g.tone].name} ${g.count} 人</span>`).join('')}${groups.length>8?'<span>后面还有…</span>':''}</div><div class="station-warning"></div></section><section class="station-lane"><div class="lane-title"><b>5 个停靠位</b><span>同色上车 · 满座驶离</span></div><div class="coach-bays">${busBays.map((_,i)=>bayContent(i)).join('')}</div><div class="lane-dashes"><span>进站 ↑</span><span>满载驶离 →</span></div></section><div class="dispatch-notice" role="status">${message}</div><section class="fleet-section"><div class="fleet-heading"><h3>停车场 <small>点击车辆，自动进站</small></h3><span>每辆车的座位数不同</span></div><div class="coach-fleet">${busCars.map((c,i)=>`<button class="fleet-car ${c.status==='parked'?'':'dispatched'}" data-shuttle="${i}" ${c.status==='parked'?'':'disabled'} style="--coach-color:${busPaint[c.tone].hex}" aria-label="${busPaint[c.tone].name}${c.capacity}座车 ${i+1}，${c.status==='parked'?'点击进站':c.status==='gone'?'已满载驶离':'已派出'}">${coachSprite(c)}<span><b>${busPaint[c.tone].name}</b><strong>${c.capacity} 座</strong></span>${c.status==='parked'?'':`<i class="fleet-state">${c.status==='gone'?'✓ 已送达':'已派出'}</i>`}</button>`).join('')}</div></section><div class="dispatch-actions"><button id="busBack" ${busUndo.length?'':'disabled'} title="恢复到上次派车前，包括排队和载客进度">↶ 撤销派车</button><span>观察队首颜色，留好停靠位</span><button id="busAudioButton">${window.GameAudio?.enabled?'🔊 音效开':'🔇 音效关'}</button></div></div>`;
 paintBus(markup);
 stage.querySelectorAll('[data-shuttle]').forEach(b=>b.onclick=()=>dispatchBus(+b.dataset.shuttle));$('#busBack').onclick=undoBusDispatch;$('#busAudioButton').onclick=()=>{window.GameAudio?.toggle();drawBus();};
}

// Keep parking buttons and scrolling stable while passengers keep boarding.
function paintBus(markup){
 const current=stage.querySelector('.dispatch-game');
 if(!current||current.dataset.wave!==String(busWave)){stage.innerHTML=markup;stage.querySelector('.dispatch-game').dataset.wave=String(busWave);return;}
 const template=document.createElement('template');template.innerHTML=markup;const fresh=template.content;
 for(const selector of ['.station-top','.station-lane']){const node=current.querySelector(selector),line=node.querySelector('.passenger-line'),scroll=line?.scrollLeft||0;node.innerHTML=fresh.querySelector(selector).innerHTML;const nextLine=node.querySelector('.passenger-line');if(nextLine)nextLine.scrollLeft=scroll;}
 current.querySelector('.dispatch-notice').textContent=fresh.querySelector('.dispatch-notice').textContent;
 for(const car of busCars){const selector=`[data-shuttle="${car.id}"]`,button=current.querySelector(selector),next=fresh.querySelector(selector);button.disabled=next.disabled;button.className=next.className;button.setAttribute('aria-label',next.getAttribute('aria-label'));if(button.dataset.state!==car.status){button.innerHTML=next.innerHTML;button.dataset.state=car.status;}}
 current.querySelector('#busBack').disabled=!busUndo.length;current.querySelector('#busAudioButton').textContent=fresh.querySelector('#busAudioButton').textContent;
}
