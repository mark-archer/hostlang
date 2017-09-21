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
        procLoop();
    }    
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
                 setTimeout(procLoop,0);
        }
    ]
    
    p.context[0].callDepth = 0; // if we're using proc we're automatically resetting the callDepth
    //fn.apply(p.self || null, args);
    fn.apply(null, args);
}

module = module || {};
module.exports = proc;