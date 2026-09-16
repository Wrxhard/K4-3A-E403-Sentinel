export function detectCheckpoints(transcript){return transcript.filter(s=>s.boundary&&s.concept).map(s=>({time:s.end,start:s.start,concept:s.concept,source:s.text}));}
export function nextBoundary(checkpoints,from,to,visited){return checkpoints.find(c=>c.time>from&&c.time<=to&&!visited.includes(c.id));}
export function evaluateAnswer(checkpoint,answer,reason){if(answer===null)return 'empty';if(answer!==checkpoint.correct)return 'hint';if(!reason.trim())return 'reason';return 'success';}
export function addCard(cards,checkpoint,needsReview){if(cards.some(card=>card.id===checkpoint.id))return cards;return [...cards,{...checkpoint,needsReview}];}
export function rewardForCorrect({alreadyCompleted,firstTry}){if(alreadyCompleted)return 0;return firstTry?30:20;}
export function socialProofMessage({firstTry,missRate}){return firstTry?`Bạn đã vượt qua thử thách mà ${missRate}% người học chưa trả lời đúng ngay lần đầu!`:'Bạn đã sửa đúng sau khi nhận gợi ý — đó cũng là một bước tiến đáng ghi nhận.';}
export function timeLabel(time){return `${Math.floor(time/60)}:${String(Math.floor(time%60)).padStart(2,'0')}`;}
