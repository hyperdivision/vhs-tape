const MorphComponent = require('hui/morph')
const html = require('hui/html')

// test components

class Simple extends MorphComponent {
  constructor (loadMsg) {
    super()

    this._loadMsg = loadMsg
    this._msg = 'Hello, not mounted yet'
    this._count = 0

    this.onclick = this.onclick.bind(this)
  }

  createElement () {
    return html`
      <div>
        ${this._msg}
        <button onclick=${this.onclick}>Click me</button>
        <div class="counter">Counter: ${this._count}</div>
      </div>
    `
  }

  onload () {
    this._msg = this._loadMsg
    this.update()
  }

  onclick () {
    this._count++
    this.update()
  }
}

class Timer extends MorphComponent {
  constructor () {
    super()
    this._count = 0
    this._isCouting = false
    this.startStop = this.startStop.bind(this)
    this.counter = this.counter.bind(this)
    this._interval = null
  }

  createElement () {
    return html`
      <div>
        <button onclick=${this.startStop}>Click to start timer !</button>
        <p id="counter">Count: ${this._count}</p>
      </div>
    `
  }

  startStop () {
    if (this._isCouting) {
      clearInterval(this.counter)
      this._isCouting = false
      this._interval = null
    } else {
      this._isCouting = true
      this._interval = setInterval(this.counter, 100)
    }
  }

  counter () {
    if (!this._isCouting) return
    this._count++
    this.update()
  }
}

module.exports = {
  Simple,
  Timer
}
