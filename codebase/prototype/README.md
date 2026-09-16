# VLearn · Điểm dừng học tập

Mock prototype dựa trên ảnh FE và Business_Canvas.md. Dùng Superpowers để ghi thiết kế, kế hoạch và xác minh kết quả.

## Chạy

Node.js 22+. Trong thư mục `prototype`:

```powershell
npm.cmd install
npm.cmd run dev -- --host 127.0.0.1 --port 4173 --strictPort
```

Mở http://127.0.0.1:4173/.

## Kịch bản demo 2 phút

1. Nhấn Play. Bắt đầu tại 0:35; đến 0:48 tự dừng và mở quiz Attention.
2. Chọn A, kiểm tra: nhận gợi ý. Chọn B và chưa nhập lý do: được nhắc bổ sung.
3. Nhập lý do, kiểm tra: nhận lời giải, nguồn transcript, flashcard và điểm. Đúng ngay lần đầu nhận 30 XP; đúng sau gợi ý nhận 20 XP.
4. Thông điệp so sánh tích cực xuất hiện sau câu đúng. Tỷ lệ được tính từ số lượt tham gia và số câu đúng lần đầu; prototype đang dùng các số đếm mẫu.
5. Tiếp tục video để mở BXH tỷ lệ đúng lần đầu; tab Thẻ vẫn cho phép lật flashcard và chọn Đã hiểu hoặc Cần ôn lại.
6. Nhấn checkpoint 2 trên timeline rồi Bỏ qua; playback tiếp tục, checkpoint được đánh dấu đã bỏ qua.
7. Có thể mở lại checkpoint. Hoàn thành lại không thêm thẻ hay XP trùng.
8. Nút Làm lại demo xóa tiến trình trong phiên hiện tại.

## Phạm vi mô phỏng

- Chưa có video hay transcript-06 thật được cung cấp. Player phát timeline/slide mô phỏng, không có âm thanh.
- `src/lesson.js` chứa transcript và quiz mẫu; các đoạn kết thúc khái niệm có `boundary: true`.
- `detectCheckpoints` đọc mốc kết thúc của các đoạn đã đánh dấu. Chưa có AI tự suy luận ranh giới hoặc sinh câu hỏi từ transcript bất kỳ.
- Đáp án và gợi ý có sẵn. Lý do cần được nhập nhưng chưa được chấm ngữ nghĩa; giao diện yêu cầu tự đối chiếu lời giải mẫu.
- Không có backend, tài khoản, gửi dữ liệu hoặc lưu tiến trình sau reload. Chỉ bài Attention có nội dung demo.
- XP đo sự tham gia, không khẳng định mức độ hiểu bài.
- BXH và tên người học là dữ liệu minh họa; tỷ lệ không gắn cứng mà được tính từ `firstTryCorrect / answered`. Prototype yêu cầu tối thiểu 3 câu trước khi xếp hạng chính thức.

## Kiểm tra

```powershell
node --test tests/learning.test.mjs
npm.cmd run build
npm.cmd run test:sites
```

Các mốc mẫu: Attention 0:48, Query/Key/Value 1:36, Self-attention 2:18. UI dùng React, CSS và icon Phosphor, có bố cục desktop/mobile.
