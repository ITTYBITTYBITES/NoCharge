import{shuffle}from'../deal';import type{Card}from'../model';
export interface TriPeaksState{mode:'tripeaks';seed:number;board:(Card|null)[];stock:Card[];waste:Card[];streak:number;score:number;moves:number;history:TriPeaksState[]}
// Each entry lists cards below that must be removed before this card is exposed.
export const TRI_BLOCKERS:number[][]=[ [3,4],[5,6],[7,8], [9,10],[10,11],[12,13],[13,14],[15,16],[16,17], [18,19],[19,20],[20,21],[21,22],[22,23],[23,24],[24,25],[25,26],[26,27], ...Array.from({length:10},()=>[]) ];
export function dealTriPeaks(seed:number):TriPeaksState{const d=shuffle(seed).map(c=>({...c,faceUp:true}));return{mode:'tripeaks',seed,board:d.splice(0,28),stock:d,waste:[d.pop()!],streak:0,score:0,moves:0,history:[]};}
export function isTriExposed(s:TriPeaksState,index:number){return !!s.board[index]&&TRI_BLOCKERS[index].every(i=>!s.board[i]);}
export function adjacentRank(a:number,b:number){return Math.abs(a-b)===1||a===1&&b===13||a===13&&b===1;}
export function takeTriCard(s:TriPeaksState,index:number){const card=s.board[index],top=s.waste.at(-1);if(!card||!top||!isTriExposed(s,index)||!adjacentRank(card.rank,top.rank))return s;const n=structuredClone(s);n.history=[...s.history,{...structuredClone(s),history:[]}];n.board[index]=null;n.waste.push(card);n.streak++;n.score+=10*n.streak;n.moves++;return n;}
export function drawTriStock(s:TriPeaksState){if(!s.stock.length)return s;const n=structuredClone(s);n.history=[...s.history,{...structuredClone(s),history:[]}];n.waste.push(n.stock.pop()!);n.streak=0;n.moves++;return n;}
export const triPeaksWon=(s:TriPeaksState)=>s.board.every(c=>!c);export const triPeaksLost=(s:TriPeaksState)=>!s.stock.length&&!s.board.some((c,i)=>c&&isTriExposed(s,i)&&adjacentRank(c.rank,s.waste.at(-1)!.rank));
