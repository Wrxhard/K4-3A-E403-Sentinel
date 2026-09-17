export const validInput = (overrides = {}) => ({
  checkpointId: 'attention',
  selectedAnswer: 1,
  explanation: 'Attention dùng mức độ liên quan trong ngữ cảnh để kết hợp thông tin theo trọng số.',
  teacher: {
    question: 'Attention giúp mô hình làm gì khi xử lý một đại từ?',
    options: ['Coi mọi từ như nhau', 'Xét các từ liên quan trong ngữ cảnh', 'Chọn từ gần nhất'],
    correctAnswer: 1,
    referenceExplanation: 'Attention kết hợp thông tin theo trọng số phụ thuộc ngữ cảnh.',
    description: 'Attention đánh giá mức độ liên quan theo ngữ cảnh.',
    rubric: ['Mức độ liên quan theo ngữ cảnh', 'Kết hợp thông tin theo trọng số'],
    sources: [
      { id: 'T06-130', excerpt: 'Mỗi token nhìn các token khác và đánh giá mức tương đồng.' },
      { id: 'T06-133', excerpt: 'Một thuật ngữ quan trọng là ngữ cảnh.' },
    ],
  },
  ...overrides,
});

export const validReview = Object.freeze({
  verdict: 'correct',
  decision_code: 'RUBRIC_SATISFIED',
  passed: true,
  quality_score: 5,
  misconceptions: [],
  missing_ideas: [],
  feedback: 'Bạn đã nêu đúng vai trò của ngữ cảnh và trọng số.',
  next_question: '',
  source_ids: ['T06-130'],
});

export function responseBody(review = validReview) {
  return {
    id: 'resp_test',
    object: 'response',
    model: 'gpt-5-mini',
    status: 'completed',
    output: [
      {
        id: 'msg_test',
        type: 'message',
        role: 'assistant',
        content: [{ type: 'output_text', text: JSON.stringify(review), annotations: [] }],
      },
    ],
    usage: { input_tokens: 100, output_tokens: 50, total_tokens: 150 },
  };
}
