const html = require('hui/html')
const tape = require('tape')
const onload = require('fast-on-load')

const testBody = html`<div id="vhs-test-body"></div>`
document.body.appendChild(testBody)

function queueTest (description, testFn) {
  tape(description, t => {
    const testElementGroup = html`<div>
      <div>${description}</div>
        <div class="test-element"></div>
      </div>`
    const testElement = testElementGroup.querySelector('.test-element')

    testBody.appendChild(testElementGroup)
    const maybePromise = testFn(createTestHarness(t, testElement))
    if (maybePromise && maybePromise.then) {
      maybePromise.then(t.end).catch(t.error)
    }
  })
}

module.exports = queueTest

function createTestHarness (t, element) {
  return Object.assign(t, {
    element,
    sleep: ms => new Promise((resolve) => setTimeout(resolve, ms)),
    onload: node => new Promise(resolve => {
      const resolveFn = () => {
        onload.delete(node, resolveFn)
        resolve()
      }
      node.isConnected ? resolveFn() : onload(node, resolveFn)
    }),
    unload: node => new Promise(resolve => {
      const resolveFn = () => {
        onload.delete(node, undefined, resolveFn)
        resolve()
      }
      !node.isConnected ? resolveFn() : onload(node, undefined, resolveFn)
    }),
    raf: () => new Promise(resolve => window.requestAnimationFrame(() => resolve())),
    click: (stringOrElement) => new Promise((resolve, reject) => {
      if (typeof stringOrElement === 'string') stringOrElement = element.querySelector(stringOrElement)
      if (!(stringOrElement instanceof window.HTMLElement)) return reject(new Error('stringOrElement needs to be an instance of HTMLElement or a querySelector that resolves to a HTMLElement'))
      const el = stringOrElement
      el.click()
      window.requestAnimationFrame(() => resolve())
    })
  })
}
