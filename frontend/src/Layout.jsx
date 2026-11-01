export default function Layout({vm,actions,slots}) {
  return <>
<svg className="icon-library" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <symbol id="i-network" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><circle cx="5" cy="5" r="2"/><circle cx="19" cy="5" r="2"/><circle cx="5" cy="19" r="2"/><circle cx="19" cy="19" r="2"/><path d="m6.5 6.5 3.3 3.3m4.4 4.4 3.3 3.3m0-11-3.3 3.3m-4.4 4.4-3.3 3.3"/></symbol>
  <symbol id="i-grid" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></symbol>
  <symbol id="i-list" viewBox="0 0 24 24"><path d="m3 6 1 1 2-2m-3 7 1 1 2-2m-3 7 1 1 2-2M10 6h11M10 12h11M10 18h11"/></symbol>
  <symbol id="i-terminal" viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="3"/><path d="m6 9 3 3-3 3m7 0h5"/></symbol>
  <symbol id="i-search" viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></symbol>
  <symbol id="i-compass" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="m16 8-2 6-6 2 2-6Z"/></symbol>
  <symbol id="i-spark" viewBox="0 0 24 24"><path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z"/></symbol>
  <symbol id="i-clock" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></symbol>
  <symbol id="i-file" viewBox="0 0 24 24"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9ZM14 3v6h6M8 13h8m-8 4h5"/></symbol>
  <symbol id="i-image" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="1"/><path d="m3 17 5-5 4 4 3-7 6 8"/></symbol>
  <symbol id="i-plus" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></symbol>
  <symbol id="i-refresh" viewBox="0 0 24 24"><path d="M20 7v5h-5M4 17v-5h5m10-4a8 8 0 0 0-14-2m0 10a8 8 0 0 0 14 2"/></symbol>
  <symbol id="i-check" viewBox="0 0 24 24"><path d="m5 12 4 4L19 6"/></symbol>
  <symbol id="i-arrow" viewBox="0 0 24 24"><path d="M5 12h14m-5-5 5 5-5 5"/></symbol>
  <symbol id="i-close" viewBox="0 0 24 24"><path d="m6 6 12 12M6 18 18 6"/></symbol>
  <symbol id="i-alert" viewBox="0 0 24 24"><path d="m10 4-8 14a2 2 0 0 0 2 3h16a2 2 0 0 0 2-3L14 4a2.3 2.3 0 0 0-4 0ZM12 9v4m0 3v1"/></symbol>
  <symbol id="i-play" viewBox="0 0 24 24"><path d="m8 4 12 8-12 8Z"/></symbol>
</svg>
<aside className="sidebar">
  <a className="brand" href="#network"><span className="brand-mark"><svg className="icon"><use href="#i-network"/></svg></span><span>ginny<span className="brand-ai">AI</span><small>CONTROL CENTER</small></span></a>
  <span className="nav-label">KHÔNG GIAN LÀM VIỆC</span>
  <nav aria-label="Điều hướng chính">
    <a className="nav-link" href="#network" aria-label="Điều phối AI"><svg className="icon"><use href="#i-network"/></svg>Điều phối AI</a>
    <a className="nav-link" href="#work" aria-label="Công việc"><svg className="icon"><use href="#i-list"/></svg>Công việc<span id="nav-count" className="nav-count">{vm.active.length}</span></a>
    <button className="nav-link" id="report" onClick={actions.report} aria-label="Báo cáo tổng hợp"><svg className="icon"><use href="#i-file"/></svg>Báo cáo tổng hợp</button>
  </nav>
  <div className="sidebar-teams"><span className="nav-label">CÁC NHÓM AI</span><div id="team-nav">{slots.teamNav}</div></div>
  <div className="sidebar-note"><svg className="icon"><use href="#i-compass"/></svg><strong>Bạn giữ quyền điều phối</strong><p>Giao việc qua ChatGPT/Codex.<br />Duyệt kết quả tại một nơi.</p><span className="mode-label">Chế độ thủ công</span></div>
  <div className="sidebar-footer"><span className="avatar">G</span><div>Không gian cá nhân<small>Giờ hiển thị UTC+07:00</small></div></div>
</aside>
<div className="app-shell">
  <header className="topbar"><div className="breadcrumb"><svg className="icon"><use href="#i-grid"/></svg><span>Không gian làm việc</span><span className="separator">/</span><strong>Điều phối AI</strong></div><div className="topbar-actions"><span id="sync-state" className={`sync-state ${vm.sync}`} role="status">{vm.syncText}</span><button id="refresh" onClick={actions.refresh} className="icon-button" aria-label="Tải lại dữ liệu"><svg className="icon"><use href="#i-refresh"/></svg></button><button id="mobile-report" onClick={actions.report} className="icon-button mobile-report" aria-label="Báo cáo tổng hợp"><svg className="icon"><use href="#i-file"/></svg></button><span className="avatar">G</span></div></header>
  <main>
    <section className="page-heading"><div><p className="eyebrow">GINNY WORKSPACE</p><h1>Trung tâm điều phối</h1><p>Một góc nhìn xuyên suốt, từ giao việc đến kết quả.</p></div><button id="new-task" onClick={actions.create} className="primary" aria-label="Giao việc mới"><svg className="icon"><use href="#i-plus"/></svg>Giao việc mới</button></section>
    <div id="message" className="message" role="status" hidden={!vm.message}>{vm.message}</div>
    <section className="overview" aria-label="Tổng quan công việc">
      <div className="metric"><span className="metric-icon blue"><svg className="icon"><use href="#i-list"/></svg></span><div><span>Việc đang mở</span><strong id="active">{vm.active.length}</strong></div><small id="total-label">{`${vm.total} việc đã tạo`}</small></div>
      <div className="metric"><span className="metric-icon cyan"><svg className="icon"><use href="#i-play"/></svg></span><div><span>Đang xử lý</span><strong id="running">{vm.running}</strong></div><small>Đã nhận thực hiện</small></div>
      <div className="metric"><span className="metric-icon violet"><svg className="icon"><use href="#i-check"/></svg></span><div><span>Chờ bạn duyệt</span><strong id="review">{vm.review}</strong></div><small>Đã nộp kết quả</small></div>
      <div className="metric"><span className="metric-icon amber"><svg className="icon"><use href="#i-alert"/></svg></span><div><span>Cần chú ý</span><strong id="attention">{vm.attention}</strong></div><small id="attention-note">{vm.attentionNote}</small></div>
    </section>
    <div className="command-layout">
      <section className="network-panel" id="network" aria-labelledby="network-title">
        <div className="section-heading"><div><h2 id="network-title"><span className="section-dot"></span>Mạng lưới điều phối</h2><p>Chọn nhóm hoặc agent để xem nhiệm vụ.</p></div><span className="subtle-label">4 nhóm · 6 vai trò</span></div>
        <div className="network-map" id="network-map">
          {slots.connections}
          <div id="hub" className="hub"><div className="hub-orbit orbit-one"></div><div className="hub-orbit orbit-two"></div><button id="hub-button" onClick={()=>actions.scope("all","all",true)} className="hub-core" aria-label="Ginny AI · Xem tất cả công việc"><span className="hub-symbol"><svg className="icon"><use href="#i-network"/></svg></span><strong>GINNY<span>AI</span></strong><span className="hub-caption">TRUNG TÂM ĐIỀU PHỐI</span><span id="hub-status" className="hub-status">{vm.hubStatus}</span></button><span className="hub-footnote">Giao việc · Theo dõi · Duyệt</span></div>
          <div id="team-execution" className="team-slot slot-execution">{slots.teams.execution}</div><div id="team-research" className="team-slot slot-research">{slots.teams.research}</div><div id="team-planning" className="team-slot slot-planning">{slots.teams.planning}</div><div id="team-creative" className="team-slot slot-creative">{slots.teams.creative}</div>
        </div>
        <div className="network-legend" aria-label="Chú giải trạng thái"><span><i className="dot queued"></i>Chờ nhận</span><span><i className="dot running"></i>Đang làm</span><span><i className="dot awaiting_review"></i>Chờ duyệt</span><span><i className="dot blocked"></i>Vướng / lỗi</span><span><i className="dot done"></i>Hoàn tất</span></div>
        <p className="network-note">Agent thể hiện vai trò được giao; trạng thái lấy từ công việc đã ghi nhận.</p>
      </section>
      <aside className="flow-panel" aria-labelledby="flow-title"><div className="section-heading"><h2 id="flow-title">Dòng công việc</h2><svg className="icon"><use href="#i-list"/></svg></div><div id="pipeline" className="pipeline">{slots.pipeline}</div><div className="completion"><div className="completion-chart"><svg viewBox="0 0 100 100" aria-hidden="true"><circle className="ring-track" cx="50" cy="50" r="40"/><circle id="completion-ring" className="ring-value" cx="50" cy="50" r="40" pathLength="100" strokeDasharray={`${vm.ratio} ${100-vm.ratio}`}/></svg><strong id="completion-percent">{vm.completionPercent}</strong></div><strong>Đã hoàn tất</strong><p id="completion-caption">{vm.completionCaption}</p></div><p className="flow-note">Tỷ lệ theo số việc hoàn tất.<br />Không tính việc đã hủy.</p></aside>
    </div>
    <section id="work" className="work-section" aria-labelledby="work-title"><div className="section-heading"><div><p className="eyebrow">TỪ ĐIỀU PHỐI ĐẾN THỰC THI</p><h2 id="work-title">Công việc của các agent <span id="visible-count" className="count-badge">{vm.visibleCount}</span></h2></div><button id="clear-filter" onClick={()=>actions.scope()} className="text-button">Xem tất cả</button></div>
      <div className="filters"><div className="search-field"><svg className="icon"><use href="#i-search"/></svg><input value={vm.filters.query} onChange={e=>actions.filter({query:e.target.value})} id="search" type="search" placeholder="Tìm tên, mục tiêu hoặc mã việc…" aria-label="Tìm công việc" /></div><select value={vm.filters.kind} onChange={e=>actions.filter({kind:e.target.value,team:"all"})} id="kind-filter" aria-label="Lọc theo agent"><option value="all">Tất cả agent</option><option value="powershell">Executor · PowerShell</option><option value="research">Researcher · Nghiên cứu</option><option value="decision">Planner · Quyết định</option><option value="reminder">Reminder · Nhắc việc</option><option value="article">Editor · Bài viết</option><option value="image">Designer · Hình ảnh</option></select><select value={vm.filters.status} onChange={e=>actions.filter({status:e.target.value})} id="status-filter" aria-label="Lọc trạng thái"><option value="all">Mọi trạng thái</option><option value="queued">Chờ nhận</option><option value="running">Đang làm</option><option value="awaiting_review">Chờ duyệt</option><option value="blocked">Đang vướng</option><option value="failed">Thất bại</option><option value="done">Hoàn tất</option><option value="cancelled">Đã hủy</option><option value="issues">Vướng / lỗi</option></select></div>
      <p id="filter-caption" className="filter-caption">{vm.filterCaption}</p><div id="tasks" className="tasks-grid">{slots.tasks}</div>
    </section>
    <footer><span>GINNY AI <span className="footer-divider">/</span> Không gian điều phối của bạn</span><span>Nhắc qua ChatGPT Tasks cần xác nhận riêng.</span></footer>
  </main>
</div>

</>;
}
