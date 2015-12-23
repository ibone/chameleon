'use strict';
var express = require('express')
var logger = require('morgan');
var fs = require("fs");
var path = require("path");

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
    var filterList = [];
    var routeSlice = route.replace(/([^\w\s])/g, '|').split('|');
    var match = routeSlice[routeSlice.length - 1];
    routeSlice.pop();
    route = routeSlice.join('|');
    list.every(function(apiConfig){
        if(apiConfig.url.indexOf(match) > -1){
            filterList.push(apiConfig);
        }
        return true;
    })
    if(filterList.length > 1){
        if(routeSlice.length == 1 && routeSlice[0].length === 0){
            return filterList[0];
        }
        return matchRoute(filterList, route);
    }else{
        if(filterList.length > 0){
            return filterList[0];
        }else{
            return null;
        }
    }
}

function getResponseByAPIConfig(config, apiConfig){
    var response = apiConfig.responseOption[apiConfig.responseKey];
    var filePath = path.join(config.cwd, config.apisPath, response.path);
    var file = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(file);
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
        var apis = getAllAPIConfig(config.apisPath);
        var apiConfig = matchRoute(apis, req.url);
        if(apiConfig){
            res.json(getResponseByAPIConfig(config, apiConfig));
        }else{
            next();
        }
    });
    app.post('*', function(req, res, next){
        var apis = getAllAPIConfig(config.apisPath);
        var apiConfig = matchRoute(apis, req.url);
        if(apiConfig){
            res.json(getResponseByAPIConfig(config, apiConfig));
        }else{
            next();
        }
    });

    app.listen(config.port||3000);
}
//读取配置，开服务，指向静态路径，生成接口

module.exports = start;
