import { LitElement, css, html } from "lit";
import { customElement, state } from "lit/decorators.js";

import './a-sentence.js';
import { AWordElement } from "./a-word.js";

import { eventListener, getElementFromPath, getElementFromPoint } from "../event-listener.js";
import { getIndexInParent, getParent } from "../utils.js";
import { ASentenceElement } from "./a-sentence.js";

@customElement('a-game')
export class AGameElement extends LitElement {
  static styles = css`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }

    .outer {
      display: block;
      place-items: center;
      place-content: center;
      min-width: 320px;
      min-height: 100vh;
    }

    .inner {
      display: flex;
      flex-direction: column;
      gap: .5em;
      justify-content: center;

      padding: 16px;
      border: 1px solid;
    }
    

    a-sentence {
      justify-content: center;
    }
  `;

  sentences: string[][] = [
    'what was that noise'.split(' '),
    'some thing is wrong'.split(' '),
    'no no no'.split(' '),
  ];

  _dropTargetSentenceIndex = -1;
  _dropTargetWordIndex = -1;

  willUpdate() {
    const { dropTarget } = this;
    if (!dropTarget) {
      this._dropTargetSentenceIndex = -1;
      this._dropTargetWordIndex = -1;
    } else if (dropTarget instanceof ASentenceElement) {
      this._dropTargetSentenceIndex = getIndexInParent(dropTarget);
      this._dropTargetWordIndex = -1;
    } else if (dropTarget instanceof AWordElement) {
      this._dropTargetWordIndex = getIndexInParent(dropTarget);
      const sentence = getParent(dropTarget);
      this._dropTargetSentenceIndex = sentence ? getIndexInParent(sentence) : -1;
    }

    console.log('updated', dropTarget, this._dropTargetSentenceIndex, this._dropTargetWordIndex);
  }

  render() {
    return html`
      <div class="outer">
        <div class="inner">
          ${this.sentences.map((words, i) => {
            const isSentenceDropTarget = this._dropTargetSentenceIndex === i;
            return html`<a-sentence
              ?droptarget=${isSentenceDropTarget}
              .words=${words.map((text, j) => {
                const isDropTarget = isSentenceDropTarget && this._dropTargetWordIndex === j;
                return { text, isDropTarget };
              })}
              key=${i}></a-sentence>`;
          })}
        </div>
      </div>
    `;
  }

  @state()
  accessor draggedElement: HTMLElement | null = null;

  @state()
  accessor dropTarget: HTMLElement | null = null;

  _dragData = {
    x: 0,
    y: 0,
    anchor(e: PointerEvent) {
      this.x = e.clientX;
      this.y = e.clientY;
    },
    getTransform(e: PointerEvent) {
      const x = e.clientX - this.x;
      const y = e.clientY - this.y;
      return `translate(${x}px, ${y}px)`;
    }
  };

  @eventListener('touchstart')
  handleTouchStart(e: PointerEvent) {
    if (e.cancelable)
      e.preventDefault();
  }

  @eventListener('pointerdown')
  handlePointerDown(e: PointerEvent) {
    console.log('x');
    const target = getElementFromPath(e);
    
    if (!(target instanceof AWordElement))
      return;

    this._dragData.anchor(e);

    this.draggedElement = target;
    this.draggedElement.style.transform = `translate(0px, 0px)`;
  }

  @eventListener('pointermove')
  handlePointerMove(e: PointerEvent) {
    if (!this.draggedElement)
      return;

    this.dropTarget = getElementFromPoint(this, e);

    this.draggedElement.style.transform = this._dragData.getTransform(e);
    this.draggedElement.style.pointerEvents = 'none';
    console.log(1);
  }

  @eventListener('pointerup')
  @eventListener('pointercancel')
  handlePointerUp(_e: PointerEvent) {
    if (!this.draggedElement)
      return;

    this.draggedElement.style.transform = `translate(0px, 0px)`;
    this.draggedElement.style.pointerEvents = 'initial';
    this.draggedElement = null;
  }
}
