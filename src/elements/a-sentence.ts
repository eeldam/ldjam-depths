import { LitElement, PropertyValues, css, html } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";

import './a-word.js';

import { animateIn, animateOut, sleep } from "../utils.js";
import { isPair, isDraggable } from "../word-data.js";
import { ThoughtType } from "../game-data.js";


interface SentenceWordData {
  text: string;
  isDropTarget: boolean;
  isDragging: boolean;
}

@customElement('a-sentence')
export class ASentenceElement extends LitElement {
  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
    }
    
    .container {
      transition: background-color .2s ease;
      background-color: transparent;
      border-radius: 15px;
      padding: 10px;
      display: flex;
      flex-wrap: nowrap;
      gap: .5em;
      justify-content: center;
    }

    :host([invaliddrop]) .container {
      background: #842424;
    }

    :host([droptarget]) .container {
      background-color: #424242;
    }

    :host(.animate-in) {
      animation: 1s ease 1 forwards growup;
    }

    :host {
      --pair-border: 1px solid #424242;
    }

    :host(.complete) {
      --pair-border: none;
    }


    a-word {
      transition:
        padding .3s linear,
        margin .3s linear;
    }
    /* Word Pair Stylings */
    a-word.pre-pair {
      padding-right: 0;
      border-right: var(--pair-border);
      border-top-right-radius: 0;
      border-bottom-right-radius: 0;
      margin-right: -.25em;
    }

    a-word.post-pair {
      padding-left: 0;
      border-left: var(--pair-border);
      border-top-left-radius: 0;
      border-bottom-left-radius: 0;
      margin-left: -.25em;
    }

    :host {
      --shift: calc(var(--dragged-element-width) / 2);
    }

    :host([dragsource]) {
      --shift: var(--dragged-element-width);
    }

    :host([invaliddrop]) {
      --shift: 0px;
    }

    a-word.shift-left {
      transform: translateX(var(--shift));
    }

    a-word.shift-right {
      transform: translateX(calc(-1 * var(--shift)));
    }

    a-word.animate-in {
      animation: 2s ease 1 forwards fadein;
    }

    @keyframes fadein {
      0% {
        opacity: 0;
        transform: var(--animate-transform);
      }

      100% {
        opacity: 1;
        transform: translate(0px, 0px);
      }
    }

    @keyframes growup {
      0% {
        height: 0px;
      }

      100% {
        height: var(--animate-height);
      }
    }

    :host(.hide) {
      visibility: hidden;
    }

    :host {
      --type-color: #242424;
    }

    :host(.calming) {
      --type-color: rgb(47 143 255);
    }

    :host(.worrying) {
      --type-color: rgb(255 131 131);
    }

    :host(.complete) .container {
      background: var(--type-color);
    }

    :host(.complete) a-word {
      border-color: transparent;
      background-color: transparent;
      font-weight: 600;
      color: white;
    }

    :host(.animate-out) {
      animation: 2s ease 1 forwards animateout;
    }

    @keyframes animateout {
      0% {
        height: var(--animate-height);
        opacity: 1;
      }

      100% {
        height: 0px;
        opacity: 0;
      }
    }
  `;

  @property({ attribute: false })
  accessor dropIndex = -1;

  @property({ attribute: false })
  accessor dragIndex = -1;

  @property({ type: Boolean })
  accessor droptarget = false;

  @property({ type: Boolean })
  accessor dragsource = false;
  
  @property({ type: Boolean })
  accessor invaliddrop = false;

  @property({ attribute: false })
  accessor words: SentenceWordData[] = [];

  @state()
  accessor locked = true;

  render() {
    let lastData: SentenceWordData | null = null;
    const isDropping = this.dropIndex >= 0;

    return html`
      <div class="container">
        ${this.words.map((data, i) => {
          const beforeWord = lastData;
          lastData = data;
          const nextWord = i < (this.words.length - 1) ? this.words[i + 1] : null;

          /*
          Situations
          1. Dragging in same container, moving left
             the word at the target index ends of to the right
          2. Dragging in same container moving right
             the word at the target index ends up to the left
          3. Dragging into a different container
             the word at the target index ends up to the right
          */

          let isBeforeDrop = false;
          let isAfterDrop = false;
          if (isDropping && !data.isDragging) {
            if (this.dragsource && this.dropIndex > this.dragIndex) {
              isBeforeDrop = this.dropIndex < i;
              isAfterDrop = !isBeforeDrop;
            } else {
              isBeforeDrop = this.dropIndex <= i;
              isAfterDrop = !isBeforeDrop;
            }
          }

          /*
            if not dragging into same container, before elements always shift 1/2 left
            and after always shift 1/2 right

            if dragging into same container, we only want to shift elements that will move
            relative the the dragged element
            i.e. if they are before the drop point but after the drag point
          */
          let shiftLeft = false;
          let shiftRight = false;
          if (isDropping && !data.isDragging) {
            if (this.dragsource) {
              shiftLeft = isBeforeDrop && this.dragIndex >= i;
              shiftRight = isAfterDrop && this.dragIndex < i;
            } else {
              shiftLeft = isBeforeDrop;
              shiftRight = isAfterDrop;
            }
          }

          return html`<a-word
            class=${classMap({
              'shift-left': shiftLeft,
              'shift-right': shiftRight,
              // 'is-drop-index': i === this.dropIndex,
              'pre-pair': !(data.isDragging || !nextWord || nextWord.isDragging) && isPair(data.text, nextWord.text),
              'post-pair': !(data.isDragging || !beforeWord || beforeWord.isDragging) && isPair(beforeWord.text, data.text),
            })}
            ?droptarget=${data.isDropTarget}
            ?dragging=${data.isDragging}
            ?draggable=${isDraggable(data.text) && !this.locked}
            .text=${data.text}
            key=${i}
          ></a-word>`
        })}
      </div>
    `;
  }

  private setAnimationHeight() {
    const rect = this.getBoundingClientRect();
    const height = rect.height;
    this.style.setProperty('--animate-height', `${height}px`);
  }

  static typeToClass: Record<ThoughtType, string> = {
    [ThoughtType.Bother]: 'bother',
    [ThoughtType.Jumble]: 'jumble',
    [ThoughtType.Worrying]: 'worrying',
    [ThoughtType.Calming]: 'calming',
    [ThoughtType.Empty]: 'empty',

  }

  async destroy(type: ThoughtType, callback?: () => void) {
    this.classList.add('complete');
    this.classList.add(ASentenceElement.typeToClass[type]);

    this.locked = true;

    await sleep(1500);
    this.setAnimationHeight();
    animateOut(this, callback);
  }

  protected firstUpdated(_changedProperties: PropertyValues): void {
    this.classList.add('hide');

    queueMicrotask(() => {
      this.classList.remove('hide');

      this.setAnimationHeight();
      animateIn(this, () => {
        this.locked = false;
      });
  
      let animating = 0;

      for (let child of Array.from(this.shadowRoot!.querySelectorAll('a-word'))) {
        if (!(child instanceof LitElement))
          continue;
  
        const randX = Math.random() - .5;
        const randY = Math.random() + 0.1;
        const normalDist = Math.sqrt((randX**2) + (randY**2));
        const randDist = 100 + (Math.random() * 100);
  
        const x = Math.floor((randX / normalDist) * randDist);
        const y = Math.floor((randY / normalDist) * randDist);
  
        child.style.setProperty('--animate-transform', `translate(${x}px, ${y}px)`);
        animating++;
        animateIn(child, () => {
          animating--;
          if (!animating)
            this.recalculateBreakPoints();
        });
      }
    });
  }

  _breakPoints: number[] = [];
  _ownRect: DOMRect | null = null;
  _recalculateKey: string = '';

  updated(changedProperties: PropertyValues) {
    if (!changedProperties.has('words'))
      return;
    const key = this.words.map(w => w.text).join(' ');
    if (key === this._recalculateKey)
      return;
    this._recalculateKey = key;
    this.recalculateBreakPoints();
  }

  recalculateBreakPoints() {
    const elements = this.shadowRoot!.querySelectorAll('a-word');

    this._breakPoints.length = 0;

    // calculate bounds for each word for collision detection
    this._ownRect = this.getBoundingClientRect();
    const containerLeft = this._ownRect.left;
    
    for (let i = 0; i < elements.length; i++) {
      const el = elements[i];
      const rect = el.getBoundingClientRect();
      const { width, left } = rect;
      const leftOffset = left - containerLeft;

      // This should be the center of the element in the container
      this._breakPoints.push((width / 2) + leftOffset);
    }
  }

  getIndexFromPosition(e: PointerEvent) {
    const x = e.clientX - this._ownRect!.left;
    for (let i = 0; i < this._breakPoints.length; i++) {
      if (this._breakPoints[i] > x)
        return i;
    }
    return this._breakPoints.length;
  }
}
