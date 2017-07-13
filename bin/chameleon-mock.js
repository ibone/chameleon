#!/usr/bin/env node
var chalk = require('chalk')
var gutil = require('gulp-util')
var Liftoff = require('liftoff')
var v8flags = require('v8flags')
var semver = require('semver')
var tildify = require('tildify')
var argv = require('minimist')(process.argv.slice(2))

// Set env var for ORIGINAL cwd
// before anything touches it
process.env.INIT_CWD = process.cwd()

var cli = new Liftoff({
  name: 'getman',
  // completions: completion,
  moduleName: 'getman',
  extensions: { '.json': null },
  v8flags: v8flags
})

// Exit with 0 or 1
var failed = false
process.once('exit', function (code) {
  if (code === 0 && failed) {
    process.exit(1)
  }
})

cli.on('require', function (name) {
  gutil.log('Requiring external module', chalk.magenta(name))
})

cli.on('requireFail', function (name) {
  gutil.log(chalk.red('Failed to load external module'), chalk.magenta(name))
})

cli.on('respawn', function (flags, child) {
  var nodeFlags = chalk.magenta(flags.join(', '))
  var pid = chalk.magenta(child.pid)
  gutil.log('Node flags detected:', nodeFlags)
  gutil.log('Respawned to PID:', pid)
})

cli.launch({
  cwd: argv.cwd,
  configPath: argv.gulpfile,
  require: argv.require,
  completion: argv.completion
}, handleArguments)

/*
var port = argv.p;
if(typeof port != 'number'){
    gutil.log(chalk.red('chameleon need a server port'));
    gutil.log('you can input:    $ chameleon -p 3000');
    process.exit(1);
}
*/

var cliPackage = require('../package')

function handleArguments (env) {
  if (!env.modulePath) {
    gutil.log(
      chalk.red('Local chameleon not found in'),
      chalk.magenta(tildify(env.cwd))
    )
    gutil.log(chalk.red('Try running: npm install mock'))
    process.exit(1)
  }

  if (!env.configPath) {
    gutil.log(chalk.red('No .chameleonrc found'))
    process.exit(1)
  }

  // Check for semver difference between cli and local installation
  if (semver.gt(cliPackage.version, env.modulePackage.version)) {
    gutil.log(chalk.red('Warning: chameleon version mismatch:'))
    gutil.log(chalk.red('Global chameleon is', cliPackage.version))
    gutil.log(chalk.red('Local chameleon is', env.modulePackage.version))
  }

  // Chdir before requiring gulpfile to make sure
  // we let them chdir as needed
  if (process.cwd() !== env.cwd) {
    process.chdir(env.cwd)
    gutil.log(
      'Working directory changed to',
      chalk.magenta(tildify(env.cwd))
    )
  }

  var config = require(env.configPath)
  config.cwd = env.cwd
  if (!config.rootPath) {
    config.rootPath = env.cwd
  }
  gutil.log('Using chameleonfile', chalk.magenta(tildify(env.configPath)))
  var mock = require(env.modulePath)
  mock(config)
}
