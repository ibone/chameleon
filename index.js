'use strict';
var express = require('express')
var logger = require('morgan');
var fs = require("fs");
var path = require("path");
var url = require('url');
var CMExtension = require("./extension/");
var USER_SETTING_PATH = path.join(process.cwd(), '/chameleonsetting.json');

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
    //?chameleon=apiName|responseKey
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

    if (fs.existsSync(USER_SETTING_PATH)) {
        var setting = fs.readFileSync(USER_SETTING_PATH, "utf8")
        setting = JSON.parse(setting);
        if(typeof setting[apiConfig.name] == 'string'){
            responseKey = setting[apiConfig.name]
        }
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
    initStaticServer(app, config)
    initDashboard(app, config);
    initAPI(app, config);
    app.listen(config.port||3000, '127.0.0.1');
}

function requestAPI(req, res, next, config){
    var url_parts = url.parse(req.url, true);
    var query = url_parts.query;
    var apis = getAllAPIConfig(config.apisPath);
    var apiConfig = matchRoute(apis, req.url);
    if(apiConfig){
        var mockTemplate = getResponseByAPIConfig(config, apiConfig, query);
        mockTemplate = JSON.parse(mockTemplate);
        mockTemplate.chameleonApi = apiConfig.url;
        mockTemplate = JSON.stringify(mockTemplate);
        if(apiConfig.extension && CMExtension.hasExtension(apiConfig.extension)){
            console.log('executeExtension', apiConfig.extension);
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
        res.send('{"code": 0, "errInfo": "no api"}');
    }
}

function initDashboard(app, config){
    app.get('/cmockadmin', function(req, res, next){
        res.sendFile(path.join(__dirname, '/dashboard/index.html'));
    });

    app.get('/cmockadmin/update', function(req, res, next){
        var url_parts = url.parse(req.url, true);
        var apiName = url_parts.query['apiName'];
        var responseKey = url_parts.query['responseKey'];
        if(typeof apiName == 'string' && typeof responseKey == 'string'){
            updateUserSetting(apiName, responseKey);
            res.send('{"code": 1}');
        }else{
            res.send('{"code": 0, "errInfo": "param error"}');
        }
    });

    app.get('/cmockadmin/list', function(req, res, next){
        var allAPI = getAllAPIConfig(config.apisPath);
        var setting = {};
        if (fs.existsSync(USER_SETTING_PATH)) {
            setting = fs.readFileSync(USER_SETTING_PATH, "utf8");
            setting = JSON.parse(setting);
        }
        allAPI.every(function(api){
            var apiName = api.name;
            api.optionNameList = [];
            for(var key in api.responseOption){
                api.optionNameList.push(key)
            }
            if(setting[apiName]){
                api.responseKey = setting[apiName]
            }
            return true;
        })
        var data = {
            code: 1,
            data: allAPI
        }
        res.send(data);
    });
}

function updateUserSetting(apiName, responseKey){
    if (fs.existsSync(USER_SETTING_PATH)) {
        fs.readFile(USER_SETTING_PATH, "utf8", function(err, data) {
            var setting = JSON.parse(data);
            console.log(setting);
            setting[apiName] = responseKey;
            console.log(setting);
            console.log(responseKey);
            setting = JSON.stringify(setting, null, 4);
            console.log(setting);
            fs.writeFile(USER_SETTING_PATH, setting, function(err){
                if(err) {
                    return console.log(err);
                }
            })
        });
    }else{
        var setting = {};
        setting[apiName] = responseKey;
        setting = JSON.stringify(setting, null, 4);
        fs.writeFile(USER_SETTING_PATH, setting, function(err){
            if(err) {
                return console.log(err);
            }
        })
    }
}

function initStaticServer(app, config){
    app.use(express.static(config.rootPath));
    app.get('/', express.static(config.rootPath));
}

function initAPI(app, config){
    app.get('*', function(req, res, next){
        requestAPI(req, res, next, config);
    });
    app.post('*', function(req, res, next){
        requestAPI(req, res, next, config);
    });
}

module.exports = start;
