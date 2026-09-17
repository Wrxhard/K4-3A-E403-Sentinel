# Structured Review Decision Design

## Problem

Ba lượt đánh giá cùng golden set cho kết quả 13/20, 18/20 và 16/20. Phần lớn dao động đến từ việc dùng chuỗi feedback tự do làm tín hiệu chấm: cùng một ý “ngoài phạm vi” có nhiều cách diễn đạt, còn feedback của ca đúng không nhất thiết nhắc lại từ khóa rubric.

## Decision

Phản hồi AI bổ sung `decision_code` có cấu trúc. Verdict và code phải nhất quán:

- `correct` → `RUBRIC_SATISFIED`
- `misconception` → `SPECIFIC_CONCEPT_ERROR`
- `insufficient` → `INSUFFICIENT_EXPLANATION` hoặc `INSTRUCTION_OVERRIDE`
- `out_of_scope` → `UNRELATED_REQUEST` hoặc `AUTHORITY_BOUNDARY`

Các mẫu chắc chắn như chỉ có dấu câu, prompt injection, hỏi lịch, suy danh tính và tư vấn y tế được nhận diện bằng guardrail xác định. OpenAI vẫn được gọi và sinh feedback, nhưng guardrail không cho mô hình trả `correct` trái với tín hiệu an toàn.

Golden set giữ nguyên 20 input và expected verdict. Mỗi ca thêm expected decision code để thay phép dò từ khóa tự do; từ khóa cũ chỉ còn là diagnostic, không quyết định pass/fail. Mỗi lượt eval có artifact riêng, không ghi đè lịch sử.

## Acceptance

- Contract từ chối mọi cặp verdict/code không nhất quán.
- Bảy ca rủi ro cũ có regression test cho guardrail.
- Full suite, golden validator, build và Sites test đều xanh.
- Lượt đo mới chạy đủ 20 OpenAI calls, có 20 raw logs và báo cáo riêng.
- README và `spec.md` ghi cả lịch sử số đo, nguyên nhân lỗi và quality bar; không chỉ công bố lượt cao nhất.
