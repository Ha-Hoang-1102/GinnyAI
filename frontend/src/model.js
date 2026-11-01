export const statuses = {queued:'Chờ nhận',running:'Đang làm',awaiting_review:'Chờ duyệt',blocked:'Đang vướng',failed:'Thất bại',done:'Hoàn tất',cancelled:'Đã hủy'};
export const agents = {
  powershell:{name:'Executor',label:'PowerShell',icon:'terminal'}, research:{name:'Researcher',label:'Nghiên cứu',icon:'search'},
  decision:{name:'Planner',label:'Quyết định',icon:'compass'}, reminder:{name:'Reminder',label:'Nhắc việc',icon:'clock'},
  article:{name:'Editor',label:'Bài viết',icon:'file'}, image:{name:'Designer',label:'Hình ảnh',icon:'image'},
};
export const teams = [
  {id:'execution',name:'Thực thi',icon:'terminal',kinds:['powershell']}, {id:'research',name:'Nghiên cứu',icon:'search',kinds:['research']},
  {id:'planning',name:'Điều phối',icon:'compass',kinds:['decision','reminder']}, {id:'creative',name:'Sáng tạo',icon:'spark',kinds:['article','image']},
];
export const stateOrder = {failed:0,blocked:1,running:2,awaiting_review:3,queued:4,done:5,cancelled:6};
export const isOpen = task => !['done','cancelled'].includes(task.status);
export const isDue = task => isOpen(task) && task.due_at && new Date(task.due_at) <= new Date();
export const hasIssue = task => ['blocked','failed'].includes(task.status);
export const time = (value,full=false) => new Date(value).toLocaleString('vi-VN',full?{timeZone:'Asia/Bangkok'}:{timeZone:'Asia/Bangkok',hour:'2-digit',minute:'2-digit'});
export async function api(path,data) {
  const response = await fetch(path,{signal:AbortSignal.timeout(10000),...(data===undefined?{}:{method:'POST',headers:{'Content-Type':'application/json','X-Ginny-Client':'local'},body:JSON.stringify(data)})});
  const value = await response.json();
  if (!response.ok) throw new Error(value.error || 'Không kết nối được dịch vụ.');
  return value;
}
