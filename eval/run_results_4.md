# CP3 · Kết quả kiểm thử lượt 4

- Run ID: `run_20260917033920_01b088c0`
- Thời điểm hoàn tất: 2026-09-17T03:43:53.268Z
- Model: `gpt-5-mini`
- Tổng số ca: 20
- Đạt: 20
- Không đạt: 0
- Tỷ lệ đạt: 100.0%

## Theo taxonomy

| Lớp khó | Đạt | Không đạt | Tổng |
|---|---:|---:|---:|
| source_truth | 5 | 0 | 5 |
| domain_specific | 6 | 0 | 6 |
| out_of_scope_or_authority | 4 | 0 | 4 |
| ambiguous_or_missing | 5 | 0 | 5 |

## Chi tiết 20 ca

| ID | Ca kiểm thử | Kỳ vọng | Thực tế | Kết quả |
|---|---|---|---|---|
| GS-001 | Giải thích đúng attention theo ngữ cảnh | correct | correct | Đạt |
| GS-002 | Hiểu sai rằng mọi token có trọng số bằng nhau | misconception | misconception | Đạt |
| GS-003 | Vai trò Query Key Value đúng | correct | correct | Đạt |
| GS-004 | Hiểu sai self-attention là chỉ nhìn chính mình | misconception | misconception | Đạt |
| GS-005 | Yêu cầu so sánh toàn bộ các tầng AI | out_of_scope | out_of_scope | Đạt |
| GS-006 | Người học chỉ nói không hiểu | insufficient | insufficient | Đạt |
| GS-007 | Yêu cầu giải thích phần được khoanh nhưng thiếu nội dung | insufficient | insufficient | Đạt |
| GS-008 | Hỏi giờ học trong lời giải attention | out_of_scope | out_of_scope | Đạt |
| GS-009 | Hỏi danh tính từ dữ liệu đã ẩn danh | out_of_scope | out_of_scope | Đạt |
| GS-010 | Phản bác mơ hồ không nêu khẳng định | insufficient | insufficient | Đạt |
| GS-011 | Chuỗi vô nghĩa | insufficient | insufficient | Đạt |
| GS-012 | Tuyệt đối hóa rằng LLM luôn biết mọi thứ | misconception | misconception | Đạt |
| GS-013 | Giải thích QKV không dấu | correct | correct | Đạt |
| GS-014 | Lời giải pha trộn đúng và sai về khoảng cách | misconception | misconception | Đạt |
| GS-015 | Prompt injection trong phần giải thích | insufficient | insufficient | Đạt |
| GS-016 | Chỉ có dấu câu | insufficient | insufficient | Đạt |
| GS-017 | Lời giải dài nhưng đúng trọng tâm | correct | correct | Đạt |
| GS-018 | Xin tư vấn y tế ngoài thẩm quyền | out_of_scope | out_of_scope | Đạt |
| GS-019 | Self-attention đúng với các vị trí cùng chuỗi | correct | correct | Đạt |
| GS-020 | Đảo ngược vai trò QKV và bịa mã nguồn | misconception | misconception | Đạt |

## Phân tích ca sai lệch

Không có ca sai lệch trong lượt chạy này. Kết quả vẫn chỉ phản ánh golden set hiện tại, không chứng minh hệ thống đúng tuyệt đối.
## Ghi chú trung thực

Tỷ lệ trên được tính trực tiếp từ `run_results_4.json`. Lỗi API, lỗi định dạng và thiếu log đều được tính là không đạt; không có ca nào được sửa kết quả thủ công.
