import type { AGameElement } from "./elements/a-game.js";

export interface WordData {
  text: string,
  draggable: boolean,
}

export type SentenceData = {
  words: WordData[];
  id: number;
}

export type Callback = {
  (sentence: SentenceData, game: AGameElement): Promise<void> | void;
}

// TODO this might be a bad idea
let uniqueIndex = 0;
function getUniqueId() {
  return uniqueIndex++;
}

const data = {
  scaries: {} as Record<string, WordData[]>,
  calmies: {} as Record<string, Callback>,
}

function defineScarySentence(text: string, draggableWords: string[]) {
  const draggables = new Set(draggableWords);
  const wordData = text.split(' ').map(text => ({ text, draggable: draggables.has(text) }));

  data.scaries[text] = wordData;
}

function defineCalmySentence(text: string, mutator: Callback) {
  data.calmies[text] = mutator;
}

export function getScary(text: string): SentenceData {
  return { words: data.scaries[text], id: getUniqueId() }
}

export function checkSentence(sentence: SentenceData) {
  const text = sentence.words.map(word => word.text).join(' ');
  if (text in data.calmies) {
    return true;
  }
  return false;
}

function removeSentence(sentence: SentenceData, game: AGameElement): number {
  const i = game.sentences.indexOf(sentence);
  if (i >= 0)
    game.sentences.splice(i, 1);
  return i;
}

// TODO - really not great to do this here, i have no control over timing in the game

export function completeSentence(sentence: SentenceData, game: AGameElement) {
  const text = sentence.words.map(word => word.text).join(' ');

  const mutator = data.calmies[text];
  if (mutator)
    mutator(sentence, game);
}

defineScarySentence('did i lock the door', ['did']);
defineCalmySentence('i did lock the door', (sentence, game) => {
  removeSentence(sentence, game);
  game.loadSentenceData([
    'what was that noise',
    'some thing is wrong',
    'no no no...',
  ]);
});

defineScarySentence('what was that noise', ['what', 'was']);
defineScarySentence('some thing is wrong', ['some', 'thing', 'was']);
defineScarySentence('no no no...', ['no']);

defineCalmySentence('that noise was no thing', (sentence, game) => {
  removeSentence(sentence, game);
});

defineCalmySentence('no thing is wrong', (sentence, game) => {
  removeSentence(sentence, game);
});
