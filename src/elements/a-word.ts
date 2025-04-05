import { LitElement, css } from "lit";
import { customElement, property } from "lit/decorators.js";

@customElement('a-word')
export class AWordElement extends LitElement {
  static styles = css`
    :host {
      display: inline-block;

      padding: .5em 1em;
      border: 1px solid currentColor;
    }
  `;

  @property({ attribute: false })
  accessor text = '';

  render() {
    return this.text;
  }
}
