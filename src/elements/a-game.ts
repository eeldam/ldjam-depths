import { LitElement, css, html } from "lit";
import { customElement, state } from "lit/decorators.js";
import { keyed } from 'lit/directives/keyed.js';
import { repeat } from 'lit/directives/repeat.js';

import './a-sentence.js';
import './a-button.js';
import './a-timer.js';
import { AWordElement } from "./a-word.js";

import { eventListener, getElementFromPath, getElementFromPoint } from "../event-listener.js";
import { animateOut, animateIn, getIndexInParent, getParentComponent, sleep } from "../utils.js";
import { ASentenceElement } from "./a-sentence.js";

import { getScary, checkSentence, completeSentence } from '../game-data.js';

import type { PropertyValues } from "lit";
import type { SentenceData } from "../game-data.js";

enum State {
  Start,
  HowToPlay,
  BeforePlaying,
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

    .spacer {
      padding: 5px 0 15px;
      display: block;
    }

    .outer.animate-out {
      animation: 1s ease 1 forwards fadeout;
    }

    .outer.animate-in {
      animation: .5s ease 1 backwards fadein;
    }

    @keyframes fadeout {
      0% {
        opacity: 1;
      }

      100% {
        opacity: 0;
      }
    }

    @keyframes fadein {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `;

  @state()
  accessor draggedElement: HTMLElement | null = null;

  @state()
  accessor dropTarget: HTMLElement | null = null;

  @state()
  accessor state: State = State.Start;

  @state()
  accessor animateIn: boolean = false;

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
      else if (this.state === State.BeforePlaying) {
        sleep(3500).then(() => {
          this.transitionScene(State.Playing);
        })
      }
    }
  }

  render() {
    return html`
      <a-timer .ticking=${this.state === State.Playing}></a-timer>
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
      case State.HowToPlay:
        return this.renderHowToPlay();
      case State.BeforePlaying:
        return this.renderBeforePlaying();
      case State.Playing:
        return this.renderPlaying();
      case State.GameOver:
        return this.renderGameOver();
    }
  }

  renderStart() {
    return html`
      <a-button @click=${this.handleStartButton}>Go to sleep...</a-button>
      <div class="spacer">...</div>
      <a-button @click=${this.handleHowToPlayButton}>...what am I doing?</a-button>
    `;
  }

  renderHowToPlay() {
    return html`
      <p>Drag outlined words to reorder them</p>
      ${this.renderSentences()}
      <p>Turn anxious thoughts into calm ones to clear your head</p>

      <div class="spacer"></div>

      <a-button @click=${this.handleStartButton}>Go to sleep...</a-button>
    `;
  }

  renderBeforePlaying() {
    return html`
      just need to clear my head a bit...
    `;
  }

  renderPlaying() {
    return this.renderSentences();
  }

  renderSentences() {
    return repeat(this.sentences, data => data.id, (data, i) => {
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

  // ugly but i don't have time for it
  transitionScene(state: State) {
    if (state === this.state) {
      throw new Error('unexpected state change to existing state');
    }

    const target = this.shadowRoot?.querySelector<HTMLElement>('.outer')!;

    if (!target) {
      this.state = state;
      return;
    }

    animateOut(target, () => {
      this.animateIn = true;
      this.state = state;
      
      animateIn(target, () => {
        this.animateIn = false;
      });
    });
  }

  handleStartButton(e: Event) {
    e.stopPropagation();
    this.transitionScene(State.BeforePlaying);
  }
  
  handleHowToPlayButton(e: Event) {
    e.stopPropagation();
    this.transitionScene(State.HowToPlay);
  }

  _dragData = {
    x: 0,
    y: 0,
    lastX: 0,
    lastY: 0,
    anchor(e: PointerEvent) {
      this.x = e.clientX;
      this.y = e.clientY;
      this.lastX = this.x;
      this.lastY = this.y;
    },
    getTransform(e: PointerEvent) {
      const x = e.clientX - this.x;
      const y = e.clientY - this.y;
      const deltaX = this.lastX - x;
      const deltaY = this.lastY - y;

      const distance = Math.sqrt((deltaX**2) + (deltaY**2));
      this.lastX = x;
      this.lastY = y;

      const normalX = deltaX / distance;
      
      return `scale(1.1) translate(${x}px, ${y}px) rotate(${-normalX * distance}deg)`;
    },

    baseTransform: `scale(1) translate(0px, 0px) rotate(0deg)`,
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
    this.draggedElement.style.transform = this._dragData.baseTransform;
    this.draggedElement.style.zIndex = '100';
    this.dropTarget = getParentComponent(target);
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

    this.draggedElement.style.transform = this._dragData.baseTransform;
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
        completeSentence(sentence, this);
        this.requestUpdate();
        });
    }

    this.requestUpdate();
  }
}
