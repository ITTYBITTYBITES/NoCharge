import type { Card, GameState, Rank, Suit } from './model';
const suits:Suit[]=['spades','hearts','diamonds','clubs'];
export function createDeck():Card[]{return suits.flatMap(suit=>Array.from({length:13},(_,i)=>({id:`${suit}-${i+1}`,suit,rank:(i+1) as Rank,faceUp:false})));}
export function seededRandom(seed:number){let value=seed>>>0;return()=>{value=(value+0x6D2B79F5)|0;let t=Math.imul(value^(value>>>15),1|value);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};}
export function shuffle(seed:number){const deck=createDeck(),random=seededRandom(seed);for(let i=deck.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[deck[i],deck[j]]=[deck[j],deck[i]];}return deck;}
export function deal(seed:number):GameState{const deck=shuffle(seed),tableau:Card[][]=Array.from({length:7},()=>[]);for(let col=0;col<7;col++)for(let row=0;row<=col;row++){const card=deck.pop()!;card.faceUp=row===col;tableau[col].push(card);}return{version:1,seed,tableau,foundations:[[],[],[],[]],stock:deck,waste:[],score:0,moves:0,elapsed:0,started:false,won:false,history:[],preferences:{leftHanded:false,fourColor:false,muted:false}};}
