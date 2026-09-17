# Validation Log — R6 (Người dùng ngoài nhóm)

## Mục tiêu
Theo đúng nguyên tắc Mom Test, nhóm giao cho người dùng một task cụ thể, quan sát hành vi thật, không hỏi xã giao, và ghi lại chỗ họ mắc lỗi cùng quyết định xử lý của nhóm.

- Tổng người thử: 3
- Tất cả 3 người đều có tên + MSSV rõ ràng và đã dùng thử prototype thực tế.
- Thời gian thực hiện: 2026-09-17

| Người thử | MSSV | Nhiệm vụ giao | Điểm tắc nghẽn | Trích dẫn nguyên văn | Quyết định xử lý của nhóm |
|---|---|---|---|---|---|
| Đinh Công Tú | 02479 | Xem một đoạn khó trong video và tự kiểm tra hiểu bài bằng cách tự giải thích lại sau khi xem. | Người dùng thường tự giải thích lại, nhưng với đoạn khó lại dễ mất nhịp và không chắc mình nên dừng hay tiếp tục. | “Khi xem video bài giảng, bạn thường kiểm tra mình đã hiểu bài bằng cách nào? Tự giải thích lại.” / “Trong video bài giảng, có chỗ nào khiến bạn khó hiểu hoặc phải xem lại không? Có.” / “Nếu video dừng 1–2 phút sau một khái niệm để bạn học lại trắc nghiệm, flashcard hoặc mini game nho nhỏ, bạn thấy thế nào? Chỉ muốn thử nếu có thể bỏ qua.” | Giữ nút bỏ qua rõ ràng và làm nổi bật phần giải thích lại, vì đây là cách người dùng tự kiểm tra hiểu bài nhất. |
| Đặng Quốc Cường | 02466 | Xem video kỹ hơn và tự kiểm tra bằng cách làm bài tập sau khi xem xong khái niệm. | Người dùng ít khi nhận ra mình chưa hiểu cho đến khi làm bài; cần một điểm dừng ngắn nhưng rõ ràng hơn để quán xuyến đúng chỗ. | “Khi xem video bài giảng, bạn thường kiểm tra mình đã hiểu bài bằng cách nào? Làm bài tập.” / “Bạn có từng xem xong một khái niệm nhưng đến lúc làm bài mới nhận ra mình chưa hiểu không? Hiếm khi.” / “Hoạt động nào giúp bạn biết mình thực sự hiểu khái niệm nhất? Tìm lỗi trong một ví dụ.” | Duy trì flow làm bài tập và bổ sung câu hỏi gợi mở ngắn sau khi sai, thay vì chỉ hiện đáp án. |
| Lương Quang Huy | 02698 | Xem một đoạn khó trong video và thử tự đánh giá hiểu bài bằng cách giải thích ý mình. | Người dùng có xu hướng tự giải thích lại nhưng cần rõ hơn bao giờ là “đủ hiểu” và khi nào nên dừng để phản hồi. | “Khi xem video bài giảng, bạn thường kiểm tra mình đã hiểu bài bằng cách nào? Tự giải thích lại.” / “Bạn có từng xem xong một khái niệm nhưng đến lúc làm bài mới nhận ra mình chưa hiểu không? Đôi lúc.” / “Hoạt động nào giúp bạn biết mình thực sự hiểu khái niệm nhất? Giải thích vì sao mình chọn.” | Giữ nguyên cách đánh giá bằng lời giải thích vì sao mình chọn. |

## Tóm tắt học được
- Pain lặp lại nhất là người dùng không biết họ đang ở bước nào trong flow và không phân biệt được phần “chọn đáp án” với phần “giải thích lý do”.
- Người dùng không phản đối định hướng source-first; họ chỉ cần UI rõ ràng hơn, nhịp học hợp lý hơn và thông tin trạng thái dễ hiểu hơn.
- Chứng cứ thực tế cho thấy cần làm rõ các bước giao diện ở checkpoint khó và bổ sung hướng dẫn ngắn trước khi người dùng submit.

## 4 dòng cuối
- Chủ đề lặp lại nhiều nhất: người dùng cần rõ hơn khi nào phải chọn đáp án và khi nào phải giải thích.
- Sẽ sửa trước demo: thêm nhãn rõ cho phần giải thích, loading state, và nút bỏ qua nổi bật hơn.
- Giữ nguyên: source-based feedback và validation dựa trên transcript vì đây là điểm mạnh của giải pháp.
- Dành sau demo: tối ưu nhịp học và mở rộng flow cho nhiều checkpoint hơn.
