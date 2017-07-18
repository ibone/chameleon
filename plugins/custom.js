function main (option, req, mockData, callback) {
  mockData = mockData.replace('{{chameleon.uuid(8)}}', Math.floor(Math.random() * 100000000))
  callback(mockData)
}

module.exports = main
