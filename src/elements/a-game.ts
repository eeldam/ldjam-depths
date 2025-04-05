import { LitElement, css, html } from "lit";
import { customElement } from "lit/decorators.js";

import './a-sentence.js';

@customElement('a-game')
export class AGameElement extends LitElement {
  static styles = css`
    :host {
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

  render() {
    return this.sentences.map((words, i) => html`<a-sentence .words=${words} key=${i}></a-sentence>`);
  }
}
