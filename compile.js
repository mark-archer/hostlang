console.log('compile');
var _ = require('underscore')
var utils = require('./utils.js');
var proc = require('./proc.js');

var eachSync = proc.eachSync;
var isSym = utils.isSym;
var isExpr = utils.isExpr;
var isMeta = utils.isMeta;
var tick = utils.tick;
var untick = utils.untick;
var eqObjects = utils.eqObjects;

var compile = {};

function evalHostBlock(expr, context, callback){
    compile.host.evalHostBlock(expr, context, callback);
}
function evalHost(expr, context, callback){
    compile.host.evalHost(expr, context, callback);
}
function evalMeta(expr, context, callback){
    compile.host.evalMeta(expr, context, callback);
}
function evalSym(expr, context, callback){
    compile.host.evalSym(expr, context, callback);
}
function applyHost(expr, context, callback){
    compile.host.applyHost(expr, context, callback);
}

function compileExpr(expr, context, callback){
    var item = expr;

    // item is a sym
    if(isSym(item))
        return evalSym(item, context, callback);

    // item is a meta
    if(isMeta(item))
        return callback(['isMeta',item]);

    // item is an expression 
    if(isExpr(item)){
        // compile first item (that's the function)
        var fn = expr[1];
        compileExpr(fn,context,function(fnc){
            expr[1] = fnc;
            
            // todo check for fnc.compile and call that if it exists

            // if it's a macro, ignore for now
            if(fnc.isMacro)
                return callback(["isMacro",expr])
            
            // otherwise it's a normal function so compile it's arguments
            untick(expr);
            return eachSync(expr,compileExpr,context,function(items){                
                var fn = items.shift()
                var fnContext = fn.ctx || null;
                var ctx = _.last(context);
                var compiled = null;
                if(eqObjects(fn.type,"Fnjs") && fn.ccode)
                    fn = fn.ccode;
                if(_.isFunction(fn)){                    
                    compiled = function (){ctx._ = fn.apply(fnContext,items); return ctx._;};                    
                }
                else {                    
                    compiled = function(expr, context, callback){
                        // expr shouldn't have anything in it
                        applyHost(items, context, callback)
                    }
                }                
                return callback(compiled)                              
            });            
        });
        return;
    }        

    callback(item);
}

function compileBlock(expr, context, callback){    
    var block = untick(expr);
    if(block.length < 2)
        return compileExpr(block[0], context, callback);
    eachSync(block, compileExpr, context, callback)    
}

compile.compile = utils.fnjs("compile", compileBlock);
compile.compile.isMacro = true;
compile.compile.useRuntimeScope = true;


module.exports = compile;