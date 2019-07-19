const vhs = require('./src/vhs')
const MorphComponent = require('hui/morph')
const html = require('hui/html')

class Example extends MorphComponent {
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

vhs('A simple mounting of some html async/await', async t => {
  const exampleComponent = new Example('This should be loaded')

  t.element.appendChild(exampleComponent.element)
  await t.sleep(500)
  exampleComponent.element.querySelector('button').click()
  await t.sleep(500)
  t.equal(exampleComponent.element.querySelector('.counter').innerText, 'Counter: 1')
})

vhs('A simple mounting of some html', t => {
  const exampleComponent = new Example('This should be loaded')

  t.element.appendChild(exampleComponent.element)

  setTimeout(() => {
    exampleComponent.element.querySelector('button').click()
    t.end()
  }, 500)
})
