import { LitElement, PropertyValues, css, html } from "lit";
import { customElement, property, state } from "lit/decorators.js";

import './a-word.js';

import { animateIn, animateOut, sleep } from "../utils.js";

interface WordData {
  text: string;
  isDropTarget: boolean;
  isDragging: boolean;
  draggable: boolean;
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

    :host(.complete) .container {
      background: rgb(47 143 255);
      /* background: rgb(39 131 239); */
    }

    :host(.complete) a-word {
      border-color: transparent;
      background-color: transparent;
      font-weight: 600;
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
  accessor words: WordData[] = [];

  @state()
  accessor locked = true;

  render() {
    return html`
      <div class="container">
        ${this.words.map((data, i) => html`<a-word
          ?droptarget=${data.isDropTarget}
          ?dragging=${data.isDragging}
          ?draggable=${data.draggable && !this.locked}
          .text=${data.text}
          key=${i}></a-word>`)}
      </div>
    `;
  }

  private setAnimationHeight() {
    const rect = this.getBoundingClientRect();
    const height = rect.height;
    this.style.setProperty('--animate-height', `${height}px`);
  }

  async destroy(callback?: () => void) {
    this.classList.add('complete');
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
