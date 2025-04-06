import { LitElement, PropertyValues, css, html } from "lit";
import { customElement, state, property } from "lit/decorators.js";

@customElement('a-timer')
export class ATimerElement extends LitElement {
  static styles = css`
    :host {
      display: block;
      font-size: 45px;
      text-align: center;
      padding: 45px 0;
    }

    .ampm {
      font-size: 30px;
    }

    .divider {
      transform: translateY(-5px);
      display: inline-block;
    }
  `;

  @state()
  accessor elapsed = 0;

  @property({ attribute: false })
  accessor ticking = false;

  private isTicking = false;

  interval = 0;

  startingHour = -2;

  connectedCallback(): void {
    super.connectedCallback();
    this.updateTimer();
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    clearInterval(this.interval);
    this.isTicking = false;
  }

  updateTimer() {
    if (this.ticking && !this.isTicking) {
      this.interval = setInterval(() => {
        this.elapsed += 1;
      }, 1000);
      this.isTicking = true;
    } else if (!this.ticking && this.isTicking) {
      clearInterval(this.interval);
      this.isTicking = false;
    }
  }

  protected willUpdate(_changedProperties: PropertyValues): void {
    if (_changedProperties.has('ticking')) {
      this.updateTimer();
    }
  }

  render() {
    let minutes = (this.elapsed % 60).toString();
    if (minutes.length === 1) minutes = '0' + minutes;
    
    const hourCount = this.startingHour + Math.floor(this.elapsed / 60);
    let hours = ((hourCount + 12) % 12 ).toString()
    if (hours === '0') hours = '12';
    if (hours.length === 1) hours = '0' + hours;

    const isPm = (hourCount + 24) % 24 >= 12;

    return html`
      <span class="digit">${hours[0]}</span>
      <span class="digit">${hours[1]}</span>
      <span class="divider">:</span>
      <span class="digit">${minutes[0]}</span>
      <span class="digit">${minutes[1]}</span>
      <span class="ampm">${isPm ? 'PM' : 'AM'}</span>
    `;
  }
}
