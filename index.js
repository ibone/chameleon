'use strict';
var express = require('express')
var logger = require('morgan');
var fs = require("fs");
var path = require("path");
var url = require('url');
var CMExtension = require("./extension/");

var getEachAPI = function(dir, fn) {
    fs.readdirSync(dir).forEach(function(file) {
        file = dir+'/'+file;
        var stat = fs.statSync(file);

        if (stat && stat.isDirectory()) {
            //results = results.concat(_getAllFilesFromFolder(file))
        } else {
            fn(JSON.parse(fs.readFileSync(file, 'utf8')));
        };
    });
};

function matchRoute(list, route){
    var result = null;
    list.every(function(apiConfig){
        var urlReg = apiConfig.urlReg;
        var reg = new RegExp(urlReg);
        if(urlReg && reg.test(route)){
            result = apiConfig;
            return false;
        }else if(route.indexOf(apiConfig.url) > -1){
            result = apiConfig;
            return false;
        }
        return true;
    })
    return result;
}

function getResponseByAPIConfig(config, apiConfig, query){
    var apiConfigName = apiConfig.name;
    //http://localhost:3222/?chameleon=getList|noData
    var chameleonE2eString = query['chameleon'];
    var chameleonE2eTestConfig = {
        apiName : null,
        responseKey : null
    }

    if(chameleonE2eString && chameleonE2eString.length > 0){
        chameleonE2eString = chameleonE2eString.split('|');
        chameleonE2eTestConfig = {
            apiName : chameleonE2eString[0],
            responseKey : chameleonE2eString[1]
        }
    }

    var responseKey = apiConfig.responseKey;
    if(chameleonE2eTestConfig.apiName == apiConfig.name){
        responseKey = chameleonE2eTestConfig.responseKey;
    }
    var response = apiConfig.responseOption[responseKey];
    var filePath = path.join(config.cwd, config.apisPath, response.path);
    var file = fs.readFileSync(filePath, 'utf8');
    return file;
}

function getAllAPIConfig(apisPath){
    var list = [];
    getEachAPI(apisPath, function(apiConfig){
        list.push(apiConfig);
    });
    return list;
}

function start(config){
    var app = express();
    app.use(logger('dev'));
    app.use(express.static(config.cwd));
    app.get('/', express.static(config.cwd));
    app.get('*', function(req, res, next){
        getAndPost(req, res, next, config);
    });
    app.post('*', function(req, res, next){
        getAndPost(req, res, next, config);
    });

    app.listen(config.port||3000);
}

function getAndPost(req, res, next, config){
    var url_parts = url.parse(req.headers.referer, true);
    var query = url_parts.query;
    var apis = getAllAPIConfig(config.apisPath);
    var apiConfig = matchRoute(apis, req.url);
    if(apiConfig){
        var mockTemplate = getResponseByAPIConfig(config, apiConfig, query);
        mockTemplate = JSON.parse(mockTemplate);
        mockTemplate.chameleonApi = apiConfig.url;
        mockTemplate = JSON.stringify(mockTemplate);
        if(apiConfig.extension && CMExtension.hasExtension(apiConfig.extension)){
            console.log('executeExtension',apiConfig.extension);
            apiConfig.extensionConfig.cwd = config.cwd;
            CMExtension.executeExtension(apiConfig.extension, apiConfig.extensionConfig, req , mockTemplate, function(result){
                var json = JSON.parse(result);
                res.send(JSON.stringify(json));
            });
        }else{
            CMExtension.executeExtension('custom',{}, req , mockTemplate, function(result){
                var json = JSON.parse(result);
                res.send(JSON.stringify(json));
            });
        }
    }else{
        res.send('{"code":1,"errInfo":"no api"}');
    }
}
//读取配置，开服务，指向静态路径，生成接口

module.exports = start;
