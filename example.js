const vhs = require('.')
const { Simple, Timer } = require('./components')

vhs('A simple mounting of some html async/await', async t => {
  const exampleComponent = new Simple('This should be loaded')

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
  const exampleComponent = new Simple('This should be loaded')

  t.element.appendChild(exampleComponent.element)

  setTimeout(() => {
    exampleComponent.element.querySelector('button').click()
    t.end()
  }, 500)
})

vhs.slow('A simple component mounted with a "slow" helper', async t => {
  // mount component and wait for loading
  const timerComponent = new Timer()
  t.element.appendChild(timerComponent.element)
  await t.onload(timerComponent.element)

  // start increment by one each second
  await t.click('button') // => count should be equal to 0
  await t.click('button') // => count should be equal to 5
  t.equal(timerComponent.element.querySelector('#counter').innerText, 'Count: 5')
})
