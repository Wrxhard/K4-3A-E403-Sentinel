# Challenge Brief Canvas: D4 - Điểm dừng học tập

## 1. Làm cho ai?

**Học viên đang xem một bài giảng trên VLearn, đặc biệt là người vừa gặp một đoạn khó và muốn kiểm tra mình đã hiểu chưa.**

Không nhắm tới "học viên nói chung": lát cắt đầu tiên tập trung vào người xem đoạn giảng về **attention** trong `transcript-06`.

## 2. Họ đang cố hoàn thành việc gì?

**Sau khi xem một đoạn giảng khó, học viên muốn tự kiểm tra và sửa cách hiểu của mình trước khi tiếp tục học, để biết mình có thể giải thích khái niệm bằng một ví dụ mới hay chưa.**

Tự kiểm tra: bỏ AI đi, việc này vẫn tồn tại; hiện nay học viên có thể tự làm câu hỏi/flashcard hoặc xem lại đoạn khó.

## 3. Vấn đề hiện tại là gì?

Học viên có thể đi tiếp dù chưa hiểu đoạn vừa học; nếu đợi đến bài kiểm tra cuối bài thì lỗi hiểu sai bị phát hiện muộn. Cách mong muốn không phải là bị chặn cứng: học viên vẫn cần **được bỏ qua điểm dừng**, nhưng nếu tham gia thì phải tự trả lời trước, nhận gợi ý ngắn khi sai, rồi xem lời giải có nguồn.

**Nỗi đau cần kiểm chứng thêm:** khảo sát hiện mới có 3 phản hồi và chưa ghi rõ cách các bạn đang xử lý, mất bao lâu, hoặc hậu quả khi hiểu sai. Vì vậy chưa nên khẳng định đây là pain lớn của toàn bộ lớp.

## 4. Bằng chứng, hướng chọn và lát cắt thử nghiệm

### Bằng chứng ban đầu từ khảo sát (n = 3)

- `3/3` trả lời **Có** với nhu cầu/khó khăn liên quan đến việc học.
- `2/3` chọn **xem lại đoạn khó**; `1/3` chọn **làm bài tập**.
- Tần suất: `1/3` **thường xuyên**, `2/3` **hiếm khi**.
- `2/3` chỉ muốn thử nếu **có thể bỏ qua**; `1/3` **không muốn**.
- Các dạng tương tác được nêu: tự trả lời flashcard rồi xem đáp án, giải thích vì sao chọn, tìm lỗi trong một ví dụ.

Link Form Khảo sát: https://docs.google.com/spreadsheets/d/1sPRRwjYKFJEt_7b1t-P94jsFEHrlYuCh6VdUUizwjwc/edit?usp=sharing

Đây là tín hiệu ban đầu, chưa đạt chuẩn bằng chứng của guide (khảo sát >= 20 người hoặc mining có phương pháp đếm và ví dụ nguyên văn). Cần hỏi thêm lần gần nhất học viên xem lại đoạn khó và ghi thời gian/cách xử lý.

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