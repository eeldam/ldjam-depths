import { LitElement, css, html } from "lit";
import { customElement, state } from "lit/decorators.js";
import { keyed } from 'lit/directives/keyed.js';
import { repeat } from 'lit/directives/repeat.js';
import { classMap } from "lit/directives/class-map.js";

import './a-sentence.js';
import './a-button.js';
import './a-timer.js';
import './a-bar.js';
import { AWordElement } from "./a-word.js";

import { eventListener, getElementFromPath, getElementFromPoint } from "../event-listener.js";
import { animateOut, animateIn, getIndexInParent, getParentComponent, sleep } from "../utils.js";
import { ASentenceElement } from "./a-sentence.js";
import { checkSentence, completeSentence, ThoughtType, getBother } from '../game-data.js';

import type { PropertyValues } from "lit";
import type { SentenceData } from "../game-data.js";
import { ATimerElement } from "./a-timer.js";

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

      transition: background-color 1s linear;
      background-color: var(--bg-color);
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
      text-align: center;
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

    .stats {
      text-align: center;
      padding-bottom: 5px;
    }
    
    .stats a-bar {
      opacity: 1;
      transition: opacity .5s ease;
      height: 5px;
    }

    .stats .hidden {
      opacity: .2;
    }

    .pause {
      position: absolute;
      top: 0;
      right: 0;
    }
  `;

  @state()
  accessor draggedElement: HTMLElement | null = null;

  @state()
  accessor dropTarget: HTMLElement | null = null;

  @state()
  accessor state: State = State.Start;

  @state()
  accessor timeToNextThought = 0;

  timeBetweenThoughts = 10;
  newThoughtCooldown = 5;

  @state()
  accessor sleepLevel = 1; // range 0 - 4;

  @state()
  accessor rest = 0;

  @state()
  accessor animateIn: boolean = false;

  @state()
  accessor paused = true;

  sentences: SentenceData[] = [];

  maxThoughts = 6;

  _dropTargetSentenceIndex = -1;
  _dropTargetWordIndex = -1;
  _dragSourceSentenceIndex = -1;
  _dragSourceWordIndex = -1;
  _isValidDropTarget = false;

  maxSentenceLength = 6;

  updateDragAndDropIndices() {
    const { dropTarget } = this;
    const dragSourceContainer = this.draggedElement ? getParentComponent(this.draggedElement) : null;

    if (!dropTarget || !this.draggedElement || !dragSourceContainer) {
      this._dropTargetSentenceIndex = -1;
      this._dropTargetWordIndex = -1;
      this._dragSourceSentenceIndex = -1;
      this._dragSourceWordIndex = -1;
      this._isValidDropTarget = false;
      return;
    } 
    
    this._dragSourceSentenceIndex = getIndexInParent(dragSourceContainer);
    this._dragSourceWordIndex = getIndexInParent(this.draggedElement);

    if (dropTarget instanceof ASentenceElement) {
      this._dropTargetSentenceIndex = getIndexInParent(dropTarget);
      this._dropTargetWordIndex = -1;
      this._isValidDropTarget = dropTarget.words.length < this.maxSentenceLength;
    } else if (dropTarget instanceof AWordElement) {
      this._dropTargetWordIndex = getIndexInParent(dropTarget);
      const sentence = getParentComponent(dropTarget) as (ASentenceElement | null);
      this._dropTargetSentenceIndex = sentence ? getIndexInParent(sentence) : -1;
      this._isValidDropTarget = sentence ? sentence.words.length < this.maxSentenceLength : false;
    }

    this._isValidDropTarget = this._isValidDropTarget || (this._dragSourceSentenceIndex === this._dropTargetSentenceIndex);
  }

  async loadBother(count: number = 1) {
    // TODO - update game state to disallow playing during this?
    if (count < 1) return;

    for (let i = 0; i < count; i++) {
      if (this.sentences.length >= this.maxThoughts) {
        this.destroySentence(0, ThoughtType.Worrying);
        this.sleepLevel = Math.max(0, this.sleepLevel - 1);
      }

      const sentence = getBother();
      this.sentences.push(sentence)
      this.requestUpdate();
      await sleep(1000);
    }
  }

  willUpdate(changedProperties: PropertyValues) {
    if (changedProperties.has('draggedElement') || changedProperties.has('dropTarget'))
      this.updateDragAndDropIndices();

    if (changedProperties.has('state')) {
      if (this.state === State.Playing) {
        this.resetTimeToNextThought();
        this.loadBother(2);
      }
      else if (this.state === State.BeforePlaying) {
        // gross!
        const timer = this.shadowRoot?.querySelector<ATimerElement>('a-timer');
        if (timer)
          timer.elapsed = 0;
        this.rest = 0;
        this.sleepLevel = 1;
        this.setSleepLevelStyles(1);

        sleep(3500).then(() => {
          this.transitionScene(State.Playing);
        })
      } else if (this.state === State.GameOver) {
        this.setSleepLevelStyles(0);
      } else {
        this.setSleepLevelStyles(4);
      }
    }

    if (changedProperties.has('sleepLevel')) {
      this.setSleepLevelStyles(this.sleepLevel);
    }
  }
  
  _tickRate = 500;

  setSleepLevelStyles(value: number) {
    this.style.setProperty('--blur-level', `blur(${value}px)`);

    let backgroundColor: string;
    if (value >= 4) {
      backgroundColor = 'rgb(0 0 0)';
      this._tickRate = 1000;
    } else if (value === 3) {
      backgroundColor = 'rgb(31 23 31)';
      this._tickRate = 850;
    } else if (value === 2) {
      backgroundColor = 'rgb(47 31 44)';
      this._tickRate = 700;
    } else if (value === 1) {
      backgroundColor = 'rgb(59 35 47)';
      this._tickRate = 550;
    } else {
      backgroundColor = 'rgb(79 44 47)';
      this._tickRate = 400;
    }
    this.style.setProperty('--bg-color', backgroundColor);
  }

  maxTicks = 60 * 8;

  onTimerTick = (_timer: ATimerElement) => {
    if (_timer.elapsed >= this.maxTicks)
      return this.transitionScene(State.GameOver);
    // either 2 ** sleep
    // = 1, 2, 4, 8, 16 [32]
    // or 2**sleep - 1
    // = 0, 1, 3, 7, 15
    // or sleep ** 2
    // = 0, 1, 4, 9, 16 [25]
    this.rest += (2 ** this.sleepLevel) - 1;

    if (this.timeToNextThought)
      this.timeToNextThought -= 1;

    if (this.timeToNextThought <= 0) {
      if (this.sleepLevel === 0)
        this.sleepLevel = 1;
      if (this.sleepLevel > 1)
        this.sleepLevel -= 1;
      this.loadBother(1);
      this.resetTimeToNextThought();
    }
  }

  resetTimeToNextThought() {
    this.timeToNextThought = this.timeBetweenThoughts + this.newThoughtCooldown;
  }

  get timerTickRate() {
    if (this.state !== State.Playing || this.paused)
      return 0;
    // TODO make dynamic? this scale brings it from 8 minutes down to 4 for a full game
    return this._tickRate;
  }

  handlePause(_e: PointerEvent) {
    this.paused = !this.paused;
  }

  render() {
    return html`
      <a-timer .tickRate=${this.timerTickRate} .onTick=${this.onTimerTick}></a-timer>
      <button class="pause" @click=${this.handlePause}>${this.paused ? '▸' : '⏸'}</button>
      <div class="outer">
        <div class="inner">
          ${this.renderGameState()}
        </div>
      </div>
      <div class="stats">
        <a-bar
          class=${classMap({ hidden: this.timeToNextThought > this.timeBetweenThoughts || this.state !== State.Playing })}
          .fill=${this.timeToNextThought} .max=${this.timeBetweenThoughts}></a-bar>
        <br>
        Sleep Level: ${this.sleepLevel}
        <br>
        (+${(2 ** this.sleepLevel) - 1} rest/min)
        <br>
        Rest: ${this.rest}
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
      
      <p>Create calm thoughts to reach deeper sleep</p>
      
      <p>Avoid creating upsetting thoughts</p>

      <p>Thoughts can't get too complicated</p>

      <p>Keep your mind clear</p>

      <p>Try to get as much rest as possible before morning</p>

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
        ?droptarget=${isSentenceDropTarget && this._isValidDropTarget}
        ?invaliddrop=${isSentenceDropTarget && !this._isValidDropTarget}
        .words=${data.words.map((wordData, j) => {
          const isDropTarget = isSentenceDropTarget && this._dropTargetWordIndex === j;
          const isDragging = isSentenceDragSource && this._dragSourceWordIndex === j;
          const { text } = wordData;

          return { text, isDropTarget, isDragging };
        })}
        index=${i}
      ></a-sentence>`);
    });
  }

  renderGameOver() {
    return html`
      ...time to get up.
      <div class="spacer"></div>
      I feel...
      <div class="spacer"></div>
      <strong>${this.getRestLevel()}</strong><br>
      <em>Score: ${this.rest}</em>
      <div class="spacer">...</div>
      <a-button @click=${this.handleStartButton}>Try again...</a-button>
    `;
  }

  getRestLevel() {
    /*
    baseline = 480
    theoretical best = 15 * 480 = 7200

    Based on an actual good nights sleep:
    l1 = 5% = 24 * 1 = 24
    l2 = 45% = 216 * 3 = 648
    l3 = 25% = 120 * 7 = 840
    l4 = 25% = 120 * 15 = 1800
    total = 3312

    */

    const { rest } = this;

    if (rest < 480)
      return 'miserable';
    if (rest < 960)
      return 'terrible';
    if (rest < (3312 * .5))
      return 'bad';
    if (rest < 3312)
      return 'ok';
    if (rest < (3312 * 1.25))
      return 'good';
    if (rest < (3312 * 1.5))
      return 'great';
    if (rest < (3312 * 1.75))
      return 'amazing';
    if (rest < 7200)
      return 'incredible';
    return 'impossibly good';
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
      this.lastX = 0;
      this.lastY = 0;
    },
    getTransform(e: PointerEvent) {
      const x = e.clientX - this.x;
      const y = e.clientY - this.y;
      const deltaX = this.lastX - x;
      const deltaY = this.lastY - y;

      const distance =  Math.sqrt((deltaX**2) + (deltaY**2));
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
    if (!this.draggedElement || !this._isValidDropTarget)
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

    let anyCompleted = false;

    for (let i = 0; i < this.sentences.length; i++) {
      const sentence = this.sentences[i];

      const thoughtType = checkSentence(sentence);
      if (thoughtType === ThoughtType.Jumble || thoughtType === ThoughtType.Bother)
        continue;

      anyCompleted = true;

      if (thoughtType === ThoughtType.Calming)
        this.sleepLevel = Math.min(4, this.sleepLevel + 1);
      else if (thoughtType === ThoughtType.Worrying)
        this.sleepLevel = Math.max(0, this.sleepLevel - 1);
      
      this.destroySentence(i, thoughtType);
    }

    if (anyCompleted)
      this.resetTimeToNextThought();

    this.requestUpdate();
  }

  destroySentence(i: number, asType: ThoughtType) {
    const sentence = this.sentences[i];
    const el = this.shadowRoot?.querySelector<ASentenceElement>(`a-sentence[index="${i}"]`);
    // TODO lock game during this?
    if (el)
      el.destroy(asType, () => {

      // TODO unlock game
      // TODO - there's a definite race condition here, but I don't think it really matters?
      // if (this.sentences[i] !== sentence)
      //   throw new Error('unexpected sentence change!')

      // TODO - stagger if multiple sentences completed simultatenously?
      completeSentence(sentence, this);
      this.requestUpdate();
    });
  }
}
