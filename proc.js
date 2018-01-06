console.log('proc');

var _ = require('underscore');
//var host = require('./hostlang.js');
var utils = require('./utils.js');
// var reader = require('./reader.js');
// var types = require('./types.js');

var proc = {};
var procs = {};
var procCBs = {};
var procsReady = [];
var procing = false;

function ccError(context, err){
    proc.host.ccError(context,err);
}


proc.new = function(workerFn, items, interCall, context, callback){
    var pid = utils.newid();
    var p = {
        pid:pid,
        fn:workerFn,
        interCall: interCall,
        items:items,
        context: context, 
        callback:callback,
        itemIndex: 0
    };
    procs[pid] = p;

    p.start = function(){
        procsReady.push(p);
        procStart();
    }    
    return p;
}

function procStart(){
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
    var item = p.items[p.itemIndex]; p.itemIndex++;
    var fn = p.fn
    var args = [
        item, 
        p.context,
        /*callback*/ function(rslt){
            if(p.interCall) p.interCall(rslt);
        
            // terminal condition
            if(p.itemIndex >= p.items.length)
                return p.callback(rslt);
                
            procsReady.push(p);
            if(!procing)
                 setTimeout(procStart,0);
        }
    ]
    
    p.context[0].callDepth = 0; // if we're using proc we're automatically resetting the callDepth
    
    try{
        //fn.apply(p.self || null, args);
        fn.apply(null, args);
    } catch(err){
        //throw ['error in proc', err]
        ccError(p.context,err);
    }    
}

function eachSync(items, fn, context, callback){
    if(!_.isArray(items))
        return ccError(context, "eachSync - items not a list");

    // short circuit on lengths zero and one
    if(items.length === 0)
        return callback([]);
    if(items.length === 1)
        return fn(items[0], context, function (rslt) {callback([rslt])});

    var rslts = [];
    function interCall(rslt){
        rslts.push(rslt);
    }
    proc.new(fn, items, interCall, context, function(rslt){
        callback(rslts);
    }).start();    
}
proc.eachSync = eachSync

module = module || {};
module.exports = proc;