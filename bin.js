#!/usr/bin/env node

const resolvePath = require('path').resolve
const subarg = require('subarg')
const glob = require('glob')
const browserify = require('browserify')
const fromArgs = require('browserify/bin/args')
const run = require('tape-run')
const pump = require('pump')
const pkg = require('./package.json')

let args = process.argv.slice(2)

const opts = subarg(args, {
  '--': true,
  default: {
    ignore: ['node_modules/**', '.git/**']
  },
  alias: {
    version: ['v'],
    help: ['h']
  }
})

if (opts.help) {
  console.log(`Usage:
  vhs-tape '**/*.vhs.js' [opts] --tape-run [tape-run opts] -- [browserify opts]

Options:
  --help, -h                show help message
  --version                 show version
  --tape-run                tape-run subargs
  --ignore                  file globs to ignore default: 'node_modules/** .git/**'
  -- [browserify options]   raw flags to pass to browserify`)
  process.exit(0)
}

if (opts.version) {
  console.log(`vhs-tape v${pkg.version}`)
  process.exit(0)
}

if (opts._.length < 1) {
  opts._.push('**/*.vhs.js')
}

const cwd = process.cwd()

const fileSet = new Set()

opts._.forEach(function (arg) {
  // If glob does not match, `files` will be an empty array.
  // Note: `glob.sync` may throw an error and crash the node process.
  var files = glob.sync(arg, {
    ignore: opts.ignore
  })

  if (!Array.isArray(files)) {
    throw new TypeError('unknown error: glob.sync did not return an array or throw. Please report this.')
  }

  files.forEach(function (file) {
    fileSet.add(resolvePath(cwd, file))
  })
})

if (Array.from(fileSet).length < 1) {
  console.error('No tests found')
  process.exit(1)
}

const browserifyArgs = opts['--']
const tapeRunOpts = opts['tape-run']

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

const tapeRun = run(tapeRunOpts)
tapeRun.on('results', (results) => {
  process.exit(Number(!results.ok))
})

pump(bundler.bundle(), tapeRun, process.stdout, (err) => {
  if (err) {
    console.error(err)
    process.exit(1)
  }
})
