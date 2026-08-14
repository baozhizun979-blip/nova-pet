const ROOT = document.getElementById('view')
const ROUTES = {
  '/': renderHome,
  '/hatch': renderHatch,
  '/pet': renderPet,
  '/tasks': renderTasks,
  '/shop': renderShop,
  '/me': renderMe
}

function navTo(path){ location.hash = '#'+path }
function getState(){ return JSON.parse(localStorage.getItem('nova_state')||'{}') }
function setState(s){ localStorage.setItem('nova_state', JSON.stringify(s)) }
function ensure(){ let s=getState(); if(!s.coins) s.coins=100; if(!s.pet) s.pet=null; if(!s.tasks) s.tasks=[{id:1,title:'初始任务',done:false}]; setState(s); return s }

function render(){ const path = location.hash.replace('#','')||'/'; (ROUTES[path]||renderHome)() }

function renderHome(){ const s=ensure(); ROOT.innerHTML='';
  const el=document.createElement('div'); el.className='card';
  el.innerHTML=`<h2>欢迎来到 Nova 星宠</h2><p class="muted">虚拟宠物小游戏演示</p><div class="row"><div><button id="go-hatch">立即孵化</button></div><div><button id="go-pet">查看宠物</button></div></div>`
  ROOT.appendChild(el);
  document.getElementById('go-hatch').onclick=()=>navTo('/hatch');
  document.getElementById('go-pet').onclick=()=>navTo('/pet');
}

function renderHatch(){ const s=ensure(); ROOT.innerHTML='';
  const el=document.createElement('div'); el.className='card';
  el.innerHTML=`<h2>孵化中心</h2><p class="muted">使用 50 星币孵化一个宠物</p><div class="row"><div class="pet-sprite">?</div><div><p class="small">当前余额: <span id="coins">${s.coins}</span></p><button id="hatch">孵化 (50)</button></div></div>`
  ROOT.appendChild(el);
  document.getElementById('hatch').onclick=()=>{
    if(s.coins<50){ alert('余额不足'); return }
    s.coins-=50; s.pet={name:'Nova宠',level:1,hunger:0,exp:0}; setState(s); alert('孵化成功！'); navTo('/pet')
  }
}

function renderPet(){ const s=ensure(); ROOT.innerHTML='';
  const el=document.createElement('div'); el.className='card';
  if(!s.pet){ el.innerHTML=`<h2>你还没有宠物</h2><p class="muted">先去孵化一个吧</p><button id="to-hatch">去孵化</button>`; ROOT.appendChild(el); document.getElementById('to-hatch').onclick=()=>navTo('/hatch'); return }
  el.innerHTML=`<h2>${s.pet.name} （Lv ${s.pet.level}）</h2><div class="row"><div class="pet-sprite">${s.pet.name[0]||'N'}</div><div><p class="small">饥饿: ${s.pet.hunger}</p><p class="small">经验: ${s.pet.exp}</p><div><button id="feed">喂食</button> <button id="play">玩耍</button></div></div></div>`
  ROOT.appendChild(el);
  document.getElementById('feed').onclick=()=>{ s.pet.hunger=Math.max(0,s.pet.hunger-1); s.coins=Math.max(0,s.coins-5); setState(s); renderPet(); }
  document.getElementById('play').onclick=()=>{ s.pet.exp+=10; if(s.pet.exp>=100){ s.pet.level+=1; s.pet.exp=0; alert('宠物升级！')}; setState(s); renderPet(); }
}

function renderTasks(){ const s=ensure(); ROOT.innerHTML='';
  const el=document.createElement('div'); el.className='card';
  el.innerHTML=`<h2>任务</h2><ul id="task-list"></ul><input id="task-title" placeholder="新任务"/><button id="add-task">添加</button>`
  ROOT.appendChild(el);
  const list=document.getElementById('task-list'); list.innerHTML=''; s.tasks.forEach(t=>{ const li=document.createElement('li'); li.innerHTML=`<label><input type="checkbox" data-id="${t.id}" ${t.done?'checked':''}/> ${t.title}</label>`; list.appendChild(li)});
  list.querySelectorAll('input[type=checkbox]').forEach(cb=>cb.onchange=e=>{ const id=+e.target.dataset.id; const found=s.tasks.find(x=>x.id===id); found.done=e.target.checked; if(found.done){ s.coins+=10; alert('奖励 10 星币') } setState(s) })
  document.getElementById('add-task').onclick=()=>{ const t=document.getElementById('task-title').value.trim(); if(!t) return; const id=(s.tasks[s.tasks.length-1]?.id||0)+1; s.tasks.push({id,title:t,done:false}); setState(s); renderTasks(); }
}

function renderShop(){ const s=ensure(); ROOT.innerHTML='';
  const items=[{id:1,name:'饲料',price:5},{id:2,name:'玩具',price:30}]
  const el=document.createElement('div'); el.className='card';
  el.innerHTML=`<h2>商城</h2><p class="small muted">余额: <span id="coins">${s.coins}</span></p><div id="items"></div>`
  ROOT.appendChild(el);
  const itemsEl=document.getElementById('items'); items.forEach(it=>{ const d=document.createElement('div'); d.className='card small'; d.innerHTML=`<strong>${it.name}</strong> - ${it.price} 星币 <button data-id="${it.id}">购买</button>`; itemsEl.appendChild(d) });
  itemsEl.querySelectorAll('button').forEach(b=>b.onclick=e=>{ const id=+e.target.dataset.id; const it=items.find(x=>x.id===id); if(s.coins<it.price){ alert('余额不足'); return } s.coins-=it.price; setState(s); alert('购买成功'); renderShop(); })
}

function renderMe(){ const s=ensure(); ROOT.innerHTML='';
  const el=document.createElement('div'); el.className='card'; el.innerHTML=`<h2>个人中心</h2><p class="small">星币: ${s.coins}</p><p class="small">本地存档保存在浏览器 localStorage</p>`; ROOT.appendChild(el);
}

window.addEventListener('hashchange', render);
document.addEventListener('DOMContentLoaded', ()=>{ render(); })
