export interface WordData {
  text: string,
  draggable: boolean,
}

export type SentenceData = {
  words: WordData[];
  id: number;
}

export type SentenceMutator = {
  (sentences: SentenceData[], i: number): void;
}

// TODO this might be a bad idea
let uniqueIndex = 0;
function getUniqueId() {
  return uniqueIndex++;
}

const data = {
  scaries: {} as Record<string, WordData[]>,
  calmies: {} as Record<string, SentenceMutator>,
}

function defineScarySentence(text: string, draggableWords: string[]) {
  const draggables = new Set(draggableWords);
  const wordData = text.split(' ').map(text => ({ text, draggable: draggables.has(text) }));

  data.scaries[text] = wordData;
}

function defineCalmySentence(text: string, mutator: SentenceMutator = () => {}) {
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

// TODO - really not great to do this here, i have no control over timing in the game

export function completeSentence(sentence: SentenceData, sentences: SentenceData[]) {
  const text = sentence.words.map(word => word.text).join(' ');

  const mutator = data.calmies[text];
  if (!mutator)
    return;

  const i = sentences.indexOf(sentence);
  if (i >= 0)
    sentences.splice(i, 1);

  mutator(sentences, i);
}

defineScarySentence('did i lock the door', ['did']);
defineCalmySentence('i did lock the door', (sentences, _i) => {
  sentences.push(getScary('what was that noise'));
  sentences.push(getScary('some thing is wrong'));
  sentences.push(getScary('no no no...'));
});

defineScarySentence('what was that noise', ['what', 'was']);
defineScarySentence('some thing is wrong', ['some', 'thing', 'was']);
defineScarySentence('no no no...', ['no']);

defineCalmySentence('that noise was no thing', (_sentences, _i) => {

});

defineCalmySentence('no thing is wrong', (_sentences, _i) => {

});
