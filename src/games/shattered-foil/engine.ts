import { cloneState, colorOf, type Action, type Card, type GameState, type PileRef } from './model';
const pile=(s:GameState,r:PileRef)=>r.type==='tableau'?s.tableau[r.index]:r.type==='foundation'?s.foundations[r.index]:s.waste;
export const validTableauSequence=(cards:Card[])=>cards.every((c,i)=>i===0||cards[i-1].rank===c.rank+1&&colorOf(cards[i-1])!==colorOf(c));
export function canMoveToTableau(cards:Card[],target:Card[]){if(!cards.length||!validTableauSequence(cards))return false;const top=target.at(-1);return top?top.faceUp&&top.rank===cards[0].rank+1&&colorOf(top)!==colorOf(cards[0]):cards[0].rank===13;}
export function canMoveToFoundation(card:Card,target:Card[]){const top=target.at(-1);return top?top.suit===card.suit&&card.rank===top.rank+1:card.rank===1;}
function snapshot(s:GameState){const copy=cloneState(s);copy.history=[];return copy;}
function finish(s:GameState){s.won=s.foundations.every(p=>p.length===13);return s;}
export function reduce(state:GameState,action:Action):GameState{
 if(action.type==='undo'){const previous=state.history.at(-1);if(!previous)return state;const restored=cloneState(previous);restored.history=state.history.slice(0,-1);return restored;}
 const next=cloneState(state);next.history=[...state.history,snapshot(state)];next.started=true;
 if(action.type==='draw'){if(!next.stock.length)return state;const card=next.stock.pop()!;card.faceUp=true;next.waste.push(card);next.moves++;return next;}
 if(action.type==='recycle'){if(next.stock.length||!next.waste.length)return state;next.stock=next.waste.reverse().map(c=>({...c,faceUp:false}));next.waste=[];next.moves++;return next;}
 const source=pile(next,action.from),start=action.cardIndex??source.length-1,cards=source.slice(start);if(!cards.length||cards.some(c=>!c.faceUp))return state;
 const target=pile(next,action.to);let valid=false,delta=0;
 if(action.to.type==='tableau'){valid=canMoveToTableau(cards,target);if(valid&&action.from.type==='waste')delta=5;if(valid&&action.from.type==='foundation')delta=-15;}
 if(action.to.type==='foundation'&&cards.length===1){valid=canMoveToFoundation(cards[0],target);if(valid)delta=10;}
 if(!valid)return state;source.splice(start);target.push(...cards);next.score=Math.max(0,next.score+delta);next.moves++;
 if(action.from.type==='tableau'){const exposed=source.at(-1);if(exposed&&!exposed.faceUp){exposed.faceUp=true;next.score+=5;}}
 return finish(next);
}
export function isWon(state:GameState){return state.foundations.every(p=>p.length===13);}
