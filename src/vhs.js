const html = require('hui/html')
const tape = require('tape')

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
    sleep: ms => new Promise((resolve) => setTimeout(resolve, ms))
  })
}
