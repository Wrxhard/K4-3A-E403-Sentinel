export function detectCheckpoints(transcript){return transcript.filter(s=>s.boundary&&s.concept).map(s=>({time:s.end,start:s.start,concept:s.concept,source:s.text}));}
export function nextBoundary(checkpoints,from,to,visited){return checkpoints.find(c=>c.time>from&&c.time<=to&&!visited.includes(c.id));}
function normalizeVietnamese(value){return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d');}
export function evaluateReason(checkpoint,reason){const normalized=normalizeVietnamese(reason);const missing=(checkpoint.reasonRubric||[]).filter(criterion=>!criterion.terms.some(term=>normalized.includes(normalizeVietnamese(term)))).map(criterion=>criterion.label);if(missing.length)return {status:'revise',missing,feedback:checkpoint.teacherFeedback};return {status:'pass',missing:[],feedback:'Giải thích phù hợp với các ý chuẩn của giáo viên.'};}
export function evaluateAnswer(checkpoint,answer,reason){if(answer===null)return 'empty';if(answer!==checkpoint.correct)return 'hint';if(!reason.trim())return 'reason';if(evaluateReason(checkpoint,reason).status==='revise')return 'reason_feedback';return 'success';}
export function addCard(cards,checkpoint,needsReview){if(cards.some(card=>card.id===checkpoint.id))return cards;return [...cards,{...checkpoint,needsReview}];}
export function rewardForCorrect({alreadyCompleted,firstTry}){if(alreadyCompleted)return 0;return firstTry?30:20;}
export function firstTryAccuracy({answered,firstTryCorrect}){if(!answered)return 0;return Math.round(Math.max(0,Math.min(firstTryCorrect,answered))/answered*100);}
export function firstTryMissRate({participants,firstTryCorrect}){if(!participants)return 0;return 100-firstTryAccuracy({answered:participants,firstTryCorrect});}
export function socialProofMessage({firstTry,missRate}){return firstTry?`Bạn đã vượt qua thử thách mà ${missRate}% người học chưa trả lời đúng ngay lần đầu!`:'Bạn đã sửa đúng sau khi nhận gợi ý — đó cũng là một bước tiến đáng ghi nhận.';}
export function timeLabel(time){return `${Math.floor(time/60)}:${String(Math.floor(time%60)).padStart(2,'0')}`;}
