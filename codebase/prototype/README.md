# VLearn · Điểm dừng học tập có AI

Prototype tạm dừng bài giảng tại các checkpoint khái niệm và dùng OpenAI để kiểm tra phần giải thích của người học theo nguồn cùng câu hỏi mẫu của giáo viên. Phản hồi không gán cứng: backend gửi yêu cầu thật tới Responses API, nhận JSON có cấu trúc, chỉ ra hiểu sai/ý còn thiếu và đặt câu hỏi định hướng tiếp theo.

## Thiết lập

Yêu cầu Node.js 22+. Trong thư mục `codebase/prototype`:

```powershell
npm.cmd install
Copy-Item .env.example .env
```

Điền key vào `.env` cục bộ (không commit):

```dotenv
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-4o-mini
AI_LOG_PATH=./logs/ai-calls.jsonl
```

Chạy prototype:

```powershell
npm.cmd run dev -- --host 127.0.0.1 --port 4173 --strictPort
```

Mở `http://127.0.0.1:4173/`. Lệnh dev dùng kho chứng chỉ hệ thống của Node để tương thích với mạng có chứng chỉ trung gian; không tắt xác thực TLS.

## Luồng AI thật

1. Người học chọn đáp án và tự giải thích khái niệm.
2. `POST /api/review-explanation` chỉ nhận ID checkpoint và nội dung người học; server tự lấy nguồn tin cậy trong `src/lesson.js`.
3. Prompt yêu cầu mô hình đối chiếu với đoạn transcript và câu hỏi/rubric mẫu của giáo viên, không tin chỉ dẫn nằm trong câu trả lời của người học.
4. Mô hình trả một trong bốn verdict: `correct`, `misconception`, `insufficient`, `out_of_scope`.
5. Nếu hiểu sai hoặc thiếu ý, UI hiện điểm hiểu sai, ý cần bổ sung và một câu hỏi gợi mở; không lộ thẳng đáp án. Chỉ verdict `correct` mới hoàn thành checkpoint và cộng XP.
6. Mỗi lượt gọi ghi prompt đầu vào, phản hồi HTTP thô và kết quả parse vào JSONL. Header/API key không được ghi log.

Các checkpoint hiện dùng nguồn mẫu có mã `T06-*` và câu hỏi/rubric giáo viên khai báo trong `src/lesson.js`. Player, dữ liệu tài khoản, BXH và thống kê cohort vẫn là dữ liệu mô phỏng được gắn nhãn trong UI.

## Golden set và kết quả CP3

Kiểm tra cấu trúc bộ 20 ca:

```powershell
npm.cmd run eval:validate
```

Chạy lại toàn bộ 20 ca bằng OpenAI thật:

```powershell
npm.cmd run eval:run
```

Lượt 1 ngày 17/09/2026 dùng `gpt-4o-mini`: **13/20 ca đạt (65,0%)**. Bảy ca không đạt được giữ nguyên và phân tích trong `eval/run_results.md`; log thô đầy đủ nằm tại `eval/run_logs.jsonl`.

| Artifact | Nội dung |
|---|---|
| `eval/golden_set.json` | 20 ca, đủ 4 lớp chỗ khó; 10 ca phổ biến, 3 edge case, 12 ca dựa trên dữ liệu được cung cấp |
| `eval/run_results.json` | Kết quả máy đọc được của từng ca |
| `eval/run_results.md` | Tổng hợp 13 đạt, 7 chưa đạt và nguyên nhân từng ca |
| `eval/run_logs.jsonl` | 20 prompt và phản hồi thô để xác minh kỹ thuật |
| `eval/demo_video.txt` | Link video thao tác CP3 khoảng 30 giây |

Video demo: https://youtu.be/hwB9LhtTXoQ?si=2pS_2H8H7JgtXhdD

## Kiểm thử kỹ thuật

```powershell
npm.cmd test
npm.cmd run eval:validate
npm.cmd run build
npm.cmd run test:sites
```

Các mốc nội dung mẫu: Attention 0:48, Query/Key/Value 1:36, Self-attention 2:18. Build tạo cả client và worker để bàn giao lên Sites.

## Phạm vi và bảo mật

- Prototype có AI thật ở mắt xích quyết định trung tâm; video/timeline, checkpoint detection, tài khoản và cohort analytics chưa nối backend sản xuất.
- `codebase/data/` là data pack được cấp cho hackathon, chỉ dùng cục bộ và bị `.gitignore`; không đẩy dữ liệu thô lên repo công khai.
- Golden set chỉ lưu trích đoạn tối thiểu/ID nguồn đã ẩn danh để có thể kiểm chứng mà không phát tán data pack.
- `.env`, API key và log runtime cục bộ trong `codebase/prototype/logs/` đều bị bỏ qua. Chỉ log eval đã kiểm tra không chứa key mới được commit làm bằng chứng CP3.
