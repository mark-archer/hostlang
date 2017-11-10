console.log('proc');

var _ = require('underscore');
//var host = require('./hostlang.js');
var utils = require('./utils.js');
var reader = require('./reader.js');
var types = require('./types.js');

var process = {};

var procs = {};
var procCBs = {};
var procsReady = [];
var procing = false;

function ccError(context, err){
    process.host.ccError(context, err);
}

function newCB(callback){
    var cbid = utils.newid();
    procCBs[cbid] = callback;
    return cbid;
}
function doCB(cbid, rslt){
    procCBs[cbid](rslt);
}

function newProc(expr, context, callback){
    // processes always assume their expression should be evaluated as a block
    //expr.unshift('`', process.host.evalHostBlock);

    // top level is always a list with one item (last item in original expr will be value and returned
    //expr = [expr];

    if(!utils.isid(callback))
        callback = newCB(callback);

    var proc = {
        id:utils.newid(),
        type:"Process",
        expr: expr,
        context: context,
        callback: callback,
        exprStack: [],
        indexStack: [],
        currentExpr:expr,
        currentIndex:-1,
        value:null
    };
    context && context[0] && (context[0].process = proc);
    procs[proc.id] = proc;
    return proc
}
process.newProc = newProc;

process.initProc = function(expr, context, callback){
    utils.untick(expr);
    //expr = ['`','`evalBlock',expr];
    var p = newProc(expr, context, callback);
    procNext(p);
    return p;
};

function procLoop(){
    procing = true;

    var i = 0;
    while(i < procsReady.length){
        // gc if i > 1000
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

function procNext(proc) {

    // callback function
    var procCallback = function(rslt){
        // terminal condition
        if(proc.exprStack.length === 0 && proc.currentIndex >= proc.expr.length)
            return doCB(proc.callback,proc.value);

        // update proc value and return to procLoop
        proc.value = rslt;
        procsReady.push(proc);
        if(!procing)
            setTimeout(procLoop,0);
    };

    // get current expression and current position in expression
    var expr = proc.currentExpr;
    var ci = proc.currentIndex;

    // set position in expression to current value of proc
    if(ci >= 0) expr[ci] = proc.value;

    // increment the position we're working on
    ci += 1;
    proc.currentIndex = ci;

    // if it's a macro that needs to be evaluated...
    var macroCall = (ci === 2 && expr[0] === '`' && types.isFunction(expr[1]) && expr[1].isMacro);

    // if we've finished with all the items in this expression...
    if(ci >= expr.length || macroCall){
        // if this is a function that needs to be evaluated (should error if it's not)...
        if(types.Expression.isType(expr))
            return process.host.applyHost(expr.slice(1), proc.context, function(rslt){
                // move backup the stack
                proc.currentExpr = proc.exprStack.pop();
                proc.currentIndex = proc.indexStack.pop();
                // set _
                process.host.bind(proc.context, '_', rslt);
                procCallback(rslt);
            });
            //return process.host.applyHost(expr.slice(1), proc.context, procCallback);
        else
            //return ccError(proc.context, ["Not recognized as a valid expression",expr]);
            return procCallback(expr);
    }

    // get the next item to work on
    var item = expr[ci];

    // if it's an expression...
    if(types.Expression.isType(item)){

        // check for quote, means don't eval (leave as symbols)
        if(item[1] === "'"){
            item.shift();
            item[0] = '`'; // replace quote with backtick and return
            return procCallback(item);
        }

        proc.exprStack.push(expr);
        proc.indexStack.push(ci);
        proc.currentExpr = item;
        proc.currentIndex = 0;
        return procCallback('`');
    }

    // if it's a symbol...
    if(types.isSymbol(item))
        return process.host.evalSym(item, proc.context, procCallback);

    // if it's a meta...
    if(types.isMeta(item))
        return process.host.evalMeta(item, proc.context, procCallback);

    // otherwise just return the item
    return procCallback(item);
}


process.test = function(){
    var ctx = [{}];
    reader.ls(".",ctx,function(rslts){
        var expr = _.map(rslts, function(f){
            return ['`', '`try', ['`', reader.read, f, 'utf8'], ['`', console.log, 'read successfully']]
        });
        process.host.run(expr, ctx, console.log, function(err){console.error("ERROR", err)});
        console.log(expr);
    });
};
module = module || {};
module.exports = process;