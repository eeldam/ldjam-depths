import { LitElement, PropertyValues, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";

@customElement('a-bar')
export class ABarElement extends LitElement {
  static styles = css`
    :host {
      display: inline-block;
      height: 1em;
      width: 100px;
      border: 1px solid currentColor;
      position: relative;

      border-radius: 3px;
    }

    .fill {
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      background-color: currentColor;
      right: var(--right-position);
    }
  `;

  @property({ attribute: false })
  accessor fill = 0;

  @property({ attribute: false })
  accessor max = 100;

  protected willUpdate(_changedProperties: PropertyValues): void {
    const actualFill = Math.max(0, Math.min(this.max, this.fill));
    const fillPercent = 100 - Math.round((actualFill / this.max) * 100);
    this.style.setProperty('--right-position', `${fillPercent}%`);
  }

  render() {
    return html`
      <div class="fill"></div>
    `;
  }
}
