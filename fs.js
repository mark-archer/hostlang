var fs = require('fs');
// var utils = require('../utils.js');
// var fnjs = utils.fnjs;
// var untick = utils.untick;

var hostFs = {};
hostFs.cachedReads = {};
hostFs.currentDir = __dirname;
//hostFs.hostDir = __dirname; // + "\\hostlang";

function ccError(context, err){
    hostFs.host.ccError(context,err);
}

hostFs.realPath = function(path, context, callback) {
    
    //var path = untick(expr)[0];

    // // check for hostlang path
    // var start = path.substr(0,5).toLowerCase();
    // if(start === "host/" || start === "host\\"){
    //     path = hostFs.hostDir + "/" + path.substr(4);
    // }

    //if(path[0] === '.')
    //    path = hostFs.currentDir + "/" + path;

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

module = module || {};
module.exports = hostFs;