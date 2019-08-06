const tape = require('tape')
const onload = require('fast-on-load')
const once = require('events.once')

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
    const tOnce = t.once
    return Object.assign(t, {
      element,
      sleep: (ms, msg) => {
        msg = msg || `Sleep for ${ms}ms`
        const sleepPromise = new Promise((resolve) => setTimeout(resolve, ms))
        return sleepPromise.then(() => t.pass(msg))
      },
      onload: (node, msg = 'Element onload') => new Promise(resolve => {
        const resolveFn = () => {
          onload.delete(node, resolveFn)
          t.delay().then(() => {
            t.pass(msg)
            resolve()
          })
        }
        node.isConnected ? resolveFn() : onload(node, resolveFn)
      }),
      unload: (node, msg = 'Element unload') => new Promise(resolve => {
        const resolveFn = () => {
          onload.delete(node, undefined, resolveFn)
          t.delay().then(() => {
            t.pass(msg)
            resolve()
          })
        }
        !node.isConnected ? resolveFn() : onload(node, undefined, resolveFn)
      }),
      raf: (msg) => {
        const rafPromise = new Promise(resolve => window.requestAnimationFrame(() => resolve()))
        return msg ? rafPromise.then(() => t.pass(msg)) : rafPromise
      },
      delay (msg) {
        const delayPromise = delay ? t.sleep(delay) : t.raf()
        return msg ? delayPromise.then(() => t.pass(msg)) : delayPromise
      },
      click (stringOrElement, msg) {
        msg = msg || `Clicked on ${typeof stringOrElement === 'string' ? stringOrElement : 'element'}`
        toElement(stringOrElement).click()
        return t.delay().then(() => t.pass(msg))
      },
      focus (stringOrElement, msg) {
        msg = msg || `Focused on ${typeof stringOrElement === 'string' ? stringOrElement : 'element'}`
        toElement(stringOrElement).focus()
        return t.delay().then(() => t.pass(msg))
      },
      async type (str, event, msg) {
        if (typeof event === 'string' && !msg) {
          msg = event
          event = null
        }
        msg = msg || `Typed ${str}`
        for (const c of str.split('')) {
          const el = t.element.querySelector(':focus')
          if (!el) return
          await t.delay()
          el.dispatchEvent(new window.KeyboardEvent(event || 'keydown', { key: c }))
        }
        return t.delay().then(() => t.pass(msg))
      },
      async typeValue (stringOrElement, str, msg) {
        msg = msg || `Typed by value ${str}${typeof stringOrElement === 'string' ? ` to ${stringOrElement}` : ''}`
        const el = toElement(stringOrElement)
        for (const c of str.split('')) {
          await t.delay()
          el.value = el.value != null ? el.value + c : c
        }
        return t.delay().then(() => t.pass(msg))
      },
      appendChild (el, msg = 'Appended child to test element') {
        t.element.appendChild(el)
        return t.onload(el, msg).then(t.delay)
      },
      once (emitter, name, msg) {
        // t is expected to be an event emitter
        if (typeof emitter === 'string') return tOnce.call(t, emitter, name)
        msg = msg || `${name} event emitted`
        return once(emitter, name).then(results => {
          return t.delay().then(() => {
            t.pass(msg)
            return results
          })
        })
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
