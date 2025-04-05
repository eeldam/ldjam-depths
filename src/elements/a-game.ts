import { LitElement, css, html } from "lit";
import { customElement, state } from "lit/decorators.js";

import './a-sentence.js';
import './a-button.js';
import { AWordElement } from "./a-word.js";

import { eventListener, getElementFromPath, getElementFromPoint } from "../event-listener.js";
import { getIndexInParent, getParent } from "../utils.js";
import { ASentenceElement } from "./a-sentence.js";

enum State {
  Start,
  Playing,
  GameOver,
}

@customElement('a-game')
export class AGameElement extends LitElement {
  static styles = css`
    :host {
      display: block;
      position: absolute;
      left: 0;
      top: 0;
      right: 0;
      bottom: 0;
      touch-action: manipulation;
    }

    .outer {
      display: flex;
      place-items: center;
      place-content: center;
      min-width: 100%;
      min-height: 100%;
    }

    .inner {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 15px;
    }
    

    a-sentence {
      justify-content: center;
    }
  `;

  @state()
  accessor draggedElement: HTMLElement | null = null;

  @state()
  accessor dropTarget: HTMLElement | null = null;

  @state()
  accessor state: State = State.Start;

  sentences: string[][] = [
    'what was that noise'.split(' '),
    'some thing is wrong'.split(' '),
    'no no no'.split(' '),
  ];

  _dropTargetSentenceIndex = -1;
  _dropTargetWordIndex = -1;
  _dragSourceSentenceIndex = -1;
  _dragSourceWordIndex = -1;

  willUpdate() {
    const { dropTarget } = this;
    const dragSourceContainer = this.draggedElement ? getParent(this.draggedElement) : null;
    if (!dropTarget || !this.draggedElement || !dragSourceContainer) {
      this._dropTargetSentenceIndex = -1;
      this._dropTargetWordIndex = -1;
      this._dragSourceSentenceIndex = -1;
      this._dragSourceWordIndex = -1;
      return;
    } 
    
    this._dragSourceSentenceIndex = getIndexInParent(dragSourceContainer);
    this._dragSourceWordIndex = getIndexInParent(this.draggedElement);

    if (dropTarget instanceof ASentenceElement) {
      this._dropTargetSentenceIndex = getIndexInParent(dropTarget);
      this._dropTargetWordIndex = -1;
    } else if (dropTarget instanceof AWordElement) {
      this._dropTargetWordIndex = getIndexInParent(dropTarget);
      const sentence = getParent(dropTarget);
      this._dropTargetSentenceIndex = sentence ? getIndexInParent(sentence) : -1;
    }
  }

  render() {
    return html`
      <div class="outer">
        <div class="inner">
          ${this.renderGameState()}
        </div>
      </div>
    `;
  }

  renderGameState() {
    switch (this.state) {
      case State.Start:
        return this.renderStart();
      case State.Playing:
        return this.renderPlaying();
      case State.GameOver:
        return this.renderGameOver();
    }
  }

  renderStart() {
    return html`
      <a-button @click=${this.handleStartButton}>Go to sleep...</a-button>
    `;
  }

  renderPlaying() {
    return this.sentences.map((words, i) => {
      const isSentenceDropTarget = this._dropTargetSentenceIndex === i;
      const isSentenceDragSource = this._dragSourceSentenceIndex === i;

      return html`<a-sentence
        ?droptarget=${isSentenceDropTarget}
        .words=${words.map((text, j) => {
          const isDropTarget = isSentenceDropTarget && this._dropTargetWordIndex === j;
          const isDragging = isSentenceDragSource && this._dragSourceWordIndex === j;
          return { text, isDropTarget, isDragging };
        })}
        key=${i}></a-sentence>`;
    });
  }

  renderGameOver() {
    return html`
      Game Over
    `;
  }

  handleStartButton(e: Event) {
    e.stopPropagation();

    this.state = State.Playing;
  }

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

  @eventListener('touchstart', false)
  handleTouchStart(e: PointerEvent) {
    if (e.cancelable)
      e.preventDefault();
  }

  @eventListener('pointerdown')
  handlePointerDown(e: PointerEvent) {
    const target = getElementFromPath(e);
    
    if (!(target instanceof AWordElement))
      return;

    this._dragData.anchor(e);

    this.draggedElement = target;
    this.draggedElement.style.transform = `translate(0px, 0px)`;
    this.draggedElement.style.zIndex = '100';
  }

  @eventListener('pointermove')
  handlePointerMove(e: PointerEvent) {
    if (!this.draggedElement)
      return;

    this.dropTarget = getElementFromPoint(this, e);

    this.draggedElement.style.transform = this._dragData.getTransform(e);
    this.draggedElement.style.pointerEvents = 'none';
    this.draggedElement.style.zIndex = 'initial';
  }

  @eventListener('pointerup')
  @eventListener('pointercancel')
  handlePointerUp(_e: PointerEvent) {
    if (!this.draggedElement)
      return;

    if (this._dropTargetSentenceIndex > -1) {
      this.resolveDrop();

    }

    this.draggedElement.style.transform = `translate(0px, 0px)`;
    this.draggedElement.style.pointerEvents = 'initial';
    this.draggedElement = null;
    this.dropTarget = null;
  }

  resolveDrop() {
    if (!this.draggedElement)
      return;

    const dragContainerIndex = this._dragSourceSentenceIndex;
    const dragChunkIndex = this._dragSourceWordIndex;
    const dropContainerIndex = this._dropTargetSentenceIndex;
    const dropChunkIndex = this._dropTargetWordIndex;

    console.log(dragContainerIndex, dragChunkIndex, dropContainerIndex, dropChunkIndex);

    const isDifferentPosition = dragChunkIndex !== dropChunkIndex;
    const isDifferentContainer = dragContainerIndex !== dropContainerIndex;

    if (!(isDifferentContainer || isDifferentPosition))
      return;

    if (!isDifferentContainer && dropChunkIndex < 0)
      return;

    const from = this.sentences[dragContainerIndex];
    if (!from)
      return;
    const to = this.sentences[dropContainerIndex];
    if (!to)
      return;

    const moved = from.splice(dragChunkIndex, 1);

    // TODO - use position to determine where to drop (beginning or end)
    if (dropChunkIndex < 0)
      to.push(...moved);
    else
      to.splice(dropChunkIndex, 0, ...moved);

    this.requestUpdate();
  }
}
