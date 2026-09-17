# Khảo sát nhu cầu điểm dừng học tập

## Phạm vi và chất lượng dữ liệu

- Nguồn: Google Forms do nhóm cung cấp, thu ngày 16/09/2026.
- Cỡ mẫu: **17 phản hồi**, không có ô trống và không có trường định danh cá nhân.
- Chuẩn hóa: bỏ dấu thời gian khỏi bản dùng trong repo; gán `response_id`; chuẩn hóa lỗi khoảng trắng trong “Thường xuyên” và mã hóa các lựa chọn thành nhãn nhất quán.
- Kiểm tra chất lượng: 17/17 dòng đầy đủ, không có bản ghi trùng toàn bộ 7 câu trả lời. Đây là mẫu thuận tiện nhỏ, chưa đại diện cho toàn bộ học viên AI20K và chưa đạt ngưỡng 20 người được guide khuyến nghị.

## Insight dùng cho slide và Business Model Canvas

| Insight | Số lượng | Tỷ lệ | Hàm ý sản phẩm |
|---|---:|---:|---|
| Từng gặp đoạn khó hoặc phải xem lại | 16/17 | 94,1% | Có pain thật trong lúc xem video |
| Thường xuyên/đôi lúc chỉ phát hiện chưa hiểu khi làm bài | 14/17 | 82,4% | Cần kiểm tra hiểu bài sớm, ngay sau khái niệm |
| Muốn thử điểm dừng tương tác | 16/17 | 94,1% | Giải pháp có mức chấp nhận ban đầu cao |
| Chỉ muốn thử nếu có thể bỏ qua | 8/17 | 47,1% | Nút bỏ qua là điều kiện thiết kế, không phải tính năng phụ |
| “Giải thích vì sao mình chọn” giúp biết hiểu thật nhất | 10/17 | 58,8% | AI phải chấm phần giải thích, không chỉ đáp án trắc nghiệm |
| Sẵn lòng/có thể sẵn lòng dùng thử | 15/17 | 88,2% | Có nhóm người dùng tiềm năng cho vòng validation |

## Phân bố chính

- Cách tự kiểm tra hiện tại: xem lại đoạn khó `7/17`; làm bài tập `5/17`; tự giải thích lại `3/17`; chỉ xem tiếp `2/17`.
- Thái độ với điểm dừng: muốn thử `8/17`; chỉ thử nếu bỏ qua được `8/17`; không muốn `1/17`.
- Hoạt động xác nhận hiểu bài: giải thích lý do `10/17`; flashcard rồi xem đáp án `3/17`; chọn đáp án `2/17`; tìm lỗi trong ví dụ `2/17`.
- Ý định dùng thử: có `10/17`; có thể `5/17`; không `2/17`.

## Câu trích dẫn có thể dùng trên slide

> “tốc độ chậm hơn để kiến thức k bị trôi” — R016

Giữ nguyên chính tả theo phản hồi gốc. Không nên dùng 15 câu “Không cần sửa” như bằng chứng rằng video hiện tại hoàn hảo; câu hỏi mở này có tín hiệu thấp và có thể chịu thiên lệch trả lời nhanh.

## Tệp dữ liệu

- `survey_normalized.csv`: 17 phản hồi đã chuẩn hóa, không chứa timestamp hay PII.
- File CSV gốc trong thư mục Downloads chỉ được đọc để xử lý và không được đưa vào repo.
