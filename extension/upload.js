var multer  = require('multer');
var fs = require('fs')
var os = require('os')
var path = require('path')


function DiskStorage (opts) {
  this.getFilename = opts.filename;
  this.getDestination = opts.destination;
}

DiskStorage.prototype._handleFile = function _handleFile (req, file, cb) {
  var that = this

  that.getDestination(req, file, function (err, destination) {
    if (err) return cb(err);
    if(!fs.existsSync(destination)){
        fs.mkdirSync(destination);
    }

    that.getFilename(req, file, function (err, filename) {
      if (err) return cb(err)

      var finalPath = path.join(destination, filename)
      var outStream = fs.createWriteStream(finalPath+'g');
      var outStream2 = fs.createWriteStream(finalPath);

      outStream._write = function (chunk, encoding, cb) {
          setTimeout(function(){
              outStream2.write(chunk, encoding);
              cb();
          },100)
      };
      file.stream.pipe(outStream);
      outStream.on('error', function(err){
          console.log(err);
          cb();
      })
      outStream.on('finish', function () {
        fs.unlink(finalPath+'g',function(){});
        cb(null, {
          destination: destination,
          filename: filename,
          path: finalPath,
          size: outStream.bytesWritten
        })
      })
    })
  })
}

DiskStorage.prototype._removeFile = function _removeFile (req, file, cb) {
  var path = file.path

  delete file.destination
  delete file.filename
  delete file.path

  fs.unlink(path, cb)
}

function main(req, res, extensionConfig, jsonData){
    var storage = new DiskStorage({
      destination: function (req, file, cb) {
        cb(null, extensionConfig.cwd + '/uploads/');
      },
      filename: function (req, file, cb) {
        cb(null, file.originalname);
      }
    })
    var upload = multer({ storage: storage })
    upload.single(extensionConfig.formName)(req, res, function(err){
        if(err){
            console.log(err);
        }
        var newData = JSON.stringify(jsonData).replace(/\${chameleon\.([^}]+)}/,function(str){
            return '/uploads/' + req.file.filename;
        })
        res.json(JSON.parse(newData));
    });
}

module.exports = main;
