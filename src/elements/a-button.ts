import { LitElement, css, html } from "lit";
import { customElement } from "lit/decorators.js";

import { eventListener } from "../event-listener";

@customElement('a-button')
export class AButtonElement extends LitElement {
  static styles = css`
    :host {
      display: inline-block;

      padding: .5em 1em;
      border: 1px solid currentColor;
      border-radius: 10px;

      cursor: pointer;
      user-select: none;

      font-weight: 600;

      border-width: 1px 2px 4px;

      margin-top: -3px;
    }

    :host(:hover) {
      border-width: 1px 2px 3px;
      margin-top: -2px;
    }
    
    :host(:active) {
      border-width: 1px 2px 1px;
      margin-top: 0;
      box-shadow: 0 2px inset rgba(255, 255, 255, 0.2);
    }

    span {
      pointer-events: none;
    }
  `;

  render() {
    return html`<span><slot></slot></span>`;
  }

  @eventListener('touchstart', false)
  handleTouchStart(e: PointerEvent) {
    if (e.cancelable)
      e.preventDefault();
  }

  @eventListener('pointerup', false)
  handlePointerUp(_e: PointerEvent) {
    this.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
  }
}
