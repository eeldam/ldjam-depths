import type { AGameElement } from "./elements/a-game.js";

export enum ThoughtType {
  Jumble, // unregocnized
  Empty, // no words
  Bother, // puzzle sentences,
  Calming, // good solution
  Worrying, // bad solution
}

export interface WordData {
  text: string,
}

export type SentenceData = {
  words: WordData[];
  id: number;
}

export type Callback = {
  (sentence: SentenceData, game: AGameElement): Promise<void> | void;
}

interface BotherThought {
  type: ThoughtType.Bother;
  words: WordData[];
  text: string;
}

interface CalmingThought {
  type: ThoughtType.Calming;
  text: string;
  callback: Callback;
}

interface WorryingThought {
  type: ThoughtType.Worrying;
  text: string;
  callback: Callback;
}

type Thought = BotherThought | CalmingThought | WorryingThought;


// TODO this might be a bad idea
let uniqueIndex = 0;
function getUniqueId() {
  return uniqueIndex++;
}

const data = {
  thoughts: {} as Record<string, Thought>,
  bothers: [] as BotherThought[],
}

function definePuzzleSentences(texts: string[]) {
  for (let text of texts)
    definePuzzleSentence(text);
}

function definePuzzleSentence(text: string) {
  const wordData = text.split(' ').map(text => ({ text }));
  const bother = { type: ThoughtType.Bother as const, words: wordData, text };
  Object.freeze(bother.words);
  data.thoughts[text] = bother;
  data.bothers.push(bother);
}

function defineSolutionSentences(texts: string[], callback: Callback = defaultCallback) {
  for (let text of texts)
    defineSolutionSentence(text, callback);
}

function defineSolutionSentence(text: string, callback: Callback = defaultCallback) {
  data.thoughts[text] = { type: ThoughtType.Calming, text, callback };
}

function defineLandmineSentences(texts: string[], callback: Callback = defaultCallback) {
  for (let text of texts)
    defineLandmineSentence(text, callback);
}

function defineLandmineSentence(text: string, callback: Callback = defaultCallback) {
  data.thoughts[text] = { type: ThoughtType.Worrying, text, callback }
}

export function getThought(text: string): SentenceData | null {
  const thought = data.thoughts[text];

  if (thought?.type !== ThoughtType.Bother)
    return null;

  // TODO wire up type so we can have different input types? maybe not needed
  return { words: thought.words.slice(), id: getUniqueId() }
}

export function checkSentence(sentence: SentenceData): ThoughtType {
  if (sentence.words.length === 0)
    return ThoughtType.Empty;

  const text = sentence.words.map(word => word.text).join(' ');
  if (text in data.thoughts) {
    return data.thoughts[text].type;
  }
  return ThoughtType.Jumble;
}

function removeSentence(sentence: SentenceData, game: AGameElement): number {
  const i = game.sentences.indexOf(sentence);
  if (i >= 0)
    game.sentences.splice(i, 1);
  return i;
}

function defaultCallback(sentence: SentenceData, game: AGameElement) {
  removeSentence(sentence, game);
}

// TODO - really not great to do this here, i have no control over timing in the game

export function completeSentence(sentence: SentenceData, game: AGameElement) {
  if (sentence.words.length === 0) {
    removeSentence(sentence, game);
    return;
  }

  const text = sentence.words.map(word => word.text).join(' ');

  const thought = data.thoughts[text];

  if (!thought)
    removeSentence(sentence, game);
  else if (thought.type === ThoughtType.Calming)
    thought.callback(sentence, game);
  else if (thought.type === ThoughtType.Worrying)
    thought.callback(sentence, game);
  else
    removeSentence(sentence, game);
}

/* ------ */

function defineAll(puzzleSentence: string, solutionSentences: string[], landmineSentences: string[]) {
  definePuzzleSentence(puzzleSentence);
  defineSolutionSentences(solutionSentences);
  defineLandmineSentences(landmineSentences);
}

defineAll('did i lock the door',
  ['i did lock the door'],
  ['i did not lock the door'],
);

defineAll('what was that noise',
  [
    'that noise was no thing',
    'that noise was no one',
    'that noise was not any thing',
    'that was just some noise',
  ],
  [
    'that noise was some thing',
    'that noise was some one',
    'that was no noise'
  ],
);

defineAll('is some thing wrong', 
  [
    'no thing is wrong',
  ],
  [
    'some thing is wrong',
  ]
)

definePuzzleSentences([
  'can i get any sleep',
])
defineAll('how will i sleep',
  [
    'i can sleep',
    'i can get sleep',
    'i can get some sleep',
    'i will sleep',
    'i will get sleep',
    'i will get some sleep',
    'just sleep',
    'just get sleep',
    'just get some sleep',
  ],
  [
    'i can not sleep',
    'i can not get sleep',
    'i can not get any sleep',
    'i will not sleep',
    'i will not get sleep',
    'i will not get any sleep',
  ]
)

defineAll('is some one there',
  [
    'no one is there',
    'there is no one',
    'some one is not there',
  ],
  [
    'some one is there',
  ]
)

defineAll('is some thing there',
  [
    'no thing is there',
    'that was no thing',
    'there is not any thing',
  ],
  [
    'some thing is there',
    'there is some thing',
  ]
);

defineAll('how much to do tomorrow',
  [
    'not much to do tomorrow',
  ],
  [
    'so much to do tomorrow',
  ]
);

defineAll('what is wrong with me',
  [
    'no thing is wrong with me',
  ],
  [
    'some thing is wrong with me',
  ]
);

defineAll('can i get comfort able',
  [
    'i am comfort able',
  ],
  [
    'i can not get comfort able',
  ]
);

defineAll('will i get that thing finished',
  [
    'i will get that thing finished',
    'that thing will get finished',
  ],
  [
    'that thing will not get finished',
    'i will not get that finished',
    'that thing will not get finished',
    'that will not get finished',
    'i will not get finished',
  ]
)

defineAll('what am i going to do',
  [
    'i am going to rest',
    'i am going to sleep',
  ],
  [
    'i am not going to sleep',
    'i am not going to rest',
  ]
);

defineAll('what am i worried about',
  [
    'i am not worried',
    'i am not worried about that',
    'i will not get worried',
  ],
  [
    'i am worried about that',
    'i am worried about some thing',
    'i am worried about that thing',
    'i am worried about time',
  ]
)

defineAll('what time is it',
  [
    'it is time for rest',
    'it is time to rest',
    'it is time for sleep',
    'it is time to sleep',
  ],
  [
    'there is not time to sleep',
    'there is not time to rest',
  ]
)
// defineAll('', [], [])

definePuzzleSentences([
  'no no no',
  'no not again',
]);


const botherQueue: BotherThought[] = [];

export function getBother(): SentenceData {
  if (botherQueue.length === 0) {
    for (let bother of data.bothers)
      botherQueue.push(bother);

    for (let i = 0; i < botherQueue.length; i++) {
      const randomIndex = Math.min(botherQueue.length - 1, i + Math.floor(Math.random() * (botherQueue.length - i)));
      const toMove = botherQueue[randomIndex];
      botherQueue[randomIndex] = botherQueue[i];
      botherQueue[i] = toMove;
    }
  }

  const bother = botherQueue.pop()!;
  return { words: bother.words.slice(), id: getUniqueId() }
}

console.log(data.bothers.length, 'bothers');