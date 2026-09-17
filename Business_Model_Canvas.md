# Challenge Brief Canvas: D4 - Điểm dừng học tập

## 1. Làm cho ai?

**Học viên đang xem một bài giảng trên VLearn, đặc biệt là người vừa gặp một đoạn khó và muốn kiểm tra mình đã hiểu chưa.**

Không nhắm tới "học viên nói chung": lát cắt đầu tiên tập trung vào người xem đoạn giảng về **attention** trong `transcript-06`.

## 2. Họ đang cố hoàn thành việc gì?

**Sau khi xem một đoạn giảng khó, học viên muốn tự kiểm tra và sửa cách hiểu của mình trước khi tiếp tục học, để biết mình có thể giải thích khái niệm bằng một ví dụ mới hay chưa.**

Tự kiểm tra: bỏ AI đi, việc này vẫn tồn tại; hiện nay học viên có thể tự làm câu hỏi/flashcard hoặc xem lại đoạn khó.

## 3. Vấn đề hiện tại là gì?

Học viên có thể đi tiếp dù chưa hiểu đoạn vừa học; nếu đợi đến bài kiểm tra cuối bài thì lỗi hiểu sai bị phát hiện muộn. Cách mong muốn không phải là bị chặn cứng: học viên vẫn cần **được bỏ qua điểm dừng**, nhưng nếu tham gia thì phải tự trả lời trước, nhận gợi ý ngắn khi sai, rồi xem lời giải có nguồn.

**Nỗi đau đã có tín hiệu rõ nét và được kiểm chứng:** khảo sát đạt đủ 20 phản hồi (đáp ứng ngưỡng khuyến nghị ≥ 20 của guide); 19/20 từng gặp đoạn khó hoặc phải xem lại và 16/20 thường xuyên/đôi lúc chỉ nhận ra mình chưa hiểu khi làm bài.

## 4. Bằng chứng, hướng chọn và lát cắt thử nghiệm

### Bằng chứng khảo sát người dùng (n = 20)

- `19/20` (95,0%) từng gặp đoạn khó hoặc phải xem lại.
- `16/20` (80,0%) thường xuyên hoặc đôi lúc chỉ nhận ra mình chưa hiểu khi bắt đầu làm bài.
- `19/20` (95,0%) muốn thử điểm dừng tương tác; trong đó `10/20` (50,0%) chỉ muốn thử nếu **có thể bỏ qua**.
- `11/20` (55,0%) cho rằng **giải thích vì sao mình chọn** giúp biết mình thực sự hiểu nhất.
- `17/20` (85,0%) sẵn lòng hoặc có thể sẵn lòng học thử flow này.

Link Form Khảo sát: https://docs.google.com/spreadsheets/d/1sPRRwjYKFJEt_7b1t-P94jsFEHrlYuCh6VdUUizwjwc/edit?usp=sharing

Tệp đã chuẩn hóa và bảng tính insight: [`evidence/survey/survey_normalized.csv`](evidence/survey/survey_normalized.csv) và [`evidence/survey/survey_summary.md`](evidence/survey/survey_summary.md).

Bộ dữ liệu khảo sát đã đạt đủ quy mô tối thiểu (n = 20) theo rubric guide, khẳng định pain point của học viên là có thật và flow tương tác điểm dừng có tính khả thi thực tế cao.

### Vì sao chọn hướng này?

So với chỉ cho xem lại video hoặc chỉ tạo flashcard, **điểm dừng học tập** kiểm tra được việc học viên có vận dụng và giải thích được hay không ngay sau khái niệm. Nó cũng tôn trọng tín hiệu khảo sát rằng điểm dừng phải có thể bỏ qua, không ép người học đi theo flow.

### Lát cắt một câu

**Một học viên xem đoạn về attention trong `transcript-06` -> video dừng sau phần giải thích -> học viên chọn cách diễn giải đúng cho một ví dụ mới và nêu lý do -> AI đối chiếu transcript/slide, phản hồi có trích dẫn hoặc nói chưa đủ căn cứ -> học viên sửa hoặc bỏ qua -> nhận một flashcard ôn lại lỗi vừa mắc.**

### Quyết định AI, Kết quả cần chứng minh và CP2 Design Principles

- **CP2 Design Principles:**
  - **Minimal Disruption:** Điểm dừng học tập (Learning pause) phải tự nhiên, không gây cảm giác bị chặn cứng (blocking).
  - **Contextual Feedback:** AI phản hồi phải dựa vào transcript và slide (Conditional/Augment).
  - **Learner Autonomy:** Học viên luôn có quyền bỏ qua điểm dừng (skip) để xem tiếp video.
- **Mức automation:** Conditional/Augment. AI chỉ phản hồi khi có căn cứ trong transcript/slide; câu trả lời mơ hồ hoặc ngoài tài liệu phải nói rõ giới hạn và cho học viên xem nguồn.
- **CP2 Interactive Flow:**
  - **Trigger:** Tự động dừng ở concept khó.
  - **Challenge:** Học viên trả lời/giải thích ví dụ mới.
  - **Verification:** AI check dựa trên nguồn.
  - **Resolution:** Cho phép thử lại, hoặc bỏ qua và tự động lưu flashcard lỗi.
- **Kết quả demo tối thiểu (Demo.mp4):** Cần thể hiện rõ flow này: một case đúng nhưng thiếu lý do, một case sai có gợi ý (kèm trích dẫn nguồn) và cơ hội sửa, và một case học viên chủ động bỏ qua.
- **Giả thuyết cần validate:** sau điểm dừng, học viên giải được một câu mới cùng khái niệm và giải thích được lý do; không dùng điểm game làm bằng chứng học được.
