export function getParent(el: HTMLElement): HTMLElement | null {
  return el.parentElement ?? ((el.getRootNode() as ShadowRoot).host as HTMLElement);
}

export function getIndexInParent(el: HTMLElement): number {
  const parent = getParent(el);
  if (!parent)
    return -1;
  const collection: HTMLCollection = parent.shadowRoot ? parent.shadowRoot.children : parent.children;
  return Array.from(collection).indexOf(el);
}
