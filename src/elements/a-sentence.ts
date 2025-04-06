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
      flex-wrap: wrap;
      gap: .5em;
      justify-content: center;
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

  @property({ type: Boolean })
  accessor droptarget = false;

  @property({ attribute: false })
  accessor words: SentenceWordData[] = [];

  @state()
  accessor locked = true;

  render() {
    let lastData: SentenceWordData | null = null;

    return html`
      <div class="container">
        ${this.words.map((data, i) => {
          const beforeWord = lastData;
          lastData = data;
          const nextWord = i < (this.words.length - 1) ? this.words[i + 1] : null;



          return html`<a-word
            class=${classMap({
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
        animateIn(child);
      }
    });
  }
}
