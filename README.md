# vhs-tape

A [tape](https://github.com/substack/tape) extension for testing frontend components.

![logo][logo]

## Usage

### Writing tests

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

### Running tests

You can run your tests headless witht the CLI:

```console
vhs-tape test.js
# or
vhs-tape '**/*.some.glob.js'
```

### Run your code

_Note_ : You have to install one of those dependencies before running the command line.

#### With [budo](https://github.com/mattdesl/budo)

```
budo --live --open example.js
```

#### With [nanotron](https://github.com/hyperdivision/nanotron)

```
nanotron example.js
```

#### With [tape-run](https://github.com/juliangruber/tape-run) (and browserify)

Tape-run documentation invite us to use [browserify](https://github.com/browserify/browserify)

```
browserify example.js | tape-run
```

## API

WIP See https://github.com/hyperdivision/vhs-tape/blob/master/index.js#L53-L91

Tests are written exactly like tape tests except your test body can be an async function and `t` has the following helpers.

### `vhs = require('vhs-tape')`

Import the vhs test function.  Works almost identically to `tape`, except your test function can be async.  Async test bodies do not need to call `t.done()`, simply return from the async test body, or throw.

### `vhs(description, async testFn)`

Describe your test with a `description` string, and pass an async `testFn` which receives the `t` assertion variable.  This assertion variable includes all of the `tape` helpers, with a few extras that are helpful for testing dom elements and components.

### `vhs.delay(ms)(description, async testFn)`

Delay all vhs-test helpers by `ms`, unless otherwise noted in the test helper description.

### `vhs.slow(description, async testFn)`

Shorthand for `vhs.delay(500)`.

### `vhs.skip(description, async testFn)`

Same as `tape` `t.skip`.

### `vhs.only(description, async testFn)`

Same as `tape` `t.only`.

### `t.element`

The HTMLElement element where your test should work inside.

### `await t.appendChild([parentElOrQuery], el, [msg])`

Takes an element `el`, append it and then waits for onload.  You can also pass a different parent element or query selector `parentElOrQuery` to append to.  Asserts when complete with a `msg`.

```js
const newDiv = document.createElement('div')
newDiv.innerText = 'New div to append'
await t.appendChild(newDiv, 'Appended newDiv')
```

### `await t.removeChild(elementOrQuerySelector, [msg])`

Takes a loaded element `el` or query selector and removes it from its parent element and then waits for onunload.  Asserts when complete with a `msg`.

### `await t.sleep(ms, [msg])`

Async sleep for `ms` and asserts when complete with `msg`.

### `await t.onload(element, [msg])`

Wait for the element to be fully mounted and rendered into the page.

```js
const myElement = document.createElement('div')
t.element.appendChild(myElement)
await t.onload(myElement)
```

### `await t.onunload(element, [msg])`

Same as `t.onload` except it lets you wait for an element to be fully unloaded from the document.

### `await t.raf([msg])`

Lets you wait for an animation frame to fire.  This gives an opportunity for the page to repaint and reflow after making modifications to the DOM.  Always waits for a RequestAnimationFrame and ignores any delay parameters.  Only asserts when passed a `msg`. Does not insert additional delays.

### `await t.delay([msg])`

Similar to `await t.raf()`, except this will sleep when a test delay is set, so you can watch your test in slow motion.  When no delay is set, these will revert to just a `t.raf()`.  Only asserts when passed a `msg`.

### `await t.click(elementOrQuerySelector, [msg])`

Accepts a query selector string that resolves to an element or an element.  Calls `element.click()` followed by a `t.delay()`.

### `await t.focus(elementOrQuerySelector, [msg])`

Accepts a query selector string that resolves to an element or an element.  Calls `element.focus()` followed by a `t.delay()`.

### `await t.blur(elementOrQuerySelector, [msg])`

Accepts a query selector string that resolves to an element or an element.  Calls `element.blur()` followed by a `t.delay()`.

### `await t.type(string, [event], [msg])`

Dispatches `new window.KeyboardEvent` defaulting to the `keydown` event, for each character in `string`.  Helpful for typing into the currently focused element on screen.  This helper is a WIP, and doesn't work everywhere.  Includes a `t.delay()` call so updates are rendered every keypress.

### `await t.typeValue(elementOrQuerySelector, string, [msg])`

Sumulate typing to an `elementOrQuerySelector` by repeatedly setting the value and waiting for a delay.

### `await once(emitter, name, [msg])`

Shortcut to use [`'events.once'`](https://github.com/davidmarkclements/events.once#readme), which is useful for catching events as promises.


## CLI

VSH-Tape ships with a headless test runner that utilizes [browserify](https://github.com/browserify/browserify) and [tape-run](https://github.com/juliangruber/tape-run).

Pass a [glob](https://github.com/isaacs/node-glob) string, or series of glob strings as arguments to locate test files. [Browserify flags](https://github.com/browserify/browserify#usage) are passed at the end after the `--` and tape-run opts are passed as a [`subarg`]() under the `--tape-run` flag.  **Note**: tape-run opts are not aliased.  Refer to the [tape-run README](https://github.com/juliangruber/tape-run#runopts) to see the available options.

If no file glob is passed, the default `'**/*.vhs.js'` is used.  Ensure that you quote your file globs so that your CLI doesn't try to perform a depth limited globbing search instead of the built in globber.

```
Usage:
  vhs-tape '**/*.vhs.js' [opts] --tape-run [tape-run opts] -- [browserify opts]

Options:
  --help, -h                show help message
  --version                 show version
  --tape-run                tape-run subargs
  --ignore                  file globs to ignore default: node_modules/** .git/**
  -- [browserify options]   raw flags to pass to browserify
```

WIP: Interactive test runner

## FAQ

### How do I run vhs-tests?

`vhs-tests` are geared towards a Node.js style common.js environment, so you will need a bundler like browserify or webpack to bundle them into the browser or an electron app.

### How do I load global styles or assumed side effects?

If your components or tests require global styles or sprite sheets to work, write a module that mounts these assets into the page as a side effect of `require`ing or `import`ing that file.

In each test, require the global style module, and your module loading system will de-duplicate the calls to the global side-effects, and each of your tests will still work.

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


## Contributors

- [@tony-go](https://github.com/tony-go) - logo and features

[logo]: https://user-images.githubusercontent.com/22824417/62730546-766bb200-ba20-11e9-9149-9719ac3f7879.png
