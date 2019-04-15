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
  const stackFns = {
    get: $get,
    newScope: $newScope,
    exitScope: $exitScope,
    exists: $exists, 
    var: $var,
    set: $set,
    apply: $apply,
    parse: $parse,
    eval: $eval,
  };
  Object.assign(runtimeScope, stackFns);

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

export function $eval(stack: Stack, ast) {
  const _eval = $get(stack, "eval");
  if (_eval && _eval !== $eval) return _eval(stack, ast);

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

export function $apply(stack: Stack, f, args:any[]) {
  const _apply = $get(stack, "apply");
  if (_apply && _apply !== $apply) return _apply(stack, f, args);

  let result = null;
  // standard js apply
  if (isFunction(f)) {
    result = f.apply(null, args);
  }
  // object with apply function
  else if (isFunction(f && f.apply)) {
    result = f.apply(...args);
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
  // todo maybe this should call $get(stack, "makeFn")
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