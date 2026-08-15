import type { GameState } from './model';
export const SAVE_KEY='nocharge:shattered-foil:v1';
export function serialize(state:GameState){const copy=structuredClone(state);copy.history=copy.history.slice(-20);return JSON.stringify(copy);}
export function parseSave(raw:string|null):GameState|null{if(!raw)return null;try{const value=JSON.parse(raw) as GameState;if(value.version!==1||!Array.isArray(value.tableau)||value.tableau.length!==7||!Array.isArray(value.stock)||!Array.isArray(value.waste)||!Array.isArray(value.foundations)||value.foundations.length!==4)return null;return value;}catch{return null;}}
export function loadSave(){try{return parseSave(localStorage.getItem(SAVE_KEY));}catch{return null;}}
export function saveGame(state:GameState){try{localStorage.setItem(SAVE_KEY,serialize(state));}catch{}}
export function clearSave(){try{localStorage.removeItem(SAVE_KEY);}catch{}}
