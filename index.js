var express = require('express')
var app = express()

app.get('/', function (req, res) {
  res.send('Hello World')
})

app.listen(3000);

//读取配置，开服务，指向静态路径，生成接口
