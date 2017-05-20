var fs = require('fs');

var utils = require('./utils.js');
var fnjs = utils.fnjs;
var untick = utils.untick;

var reader = {};
reader.cachedReads = {};
reader.currentDir = __dirname;
reader.hostDir = __dirname; // + "\\hostlang";

function ccError(context, err){
    reader.host.ccError(context,err);
}

reader.realPath = function (expr, context, callback) {
    var path = untick(expr)[0];

    // check for hostlang path
    var start = path.substr(0,5).toLowerCase();
    if(start === "host/" || start === "host\\"){
        path = reader.hostDir + "/" + path.substr(4);
    }

    var cd = reader.currentDir + "/";

    if(path[0] === '.')
        path = cd + path;

    fs.realpath(path, function (err, path) {
        if (err) return ccError(context, err);
        callback(path);
    });
};

reader.read = function(expr, context, callback){
    var path = untick(expr)[0];
    var options = expr[1];
    var raw = true;
    if(!options){
        options =  "utf8";
        raw = false;
    }


    reader.realPath([path],context, function (path) {

        // if it's in the cache just return is
        if(reader.cachedReads[path])
            return callback(reader.cachedReads[path]);

        fs.lstat(path,function(err, stats){
            if(err) return ccError(context, err);
            if(stats.isDirectory()) return ccError(context, path + " is a directory");

            // read js file
            if(!raw && path.toLowerCase().endsWith(".js")){
                reader.cachedReads[path] = require(path);
                return callback(reader.cachedReads[path]);
            }

            // read host file
            if(!raw && path.toLowerCase().endsWith(".host"))
                return fs.readFile(path, options, function (err, code) {
                    if(err) return ccError(context, err);

                    var ctx = {_sourceFile:path,exports:{},_silent:context[0]._silent};
                    reader.cachedReads[path] = ctx.exports; // set before loaded, prevents infinite recursion of loading a->b->a->...
                    reader.host.run(code, ctx, function (rslt) {
                        ctx.exports._moduleSourceFile = path;
                        callback(ctx.exports);
                    }, function(err){
                        ccError(context, [path, err]);
                    });
                });

            // just read file and return contents
            fs.readFile(path, options, function (err, contents) {
                if(err) return ccError(context, err);
                callback(contents);
            });

            //ccError(context, path + " is not a type known by reader");
        });
    });


};

reader.ls = function (expr, context, callback) {
    var path = untick(expr)[0];
    if(!path) path = ".";

    reader.realPath([path], context, function(path){
        callback(fs.readdirSync(path));
    });
};

reader.cd = function (expr, context, callback) {
    var path = untick(expr)[0];
    if(!path) return callback(reader.currentDir);
    reader.realPath([path], context, function(path){
        reader.currentDir = path;
        callback(path);
    });
};

reader.isDir = function (expr, context, callback) {
    var path = untick(expr)[0];

    reader.realPath([path],context, function (path) {
        fs.lstat(path, function (err, stats) {
            if(err) return ccError(context, err);
            callback(stats.isDirectory());
        });
    });
};

module = module || {};
module.exports = reader;
