import { LitElement, css } from "lit";
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
  `;

  @property({ attribute: false })
  accessor text = '';

  @property({ type: Boolean })
  accessor droptarget = false;

  render() {
    return this.text;
  }
}
