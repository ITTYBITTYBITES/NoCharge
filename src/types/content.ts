import type { CollectionEntry } from 'astro:content';

export type GameArtworkData = NonNullable<CollectionEntry<'games'>['data']['artwork']>;
export type GamePresentationData = NonNullable<CollectionEntry<'games'>['data']['presentation']>;
