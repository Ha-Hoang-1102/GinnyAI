import {useCallback, useEffect, useRef, useState} from 'react';
import Layout from './Layout.jsx';
import {Icon,TeamCard,Connections,Pipeline,TaskCard,Dialog} from './Components.jsx';
import {agents,teams,statuses,isOpen,isDue,hasIssue,time,api} from './model.js';

const EMPTY_FILTERS={team:'all',kind:'all',status:'all',query:''};
function scrollWork() { document.getElementById('work').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'}); }

export default function App() {
  const [tasks,setTasks]=useState([]),[filters,setFilters]=useState(EMPTY_FILTERS),[message,setMessage]=useState('');
  const [sync,setSync]=useState(''),[lastSync,setLastSync]=useState(null);
  const [detail,setDetail]=useState(null),[createKind,setCreateKind]=useState(null),[resultTask,setResultTask]=useState(null);
  const [createError,setCreateError]=useState(''),[resultError,setResultError]=useState(''),[busy,setBusy]=useState(false);
  const requestVersion=useRef(0),submitLock=useRef(false),wasStale=useRef(false);
  const refresh=useCallback(async()=>{
    const version=++requestVersion.current;
    try {
      const data=await api('/api/tasks');
      if(version!==requestVersion.current)return;
      setTasks(data);setLastSync(new Date());setSync('connected');
      if(wasStale.current)setMessage('');
      wasStale.current=false;
    } catch {
      if(version!==requestVersion.current)return;
      wasStale.current=true;setSync('stale');throw new Error('Chưa kết nối được Ginny Control. Kiểm tra cửa sổ chạy dịch vụ, rồi chọn Tải lại dữ liệu.');
    }
  },[]);
  useEffect(()=>{
    const run=()=>refresh().catch(error=>setMessage(error.message));run();
    const timer=setInterval(run,15000);
    return ()=>{clearInterval(timer);requestVersion.current++;};
  },[refresh]);
  const safe=fn=>(...args)=>Promise.resolve().then(()=>fn(...args)).catch(error=>setMessage(error.message));
  const scope=(team='all',kind='all',scroll=false)=>{setFilters({...EMPTY_FILTERS,team,kind});if(scroll)scrollWork();};
  const selectScope=(team='all',kind='all')=>scope(team,kind,true);
  const show=(title,text,note='')=>setDetail({title,text,note});
  const openCreate=()=>{setCreateError('');setCreateKind(filters.kind!=='all'?filters.kind:teams.find(t=>t.id===filters.team)?.kinds[0] || 'decision');};
  const move=async(task,status,result)=>{
    // Invalidate older reads so they cannot replace the successful mutation.
    requestVersion.current++;
    const updated=await api(`/api/tasks/${task.id}`,{status,version:task.version,...(result===undefined?{}:{result})});
    setTasks(current=>current.map(t=>t.id===updated.id?updated:t));
    try {await refresh();} catch(error){setMessage(error.message);}
  };
  const details=async task=>{
    const value=await api(`/api/tasks/${task.id}`);
    show(`#${value.id} · ${value.title}`,[`Agent: ${agents[value.kind].name} · ${statuses[value.status]}`,`Mục tiêu: ${value.objective}`,`Tiêu chí: ${value.acceptance}`,`Ngữ cảnh: ${value.context || '(không có)'}`,`Kết quả:\n${value.result || 'Chưa có kết quả'}`,'LỊCH SỬ',...value.events.map(e=>`${time(e.at,true)} (UTC+7) | ${statuses[e.status]}\n${e.note}`)].join('\n\n'));
  };
  const submitCreate=async event=>{
    event.preventDefault();if(submitLock.current)return;
    submitLock.current=true;setBusy(true);setCreateError('');
    const form=event.currentTarget;
    try {
      const data=Object.fromEntries(new FormData(form));data.priority=Number(data.priority);
      data.due_at=data.due_at?new Date(`${data.due_at}:00+07:00`).toISOString():null;
      if(data.kind!=='powershell')delete data.command_id;
      requestVersion.current++;
      const created=await api('/api/tasks',data);
      setTasks(current=>[created,...current]);setCreateKind(null);scope();
      setMessage(`Đã giao việc #${created.id} cho ${agents[created.kind].name}.`);
      try {await refresh();} catch(error){setMessage(error.message);}
    }catch(error){setCreateError(error.message);}finally{submitLock.current=false;setBusy(false);}
  };
  const submitResult=async event=>{
    event.preventDefault();if(submitLock.current)return;
    submitLock.current=true;setBusy(true);setResultError('');
    const result=new FormData(event.currentTarget).get('result');
    try {await move(resultTask,'awaiting_review',result);setResultTask(null);}
    catch(error){setResultError(error.message);}finally{submitLock.current=false;setBusy(false);}
  };
  const report=safe(async()=>show('Báo cáo tổng hợp',(await api('/api/report')).text));
  const active=tasks.filter(isOpen),counted=tasks.filter(t=>t.status!=='cancelled'),done=counted.filter(t=>t.status==='done').length;
  const running=tasks.filter(t=>t.status==='running').length,team=teams.find(t=>t.id===filters.team),query=filters.query.trim().toLocaleLowerCase('vi');
  const visible=tasks.filter(t=>(!team||team.kinds.includes(t.kind))&&(filters.kind==='all'||filters.kind===t.kind)&&(filters.status==='all'||(filters.status==='issues'?hasIssue(t):t.status===filters.status))&&(!query||`${t.title} ${t.objective} #${t.id}`.toLocaleLowerCase('vi').includes(query)));
  const ratio=counted.length?100*done/counted.length:0;
  const vm={tasks,filters,message,sync,active,running,total:tasks.length,ratio,
    review:tasks.filter(t=>t.status==='awaiting_review').length,attention:active.filter(t=>isDue(t)||hasIssue(t)).length,
    attentionNote:`${active.filter(isDue).length} đến hạn · ${active.filter(hasIssue).length} vướng/lỗi`,
    hubStatus:running?`${running} việc đang xử lý`:'Chưa có việc đang làm',
    completionPercent:counted.length?`${Math.round(ratio)}%`:'—',completionCaption:counted.length?`${done}/${counted.length} việc hoàn tất`:'Chưa có dữ liệu công việc',
    visibleCount:visible.length,filterCaption:`${filters.kind!=='all'?`${agents[filters.kind].name} · ${agents[filters.kind].label}`:team?`Nhóm ${team.name}`:'Tất cả nhóm'} · ${visible.length}/${tasks.length} việc · Ưu tiên việc đến hạn`,
    syncText:sync==='connected'?`Cập nhật ${time(lastSync)}`:sync==='stale'?(lastSync?`Mất kết nối · dữ liệu ${time(lastSync)}`:'Chưa tải được dữ liệu'):'Đang kết nối…',
  };
  const slots={
    teamNav:teams.map(t=><button key={t.id} className="nav-link team-nav-button" aria-pressed={filters.team===t.id||t.kinds.includes(filters.kind)} onClick={()=>selectScope(t.id)}><i className={`dot ${t.id}`}/><span>{t.name}</span><span className="team-nav-count">{tasks.filter(task=>t.kinds.includes(task.kind)&&isOpen(task)).length}</span></button>),
    teams:Object.fromEntries(teams.map(t=>[t.id,<TeamCard key={t.id} team={t} tasks={tasks} filters={filters} onScope={selectScope}/>])),
    connections:<Connections tasks={tasks} scope={`${filters.team}:${filters.kind}`}/>,
    pipeline:<Pipeline tasks={tasks} onSelect={status=>{setFilters({...EMPTY_FILTERS,status});scrollWork();}}/>,
    tasks:visible.length?visible.map(task=><TaskCard key={task.id} task={task} onDetails={safe(details)} onMove={safe(move)}
      onBrief={safe(async t=>show('Giao cho ChatGPT/Codex',(await api(`/api/tasks/${t.id}/brief`)).text,'Sao chép sang cuộc trò chuyện phù hợp và gửi kết quả trở lại bảng.'))}
      onReminder={safe(async t=>show('Tạo nhắc việc',(await api(`/api/tasks/${t.id}/reminder`)).text,'Dán vào ChatGPT có Tasks. Kiểm tra xác nhận tạo lịch và thông báo trên điện thoại.'))}
      onRun={t=>show('Chạy trên máy Windows',`py -3 -m ginny run ${t.id} --workspace .`,'Mở PowerShell tại E:\\GinnyAI, dùng cùng database với bảng. Runner tự cập nhật trạng thái.')}
      onResult={t=>{setResultError('');setResultTask(t);}}/>):<div className="empty"><div className="empty-symbol"><Icon name="network"/></div><h3>{tasks.length?'Chưa có việc phù hợp':'Mạng lưới đã có chỗ cho công việc đầu tiên'}</h3><p>{tasks.length?'Đổi bộ lọc hoặc giao thêm nhiệm vụ cho nhóm đang chọn.':'Giao một nhiệm vụ. Ginny sẽ hiển thị đúng nhóm, agent và trạng thái để bạn theo dõi.'}</p><button className="primary" onClick={openCreate}>{tasks.length?'Giao việc cho nhóm':'Tạo nhiệm vụ đầu tiên'}</button></div>,
  };
  return <>
    <Layout vm={vm} slots={slots} actions={{scope,create:openCreate,report,filter:update=>setFilters(current=>({...current,...update})),refresh:safe(async()=>{await refresh();setMessage('');})}}/>
    {createKind!==null&&<Dialog id="create-dialog" titleId="create-title" onClose={()=>!busy&&setCreateKind(null)}>
      <div className="dialog-heading"><div><p className="eyebrow">NHIỆM VỤ MỚI</p><h2 id="create-title">Giao việc cho nhóm AI</h2></div><button className="icon-button" disabled={busy} aria-label="Đóng tạo việc" onClick={()=>setCreateKind(null)}><Icon name="close"/></button></div><p className="dialog-intro">Mục tiêu rõ ràng giúp agent tập trung đúng việc.</p>
      <form id="create" onSubmit={submitCreate}><label>Tên việc<input name="title" required maxLength="160" placeholder="Ví dụ: Tổng hợp 3 công cụ AI cho nhóm"/></label>
        <div className="row"><label>Agent phụ trách<select name="kind" value={createKind} onChange={e=>setCreateKind(e.target.value)}>{Object.entries(agents).map(([id,role])=><option key={id} value={id}>{role.name} · {role.label}</option>)}</select></label><label>Ưu tiên<select name="priority" defaultValue="2"><option value="1">P1 · Cao</option><option value="2">P2 · Thường</option><option value="3">P3 · Thấp</option></select></label></div>
        <label>Mục tiêu<textarea name="objective" required maxLength="1000" placeholder="Kết quả cụ thể bạn cần"/></label><label>Tiêu chí hoàn thành<textarea name="acceptance" required maxLength="1000" placeholder="Đo hoặc kiểm chứng kết quả bằng cách nào?"/></label><label>Ngữ cảnh cần thiết<textarea name="context" maxLength="2000" placeholder="Nguồn, file, độc giả và ràng buộc liên quan."/></label><label>Hạn xử lý · UTC+07:00<input name="due_at" type="datetime-local" required={createKind==='reminder'}/></label>
        <label id="command-field" hidden={createKind!=='powershell'}>Lệnh PowerShell<select name="command_id" defaultValue="system.info"><option value="system.info">Thông tin hệ thống</option><option value="workspace.list">Liệt kê workspace</option><option value="git.status">Trạng thái Git</option></select></label>
        <p id="create-error" className="form-error" role="alert" hidden={!createError}>{createError}</p><div className="dialog-actions"><button type="button" disabled={busy} onClick={()=>setCreateKind(null)}>Quay lại</button><button className="primary" type="submit" disabled={busy}><Icon name="plus"/>Thêm vào hàng đợi</button></div>
      </form>
    </Dialog>}
    {detail&&<Dialog id="detail" titleId="detail-title" onClose={()=>setDetail(null)}><div className="dialog-heading"><h2 id="detail-title">{detail.title}</h2><button className="icon-button" aria-label="Đóng chi tiết" onClick={()=>setDetail(null)}><Icon name="close"/></button></div><p id="detail-note" className="dialog-intro">{detail.note}</p><textarea id="detail-text" rows="16" readOnly value={detail.text} aria-label="Nội dung"/><div className="dialog-actions"><button id="copy" className="primary" onClick={async()=>{try{await navigator.clipboard.writeText(detail.text);setDetail(current=>current&&({...current,note:'Đã sao chép.'}));}catch{document.getElementById('detail-text').select();setDetail(current=>current&&({...current,note:'Nhấn Ctrl+C để sao chép phần đã chọn.'}));}}}>Sao chép nội dung</button></div></Dialog>}
    {resultTask&&<Dialog id="result-dialog" titleId="result-title" onClose={()=>!busy&&setResultTask(null)}><form id="result-form" onSubmit={submitResult}><div className="dialog-heading"><h2 id="result-title">Báo cáo từ tác nhân</h2><button type="button" className="icon-button" disabled={busy} aria-label="Đóng báo cáo" onClick={()=>setResultTask(null)}><Icon name="close"/></button></div><label>Kết quả, bằng chứng, điểm còn thiếu<textarea id="result-text" name="result" required maxLength="12000" rows="12"/></label><p id="result-error" className="form-error" role="alert" hidden={!resultError}>{resultError}</p><div className="dialog-actions"><button type="button" disabled={busy} onClick={()=>setResultTask(null)}>Quay lại</button><button className="primary" type="submit" disabled={busy}>Gửi duyệt</button></div></form></Dialog>}
  </>;
}
