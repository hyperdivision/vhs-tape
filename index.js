const tape = require('tape')
const onload = require('fast-on-load')

const createElement = document.createElement.bind(document)

const testBody = createElement('div')
testBody.id = 'vhs-test-body'
document.body.appendChild(testBody)

function create (delay, fn) {
  if (!delay) delay = Number(process.env.VHS_DELAY) || 0

  function queueTest (description, testFn) {
    const tpe = fn ? tape[fn].bind(tape) : tape
    tpe(description, t => {
      const testElementGroup = createElement('div')

      const descriptionEl = createElement('div')
      descriptionEl.innerText = description
      testElementGroup.appendChild(descriptionEl)

      const testElement = createElement('div')
      testElement.classList.add('test-element')
      testElementGroup.appendChild(testElement)

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
    return create(0, 'skip')(description, testFn)
  }

  queueTest.slow = function (description, testFn) {
    return create(500)(description, testFn)
  }

  queueTest.only = function (description, testFn) {
    return create(0, 'only')(description, testFn)
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
      },
      async appendChild (el) {
        if (!el) return
        t.element.appendChild(el)
        return t.onload(el)
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
