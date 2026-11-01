import {useLayoutEffect, useRef, useState} from 'react';
import {teams, agents, statuses, stateOrder, isOpen, isDue, hasIssue, time} from './model.js';

export function Icon({name}) { return <svg className="icon" aria-hidden="true"><use href={`#i-${name}`} /></svg>; }

export function TeamCard({team,tasks,filters,onScope}) {
  const assigned=tasks.filter(t=>team.kinds.includes(t.kind));
  const selected=filters.team===team.id || team.kinds.includes(filters.kind);
  return <section className={`team-card ${team.id}${selected?' selected':''}`} aria-label={`Nhóm ${team.name}`}>
    <button className="team-heading" aria-label={`Xem nhóm ${team.name}`} aria-pressed={selected} onClick={()=>onScope(team.id)}>
      <span className="team-icon"><Icon name={team.icon}/></span><span><strong>{team.name}</strong><small>{assigned.filter(isOpen).length} việc mở · {team.kinds.length} agent</small></span><Icon name="arrow"/>
    </button>
    <div className="agent-list">{team.kinds.map(kind=>{
      const list=assigned.filter(t=>t.kind===kind), role=agents[kind];
      const lead=[...list].sort((a,b)=>stateOrder[a.status]-stateOrder[b.status])[0];
      const summary=lead?`${list.filter(t=>t.status===lead.status).length} ${statuses[lead.status].toLowerCase()}`:'Chưa có việc';
      return <button key={kind} className={`agent${filters.kind===kind?' selected':''}`} data-kind={kind} aria-label={`${role.name} · ${role.label}: ${summary}`} aria-pressed={filters.kind===kind} onClick={()=>onScope(team.id,kind)} title={lead?`#${lead.id} · ${lead.title}\n${list.length} nhiệm vụ được giao.`:'Bấm để xem hoặc giao nhiệm vụ cho vai trò này.'}>
        <span className="agent-avatar"><Icon name={role.icon}/></span><span className="agent-text"><span className="agent-name">{role.name}</span><span className="agent-description">{lead?`#${lead.id} ${lead.title}`:role.label}</span></span><span className="agent-count">{list.length}</span><span className="agent-state"><i className={`dot ${lead?.status || 'queued'}`}/><span>{summary}</span></span>
      </button>;
    })}</div>
  </section>;
}

export function Connections({tasks,scope}) {
  const [geometry,setGeometry]=useState({width:1,height:1,paths:[]});
  useLayoutEffect(()=>{
    const map=document.getElementById('network-map');
    let frame;
    function draw() {
      const canvas=map.getBoundingClientRect(),hub=document.getElementById('hub-button').getBoundingClientRect();
      const mobile=matchMedia('(max-width: 700px)').matches;
      const paths=teams.map(team=>{
        const box=document.getElementById(`team-${team.id}`).firstElementChild.getBoundingClientRect(),right=box.left>hub.left;
        const sx=(mobile?hub.left+hub.width/2:right?hub.right:hub.left)-canvas.left, sy=(mobile?hub.bottom:hub.top+hub.height/2)-canvas.top;
        const ex=(mobile?box.left+box.width/2:right?box.left:box.right)-canvas.left,ey=(mobile?box.top:box.top+box.height/2)-canvas.top;
        const mid=mobile?sy+Math.min(32,(ey-sy)/2):(sx+ex)/2;
        return {id:team.id,ex,ey,d:mobile?`M${sx},${sy} C${sx},${mid} ${ex},${mid} ${ex},${ey}`:`M${sx},${sy} C${mid},${sy} ${mid},${ey} ${ex},${ey}`};
      });
      setGeometry({width:canvas.width,height:canvas.height,paths});
    }
    const observer=new ResizeObserver(()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(draw);});
    observer.observe(map); draw();
    return ()=>{observer.disconnect();cancelAnimationFrame(frame);};
  },[tasks,scope]);
  return <svg id="connections" className="connections" viewBox={`0 0 ${geometry.width} ${geometry.height}`} aria-hidden="true">{geometry.paths.map(path=>{
    const kinds=teams.find(t=>t.id===path.id).kinds,assigned=tasks.filter(t=>kinds.includes(t.kind));
    return <g key={path.id}><path d={path.d} className={`connection-base${assigned.some(hasIssue)?' connection-alert':''}`}/>{assigned.some(t=>t.status==='running')&&<path d={path.d} className="connection-live"/>}<circle cx={path.ex} cy={path.ey} r="3.5" className="connection-node"/></g>;
  })}</svg>;
}

export function Pipeline({tasks,onSelect}) {
  return [['queued','Chờ nhận','clock'],['running','Đang làm','play'],['awaiting_review','Chờ duyệt','file'],['done','Hoàn tất','check'],['issues','Vướng / lỗi','alert']].map(([status,label,glyph])=>{
    const count=tasks.filter(t=>status==='issues'?hasIssue(t):t.status===status).length;
    return <button key={status} className={`pipeline-step ${status==='issues'?'blocked':status}`} data-status={status} aria-label={`${label}: ${count} việc`} onClick={()=>onSelect(status)}><span className="step-icon"><Icon name={glyph}/></span><span>{label}</span><strong>{count}</strong></button>;
  });
}

export function TaskCard({task,onDetails,onBrief,onReminder,onRun,onMove,onResult}) {
  const role=agents[task.kind],step={queued:0,running:1,blocked:1,failed:1,awaiting_review:2,done:3,cancelled:-1}[task.status];
  return <article className="task" data-task-id={task.id}>
    <div className="task-heading"><div className="task-meta"><Icon name={role.icon}/><span>#{task.id} · {role.name}</span><span className={`priority p${task.priority}`}>P{task.priority}</span></div><span className={`status-badge ${task.status}`}><i className={`dot ${task.status}`}/><span>{statuses[task.status]}</span></span></div>
    <h3>{task.title}</h3><p className="task-objective">{task.objective}</p>
    <ol className={`task-progress ${task.status}`} aria-label={`Giai đoạn hiện tại: ${statuses[task.status]}`}>{['Chờ nhận','Đang làm','Chờ duyệt','Hoàn tất'].map((label,index)=><li key={label} className={`${index<=step?'reached':''} ${index===step?'current':''}`}>{label}</li>)}</ol>
    <div className="task-bottom"><span className={`due${isDue(task)?' overdue':''}`}><Icon name="clock"/><span>{task.due_at?`${time(task.due_at,true)} · UTC+7`:'Chưa đặt hạn'}</span></span><button className="text-button" onClick={()=>onDetails(task)}>Chi tiết &amp; lịch sử</button></div>
    <div className="actions">
      <button onClick={()=>onBrief(task)}>Bản giao việc</button>{task.due_at&&<button onClick={()=>onReminder(task)}>Nhắc qua ChatGPT</button>}
      {task.status==='queued'&&(task.kind==='powershell'?<button className="action-main" onClick={()=>onRun(task)}>Lệnh chạy</button>:<button className="action-main" onClick={()=>onMove(task,'running')}>Nhận việc</button>)}
      {task.status==='running'&&<><button className="action-main" onClick={()=>onResult(task)}>Nộp kết quả</button><button onClick={()=>{const reason=window.prompt('Thông tin hoặc điều kiện nào đang thiếu?');if(reason?.trim())onMove(task,'blocked',reason);}}>Báo vướng</button></>}
      {task.status==='awaiting_review'&&<><button className="action-main" onClick={()=>onMove(task,'done')}>Duyệt hoàn tất</button><button onClick={()=>onMove(task,'queued')}>Giao lại</button></>}
      {hasIssue(task)&&<button className="action-main" onClick={()=>onMove(task,'queued')}>Đưa lại vào hàng đợi</button>}
      {isOpen(task)&&<button onClick={()=>onMove(task,'cancelled')}>Hủy việc</button>}
    </div>
  </article>;
}

export function Dialog({id,titleId,onClose,children}) {
  const ref=useRef(null);
  useLayoutEffect(()=>{const dialog=ref.current;dialog.showModal();return ()=>dialog.close();},[]);
  return <dialog ref={ref} id={id} aria-labelledby={titleId} onCancel={event=>{event.preventDefault();onClose();}}>{children}</dialog>;
}
