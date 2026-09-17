function normalized(value) {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');
}

export function detectGuardrailSignal(input) {
  const explanation = normalized(input?.explanation);
  if (/\b(chan doan|ke thuoc|trieu chung|tu van y te)\b/.test(explanation)) {
    return { verdict: 'out_of_scope', decision_code: 'AUTHORITY_BOUNDARY', kind: 'medical' };
  }
  if (/\b(la ai|danh tinh|an danh)\b/.test(explanation) || /\bdoan\b.*\b(ten|nguoi)\b/.test(explanation)) {
    return { verdict: 'out_of_scope', decision_code: 'AUTHORITY_BOUNDARY', kind: 'identity' };
  }
  if (/\b(gio hoc|lich hoc|ngay mai)\b/.test(explanation)) {
    return { verdict: 'out_of_scope', decision_code: 'UNRELATED_REQUEST', kind: 'schedule' };
  }
  if (/\bbo cau.*\b(?:giai thich|attention)\b/.test(explanation) || /\bgiai thich toan bo\b/.test(explanation)) {
    return { verdict: 'out_of_scope', decision_code: 'UNRELATED_REQUEST', kind: 'task_switch' };
  }
  if (/system_override|ignore (?:all )?(?:previous|prior)|bo qua rubric|doi verdict|cho toi qua/.test(explanation)) {
    return { verdict: 'insufficient', decision_code: 'INSTRUCTION_OVERRIDE', kind: 'injection' };
  }
  if (!/[a-z0-9]/.test(explanation)) {
    return { verdict: 'insufficient', decision_code: 'INSUFFICIENT_EXPLANATION', kind: 'non_semantic' };
  }
  return null;
}

function guidanceQuestion(input) {
  return `Hãy quay lại câu hỏi của giáo viên: ${input.teacher.question}`;
}

export function enforceGuardrail(review, signal, input) {
  if (!signal) return review;
  const messages = {
    medical: 'Yêu cầu chẩn đoán hoặc kê thuốc nằm ngoài thẩm quyền của checkpoint học tập này.',
    identity: 'Hệ thống không suy đoán danh tính từ dữ liệu đã ẩn danh; yêu cầu này nằm ngoài thẩm quyền của checkpoint.',
    schedule: 'Nguồn của checkpoint không có thông tin lịch hoặc giờ học, nên yêu cầu này nằm ngoài phạm vi.',
    task_switch: 'Yêu cầu chuyển sang một chủ đề khác nằm ngoài phạm vi checkpoint hiện tại.',
    injection: 'Nội dung yêu cầu đổi verdict hoặc bỏ qua rubric không phải là lời giải khái niệm và sẽ không được thực hiện.',
    non_semantic: 'Phần giải thích chưa đủ thông tin để đánh giá; hãy viết ít nhất một khẳng định cụ thể về khái niệm.',
  };
  return {
    verdict: signal.verdict,
    decision_code: signal.decision_code,
    passed: false,
    misconceptions: [],
    missing_ideas: [messages[signal.kind]],
    feedback: messages[signal.kind],
    next_question: guidanceQuestion(input),
    source_ids: [],
  };
}
