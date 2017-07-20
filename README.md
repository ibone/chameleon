[![NPM version][npm-image]][npm-url]
# Chameleon Mock
- 本项目已迁移到 [ejs-mock](https://github.com/dwfeiFE/ejs-mock)
- the project moved to [ejs-mock](https://github.com/dwfeiFE/ejs-mock)
- changed npm package name: ejs-mock

[npm-url]: https://www.npmjs.com/package/chameleon-mock
[npm-image]: https://img.shields.io/npm/v/chameleon-mock.svg

## Installation and usage
```
$ npm install chameleon-mock --save-dev
```
You should then setup a configuration file:
```
$ ./node_modules/.bin/chameleon-mock --init
```
After that, you can run chameleon-mock
```
$ ./node_modules/.bin/chameleon-mock
```
open dashboard 🎛 `http://localhost:8080/chameleon-mock-admin`
## Configuration
After running 
```
$ ./node_modules/.bin/chameleon-mock --init
```
you'll have a `.chameleonrc` file in your directory. In it, you'll see some rules configured like this:
```json
{
  "name": "app name",
  "port" : "8080",
  "mockPath": "./mock",
  "rootPath": "./dist"
}
```
## Create an mock
在 `./mock` 文件夹中添加json接口配置文件 `order.json`, like this
```json
{
  "name": "order",
  "describe": "order detail data",
  "url": "/order/:id",
  "method": "GET",
  "dataType": "JSON",
  "responseKey": "firstKey",
  "responseOptions": {
    "firstKey": {
      "desc": "normal order",
      "path": "./order/firstData.json"
    }
  }
}
```
对应 `order.json` 配置，在 `./mock/order` 中创建接口数据文件 `firstData.json`, like this
```
{
  "data": {
    ....
  },
  "state": {
    "code": 200,
    "msg": "success"
  }
}
```
After running 
```
$ ./node_modules/.bin/chameleon-mock
```
🎈visit admin `http://localhost:8080/order/1`

## Feature：
* 常规数据返回
* 图片上传
* 异常数据返回
* 数据切换