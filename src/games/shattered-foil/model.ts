export type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs';
export type Rank = 1|2|3|4|5|6|7|8|9|10|11|12|13;
export type Card = { id:string; suit:Suit; rank:Rank; faceUp:boolean };
export type PileRef = { type:'tableau'; index:number } | { type:'foundation'; index:number } | { type:'waste' };
export type GameState = {
  version:1; seed:number; tableau:Card[][]; foundations:Card[][]; stock:Card[]; waste:Card[];
  score:number; moves:number; elapsed:number; started:boolean; won:boolean; history:GameState[];
  preferences:{leftHanded:boolean;fourColor:boolean;muted:boolean};
};
export type Action =
 | {type:'draw'} | {type:'recycle'} | {type:'move';from:PileRef;to:PileRef;cardIndex?:number}
 | {type:'undo'};
export const colorOf=(card:Card)=>card.suit==='hearts'||card.suit==='diamonds'?'red':'black';
export const cloneState=(state:GameState):GameState=>structuredClone(state);
