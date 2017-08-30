console.log('proc');

var _ = require('lodash');
//var host = require('./hostlang.js');
 var utils = require('./utils.js');
// var reader = require('./reader.js');
// var types = require('./types.js');

var proc = {};
var procs = {};
var procCBs = {};
var procsReady = [];
var procing = false;

// function ccError(context, err){
//     proc.host.ccError(context, err);
// }

// function newCB(callback){
//     var cbid = utils.newid();
//     procCBs[cbid] = callback;
//     return cbid;
// }
// function doCB(cbid, rslt){
//     procCBs[cbid](rslt);
// }

proc.new = function(calls, interCall, context, callback){
    var pid = utils.newid();
    var p = {
        pid:pid,
        context: context, 
        callback:callback,
        calls:calls || [],
        iCall: 0,
        interCall: interCall
    };
    procs[pid] = p;
    procsReady.push(p);
    procLoop();
    return p;
}

function procLoop(){
    if(procing) return;
    procing = true;

    var i = 0;
    while(i < procsReady.length){
        // garbage collect if i > 1000
        if(i > 1000){
            procsReady.splice(0,1000);
            i -= 1000;
        }
        procNext(procsReady[i]);        
        i++;
    }
    procsReady.length = 0;

    procing = false;
}

function procNext(p){
    var call = p.calls[p.iCall]; p.iCall++;
    var f = call.f;
    var args = call.args;
    args.push(function(rslt){
        if(p.interCall)
            p.interCall(rslt);
    
        // terminal condition
        if(p.iCall >= p.calls.length)
            return p.callback(rslt);
            
        procsReady.push(p);
        if(!procing)
             setTimeout(procLoop,0);
    });
    f.apply(call.self || null, args);
}

module = module || {};
module.exports = proc;