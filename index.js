'use strict';
var express = require('express')
var logger = require('morgan');
var fs = require("fs");
var path = require("path");
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

function getParams(route){
    var routeParams = [];
    if(route.indexOf('?') > -1){
        routeParams = route.split('?')[1];
        if(routeParams.indexOf('&') > -1){
            routeParams = routeParams.split('&');
        }else{
            if(routeParams.length > 0){
                routeParams = [routeParams];
            }
        }
    }
    return routeParams;
}

function getPathSlice(route){
    if(route.indexOf('?') > -1){
        route = route.split('?')[0];
    }
    return route.replace(/([^\w\s\d])/g, '|').split('|');
}

function arraySimilar(a1, a2){
    var score = 0;
    if(a1.length > 0 && a2.length >0){
        a1 = a1.concat([]);
        a2 = a2.concat([]);
        a1.every(function(o1,i){
            a2.every(function(o2,j){
                if(a1[i] === a2[j]){
                    score++;
                    a2[j] = null;
                    a1[i] = null;
                }
                return true;
            })
            return true;
        })
    }
    return score;
}

function matchRoute(list, route){
    var routeParams = getParams(route);
    var pathSlice = getPathSlice(route);
    var maxScore = 0;
    var stepResult = [];
    list.every(function(apiConfig){
        var apiParams = getParams(apiConfig.url);
        var apiPathSlice = getPathSlice(apiConfig.url);
        var score = 0;
        score += arraySimilar(routeParams, apiParams);
        score += arraySimilar(pathSlice, apiPathSlice);
        if(score > maxScore){
            maxScore = score;
            stepResult.push(apiConfig);
        }
        return true;
    })

    if(stepResult.length > 0){
        return stepResult[stepResult.length - 1];
    }else{
        return null;
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
            var jsonData = getResponseByAPIConfig(config, apiConfig);
            if(apiConfig.extension && CMExtension[apiConfig.extension]){
                apiConfig.extensionConfig.cwd = config.cwd;
                CMExtension[apiConfig.extension](req, res, apiConfig.extensionConfig, jsonData);
            }else{
                res.json(jsonData);
            }
        }else{
            next();
        }
    });

    app.listen(config.port||3000);
}
//读取配置，开服务，指向静态路径，生成接口

module.exports = start;
