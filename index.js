var express = require('express')
var _ = require('lodash')
var path2Regexp = require('path-to-regexp')
var logger = require('morgan')
var fs = require('fs')
var path = require('path')
var url = require('url')
var CMPlugins = require('./plugins/')

var getEachAPI = function (dir, fn) {
  fs.readdirSync(dir).forEach(function (file) {
    if (!/.json$/.test(file)) return
    file = dir + '/' + file
    fn(JSON.parse(fs.readFileSync(file, 'utf8')))
  })
}

function matchMock (allMocks, path) {
  var reg = path2Regexp(path)
  var result = allMocks.filter(function (config) {
    return reg.test(config.url)
  })
  if (result.length > 0) {
    var mock = result[0]
    mock.allUrl = result.map(function (m) {
      return m.url
    }).join(',')
    return mock
  } else {
    return null
  }
}

function getMockData (config, mock, query) {
  var responseKey = mock.responseKey

  // user setting cover
  if (fs.existsSync(config.userSettingPath)) {
    var setting = fs.readFileSync(config.userSettingPath, 'utf8')
    setting = JSON.parse(setting)
    if (_.isString(setting[mock.name])) {
      responseKey = setting[mock.name]
    }
  }

  var option = mock.responseOptions[responseKey]
  var filePath = path.join(config.mockPath, option.path)
  var mockData = fs.readFileSync(filePath, 'utf8')
  return mockData
}

function getAllMocks (mockPath) {
  var list = []
  getEachAPI(mockPath, function (apiConfig) {
    list.push(apiConfig)
  })
  return list
}

function requestHandler (req, res, config) {
  var urlParts = url.parse(req.url, true)
  var query = urlParts.query
  var allMocks = getAllMocks(config.mockPath)
  var mock = matchMock(allMocks, req.url)
  if (mock) {
    var mockData = getMockData(config, mock, query)
    mockData = JSON.parse(mockData)
    mockData.$url = mock.url
    mockData.$allUrl = mock.allUrl
    mockData = JSON.stringify(mockData)
    mock.appPath = config.appPath
    CMPlugins.mount(mock, req, mockData, function (result) {
      var json = JSON.parse(result)
      res.send(JSON.stringify(json))
    })
  } else {
    res.send('{"code": 0, "errInfo": "no api"}')
  }
}

function initAdmin (app, config) {
  var adminStaticPath = path.join(__dirname, '/admin')
  app.use(express.static(adminStaticPath))
  app.get('/chameleon-mock/admin', express.static(adminStaticPath))
  app.get('/chameleon-mock/admin/update', function (req, res, next) {
    var urlParts = url.parse(req.url, true)
    var apiName = urlParts.query['apiName']
    var responseKey = urlParts.query['responseKey']
    if (_.isString(apiName) && _.isString(responseKey)) {
      updateUserSetting(apiName, responseKey, config)
      res.send('{"code": 1}')
    } else {
      res.send('{"code": 0, "errInfo": "param error"}')
    }
  })

  app.get('/chameleon-mock/admin/list', function (req, res, next) {
    var allMocks = getAllMocks(config.mockPath)
    var setting = {}
    if (fs.existsSync(config.userSettingPath)) {
      setting = fs.readFileSync(config.userSettingPath, 'utf8')
      setting = JSON.parse(setting)
    }
    allMocks.forEach(function (api) {
      var apiName = api.name
      api.optionNameList = []
      for (var key in api.responseOptions) {
        api.optionNameList.push(key)
      }
      if (setting[apiName]) {
        api.responseKey = setting[apiName]
      }
    })
    var data = {
      code: 1,
      data: allMocks
    }
    res.send(data)
  })
}

function updateUserSetting (apiName, responseKey, config) {
  if (fs.existsSync(config.userSettingPath)) {
    fs.readFile(config.userSettingPath, 'utf8', function (err, data) {
      if (err) return console.log(err.stack)
      var setting = JSON.parse(data)
      setting[apiName] = responseKey
      setting = JSON.stringify(setting, null, 4)
      fs.writeFile(config.userSettingPath, setting, function (err) {
        if (err) console.log(err)
      })
    })
  } else {
    var setting = {
      apiName: responseKey
    }
    setting = JSON.stringify(setting, null, 4)
    fs.writeFile(config.userSettingPath, setting, function (err) {
      if (err) console.log(err)
    })
  }
}

function initStaticServer (app, config) {
  app.use(express.static(config.rootPath))
  app.get('/', express.static(config.rootPath))
}

function initAPI (app, config) {
  app.get('*', function (req, res) {
    requestHandler(req, res, config)
  })
  app.post('*', function (req, res) {
    requestHandler(req, res, config)
  })
}

function main (config) {
  var app = express()
  app.use(logger('dev'))
  initStaticServer(app, config)
  initAdmin(app, config)
  initAPI(app, config)
  app.listen(config.port || 3000, '127.0.0.1')
}

module.exports = main
