import * as common from "../common";
import { last, skip } from "../common";
import { isSym, untick, isExpr, isList, tick } from "./meta-common";
import { isFunction, isString } from "util";
import { stringify } from "../utils";
import { $parse } from "./meta-parser";
import { makeFn, isFn, Fn } from "../typeInfo";
import * as _ from 'lodash';

export type Stack = { [key:string]: any}[]

export interface Runtime {
  exists: Function;
  var: Function;
  get: Function;
  set: Function;
  eval: Function;
  apply: Function;
  parse: Function;
  newScope: Function;
  exitScope: Function;
  [key: string]: any
}

export function runtime(stack: Stack = []): Runtime {
  const runtimeScope = {};
  $newScope(stack, runtimeScope);  
  // import common functions
  Object.assign(runtimeScope, common)
  // copy stack based functions
  const stackFns = {
    // get: (name) => $get(stack, name), 
    // newScope: () => $newScope(stack),
    // exitScope: () => $exitScope(stack),
    get: $get,
    newScope: $newScope,
    exitScope: $exitScope,
    exists: $exists, 
    fn: $fn,
    var: $var,
    set: $set,
    eval: $eval,
    do: $doBlock,
    apply: $apply,
    parse: $parse,
    getr: $getr,
  };
  Object.keys(stackFns).forEach(name => {
    runtimeScope[name] = stackFns[name]
    // runtimeScope[name] = (...args) => stackFns[name](stack, ...args)
    // if (stackFns[name].isMacro) runtimeScope[name].isMacro = true;
    // if (stackFns[name].isMeta) runtimeScope[name].isMeta = true;
  });  

  // @ts-ignore
  //return runtimeScope; // should be able to do everything you need with functions on stack
  // @ts-ignore
  return new Proxy({},{ get(target,name:any) {
    if (name === "stack") return stack;
    let r = $get(stack, name);
    if (r && r.isMeta) {
      return (...args) => r(stack, ...args);
    }
    return r;
  }})
}

export function $getr(stack: Stack, ...path) {
  console.log(stack)  
  path.reverse()
  console.log(path);
  const root = $eval(stack, path.pop())
  console.log(root);
  let item = root;
  while(path.length) {
    let pname = untick(path.pop())
    console.log(pname);
    pname = $eval(stack, pname);
    if (!isNaN(Number(pname))) {
      pname = Number(pname)
      if (pname < 0 && isList(item)) {
        pname = item.length + pname;
      }
    }
    // todo maybe allow list.(, 1 3 5) to get items 1 2 and 5
    //    list.(2..6) === list.(range 2 6) which would get items 2 through 6
    //    object.(, fname lname age) would return a list with fname lname and age
    //    object.(new (fname) (lname) (age)) would return an object with fname lname and age
    item = item[pname];
  }
  return item;
}
// @ts-ignore
$getr.isMeta = true;

export const doEarlyExit = Symbol('doEarlyExit');
export function $doBlock(stack: Stack, ast: any[]) {
  if (!isList(ast)) ast = [ast];
  for (const i of ast) {
    if(last(stack).isParseTabSize) {
      stack
      i
    }        
    const r = $eval(stack, i);
    last(stack)._ = r;
    if ($get(stack, 'doEarlyExit') === doEarlyExit) break; // allows for control flow (e.g. return, break, etc)
  }  
  return $get(stack, '_');
}
// @ts-ignore
$doBlock.isMeta = true;

export function $eval(stack: Stack, ast) {
  if (isSym(ast)) {
    // TODO quoted symbols
    const name = untick(ast);
    if (isSym(name)) return name;
    const r = $get(stack, name);
    if (r === undefined) throw new Error(`${name} is not defined`);
    return r
  }
  if (isExpr(ast)) {
    // TODO quoted expressions
    const expr = untick(ast);
    if (isExpr(expr)) return expr;
    const f = $eval(stack, expr[0]);
    if (!f){
      throw new Error(`function in expression is undefined: ${stringify(ast, 2)}\n${ast._sourceLine || ''}`)
    } 
    let args = skip(expr);    
    if (!(f.isMacro || f.isMeta)) {
      args = args.map(arg => $eval(stack, arg));
    }
    if (f.isMeta) {
      args.unshift(stack);
    }
    let result = $apply(stack, f, args);
    if(f.isMacro) {
      result = $eval(stack, result);
    }
    return result;
  }
  return ast;
}
// @ts-ignore
$eval.isMeta = true;

function applyHost(f, args:any[]) {
  const _f:Fn = f;
  const fnStack = [...(_f.closure || [])];
  const fnAst = _.cloneDeep(_f.body);  
  const fnScope = $newScope(fnStack);
  const argMap = _.zipObject(_f.params.map(p => p.name), args);
  Object.assign(fnScope, argMap);
  fnScope.return = _ => {
    fnScope.doEarlyExit = doEarlyExit;
    return _;
  }
  const r = $doBlock(fnStack, fnAst);
  return r
}

export function $apply(stack: Stack, f, args:any[]) {
  let result = null;
  // standard js apply
  if (isFunction(f)) {
    result = f.apply(null, args);
  }
  // object with apply function
  else if (isFunction(f && f.apply)) {
    result = f.apply(...args);
  }
  // host fn apply
  else if (isFn(f)) {
    result = applyHost(f, args);    
  }
  // host fn.apply apply
  else if (isFn(f && f.apply)) {
    result = applyHost(f.apply, args);
  }
  else {
    throw new Error(`unknown apply ${stringify({ f, args, }, 2)}`)
  }  
  return result;
}
// @ts-ignore
$apply.isMeta = true;

export function $exists(stack: Stack, name: string): boolean {
  name = $eval(stack, untick(name));
  for (let i = stack.length - 1; i >= 0; i--) {
    if (stack[i][name] !== undefined) { 
      return true;
    }
  }
  return false;
}
// @ts-ignore
$exists.isMeta = true;

export function $var(stack: Stack, name: string, value: any = null) {
  name = $eval(stack, untick(name));
  //name = untick(name);
  value = $eval(stack, value);
  // for now, not throwing an error if already defined
  last(stack)[name] = value
  return value;
  //return tick(name);
}
// @ts-ignore
$var.isMeta = true;

export function $get(stack: Stack, name: string) {
  for (let i = stack.length - 1; i >= 0; i--) {
    if (stack[i][name] !== undefined) { 
      return stack[i][name]; 
    }
  }
  return undefined;
}
// @ts-ignore
$get.isMeta = true;

export function $set(stack: Stack, name: string, value: any) {
  name = untick(name);
  value = $eval(stack, value);
  for (let i = stack.length - 1; i >= 0; i--) {
    if (stack[i][name] !== undefined) { 
      stack[i][name] =  value;
      return value
    }
  }
  throw new Error(`${name} is not defined`);
}
// @ts-ignore
$set.isMeta = true;

export function $fn(stack: Stack, ...args) {
  let name;
  if(isString(args[0])){
    name = untick(args.shift());    
  }
  const params = untick(args.shift().map(untick));
  const body = args;
  const f = makeFn(name, params, undefined, body, [...stack]);
  if (name) {
    $var(stack, name, f);
  }
  return f;
}
// @ts-ignore
$fn.isMeta = true;

export function $newScope(stack: Stack, scope: { [key:string]: any} = {}) {
  stack.push(scope);
  scope._ = $get(stack, "_");
  if(scope._ === undefined) {
    scope._ = null;
  }
  return scope;
}
// @ts-ignore
$newScope.isMeta = true;

export function $exitScope(stack: Stack) {
  if (!stack.length) throw new Error('no scope to exit, stack is empty');
  stack.pop();
  return stack[stack.length - 1];
}
// @ts-ignore
$exitScope.isMeta = true;