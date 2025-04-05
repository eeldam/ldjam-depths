import { LitElement, css, html } from "lit";
import { customElement, state } from "lit/decorators.js";
import { keyed } from 'lit/directives/keyed.js';


import './a-sentence.js';
import './a-button.js';
import './a-timer.js';
import { AWordElement } from "./a-word.js";

import { eventListener, getElementFromPath, getElementFromPoint } from "../event-listener.js";
import { getIndexInParent, getParentComponent, sleep } from "../utils.js";
import { ASentenceElement } from "./a-sentence.js";

import { getScary, checkSentence, completeSentence } from '../game-data.js';

import type { PropertyValues } from "lit";
import type { SentenceData } from "../game-data.js";

enum State {
  Start,
  Playing,
  GameOver,
}

@customElement('a-game')
export class AGameElement extends LitElement {
  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      position: absolute;
      left: 0;
      top: 0;
      right: 0;
      bottom: 0;
      touch-action: manipulation;
      overflow: hidden;
    }

    .outer {
      display: flex;
      place-items: center;
      place-content: center;
      min-width: 100%;
      flex: 1 1 auto;
    }

    .inner {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 15px;
    }
  `;

  @state()
  accessor draggedElement: HTMLElement | null = null;

  @state()
  accessor dropTarget: HTMLElement | null = null;

  @state()
  accessor state: State = State.Start;

  sentences: SentenceData[] = [];

  _dropTargetSentenceIndex = -1;
  _dropTargetWordIndex = -1;
  _dragSourceSentenceIndex = -1;
  _dragSourceWordIndex = -1;

  updateDragAndDropIndices() {
    const { dropTarget } = this;
    const dragSourceContainer = this.draggedElement ? getParentComponent(this.draggedElement) : null;

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
      const sentence = getParentComponent(dropTarget);
      this._dropTargetSentenceIndex = sentence ? getIndexInParent(sentence) : -1;
    }
  }

  async loadSentenceData(toLoad: string[]) {
    // TODO - update game state to disallow playing during this?

    for (let sentence of toLoad) {
      console.log('loading', sentence);
      this.sentences.push(getScary(sentence));
      this.requestUpdate();
      await sleep(500);
    }
  }

  willUpdate(changedProperties: PropertyValues) {
    if (changedProperties.has('draggedElement') || changedProperties.has('dropTarget'))
      this.updateDragAndDropIndices();

    if (changedProperties.has('state')) {
      if (this.state === State.Playing)
        this.loadSentenceData(['did i lock the door']);
    }
  }

  render() {
    return html`
      <a-timer></a-timer>
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
    return this.sentences.map((data, i) => {
      const isSentenceDropTarget = this._dropTargetSentenceIndex === i;
      const isSentenceDragSource = this._dragSourceSentenceIndex === i;

      return keyed(data.id, html`<a-sentence
        ?droptarget=${isSentenceDropTarget}
        .words=${data.words.map((wordData, j) => {
          const isDropTarget = isSentenceDropTarget && this._dropTargetWordIndex === j;
          const isDragging = isSentenceDragSource && this._dragSourceWordIndex === j;
          const { text, draggable } = wordData;

          return { text, isDropTarget, isDragging, draggable };
        })}
        index=${i}
        key
      ></a-sentence>`);
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

    if (!target.draggable)
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

    const dropTarget = getElementFromPoint(this, e);
    
    // TODO - do in a more generic way
    // prevent dropping into a sentence that is e.g. animating out
    if (dropTarget) {
      const dropContainer = dropTarget instanceof ASentenceElement ? dropTarget : getParentComponent(dropTarget) as ASentenceElement;
      if (!dropContainer?.locked)
        this.dropTarget = dropTarget;
      else
        this.dropTarget = null;
    } else {
      this.dropTarget = null;
    }

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

    const moved = from.words.splice(dragChunkIndex, 1);

    // TODO - use position to determine where to drop (beginning or end)
    if (dropChunkIndex < 0)
      to.words.push(...moved);
    else
      to.words.splice(dropChunkIndex, 0, ...moved);

    for (let i = 0; i < this.sentences.length; i++) {
      const sentence = this.sentences[i];
      if (!checkSentence(sentence))
        continue;
      
      const el = this.shadowRoot?.querySelector<ASentenceElement>(`a-sentence[index="${i}"]`);
      // TODO lock game during this?
      if (el)
        el.destroy(() => {

        // TODO unlock game
        if (this.sentences[i] !== sentence)
          throw new Error('unexpected sentence change!')

        // TODO - stagger if multiple sentences completed simultatenously?
        completeSentence(sentence, this.sentences);
        this.requestUpdate();
        });
    }

    this.requestUpdate();
  }
}
