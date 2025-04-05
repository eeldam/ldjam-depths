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

      background-color: #242424;
    }

    :host(:hover) {
      background: white;
      border-color: white;
      color: black;
    }

    :host([droptarget]) {
      background-color: #848484;
      border-color: #848484;
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
