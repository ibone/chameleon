#!/usr/bin/env node

'use strict';
var chalk = require('chalk');
var gutil = require('gulp-util');
var interpret = require('interpret');
var Liftoff = require('liftoff');
var v8flags = require('v8flags');
var tildify = require('tildify');
//var completion = require('../lib/completion');
var argv = require('minimist')(process.argv.slice(2));

// Set env var for ORIGINAL cwd
// before anything touches it
process.env.INIT_CWD = process.cwd();

var cli = new Liftoff({
  name: 'chameleon',
  //completions: completion,
  extensions: interpret.jsVariants,
  v8flags: v8flags,
});

// Exit with 0 or 1
var failed = false;
process.once('exit', function(code) {
  if (code === 0 && failed) {
    process.exit(1);
  }
});


cli.on('require', function(name) {
  gutil.log('Requiring external module', chalk.magenta(name));
});

cli.on('requireFail', function(name) {
  gutil.log(chalk.red('Failed to load external module'), chalk.magenta(name));
});

cli.on('respawn', function(flags, child) {
  var nodeFlags = chalk.magenta(flags.join(', '));
  var pid = chalk.magenta(child.pid);
  gutil.log('Node flags detected:', nodeFlags);
  gutil.log('Respawned to PID:', pid);
});

cli.launch({
  cwd: argv.cwd,
  configPath: argv.gulpfile,
  require: argv.require,
  completion: argv.completion,
}, handleArguments);

var tasks = argv._;

function handleArguments(env) {
  if (versionFlag && tasks.length === 0) {
    gutil.log('CLI version', cliPackage.version);
    process.exit(0);
  }

  if (!env.modulePath) {
    gutil.log(
      chalk.red('Local chameleon not found in'),
      chalk.magenta(tildify(env.cwd))
    );
    gutil.log(chalk.red('Try running: npm install chameleon'));
    process.exit(1);
  }

  if (!env.configPath) {
    gutil.log(chalk.red('No chameleonfile found'));
    process.exit(1);
  }

  // Check for semver difference between cli and local installation
  if (semver.gt(cliPackage.version, env.modulePackage.version)) {
    gutil.log(chalk.red('Warning: chameleon version mismatch:'));
    gutil.log(chalk.red('Global chameleon is', cliPackage.version));
    gutil.log(chalk.red('Local chameleon is', env.modulePackage.version));
  }

  // Chdir before requiring gulpfile to make sure
  // we let them chdir as needed
  if (process.cwd() !== env.cwd) {
    process.chdir(env.cwd);
    gutil.log(
      'Working directory changed to',
      chalk.magenta(tildify(env.cwd))
    );
  }

  // This is what actually loads up the gulpfile
  require(env.configPath);
  gutil.log('Using gulpfile', chalk.magenta(tildify(env.configPath)));

  var gulpInst = require(env.modulePath);
  logEvents(gulpInst);

  process.nextTick(function() {
    if (simpleTasksFlag) {
      return logTasksSimple(env, gulpInst);
    }
    if (tasksFlag) {
      return logTasks(env, gulpInst);
    }
    gulpInst.start.apply(gulpInst, toRun);
  });
}
