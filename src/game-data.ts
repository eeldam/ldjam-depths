export interface WordData {
  text: string,
  draggable: boolean,
}

export type SentenceData = WordData[];

const data = {
  scaries: {} as Record<string, WordData[]>,
  calmies: {} as Record<string, null>,
}

function defineScarySentence(text: string, draggableWords: string[]) {
  const draggables = new Set(draggableWords);
  const wordData = text.split(' ').map(text => ({ text, draggable: draggables.has(text) }));

  data.scaries[text] = wordData;
}

function defineCalmySentence(text: string) {
  data.calmies[text] = null;
}

export function getScary(text: string) {
  return data.scaries[text];
}

export function checkSentence(sentence: SentenceData) {
  const text = sentence.map(word => word.text).join(' ');
  if (text in data.calmies) {
    console.log('found a calmy sentence!');
  }
}


defineScarySentence('what was that noise', ['what', 'was']);
defineScarySentence('some thing is wrong', ['some', 'thing', 'was']);
defineScarySentence('no no no', ['no', 'no', 'no']);

defineCalmySentence('that noise was no thing');
