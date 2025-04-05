import { LitElement, css, html } from "lit";
import { customElement, state } from "lit/decorators.js";

@customElement('a-timer')
export class ATimerElement extends LitElement {
  static styles = css`
    :host {
      display: block;
      font-size: 45px;
      text-align: center;
      padding: 45px 0;
    }
  `;

  @state()
  accessor elapsed = 0;

  interval = 0;

  startingHour = 1;

  connectedCallback(): void {
    super.connectedCallback();
    this.interval = setInterval(() => {
      this.elapsed += 1;
    }, 1000);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    clearInterval(this.interval);
  }

  render() {
    let minutes = (this.elapsed % 60).toString();
    if (minutes.length === 1) minutes = '0' + minutes;
    
    let hours = (this.startingHour + Math.floor(this.elapsed / 60)).toString()
    if (hours.length === 1) hours = '0' + hours;

    return html`
      <span class="digit">${hours[0]}</span>
      <span class="digit">${hours[1]}</span>
      <span class="divider">:</span>
      <span class="digit">${minutes[0]}</span>
      <span class="digit">${minutes[1]}</span>
      <span class="am">AM</span>
    `;
  }
}
