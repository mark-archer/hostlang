
var _ = require('underscore');
var utils = require('../utils.js');
var http = require('http');
var uuid = require('node-uuid');
var Cookies = require('cookies');
var fs = require('fs');

var serve = {};
module = module || {};
module.exports = serve;

var sessionsFileName = "sessions.json";
var sessions = null;
try{
    var s = fs.readFileSync(sessionsFileName, "utf8");
    s = utils.dataFromString(s);
    sessions = s;
}catch (e){
    sessions = {};
}
function sessionsSave(){
    fs.writeFileSync(sessionsFileName,utils.dataToString(sessions),"utf8");
}

serve.serveJs = function serveJs(expr, context, callback){
    var globalHandler = expr[0];
    var port = expr[1];

    //console.log(host, context);
    var cout = context[0].cout;

    var server = http.createServer(function (req, res) {
        //cout('request received: ' + (new Date()));

        var cookies = new Cookies(req, res);
        var host_token = cookies.get('host_token');
        var session = sessions[host_token];
        if(!session){
            host_token = uuid.v4();
            sessions[host_token] = {id:host_token,authenticated:false,issDT:Date.now()};
            cookies.set('host_token',host_token);
            session = sessions[host_token];
            sessionsSave();
        }

        var verb = req.method;
        var url = req.url;

        console.log(session.id + " " + verb + " " + url);

        var postData; // todo: post data

        var ctx = _.clone(context);
        var args = {req:req,res:res,session:session,verb:verb,url:url};

        serve.host.evalHost(['`', globalHandler, args], ctx, function(rslt){
            if(!args.handled){
                rslt = utils.dataToString(rslt);
                if(rslt[0] === '<')
                    res.writeHeader(200, {"Content-Type": "text/html"});
                res.end(rslt);
            }
        });
    });
    server.listen(port);
    callback('server listening on port ' + port);
};



// var routes = [function(){return "404"}];
// serve.routes = routes;
//
// serve.addRoute = function(f)
// {
//     routes.push(f);
// };
//
// function setContentType(args, contentType){
//     args.res.writeHeader(200, {"Content-Type": contentType});
// }
// serve.setContentType = setContentType;
//
//
// function sendFile(args, path, contentType){
//     var fs = require('fs');
//     var res = args.res;
//     fs.readFile(path, null, function (err,file) {
//         if(err) return res.end(err);
//         if(!contentType){
//             path = path.toLowerCase();
//             if(path.endsWith(".css")) contentType = "text/css";
//             else if(path.endsWith(".jpeg")) contentType = "image/jpeg";
//             else if(path.endsWith(".jpg")) contentType = "image/jpg";
//             else if(path.endsWith(".png")) contentType = "image/png";
//             else if(path.endsWith(".gif")) contentType = "image/gif";
//         }
//         if(contentType)
//             args.res.writeHeader(200, {"Content-Type": contentType});
//         res.end(file);
//     });
//     args.handled = true;
//     return args;
// }
// serve.sendFile = sendFile;
//
// serve.serve = function(port){
//     port = port || 3000;
//     var sessions = {};
//     function globalHandler(args){
//         console.log({url:args.url,verb:args.verb,session:args.session.id});
//
//         for(var i = routes.length-1; i>=0; i--){
//
//         }
//     }
// }
//
//
//     fn globalHandler(args)
// ;log : add "global handler called -- " date!
//     reverse routes
// >> each r: if(r args): return _
// "501 - no handler accepted the request"
//
// evalJs """
//
// """
// _ sessions globalHandler port
// log <<
// var str "server listening at: http://localhost:{port}"
// for (i 2): set str: string.replace str "{port}" port
//
// set serve.useRuntimeScope true
// export serve


