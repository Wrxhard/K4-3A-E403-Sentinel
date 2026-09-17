# Khảo sát nhu cầu điểm dừng học tập

## Phạm vi và chất lượng dữ liệu

- Nguồn: Google Forms do nhóm cung cấp, thu thập ngày 16–17/09/2026.
- Cỡ mẫu: **20 phản hồi**, không có ô trống và không có trường định danh cá nhân trong bản lưu repo.
- Chuẩn hóa: bỏ dấu thời gian khỏi bản dùng trong repo; gán `response_id`; chuẩn hóa lỗi khoảng trắng trong “Thường xuyên” và mã hóa các lựa chọn thành nhãn nhất quán.
- Kiểm tra chất lượng: 20/20 dòng đầy đủ, không có bản ghi trùng toàn bộ 7 câu trả lời. Bộ dữ liệu đã **đạt ngưỡng ≥ 20 người** theo khuyến nghị của guide.

## Insight dùng cho slide và Business Model Canvas

| Insight | Số lượng | Tỷ lệ | Hàm ý sản phẩm |
|---|---:|---:|---|
| Từng gặp đoạn khó hoặc phải xem lại | 19/20 | 95,0% | Có pain thật trong lúc xem video |
| Thường xuyên/đôi lúc chỉ phát hiện chưa hiểu khi làm bài | 16/20 | 80,0% | Cần kiểm tra hiểu bài sớm, ngay sau khái niệm |
| Muốn thử điểm dừng tương tác | 19/20 | 95,0% | Giải pháp có mức chấp nhận ban đầu rất cao |
| Chỉ muốn thử nếu có thể bỏ qua | 10/20 | 50,0% | Nút bỏ qua là điều kiện thiết kế bắt buộc, không phải phụ |
| “Giải thích vì sao mình chọn” giúp biết hiểu thật nhất | 11/20 | 55,0% | AI phải chấm phần giải thích, không chỉ đáp án trắc nghiệm |
| Sẵn lòng/có thể sẵn lòng dùng thử | 17/20 | 85,0% | Nhóm người dùng tiềm năng sẵn sàng cho vòng validation |

## Phân bố chính

- Cách tự kiểm tra hiện tại: xem lại đoạn khó `7/20` (35,0%); làm bài tập `6/20` (30,0%); tự giải thích lại `5/20` (25,0%); chỉ xem tiếp `2/20` (10,0%).
- Thái độ với điểm dừng: chỉ thử nếu bỏ qua được `10/20` (50,0%); muốn thử `9/20` (45,0%); không muốn `1/20` (5,0%).
- Hoạt động xác nhận hiểu bài: giải thích lý do `11/20` (55,0%); chọn đáp án `3/20` (15,0%); flashcard rồi xem đáp án `3/20` (15,0%); tìm lỗi trong ví dụ `3/20` (15,0%).
- Ý định dùng thử: có `10/20` (50,0%); có thể `7/20` (35,0%); không `3/20` (15,0%).

## Câu trích dẫn có thể dùng trên slide

> “tốc độ chậm hơn để kiến thức k bị trôi” — R016

Giữ nguyên chính tả theo phản hồi gốc. 18 câu “Không cần sửa” và 1 câu “Idk” cho thấy câu hỏi mở này có tín hiệu thấp và có thể chịu thiên lệch trả lời nhanh.

## Tệp dữ liệu

- `survey_normalized.csv`: 20 phản hồi đã chuẩn hóa, không chứa timestamp hay PII.
- File CSV gốc chỉ được đọc để xử lý và không được đưa vào repo.
