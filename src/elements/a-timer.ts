import { LitElement, PropertyValues, css, html } from "lit";
import { customElement, state, property } from "lit/decorators.js";

@customElement('a-timer')
export class ATimerElement extends LitElement {
  static styles = css`
    :host {
      display: block;
      font-size: 45px;
      text-align: center;
      padding: 20px 0;
    }

    .ampm {
      font-size: 30px;
    }

    .divider {
      transform: translateY(-5px);
      display: inline-block;
    }

    .digit {
      display: inline-block;
      width: .5em;
    }
  `;

  @state()
  accessor elapsed = 0;

  get isTicking() {
    return this.tickRate > 0;
  }

  @property({ attribute: false })
  accessor tickRate = 0;

  @property({ attribute: false })
  accessor onTick: ((timer: ATimerElement) => void) | null = null;

  private isTimerGoing = false;

  timeout = 0;

  startingHour = -2;

  get isHour() { return (this.elapsed % 60) === 0; }

  get hoursPassed() {
    return Math.floor(this.elapsed / 60)
  }

  connectedCallback(): void {
    super.connectedCallback();
    this.updateTimer();
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    clearTimeout(this.timeout);
    this.isTimerGoing = false;
  }

  timerFunction = () => {
    this.elapsed += 1;
    if (this.onTick)
      this.onTick(this);
    if (this.isTimerGoing)
      this.timeout = setTimeout(this.timerFunction, this.tickRate);
  }

  updateTimer() {
    if (this.isTicking && !this.isTimerGoing) {
      this.timeout = setTimeout(this.timerFunction, this.tickRate);
      this.isTimerGoing = true;
    } else if (!this.isTicking && this.isTimerGoing) {
      clearTimeout(this.timeout);
      this.isTimerGoing = false;
    }
  }

  protected willUpdate(_changedProperties: PropertyValues): void {
    if (_changedProperties.has('tickRate')) {
      this.updateTimer();
    }
  }

  render() {
    let minutes = (this.elapsed % 60).toString();
    if (minutes.length === 1) minutes = '0' + minutes;
    
    const hourCount = this.startingHour + this.hoursPassed;
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
