import type { AGameElement } from "./elements/a-game.js";

export enum ThoughtType {
  Jumble, // unregocnized
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

function defaultCallback(sentence: SentenceData, game: AGameElement) {
  removeSentence(sentence, game);
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

definePuzzleSentences([
  'did i lock the door',
  'what was that noise',
  'is some thing wrong',
  'how will i sleep',
  'is some one there',
  'what is wrong with me',
  'can not get comfort able',
  'how much to do tomorrow',
]);

defineSolutionSentences([
  'i did lock the door',
  'that noise was no thing',
  'no thing is wrong',
  'i will sleep',
  'no one is there',
  'no thing is there',
  'no thing is wrong with me',
  'not much to do tomorrow',
]);

defineLandmineSentences([
  'that was no thing',
  'that was no noise',
  'that noise was some thing',
  'there is no way i will sleep',
  'i will not sleep',
  'some thing is very wrong',
  'some thing is wrong with me',
  'so much to do tomorrow',
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
  return { words: bother.words, id: getUniqueId() }
}