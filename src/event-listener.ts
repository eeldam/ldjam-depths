interface EventListener<E extends Event> {
  (evt: E): void;
}

export function eventListener<E extends Event>(type: string, shadow = true) {
  return function listener<This extends HTMLElement>(
    target: EventListener<E>,
    context: ClassMethodDecoratorContext<This, (this: This, ...args: any) => any>
  ) {
    context.addInitializer(function (this: This) {
      // only using shadow dom rendering in this app, so need to defer listen
      // for that to be set up
      if (shadow)
        queueMicrotask(() => {
          this.shadowRoot?.addEventListener(type, target.bind(this) as EventListenerOrEventListenerObject)
        });
      else
        this.addEventListener(type, target.bind(this) as EventListenerOrEventListenerObject);
    });
  }
}

export function getElementFromPath(evt: Event): HTMLElement | null {
  const target = evt.composedPath()[0];
  if (target instanceof HTMLElement)
    return target;
  return null;
}

export function getElementFromPoint(from: HTMLElement, evt: PointerEvent): HTMLElement | null {
  let root: ShadowRoot;
  let target: Element | null = from;

  while (target && target.shadowRoot) {
    root = target.shadowRoot;
    const nextTarget = root.elementFromPoint(evt.clientX, evt.clientY);
    if (nextTarget == null || nextTarget === target)
      break;
    target = nextTarget;
  }

  if (target instanceof HTMLElement)
    return target;
  return null;
}
