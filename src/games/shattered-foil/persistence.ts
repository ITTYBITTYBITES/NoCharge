import type { GameState } from './model';
import { deleteRecord, getAllRecords, klondikeSession, putRecord, validateSession, type SessionRecord } from './storage/db';
export const LEGACY_SAVE_KEY='nocharge:shattered-foil:v1';
export function serialize(state:GameState){const copy=structuredClone(state);copy.history=copy.history.slice(-50);return JSON.stringify(copy);}
export function parseSave(raw:string|null):GameState|null{if(!raw)return null;try{const value=JSON.parse(raw) as GameState;if(value.version!==1||!Array.isArray(value.tableau)||value.tableau.length!==7||!Array.isArray(value.stock)||!Array.isArray(value.waste)||!Array.isArray(value.foundations)||value.foundations.length!==4)return null;return value;}catch{return null;}}
export async function loadLatestSave():Promise<GameState|null>{const sessions=await getAllRecords<SessionRecord>('sessions');const valid=sessions.filter(validateSession).filter(s=>s.mode==='klondike'&&s.status==='active').sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt));if(valid[0]?.state)return valid[0].state as GameState;try{const legacy=parseSave(localStorage.getItem(LEGACY_SAVE_KEY));if(legacy){await saveGame(legacy);localStorage.removeItem(LEGACY_SAVE_KEY);return legacy;}}catch{}return null;}
export async function saveGame(state:GameState){try{await putRecord('sessions',klondikeSession(state));}catch(error){console.warn('Shattered Foil autosave unavailable',error);}}
export async function clearSave(){await deleteRecord('sessions','klondike-active');}
