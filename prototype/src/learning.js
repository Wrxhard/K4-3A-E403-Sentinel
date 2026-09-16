export function detectCheckpoints(transcript){return transcript.filter(s=>s.boundary&&s.concept).map(s=>({time:s.end,start:s.start,concept:s.concept,source:s.text}));}
export function nextBoundary(checkpoints,from,to,visited){return checkpoints.find(c=>c.time>from&&c.time<=to&&!visited.includes(c.id));}
export function evaluateAnswer(checkpoint,answer,reason){if(answer===null)return 'empty';if(answer!==checkpoint.correct)return 'hint';if(!reason.trim())return 'reason';return 'success';}
export function addCard(cards,checkpoint,needsReview){if(cards.some(card=>card.id===checkpoint.id))return cards;return [...cards,{...checkpoint,needsReview}];}
export function timeLabel(time){return `${Math.floor(time/60)}:${String(Math.floor(time%60)).padStart(2,'0')}`;}
