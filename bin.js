#!/usr/bin/env node

const resolvePath = require('path').resolve
const parseOpts = require('minimist')
const glob = require('glob')
const browserify = require('browserify')
const fromArgs = require('browserify/bin/args')
const run = require('tape-run')
const pump = require('pump')

let args = process.argv.slice(2)

const opts = parseOpts(args, {
  '--': true,
  alias: {
    wait: 'w',
    port: 'p',
    static: 's',
    browser: 'b',
    render: 'r',
    'keep-open': ['k', 'keepOpen'],
    node: ['n', 'node-integration', 'nodeIntegration']
  }
})

const cwd = process.cwd()

const fileSet = new Set()

opts._.forEach(function (arg) {
  // If glob does not match, `files` will be an empty array.
  // Note: `glob.sync` may throw an error and crash the node process.
  var files = glob.sync(arg, {
    ignore: ['node_modules/**', '.git/**']
  })

  if (!Array.isArray(files)) {
    throw new TypeError('unknown error: glob.sync did not return an array or throw. Please report this.')
  }

  files.forEach(function (file) {
    fileSet.add(resolvePath(cwd, file))
  })
})

const browserifyArgs = opts['--']

delete opts['--']
delete opts._

let bundler
if (browserifyArgs && Array.isArray(browserifyArgs)) {
  // CLI args for browserify
  bundler = fromArgs(browserifyArgs, {
    entries: Array.from(fileSet)
  })
} else {
  // just assume JS only options
  bundler = browserify(Array.from(fileSet))
}

const tapeRun = run(opts)
tapeRun.on('results', (results) => {
  process.exit(Number(!results.ok))
})

pump(bundler.bundle(), tapeRun, process.stdout, (err) => {
  if (err) console.error(err)
})
