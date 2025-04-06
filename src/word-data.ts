const pairs: Map<string, Set<string>> = new Map();

function definePair(pre: string, post: string) {
  if (!pairs.has(pre))
    pairs.set(pre, new Set([post]));
  else
    pairs.get(pre)!.add(post);
}

export function isPair(pre: string, post: string) {
  return pairs.get(pre)?.has(post) ?? false;
}

definePair('no', 'thing');
definePair('some', 'thing');
definePair('some', 'what');
