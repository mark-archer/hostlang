import * as _ from 'lodash'; 
import { Fn, makeFn, isMeta, isFn, isObjectInfo, ObjectInfo, TypeInfo, FieldInfo } from './typeInfo';
import { evalHost, getName, evalHostBlock, evalSym, execHost, execHostInScope, apply } from './host';
import { copy, stringify } from './utils';
import * as uuid from 'uuid';
import * as commonParsers from './commonParsers'

export const _parsers = commonParsers._parsers

export const {
    isString,
    isFunction,
    union,
    isNumber,
    clone,
    isDate,
    isBoolean
} = _

export const isObject = x => _.isObject(x) && !_.isArray(x);

export const guid = uuid.v4;
export const isList = x => _.isArray(x);
export const isHtml = x => _.isElement(x);

export const promiseAll:((x:any[]) => Promise<any>) = x => Promise.all(x);

export function isSym(x:any) {
  return isString(x) && x[0] === '`' && x.length > 1;
}

export function isExpr(x:any) {
  return isList(x) && x[0] === '`';
}

export function isHostCode(x:any) {
    return x && (isSym(x) || isExpr(x));
}

export function newid (shard?:string){
    const shardREDesc = 'shard can only have numbers, lowercase letters, dots and hypens. They cannot begin with a hypen';
    const shardRE = /^[0-9a-z\.][0-9a-z\-\.]*$/;
    shard = shard || 'z';
    if(shard && !shard.match(shardRE)) throw new Error('newid - invalid shard: ' + shardREDesc);
    return shard + "-" + Date.now().toString() + "-" + uuid.v4().replace(/-/g,'');
  }
  
  export function isid (sid:any){
    // <some grouping text>:<integer -- should be creationTime>:<GUID>    
    //return !!/^.*-[0-9]+-[0-9a-f]{8}[0-9a-f]{4}[0-9a-f]{4}[0-9a-f]{4}[0-9a-f]{12}$/i.exec(sid);    
    return !!/^.*-[0-9]+-[0-9a-f]{32}$/i.exec(sid) || 
        !!/^.*:[0-9]+:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.exec(sid);
  };
  
  export const asid = (x:any) => isObject(x) /*&& isid(x.id)*/ && x.id || x;
  

export function tick(x:any) {
    if (isString(x)) return '`' + x;
    if (isList(x)) return ['`', ...x];
    return x;
}

export function sym(s:string) {
    if(!isSym(s)) s = tick(s);
    return s;
}

export function untick(x:any) {
    if (isSym(x)) return x.substr(1);
    if (isExpr(x)) {
        x = [...x];
        x.shift();
        return x;
    }
    return x;
}

export function quote(x:any) {
    if (isSym(x)) return tick("'" + untick(x))
    if (isExpr(x)) return tick(["'", ...untick(x)]);
    return x;
}

export function unquote(x:any) {
    if(isString(x) && x[0] === "'") return x.substr(1);
    if(isList(x) && x[0] === "'") {
        x = [...x];
        x.shift();
        return x;
    }
    return x;
}

export function isJS(x:any) {
    return isFunction(x);
}

export function isPromise(x:any) {
    return x && isFunction(x.then);
}

//export type Param = { name:string, typeInfo?:TypeInfo, nullable?:boolean, defaultValue?:any, isRest?:boolean }

export type Nvp = { kind: 'Nvp', name:string, value:any }

export function isNvp(x:any) {
    return isObject(x) && x.kind === "Nvp" && x.name !== undefined && x.value !== undefined;
} 

export function nvp(name:string, value:any) {
    return { kind: "Nvp", name, value };
}

// export async function GET(id:string) {
//     //throw new Error('not implemented');
// }

export function mapkv (x:any, f:(k:string,v:any) => any) {
    var keys = _.keys(x);
    return keys.map(k => f(k, x[k]));
}

export const keys = _.keys;
export const values = (x:any) => keys(x).map(k => x[k]);

export const last = _.last;
export const range = _.range;
export const first = _.first;

export const list = (...items:any[]) => items;

export const without = _.without;
export const flatten = _.flatten;
export const compact = _.compact;
export const take = _.take;
export const uniq = _.uniq;

export function skip (x:any[], n:number=1) {
    return x.slice(n)
}

function hostFn(stack:any[], ...args:any[]) : Promise<Fn> {
  let name;
  if(typeof args[0] === 'string') name = untick(args.shift());
  let params = untick(args.shift());
  let metaData;
  if(isMeta(args[0])) metaData = args.shift();
  let body = args;
  params = params.map((p:any) => {
    if(isSym(p)) return untick(p);
    return p;
  })
  let f = makeFn(name, params, undefined, body, [...stack]);
  if(name) hostVar(stack, name, f); // TODO fix this
  if(!metaData) return Promise.resolve(f);
  //return then(evalHost(stack, metaData), (metaData:any) => {
  return evalHost(stack, metaData).then(metaData => {
    f.returnType = metaData.typeInfo;
    delete metaData.kind;
    delete metaData.typeInfo;
    //@ts-ignore
    mapkv(metaData, (k,v)=> f[k] = v);
    return f;
  });  
}
module.exports.fn = hostFn;
module.exports.fn.isMacro = true; module.exports.fn.isMeta = true;

function hostVar(stack:any[], name:string, ...value:any[]) {
    const ctx = _.last(stack);
    name = untick(name);
    if(ctx[name] !== undefined && !getName(stack, 'varCanSet')) {
        throw new Error(`${name} already exists. Use 'set' (=), 'varSet' (<-) or create a variable named "varCanSet" with the value of true if you want to allow this behavior: var varCanSet true`);
    }
    return evalHostBlock(stack, value)
    .then(value => {
        ctx[name] = value;
        return value;
    })
}
//@ts-ignore
hostVar.isMacro = true; hostVar.isMeta = true;
module.exports.var = hostVar

export function set(stack:any[], name:string, ...value:any[]) {
    //if(arguments.length > 3) throw new Error(`set only takes 2 arguments, you provided ${arguments.length-1}: ${_.rest(arguments)}`);
    // TODO don't set variables that are readonly (constants)
    name = untick(name);
    return evalHostBlock(stack, value)
    .then(value => {
        let isSet = false;
        for(let i = stack.length - 1; i >= 0; i--) {
            if(stack[i][name] !== undefined) {
                stack[i][name] = value;
                isSet = true;
                break;
            }
        }
        if(!isSet) throw new Error(`${name} cannot be set because it does not exist`)
        return value;
    })
}
//@ts-ignore
set.isMacro = true; set.isMeta = true;

// checks if a var exists in local scope, if not it creates it, otherwise sets it 
//  this is behind the '<-' and '->' operators
//  this enables a nice and simple syntax for working with vars that you usually want when scripting
export function varSet(stack:any[], name:string, ...value:any[]) {
    //if(getName(stack, untick(name)) === undefined)
    if(last(stack)[untick(name)] === undefined) 
        return hostVar(stack, name, ...value);
    else 
        return set(stack, name, ...value);
}
//@ts-ignore
varSet.isMacro = true; varSet.isMeta = true;

// @ts-ignore
export function date(arg1, arg2, arg3, arg4, arg5, arg6, arg7){
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

export function asString(x:any) { return x + '';}

export function interval(stack:any[], msInterval:number, ...code:any[]) {
    return setInterval(() => {
        evalHostBlock(stack, copy(code));
    }, msInterval);
}
//@ts-ignore
interval.isMacro = true; interval.isMeta = true;

export function timeout(stack:any[], msInterval:number, ...code:any[]) {
    return setTimeout(() => {
        evalHostBlock(stack, copy(code));
    }, msInterval);
}
//@ts-ignore
timeout.isMacro = true; timeout.isMeta = true;

export function sleep(msInterval:number) {
    return new Promise(resolve => setTimeout(resolve, msInterval));
}

export function cond(stack:any[], ...conditions:any[]) {
    const lastIt = getName(stack, '_');
    return new Promise((resolve, reject) => {
        let conds = [...conditions];
        conds.reverse();
        let lastCond:any[];
        function each(r:boolean) {
            if(r) {
                const body = [...lastCond];
                body.shift();
                return evalHostBlock(stack, body).then(resolve).catch(reject);
            }
            lastCond = untick(conds.pop());
            if(!lastCond) return resolve(lastIt);
            evalHost(stack, lastCond[0]).then(each).catch(reject);
        }
        each(false);
    });
}
//@ts-ignore
cond.isMacro = true; cond.isMeta = true;

export function hostNew(stack:any[], ...args:any[]) {
    var o:any = {};
    return promiseAll(args.map(a => {
        if(isList(a)) {
            a = untick(a)
            if(a.length !== 2) return Promise.reject(new Error('new - invalid argument, lists must be of length 2 ' + a));
            const name = untick(a[0]);
            return evalHost(stack, a[1]).then(r => o[name] = r);
        }
        if(isNvp(a)) {
            return evalHost(stack, a).then(r => o[r.name] = r.value);
        }
        if(isObject(a)) return Promise.reject(new Error('new - invalid argument, objects cannot be passed directly as arguments'));
        return evalHost(stack, a).then(r => o[untick(a)] = r);
    }))
    .then(() => o);
}
//@ts-ignore
hostNew.isMacro = true; hostNew.isMeta = true;
module.exports.new = hostNew;

export function newOf(stack:any[], typeInfo:any, ...args:any[]) {
    let newObject:any;
    return evalHost(stack, typeInfo)
    .then(_typeInfo => {
        typeInfo = _typeInfo;
        if(!isObjectInfo(typeInfo)) throw new Error('newOf - invalid first argument. Expected objectInfo, given ' + typeInfo)
        return hostNew(stack, ...args);
    })
    .then(_newObject => {
        newObject = _newObject;
        var ti:ObjectInfo = typeInfo;
        return promiseAll((ti.fields || []).map((fi) => {
            if(newObject[fi.name] === undefined) {
                if(fi.defaultValue !== undefined){
                    if(isFunction(fi.defaultValue) || isFn(fi.defaultValue)) 
                        return evalHost(stack, ['`', fi.defaultValue]).then(value => newObject[fi.name] = value);
                    else
                        newObject[fi.name] = fi.defaultValue;                    
                } 
                else if(fi.nullable) newObject[fi.name] = null;                
            }
        }));          
    })
    .then(() => newObject);
}
//@ts-ignore
newOf.isMacro = true; newOf.isMeta = true;

export function getr(stack:any[], ...args:any[]) {
    if(args.length < 2) throw new Error('getr - path must have at least 2 items, root and field. Given:' + args);
    const rootExpr = args.shift();
    let root:any;
    return evalHost(stack, rootExpr)
    .then(_root => {
        root = _root;
        return promiseAll(args.map(a => {
            if(isString(a)) a = untick(a);
            return evalHost(stack, a)
        }))
    })   
    .then(path => {
        let cobj = root;
        let lastCobj = root;
        let f:any;
        for(f of path) {
            lastCobj = cobj;
            if(isList(cobj) && isNumber(Number(f)) && Number(f) < 0) {
                f = Number(f);
                f = cobj.length + f;
            } 
            cobj = cobj[f];
            if(cobj === undefined || cobj === null) break;
        }
        //if(isFunction(cobj) && !isAtom(cobj)) return _.bind(cobj, lastCobj);
        if(isFunction(cobj)) return _.bind(cobj, lastCobj);
        return cobj;
    })
}
//@ts-ignore
getr.isMacro = true; getr.isMeta = true;

export function setr(stack:any[], ...args:any[]) {
    if(args.length < 3) throw new Error('setr - path must have at least 3 items, root, field, and value. Given:' + args);
    const rootExpr = args.shift();
    const valueExpr = args.pop();
    let root:any;
    let value:any;
    return promiseAll([
        evalHost(stack, rootExpr),
        evalHost(stack, valueExpr)
    ])
    .then(rootValue => {
        root = rootValue[0];
        value = rootValue[1];
        return promiseAll(args.map(a => {
            if(isString(a)) a = untick(a);
            return evalHost(stack, a)
        }))
    })   
    .then(path => {
        var fToSet = path.pop();
        let cobj = root;
        path.forEach((f:any) => {
            let ncobj = cobj[f];
            if(ncobj === undefined) {
                ncobj = {};
                cobj[f] = ncobj;               
            }
            cobj = ncobj;
        })
        cobj[fToSet] = value;
        return root;
    })
}
//@ts-ignore
setr.isMacro = true; setr.isMeta = true;

export function one(...args:any[]) {
    return args[0];
}

export function AND(stack:any[], ...args:any[]) {
    args.reverse();
    return new Promise((resolve, reject) => {
        function next() {
            evalHost(stack, args.pop()).then(r => {
                if(!r || !args.length) return resolve(r);
                next();
            }).catch(reject);
        }
        next();
    });
}
//@ts-ignore
AND.isMacro = true; AND.isMeta = true;

export function OR(stack:any[], ...args:any[]) {
    args.reverse();
    return new Promise((resolve, reject) => {
        function next() {
            evalHost(stack, args.pop()).then(r => {
                if(r || !args.length) return resolve(r);
                next();
            }).catch(reject);
        }
        next();
    });
}
//@ts-ignore
OR.isMacro = true; OR.isMeta = true;

export function EQ(...args:any[]) {
    if(args.length < 2) return undefined;
    for(let i = 1; i<args.length; i++){
        if(args[0] !== args[i]) return false;
    }
    return true;
}

export function NEQ(...args:any[]) {
    if(args.length < 2) return undefined;
    for(let i = 1; i < args.length; i++){
        if(args[0] === args[i]) return false;
    }
    return true;
}

export function GTE(...args:any[]) {
    if(args.length < 2) return undefined;
    for(let i = 1; i < args.length; i++){
        if(args[0] < args[i]) return false;
    }
    return true;
}

export function LTE(...args:any[]) {
    if(args.length < 2) return undefined;
    for(let i = 1; i < args.length; i++){
        if(args[0] > args[i]) return false;
    }
    return true;
}

export function isMatch(...args:any[]) {
    if(args.length < 2) return undefined;
    for(let i = 1; i < args.length; i++){
        if(!_.isMatch(args[0], args[i])) return false;
    }
    return true;
}

export function isEqual(...args:any[]) {
    if(args.length < 2) return undefined;
    for(let i = 1; i < args.length; i++){
        if(!_.isEqual(args[0], args[i])) return false;
    }
    return true;
}

export function GT(...args:any[]) {
    if(args.length < 2) return undefined;
    for(let i = 1; i < args.length; i++){
        if(args[0] <= args[i]) return false;
    }
    return true;
}

export function LT(...args:any[]) {
    if(args.length < 2) return undefined;
    for(let i = 1; i < args.length; i++){
        if(args[0] >= args[i]) return false;
    }
    return true;
}

export function add(...args:any[]) {
    var r = args.shift();
    for(const a of args) r += a;
    return r;
}

export function sum(args:any[]) {
    return add.apply(null, args);
}

export function subtract (...args:any[]) {
    var r = args.shift();
    for(const a of args) r -= a;
    return r;
}

export function multiply (...args:any[]) {
    var r = args.shift();
    for(const a of args) r *= a;
    return r;
}

export function divide (...args:any[]) {
    var r = args.shift();
    for(const a of args) r /= a;
    return r;
}

export function mod (a:any, b:any) {
    return a % b;
}

export function not(...args:any[]) {
    if(args.length !== 1) throw new Error('not only takes one argument')
    return !args[0];
}

export function log(...args:any[]) {
    console.log(...args);
    if(args.length < 2) args = args[0];
    return args;
}

export function warn(...args:any[]) {
    if(args.length < 2) args = args[0];
    console.warn(args);
    return args;
}

function hostMap(stack:any[], items:any[], iterSym:any, ...body:any[]) {
    let f:any;    
    // when body is given, create function    
    if(body.length) {
        f = evalHost(stack, ['`', '`fn', [ iterSym ], ...body ]) 
    } else {
        f = evalHost(stack, iterSym)
    }    
    return f.then((_f:any) => {
        f = _f;
        return evalHost(stack, items);
    })
    .then((items:any[]) => promiseAll(items.map((i:any) => {
        return evalHost(stack, ['`', f, i]);
    })));     
}
//@ts-ignore
hostMap.isMacro = true; hostMap.isMeta = true;
module.exports.map = hostMap;

function hostFilter(stack:any[], items:any[], iterSym:any, ...body:any[]) {
    let f:any;    
    // when body is given, create function    
    if(body.length) {
        f = evalHost(stack, ['`', '`fn', [ iterSym ], ...body ]) 
    } else {
        f = evalHost(stack, iterSym)
    }    
    return f.then((_f:any) => {
        f = _f;
        return evalHost(stack, items);
    })
    .then((_items:any[]) => {
        items = _items;
        return promiseAll(items.map((item:any) => evalHost(stack, ['`', f, item])));
    })
    .then((filters:any) => {
        const filtered = [];
        for(let i = 0; i <= items.length; i++) {
            if(filters[i]) filtered.push(items[i]);
        }
        return filtered;
    });
}
//@ts-ignore
hostFilter.isMacro = true; hostFilter.isMeta = true;
module.exports.filter = hostFilter;

function hostReduce(stack:any[], items:any[], memoSym:any, iterSym:any, ...body:any[]){
    let f:any;    
    // when body is given, create function    
    if(body.length) {
        f = evalHost(stack, ['`', '`fn', [ iterSym, memoSym ], ...body ]);
    } else {
        f = evalHost(stack, iterSym)
    }    
    return f.then((_f:any) => {
        f = _f;
        return evalHost(stack, items);
    })
    .then((_items:any[]) => {
        items = _items;
        items.reverse();
        let memo:any;
        if(isNvp(memoSym)) memo = memoSym.value;
        else memo = items.pop();
        function next(item:any) : any {
            return evalHost(stack, ['`', f, item, memo])
            .then(r => {
                memo = r;
                if(items.length) return next(items.pop());
                else return memo;
            })
        }
        return next(items.pop());        
    });    
}
//@ts-ignore
hostReduce.isMacro = true; hostReduce.isMeta = true;
module.exports.reduce = hostReduce;


function hostSort(stack:any[], items:any[], iterSym:any, ...body:any[]) {
    let f:any;
    // when body is given, create function    
    if(body.length) {
        f = evalHost(stack, ['`', '`fn', [ iterSym ], ...body ]) 
    } else {
        f = evalHost(stack, iterSym)
    }    
    return f.then((_f:any) => {
        f = _f;
        return evalHost(stack, items);
    })
    .then((_items:any[]) => {
        items = _items;
        return promiseAll(items.map((item:any) => evalHost(stack, ['`', f, item])));
    })
    .then((sorts:any) => {        
        sorts = sorts.map((sort:any, index:number) => ({ sort, index }));
        sorts = _.sortBy(sorts, 'sort');
        const sorted = [];
        for(let i = 0; i < sorts.length; i++) {
            sorted.push(items[sorts[i].index])
        }
        return sorted;        
    });
}
//@ts-ignore
hostSort.isMacro = true; hostSort.isMeta = true;
module.exports.sort = hostSort;

function hostEach(stack:any[], items:any[], iterSym:any, ...body:any[]) {
    iterSym = untick(iterSym); // TODO check if this is an expression
    return evalHost(stack, items)
    .then((items:any[]) => new Promise((resolve, reject) => {
        items = clone(items);
        if(!items.length) return resolve(getName(stack, '_'));
        items.reverse();

        const ctx:any = {};    
        var index = -1;
        ctx.break = (i:any) => new Promise(() => resolve(i));
        function next(prior:any) {            
            if(!items.length) return resolve(prior);
            index++;
            ctx._ = prior;
            ctx.iter = { index }
            ctx[iterSym] = items.pop();
            new Promise((resolve, reject) => {
                ctx.continue = (returnValue:any) => new Promise(() => resolve(returnValue));
                return evalHostBlock(stack, copy(body), ctx).then(resolve).catch(reject)
            }).then(next).catch(reject);
        }
        next(getName(stack, '_'));
    }));
}
//@ts-ignore
hostEach.isMacro = true; hostEach.isMeta = true;
module.exports.each = hostEach;

function hostFor(stack:any[], iterArgs:any[], ...body:any[]) {
    iterArgs = untick(iterArgs);
    let iterSym = untick(iterArgs.shift());    

    return promiseAll(iterArgs.map(a => evalHost(stack, a)))
    .then(iterArgs => {
        let start = 0, end = 0, step = 1;
        if(iterArgs.length === 1) {
            end = iterArgs[0];
        }
        else if(iterArgs.length === 2) {
            start = iterArgs[0];
            end = iterArgs[1];
        }
        else if(iterArgs.length === 3) {
            start = iterArgs[0];
            end = iterArgs[1];
            step = iterArgs[2];
        }
        else {
            throw new Error('for - invalid iterator bounds, expected (start? end step?), given: ' + iterArgs)
        }
        if(!isNumber(step) || step == 0) throw new Error('for - step must be a non-zero number');        
        return new Promise((resolve, reject) => {
            const ctx:any = {};            
            ctx.break = (i:any) => new Promise(() => resolve(i));
            ctx.continue = (i:any) => new Promise(() => next(i));
            function next(prior:any) : any {
                if((step > 0 && start >= end) || (step < 0 && start <= end)) return resolve(prior);
                ctx._ = prior;
                ctx[iterSym] = start;
                start += step;                
                return evalHostBlock(stack, copy(body), ctx).then(next).catch(reject)                
            }
            next(getName(stack, '_'));
        });        
    });    
}
//@ts-ignore
hostFor.isMacro = true; hostFor.isMeta = true;
module.exports.for = hostFor;

function hostWhile(stack:any[], condition:any, ...body:any[]) {
    return new Promise((resolve, reject) => {
        const ctx:any = {};
        ctx.break = (i:any) => new Promise(() => resolve(i));
        ctx.continue = (i:any) => new Promise(() => next(i));        
        function next(prior:any) : any {
            ctx._ = prior;
            evalHost([...stack, ctx], copy(condition))
            .then(c => {
                if(!c) return resolve(prior);
                return evalHostBlock(stack, copy(body), ctx).then(next).catch(reject)
            });
        }
        next(getName(stack, '_'));
    });   
}
//@ts-ignore
hostWhile.isMacro = true; hostWhile.isMeta = true;
module.exports.while = hostWhile;

function tryCatch(stack:any[], ...tryBlock:any[]) {
    return new Promise((resolve, reject) => {
        let catchBlock:any;
        if(last(tryBlock)[1] === sym('catch'))
            catchBlock = tryBlock.pop();
        evalHostBlock(stack, tryBlock).then(resolve).catch(err => {
            if(!catchBlock) return resolve(err);
            catchBlock = untick(catchBlock);
            catchBlock.shift(); // remove `catch
            const errSym = untick(catchBlock.shift()); 
            evalHostBlock(stack, catchBlock, { [errSym]: err }).then(resolve).catch(reject)
            .catch((err:any) => {
                reject(err);
            });
        });
    });   
}
//@ts-ignore
tryCatch.isMacro = true; tryCatch.isMeta = true;
module.exports.try = tryCatch

export function evalBlock(stack:any[], ...block:any[]) {
    return evalHostBlock(stack, block);
}
//@ts-ignore
evalBlock.isMacro = true; evalBlock.isMeta = true;

function hostExport(stack:any[], ...syms:string[]) {
    const top = first(stack);
    if(!top.exports) top.exports = {};
    syms.forEach(sym => {
        sym = untick(sym);
        if(getName(stack, sym) === undefined) console.warn(`export - ${sym} is not defined`);
        top.exports[sym] = getName(stack, sym);
    });    
    return top.exports
}
//@ts-ignore
hostExport.isMeta = true; hostExport.isMacro = true;
module.exports.export = hostExport;

function hostInline(stack:any[], url:string) : Promise<any> {
    const GETData = getName(stack, 'GETData');
    if (!GETData) throw new Error('GETData is not defined. `run needs a valid implementation of (GETData url) in the stack');
    return GETData(url).then((code:any) => {
        if(!code) throw new Error(`nothing found at: ${url}`);
        if(isString(code)) return execHostInScope(stack, code, last(stack));
        if(code.type === 'HostScript') return execHostInScope(stack, code.code, last(stack));
        throw new Error('unable to run: ' + stringify(code));
    })
}
//@ts-ignore
hostInline.isMeta = true;
module.exports.inline = hostInline;

// let hostModuleCache:any = {};
// export function clearModuleCache () {
//     hostModuleCache = {};
// }
// function hostRequire(stack:any[], url:string, reload:boolean=false) : Promise<any> {
//     url = url.toLowerCase();
//     if (hostModuleCache[url] && !reload) {
//         return Promise.resolve(hostModuleCache[url]);
//     }
//     let exs:any = {};
//     hostModuleCache[url] = exs;
//     const newTop:any = { exports: exs };
//     const newCtx = {}; // any other vars will go here and be discarded
//     const newStack = [newTop, ...stack, newCtx];
//     return hostInline(newStack, url).then(() => {
//         return exs;
//     });
// }
// //@ts-ignore
// hostRequire.isMeta = true;
// module.exports.require = hostRequire;

// function hostImport(stack:any[], url:string) {
//     return hostRequire(stack, url).then((exported:any) => {
//         const ctx = last(stack);
//         keys(exported).map(n => {
//             if(ctx[n] !== undefined) console.warn(`import - overwritting ${n}`)
//             ctx[n] = exported[n];
//         });
//         return exported;
//     });
// }
// //@ts-ignore
// hostImport.isMeta = true;
// module.exports.import = hostImport;

export function spread(stack:any[], expr:any[], spreadArg:any, ...addArgs:any[]) {
    return evalHost(stack, spreadArg)
        .then(spreadArg => {
            // TODO insead of throwing an error we could try to be smart but not doing that now to avoid over complicating things
            if(!isList(expr)) throw new Error('spread - first arg is expected to be an expression. Given: ' + expr)
            if(isObject(spreadArg)) spreadArg = mapkv(spreadArg, (k,v) => nvp(k,v));
            return [...expr, ...spreadArg, ...addArgs];
        });
}
//@ts-ignore
spread.isMeta = true; spread.isMacro = true;

//@ts-ignore
String.prototype.removeNewlineIndent = function() {
    return this.split('\n').map(s => s.trim()).join('');
}