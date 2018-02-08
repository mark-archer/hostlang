"use strict";

//console.log('utils');

var _ = _ || require('underscore');
var uuid = require('uuid');

var utils = {}

var ko = null;
try{var ko = window.ko;} 
catch (err){}


// add all underscore functions, then remove the ones Host has it's own take on
//for(var n in _) utils[n] = _[n];
// delete utils.bind;
// delete utils.map;
// delete utils.range;
// delete utils.reduce;
// delete utils.isObject;
// delete utils.isFunction;
// delete utils.filter;
// delete utils.isError;
var mapFromUS = ["uniq", "flatten", "compact", "clone", "union"]
for(var i=0;i<mapFromUS.length;i++){
    var n = mapFromUS[i]
    utils[n] = _[n]
}
utils.ld = {};
for(var n of _.keys(_)){
    utils.ld[n] = _[n]
}

utils.names = function(obj){
    if(arguments.length > 1) throw "names expects 1 argument, given " + arguments.length;
    if(_.isObject(obj)){
        var ns = [];
        for(var n in obj)
            if(obj.hasOwnProperty(n))
                ns.push(n);
        return ns;
    }
    return []
};
utils.values = function(obj){
    if(arguments.length > 1) throw "values expects 1 argument, given " + arguments.length;
    if(_.isObject(obj)){
        var ns = [];
        for(var n in obj)
            if(obj.hasOwnProperty(n))
                ns.push(obj[n]);
        return ns;
    }
    return []
};

//var newid = uuid.v1;
//utils.newid = newid;
utils.newid = function(shard){
    shard = shard || 'data';
    if(!shard.match(/^[a-zA-Z0-9]+$/))
        throw "newid - invalid shard: " + shard + "\nonly alphanumeric characters allowed"
    return shard + ":" + Date.now() + ":" + uuid.v4();
};
//utils.Id = newid;

// function isid(sid){
//     if(!sid) return false;
//     if(!sid.toString) return false;
//     sid = sid.toString();
//     var pid = uuid.unparse(uuid.parse(sid));
//     return pid.toString() == sid;
// }
function isid(sid){
    //return !!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.exec(sid);
    return _.isString(sid) && !!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.exec(sid);
};
utils.isid = isid;

function ispath(s) {
    return s.match(/\//) // should have at least 1 slash '/'
        && !s.match(/\s/) // can't have whitespace
        && !s.match(/^\"/) // can't start with a quote
        ;
}
utils.ispath = ispath;

// converts objects to id references
var justIds = function(objs){
    if(!_.isArray(objs))
        objs = [objs];

    _.each(objs, function(obj){
        for(var n in obj){
            if(!obj.hasOwnProperty(n)) continue;
            if(_.isObject(obj[n]) && obj[n].id)
                obj[n] = obj[n].id;
            if(_.isArray(obj[n]))
                obj[n] = _.map(obj[n], function(i){
                    if(_.isObject(i) && i.id) return i.id; else return i;
                });
        }
        if(obj.type == type_type_id && obj.fields){
            justIds(obj.fields);
        }
    });
};
utils.justIds = justIds;

function toJSON(obj){

    //console.log('toJSON');
    var knownObjs = [];
    var objRefs = [];
    var newObjs = [];
    var refCount = 0;

    function recurse(obj){

        // stringify values
        if(Number.isNaN(obj))
            return "NaN";
        if(obj === undefined)
            return "undefined";
        if(obj === Infinity)
            return "Infinity";
        if (obj instanceof RegExp)
            return ("__REGEXP " + obj.toString());
        if(_.isDate(obj))
            return obj.toISOString();
        if(_.isFunction(obj))
            return '__FUNCTION ' + obj.toString();
        if(isHTML(obj)){
            return "__HTML " + obj.outerHTML;
        }
        if(typeof window !== 'undefined' && window && obj === window){
            return "__WINDOW";
        }

        // non-objects can just be returned at this point
        if(!_.isObject(obj))
            return obj;

        // if we've found a duplicate reference, deal with it
        var iObj = knownObjs.indexOf(obj);
        if(iObj >= 0){
            var ref = objRefs[iObj];

            var nObj = newObjs[iObj];
            if(_.isArray(nObj) && (!_.isString(nObj[0]) || !nObj[0].match(/^__this_ref:/)))
                nObj.unshift("__this_ref:" + ref);
            else if (_.isObject(nObj) && !nObj.__this_ref)
                nObj.__this_ref = ref;
            return ref;
        }

        // capture references in case we need them later
        refCount++;
        var newRef = "__duplicate_ref_" + (_.isArray(obj) ? "ary_" : "obj_") + refCount;
        var nObj = _.isArray(obj) ? [] : {};
        knownObjs.push(obj);
        objRefs.push(newRef);
        newObjs.push(nObj);

        // recurse on properties
        if(_.isArray(obj))
            for(var i = 0; i < obj.length; i++)
                nObj.push(recurse(obj[i])); // use push so offset from reference capture doesn't mess things up
        else
            for(var key in obj){
                if(!obj.hasOwnProperty(key)) continue;
                var value = recurse(obj[key]);
                if(key[0] == '$') // escape leading dollar signs
                    key = '__DOLLAR_' + key.substr(1);
                nObj[key] = value;
            }
        return nObj;
    }
    obj = recurse(obj);
    return obj;
}
function fromJSON(obj){
    //console.log('fromJSON');
    var dup_refs = {};

    function recurse(obj){

        if (_.isString(obj)){

            // restore values
            if(obj === "undefined")
                return undefined;
            if(obj === "NaN")
                return NaN;
            if(obj === "Infinity")
                return Infinity;
            if(obj.match(/^__REGEXP /)){
                var m = obj.split("__REGEXP ")[1].match(/\/(.*)\/(.*)?/);
                return new RegExp(m[1], m[2] || "");
            }
            if(obj.match(/^__FUNCTION /)){
                return eval('"use strict";(' + obj.substring(11) + ')');
            }
            if(obj.match(/^__HTML /)){
                return $(obj.substring(7))[0];
            }
            if(obj === "__WINDOW"){
                return window;
            }

            // deal with duplicate refs
            if(obj.match(/^__duplicate_ref_/)){
                if(!dup_refs[obj])
                    dup_refs[obj] = obj.match(/_obj_/) ? {} : [];
                return dup_refs[obj];
            }
        }

        if (!_.isObject(obj))
            return obj;

        // deal with objects that have duplicate refs
        var dup_ref = null;
        obj = _.clone(obj); // don't mess up the original JSON object
        if(_.isArray(obj) && _.isString(obj[0]) && obj[0].match(/^__this_ref:/))
            dup_ref = obj.shift().split(':')[1];
        else if (obj.__this_ref){
            dup_ref = obj.__this_ref;
            delete obj.__this_ref;
        }

        var mObj = _.isArray(obj) ? [] : {};
        if(dup_ref)
            if(!dup_refs[dup_ref])
                dup_refs[dup_ref] = mObj;
            else
                mObj = dup_refs[dup_ref];

        // restore keys and recurse on objects
        for(var key in obj){
            if(!obj.hasOwnProperty(key)) continue;

            var value = recurse(obj[key]);
            if(key.match(/^__DOLLAR_/))
                key = '$' + key.substr(9);
            mObj[key] = value;
        }
        return mObj;
    }
    obj = recurse(obj);
    return obj;
}
utils.toJSON = toJSON;
utils.fromJSON = fromJSON;

function dataToString(obj,space){
    if(_.isString(obj))
        return obj;
    return JSON.stringify(toJSON(obj),null,space);
}
function dataFromString(str){
    return fromJSON(JSON.parse(str));
}
utils.dataToString = dataToString;
utils.dataFromString = dataFromString;
utils.toDataString = dataToString;
utils.fromDataString = dataFromString;

function eqin(){
    var item = arguments[0];
    var list = [];
    if(arguments.length == 2 && _.isArray(arguments[1]))
        list = arguments[1];
    else
        for(var i = 1; i<arguments.length;i++)
            list.push(arguments[i]);
    return _.contains(list,item);
}
utils.eqin = eqin;

utils.list = function (){
    //var l = [];
    //_.each(arguments, function(a){l.push(a)});
    //return l;
    return _.toArray(arguments);
};

utils.one = function (a) {
    if(arguments.length != 1)
        throw "one -- requires a single argument which will be returned";
    return a;
};

utils.add = function (){
    var r = arguments[0];
    for(var i = 1; i < arguments.length; i++)
        r += arguments[i];
    return r;
};
utils['+'] = utils.add;

utils.sum = function (values) {
    return utils.add.apply(null, values);
};

utils.subtract = function (){
    var r = arguments[0];
    for(var i = 1; i < arguments.length; i++)
        r -= arguments[i];
    return r;
};
utils['-'] = utils.subtract;

utils.divide = function (){
    var r = arguments[0];
    for(var i = 1; i < arguments.length; i++)
        r /= arguments[i];
    return r;
};
utils['/'] = utils.divide;

utils.multiply = function (){
    var r = arguments[0];
    for(var i = 1; i < arguments.length; i++)
        r *= arguments[i];
    return r;
};
utils['*'] = utils.multiply;

utils.mod = function (a1, a2) {
    if(arguments.length > 2)
        throw ["mod expects two arguments, given: ", _.map(arguments, function(a){return a})];
    return a1 % a2;
};

utils.log = function(){
    var args = _.map(arguments,function(a){return a;});
    if(args.length < 2)
        args = args[0];
    console.log(args);
    return args;
};

utils.warn = function(){
    var args = _.map(arguments,function(a){return a;});
    if(args.length < 2)
        args = args[0];
    console.warn(args);
    return args;
};

utils.first = function (){
    var a1 = arguments[0];
    if(_.isArray(a1) && arguments.length == 1)
        return _.first(a1);
    return _.first(arguments);
};

utils.last = function (){
    var a1 = arguments[0];
    if(_.isArray(a1) && arguments.length == 1)
        return _.last(a1);
    return _.last(arguments);
};

utils.rest = function (){
    var a1 = arguments[0];
    var a2 = arguments[1];
    if(_.isArray(a1) && arguments.length <= 2)
        return _.rest(a1,a2);
    return _.rest(arguments);
};

utils['=='] = function (){
    if(arguments[0] === undefined) return false;
    if(arguments.length < 2) return false;
    var a0 = arguments[0];
    for(var i = 1; i<arguments.length; i++){
        if(a0 !== arguments[i])
            return false;
    }
    return true;
};
utils['_eq'] = utils['=='];
utils['EQ'] = utils['=='];

utils['same'] = _.isEqual;
utils['~='] = utils['same']

utils['!='] = function (a, b){
    if(arguments.length !== 2) throw "_ne expects 2 arguments, given " + arguments.length;
    return a !== b;
};
utils['_ne'] = utils['!='];
utils['NE'] = utils['!='];

utils['>='] = function (a,b){
    if(arguments.length !== 2) throw "_gte expects 2 arguments, given " + arguments.length;
    if(a === null || b === null) return false;
    return a >= b;
};
utils['_gte'] = utils['>='];
utils['GTE'] = utils['>='];

utils['>'] = function (a,b){
    if(arguments.length !== 2) throw "_gt expects 2 arguments, given " + arguments.length;
    if(a === null || b === null) return false;
    return a > b;
};
utils['_gt'] = utils['>'];
utils['GT'] = utils['>'];

utils['<='] = function (a,b){
    if(arguments.length !== 2) throw "_lte expects 2 arguments, given " + arguments.length;
    if(a === null || b === null) return false;
    return a <= b;
};
utils['_lte'] = utils['<='];
utils['LTE'] = utils['<='];

utils['<'] = function (a,b){
    if(arguments.length !== 2) throw "_lt expects 2 arguments, given " + arguments.length;
    if(a === null || b === null) return false;
    return a < b;
};
utils['_lt'] = utils['<'];
utils['LT'] = utils['<'];

utils.not = function(x){
    if(arguments.length > 1) throw "not expects 1 argument, given " + arguments.length;
    return !x;
};

//====================== List manipulators ============================

utils.shift = function(list, cnt){
    cnt = cnt || 1;
    var rslt = list.splice(0,cnt);
    if(rslt.length < 2)
        rslt = rslt[0]
    return rslt;
};
utils.deque = utils.shift;

utils.unshift = function(list, item1){ // ... more items
    var args = _.toArray(arguments);
    var ary = args.shift();
    Array.prototype.unshift.apply(ary, args);
    return ary;    
};
utils.enque = utils.unshift;

utils.pop = function(list, cnt){
    cnt = cnt || 1;
    var rslt = list.splice(list.length-cnt,cnt);
    if(rslt.length < 2)
        rslt = rslt[0]
    return rslt;
};

utils.push = function(){
    var args = _.toArray(arguments);
    var ary = args.shift();
    Array.prototype.push.apply(ary, args);
    return ary;    
};

utils.removeAt = function(list, index){
    return list.splice(index,1)[0];        
};

utils.insert = function(list, item, index){
    list.splice(index,0,item);
    return list;
};
utils.insertAt = utils.insert;

utils.remove = function(list, item){
    for(var i = list.length-1;i>=0;i--){
        if(list[i] === item) // maybe - this should be _.equal?
            list.splice(i,1);
    }
    return list;
};

utils.append = function(list){ // ... items or lists
    if(!_.isArray(list))
        list = [list];    
    var args = _.toArray(arguments);    
    for(var i = 1; i<args.length; i++){
        var item = args[i];
        if(_.isArray(item))
            Array.prototype.push.apply(list,item);    
        else
            list.push(item);
    }    
    return list;
};

//====================== /List manipulators ============================

utils.DT = function(arg1, arg2, arg3, arg4, arg5, arg6, arg7){
    // this craziness is because I couldn't get apply to work with (new Date())
    var date = null;
    if(arguments.length == 7)
        date = new Date(arg1, --arg2, arg3, arg4, arg5, arg6, arg7);
    else if(arguments.length == 6)
        date = new Date(arg1, --arg2, arg3, arg4, arg5, arg6);
    else if(arguments.length == 5)
        date = new Date(arg1, --arg2, arg3, arg4, arg5);
    else if(arguments.length == 4)
        date = new Date(arg1, --arg2, arg3, arg4);
    else if(arguments.length == 3)
        date = new Date(arg1, --arg2, arg3);
    else if(arguments.length == 2)
        date = new Date(arg1, --arg2);
    else if(arguments.length == 1)
        date = new Date(arg1);
    else
        date = new Date();
    return date;
};
utils.date = utils.DT;

function isHTML(obj){
    return obj && obj.ELEMENT_NODE;
}
utils.isHTML = isHTML;

function copy(obj, originals, copies){
    // if it's a primative or something special just return its reference    
    if(ko && ko.isObservable(obj))
        return ko.observable(copy(obj())); // create a new observable with a copy of the contents of this observable

    if(!_.isObject(obj) || _.isFunction(obj) || _.isRegExp(obj) || isHTML(obj))
        return obj;

    // if it's a date
    if(_.isDate(obj)) return new Date(obj);

    // initialize reference trackers if needed
    if(!originals) originals = [];
    if(!copies) copies = [];

    // if this object has already been copied, just return the copy
    if(originals.indexOf(obj) > -1)
        return copies[originals.indexOf(obj)];

    // setup new reference
    var c = null;
    if(_.isArray(obj)) c = [];
    else c = {};
    // add references to trackers
    originals.push(obj);
    copies.push(c);
    // copy each element
    for(var n in obj)
        if(obj.hasOwnProperty(n))
            c[n] = copy(obj[n],originals,copies);
    return c;
}
utils.copy = copy;

utils.rex = function(reExp, options){
    return new RegExp(reExp, options);
};

utils.isNumeric = function(n) {
    //return !isNaN(parseFloat(n)) && isFinite(n);
    return !_.isArray(n) && (n - parseFloat(n) + 1) >= 0;
};

utils.fnjs = function(name, code){
    if(!code) {
        code = name;
        name = undefined;
    }
    // create function object
    var f = {
        name: name,
        //type: type_fn_js_id
        type: "Fnjs"
        //type: Fnjs.id
    };
    // if we already have compiled js, set it then capture source
    if(_.isFunction(code)){
        f.ccode = code;
        code = code.toString();
    }
    // if it's an object assume js is in 'value' property
    if(_.isObject(code) && code.value)
        code = code.value;
    // set source
    f.code = code;
    return f;
};

utils.tick = function (obj){
    if(_.isString(obj))
        return utils.nsym(obj);
    if(_.isArray(obj))
        obj.unshift('`');
    return obj;
};

utils.untick = function (obj){
    if(obj === "`")
        return obj;
    if(_.isString(obj) && obj[0] === '`')
        return obj.substr(1);
    if(_.isArray(obj) && obj[0] === '`')
        obj.shift();
    return obj;
};

utils.quote = function(obj){
    if(_.isString(obj))
        return "'" + obj;
    if(_.isArray(obj)){
        obj.unshift("'");
        return obj;
    }
    return obj;
};

utils.unquote = function(obj){
    if(_.isString(obj)){
        if(obj[0] === "'")
            obj = obj.substr(1);
        return obj;
    }
    if(_.isArray(obj)){
        if(obj[0] === "'")
            obj.shift();
        return obj;
    }
    return obj;
};

utils.eqObjects = function(obj1, obj2){
    // object refs
    if(obj1 === obj2) return true;

    // ids
    var o1Id = obj1 && obj1.id || obj1;
    var o2Id = obj2 && obj2.id || obj2;
    return o1Id === o2Id;
};

utils.isSym = function(sym){
    return _.isString(sym) && sym.length > 1 && sym[0] === '`'    
};
//utils.isSym.isMacro = true;

utils.isExpr = function(item){
    return _.isArray(item) && item[0] === '`';
};

utils.isMeta = function(item){
    return item && item.type 
    && (item.type === "Meta" || item.type.name === "Meta") 
    && item.name !== "Meta"
}

utils.isString = function(item){
    return _.isString(item);
}

utils.isArray = _.isArray;

utils.nsym = function (name){
    //console.log('nsym');
    if(!_.isString(name))
        return name;

    // quote is always left as is
    if(name === "'")
        return name;

    return '`' + name;
};

utils.nmeta = function (name,value,value_type,args_list){

    var meta = {name:undefined,type:"Meta"};

    // if name is already meta, just use that as meta
    //if(isMeta(name)){
    if(_.isObject(name) && !_.isArray(name)){
        meta = name;
        meta.name = meta.name || undefined;
    }
    else if(_.isString(name)){
        // name -> name, `name -> name, ``name -> `name
        name = name[0] === '`' ? name.substr(1) : name;// )ssym(name);
        if(name.startsWith('`')){
            meta.isTick = true;
            name = name.substr(1);
        }

        if(name.startsWith("'")){
            meta.isQuote = true;
            name = name.substr(1);
        }

        if(name.startsWith('?')){
            meta.isPattern = true;
            name = name.substr(1);
        }

        if(name.endsWith('?')){
            meta.isOptional = true;
            name = name.substr(0,name.length-1);
            if(meta.value === undefined)
                meta.value = null;
        }

        if(name.endsWith('*')){
            meta.isList = true;
            name = name.substr(0,name.length-1);
        }

        if(name.endsWith('&')){
            meta.isRest = true;
            meta.isList = true;
            name = name.substr(0,name.length-1);
        }

        meta.name = name;
    } 
    else if(name){
        throw "meta - name must be a string"
    }

    // set value if passed in
    if(value !== undefined)
        meta.value = value;

    // set value_type if passed in
    if(value_type !== undefined){
        meta.value_type = value_type;
        if(meta.isList === undefined)
            meta.isList = false; // if a value_type has been specified and it wasn't explicitly set to a list, then it's not a list
    }

    // process args_list
    if(args_list){
        // sort nvps from other values and set nvps directly on the meta
        var value_type_args = [];
        for(var i = 0; i<args_list.length; i++){
            var a = args_list[i];

            if(_.isObject(a) && (a.type === "Meta" || a.type && a.type.id === "Meta") && a.name)
            //if(_.isEqual(_.keys(a),["type","name","value"]))
                meta[a.name] = a.value;
            else
                value_type_args.push(a);
        }
        if(value_type_args.length)
            meta.value_type_args = value_type_args;
    }

    if(meta.name === undefined)
        delete meta.name;
    return meta;
};

utils.ssym = function(sym){
    if(utils.isSym(sym))
        return sym.substr(1);
    return sym;
};

utils.Math = Math;

// utils.endsWith = function(s, end){
//     return s.endsWith(end);
// };

utils.reverse = function(ary){
    return _.clone(ary).reverse();
};

utils.sort = function(ary){
    return _.clone(ary).sort();
};

utils.slice = function(ary, start, end){
    ary = _.clone(ary);
    start = start || 0;
    end = end || ary.length;
    return ary.slice(start, end);
};

utils.skip = function(ary, n){
    ary = _.clone(ary);
    n = n || 1;
    return ary.slice(n);
};

utils.take = function(ary, n){
    ary = _.clone(ary);
    n = n || 1;
    return ary.slice(0, n);
};

utils.join = function(ary, seperator){
    return ary.join(seperator || "");
}

var nvp = utils.fnjs(function(name, value){
    return {
        type:'Meta',
        name:utils.ssym(name),
        value:value
    }
})
nvp.isMacro = true;
utils['nvp'] = nvp;
utils['~'] = nvp;


//============================= exports ===============================================================================
module = module || {};
module.exports = utils;



