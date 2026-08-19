import {describe,expect,it} from 'vitest';
type GameArticle={kind:'game';game:string};type PlatformArticle={kind:'platform';category:'trust'|'privacy'|'accessibility'|'testing'};const relatedGame=(article:GameArticle|PlatformArticle)=>article.kind==='game'?article.game:undefined;
describe('article metadata compatibility',()=>{it('keeps game-specific associations',()=>expect(relatedGame({kind:'game',game:'memory-match'})).toBe('memory-match'));it('does not assign a game to platform articles',()=>expect(relatedGame({kind:'platform',category:'trust'})).toBeUndefined());});
