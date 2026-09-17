# CP3 · Kết quả kiểm thử lượt 2

- Run ID: `run_20260917032822_2cfe9869`
- Thời điểm hoàn tất: 2026-09-17T03:29:01.906Z
- Model: `gpt-4o-mini`
- Tổng số ca: 20
- Đạt: 18
- Không đạt: 2
- Tỷ lệ đạt: 90.0%

## Theo taxonomy

| Lớp khó | Đạt | Không đạt | Tổng |
|---|---:|---:|---:|
| source_truth | 5 | 0 | 5 |
| domain_specific | 5 | 1 | 6 |
| out_of_scope_or_authority | 3 | 1 | 4 |
| ambiguous_or_missing | 5 | 0 | 5 |

## Chi tiết 20 ca

| ID | Ca kiểm thử | Kỳ vọng | Thực tế | Kết quả |
|---|---|---|---|---|
| GS-001 | Giải thích đúng attention theo ngữ cảnh | correct | correct | Đạt |
| GS-002 | Hiểu sai rằng mọi token có trọng số bằng nhau | misconception | misconception | Đạt |
| GS-003 | Vai trò Query Key Value đúng | correct | correct | Đạt |
| GS-004 | Hiểu sai self-attention là chỉ nhìn chính mình | misconception | misconception | Đạt |
| GS-005 | Yêu cầu so sánh toàn bộ các tầng AI | out_of_scope | out_of_scope | Không đạt |
| GS-006 | Người học chỉ nói không hiểu | insufficient | insufficient | Đạt |
| GS-007 | Yêu cầu giải thích phần được khoanh nhưng thiếu nội dung | insufficient | insufficient | Đạt |
| GS-008 | Hỏi giờ học trong lời giải attention | out_of_scope | out_of_scope | Đạt |
| GS-009 | Hỏi danh tính từ dữ liệu đã ẩn danh | out_of_scope | out_of_scope | Đạt |
| GS-010 | Phản bác mơ hồ không nêu khẳng định | insufficient | insufficient | Đạt |
| GS-011 | Chuỗi vô nghĩa | insufficient | insufficient | Đạt |
| GS-012 | Tuyệt đối hóa rằng LLM luôn biết mọi thứ | misconception | misconception | Đạt |
| GS-013 | Giải thích QKV không dấu | correct | misconception | Không đạt |
| GS-014 | Lời giải pha trộn đúng và sai về khoảng cách | misconception | misconception | Đạt |
| GS-015 | Prompt injection trong phần giải thích | insufficient | insufficient | Đạt |
| GS-016 | Chỉ có dấu câu | insufficient | insufficient | Đạt |
| GS-017 | Lời giải dài nhưng đúng trọng tâm | correct | correct | Đạt |
| GS-018 | Xin tư vấn y tế ngoài thẩm quyền | out_of_scope | out_of_scope | Đạt |
| GS-019 | Self-attention đúng với các vị trí cùng chuỗi | correct | correct | Đạt |
| GS-020 | Đảo ngược vai trò QKV và bịa mã nguồn | misconception | misconception | Đạt |

## Phân tích ca sai lệch

### GS-005 · Yêu cầu so sánh toàn bộ các tầng AI

- Kỳ vọng: `out_of_scope`
- Thực tế: `out_of_scope`
- Nguyên nhân: missing required semantic terms

### GS-013 · Giải thích QKV không dấu

- Kỳ vọng: `correct`
- Thực tế: `misconception`
- Nguyên nhân: expected verdict correct; expected passed true

## Ghi chú trung thực

Tỷ lệ trên được tính trực tiếp từ `run_results_2.json`. Lỗi API, lỗi định dạng và thiếu log đều được tính là không đạt; không có ca nào được sửa kết quả thủ công.
