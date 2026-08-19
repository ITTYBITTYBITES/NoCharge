import { describe, expect, it } from 'vitest';
import { parseRecentlyPlayed, readRecentlyPlayed, recordRecentlyPlayed, RECENTLY_PLAYED_KEY } from './recently-played';
const memoryStorage=()=>{const values=new Map<string,string>();return {getItem:(k:string)=>values.get(k)??null,setItem:(k:string,v:string)=>void values.set(k,v),values};};
describe('recently played',()=>{
 it('orders newest first, limits to four, and updates duplicates',()=>{const s=memoryStorage();for(let i=1;i<=5;i++)recordRecentlyPlayed(s,`game-${i}`,i);expect(readRecentlyPlayed(s).map(e=>e.gameId)).toEqual(['game-5','game-4','game-3','game-2']);recordRecentlyPlayed(s,'game-3',10);expect(readRecentlyPlayed(s).map(e=>e.gameId)).toEqual(['game-3','game-5','game-4','game-2']);expect(readRecentlyPlayed(s)[0]?.playedAt).toBe(10);});
 it('recovers from malformed and invalid storage',()=>{expect(parseRecentlyPlayed('{bad')).toEqual([]);expect(parseRecentlyPlayed(JSON.stringify([{gameId:'ok',playedAt:2},{gameId:'',playedAt:3},{gameId:'bad',playedAt:'now'}]))).toEqual([{gameId:'ok',playedAt:2}]);});
 it('falls back when storage is unavailable',()=>{const broken={getItem(){throw Error('blocked')},setItem(){throw Error('blocked')}};expect(readRecentlyPlayed(broken)).toEqual([]);expect(recordRecentlyPlayed(broken,'memory-match',7)).toEqual([{gameId:'memory-match',playedAt:7}]);});
 it('uses only the explicit key',()=>{const s=memoryStorage();recordRecentlyPlayed(s,'memory-match',1);expect([...s.values.keys()]).toEqual([RECENTLY_PLAYED_KEY]);});
});
