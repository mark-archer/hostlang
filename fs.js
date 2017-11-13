
// var utils = require('../utils.js');
// var fnjs = utils.fnjs;
// var untick = utils.untick;

var hostFs = {};
hostFs.cachedReads = {};
hostFs.currentDir = __dirname;

var fs = null;

var inited = false;
hostFs.init = function(host){        
    //fs = require('fs');
    hostFs.host = host;
    if(inited) return inited;
    fs = eval("require('fs')");
    inited = true;
    return inited;
}
//hostFs.hostDir = __dirname; // + "\\hostlang";

function ccError(context, err){
    hostFs.host.ccError(context,err);
}

hostFs.realPath = function(path, context, callback) {
    
    if(path[0] !== '/')
        path = hostFs.currentDir + "/" + path;
        
    fs.realpath(path, function (err, path) {        
        if (err) return ccError(context, err);
        callback(path);
    });
};

hostFs.ls = function (path, context, callback) {
    if(!path) path = ".";
    hostFs.realPath(path, context, function(path){
        callback(fs.readdirSync(path));
    });
};

hostFs.cd = function (path, context, callback) {    
    if(!path) return callback(hostFs.currentDir);
    hostFs.realPath(path, context, function(path){
        hostFs.currentDir = path;
        callback(path);
    });
};

hostFs.isDir = function (path, context, callback) {
    hostFs.realPath(path,context, function (path) {
        fs.lstat(path, function (err, stats) {
            if(err) return ccError(context, err);
            callback(stats.isDirectory());
        });
    });
};

hostFs.readFile = function(context, callback, path, options){    
    //console.log("path+options",path,options)'
    if(!options){
        options =  "utf8";
        raw = false;
    }
    fs.readFile(path, options, function (err, contents) {
        if(err) return ccError(context, err);
        callback(contents);
    });
}

hostFs.writeFile = function(context, callback, path, contents, options){
    options = options || "utf8"    

    if(path[0] === '.') 
        path = hostFs.currentDir + "/" + path;
    //hostFs.realPath(path, context, function(path){
        console.log('writing to ', path);
        fs.writeFile(path, contents, options, function(err, rslt){
            if(err) return ccError(context, err);
            callback(path);
        });
    //});    
}

module = module || {};
module.exports = hostFs;