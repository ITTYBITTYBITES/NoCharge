export interface CollectionMember { game: string; reason: string }
export interface CuratedCollectionData { title: string; inclusionMethod: string; games: CollectionMember[] }
export function validateCuratedCollection(data: CuratedCollectionData, publishedGameIds: ReadonlySet<string>): string[] {
 const errors:string[]=[];
 if(!data.inclusionMethod.trim())errors.push('An inclusion method is required.');
 if(data.games.length<3)errors.push('A published collection requires at least three games.');
 const seen=new Set<string>();
 for(const member of data.games){if(seen.has(member.game))errors.push(`Duplicate game: ${member.game}`);seen.add(member.game);if(!publishedGameIds.has(member.game))errors.push(`Unknown or unpublished game: ${member.game}`);if(member.reason.trim().length<20)errors.push(`A specific inclusion reason is required for ${member.game}.`);}
 return errors;
}
