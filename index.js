'use strict';
var express = require('express')
var logger = require('morgan');
var fs = require("fs");

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
        if(apiConfig.route.indexOf(match) > -1){
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

function start(config){
    var app = express();
    app.use(logger('dev'));
    app.use(express.static(config.cwd));
    app.get('/', express.static(config.cwd));
    app.get('*', function(req, res, next){
        var routeList = [];
        getEachAPI(config.apisPath, function(apiConfig){
            routeList.push(apiConfig);
        });
        var url = req.url;
        var apiConfig = matchRoute(routeList, url);
        if(apiConfig){
            var response = apiConfig.response[apiConfig.responseIndex];
            if(response.data){
                res.json(apiConfig.response[0].data);
            }
            if(response.dataPath){
                var relativePath = (config.apisPath+'/').replace('//','/');
                var file = fs.readFileSync(relativePath + response.dataPath, 'utf8');
                res.json(JSON.parse(file));
            }
        }else{
            next();
        }
    });
    app.post('*', function(req, res, next){
        var routeList = [];
        getEachAPI(config.apisPath, function(apiConfig){
            routeList.push(apiConfig);
        });
        var url = req.url;
        var apiConfig = matchRoute(routeList, url);
        if(apiConfig){
            res.json(apiConfig.response[0].data);
        }else{
            next();
        }
    });

    app.listen(config.port||3000);
}
//读取配置，开服务，指向静态路径，生成接口

module.exports = start;
