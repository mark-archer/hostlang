//console.log('types');

var _ = require('underscore');
var utils = require('./utils.js');
var untick = utils.untick;
var issym = utils.isSym;
var nsym = utils.nsym;

var fnjs = utils.fnjs;
var eqObjects = utils.eqObjects;


var types = {};

function ccError(context, err){
    types.host.ccError(context,err);
}

// var system_id = '00000000-0000-0000-0000-000000000000';
// var type_type_id = '00000000-0000-0000-0000-000000000001';
// var type_group_id = '00000000-0000-0000-0000-000000000002';
// var type_user_id = '00000000-0000-0000-0000-000000000003';
// var type_groupMember_id = '00000000-0000-0000-0000-000000000004';
// var type_authToken_id = '00000000-0000-0000-0000-000000000005';
// var type_fn_id = '00000000-0000-0000-0000-000000000006';
// var type_fn_js_id = '00000000-0000-0000-0000-000000000007';
// var type_script_id = '00000000-0000-0000-0000-000000000008';
// var type_any_id = '00000000-0000-0000-0000-00000000000a';
// var type_json_id = '00000000-0000-0000-0000-00000000000b';
// var type_error_id = '00000000-0000-0000-0000-00000000000e';
// var type_test_id = '00000000-0000-0000-0000-00000000000f';
// var type_string_id = '00000000-0000-0000-0000-000000000104';
// var component_type_id = '00000000-0000-0000-0000-000000009000';

// prototypes
var Meta = {id:"Meta",name:"Meta"}; Meta.type = Meta; types.Meta = Meta;
var Type = {id:"Type",name:"Type"}; Type.type = Type; types.Type = Type;
var Primitive = {id:"Primitive",name:"Primitive"}; Primitive.type = Primitive; types.Primitive = Primitive;

// primative types
var Symbol = {id:"Symbol", name:"Symbol",type:Primitive}; types.Symbol = Symbol;
Symbol.isType = issym;
var Bool = {id:"Bool", name:"Bool",type:Primitive}; types.Bool = Bool;
var NativeNumber = {id:"Number", name:"Number",type:Primitive}; types.Number = NativeNumber;
var NativeString = {id:"String", name:"String",type:Primitive}; types.String = NativeString;
var Id = {id:"Id", name:"Id",type:Primitive,isType:utils.isid}; types.Id = Id;
var NativeDate = {id:"Date", name:"Date",type:Primitive}; types.Date = NativeDate;
NativeDate.isType = function (item) {
    if(_.isDate(item)) return true;
    // check for string that represents a date
    // check for number that represents a date
    return false;
};

var Int = {id:"Int",name:"Int",type:Primitive}; types.Int = Int;
Int.isType = function (value) {
    return _.isNumber(value) && Math.round(value) === value;
};

// object types
var Expression = {id:"Expression", name:"Expression", type:Type}; types.Expression = Expression;
Expression.isType = function (value) {
    return _.isArray(value) && value[0] === '`';
};
var Any = {id:"Any", name:"Any",type:Type,isType:function(value){return true;}}; types.Any = Any;
var List = {id:"List", name:"List",type:Type}; types.List = List;
var NativeObject = {id:"Object", name:"Object",type:Type}; types.NativeObject = NativeObject;
var Fn = {id:"Fn", name:"Fn",type: Type}; types.Fn = Fn; Fn.isType = function(o){return eqObjects(o && o.type, Fn)};
var Fnjs = {id:"Fnjs", name:"Fnjs",type:Type}; types.Fnjs = Fnjs;
var Continuation = {id:"Continuation", name:"Continuation",type:Type}; types.Continuation = Continuation;
var Html = {id:"Html", name:"Html", type:Type}; types.Html = Html;
Html.isType = utils.isHTML;

function isMeta(item){
    return item && eqObjects(item.type, Meta) && !eqObjects(item, Meta);
}
types.isMeta = isMeta;
function metaValue(item){
    return isMeta(item) && item.value || item; // metaValue of a non-meta is the item itself
}

// register types
types._knownTypes = [Meta];
for(var n in types){
    if(!types.hasOwnProperty(n)) continue;
    var t = types[n].type;
    if(t === Type || t === Primitive)
        types._knownTypes.push(types[n]);
}

function getType(expr, context, callback) {
    var item = untick(expr)[0];

    // getType is defined to return Any for null
    if(item === null) return callback(Any);

    // Html -- needs to be done first since some html elements have a .type property
    if(utils.isHTML(item))
        return callback(Html);

    function lookupType(item) {
        types.host.evalHost(item,context, function(item){
            if(!_.isObject(item)){
                for(var i = 0; i < types._knownTypes.length; i++){
                    if(item === types._knownTypes[i].id){
                        item = types._knownTypes[i];
                        return callback(item);
                    }
                }
                //return ccError(context, ["getType -- encountered an id for an unknown type",item]);
                console.warn(["getType -- encountered an id for an unknown type",item]);
                return callback(item);
            }
            return callback(item);
        });
    }


    // Meta
    if(isMeta(item)) {

        // if we have a value type just return that
        if(item.value_type)
            return lookupType(item.value_type);

        // if the value is another meta return this meta's type as Meta (prevents infinite recursion)
        if(isMeta(item.value))
            return callback(Meta);

        // recurse on meta.value
        return getType([item.value],context, callback);
    }

    // Symbol
    if(issym(item))
        return callback(Symbol);

    // Expression
    if(Expression.isType(item))
        return callback(Expression);

    // typed object
    if(item && item.type)
        return lookupType(item.type);

    // untyped object
    if(_.isObject(item) && !_.isArray(item))
        return callback(NativeObject);

    // untyped list
    if(_.isArray(item))
        return callback(List);

    // primitives
    // todo: loop through all primitive types from newest created to oldest calling isType on each until one returns true
    if(_.isBoolean(item)) return callback(Bool);
    if(_.isNumber(item)) return callback(NativeNumber);
    if(_.isString(item)) return callback(NativeString);
    if(_.isDate(item)) return callback(NativeDate);
    return callback(Primitive);
}
types.getType = getType;

function isType(expr, context, callback){
    untick(expr);
    if(expr.length !== 2)
        return ccError(context, ["isType -- invalid number of arguments, expected value type), given:", expr]);
    var value = expr[0];
    var type = expr[1];

    // null type is defined to return true for any value
    if(type === null || type === undefined)
        return callback(true);

    // if Meta
    if(isMeta(type)){
        return fitsMeta([value, type], context, callback);
    }

    //// TODO error if type isn't a valid Type
    //if(!eqObjects(type,Type) && !eqObjects(type,Primitive))
    //    return ccError(context, ['isType -- invalid type supplied:',type]);


    // use type.isType if it exists
    if(type && type.isType) {
        value = metaValue(value);  // todo: this might not be right, maybe evalHost should resolve meta value?
        return types.host.evalHost(['`', type.isType, value], context, callback);
    }

    // default comparison
    getType([value], context, function (valueType) {
        callback(eqObjects(valueType, type));
    });
}
types.isType = isType;

function fitsMeta(expr, context, callback){
    untick(expr);
    if(expr.length > 2)
        return types.host.ccError(context, ["fitsMeta -- too many arguments, expected (value meta), given:", expr]);
    var value = expr[0];
    var meta = expr[1];

    // undefined for null meta
    if(!isMeta(meta))
        return types.host.ccError(context, ["fitsMeta -- second parameter should be a meta, given:", meta]);

    // if this meta has a custom isType use that
    if(meta.isType)
        return types.host.evalHost(['`', meta.isType, value], context, callback);

    // isList
    if(meta.isList === true && !isList(value)) return callback(false);
    if(meta.isList === false && isList(value)) return callback(false);

    // ??
    // value_type_args
    // value_types

    // value_type
    return types.host.evalHost(['`', nsym('isType'), value, meta.value_type], context, callback);
}

types.isList = fnjs("isList",function(item){
    // raw value
    if(_.isArray(item)) return true;

    // typed object
    if(item && eqObjects(item.type,List)) return true;

    // typed meta
    if(item && eqObjects(item.type,Meta) && eqObjects(item.value_type,List)) return true;

    // untyped meta
    if(item && eqObjects(item.type,Meta) && !item.value_type && _.isArray(item.value)) return true;

    return false;
});
List.isType = types.isList;

types.isObject = fnjs("isObject",function(expr, context, callback){
    var item = untick(expr)[0];

    if(isMeta(item)){
        item = item.value;
    }

    callback(_.isObject(item) && !_.isArray(item));
});
NativeObject.isType = types.isObject;

function isNvp (obj){
    return obj && obj.name && eqObjects(obj.type, Meta);
}
types.isNvp = isNvp;

types.new = function(expr, context, callback){
    var o = {}; // object to be returned

    //console.log('new');

    // get the list of arguments so we can process it
    var args = expr; //_.map(arguments, function(a){return a});

    // if the type is specified explicitly, use that
    var maybeType = _.find(args,function(a){return isNvp(a) && a.name === 'type'});
    if(!maybeType) maybeType = args[0]; // otherwise assume the type is the first item in the list
    var fields = [];
    // if we've found a type....
    var objType = null;
    if(maybeType && eqObjects(maybeType.type,Type)){
        objType = maybeType;
        o.type = maybeType.id || maybeType.name; // set it's type
        args = _.without(args,maybeType); // remove the type indicator from the list of arguments to process
        if(_.isArray(maybeType.fields)) // get it's list of fields for processing
            fields = _.clone(maybeType.fields);
    }
    // first process named arguments
    args = _.filter(args, function(a){
        if(isNvp(a)) {
            // var f = _.find(fields, function(f){return f.name === a.name});
            // if(f && f.list && !_.isArray()){}
            o[a.name] = a.value;
            // if there is a fields with this name remove it from the list of fields to be processed
            fields = _.filter(fields, function(f){return f.name !== a.name});
            return false; // don't include in list because we've processed this
        }
        return true;
    });
    // deal with any fields that haven't been set and unnamed arguments
    if(fields.length) {
        _.each(args, function(a){
            var f = fields.shift();
            if(f && f.name)
                o[f.name] = a;
            else {
                o.values = o.values || [];
                o.values.push(a);
            }
        });
        _.each(fields, function(f){
            // todo: deal with optionals, list/atom, and default values
            //o[f.name] = f.default;
            o[f.name] = f.value;
        })
    }

    // // deal with named arguments that haven't been set
    // _.each(args, function(a){
    //     if(a.name){
    //         o[a.name] = a;
    //     }
    // });

    //if(!o.id) o.id = utils.Id();

    // register new types
    if(eqObjects(o.type, Type) || eqObjects(o.type, Primitive))
        types._knownTypes.push(o);

    if(objType && objType.new)
        return types.host.evalHost(['`', objType.new, o], context, callback);
    else
        callback(o);
};

types.isFunction = function(f){
    return _.isFunction(f) || eqObjects(f.type, Fn) || eqObjects(f.type, Fnjs);
};

module = module || {};
module.exports = types;
