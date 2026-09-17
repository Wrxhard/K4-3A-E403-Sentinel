import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowRight, Cards, CheckCircle, FileText, Lightbulb, Play, SkipForward, Sparkle } from '@phosphor-icons/react';
import { rewardForCorrect, timeLabel } from './learning';
import { reviewExplanation } from './reviewApi';

const verdictHeading = {
  misconception: 'Có một ý cần sửa',
  insufficient: 'Bạn cần giải thích rõ hơn',
  out_of_scope: 'Câu này nằm ngoài bài học',
};

// Trên điện thoại, đặt quiz ngoài player để không bị cắt bởi khung video.
// VisualViewport cho biết phần màn hình còn lại khi bàn phím đang mở.
function useMobileViewport() {
  const [viewport, setViewport] = useState(null);
  useEffect(() => {
    const query = window.matchMedia('(max-width: 760px)');
    const visible = window.visualViewport;
    function update() {
      setViewport(query.matches ? {
        height: visible?.height ?? window.innerHeight,
        top: visible?.offsetTop ?? 0,
      } : null);
    }
    update();
    query.addEventListener('change', update);
    window.addEventListener('resize', update);
    visible?.addEventListener('resize', update);
    visible?.addEventListener('scroll', update);
    return () => {
      query.removeEventListener('change', update);
      window.removeEventListener('resize', update);
      visible?.removeEventListener('resize', update);
      visible?.removeEventListener('scroll', update);
    };
  }, []);
  return viewport;
}

export function Quiz({ checkpoint, onSkip, onComplete, alreadyCompleted = false }) {
  const [answer, setAnswer] = useState(null);
  const [reason, setReason] = useState('');
  const [feedback, setFeedback] = useState('');
  const [wrong, setWrong] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [aiReview, setAiReview] = useState(null);
  const [reviewError, setReviewError] = useState('');
  const dialog = useRef(null);
  const reasonInput = useRef(null);
  const scrollBody = useRef(null);
  const feedbackRegion = useRef(null);
  const viewport = useMobileViewport();
  const mobile = viewport !== null;
  const pendingRequest = useRef(null);
  const active = useRef(true);
  const earnedPreviously = useRef(alreadyCompleted);
  const reviewing = feedback === 'reviewing';
  const citedSources = (checkpoint.teacherSources || []).filter(source => aiReview?.source_ids.includes(source.id));

  useEffect(() => {
    active.current = true;
    const previous = document.activeElement;
    dialog.current?.focus();
    return () => {
      active.current = false;
      if (pendingRequest.current) pendingRequest.current.cancelled = true;
      previous?.focus?.();
    };
  }, []);

  useEffect(() => {
    if (!mobile) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.current?.focus({ preventScroll: true });
    return () => { document.body.style.overflow = previousOverflow; };
  }, [mobile]);

  // Đưa phản hồi vào vùng đọc, không bật bàn phím trước khi học viên đọc xong.
  useEffect(() => {
    const container = scrollBody.current;
    if (!container) return;
    if (feedback === 'success') {
      container.scrollTop = 0;
      dialog.current?.focus({ preventScroll: true });
      return;
    }
    if (!['hint', 'ai_feedback', 'ai_error', 'empty'].includes(feedback)) return;
    const region = feedbackRegion.current;
    if (!region) return;
    container.scrollTop += region.getBoundingClientRect().top - container.getBoundingClientRect().top - 12;
    region.focus({ preventScroll: true });
  }, [feedback]);

  function editReason() {
    reasonInput.current?.focus();
  }

  function skip() {
    active.current = false;
    if (pendingRequest.current) pendingRequest.current.cancelled = true;
    onSkip();
  }

  async function submit(event) {
    event.preventDefault();
    if (answer === null) { setFeedback('empty'); return; }
    if (answer !== checkpoint.correct) { setWrong(true); setFeedback('hint'); return; }
    if (!reason.trim()) { setFeedback('reason'); reasonInput.current?.focus(); return; }

    // Chỉ đánh dấu lượt đánh giá còn hiệu lực trong giao diện; API hiện có không cần thay đổi.
    const request = { cancelled: false };
    pendingRequest.current = request;
    setFeedback('reviewing');
    setAiReview(null);
    setReviewError('');
    reasonInput.current?.blur();
    try {
      const review = await reviewExplanation({ checkpointId: checkpoint.id, answer, explanation: reason });
      // Không áp dụng phản hồi đến muộn sau khi học viên bỏ qua.
      if (!active.current || request.cancelled) return;
      setAiReview(review);
      if (review.passed) {
        setFeedback('success');
        setEarnedPoints(rewardForCorrect({ alreadyCompleted: earnedPreviously.current, firstTry: !wrong }));
        onComplete(checkpoint, wrong, false);
      } else {
        setWrong(true);
        setFeedback('ai_feedback');
      }
    } catch (error) {
      if (!active.current || request.cancelled) return;
      setReviewError(error.message);
      setFeedback('ai_error');
    } finally {
      if (pendingRequest.current === request) pendingRequest.current = null;
    }
  }

  function trap(event) {
    if (event.key === 'Escape') { skip(); return; }
    if (event.key !== 'Tab') return;
    const nodes = [...dialog.current.querySelectorAll('button:not(:disabled),textarea:not(:disabled),input:not(:disabled),summary')];
    const first = nodes[0], last = nodes[nodes.length - 1];
    if (!first) return;
    if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog.current)) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }

  const content = <div className={`quiz-shade${mobile ? ' quiz-shade-mobile' : ''}`} style={mobile ? { top: viewport.top, height: viewport.height } : undefined}>
    <section className="quiz" role="dialog" aria-modal="true" aria-labelledby="quiz-title" tabIndex={-1} ref={dialog} onKeyDown={trap}>
      <div className="quiz-top"><span className="eyebrow"><Sparkle weight="fill"/> ĐIỂM DỪNG HỌC TẬP</span><span className="tag">{timeLabel(checkpoint.time)}</span></div>
      {feedback === 'success' ? <>
        <div className="quiz-scroll" ref={scrollBody}>
        <div className="success-heading"><CheckCircle size={35} weight="fill"/><div><h2 id="quiz-title">Bạn đã giải thích đúng!</h2><p>Phần giải thích phù hợp với ý chính của bài học.</p></div><span className="xp-badge">{earnedPreviously.current ? 'Đã nhận XP' : `+${earnedPoints} XP`}</span></div>
        <p className="explanation">{aiReview?.feedback}</p>
        <div className="reason-recap"><strong>Lý do của bạn</strong><p>{reason}</p></div>
        <details className="inline-source"><summary><FileText size={17}/> Xem đoạn bài giảng làm căn cứ</summary>{citedSources.length ? citedSources.map(source => <p key={source.id}>“{source.excerpt}” <small>· {source.id}</small></p>) : <p>AI chưa dẫn nguồn cụ thể cho phản hồi này.</p>}</details>
        <div className="card-added"><Cards size={23}/><span><strong>{earnedPreviously.current ? 'Thẻ ôn tập đã có' : 'Đã thêm thẻ ôn tập'}</strong><small>{wrong ? 'Thẻ được đánh dấu cần ôn lại.' : 'Bạn có thể xem thẻ trong Góc học tập.'}</small></span></div>
        </div>
        <div className="quiz-footer"><button className="primary full" onClick={() => onComplete(checkpoint, wrong, true)}>Tiếp tục video <Play weight="fill"/></button></div>
      </> : <form className="quiz-form" onSubmit={submit}>
        <div className="quiz-scroll" ref={scrollBody}>
        <div className="quiz-heading"><h2 id="quiz-title">Thử áp dụng điều vừa học</h2><p>Một câu ngắn về <strong>{checkpoint.concept}</strong>, rồi bạn có thể xem tiếp.</p></div>
        <h3>{checkpoint.question}</h3>
        <div className="answers">{checkpoint.options.map((option, index) => <label key={option} className={`answer ${answer === index ? 'selected' : ''} ${feedback === 'hint' && answer === index ? 'incorrect' : ''}`}><input type="radio" name="answer" checked={answer === index} disabled={reviewing} onChange={() => { setAnswer(index); setFeedback(''); setAiReview(null); }}/><span className="answer-letter">{'ABC'[index]}</span><span>{option}</span></label>)}</div>
        <label className="reason-label" htmlFor="reason">Vì sao bạn chọn đáp án này? <span>Một câu ngắn là đủ</span></label>
        <textarea ref={reasonInput} id="reason" rows={2} value={reason} disabled={reviewing} maxLength={1200} onChange={event => { setReason(event.target.value); if (feedback === 'ai_error') setFeedback(''); }} placeholder="Mình nghĩ rằng…"/>
        <div className="quiz-feedback-region" ref={feedbackRegion} tabIndex={-1} aria-label="Phản hồi về câu trả lời" aria-live="polite">
          {reviewing && <div className="ai-reviewing"><Sparkle/><span>Đang kiểm tra lời giải theo bài học…</span></div>}
          {feedback === 'ai_feedback' && aiReview && <div className="teacher-feedback ai-feedback"><div><Lightbulb size={22}/><span><strong>{verdictHeading[aiReview.verdict] || 'Hãy xem lại lời giải'}</strong>{aiReview.feedback}</span></div><p className="next-question"><strong>Thử sửa lý do:</strong> {aiReview.next_question}</p><details className="review-details"><summary>Xem thêm góp ý và nguồn</summary>{aiReview.misconceptions.concat(aiReview.missing_ideas).map((item, index) => <p key={`${index}-${item}`}>{item}</p>)}{citedSources.length ? citedSources.map(source => <p key={source.id}>“{source.excerpt}” <small>· {source.id}</small></p>) : <p>AI chưa dẫn nguồn cụ thể cho phản hồi này.</p>}</details></div>}
          {feedback === 'ai_error' && <div className="ai-error"><Lightbulb/><span><strong>Chưa thể kiểm tra lúc này</strong>{reviewError}</span></div>}
          {['hint', 'reason', 'empty'].includes(feedback) && <div className={`feedback ${feedback === 'hint' ? 'hint' : ''}`}><Lightbulb size={21}/><span>{feedback === 'hint' ? checkpoint.hint : feedback === 'reason' ? 'Hãy thêm lý do để kiểm tra mức hiểu bài.' : 'Bạn hãy chọn một đáp án.'}</span></div>}
          {feedback === 'ai_feedback' && <button type="button" className="edit-reason-button" onClick={editReason}>Sửa lý do <ArrowRight size={16}/></button>}
        </div>
        </div>
        <div className="quiz-footer"><button type="button" className="text-button" onClick={skip}>Bỏ qua, xem tiếp video <SkipForward/></button><button type="submit" className="primary" disabled={reviewing}>{reviewing ? 'Đang kiểm tra…' : 'Kiểm tra lời giải'} {!reviewing && <ArrowRight/>}</button></div>
      </form>}
    </section>
  </div>;
  return mobile ? createPortal(content, document.body) : content;
}
