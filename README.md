# vhs-tape

An [tape](https://github.com/substack/tape) extension for testing frontend components.

## Usage

```js
const vhs = require('vhs-tape')
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
  await t.onload(exampleComponent.element)

  // t.click takes a query selector rooted from the test element
  await t.click('button')
  t.equal(exampleComponent.element.querySelector('.counter').innerText, 'Counter: 1')

  // t.click also takes an element
  await t.click(t.element.querySelector('button'))
  t.equal(exampleComponent.element.querySelector('.counter').innerText, 'Counter: 2')

  // you can also directly interact with elements but you may need to await t.raf()
  // to wait for updates
  t.element.querySelector('button').click()
  await t.raf()
  t.equal(exampleComponent.element.querySelector('.counter').innerText, 'Counter: 3')
})

vhs('A simple mounting of some html', t => {
  const exampleComponent = new Example('This should be loaded')

  t.element.appendChild(exampleComponent.element)

  setTimeout(() => {
    exampleComponent.element.querySelector('button').click()
    t.end()
  }, 500)
})
```

See example.js for more helper functions.


## See also

https://github.com/choojs/choo/blob/master/index.js
https://github.com/choojs/choo
https://github.com/choojs/nanorouter/blob/master/index.js
https://github.com/choojs/nanohref
https://github.com/rtsao/csjs
