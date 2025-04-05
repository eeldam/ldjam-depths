export function getParent(el: HTMLElement): HTMLElement | null {
  return el.parentElement ?? getParentComponent(el);
}

export function getParentComponent(el: HTMLElement): HTMLElement | null {
  return (el.getRootNode() as ShadowRoot).host as HTMLElement;
}

export function getIndexInParent(el: HTMLElement): number {
  const parent = getParent(el);
  if (!parent)
    return -1;
  const collection: HTMLCollection = parent.shadowRoot ? parent.shadowRoot.children : parent.children;
  return Array.from(collection).indexOf(el);
}

export function sleep(ms: number) {
  return new Promise(resolve => {
    setTimeout(() => resolve(null), ms);
  })
}

export function animate(el: HTMLElement, className: string, callback?: () => void) {
  const listener = (_e: AnimationEvent) => {
    el.removeEventListener('animationend', listener);
    el.classList.remove(className);
    if (callback) callback();
  }

  el.addEventListener('animationend', listener);
  el.classList.add(className);
}

export function animateIn(el: HTMLElement, callback?: () => void) {
  animate(el, 'animate-in', callback);
}

export function animateOut(el: HTMLElement, callback?: () => void) {
  animate(el, 'animate-out', callback);
}
