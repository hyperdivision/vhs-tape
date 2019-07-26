const html = require('hui/html')
const tape = require('tape')
const onload = require('fast-on-load')

const testBody = html`<div id="vhs-test-body"></div>`
document.body.appendChild(testBody)

function create (delay) {
  if (!delay) delay = Number(process.env.VHS_DELAY) || 0

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
        maybePromise.then(t.end).catch(t.end)
      }
    })
  }

  queueTest.delay = function (ms) {
    return create(ms)
  }

  queueTest.skip = function (description, testFn) {
    tape.skip(description, testFn)
  }

  queueTest.slow = function (description, testFn) {
    return create(5000)(description, testFn)
  }

  return queueTest

  function createTestHarness (t, element) {
    return Object.assign(t, {
      element,
      sleep: ms => new Promise((resolve) => setTimeout(resolve, ms)),
      onload: node => new Promise(resolve => {
        const resolveFn = () => {
          onload.delete(node, resolveFn)
          t.delay().then(resolve)
        }
        node.isConnected ? resolveFn() : onload(node, resolveFn)
      }),
      unload: node => new Promise(resolve => {
        const resolveFn = () => {
          onload.delete(node, undefined, resolveFn)
          t.delay().then(resolve)
        }
        !node.isConnected ? resolveFn() : onload(node, undefined, resolveFn)
      }),
      raf: () => new Promise(resolve => window.requestAnimationFrame(() => resolve())),
      delay () {
        return delay ? t.sleep(delay) : t.raf()
      },
      click (stringOrElement) {
        toElement(stringOrElement).click()
        return t.delay()
      },
      focus (stringOrElement) {
        toElement(stringOrElement).focus()
        return t.delay()
      },
      async type (str, event) {
        for (const c of str.split('')) {
          const el = t.element.querySelector(':focus')
          if (!el) return
          await t.delay()
          el.dispatchEvent(new window.KeyboardEvent(event || 'keydown', { key: c }))
        }
        return t.delay()
      }
    })

    function toElement (stringOrElement) {
      if (typeof stringOrElement === 'string') stringOrElement = element.querySelector(stringOrElement)
      if (!(stringOrElement instanceof window.HTMLElement)) throw new Error('stringOrElement needs to be an instance of HTMLElement or a querySelector that resolves to a HTMLElement')
      return stringOrElement
    }
  }
}

module.exports = create(0)
