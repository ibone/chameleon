var _ = require('lodash')
var singleUpload = require('./upload')
var customData = require('./custom')
var allPlugin = {
  'singleUpload': singleUpload,
  'default': customData
}

function mount (mock, req, mockData, callback) {
  var plugins = mock.plugin
  if (_.isObject(plugins)) {
    plugins = [mock]
  }
  if (!_.isArray(plugins)) {
    return callback(mockData)
  }
  plugins.unshift({
    name: 'default'
  })
  var env = {
    appPath: mock.appPath,
    req: req
  }
  loadPlugin(plugins, mockData, env, function (result) {
    callback(result)
  })
}

function loadPlugin (plugins, mockData, env, callback) {
  var plugin = plugins.pop()
  allPlugin[plugin.name](plugin.option, mockData, env, function (result) {
    if (plugins.length > 0) {
      loadPlugin(plugins, result, env, callback)
    } else {
      callback(result)
    }
  })
}

module.exports = {
  mount: mount
}
