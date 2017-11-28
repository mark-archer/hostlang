console.log('compile');
var _ = require('underscore')
var utils = require('./utils.js');
var proc = require('./proc.js');

var eachSync = proc.eachSync;
var isSym = utils.isSym;
var isExpr = utils.isExpr;
var isMeta = utils.isMeta;
var untick = utils.untick;

var compile = {};

function evalHostBlock(expr, context, callback){
    compile.host.evalHostBlock(expr, context, callback);
}
function evalHost(expr, context, callback){
    compile.host.evalHost(expr, context, callback);
}
function evalSym(expr, context, callback){
    compile.host.evalSym(expr, context, callback);
}

function compileExpr(expr, context, callback){
    var item = expr;

    // item is an expression (TODO)
    if(isExpr(item))
        return callback(['isExpr',item]);

    // item is a meta
    if(isMeta(item))
        return callback(['isMeta',item]);

    // item is a sym
    if(isSym(item))
        return evalSym(item, context, callback);

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