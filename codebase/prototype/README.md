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
OPENAI_MODEL=gpt-5-mini
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
4. Mô hình trả một trong bốn verdict: `correct`, `misconception`, `insufficient`, `out_of_scope`, kèm `decision_code` có cấu trúc để không phụ thuộc câu chữ feedback.
5. Nếu hiểu sai hoặc thiếu ý, UI hiện điểm hiểu sai, ý cần bổ sung và một câu hỏi gợi mở; không lộ thẳng đáp án. Chỉ verdict `correct` mới hoàn thành checkpoint và cộng XP.
6. Guardrail xác định chặn các ca rõ ràng như prompt injection, chỉ có dấu câu, hỏi lịch, suy danh tính và tư vấn y tế; OpenAI vẫn được gọi để có raw response kiểm chứng.
7. Mỗi lượt gọi ghi prompt đầu vào, phản hồi HTTP thô, kết quả model và kết quả sau guardrail vào JSONL. Header/API key không được ghi log.

Các checkpoint hiện dùng nguồn mẫu có mã `T06-*` và câu hỏi/rubric giáo viên khai báo trong `src/lesson.js`. Player, dữ liệu tài khoản, BXH và thống kê cohort vẫn là dữ liệu mô phỏng được gắn nhãn trong UI.

## Golden set và kết quả CP3

Kiểm tra cấu trúc bộ 20 ca:

```powershell
npm.cmd run eval:validate
```

Chạy lại toàn bộ 20 ca bằng OpenAI thật. Dùng số lượt mới để không ghi đè lịch sử:

```powershell
npm.cmd run eval:run
npm.cmd run eval:run -- --run-number=5
```

### Số đo thực nghiệm

| Lượt | Model | Thay đổi chính | Đạt | Tỷ lệ |
|---:|---|---|---:|---:|
| 1 | `gpt-4o-mini` | Baseline | 13/20 | 65,0% |
| 2 | `gpt-4o-mini` | Thứ tự verdict và ví dụ guardrail trong prompt | 18/20 | 90,0% |
| 3 | `gpt-4o-mini` | Chấp nhận diễn đạt ngắn/không dấu | 16/20 | 80,0% |
| 4 | `gpt-5-mini` | Structured `decision_code`, guardrail xác định và scorer không dò feedback tự do | **20/20** | **100,0%** |

Hai ca chưa đạt ở lượt 2 là `GS-005` và `GS-013`: `GS-005` đã có verdict đúng nhưng scorer bỏ sót cụm đồng nghĩa “không nằm trong phạm vi”; `GS-013` là lời giải QKV không dấu đúng nhưng model đòi thêm chi tiết vượt rubric. Lượt 3 giảm còn 16/20, chứng minh prompt tự do vẫn dao động. Vì vậy lượt 4 chuyển quyết định sang verdict + decision code có cấu trúc và giữ feedback tự do chỉ để hiển thị/diagnostic.

Kết quả 20/20 chỉ chứng minh hệ thống đạt quality bar trên golden set hiện tại; không có nghĩa hệ thống đúng tuyệt đối với mọi câu trả lời ngoài tập. Lượt 4 đồng thời đổi model từ `gpt-4o-mini` sang `gpt-5-mini`, nên không quy toàn bộ mức tăng cho một thay đổi duy nhất.

| Artifact | Nội dung |
|---|---|
| `eval/golden_set.json` | 20 ca, đủ 4 lớp chỗ khó; 10 ca phổ biến, 3 edge case, 12 ca dựa trên dữ liệu được cung cấp |
| `eval/run_results.json`, `run_results_2.json`… | Kết quả máy đọc được từng lượt; không ghi đè lịch sử |
| `eval/run_results.md`, `run_results_2.md`… | Bảng tổng hợp và nguyên nhân sai lệch từng lượt |
| `eval/run_logs.jsonl`, `run_logs_2.jsonl`… | 20 prompt và phản hồi thô mỗi lượt để xác minh kỹ thuật |
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
