# vhs-tape

A [tape](https://github.com/substack/tape) extension for testing frontend components.

![logo][logo]

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

## API

WIP See https://github.com/hyperdivision/vhs-tape/blob/master/index.js#L53-L91

Tests are written exactly like tape tests except your test body can be an async function and `t` has the following helpers.

### `vhs = require('vhs-tape')`

Import the vhs test function.  Works almost identically to `tape`, except your test function can be async.  Async test bodies do not need to call `t.done()`, simply return from the async test body, or throw.

### `vhs(description, async testFn)`

Describe your test with a `description` string, and pass an async `testFn` which receives the `t` assertion variable.  This assertion variable includes all of the `tape` helpers, with a few extras that are helpful for testig dom elements and components.

### `vhs.delay(ms)(description, async testFn)`

### `vhs.slow(description, async testFn)`

### `vhs.skip(description, async testFn)`

### `vhs.only(description, async testFn)`

### `t.element`

The HTMLElement element where your test should work inside.

### `await t.sleep(ms)`

Async sleepf for `ms`.

### `await t.onload(element)`

Wait for the element to be fully mounted and rendered into the page.

```js
const myElement = document.createElement('div')
t.element.appendChild(myElement)
await t.onload(myElement)
```

### `await t.unload(element)`

Same as `t.onload` except it lets you wait for an element to be fully unloaded from the document.

### `await t.raf()`

Lets you wait for an animation frame to fire.  This gives an opportunity for the page to repaint and reflow after making modifications to the DOM.  Always waits for a RequestAnimationFrame and ignores any delay paramters.

### `await t.delay()`

Similar to `await t.raf()`, except this will sleep when a test delay is set, so you can watch your test in slow motion.  When no delay is set, these will revert to just a `t.raf()`.

### `await t.click(elementOrQuerySelector)`

Accepts a query selector string that resolves to an element or an element.  Calls `element.click()` followed by a `t.delay()`.

### `await t.focus(elementOrQuerySelector)`

Accepts a query selector string that resolves to an element or an element.  Calls `element.focus()` followed by a `t.delay()`.

### `await t.type(string, [event])`

Dispatches `new window.KeyboardEvent` defaulting to the `keydown` event, for each character in `string`.  Helpful for typing into the currently focused element on screen.  This helper is a WIP, and doesn't work everywhere.  Includes a `t.delay()` call so updates are rendered every keypress.

## FAQ

### How do I load global styles or assumed side effects?

If your components or tests require global styles or sprite sheets to work, write a module that mounts these assets into the page as a side effect of `require`ing or `import`ing that file.  

In each test, require the global style module, and your module loadig system will de-duplicate the calls to the global side-effects, and each of your tests will still work. 

```js
// global-styles.css
const css = require('sheetify')
css('./app.css') // Mounts global styles when global-styles.css is imported once
// Be sure that your mounting logic can accomidate your production app and the test document
require('./lib/mount-sprites')(document.querySelector('#sprite-container') || document.body)
```

In each test that needs these assets you would then do the following:

```js
const vhs = require('vhs-tape')
require('../../global-styles')

// vhs('The rest of your tests...
```

Additionally, you can always load a test bundle into a page with styles and spritesheets already mounted, or utilize features in your bundler to hande that insertion for you. 

## See also

https://github.com/choojs/choo/blob/master/index.js
https://github.com/choojs/choo
https://github.com/choojs/nanorouter/blob/master/index.js
https://github.com/choojs/nanohref
https://github.com/rtsao/csjs

## Contributors

- [@tony-go](https://github.com/tony-go) - logo and features

[logo]: https://raw.githubusercontent.com/hyperdivision/vhs-tape/master/logo.png
