var ejs = require('ejs')
var _ = require('lodash')
var globalFn = {
  number: function (len) {
    if (!_.isNumber(len)) {
      len = 10
    }
    if (len === 1) {
      return _.random(1, 9)
    }
    return _.random(Math.pow(10, len - 1), Math.pow(10, len) - 1)
  },
  id: function () {
    return _.uniqueId('id_')
  },
  _: _
}

function main (option, mockData, env, callback) {
  var result = ejs.render(mockData, globalFn)
  callback(result)
}

module.exports = main
