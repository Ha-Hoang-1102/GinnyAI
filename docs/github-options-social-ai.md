# Lựa chọn GitHub cho Ginny Social AI

Ngày đối chiếu: 31/10/2026. Mục tiêu: trợ lý cá nhân quản lý Facebook Pages, TikTok và YouTube; tìm chủ đề, sản xuất nội dung, lên lịch đăng và phân tích tăng trưởng. Đây là đánh giá tài liệu và thiết kế triển khai, chưa phải xác nhận các sản phẩm đã được cài hoặc kết nối vào tài khoản của người dùng.

## Kết luận lựa chọn

Chọn **OpenClaw** làm harness thử nghiệm đầu tiên: sát yêu cầu trợ lý cá nhân, có Control UI để chat/quản trị, nhiều agent, Telegram và Discord. Dùng **Postiz** cho quản lý kênh/lịch đăng/analytics. Giữ giao diện xanh **Ginny Control** và tiến tới adapter hiển thị sự kiện công việc thật từ harness; adapter này chưa được viết. Trước khi hợp nhất giao diện, dùng Control UI của OpenClaw cho chat và điều phối server.

**Deep Agents trên LangGraph** là phương án xây workflow tùy biến sau, nếu OpenClaw không đáp ứng yêu cầu kiểm soát nghiệp vụ; không cần triển khai cả hai harness cùng lúc. Chỉ bổ sung **LiteLLM** khi thật sự dùng nhiều API provider và cần routing/chi phí tập trung.

Từ danh sách trong bài, nên tuyển chọn **Firecrawl**, **planning-with-files**, **anthropics/skills**, **Playwright MCP** và **GitHub MCP** theo đúng vai trò. **Superpowers hoặc ECC** hỗ trợ phát triển phần mềm Ginny. Không cài cả bộ 30 repo vào runtime sản xuất: nhiều repo trùng chức năng, thuộc môi trường lập trình hoặc chỉ là danh mục tham khảo.

Nếu muốn một sản phẩm giao việc cho coding agent ngoài Ginny, **Multica** gần nhu cầu đó nhất trong bài. Tuy nhiên nó không thay thế bộ kết nối mạng xã hội và có giấy phép source-available với điều kiện bổ sung. Không cần dựng thêm Multica và Vibe Kanban cùng lúc chỉ để có thêm bảng công việc.

## Hiện trạng đã xác nhận

- Máy người dùng: Windows 11; mã nguồn, `.md` và dữ liệu dự án dưới `E:\GinnyAI`. Công cụ Windows dùng vị trí cài mặc định trên C.
- Server dự định: Ubuntu Server 24.04 LTS không GUI, 20 nhân CPU, 32 GB RAM, HDD 2 TB. Chưa kết nối với phiên làm việc; chưa xác minh Docker, mount ổ lưu trữ, GPU hay mạng. Người dùng chưa có domain; chọn Telegram trước, Discord sau.
- Khoản OpenAI 100 USD là **gói ChatGPT**, không phải ngân sách/credit API. Người dùng còn có gói Claude 20 USD. Không coi các khoản thuê bao này là credit OpenAI API/Anthropic API. Chưa có ngân sách API riêng được xác nhận.
- Ginny hiện tại: Python/SQLite, bảng điều phối và runner PowerShell; các agent trên sơ đồ là vai trò trong quy trình giao nhận thủ công. Chưa có scheduler/worker AI bền vững, kết nối tài khoản mạng xã hội hay API server có đăng nhập.

Tài liệu OpenClaw mô tả đường đăng nhập Codex subscription và Claude CLI bên cạnh API. Vì vậy **chưa có API budget không đồng nghĩa phải bỏ phương án harness**: thử runtime chính thức được tài khoản cấp quyền trước. Cần kiểm tra quyền gói, model, quota và cách tính phí thực tế; chưa đăng nhập/thử model bằng tài khoản người dùng. Không chuyển token/cookie ứng dụng thành API key và không hứa chạy AI không giới hạn. API tạo ảnh/video/embedding có thể cần quyền và phí riêng.

## Đối chiếu 30 mục trong bài

“Dùng” dưới đây là khuyến nghị, không có nghĩa đã cài. Các tính năng là theo README/tài liệu dự án; chưa chạy benchmark độc lập hoặc kiểm toán toàn bộ mã nguồn.

| Repo | Phù hợp với Ginny | Quyết định |
|---|---|---|
| [learn-claude-code](https://github.com/shareAI-lab/learn-claude-code) | Tài liệu học xây harness: tool loop, context, memory, cron, workflow resume | Tham khảo kiến trúc; không lấy ví dụ học tập làm hệ thống production hoàn chỉnh |
| [andrej-karpathy-skills](https://github.com/multica-ai/andrej-karpathy-skills) | Chỉ dẫn lập trình đơn giản, tập trung vào yêu cầu | Chọn nguyên tắc phù hợp cho agent phát triển |
| [superpowers](https://github.com/obra/superpowers) | Quy trình thiết kế, triển khai, kiểm tra cho coding agent | Chọn một bộ quy trình phát triển chính; không phải lịch đăng mạng xã hội |
| [ponytail](https://github.com/DietrichGebert/ponytail) | Quy trình coding, review và theo dõi công việc/chi phí của coding agent | Thử sau nếu cần; không mặc định tỷ lệ tiết kiệm trong README đúng với Ginny |
| [gstack](https://github.com/garrytan/gstack) | Vai trò kỹ thuật/sản phẩm/QA dưới dạng skills | Dùng chọn lọc khi phát triển; không chạy nguyên bộ cho mỗi bài viết |
| [ECC](https://github.com/affaan-m/ECC) | Hệ thống skills/rules/hooks cho coding agent, có nhiều nền tảng | Phương án thay Superpowers; tránh cài chồng toàn bộ hai bộ |
| [taste-skill](https://github.com/Leonxlnx/taste-skill) | Hướng dẫn thiết kế giao diện | Bổ trợ UI Ginny; không thay agent tạo ảnh/video |
| [anthropics/skills](https://github.com/anthropics/skills) | Mẫu skill tài liệu, sáng tạo, phân tích và workflow | Dùng chọn lọc, kiểm tra license từng skill; không tự động cấp công cụ hoặc quyền API |
| [wshobson/agents](https://github.com/wshobson/agents) | Bộ vai trò, skills và workflow chuyên môn | Tham khảo agent role; không khởi động mọi agent cho mọi việc |
| [claude-plugins-official](https://github.com/anthropics/claude-plugins-official) | Marketplace/plugin catalog cho Claude Code | Chọn plugin cụ thể khi cần; không phải một runtime 24/7 chung |
| [ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) | Quy trình thiết kế UI/UX | Có thể dùng khi cải tiến dashboard; tránh trùng taste-skill cùng nhiệm vụ |
| [awesome-claude-skills](https://github.com/ComposioHQ/awesome-claude-skills) | Danh mục skills và tích hợp, có lựa chọn dịch vụ Composio | Tra cứu; danh mục mở không làm mọi dịch vụ/kết nối trở thành miễn phí |
| [planning-with-files](https://github.com/OthmanAdi/planning-with-files) | Lưu kế hoạch, phát hiện và tiến độ bằng Markdown | Hợp chiến dịch nội dung dài; database vẫn là nguồn trạng thái job chính |
| [claude-mem](https://github.com/thedotmack/claude-mem) | Ghi nhớ/tìm lại ngữ cảnh các phiên coding agent | Hoãn; không dùng làm database bài viết, lịch đăng hoặc analytics |
| [codegraph](https://github.com/colbymchenry/codegraph) | Đồ thị/ngữ cảnh mã nguồn | Chỉ cần khi codebase lớn hơn; không phải đồ thị tăng trưởng page |
| [graphify](https://github.com/Graphify-Labs/graphify) | Đồ thị quan hệ code/tài liệu, có phần xử lý ngữ nghĩa qua model | Thử khi kho tài liệu đủ lớn; chưa cần cho bản đầu |
| [repomix](https://github.com/yamadashy/repomix) | Đóng gói phần repo và đếm token | Dùng chọn file để review; không gửi toàn bộ repo vào mỗi tác vụ nội dung |
| [multica](https://github.com/multica-ai/multica) | Workspace, daemon và giao việc cho coding agent, có self-host/API | Gần yêu cầu giám sát coding agent; tùy chọn riêng, không thay backend social |
| [firecrawl](https://github.com/firecrawl/firecrawl) | Lấy/trích xuất nội dung web, dịch vụ tìm kiếm theo cấu hình | Phù hợp nhóm nghiên cứu; bắt đầu RSS/nguồn chọn lọc trước, thêm khi cần |
| [cc-switch](https://github.com/farion1231/cc-switch) | Ứng dụng desktop quản lý cấu hình provider/MCP/skills | Có thể dùng trên Windows; không chọn làm dịch vụ trung tâm Ubuntu headless |
| [vibe-kanban](https://github.com/BloopAI/vibe-kanban) | Quản lý issue, workspace và coding agent, có self-host | Công cụ phát triển; hoãn vì Ginny đã có bảng điều phối riêng |
| [github-mcp-server](https://github.com/github/github-mcp-server) | Công cụ GitHub chính thức | Hợp nhóm phát triển: repo/issues/PR; không cấp cho nhóm đăng bài nếu không cần |
| [playwright-mcp](https://github.com/microsoft/playwright-mcp) | Agent thao tác trình duyệt | Hợp kiểm thử UI, xác minh bản xem trước; không làm đường đăng bài chính thay API/OAuth |
| [claude-code-router](https://github.com/musistudio/claude-code-router) | Gateway/router và quản lý provider cho các coding client | Hợp lớp công cụ coding; so sánh LiteLLM khi thiết kế gateway của ứng dụng Ginny |
| [awesome-mcp-servers](https://github.com/punkpeye/awesome-mcp-servers) | Danh mục MCP | Tra cứu phần cần dùng; không phải chứng nhận chất lượng/an toàn của mọi server |
| system-prompts-ai | Link trong bài chứa `github.com/.../`, chưa xác định repo | Chưa đánh giá; không dùng prompt sưu tầm làm bộ não production |
| [claude-code-best-practice](https://github.com/shanraisshan/claude-code-best-practice) | Tài liệu thực hành Claude Code | Tham khảo quy trình phát triển; không phải bộ đo/hạn chế chi phí runtime |
| [codex-plugin-cc](https://github.com/openai/codex-plugin-cc) | Đưa Codex vào quy trình Claude Code | Tùy chọn cho coding/review; không tự biến hai thuê bao thành API gateway |
| [claude-hud](https://github.com/jarrodwatts/claude-hud) | Status line của Claude Code, có chỉ số session/cost | Hợp terminal lập trình; không thay ledger chi phí toàn hệ thống |
| [caveman](https://github.com/JuliusBrussee/caveman) | Quy tắc rút gọn và công cụ tối ưu theo tài liệu repo | Thử có đo lường cho tác vụ nội bộ; không áp dụng cách viết cụt cho nội dung xuất bản tiếng Việt |

## Các repo bổ sung sát mục tiêu hơn

| Thành phần | Chọn dùng khi nào | Giới hạn cần biết |
|---|---|---|
| [OpenClaw](https://github.com/openclaw/openclaw) | Lựa chọn harness đầu: Control UI, chat, agent routing/subagents, Telegram, Discord, cron | Cần cấu hình auth, quyền tools, tài khoản model và persistence; chưa có sẵn adapter nghiệp vụ Ginny/Postiz. Có cron không chứng minh mọi tác vụ đang chạy phục hồi được sau mất điện |
| [Postiz](https://github.com/gitroomhq/postiz-app) | Ưu tiên đầu: kênh, lịch đăng, API/webhook và analytics | Self-host phải tự cấu hình developer app/OAuth/quyền nền tảng; không chỉ nhập LLM key là đăng được |
| [Deep Agents](https://github.com/langchain-ai/deepagents) | Phương án thay thế khi cần tự xây harness/workflow: lập kế hoạch, sub-agent, quản lý ngữ cảnh, tools, phê duyệt | Cần tích hợp tool, sandbox, dịch vụ chạy nền và UI; không tự có connector cho mọi mạng xã hội |
| [LangGraph](https://github.com/langchain-ai/langgraph) | Runtime cho trạng thái, checkpoint, pause/resume; nằm dưới Deep Agents | Cần cấu hình persistence/worker/scheduler; một lần gọi graph không tạo ra dịch vụ 24/7 |
| [Hermes Agent](https://github.com/NousResearch/hermes-agent) | Phương án trợ lý đa kênh, memory và lịch nền | Có khả năng phù hợp nhưng chưa chạy thử; không triển khai thêm cạnh OpenClaw chỉ để trùng tính năng |
| [nanobot](https://github.com/HKUDS/nanobot) | Phương án nhẹ, Python, có chat/web UI/cron | Tài liệu nêu giới hạn phục hồi subagent/lịch khi gián đoạn; cần kiểm chứng độ bền trước dùng cho xuất bản |
| [LiteLLM](https://github.com/BerriAI/litellm) | Khi có nhiều provider, cần routing/fallback, key và theo dõi chi phí tập trung | Đối chiếu tính năng OSS/enterprise; fallback không được vượt ngân sách/cấp chất lượng đã chọn |
| [n8n](https://github.com/n8n-io/n8n) | Phương án workflow trực quan, hoặc bổ sung khi cần nhiều tích hợp sự kiện | Không cần triển khai đồng thời mọi scheduler; license Sustainable Use, không gọi là OSS không hạn chế |
| [Langfuse](https://github.com/langfuse/langfuse) | Giai đoạn sau khi cần trace/evaluation nhiều luồng | Có thêm dịch vụ và dung lượng; bản đầu có thể dùng log có cấu trúc + ledger chi phí |

**Bản đầu gọn:** OpenClaw + Telegram; thử đăng nhập Codex chính thức với gói hiện có và một tác vụ nhỏ. Bổ sung Postiz cùng stack production chính thức khi domain/OAuth sẵn sàng. Giữ Ginny Control hiện tại dùng được trong thời gian xây adapter. Không bắt buộc dựng LiteLLM, n8n và Langfuse cùng ngày.

## Những khẳng định trong bài cần điều chỉnh

1. Harness không chỉ là “suy nghĩ trước khi code”. Runtime cần quản lý vòng gọi tool, trạng thái, quyền, lỗi, retry, dừng/tiếp tục và đo chi phí. Skills chỉ là một thành phần của runtime.
2. “Miễn phí/mã nguồn mở” không có nghĩa mọi repo cùng license hoặc vận hành không tốn tiền. [Multica LICENSE](https://github.com/multica-ai/multica/blob/main/LICENSE) thêm điều kiện trên Apache; [anthropics/skills README](https://github.com/anthropics/skills) nói rõ một số document skills là source-available. [LiteLLM LICENSE](https://github.com/BerriAI/litellm/blob/main/LICENSE) tách thư mục enterprise. Firecrawl/Postiz còn có bản cloud tính phí và chi phí hạ tầng/API.
3. Giảm token không tự bảo đảm giảm tổng chi phí: lượt gọi lại, tìm kiếm, tạo ảnh/video, lỗi đăng bài và thời gian xử lý đều cần đo. Không chuyển tỷ lệ tiết kiệm do repo tự công bố thành cam kết cho Ginny.

## Phạm vi đối chiếu nguồn

Đã truy xuất README của 29 link GitHub hợp lệ trong bài và đọc các mô tả/phần liên quan; danh mục `awesome-mcp-servers` rất dài nên chỉ xem phần đầu, không kiểm tra mọi mục. Link `system-prompts-ai` thiếu owner/repo. Đã đọc thêm LICENSE của một số lựa chọn chính, hướng dẫn self-host của Multica, nguồn tài liệu Postiz và code provider Facebook/TikTok/YouTube của Postiz. Không tuyên bố đã chạy thử 29 sản phẩm.

Nguồn Postiz cho triển khai: [Docker Compose docs trong repo chính thức](https://github.com/gitroomhq/postiz-docs/blob/main/self-host/installation/docker-compose.mdx), [compose triển khai](https://github.com/gitroomhq/postiz-docker-compose), [Facebook provider](https://github.com/gitroomhq/postiz-app/blob/main/libraries/nestjs-libraries/src/integrations/social/facebook.provider.ts), [TikTok provider](https://github.com/gitroomhq/postiz-app/blob/main/libraries/nestjs-libraries/src/integrations/social/tiktok.provider.ts), [YouTube provider](https://github.com/gitroomhq/postiz-app/blob/main/libraries/nestjs-libraries/src/integrations/social/youtube.provider.ts).

Các website tài liệu OpenAI/Anthropic/Meta/TikTok/Google và docs.postiz.com bị proxy của môi trường hiện tại chặn khi truy cập. Vì vậy chưa xác minh trực tiếp chính sách/quota/phí hiện hành trên những trang đó; trước triển khai cần kiểm tra lại dashboard và tài liệu chính thức bằng kết nối có quyền truy cập. Số liệu/khả năng từ repo ở trên là bằng chứng tài liệu, không phải quyền thực tế đã cấp cho tài khoản của người dùng.

Nguồn bổ sung đã đọc: OpenClaw [OpenAI runtime](https://github.com/openclaw/openclaw/blob/v2026.10.9/docs/providers/openai.md), [Anthropic](https://github.com/openclaw/openclaw/blob/v2026.10.9/docs/providers/anthropic.md), [Control UI](https://github.com/openclaw/openclaw/blob/v2026.10.9/docs/web/control-ui.md), [Telegram](https://github.com/openclaw/openclaw/blob/v2026.10.9/docs/channels/telegram.md), [Docker](https://github.com/openclaw/openclaw/blob/v2026.10.9/docs/install/docker.md). Những mô tả về thuê bao là từ tài liệu OpenClaw, chưa phải kết quả xác minh quyền tài khoản của người dùng.

Xem [thiết kế server và kế hoạch triển khai](server-24x7-plan.md) cho bước tiếp theo.
