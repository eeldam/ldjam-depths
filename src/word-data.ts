const pairs: Map<string, Set<string>> = new Map();

const draggables = new Set<string>();

function definePair(pre: string, post: string) {
  if (!pairs.has(pre))
    pairs.set(pre, new Set([post]));
  else
    pairs.get(pre)!.add(post);

  defineDraggables([ pre, post ]);
}

function defineDraggables(words: string[]) {
  for (let word of words)
    draggables.add(word);
}

export function isPair(pre: string, post: string) {
  return pairs.get(pre)?.has(post) ?? false;
}

export function isDraggable(word: string) {
  return draggables.has(word);
}

definePair('no', 'thing');
definePair('no', 'one');
definePair('some', 'thing');
definePair('some', 'what');
definePair('some', 'one');
definePair('comfort', 'able');
definePair('can', 'not');
definePair('any', 'thing');

defineDraggables([
  'did',
  'was',
  'were',
  'not',
  'no',
  'there',
  'very',
  'so',
  'will',
  'who',
  'what',
  'when',
  'where',
  'why',
  'how',
  'rest',
  'sleep',
  'that',
  'am',
]);
