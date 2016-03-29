function main(extensionConfig, req, mockTemplate, callback){
    mockTemplate = mockTemplate.replace('{{chameleon.uuid(8)}}',Math.floor(Math.random()*100000000));
    callback(mockTemplate);
}

module.exports = main;
