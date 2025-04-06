import type { AGameElement } from "./elements/a-game.js";

export enum ThoughtType {
  Jumble, // unregocnized
  Bother, // puzzle sentences,
  Calming, // good solution
  Worrying, // bad solution
}

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
}

function definePuzzleSentences(text: string, draggableWords: string[]) {
  const draggables = new Set(draggableWords);
  const wordData = text.split(' ').map(text => ({ text, draggable: draggables.has(text) }));

  data.thoughts[text] = { type: ThoughtType.Bother, words: wordData, text };
}

function defineSolutionSentence(text: string, callback: Callback) {
  data.thoughts[text] = { type: ThoughtType.Calming, text, callback };
}

function defineLandmineSentence(text: string, callback: Callback) {
  data.thoughts[text] = { type: ThoughtType.Worrying, text, callback }
}

export function getThought(text: string): SentenceData | null {
  const thought = data.thoughts[text];

  if (thought?.type !== ThoughtType.Bother)
    return null;

  // TODO wire up type so we can have different input types? maybe not needed
  return { words: thought.words, id: getUniqueId() }
}

export function checkSentence(sentence: SentenceData): ThoughtType {
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

// TODO - really not great to do this here, i have no control over timing in the game

export function completeSentence(sentence: SentenceData, game: AGameElement) {
  const text = sentence.words.map(word => word.text).join(' ');

  const thought = data.thoughts[text];

  if (!thought)
    return;

  if (thought.type === ThoughtType.Calming)
    thought.callback(sentence, game);
  else if (thought.type === ThoughtType.Worrying)
    thought.callback(sentence, game);
}

/* ------ */

definePuzzleSentences('did i lock the door', ['did']);
defineSolutionSentence('i did lock the door', (sentence, game) => {
  removeSentence(sentence, game);

  // TODO replace with something that follows from the locked door thread
  game.loadSentenceData([
    'what was that noise',
    'some thing is wrong',
    'no no no...',
  ]);
});

/* ------ */

definePuzzleSentences('some thing is wrong', ['some', 'thing', 'was']);
definePuzzleSentences('no no no...', ['no']);

defineSolutionSentence('no thing is wrong', (sentence, game) => {
  // left over = some no no...
  removeSentence(sentence, game);
});

/* ------ */

definePuzzleSentences('what was that noise', ['what', 'was']);
defineSolutionSentence('that noise was no thing', (sentence, game) => {
  // left over = some what is wrong no no...
  removeSentence(sentence, game);
});

//TODO deduplicate
defineLandmineSentence('that was no noise', (sentence, game) => {
  // TODO - have this call into the game to mark it as a bad thing?
  // then way we do game.loadSentenceData?
  // left over = some thing is wrong what no no...
  // can still do "no thing is wrong" and have "some what no..."
  removeSentence(sentence, game);
  game.loadSentenceData([
    'is some one there',
  ]);
});

// todo - didn't work?
defineLandmineSentence('that noise was some thing', (sentence, game) => {
  // TODO - have this call into the game to mark it as a bad thing?
  // then way we do game.loadSentenceData?
  removeSentence(sentence, game);
  game.loadSentenceData([
    'is some one there',
  ]);
});

/* ------ */

definePuzzleSentences('is some one there', ['is', 'there']);
defineSolutionSentence('no one is there', (sentence, game) => {
  removeSentence(sentence, game);
});

defineLandmineSentence('there is some one', (sentence, game) => {
  removeSentence(sentence, game);
});

defineLandmineSentence('some one is there', (sentence, game) => {
  removeSentence(sentence, game);
});

/* ------ */

defineLandmineSentence('some thing is very wrong', (sentence, game) => {
  // TODO where does the very come from?
  removeSentence(sentence, game);
})
