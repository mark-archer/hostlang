"use strict";

console.log('compile');
var _ = require('underscore')
var utils = require('./utils.js');
var proc = require('./proc.js');

var eachSync = proc.eachSync;
var isSym = utils.isSym;
var isExpr = utils.isExpr;
var isMeta = utils.isMeta;
var isString = utils.isString;
var isArray = utils.isArray;
var tick = utils.tick;
var untick = utils.untick;
var eqObjects = utils.eqObjects;
var names = utils.names;
var values = utils.values;

var compile = {};

function ccError(context, err){
    compile.host.ccError(context, err);
}

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
                        // note: expr shouldn't have anything in it, it's a dummy var
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

//console.log('c2l');
function c2l(exprBlock, depth){
    untick(exprBlock);
    var lisp = "(";
    depth = depth || 0;
    _.map(exprBlock, function(expr){
        // primative
        if(!_.isObject(expr)){
            if(isSym(expr)){ //} || [','].includes(expr)){
                lisp += untick(expr);
            } 
            else if(isString(expr)){
                lisp += '"' + expr + '"';
            }
            else {
                lisp += expr.toString();
            }
            lisp += " ";
            return;
        }
        
        // whitespace logic for sub-expressions
        if(lisp[lisp.length-1] != "("){
            lisp += "\n";
            for(let i = 0; i < depth; i++){
                lisp += "    ";
            }
            if(depth === 0)
                lisp += " "
        }

        // sub expression
        if(isArray(expr)){            
            untick(expr);
            lisp += c2l(expr, depth+1) + " ";
        }
        // meta
        //else if(isMeta(expr)){}
        // object
        else {            
            var nms = names(expr);
            var objNvps = ["`new2"]
            for(let n in expr){
                objNvps.push([tick(n), expr[n]]);
            }
            lisp += c2l(objNvps, depth+1) + " ";
        }
    })
    lisp = lisp.trim() + ")";
    return lisp
}

function convertToLisp(expr, context, callback){
    if(isString(expr)){
        compile.host.parse(expr, context, function(expr){
            callback(c2l(expr));   
        });   
    }
    else{
        callback(c2l(expr));   
    }
}
compile.convertToLisp = utils.fnjs("convertToLisp", convertToLisp);
compile.convertToLisp.isMacro = true;
compile.convertToLisp.useRuntimeScope = true;


module.exports = compile;