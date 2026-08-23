export const WORD_LISTS = {
  animals: ['cat','dog','fish','bear','lion','horse','mouse','rabbit','tiger','eagle','whale','shark'],
  nature: ['tree','river','mountain','ocean','forest','valley','desert','cloud','leaf','stone','water','flower'],
  home: ['chair','table','door','window','kitchen','lamp','pillow','blanket','mirror','shelf','candle','clock'],
  food: ['bread','apple','cheese','milk','butter','soup','rice','pasta','honey','grape','lemon','pepper'],
  body: ['hand','eye','foot','head','heart','knee','finger','shoulder','stomach','muscle','bone','skin'],
  travel: ['train','plane','ship','road','bridge','tunnel','harbor','station','ticket','journey','compass','map'],
  science: ['atom','cell','energy','gravity','magnet','oxygen','planet','solar','telescope','volcano','weather','molecule'],
  music: ['song','drum','piano','guitar','violin','melody','rhythm','harmony','chorus','octave','note','tempo'],
} as const;
export type WordListId=keyof typeof WORD_LISTS;
export const DEFAULT_WORD_LIST=[...WORD_LISTS.animals];
