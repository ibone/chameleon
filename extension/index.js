var singleUpload = require("./upload");
var customData = require("./custom");
var extensionMap = {
    'singleUpload' : singleUpload,
    'custom' : customData
}

function executeExtension(extensionName, extensionConfig, req, mockTemplate, callback){
    extensionMap[extensionName](extensionConfig, req, mockTemplate, function(result){
        if(extensionName != 'custom'){
            customData(extensionConfig, req, result, callback);
        }else{
            callback(result);
        }
    })
}
module.exports = {
    hasExtension : function(extensionName){
        return extensionMap[extensionName];
    },
    executeExtension : executeExtension
};
