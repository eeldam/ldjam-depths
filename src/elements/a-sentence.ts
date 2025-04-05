import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";

import './a-word.js';

@customElement('a-sentence')
export class ASentenceElement extends LitElement {
  static styles = css`
    :host {
      display: flex;
      flex-wrap: wrap;
      gap: .5em;
    }
  `;

  @property({ attribute: false })
  accessor words: string[] = [];

  render() {
    return this.words.map((text, i) => html`<a-word .text=${text} key=${i}></a-word>`);
  }
}
