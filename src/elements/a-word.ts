import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";

@customElement('a-word')
export class AWordElement extends LitElement {
  static styles = css`
    :host {
      display: inline-block;

      padding: .5em 1em;
      border: 1px solid currentColor;
      border-radius: 10px;

      cursor: pointer;
      user-select: none;
    }

    :host(:hover) {
      background: red;
      border-color: red;
      color: black;
      font-weight: 600; 
    }

    :host([droptarget]) {
      border: 1px dashed black;
    }

    span {
      pointer-events: none;
    }
  `;

  @property({ attribute: false })
  accessor text = '';

  @property({ type: Boolean })
  accessor droptarget = false;

  render() {
    return html`<span>${this.text}</span>`;
  }
}
