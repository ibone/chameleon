var program = require('commander')
var fs = require('fs')
var path = require('path')

program
  .version('0.0.10')

program
  .command('start')
  .option('-p, --port <port>', 'set server port')
  .action(function (env, options) {
    if (!fs.existsSync('.chameleonrc')) {
      console.log('no found config file \'.chameleonrc\' ')
      console.log('use \'./node_modules/.bin/chameleon-mock init\' ')
    }

    var config = require('./.chameleonrc')
    var ChameleonMock = require(env.modulePath)
    config.appPath = path.join(process.cwd())
    config.userSettingPath = path.join(config.appPath, 'chameleonsetting.json')
    config.rootPath = path.join(config.appPath, config.rootPath)
    config.mockPath = path.join(config.appPath, config.mockPath)

    ChameleonMock(config)
    console.log('start chameleon-mock server http://localhost:8080')
    console.log('visit chameleon-mock admin http://localhost:8080/chameleon-mock/admin')
  })

program
  .command('init')
  .action(function () {
    console.log('init')
    var configPath = path.join(process.cwd(), '.chameleonrc')
    if (fs.existsSync(configPath)) {
      console.log('chameleon-mock config file exist')
    } else {
      var config = {
        'name': 'app name',
        'port': '8080',
        'mockPath': './mock',
        'rootPath': './dist'
      }
      fs.writeFile('.chameleonrc', JSON.stringify(config), function (err) {
        if (err) throw err
        console.log('create chameleon-mock config file: .chameleonrc')
      })
    }
  })

program
  .command('demo')
  .action(function () {
    console.log('start chameleon-mock server http://localhost:8080')
    console.log('visit chameleon-mock admin http://localhost:8080/chameleon-mock/admin')
    var configPath = path.join(__dirname, '../example/.chameleonrc')
    var modulePath = path.join(__dirname, '../')
    var text = fs.readFileSync(configPath, 'utf8')
    var config = JSON.parse(text)
    var ChameleonMock = require(modulePath)

    config.appPath = path.join(__dirname, '../example/')
    config.userSettingPath = path.join(config.appPath, 'chameleonsetting.json')
    config.rootPath = path.join(config.appPath, config.rootPath)
    config.mockPath = path.join(config.appPath, config.mockPath)

    ChameleonMock(config)
  })

program.parse(process.argv)
