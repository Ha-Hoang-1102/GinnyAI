const $ = (id) => document.getElementById(id);
const statuses = {queued:'Chờ nhận', running:'Đang làm', awaiting_review:'Chờ duyệt', blocked:'Đang vướng', failed:'Thất bại', done:'Hoàn tất', cancelled:'Đã hủy'};
const kinds = {powershell:'PowerShell',research:'Nghiên cứu',decision:'Quyết định',reminder:'Nhắc việc',article:'Viết bài',image:'Hình ảnh'};
let resultTask = null;
async function api(path, data) {
  const response = await fetch(path, data === undefined ? {} : {method:'POST',headers:{'Content-Type':'application/json','X-Ginny-Client':'local'},body:JSON.stringify(data)});
  const value = await response.json();
  if (!response.ok) throw new Error(value.error || 'Không kết nối được');
  return value;
}
function message(text) { $('message').textContent = text; }
function safe(fn) { return async () => { try { await fn(); } catch (error) { message(error.message); } }; }
function button(text, action) { const b=document.createElement('button'); b.textContent=text; b.addEventListener('click',safe(action)); return b; }
function show(title, text, note='') { $('detail-title').textContent=title; $('detail-text').value=text; $('detail-note').textContent=note; $('detail').showModal(); }
async function move(task, status, result) {
  await api(`/api/tasks/${task.id}`, {status,version:task.version,...(result===undefined?{}:{result})});
  await refresh();
}
async function refresh() {
  const tasks = await api('/api/tasks');
  const active=tasks.filter(t=>!['done','cancelled'].includes(t.status));
  $('active').textContent=active.length;
  $('due').textContent=active.filter(t=>t.due_at && new Date(t.due_at)<=new Date()).length;
  $('review').textContent=tasks.filter(t=>t.status==='awaiting_review').length;
  $('tasks').replaceChildren();
  if (!tasks.length) { const p=document.createElement('p'); p.className='empty'; p.textContent='Bắt đầu bằng một việc có mục tiêu và tiêu chí rõ ràng.'; $('tasks').append(p); }
  for (const task of tasks) {
    const card=document.createElement('article'); card.className='task';
    const tag=document.createElement('p'); tag.className='tag'; tag.textContent=`#${task.id} · ${kinds[task.kind]} · P${task.priority} · ${statuses[task.status]}`;
    const title=document.createElement('h3'); title.textContent=task.title;
    const objective=document.createElement('p'); objective.textContent=task.objective;
    const due=document.createElement('p'); due.className='hint'; due.textContent=task.due_at ? `Hạn: ${new Date(task.due_at).toLocaleString('vi-VN',{timeZone:'Asia/Bangkok'})} (UTC+7)` : 'Chưa đặt hạn';
    const actions=document.createElement('div'); actions.className='actions';
    actions.append(button('Bản giao việc',async()=>show('Giao cho ChatGPT/Codex',(await api(`/api/tasks/${task.id}/brief`)).text,'Sao chép sang cuộc trò chuyện phù hợp. Giữ câu trả lời ngắn, đính kèm bằng chứng.')));
    if (task.due_at) actions.append(button('Nhắc qua ChatGPT', async()=>show('Tạo nhắc việc',(await api(`/api/tasks/${task.id}/reminder`)).text,'Dán vào ChatGPT có Tasks. Kiểm tra xác nhận tạo lịch và bật thông báo trên điện thoại.')));
    if(task.status==='queued') {
      if(task.kind==='powershell') actions.append(button('Lệnh chạy',()=>show('Chạy trên máy đích',`python -m ginny run ${task.id} --workspace .`,'Mở PowerShell tại thư mục GinnyAI, dùng cùng database với bảng. Runner tự cập nhật trạng thái.')));
      else actions.append(button('Nhận việc',()=>move(task,'running')));
    }
    if(task.status==='running') {
      actions.append(button('Nộp kết quả',()=>{resultTask=task; $('result-text').value=''; $('result-dialog').showModal();}));
      actions.append(button('Báo vướng',async()=>{const reason=window.prompt('Thông tin hoặc điều kiện nào đang thiếu?'); if(reason?.trim()) await move(task,'blocked',reason);}));
    }
    if(task.status==='awaiting_review') {
      actions.append(button('Duyệt hoàn tất',()=>move(task,'done')));
      actions.append(button('Giao lại',()=>move(task,'queued')));
    }
    if(['failed','blocked'].includes(task.status)) actions.append(button('Đưa lại vào hàng đợi',()=>move(task,'queued')));
    if(!['done','cancelled'].includes(task.status)) actions.append(button('Hủy việc',()=>move(task,'cancelled')));
    actions.append(button('Kết quả & lịch sử',async()=>{const t=await api(`/api/tasks/${task.id}`); show('Kết quả & lịch sử',`${t.result || 'Chưa có kết quả'}\n\n${t.events.map(e=>`${e.at} | ${statuses[e.status]}\n${e.note}`).join('\n\n')}`);}));
    card.append(tag,title,objective,due,actions); $('tasks').append(card);
  }
}
$('create').elements.kind.addEventListener('change',()=>{const kind=$('create').elements.kind.value; $('command-field').hidden=kind!=='powershell'; $('create').elements.due_at.required=kind==='reminder';});
$('create').addEventListener('submit',async(event)=>{
  event.preventDefault();
  try {
    const data=Object.fromEntries(new FormData(event.target)); data.priority=Number(data.priority);
    data.due_at=data.due_at?new Date(data.due_at+':00+07:00').toISOString():null;
    if(data.kind!=='powershell') delete data.command_id;
    await api('/api/tasks',data); event.target.reset(); $('command-field').hidden=true; event.target.elements.due_at.required=false;
    message('Đã tạo việc.'); await refresh();
  } catch(error){message(error.message);}
});
$('result-form').addEventListener('submit',async(event)=>{event.preventDefault(); try {await move(resultTask,'awaiting_review',$('result-text').value); $('result-dialog').close();}catch(error){$('result-dialog').close();message(error.message);}});
$('cancel-result').addEventListener('click',()=>$('result-dialog').close());
$('refresh').addEventListener('click',safe(refresh));
$('report').addEventListener('click',safe(async()=>show('Báo cáo tổng hợp',(await api('/api/report')).text)));
$('copy').addEventListener('click',async()=>{try {await navigator.clipboard.writeText($('detail-text').value); $('detail-note').textContent='Đã sao chép.';}catch{ $('detail-text').select(); $('detail-note').textContent='Nhấn Ctrl+C để sao chép phần đã chọn.'; }});
safe(refresh)();
setInterval(safe(refresh),15000);
