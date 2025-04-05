import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";

import './a-word.js';

interface WordData {
  text: string;
  isDropTarget: boolean;
}

@customElement('a-sentence')
export class ASentenceElement extends LitElement {
  static styles = css`
    :host {
      display: flex;
      flex-wrap: wrap;
      gap: .5em;

      transition: background-color .2s ease;
      background-color: transparent;
      padding: 10px;
      border-radius: 15px;
    }

    :host([droptarget]) {
      background-color: #424242;
    }
  `;

  @property({ type: Boolean })
  accessor droptarget = false;

  @property({ attribute: false })
  accessor words: WordData[] = [];

  render() {
    return this.words.map((data, i) => html`<a-word
      ?droptarget=${data.isDropTarget}
      .text=${data.text}
      key=${i}></a-word>`);
  }
}
