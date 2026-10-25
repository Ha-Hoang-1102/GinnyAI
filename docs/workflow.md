# Làm việc ít ngữ cảnh, kết quả kiểm chứng được

## Vòng làm việc

1. **Làm rõ:** mục tiêu, đầu ra, tiêu chí kiểm chứng, thời hạn, dữ liệu và giới hạn quyền. Nếu thiếu thông tin nhưng vẫn làm được phần độc lập, làm trước rồi hỏi gộp.
2. **Chọn vai trò:** Coordinator giao cho Executor/Researcher/Editor/Art director theo việc. Giai đoạn này là vai trò trong các cuộc chat do bạn điều khiển, chưa phải dịch vụ agent chạy nền.
3. **Giao:** sao chép brief một nhiệm vụ. Khi bám sát ngữ cảnh, tiếp tục đúng cuộc chat; khi chủ đề đã quá dài hoặc đổi hẳn, mở chat mới với bản tóm tắt và file liên quan.
4. **Làm và báo:** chỉ gửi thay đổi, bằng chứng quan trọng và câu hỏi đang chặn; không dán lại mọi log. File/ảnh dài lưu thành artifact và dẫn đường dẫn hoặc URL người dùng truy cập được.
5. **Duyệt:** tiêu chí nào đạt/chưa đạt, nguồn có kiểm chứng được không, có phát sinh chi phí hay hành động ngoài phạm vi không. Giao lại một yêu cầu sửa rõ nếu cần.

## Quy tắc tối ưu

- Công việc xác định được bằng chương trình (lọc, sắp xếp hạn, Git status) dùng chương trình. Dùng AI cho phân tích, quyết định và soạn thảo.
- Mặc định một lượt thực hiện và một lượt rà soát. Chỉ thêm vòng khi còn lỗi quan trọng; không yêu cầu nhiều tác nhân tranh luận cho mọi việc.
- Ngữ cảnh gồm mục tiêu, ràng buộc, nguồn cụ thể và quyết định đã chốt. Lịch sử đầy đủ ở nơi lưu trữ, không phải mặc định đưa vào prompt.
- Nghiên cứu bắt đầu với 3–5 nguồn sát câu hỏi; mở rộng khi có mâu thuẫn/chỗ thiếu. Dùng nguồn gốc và ngày cập nhật; không coi một đoạn tìm kiếm là bằng chứng đủ.
- Dùng mô hình nhẹ nếu công cụ/tài khoản cho phép và việc chỉ cần trích xuất; chuyển sang mô hình mạnh khi cần suy luận nhiều hoặc đang bế tắc. Không giả định có quyền chọn mô hình trên mọi ứng dụng.
- Không hứa tiết kiệm một tỷ lệ token cụ thể. Theo dõi số lượt, lượng ngữ cảnh gửi, số lần sửa và thời gian nhận được kết quả dùng được. Khi có API mới có thể đối chiếu token/cost thực tế.

## Cách phản biện hữu ích

Ginny nên chỉ ra giả định có thể làm sai kết quả, nói rõ bằng chứng và đề xuất 1–2 thay đổi cụ thể. Ví dụ: “Việc này chưa có độc giả; tôi tạm viết cho người mới, nếu là chuyên gia thì cần đổi mức chi tiết.” Không kéo dài công việc bằng câu hỏi tùy chọn không ảnh hưởng kết quả.

Trước khi thêm tự động hóa, đo xem thao tác thủ công nào lặp nhiều nhất. Nếu chỉ 1–2 việc/ngày, bảng + ChatGPT có thể đủ; nếu hàng chục việc có lịch và nguồn dữ liệu cố định, lúc đó đánh giá n8n/API.

## Bằng chứng theo loại việc

| Loại | Bằng chứng cần có |
|---|---|
| PowerShell | Máy đích, command ID, exit code, đầu ra cần thiết |
| Nghiên cứu | URL nguồn, ngày cập nhật/truy cập, điểm mâu thuẫn |
| Quyết định | Các phương án, tiêu chí, đánh đổi, điều kiện đổi quyết định |
| Nhắc việc | Thời gian/múi giờ và xác nhận đã tạo từ ChatGPT Tasks; thử thông báo thiết bị |
| Bài viết | Bản nháp, nguồn dữ kiện, độc giả/kênh, trạng thái chưa/đã xuất bản |
| Hình ảnh | File ảnh hoặc liên kết artifact thực sự; prompt chỉ là brief, không phải ảnh đã tạo |
