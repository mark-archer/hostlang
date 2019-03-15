import { clone, isExpr, isJS, isList, isNvp, isSym, INvp, promiseAll, tick, unquote, untick, without } from "./common";
import { parseHost } from "./host-parser";
import { Fn, IParamInfo, isFn, isMeta, validate } from "./typeInfo";
import { copy } from "./utils";
import { ParseInfoOptions } from "./meta/meta-parser";

// responseText
module.exports.parseHost = parseHost;

export function getName(stack: any[], name: string) { // maybe rename this to `get` so `get` & `set` & `getr` & `setr`
  if (isSym(name)) { return untick(name); }
  for (let i = stack.length - 1; i >= 0; i--) {
    if (stack[i][name] !== undefined) { return stack[i][name]; }
  }
  return undefined;
}
// @ts-ignore
getName.isMeta = true;

export function evalSym(stack: any[], x: any) {
  if (!isSym(x)) { return x; }
  if (x === "`") { return x; }
  x = untick(x);
  if (isSym(x)) { return x; }
  if (x === "'") { return "`"; }
  if (x[0] === "'") {
    x = unquote(x);
    x = tick(x);
    x = evalSym(stack, x);
    return tick(x);
  }
  if (x === "stack") { return [...stack]; }
  const r = getName(stack, x);
  if (r === undefined) { throw new Error(`${x} is not defined`); }
  return r;
}
// @ts-ignore
evalSym.isMeta = true;

export async function evalMeta(stack: any[], x: any) {
  for (const k in x) {
    const val = await evalHost(stack, x[k]);
    x[k] = val;
  }
  return x;
}

export async function evalHost(stack: any[], x: any): Promise<any> {
  if (isSym(x)) { return evalSym(stack, x); }
  if (isMeta(x)) { return evalMeta(stack, x); }
  if (isNvp(x)) { return evalHost(stack, x.value).then((v) => {
    x.value = v;
    return x;
  });
  }
  if (!isExpr(x)) { return x; }

  x = untick(x);
  if (x[0] === "`") { return x; }
  if (x[0] === "'") {
    x = unquote(x);
    return promiseAll(x.map((i: any) => evalHost(stack, i)))
      .then((l: any[]) => {
        l = l.map((i) => tick(i));
        return tick(l);
      });
  }

  const fRaw = x.shift();
  let f: any;

  // ugly performance optimization
  if (!isList(fRaw)) { f = evalSym(stack, fRaw); } else { f = evalHost(stack, fRaw); }
  if (!f) { throw new Error(`evalHost - ${fRaw} is not a valid function`); }
  if (f.then) { f = await f; }

  if (f && f.isMacro) {
    x = await apply(stack, f, x);
    return evalHost(stack, x);
  } else {
    x = await promiseAll(x.map((i: any) => evalHost(stack, i)));
    return apply(stack, f, x);
  }
}
// @ts-ignore
evalHost.isMeta = true; evalHost.isMacro = true;

export async function evalHostBlock(stack: any[], block: any[], blockScope: any= {}) {
  // let blockScope:any = {};
  if (!isList(block)) { throw new Error("Invalid code block, must be a list of zero or more expressions"); }
  stack = [...stack, blockScope];
  for (const x of block) {
    let r = await evalHost(stack, x);
    if (r === undefined) { r = null; } // if _ is undefined it will use _ from outer scopes which isn't want we want
    blockScope._ = r;
  }
  let rtnVal = blockScope._; // getName(stack, '_');
  if (rtnVal === undefined) { rtnVal = null; } // we don't want to return undefined
  return rtnVal;
}

export const appliers = [
  {
    // default applier, if it has an apply function we'll call it (this works for any js function)
    match: (stack: any[], f: any, args: any[]) => f && isJS(f.apply),
    apply: (stack: any[], f: any, args: any[]) => f.apply(f.it, args),
  },
  {
    // appliers that take the stack as their first argument
    match: (stack: any[], f: any, args: any[]) => f && f.isMeta && isJS(f.apply),
    apply: (stack: any[], f: any, args: any[]) => f.apply(f.it, [stack, ...args]),
  },
  {
    // host function
    match: (stack: any[], f: any, args: any[]) => isFn(f),
    apply: applyHost,
  },
];
export function apply(stack: any[], f: any, args: any[]) {
  for (let i = appliers.length - 1; i >= 0; i--) {
    const applier = appliers[i];
    // TODO to make this maximall flexible this should use evalHost
    // const match = await evalHost(stack, ['`', applier.match, ...args])
    // BUT current implementation is much faster and we could just put requirements to conform to this
    //  currently can't use host function though unless it's assigned a special apply property
    const match = applier.match(stack, f, args);
    if (match) { return applier.apply(stack, f, args); } // don't need to check for promise since it's returned
    // if (match) {
    //   var r = applier.apply(stack, f, args);
    //   if(isPromise(r)) r = await r;
    //   return r;
    // }
  }
  throw new Error(`${f} is not a valid function`);
}
// @ts-ignore
apply.isMeta = true;

export async function validateArg(stack: any[], f: Fn, param: IParamInfo, arg: any) {
  try {
    await validate(stack, arg, param.typeInfo);
  } catch (err) {
    throw new Error(`${f.name || "<anonymous function>"} - invalid value given for ${param.name}: ${err && err.message || err}`);
  }
}

export async function mapArgs(stack: any[], args: any[], f: any) {
  let params: IParamInfo[] = [...f.params];
  const argMap: any = {};
  // TODO if argMap was its own type we might be able to intelligently pass around block of parameters instead of typing them out over and over

  // named values
  const namedValues = args.filter(isNvp) as INvp[];
  for (const nvp of namedValues) {
    const p = params.find((p) => p.name === nvp.name); // todo find and remove at the same time
    if (!p) { throw new Error(`${f.name || "<anonymous function>"} has no parameter named ${nvp.name}`); }
    params = without(params, p);
    await validateArg(stack, f, p, nvp.value);
    argMap[p.name] = nvp.value;
  }

  // values by position
  const orderedValues = args.filter((x) => !isNvp(x));
  orderedValues.reverse(); params.reverse(); // because pop is faster than shift
  while (orderedValues.length) {
    const p = params.pop();
    if (!p) { break; }
    let v;
    if (p.isRest) {
      v = [...orderedValues];
      v.reverse();
      orderedValues.length = 0;
    } else {
      v = orderedValues.pop();
    }
    await validateArg(stack, f, p, v);
    argMap[p.name] = v;
  }
  params.reverse(); orderedValues.reverse(); // put back in correct order

  // if not all given values have been mapped, throw error
  if (orderedValues.length) { throw new Error(`${f.name || "<anonymous function>"} - too many arguments: ${orderedValues}`); }

  // default values and optional parameters
  for (const p of [...params]) {
    if (p.defaultValue !== undefined) {
      await validate(stack, p.defaultValue, p.typeInfo);
      // if(p.typeInfo && p.typeInfo.validate) await p.typeInfo.validate(p.defaultValue);
      argMap[p.name] = p.defaultValue;
    } else if (p.nullable) {
      argMap[p.name] = null;
    } else if (p.isRest) {
      argMap[p.name] = [];
    } else {
      throw new Error(`${f.name || "<anonymous function>"} - no value provided for ${p.name}`);
    }
  }

  return argMap;
}

export async function createContinuation(cc: any) {
  // returns a function which creates a promise that calls the enclosed function but never resolves itself
  // TODO: make sure this isn't a memory leak
  return (x: any) => new Promise(() => cc(x));
}

export async function applyHost(stack: any[], f: any, args: any[]) {
  if (!isFn(f)) { throw new Error(`${f} is not a Host function`); }
  if (!isList(args)) { throw new Error("args must be a list"); }

  const fnScope: any = await mapArgs(stack, args, f);
  fnScope.args = args;
  fnScope.argsMap = fnScope;
  // fnScope.it = f.it;

  const fnBody = copy(f.body);
  const closure = clone(f.closure) || [];
  closure.push(fnScope);

  return new Promise((resolve, reject) => {
    fnScope.return = createContinuation(resolve);
    fnScope.error = createContinuation(reject);
    return evalHostBlock(closure, fnBody).then(resolve).catch(reject);
  });
}

export function makeStack(context?: any, stack: any[]= [typeInfo, common]) {
  let blockScope: any = {};
  if (context instanceof Array) {
    stack = [...context];
    if (!stack.includes(common)) { stack.unshift(common); }
    if (!stack.includes(typeInfo)) { stack.unshift(typeInfo); }
  } else if (context instanceof Object) {
    blockScope = context;
  }
  if (!stack[0].error) { stack[0].error = (...err: any[]) => {
    throw new Error(...err);
  };
  }
  stack.push(blockScope);
  return stack;
}

const typeInfo = require("./typeInfo");
const common = require("./common");
export function execHost(code: string, context?: any, options?: ParseInfoOptions, stack: any[]= [typeInfo, common]): Promise<any> {
  let blockScope: any = {};
  if (context instanceof Array) {
    stack = [...context];
    if (!stack.includes(common)) { stack.unshift(common); }
    if (!stack.includes(typeInfo)) { stack.unshift(typeInfo); }
  } else if (context instanceof Object) {
    blockScope = context;
  }
  if (!stack[0].error) { stack[0].error = (...err: any[]) => {
    throw new Error(...err);
  };
  }
  return parseHost([...stack, blockScope], code, options).then((ast) => {
    return new Promise((resolve, reject) => {
      // if(!blockScope.return) blockScope.return = (r:any) => new Promise(() => resolve(r));
      // if(!blockScope.error) blockScope.error = (err:any) => new Promise(() => reject(err));
      blockScope.return = (r: any) => new Promise(() => resolve(r));
      blockScope.error = (err: any) => new Promise(() => reject(err));
      evalHostBlock(stack, ast, blockScope).then(resolve).catch(reject);
    });
  });
}

export function execHostInScope(stack: any[], code: string, context?: any, options?: ParseInfoOptions) {
  return Promise.resolve(execHost(code, context, options, stack));
}
// @ts-ignore
execHostInScope.isMeta = true;
