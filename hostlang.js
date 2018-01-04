//var fs = require('fs');

var _ = require('underscore');
var utils = require('./utils.js');
var types = require('./types.js');
var parse = require('./parse.js');
var proc = require('./proc.js');
var base = require('./base.c.js')
var compile = require('./compile.js')

// unpack base JSON
base = utils.fromJSON(base);

console.log('hostlang - v0.0.10');

// makes sure the global window object is declared
try{window} catch(e){window = null}    

var log = utils.log;
var copy = utils.copy;
var fnjs = utils.fnjs;
var untick = utils.untick;
var eqObjects = utils.eqObjects;
var isSym = utils.isSym;
var nsym = utils.nsym;
var nmeta = utils.nmeta;
var ssym = utils.ssym;
var tick = utils.tick;

var Fn = types.Fn;
var Fnjs = types.Fnjs;
var Meta = types.Meta;
var Any = types.Any;
var Int = types.Int;
var getType = types.getType;
var isMeta = types.isMeta;
var Symbol = types.Symbol;
var Expression = types.Expression;

var parseHost = parse.parseHost;

var core = {};
function copyToCore(obj){
    for(var n in obj){
        if(obj.hasOwnProperty(n)){
            if(core[n] === obj[n]) continue; // don't copy if it's the same thing and already there
            if(core[n] && core[n].ccode === obj[n])  continue; // don't copy if the "compiled" code of this is already there            
            if(core[n] && core[n] != obj[n].ccode) // warn if overwritting
                console.error("overwritting core field '" + n + "'", [core[n],"to", obj[n]]);
            if(_.isFunction(obj[n])) {// if this is a js function then compile it
                core[n] = fnjs(n, obj[n]);
                if(obj[n].isMacro)
                    core[n].isMacro = obj[n].isMacro;
            }
            else
                core[n] = obj[n];
        }
    }
}
copyToCore(utils);
copyToCore(types);
copyToCore(parse);
copyToCore(base);
copyToCore(compile);

core.core = core;
core.utils = utils;
core.maxCallDepth = 500;
core.__dirname = __dirname;

core.trace = function () {
    var args = _.map(arguments, function(a){return a;});
    if(args.length < 2)
        args = args[0];
    console.trace(args);
    return args;
};

utils.objectPath = fnjs(function(){
    var l = [];
    _.each(arguments, function(a){l.push(a)});
    return {
        type:ObjectPath,
        path:l
    }
});
utils.objectPath.isMacro = true;


core.assertEq = function(context, callback, a, b){
    var rslt = utils.same(a,b);
    if(!rslt)
        return ccError(context, ["Not equal", a, b]);
    //console.log("assertEq", a,b);
    callback(a);
}

var eachSync = proc.eachSync
core.eachSync = proc.eachSync

function bind(context, name, value, offset){
    if(!_.isArray(context) || !context.length)
        throw "bind -- something's wrong, 'context' is invalid";
    if(!Int.isType(offset)) offset = 0;
    if(value === undefined)
        delete context[context.length - (1 + offset)][name];
    else
        context[context.length - (1 + offset)][name] = value;
    return value;
}
core.var = fnjs(function(expr, context, callback){
    untick(expr);
    if(expr.length < 1 || expr.length > 2)
        return ccError(context, ["var -- unexpected number of arguments", expr]);
    var name = ssym(expr[0]);
    var value = expr[1];
    if(value === undefined) value = null;
    evalHost(value,context,function (value) {
        if(value === undefined) value = null;
        bind(context,name,value);
        callback(value);
    });
});
core.var.isMacro = true;
core.var.isInline = true;
core.var.useRuntimeScope = true;

function unbind(context, name){
    var scopes = context;
    for(var bi = scopes.length-1; bi >=0; bi--){
        var nvps = scopes[bi];
        if(nvps[name] !== undefined) {
            var value = nvps[name];
            delete nvps[name];
            return value;
        }
    }
}
function newScope(context, bindings){
    bindings = bindings || {};
    context.push(bindings);
    return bindings;
}
core.newScope = function(context, callback, bindings){
    newScope(context, bindings)
    callback(_.last(context));
}
function exitScope(context){
    context.pop();
}
core.exitScope = function(context, callback){
    exitScope(context);
    callback(_.last(context));
}
function getClosure(context, offset){
    if(!Int.isType(offset)) offset = 0;
    var scopes = _.clone(context);
    for(var i = 0; i < offset; i++)
        scopes.pop();
    return scopes;
}
function getBinding(context, name, offset){
    if(!Int.isType(offset)) offset = 0;
    var scopes = context;
    for(var bi = scopes.length-(1+offset); bi >=0; bi--){
        var nvps = scopes[bi];
        if(nvps[name] !== undefined) {
            return nvps[name];
        }
    }
}
function exportJsfn(context, exportNames){
    context[0].exports = context[0].exports || {};
    exportNames = exportNames || [];

    var scopes = context;
    for(var bi = 0; bi < scopes.length; bi++){
        var nvps = scopes[bi];
        for(var name in nvps)
            if(nvps.hasOwnProperty(name) && (exportNames.length == 0 || _.contains(exportNames, name)))
                context[0].exports[name] = nvps[name]
    }
    return context[0].exports;
}
core.export = {
    type:Fn,
    name:'export',
    params:[
        nmeta("'names&")
    ],
    closure:[],
    code: "exportJsfn context names",
    isMacro:true,
    useRuntimeScope:true
};

var exists = fnjs("exists", function(expr, context, callback){
    untick(expr);
    if(expr.length < 1 || expr.length > 2)
        return ccError(context, "exists -- expects 1 or 2 arguments (a symbol name argument and an optional offset argument), given: " + expr.length);

    var name = untick(expr[0]);
    var offset = expr[1];

    if(!_.isNumber(offset))
        offset = 0;
    var scopes = context;
    for(var bi = scopes.length-(1+offset); bi >=0; bi--){
        var nvps = scopes[bi];
        if(nvps[name] !== undefined) {
            return callback(true);
        }
    }
    return callback(false);
});
exists.isMacro = true;
exists.useRuntimeScope = true;
core.exists = exists;

function set(expr, context, callback) {
    if(expr[0] === '`') expr.shift();
    var name = ssym(expr.shift());
    evalHostBlock(expr, context, function(value){
        var scopes = context;
        for(var bi = scopes.length-1; bi >=0; bi--){
            var nvps = scopes[bi];
            if(nvps[name] !== undefined) {
                nvps[name] = value;
                return callback(value);
            }
        }
        return ccError(context,name + ' is not defined, so it cannot be set. Did you mean to use "var"?');
    });
}
core.set = fnjs("set",set);
core.set.isMacro = true;
function rm(expr, context, callback) {
    expr = untick(expr);
    var name = ssym(expr.shift());
    if(getBinding(context,name) === undefined)
        return ccError(context,name + " does not exist so it cannot be removed");
    var value = unbind(context, name);
    callback(value);
}
core.rm = fnjs("rm",rm);
core.rm.isMacro = true;
core.delete = core.rm;

function acrJs(expr, context, callback){
    //console.log('acr');
    if(expr[0] ===  '`') expr.shift();    
    var path, value, root, ref;
    path = expr[0];
    value = expr[1];
    root = expr[2];
    ref = expr[3];

    if(_.isString(path))
        path = path.replace(/\./g, ' ').split(' ');

    if(path[0] === '`') path.shift();

    if(root === undefined){
        var rootName = path.shift();
        return evalHost(rootName, context, function(rslt){
            //if(!_.isObject(rslt) && !_.isString(rslt))
            //    return ccError(context, {msg:"acr: '" + rootName + "' is an invalid root object",value:rslt});
            acrJs([path, value, rslt, rslt], context, callback);
        });
    }

    var nn = path.shift();
    if(nn === undefined && value === undefined) return callback(ref);
    if(nn === undefined && value)
        return ccError(context,"acr: cannot set a value without a path of 2 or more");

    // if symbol get name
    if(isSym(nn))
        nn = ssym(nn);

    // if it's a literal, assume we want to evaluate it now
    if(isMeta(nn) && nn.isLiteral)
        nn.isLiteral = false;

    // if it's something unevaluated, evaluate it
    if(_.isArray(nn) || isSym(nn) || isMeta(nn)){
        var ctx = _.clone(context); ctx.pop(); // prevents naming collisions (e.g. path)
        var nnCopy = copy(nn);
        return evalHost(nn, ctx, function(rslt){
            if(_.isArray(rslt) && !Expression.isType(rslt))
                return ccError(context,["acr -- path part evaluated to an array", nnCopy, rslt]);
            path.unshift(rslt);
            acrJs([path, value, root, ref], context, callback);
        });
    }

    // if not string, convert to string
    if(!_.isString(nn))
        nn = '' + nn;

    // special array accessor for offset from last
    if((_.isArray(ref) || _.isString(ref)) && nn.match(/^-[0-9]+$/)){
        nn = Number(nn);
        nn = ref.length + nn;
    }

    if(path.length !== 0){
        var newRef = ref[nn];
        if(newRef === undefined || newRef === null){
            if(!value)
                return callback(null);
            newRef = {};
            ref[nn] = newRef;
        }
        return acrJs([path, value, root, newRef], context, callback);
    }

    if(value !== undefined){
        ref[nn] = value;        
        return callback(root);
    }
    var rtnVal = ref[nn]
    if(_.isFunction(rtnVal)){
        rtnVal = fnjs(nn, rtnVal);
        rtnVal.context = ref;
    }        
    return callback(rtnVal);
}
core.setr = {
    name:"setr",
    type:Fn,
    params:[
        nmeta('path*'),
        nmeta('value?')
    ],
    returns: Any,
    closure:[],
    code: "acrJs path value",
    useRuntimeScope: true,
    isInline: true
};
core.getr = {
    name:"getr",
    type:Fn,
    params:[
        nmeta('path*')
    ],
    returns: Any,
    closure:[],
    code: "acrJs path",
    useRuntimeScope: true,
    isInline: true
};

function fn(expr, context, callback) {

    var name, params, return_type, ccode;
    untick(expr);
    if(!_.isArray(expr[0]))
        name = untick(expr.shift());
    params = untick(expr.shift());
    //assertType(params, [*(|| Meta Symbol)])
    if(!_.isArray(params))
        return ccError(context, ["fn -- invalid value for 'params'", params]);
    if(isMeta(expr[0]))
        return_type = expr.shift();
    ccode = expr;

    params = _.map(params,function(p){
        if(isSym(p))
            return nmeta(ssym(p));
        return p;});

    var offset = 0;
    var f = {type:Fn.id};
    f._sourceFile = expr._sourceFile;
    f._sourceLine = expr._sourceLine;
    if(name){
        f.name = name;
        bind(context, name, f, offset);
    }
    if(return_type) f.return_type = return_type;
    f.params = params;
    f.ccode = ccode;
    f.closure = getClosure(context,offset);
    
    if(return_type){
        evalHost(return_type, context, function(return_type){
            f.return_type = return_type;
            callback(f);
        })
    } else {
        callback(f);
    }
}
core.fn = fnjs("fn",fn);
core.fn.isMacro = true;
core.fnm = fnjs("fnm",function(expr, context, callback){
    fn(expr, context, function(f){
        f.isMacro = true;
        callback(f);
    });
});
core.fnm.isMacro = true;
core.fnp = fnjs("fnp",function(expr, context, callback){
    fn(expr, context, function(f){
        f.closure = null;
        callback(f);
    });
});
core.fnp.isMacro = true;

function mapArgs(aFn, args, context, callback){
    var isMacro = !!aFn.isMacro;
    var params = copy(aFn.params) || [];

    function gettype(item, context, callback){
        getType([item], context, callback);
    }
    // get arg types
    eachSync(args,gettype,context, function(argTypes){

        // figure out which argument goes with which param
        var iParams = _.map(_.keys(params),function(n){return Number(n)});
        var argsMap = []; // should be the same length as params by the end
        function bindArg(ip,a){
            var p = params[ip];
            // todo: check type
            if(isMacro && p.isQuote && p.isRest)
                a = _.map(a,function(a_item){
                    return untick(a_item);
                });
            else if(isMacro && p.isQuote)
                a = untick(a);
            argsMap[ip]=a;
        }
        function typeFit(fromType, toType){
            if(Any.isType(toType)) return true;
            return eqObjects(fromType, toType);
        }

        // match named args first
        for(var i = args.length-1; i >= 0; i--){
            var a = args[i];
            if(isMeta(a) && a.name){
                var ip = _.findIndex(params,function(p){return p.name == a.name});
                if(ip > -1){
                    bindArg(ip, a.value);
                    args.splice(i,1);
                    iParams = _.without(iParams,ip);
                }
            }
        }

        // match unnamed args by position and type, set default values for everything else, throw error if no valid match
        while(iParams.length){
            var ip = iParams.shift();
            var p = params[ip];
            var pType = argTypes[ip];

            // match rest param
            if(p.isRest){
                bindArg(ip, args);
                args = [];
                continue;
            }

            var a = args[0];
            // if arg available and types match, html
            if(args.length && typeFit(pType,p.value_type)){ //canBind(a,p)){
                bindArg(ip,a);
                args.shift();
            }
            // if it's optional or has a default value, html to param value
            else if(p.value !== undefined || p.isOptional){
                bindArg(ip, p.value);
            }
            else // if no arg available and types don't match and param isn't optional, throw error
                return ccError(context,{msg:'invalid value specified for param',param:p,value:a,fn:aFn});
        }

        if(args.length > 0)
            return ccError(context,{msg:'unmatched arguments',args:args,fn:aFn});

        // if it's not a macro we can just return
        if(!isMacro)
            return callback(argsMap);

        // if it is a macro, eval params where p.isTick = true
        var iArgs = _.map(_.keys(argsMap),function(k){return Number(k)});
        function evalTickedArgs(ia, context, callback){
            var p = params[ia];
            var a = argsMap[ia];
            if(!p.isTick) return callback(a);
            evalHost(a, context, callback);
        }
        //eachAsync(iArgs,evalTickedArgs,context, callback);
        eachSync(iArgs,evalTickedArgs,context, callback);
    });
}
function applyFn_JS(expr, context, callback){
    var f = expr.shift();

    // convert js function to fn object
    if(_.isFunction(f)){
        f = fnjs(f);
        expr[0] = f;
    }

    if(!eqObjects(f.type,Fnjs)) throw "evalFn_JS called with invalid function";

    // if there isn't compiled code we need to do that first
    if(!_.isFunction(f.ccode)){
        var ccode = f.code;
        if(!ccode.includes('function'))
            ccode = 'function(){ return ' + ccode + ';}';
        try{
            f.ccode = eval('(' + ccode + ')');
        } catch(err){
            return ccError(context, err.toString());
        }
    }

    // best case -- if it looks like it's in correct host form, just call it
    if(f.hostForm || f.code.trim().split('\n')[0].includes("(expr, context, callback)")){
        f.hostForm = true;
        return f.ccode.apply(f.context, [expr, context, callback]);
    }

    // best case -- it's in explicitly an async function
    if(f.async || f.code.trim().split('\n')[0].includes(", context, callback)")){
        f.async = true;
        expr.push(context, callback);
        return f.ccode.apply(f.context, expr);
    }

    // best case -- it's in explicitly an async function
    if(f.asyncRest || f.code.trim().split('\n')[0].includes("(context, callback")){
        f.asyncRest = true;
        expr.unshift(context, callback);
        return f.ccode.apply(f.context, expr);
    }

    // call the function and capture a possible synchronous result
    try{
        var rslt = f.ccode.apply(f.context, expr);
    }catch(err){
        return ccError(context, err.toString());
    }

    // good case - if no reference to 'callback' assume it was synchronous and do the callback for them
    if(f.async === false || !f.code.includes('callback(')){
        f.async = false;
        return callback(rslt);
    }

    // bad/unpredictable case - not normal host form but async so remove any compiled code since it's enclosed callback and that needs to be updated
    console.warn("bad/unpredictable case for JS apply", f);
    f.ccode = null;
}
function applyFn_host(expr, context, callback){
    var f = expr[0];
    if(!eqObjects(f.type, Fn))
        return ccError(context,{msg:"applyFn_host called with invalid host function",expr:expr});
        //throw "evalFn_host called with invalid host function";

    // if we don't have a compiled (parsed) version of the code do that first
    if(!f.ccode){
        return parseHost(f.code,context, function(rslt){
            f.ccode = rslt;
            f.closure = f.closure || [];//getClosure(context);
            applyFn_host(expr, context, callback);
        });
    }

    expr.shift(); // remove fn from list
    var args = expr; // remaining list are the args
    var argsO = _.clone(args);

    // map args for function
    mapArgs(f, args, context, function(args){

        // html args to param names
        var params = f.params || [];
        var bindings = {_source:"applyFn_host"};
        for(var i = 0; i<params.length; i++){
            var p = params[i];
            var a = args[i];
            bindings[p.name] = a;
        }
        // do this here to capture state of context
        bindings.onCallback = makeContinuation(context, callback);
        bindings.onError = getBinding(context,"onError");
        // isInline means don't treat as new function call so don't capture return continuation
        if(!f.isInline){
            bindings._args = _.clone(argsO); // special _args keyword
            bindings.this = f;
            bindings.onReturn = makeContinuation(context,callback);
            bindings.onReturn.sourceFn = f.name || "anon";
        }

        var fnScopes = _.clone(f.closure) || [];
        if(!f.useRuntimeScope)
            context = fnScopes;
        // // maybe -- when "useRuntimeScope" do this...
        // else if(_.isArray(f.closure) && f.closure.length){
        //     context = _.clone(context);
        //     Array.prototype.push.apply(context, f.closure)
        // }
        newScope(context,bindings);

        // execute function
        var code = copy(f.ccode); // copy code, we don't want to mess up fn which is a template for all calls
        evalHostBlock(code,context, function (rslt) {
            ccCallback(context, rslt);
        });
    });
}
var applyTypes = {};
applyTypes.default = function(expr, context, callback){
    return ccError(context, ["value not recognized as function",expr[0]]);    
};
applyTypes[Fnjs.id] = applyFn_JS;
applyTypes[Fn.id] = applyFn_host;
function applyHost(expr, context, callback){
    //console.log('apply', expr, context, callback);
    bind(context,"callback",callback);

    // call type specific apply
    var aFn = expr[0]; // args are rest

    if(_.isFunction(aFn)){
        aFn = fnjs(aFn);
        expr[0] = aFn;
    }

    //var fnType = gettype(aFn);
    getType([aFn], context, function (fnType) {
        //if(fnType == Fn) fnType = type_fn_id;
        //fnType = fnType.id
        var typeApply = applyTypes[fnType.id || fnType] || null;
        if(typeApply === null)
            typeApply = applyTypes['default'];
        //return typeApply(expr, context, callback);

        // macro, so don't eval args
        if(aFn && aFn.isMacro){
            return typeApply(expr, context, callback);
        }

        // not macro, so eval args
        expr.shift(); // don't eval fn again
        //eachAsync(expr, evalHost, context, function(expr){
        eachSync(expr, evalHost, context, function(expr){
            expr.unshift(aFn);
            if(aFn === '`')
                return callback(expr);
            typeApply(expr, context, callback);
        });
    });
}
core.applyHost = applyHost;
core.apply = {
    type:Fn,
    name:'apply',
    params:[
        nmeta('f'),
        nmeta('args*')
    ],
    closure:[],
    code: "eval (tick (unshift args f))",
    useRuntimeScope:true,
    isInline: true
};

function evalJs(code){    
    return eval('(function(_){return ' + code.trim() + ';})()');
}
function evalSym(expr, context, callback){
    var symbol = expr;

    // if it's not a symbol just return it
    if(!isSym(symbol))
        return callback(symbol);

    // if it's a tick or quote by itself, just return
    if(symbol === '`' || symbol === "'")
        return callback(symbol);

    // convert symbol to string
    var sym = untick(symbol); //ssym(symbol);

    // if it's quoted, convert quote to tick and return
    if(sym[0] === "'"){
        //sym[0] = '`';
        sym = '`' + sym.substring(1);
        return callback(sym);
    }

    // if it's ticked, evaluate then return as unevaluated
    if(sym[0] === "`"){
        //return callback(sym);
        return evalSym(sym,context,function (rslt) {
            rslt = tick(rslt);
            return callback(rslt);
        });
    }

    // special 'context' symbol to access context
    if(sym === 'context') return callback(context);

    // look in context
    var scopes = context;
    for(var bi = scopes.length-1; bi >=0; bi--){
        var nvps = scopes[bi];
        if(nvps[sym] !== undefined) {
            return callback(nvps[sym]);
        }
    }

    // special window keyword
    if(sym === "window")
        return callback(window);    

    // if we didn't resolve '_' by now return null for it (don't want to mess around with what it might mean outside of context)
    if(sym === '_') return callback(null);

    // if we didn't resolve 'this' by now return null for it (don't want to mess around with what it might mean outside of context)
    if(sym === 'this') return callback(null);
    
    // look in core
    if(core[sym])
        return callback(core[sym]);

    // // look in Types
    // var Types = types.Types;
    // for(var i = Types.length - 1; i>=0; i--){
    //     if(Types[i].name == sym)
    //         return callback(Types[i]);
    // }        
    
    return ccError(context,"Couldn't resolve symbol: " + sym);

}
function evalMeta(expr, context, callback){
    var meta = expr;
    var names = _.keys(meta);
    function evalMetaPart(expr, context, callback){
        var name = expr;
        var value = meta[name];
        // if not unevaluated then return
        if(!(Symbol.isType(value) || Expression.isType(value)))
            return callback(value);
        evalHost(value, context, function(value){
            meta[name] = value;
            callback(value);
        });
    }
    return eachSync(names, evalMetaPart, context, function(metaValues){
        callback(meta);
    });
}
function evalHost(expr, context, callback){
    var top = context[0];
    top.callDepth++;
    if(top.callDepth > core.maxCallDepth){
        console.error('resetting stack');
        return setTimeout(function(){top.callDepth = 0; evalHost(expr, context, callback);}, 0);
    }

    //console.log('eval', expr);

    // evalMeta
    if(expr && eqObjects(expr.type, Meta) && expr !== Meta){
        return evalMeta(expr, context, callback);
    }

    // if not list, eval symbol
    if(!_.isArray(expr)){
        if(!isSym(expr))
            return callback(expr);
        return evalSym(expr,context, callback);
    }

    // no backtick means this has already been processed
    if(expr[0] !== '`')
        return callback(expr);
    else
        expr.shift(); // remove back-tick

    // check for quote, means don't eval (leave as symbols)
    if(expr[0] === "'"){
        expr[0] = '`'; // replace quote with backtick and return
        return callback(expr);
    }

    //console.log(_.clone(expr));
    context[0]._lastEvaled = expr;
    core._lastEvaled = expr;

    //var aFn = expr.shift();
    var aFn = expr[0];
    evalHost(aFn, context, function(aFn){
        //expr.unshift(aFn);
        expr[0] = aFn;
        applyHost(expr,context,callback);
    });
}
function evalHostBlock(expr, context, callback){
    expr = untick(expr);
    
    // short circuit on nonlist, and list lengths zero and one
    if(!_.isArray(expr)){
        if(expr === undefined)
            expr = null;
        expr = [expr]
    }
    if(expr.length === 0){
        bind(context, "_", null);
        return callback(null);
    }
    if(expr.length === 1){
        return evalHost(expr[0], context, function(rslt){
            bind(context, "_", rslt);
            callback(rslt);
        });
    }
    
    function evalExpr(expr, context, callback){
        evalHost(expr, context,function(rslt){
            if(rslt === undefined) rslt = null; // don't want to set _ to undefined because of scoping
            bind(context,"_", rslt);
            callback(rslt);
        });
    }    

    eachSync(expr, evalExpr, context, function(rslts){
        var rslt = null;
        if(rslts && rslts.length) rslt = rslts[rslts.length - 1];
        return callback(rslt);
    });
}
function evalHostBlockWrapper(expr, context, callback){
    evalHostBlock(expr[0],context, callback);
}
core.eval =  {
    type:Fn,
    name:"eval",
    params:[
        nmeta('expr')
    ],
    closure:[],
    code: 'evalHostBlock expr',
    useRuntimeScope: true,
    isInline: true
};
core.evalBlock =  {
    type:Fn,
    name:"evalBlock",
    params:[
        nmeta("expr&")
    ],
    closure:[],
    code: "evalHostBlockWrapper expr",
    useRuntimeScope: true,
    isMacro: true,
    isInline: true
};

core.evalOutside = fnjs(function(expr, context, callback){
    var outsideCnt = 1;
    if(expr.length === 2){
        outsideCnt = expr.shift();
        if(!_.isNumber(outsideCnt))
            return ccError(context, ['evalOutside -- when 2 arguments are given, first should be number of scopes to move out before evaluating. Given:', outsideCnt])
    }
    if(expr.length !== 1)
        return ccError(context, ["evalOutside -- passed invalid number of arguments to evaluate. expecting 1, given:", expr]);
    var exprArg = expr[0];

    var newContext = _.clone(context);
    for(var i = 0; i<outsideCnt; i++)
        newContext.pop();

    evalHost(exprArg,newContext,callback);
    //
});
core.evalOutside.useRuntimeScope = true;
core.evalOutside.isInline = true;
core.evalScope = function(context, callback, code, bindings, options){
    options = options || {};
    var bindings = bindings || {};
    
    // do this here to capture state of context
    bindings.onCallback = makeContinuation(context, callback);
    //bindings.onError = getBinding(context,"onError");

    // isInline means don't treat as new function call so don't capture return continuation
    if(!options.isInline){
        bindings.onReturn = makeContinuation(context,callback);        
    }

    context = _.clone(context);    
    newScope(context,bindings);

    // execute code
    var code = copy(code);
    evalHostBlock(code,context, function (rslt) {
        ccCallback(context, rslt);
    });
}

function makeContinuation(context, callback){
    return {
        type:"Continuation",
        closure: getClosure(context),
        context: context,
        callback: callback
    };
}
function callContinuation(expr, context, callback){
    // NOTE: callback is never called, thus altering path of execution
    expr = untick(expr);
    var name = expr[0];
    var value = expr[1];
    var cont = getBinding(context,name);
    if(!cont || cont.type !== "Continuation")
        if(name === "onError")
            throw  {type: Error, msg: "unhandled error", innerError: value};
        else
            return ccError(context, name + " is not a continuation");
    //context.scopes = cont.closure;
    cont.context.length = 0;
    Array.prototype.push.apply(cont.context, cont.closure);
    if(cont.context !== context){
        context.length = 0;
        Array.prototype.push.apply(context, cont.closure);
    }
    cont.callback(value); // NOTE: we could return context ref if we wanted to
    //cont.callback(value, context);
}
core.captureContinuation = fnjs("captureContinuation",function (expr, context, callback) {
    var cb = getBinding(context,"callback");
    var cc = makeContinuation(context, cb);
    callback(cc);
});
core.return = fnjs("return",function(expr, context, callback){
    expr = untick(expr);
    if(expr.length > 1)
        return ccError(context,'return called with more than 1 param');
    var rslt = expr[0];
    callContinuation(["onReturn", rslt], context, callback);
    //ccReturn(context,rslt);
});
core.error = fnjs("error",function(expr, context, callback){
    expr = untick(expr);
    if(expr.length > 1)
        return ccError(context,'error called with more than 1 param');
    var err = expr[0];
    callContinuation(["onError", err], context, callback);
    //ccError(context,err);
});
core.exit = fnjs("exit",function(expr, context, callback){
    expr = untick(expr);
    if(expr.length > 1)
        return ccError(context,'exit called with more than 1 param');
    var rslt = expr[0];
    callContinuation(["onExit", rslt], context, callback);
});
core.continue = fnjs("continue",function(expr, context, callback){
    expr = untick(expr);
    if(expr.length > 1)
        return ccError(context,'continue called with more than 1 param');
    var rslt = expr[0];
    callContinuation(["onContinue", rslt], context, callback);
});
core.break = fnjs("break",function(expr, context, callback){
    expr = untick(expr);
    if(expr.length > 1)
        return ccError(context,'break called with more than 1 param');
    var rslt = expr[0];
    callContinuation(["onBreak", rslt], context, callback);
});
function ccError(context, err){
    callContinuation(["onError", err], context, null);
}
function ccCallback(context, value){
    callContinuation(["onCallback", value], context, null);
}
function ccContinue(context, value){
    callContinuation(["onContinue", value], context, null);
}
function ccBreak(context, value){
    callContinuation(["onBreak", value], context, null);
}

function tryCatchJs(expr, context, callback){
    expr = untick(expr);
    var tryCode = expr[0];
    var catchCode = expr[1];
    //return callback({tryCode:tryCode, catchCode:catchCode});
    var bindings = {_source:'tryCatchJs'};
    bindings.onError = makeContinuation(context,function(err){
        // make catch function
        catchCode = untick(catchCode);
        catchCode.unshift(core.fn);
        applyHost(catchCode,context,function(catchFn){
            catchFn.isInline = true;
            // call catch function
            applyHost([catchFn, err], context,callback);
        });
    });
    bindings.onCallback = makeContinuation(context,callback);
    newScope(context,bindings);

    try {
        evalHostBlock(tryCode,context,function (rslt) {
            ccCallback(context,rslt);
        });
    } catch (err){
        ccError(context,err);
    }
}
core.try = {
    type:Fn,
    name:"try",
    params:[
        nmeta('tryCode&'),
        //nmeta('catchCode?',[["`err"],['`',log,"ERROR!","`err"]])
        nmeta('catchCode?',[["`err"],"`err"])
    ],
    closure:[],
    code: 'tryCatchJs tryCode catchCode',
    useRuntimeScope: true,
    isMacro: true,
    isInline: true
};

core.cond = fnjs("cond",function(expr, context, callback){
    var oThis = getBinding(context,"_");
    var i = -1;
    function next(){
        i++;
        if(i >= expr.length)
            return callback(oThis);
        var branch = expr[i];
        if(!_.isArray(branch))
            return ccError(context, ["cond -- expected list, given ", branch]);
        untick(branch);
        evalHost(branch.shift(), context, function(rslt){
            if(rslt)
                evalHostBlock(branch,context,callback);
            else
                next();
        });
    }
    next();
});
core.cond.useRuntimeScope=true;
core.cond.isMacro=true;
core.cond.isInline=true;

function eachJs(expr, context, callback){
    expr = untick(expr);
    var items = expr[0];
    var iRef = expr[1];
    var loopBody = expr[2];

    var bindings = {_source:"eachLoop"};
    bindings.onBreak = makeContinuation(context,callback);
    newScope(context,bindings);

    function loop(item, context, callback) {
        bind(context,iRef,item);
        bindings.onContinue = makeContinuation(context, callback);
        evalHostBlock(copy(loopBody),context,callback);
    }
    eachSync(items,loop,context,function (rslt) {
        ccBreak(context,rslt);
    });
}
core.each = {
    type:Fn,
    name:"each",
    params:[
        nmeta("``items"),
        nmeta("'iRef"),
        nmeta('loopBody&')
    ],
    closure:[],
    code: 'eachJs items iRef loopBody',
    useRuntimeScope: true,
    isMacro: true,
    isInline: true
};
core.map = core.each;

function forJs(expr, context, callback){
    // for (<symName> <?start=0> <end> <?step=1>) <*syncCode>
    untick(expr);
    var params = expr.shift();
    if(!_.isArray(params))
        return ccError(context, {msg:"forLoop - params should be a list",params:params});
    untick(params);
    var itemSym = ssym(params.shift());
    if(!_.isString(itemSym) || !itemSym.length)
        return ccError(context,{msg:"forLoop - called with invalid iterator name",iteratorName:itemSym});


    untick(params);
    eachSync(params,evalHost,context,function(params){
        if(params.length > 3)
            return ccError(context,{msg:"forLoop - too many params, maximum of 4: iterator name, start, end, step",params:params});

        var start=0, end=null, step=null;
        if(params.length > 2)
            step = params[2];
        if(params.length > 1){
            start = params[0];
            end = params[1];
        }
        if(params.length === 1)
            end = params[0];

        if(step === null){
            if(end < start) step = -1;
            else step = 1;
        }

        if(!(_.isNumber(start) && _.isNumber(end) && _.isNumber(step)))
            return ccError(context, {msg:'forLoop - start, end or step is not a number', start:start, end:end, step:step});

        // if the limits are already reached just return '_'
        if((step > 0 && start > (end-1)) || (step < 0 && start < (end + 1))){
            return callback(getBinding(context,'_'));
        }

        var bindings = {_source:"forLoop"};
        bindings.onBreak = makeContinuation(context,callback);
        newScope(context,bindings);


        function loopBody(item, context, callback){
            bindings.onContinue = makeContinuation(context, callback);
            var code = copy(expr);
            newScope(context,{_source:"forLoopBody"});
            bind(context,ssym(itemSym), item);
            evalHostBlock(code, context, function(rslt){
                exitScope(context);
                callback(rslt);
            });
        }

        var p = null;
        var i = start;
        function interCall(rslt){            
            i += step;
            // if we're not done, add another item to the call list
            //if(!((step > 0 && i > end) || (step < 0 && i < end))){
            if(!((step > 0 && i > (end-1)) || (step < 0 && i < (end + 1)))){
                p.items.push(i); // TODO we could just set p.items.[0]=i && p.itemIndex=0
            }
        }        
        p = proc.new(loopBody, [i], interCall, context, function(rslt){
            //ccBreak(context,rslt);
            exitScope(context);
            callback(rslt);
        });
        p.start();
        
        // return;
        // var i = null;
        // function next(rslt){
        //     if(i === null)
        //         i = start;
        //     else
        //         i += step;
        //     if((step > 0 && i > end) || (step < 0 && i < end))
        //         ccBreak(context,rslt);
        //     else
        //         loopBody(i, context, next);
        // }
        // next();
    });
}
core.for = fnjs("for",forJs);
core.for.isMacro = true;
core.for.useRuntimeScope = true;

function whileJs(expr, context, callback){
    // 	while <condition> <*syncCode>

    untick(expr);
    var condition = expr.shift();
    //var oCallback = callback;
    //var oExpr = expr;
    //var oContext = context;

    var bindings = {_source:"whileLoop"};
    bindings.onBreak = makeContinuation(context,callback);
    newScope(context,bindings);

    function loop(bodyRslt){
        var ccond = copy(condition);
        evalHost(ccond, context, function(rslt){
            if(!rslt) return ccBreak(context,bodyRslt);
            var cexpr = copy(expr);
            bindings.onContinue = makeContinuation(context,loop);
            evalHostBlock(cexpr, context, loop);
        });
    }
    loop();
}
core.while = fnjs("while",whileJs);
core.while.isMacro = true;

function orderJs(expr, context, callback){
    untick(expr)
    var items = expr.shift();
    var iterName = untick(expr.shift());
    var loopBody = expr;

    evalHost(iterName, context, function(iterName){
        evalHost(items, context, function(items){
            
            var bindings = {_source:"order"};
            //bindings.onBreak = makeContinuation(context,callback);
            newScope(context,bindings);
        
            function loop(item, context, callback) {
                bind(context,iterName,item);
                bindings.onContinue = makeContinuation(context, callback);
                evalHostBlock(copy(loopBody),context,callback);
            }
            eachSync(items,loop,context,function (itemOrders) {
                var itemsWithOrders = _.map(itemOrders,function(odr, i){
                    return {
                        item:items[i],
                        order:odr
                    }
                });
                var sortedItemsWithOrders = _.sortBy(itemsWithOrders,"order");
                var sortedVals = _.pluck(sortedItemsWithOrders,"item");
                exitScope(context);
                callback(sortedVals);
            });            
        });    

    });    
}
core.order = fnjs("order",orderJs);
core.order.isMacro = true;
core.order.useRuntimeScope = true;

core.toInt = function toInteger(value) {
    return Math.floor(Number(value) || 0);
}

core.sleep = function(expr, context, callback){
    // sleep(ms=0)
    untick(expr);
    var ms = expr.shift() || 0;
    setTimeout(function(){
        callback(getBinding(context,'_'));
    }, ms);
}
core.interval = function(context, callback, interval_ms, f){
    context = _.clone(context);
    var hndl = setInterval(function(){
        evalHost(['`', f], _.clone(context), _.noop);
    }, interval_ms);
    callback(hndl);
}

core.exportJsfn = exportJsfn;
core.acrJs = acrJs;
core.evalJs = evalJs;
core.js = evalJs;
core.evalHostBlock = evalHostBlock;
core.evalHostBlockWrapper = evalHostBlockWrapper;
core.bind = bind;
core.tryCatchJs = tryCatchJs;
core.eachJs = eachJs;
core.callContinuation = callContinuation;


//================================================= EXPORTS ============================================================

function contextInit(context, callback, onError) {

    if(!_.isFunction(callback)) throw "callback is not a function";

    if(_.isObject(context) && !_.isArray(context))
        context = [context];
    context = context || [{}];
    var root = _.first(context);
    root.callDepth = root.callDepth || 0;
    root.onExit = makeContinuation(context, callback);
    root.onReturn = makeContinuation(context, callback);
    root.onReturn.source = "rootInit";

    if(onError)
        root.onError = makeContinuation(context, onError);

    root.include = root.include || [];
    root.exports = root.exports || {};

    return context;
}

function parseHostWrapper(expr, context, callback, onError){
    context = contextInit(context, callback, onError);
    parseHost(expr, context, callback);
}

function run(code, context, callback, onError) {
    //context = context || {};
    callback = callback || context && context.exit || console.log;
    onError = onError || console.error;

    //console.log(core.names);

    // prevent concurrent runs against the same context
    context = contextInit(context, callback, onError);
    var top = _.first(context);
    top.callDepth = 0;
    // if(top._isRunning){
    //     console.warn("context is already in use or was left in an error state from last run");
    //     //return ccError(context, "context is already in use");
    // }

    // set start time
    top._startTime = Date.now();

    // update context as not running prior to callback
    function processCallback(rslt){
        if(top._isRunning){
            top._ranMs = Date.now() - top._startTime;
            if(!top._silent)
                console.log((top._parsedMs + top._ranMs) + " ms - " +
                    (top._sourceFile || "<anonymous>") + " parsed in " + top._parsedMs + " ms, ran in " + top._ranMs + " ms");
        }
        top._isRunning = false;
        callback(rslt);
    }
    function processError(err){
        top._isRunning = false;
        if(onError)
            onError(err);
        else
            console.error(err);
    }
    context = contextInit(context, processCallback, processError);
    top._isRunning = true;

    // if it's a string, assume it's code that needs to be parsed first
    if(_.isString(code)){
        parseHost(code, context, function (rslt) {
            //setTimeout(function(){
                top._isRunning = false;
                top._parsedMs = Date.now() - top._startTime;
                //console.log(top._source + " parsed in " + top._parsedMs + " ms");
                run(rslt, context, processCallback, processError);
            //},0);
        });

        return top;
    }

    //proc.initProc(code,context, processCallback);
    evalHostBlock(code, context, processCallback);

    return top;
}

core.run = function(context, callback, code){
    
    // var bindings = {_source:'run'}
    // bindings.onCallback = makeContinuation(context, callback);
    // bindings.onError = getBinding(context,"onError");
    // bindings.onReturn = makeContinuation(context, callback);
    // bindings.onReturn.sourceFn = "run";
    // newScope(context, bindings);
    
    // if(_.isString(code)){
    //     return parseHost(code,context, function(code){
    //         context.pop();
    //         core.run(context, callback, code);
    //     });
    // }

    // evalHostBlock(code, context, function(rslt){
    //     ccCallback(context, rslt);
    // });    

    if(_.isString(code)){
        return parseHost(code,context, function(code){
            core.run(context, callback, code);
        });
    }
    evalHostBlock(code, context, callback);    
}

core.GET = function(context, callback, path, options){
    if(path.substring(0,3) === "fs:"){
        path = path.substring(3);
        var fs = require('./fs.js');
        //fs.host = module.exports;//host;
        fs.init(module.exports);
        // check if path exists
        fs.isDir(path, context, function(isDir){
            // if dir, return file names
            if(isDir){
                fs.ls(path, context, callback);
            } 
            // if file, return file contents
            else {                
                fs.readFile(context, callback, path, options)
            }
        });

    } else {
        window.GET(path, null, callback, function(err){
            ccError(context,err);
        });
    }    
}

core.SAVE = function(context, callback, path, contents, options){
    if(path.substring(0,3) === "fs:"){
        path = path.substring(3);
        var fs = require('./fs.js');
        fs.init(module.exports);
        fs.writeFile(context, callback, path, contents, options)
    }
    else {
        window.SAVE(contents,{
            path:path,
            options:options,
            onError:function(err){
                ccError(context,err);
            }
        }, callback);
    }
}

var core_require_cache = {}
core.require = function(context, callback, path, force){
    if(core_require_cache[path] && !force){
        if(core_require_cache[path]._loading)
            console.warn(path + " was required while it was still loading");
        return callback(core_require_cache[path]);
    }  
    function afterGet(code){
        var newContext = {_sourceFile:path,exports:{_source:path,_loading:true}};
        core_require_cache[path] = newContext.exports;
        run(code, newContext, function(rslt){
            delete core_require_cache[path]._loading;
            callback(core_require_cache[path]);
        },function(err){
            delete core_require_cache[path];
            ccError(context,err)
        });
    }
    core.GET(context, afterGet, path);      
}


module = module || {};
module.exports = {
    core: core,
    //eachAsync: eachAsync,
    eachSync: eachSync,
    contextInit: contextInit,
    parser: parse,
    parse: parseHostWrapper,
    //compile: compile,
    run: run,
    //runFile: runFile,
    ccError: ccError,
    evalHost: evalHost,
    evalJs: evalJs,
    evalSym: evalSym,
    evalMeta: evalMeta,
    applyHost: applyHost,
    bind:bind,
    utils:utils,
    types:types
};
var host = module.exports || {};
host.utils = utils;
host.evalJs = evalJs;
utils.host = host;
types.host = host;
parse.host = host;
proc.host = host;
compile.host = host;

if(false){
        
    //reader.host = host;
    //serveJs.host = host;

    //console.log(args)


    // below should be moved to a CLI specific script

    // // =========  repl logic below ====================

    // var errorCB = function(err){console.error("ERROR!"); console.error(err);};
    // var ctx = contextInit({}, console.log, errorCB);
    // var ctx0 = ctx[0];
    // ctx0._silent = true;

    // // host.repl = function(expr, context, callback){
    // //
    // // };

    // // for certain args situations get out
    // if(args.length === 0 || args[0] === "--no-sandbox" /*for electron*/)
    //     return;

    // // -e means evaluate and return
    // if (args[0] === '-e'){
    //     run(args[1], ctx, console.log, errorCB);
    //     return;
    // }
    // // repl means just start the repl
    // else if(args[0] === 'repl'){
    //     run('"host ready"', ctx, console.log, errorCB)
    // }
    // // otherwise assume it's a file path
    // else{
    //     var returnAfter = false;
    //     var file = args.shift();
    //     if(file === "-f"){
    //         returnAfter = true;
    //         file = args.shift();
    //     }

    //     var fileArgs = args;
    //     fileArgs = _.map(fileArgs,function(a){
    //         if(a[0] !== '"' && a.includes('=')){
    //             var iEq = a.indexOf('=');
    //             var aName = a.substr(0,iEq);
    //             a = a.substring(iEq+1);
    //             ctx[aName] = a;
    //         }
    //         return a;
    //     });

    //     ctx0._args = fileArgs;
    //     reader.read([file, "utf8"], ctx, function(fileContents){
    //         ctx[0]._sourceFile = file;
    //         run(fileContents, ctx, console.log, errorCB)
    //     });

    //     if(returnAfter)
    //         return;
    // }

    // const repl = require('repl');
    // function replEval(cmd, context, filename, callback) {
    //     var ppRslt = function(rslt){
    //         if(types.Fn.isType(rslt))
    //             rslt = "#Fn: " + (rslt.name || "<anon>") + " " + utils.dataToString(rslt.params,4);
    //         if(_.isObject(rslt) && !_.isFunction(rslt))
    //             rslt = utils.dataToString(rslt,4);
    //         callback(rslt);
    //     };
    //     run(cmd,ctx,ppRslt,errorCB);
    // }
    // repl.start({prompt: '<< ', eval: replEval});

}