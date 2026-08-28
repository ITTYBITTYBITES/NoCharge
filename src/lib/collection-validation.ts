export interface CollectionMember { game: string; reason: string }
export interface CuratedCollectionData { title: string; inclusionMethod: string; games: CollectionMember[] }

/** Machine-checkable member facts used to verify collection inclusion methods (A1/B2). */
export interface CollectionMemberFacts {
  keyboardComplete: boolean;
  pressure: 'timed' | 'untimed' | 'both';
  sessionMax: number;
  players: 'solo' | 'pass-and-play';
  isOriginal: boolean;
  genre: string;
}

const COLLECTION_RULES: Record<string, { key: string; check: (facts: CollectionMemberFacts) => string[] }> = {
  'keyboard-friendly-browser-games': {
    key: 'keyboardComplete',
    check: (facts) => facts.keyboardComplete ? [] : [`${facts.players === 'pass-and-play' ? 'Pass & Play game' : 'Game'} requires pointer or touch (${facts.players})`],
  },
  'untimed-or-reduced-pressure-browser-games': {
    key: 'pressure',
    check: (facts) => facts.pressure === 'timed' ? ['game is timed-only'] : [],
  },
  'games-for-a-short-break': {
    key: 'sessionMax',
    check: (facts) => facts.sessionMax <= 8 ? [] : [`session upper bound ${facts.sessionMax} min exceeds 8 min`],
  },
  'pass-and-play': {
    key: 'players',
    check: (facts) => facts.players === 'pass-and-play' ? [] : ['game is solo, not Pass & Play'],
  },
  'originals-only': {
    key: 'isOriginal',
    check: (facts) => facts.isOriginal ? [] : ['game is a classic or third-party ruleset, not an original'],
  },
};

export function validateCuratedCollection(data: CuratedCollectionData, publishedGameIds: ReadonlySet<string>): string[] {
 const errors:string[]=[];
 if(!data.inclusionMethod.trim())errors.push('An inclusion method is required.');
 if(data.games.length<3)errors.push('A published collection requires at least three games.');
 const seen=new Set<string>();
 for(const member of data.games){if(seen.has(member.game))errors.push(`Duplicate game: ${member.game}`);seen.add(member.game);if(!publishedGameIds.has(member.game))errors.push(`Unknown or unpublished game: ${member.game}`);if(member.reason.trim().length<20)errors.push(`A specific inclusion reason is required for ${member.game}.`);}
 return errors;
}

/** Validate a collection's members against the machine facts in the catalog. */
export function validateCollectionMembership(
  slug: string,
  data: CuratedCollectionData,
  factsById: ReadonlyMap<string, CollectionMemberFacts>,
): string[] {
  const rule = COLLECTION_RULES[slug];
  const errors: string[] = [];
  if (!rule) return errors;
  for (const member of data.games) {
    const facts = factsById.get(member.game);
    if (!facts) continue;
    for (const problem of rule.check(facts)) errors.push(`${member.game}: ${problem}`);
  }
  return errors;
}
