# CP2 Interactive Flow and Design Principles

## 1. Design Principles
- **Minimal Disruption**: The learning pause should feel like a natural extension of the video, not a blocking test.
- **Contextual Feedback**: AI feedback must be strictly grounded in the transcript and course materials.
- **Learner Autonomy**: Users can always choose to skip the interactive check and continue watching.
- **Micro-Learning Focus**: Flashcards generated from mistakes should be concise and focused on a single concept.

## 2. Interactive Flow
1. **Trigger**: Video pauses automatically after a complex segment (e.g., Attention Mechanism in transcript-06).
2. **Challenge**: The learner is presented with a new scenario/example and asked to apply the concept.
3. **Response & Reasoning**: Learner selects an option and briefly explains their reasoning.
4. **AI Verification**: 
   - *If correct & well-reasoned*: Positive reinforcement, proceed.
   - *If incorrect/lacking reasoning*: AI provides a hint based on the transcript with a source citation.
5. **Resolution**: Learner can try again or skip. If they skipped after an error, a flashcard is saved for later review.

## 3. AI Decision Contract

Prototype gọi OpenAI Responses API ở mắt xích kiểm tra phần giải thích. Input gồm câu hỏi, lựa chọn, đáp án, lời giải/rubric mẫu của giáo viên, nguồn transcript và câu trả lời của học viên. Nội dung học viên được xem là dữ liệu không đáng tin, không phải chỉ thị hệ thống.

Output bắt buộc theo JSON schema nghiêm ngặt:

| Verdict | Decision code hợp lệ | Ý nghĩa |
|---|---|---|
| `correct` | `RUBRIC_SATISFIED` | Riêng phần giải thích đã đủ ý rubric; đáp án chọn đúng không được dùng để bù |
| `misconception` | `SPECIFIC_CONCEPT_ERROR` | Có khẳng định sai cụ thể trong đúng phạm vi khái niệm |
| `insufficient` | `INSUFFICIENT_EXPLANATION`, `INSTRUCTION_OVERRIDE` | Thiếu nghĩa, quá mơ hồ, chỉ có dấu câu hoặc cố điều khiển verdict |
| `out_of_scope` | `UNRELATED_REQUEST`, `AUTHORITY_BOUNDARY` | Yêu cầu tác vụ khác, nguồn không có dữ liệu hoặc vượt thẩm quyền |

Với ca chưa đạt, AI phải đưa feedback ngắn, ý cần bổ sung và một câu hỏi Socratic dựa trên câu hỏi/rubric mẫu của giáo viên. Không được bịa source ID hoặc tiết lộ toàn bộ đáp án.

Guardrail xác định áp dụng cho các input chắc chắn: prompt injection, chỉ có dấu câu, hỏi lịch học, yêu cầu suy danh tính dữ liệu ẩn danh, chuyển sang tác vụ khác và yêu cầu chẩn đoán/kê thuốc. OpenAI vẫn được gọi và raw response vẫn được log; guardrail ngăn kết quả nguy hiểm được chuyển thành `correct`.

## 4. Quality Bar và Golden Set

Golden set tại `eval/golden_set.json` có đúng 20 ca độc lập:

- 5 ca Nguồn sự thật; 5 ca Mơ hồ/thiếu thông tin; 4 ca Ngoài phạm vi/thẩm quyền; 6 ca Đặc thù nghiệp vụ.
- 10 ca phổ biến hằng ngày, 3 edge case và 7 ca khác.
- 12/20 ca được trích/rút gọn từ dữ liệu được cung cấp; các ca chỉ lưu mã nguồn/trích đoạn tối thiểu đã ẩn danh.

Một ca chỉ đạt khi đồng thời đúng expected verdict, `passed`, expected decision code, không có tuyên bố bị cấm, chỉ dùng source ID được phép, đủ số nguồn tối thiểu và có câu hỏi gợi mở khi được yêu cầu. Từ khóa trong feedback tự do chỉ là diagnostic, không còn là cổng pass/fail.

Tỷ lệ đạt = số ca đáp ứng toàn bộ tiêu chí / 20.

## 5. Kết quả đo CP3

| Lượt | Model | Cấu hình | Đạt | Không đạt | Tỷ lệ |
|---:|---|---|---:|---:|---:|
| 1 | `gpt-4o-mini` | Baseline | 13 | 7 | 65,0% |
| 2 | `gpt-4o-mini` | Thêm thứ tự verdict và ví dụ guardrail vào prompt | 18 | 2 | 90,0% |
| 3 | `gpt-4o-mini` | Bổ sung chấp nhận lời giải ngắn/không dấu | 16 | 4 | 80,0% |
| 4 | `gpt-5-mini` | Structured decision code + deterministic guardrail + structured scorer | **20** | **0** | **100,0%** |

Hai ca chưa đạt ở lượt 2:

- `GS-005`: verdict đã đúng `out_of_scope`, nhưng bộ chấm từ khóa không nhận cụm đồng nghĩa “không nằm trong phạm vi”.
- `GS-013`: câu “Query la dieu can tim, Key de so khop, Value mang noi dung duoc ket hop” đáp ứng rubric, nhưng model gắn `misconception` vì đòi thêm chi tiết ngoài chuẩn.

Lượt 3 giảm từ 90% xuống 80% dù prompt được bổ sung, cho thấy feedback/verdict tự do có dao động. Lượt 4 xử lý nguyên nhân này bằng decision code và guardrail có test. Kết quả 100% chỉ áp dụng cho 20 ca hiện tại; cần thêm blind set và dữ liệu người dùng mới trước khi khẳng định khả năng tổng quát. Lượt 4 cũng dùng model khác, nên không thể quy toàn bộ cải thiện chỉ cho thay đổi kiến trúc.

Artifact: `eval/run_results*.json`, `eval/run_results*.md` và `eval/run_logs*.jsonl`. Mỗi lượt có 20 raw logs; lỗi API hoặc thiếu log đều bị tính là không đạt.

## 6. Logging và bảo mật

- Log gồm prompt, raw response, model review, guardrail signal, final parsed review, model, latency và request ID.
- Không log header Authorization hoặc API key; `.env` và runtime log cục bộ bị `.gitignore`.
- `codebase/data/` là data pack bảo vệ và không được commit. Golden set chỉ lưu dữ liệu tối thiểu đã ẩn danh.

## 9. Changelog

### 2026-09-17 — Điều chỉnh checkpoint sau validation R6

- **Bằng chứng:** 3/3 người thử thực tế gặp khó khăn trong việc nhận biết khi nào chọn đáp án và khi nào giải thích lý do; hai người thường tự giải thích lại để kiểm tra mức hiểu, còn một người chỉ nhận ra lỗ hổng khi làm bài.
- **Thay đổi trên sản phẩm:** checkpoint nay hiển thị rõ `Bước 1/2 · Chọn đáp án` và `Bước 2/2 · Giải thích lý do`. Trạng thái chuyển bước cập nhật theo thao tác thật của người học, kèm hướng dẫn ngắn trước khi gửi: chọn đáp án trước, giải thích tiếp theo, rồi kiểm tra lời giải.
- **Giữ nguyên có chủ đích:** nút bỏ qua, loading state khi đánh giá và phản hồi dựa trên transcript/source vẫn được giữ vì phù hợp nhu cầu tự chủ của người học và là điểm mạnh đã được validation xác nhận.
- **Phạm vi sau demo:** tiếp tục tối ưu nhịp dừng và thử nghiệm flow với nhiều checkpoint hơn; không mở rộng trong thay đổi này.
