const $ = (id) => document.getElementById(id);
const SVG = 'http://www.w3.org/2000/svg';
const statuses = {queued:'Chờ nhận', running:'Đang làm', awaiting_review:'Chờ duyệt', blocked:'Đang vướng', failed:'Thất bại', done:'Hoàn tất', cancelled:'Đã hủy'};
const agents = {
  powershell:{name:'Executor', label:'PowerShell', icon:'terminal'},
  research:{name:'Researcher', label:'Nghiên cứu', icon:'search'},
  decision:{name:'Planner', label:'Quyết định', icon:'compass'},
  reminder:{name:'Reminder', label:'Nhắc việc', icon:'clock'},
  article:{name:'Editor', label:'Bài viết', icon:'file'},
  image:{name:'Designer', label:'Hình ảnh', icon:'image'},
};
const teams = [
  {id:'execution', name:'Thực thi', icon:'terminal', kinds:['powershell']},
  {id:'research', name:'Nghiên cứu', icon:'search', kinds:['research']},
  {id:'planning', name:'Điều phối', icon:'compass', kinds:['decision','reminder']},
  {id:'creative', name:'Sáng tạo', icon:'spark', kinds:['article','image']},
];
const stateOrder = {failed:0, blocked:1, running:2, awaiting_review:3, queued:4, done:5, cancelled:6};
let tasks = [], selectedTeam = 'all', resultTask = null, requestVersion = 0, lastSync = null;

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
function svgNode(tag, attrs) {
  const node = document.createElementNS(SVG, tag);
  for (const [key,value] of Object.entries(attrs)) node.setAttribute(key, value);
  return node;
}
function icon(name) {
  const node = svgNode('svg', {class:'icon', 'aria-hidden':'true'});
  node.append(svgNode('use', {href:`#i-${name}`}));
  return node;
}
function button(text, action, className = '') {
  const node = el('button', className, text);
  node.type = 'button';
  node.addEventListener('click', safe(action));
  return node;
}
function message(text) { $('message').textContent = text; $('message').hidden = !text; }
function safe(fn) { return async () => { try { await fn(); } catch (error) { message(error.message); } }; }
function isOpen(task) { return !['done','cancelled'].includes(task.status); }
function isDue(task) { return isOpen(task) && task.due_at && new Date(task.due_at) <= new Date(); }
function hasIssue(task) { return ['blocked','failed'].includes(task.status); }
function time(value, full = false) {
  return new Date(value).toLocaleString('vi-VN', full ? {timeZone:'Asia/Bangkok'} : {timeZone:'Asia/Bangkok', hour:'2-digit', minute:'2-digit'});
}
async function api(path, data) {
  const response = await fetch(path, {
    signal: AbortSignal.timeout(10000),
    ...(data === undefined ? {} : {method:'POST', headers:{'Content-Type':'application/json','X-Ginny-Client':'local'}, body:JSON.stringify(data)}),
  });
  const value = await response.json();
  if (!response.ok) throw new Error(value.error || 'Không kết nối được dịch vụ.');
  return value;
}
function show(title, text, note = '') {
  $('detail-title').textContent = title;
  $('detail-text').value = text;
  $('detail-note').textContent = note;
  $('detail').showModal();
}
function scrollWork() { $('work').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block:'start'}); }
function selectScope(team = 'all', kind = 'all', scroll = true) {
  selectedTeam = team;
  $('kind-filter').value = kind;
  $('status-filter').value = 'all';
  $('search').value = '';
  render();
  if (scroll) scrollWork();
}
function clearFilters() { selectScope('all','all',false); }
function selectStatus(status) {
  selectedTeam = 'all'; $('kind-filter').value = 'all'; $('search').value = '';
  $('status-filter').value = status;
  render(); scrollWork();
}
function renderOverview() {
  const active = tasks.filter(isOpen), running = tasks.filter(t=>t.status==='running');
  $('active').textContent = active.length;
  $('running').textContent = running.length;
  $('review').textContent = tasks.filter(t=>t.status==='awaiting_review').length;
  $('attention').textContent = active.filter(t=>isDue(t) || hasIssue(t)).length;
  $('attention-note').textContent = `${active.filter(isDue).length} đến hạn · ${active.filter(hasIssue).length} vướng/lỗi`;
  $('total-label').textContent = `${tasks.length} việc đã tạo`;
  $('nav-count').textContent = active.length;
  $('hub-status').textContent = running.length ? `${running.length} việc đang xử lý` : 'Chưa có việc đang làm';
  const counted = tasks.filter(t=>t.status!=='cancelled');
  const done = counted.filter(t=>t.status==='done').length;
  const ratio = counted.length ? 100 * done / counted.length : 0;
  $('completion-percent').textContent = counted.length ? `${Math.round(ratio)}%` : '—';
  $('completion-caption').textContent = counted.length ? `${done}/${counted.length} việc hoàn tất` : 'Chưa có dữ liệu công việc';
  $('completion-ring').setAttribute('stroke-dasharray', `${ratio} ${100-ratio}`);
}
function renderGraph() {
  $('team-nav').replaceChildren();
  const selectedKind = $('kind-filter').value;
  for (const team of teams) {
    const assigned = tasks.filter(t=>team.kinds.includes(t.kind));
    const open = assigned.filter(isOpen);
    const selected = selectedTeam===team.id || team.kinds.includes(selectedKind);
    const nav = button('', ()=>selectScope(team.id), 'nav-link team-nav-button');
    nav.dataset.focusId = `nav-${team.id}`;
    nav.setAttribute('aria-pressed', String(selected));
    nav.append(el('i', `dot ${team.id}`), el('span','',team.name), el('span','team-nav-count',open.length));
    $('team-nav').append(nav);
    const card = el('section', `team-card ${team.id}${selected?' selected':''}`);
    card.setAttribute('aria-label', `Nhóm ${team.name}`);
    const heading = button('', ()=>selectScope(team.id), 'team-heading');
    heading.dataset.focusId = `team-${team.id}`;
    heading.setAttribute('aria-label', `Xem nhóm ${team.name}`);
    heading.setAttribute('aria-pressed', String(selected));
    const mark = el('span','team-icon'); mark.append(icon(team.icon));
    const caption = el('span'); caption.append(el('strong','',team.name),el('small','',`${open.length} việc mở · ${team.kinds.length} agent`));
    heading.append(mark, caption, icon('arrow'));
    const list = el('div','agent-list');
    for (const kind of team.kinds) {
      const assignedTasks = assigned.filter(t=>t.kind===kind);
      // Role nodes summarize recorded tasks; they are not connected worker instances.
      const lead = [...assignedTasks].sort((a,b)=>stateOrder[a.status]-stateOrder[b.status])[0];
      const summary = lead ? `${assignedTasks.filter(t=>t.status===lead.status).length} ${statuses[lead.status].toLowerCase()}` : 'Chưa có việc';
      const node = button('', ()=>selectScope(team.id,kind), `agent${selectedKind===kind?' selected':''}`);
      node.dataset.kind = kind; node.dataset.focusId = `agent-${kind}`;
      node.setAttribute('aria-label', `${agents[kind].name} · ${agents[kind].label}: ${summary}`);
      node.setAttribute('aria-pressed', String(selectedKind===kind));
      node.title = lead ? `#${lead.id} · ${lead.title}\n${assignedTasks.length} nhiệm vụ được giao. Bấm để xem tất cả.` : 'Bấm để xem hoặc giao nhiệm vụ cho vai trò này.';
      const avatar = el('span','agent-avatar'); avatar.append(icon(agents[kind].icon));
      const text = el('span','agent-text');
      text.append(el('span','agent-name',agents[kind].name), el('span','agent-description',lead?`#${lead.id} ${lead.title}`:agents[kind].label));
      const status = el('span','agent-state'); status.append(el('i',`dot ${lead?.status || 'queued'}`), el('span','',summary));
      node.append(avatar,text,el('span','agent-count',assignedTasks.length),status); list.append(node);
    }
    card.append(heading,list);
    $(`team-${team.id}`).replaceChildren(card);
  }
  requestAnimationFrame(drawConnections);
}
function drawConnections() {
  const canvas = $('network-map').getBoundingClientRect(), hub = $('hub-button').getBoundingClientRect();
  const graph = $('connections'); graph.replaceChildren();
  graph.setAttribute('viewBox',`0 0 ${canvas.width} ${canvas.height}`);
  const mobile = matchMedia('(max-width: 700px)').matches;
  for (const team of teams) {
    const target = $(`team-${team.id}`).firstElementChild;
    if (!target) continue;
    const box = target.getBoundingClientRect();
    const right = box.left > hub.left;
    const sx = (mobile ? hub.left+hub.width/2 : right?hub.right:hub.left)-canvas.left;
    const sy = (mobile ? hub.bottom : hub.top+hub.height/2)-canvas.top;
    const ex = (mobile ? box.left+box.width/2 : right?box.left:box.right)-canvas.left;
    const ey = (mobile ? box.top : box.top+box.height/2)-canvas.top;
    const midpoint = mobile ? sy+Math.min(32,(ey-sy)/2) : (sx+ex)/2;
    const path = mobile ? `M${sx},${sy} C${sx},${midpoint} ${ex},${midpoint} ${ex},${ey}` : `M${sx},${sy} C${midpoint},${sy} ${midpoint},${ey} ${ex},${ey}`;
    const assigned = tasks.filter(t=>team.kinds.includes(t.kind));
    graph.append(svgNode('path',{d:path,class:`connection-base${assigned.some(hasIssue)?' connection-alert':''}`}));
    if (assigned.some(t=>t.status==='running')) graph.append(svgNode('path',{d:path,class:'connection-live'}));
    graph.append(svgNode('circle',{cx:ex,cy:ey,r:3.5,class:'connection-node'}));
  }
}
function renderPipeline() {
  $('pipeline').replaceChildren();
  for (const [status,label,glyph] of [['queued','Chờ nhận','clock'],['running','Đang làm','play'],['awaiting_review','Chờ duyệt','file'],['done','Hoàn tất','check'],['issues','Vướng / lỗi','alert']]) {
    const count = status==='issues' ? tasks.filter(hasIssue).length : tasks.filter(t=>t.status===status).length;
    const node = button('',()=>selectStatus(status),`pipeline-step ${status==='issues'?'blocked':status}`);
    node.dataset.focusId = `pipeline-${status}`; node.dataset.status = status;
    node.setAttribute('aria-label', `${label}: ${count} việc`);
    const mark=el('span','step-icon'); mark.append(icon(glyph));
    node.append(mark,el('span','',label),el('strong','',count)); $('pipeline').append(node);
  }
}
function filteredTasks() {
  const kind = $('kind-filter').value, status = $('status-filter').value;
  const query = $('search').value.trim().toLocaleLowerCase('vi');
  const team = teams.find(t=>t.id===selectedTeam);
  return tasks.filter(t=>(!team || team.kinds.includes(t.kind)) && (kind==='all' || t.kind===kind) &&
    (status==='all' || (status==='issues'?hasIssue(t):t.status===status)) &&
    (!query || `${t.title} ${t.objective} #${t.id}`.toLocaleLowerCase('vi').includes(query)));
}
function openCreate() {
  if ($('kind-filter').value!=='all') $('create').elements.kind.value=$('kind-filter').value;
  else if (selectedTeam!=='all') $('create').elements.kind.value=teams.find(t=>t.id===selectedTeam).kinds[0];
  updateKindFields(); $('create-error').hidden=true; $('create-dialog').showModal();
}
async function details(task) {
  const value = await api(`/api/tasks/${task.id}`);
  show(`#${value.id} · ${value.title}`, [
    `Agent: ${agents[value.kind].name} · ${statuses[value.status]}`,
    `Mục tiêu: ${value.objective}`, `Tiêu chí: ${value.acceptance}`,
    `Ngữ cảnh: ${value.context || '(không có)'}`,
    `Kết quả:\n${value.result || 'Chưa có kết quả'}`, 'LỊCH SỬ',
    ...value.events.map(e=>`${time(e.at,true)} (UTC+7) | ${statuses[e.status]}\n${e.note}`),
  ].join('\n\n'));
}
async function move(task, status, result) {
  const updated = await api(`/api/tasks/${task.id}`, {status,version:task.version,...(result===undefined?{}:{result})});
  tasks = tasks.map(t=>t.id===updated.id ? updated : t);
  render();
  // A failed subsequent read must not make a successful submission look rejected.
  try { await refresh(); } catch(error) { message(error.message); }
}
function renderTasks() {
  const visible=filteredTasks(), team=teams.find(t=>t.id===selectedTeam), kind=$('kind-filter').value;
  $('visible-count').textContent=visible.length;
  $('filter-caption').textContent=`${kind!=='all'?`${agents[kind].name} · ${agents[kind].label}`:team?`Nhóm ${team.name}`:'Tất cả nhóm'} · ${visible.length}/${tasks.length} việc · Ưu tiên việc đến hạn`;
  $('tasks').replaceChildren();
  if (!visible.length) {
    const empty=el('div','empty'); const mark=el('div','empty-symbol'); mark.append(icon('network'));
    empty.append(mark,el('h3','',tasks.length?'Chưa có việc phù hợp':'Mạng lưới đã có chỗ cho công việc đầu tiên'),
      el('p','',tasks.length?'Đổi bộ lọc hoặc giao thêm nhiệm vụ cho nhóm đang chọn.':'Giao một nhiệm vụ. Ginny sẽ hiển thị đúng nhóm, agent và trạng thái để bạn theo dõi.'),
      button(tasks.length?'Giao việc cho nhóm':'Tạo nhiệm vụ đầu tiên',openCreate,'primary'));
    $('tasks').append(empty);
  }
  for (const task of visible) {
    const role=agents[task.kind], card=el('article','task'); card.dataset.taskId=task.id;
    const heading=el('div','task-heading'), meta=el('div','task-meta');
    meta.append(icon(role.icon),el('span','',`#${task.id} · ${role.name}`),el('span',`priority p${task.priority}`,`P${task.priority}`));
    const badge=el('span',`status-badge ${task.status}`); badge.append(el('i',`dot ${task.status}`),el('span','',statuses[task.status]));
    heading.append(meta,badge);
    const progress=el('ol',`task-progress ${task.status}`);
    progress.setAttribute('aria-label',`Giai đoạn hiện tại: ${statuses[task.status]}`);
    const step={queued:0,running:1,blocked:1,failed:1,awaiting_review:2,done:3,cancelled:-1}[task.status];
    ['Chờ nhận','Đang làm','Chờ duyệt','Hoàn tất'].forEach((label,index)=>progress.append(el('li',`${index<=step?'reached':''} ${index===step?'current':''}`,label)));
    const bottom=el('div','task-bottom'), due=el('span',`due${isDue(task)?' overdue':''}`);
    due.append(icon('clock'),el('span','',task.due_at?`${time(task.due_at,true)} · UTC+7`:'Chưa đặt hạn'));
    const detail=button('Chi tiết & lịch sử',()=>details(task),'text-button'); detail.dataset.focusId=`details-${task.id}`;
    bottom.append(due,detail);
    const actions=el('div','actions');
    actions.append(button('Bản giao việc',async()=>show('Giao cho ChatGPT/Codex',(await api(`/api/tasks/${task.id}/brief`)).text,'Sao chép sang cuộc trò chuyện phù hợp và gửi kết quả trở lại bảng.')));
    if (task.due_at) actions.append(button('Nhắc qua ChatGPT',async()=>show('Tạo nhắc việc',(await api(`/api/tasks/${task.id}/reminder`)).text,'Dán vào ChatGPT có Tasks. Kiểm tra xác nhận tạo lịch và thông báo trên điện thoại.')));
    if (task.status==='queued') {
      if (task.kind==='powershell') actions.append(button('Lệnh chạy',()=>show('Chạy trên máy Windows',`py -3 -m ginny run ${task.id} --workspace .`,'Mở PowerShell tại E:\\GinnyAI, dùng cùng database với bảng. Runner tự cập nhật trạng thái.'),'action-main'));
      else actions.append(button('Nhận việc',()=>move(task,'running'),'action-main'));
    }
    if (task.status==='running') {
      actions.append(button('Nộp kết quả',()=>{resultTask=task; $('result-text').value=''; $('result-error').hidden=true; $('result-dialog').showModal();},'action-main'));
      actions.append(button('Báo vướng',async()=>{const reason=window.prompt('Thông tin hoặc điều kiện nào đang thiếu?'); if(reason?.trim()) await move(task,'blocked',reason);}));
    }
    if (task.status==='awaiting_review') {
      actions.append(button('Duyệt hoàn tất',()=>move(task,'done'),'action-main'));
      actions.append(button('Giao lại',()=>move(task,'queued')));
    }
    if (hasIssue(task)) actions.append(button('Đưa lại vào hàng đợi',()=>move(task,'queued'),'action-main'));
    if (isOpen(task)) actions.append(button('Hủy việc',()=>move(task,'cancelled')));
    [...actions.children].forEach((node,index)=>{node.dataset.focusId=`task-${task.id}-action-${index}`;});
    card.append(heading,el('h3','',task.title),el('p','task-objective',task.objective),progress,bottom,actions);
    $('tasks').append(card);
  }
}
function render() {
  const focusId=document.activeElement?.dataset.focusId;
  renderOverview(); renderGraph(); renderPipeline(); renderTasks();
  if (focusId) document.querySelector(`[data-focus-id="${focusId}"]`)?.focus({preventScroll:true});
}
async function refresh() {
  const version=++requestVersion;
  try {
    const data=await api('/api/tasks');
    if (version!==requestVersion) return;
    tasks=data; lastSync=new Date();
    if ($('sync-state').classList.contains('stale')) message('');
    $('sync-state').textContent=`Cập nhật ${time(lastSync)}`; $('sync-state').className='sync-state connected';
    $('sync-state').title='Dữ liệu công việc được tải lại mỗi 15 giây.';
    render();
  } catch (error) {
    if (version!==requestVersion) return;
    $('sync-state').className='sync-state stale';
    $('sync-state').textContent=lastSync?`Mất kết nối · dữ liệu ${time(lastSync)}`:'Chưa tải được dữ liệu';
    $('sync-state').title=error.message;
    throw new Error('Chưa kết nối được Ginny Control. Kiểm tra cửa sổ chạy dịch vụ, rồi chọn Tải lại dữ liệu.');
  }
}
function updateKindFields() {
  const kind=$('create').elements.kind.value;
  $('command-field').hidden=kind!=='powershell'; $('create').elements.due_at.required=kind==='reminder';
}
$('status-filter').append(new Option('Vướng / lỗi','issues'));
$('new-task').addEventListener('click',openCreate);
$('hub-button').addEventListener('click',()=>selectScope());
$('clear-filter').addEventListener('click',clearFilters);
$('kind-filter').addEventListener('change',()=>{selectedTeam='all';render();});
$('status-filter').addEventListener('change',renderTasks);
$('search').addEventListener('input',renderTasks);
$('create').elements.kind.addEventListener('change',updateKindFields);
$('create').addEventListener('submit',async(event)=>{
  event.preventDefault(); const form=event.currentTarget, submit=form.querySelector('[type=submit]');
  submit.disabled=true; $('create-error').hidden=true;
  try {
    const data=Object.fromEntries(new FormData(form)); data.priority=Number(data.priority);
    data.due_at=data.due_at?new Date(`${data.due_at}:00+07:00`).toISOString():null;
    if (data.kind!=='powershell') delete data.command_id;
    const created=await api('/api/tasks',data);
    tasks = [created, ...tasks];
    form.reset(); updateKindFields(); $('create-dialog').close(); clearFilters();
    message(`Đã giao việc #${created.id} cho ${agents[created.kind].name}.`);
    await refresh();
  } catch(error) {
    if ($('create-dialog').open) { $('create-error').textContent=error.message; $('create-error').hidden=false; }
    else message(error.message);
  } finally { submit.disabled=false; }
});
$('result-form').addEventListener('submit',async(event)=>{
  event.preventDefault(); const submit=event.currentTarget.querySelector('[type=submit]'); submit.disabled=true;
  try { await move(resultTask,'awaiting_review',$('result-text').value); $('result-dialog').close(); }
  catch(error) { $('result-error').textContent=error.message; $('result-error').hidden=false; }
  finally { submit.disabled=false; }
});
for (const node of document.querySelectorAll('[data-close]')) node.addEventListener('click',()=>$(node.dataset.close).close());
$('refresh').addEventListener('click',safe(async()=>{await refresh();message('');}));
for (const id of ['report','mobile-report']) $(id).addEventListener('click',safe(async()=>show('Báo cáo tổng hợp',(await api('/api/report')).text)));
$('copy').addEventListener('click',async()=>{try {await navigator.clipboard.writeText($('detail-text').value); $('detail-note').textContent='Đã sao chép.';} catch { $('detail-text').select(); $('detail-note').textContent='Nhấn Ctrl+C để sao chép phần đã chọn.'; }});
new ResizeObserver(()=>requestAnimationFrame(drawConnections)).observe($('network-map'));
render(); safe(refresh)();
setInterval(safe(refresh),15000);
