import * as common from "../common";
import { sym, isSym, isExpr, tick, untick, quote, unquote, last, isList, skip } from "../common";
import { isFunction } from "util";
import { stringify } from "../utils";
import { $parse } from "./meta-parser";
import { exists } from "fs";

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
    exists: $exists, 
    var: $var,
    get: $get, 
    set: $set,
    eval: $eval,
    apply: $apply,
    parse: $parse,
    newScope: $newScope,
    exitScope: $exitScope
  };
  Object.keys(stackFns).forEach(name => {
    runtimeScope[name] = (...args) => stackFns[name](stack, ...args)
    runtimeScope[name].isMacro = stackFns[name].isMacro;
  });  

  // @ts-ignore
  //return runtimeScope; // should be able to do everything you need with functions on stack
  // @ts-ignore
  return new Proxy({},{ get(target,name) { return $get(stack, name); }})
}

// eval: ast -> value
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
    const argsAst = skip(expr);
    // @ts-ignore
    if (f.isMacro) {
      let r = $apply(stack, f, argsAst);
      r = $eval(stack, r);
      return r;
    }
    const args = argsAst.map(arg => $eval(stack, arg));
    const r = $apply(stack, f, args);
    return r;
  }
  return ast;
}

// apply: fn+args -> value
//  stack is included for symetry with eval and future enhancements to allow adding apply rules
export function $apply(stack: Stack, f, args:any[]) {
  // standard js apply
  if (isFunction(f)) {
    return f.apply(null, args);
  }
  // object with apply function
  if (isFunction(f.apply)) {
    return f.apply(...args);
  }
  throw new Error(`unknown apply ${stringify({ f, args, }, 2)}`)
}

function $exists(stack: Stack, name: string): boolean {
  name = $eval(stack, untick(name));
  for (let i = stack.length - 1; i >= 0; i--) {
    if (stack[i][name] !== undefined) { 
      return true;
    }
  }
  return false;
}
// @ts-ignore
$exists.isMacro = true;

function $var(stack: Stack, name: string, value: any = null) {
  name = $eval(stack, untick(name));
  //name = untick(name);
  value = $eval(stack, value);
  // for now, not throwing an error if already defined
  last(stack)[name] = value
  return value;
}
// @ts-ignore
$var.isMacro = true;

function $get(stack: Stack, name: string) {
  for (let i = stack.length - 1; i >= 0; i--) {
    if (stack[i][name] !== undefined) { 
      return stack[i][name]; 
    }
  }
  return undefined;
}

function $set(stack: Stack, name: string, value: any) {
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

function $newScope(stack: Stack, scope: { [key:string]: any} = {}) {
  stack.push(scope);
  return scope;
}

function $exitScope(stack: Stack) {
  if (!stack.length) throw new Error('no scope to exit, stack is empty');
  stack.pop();
  return stack[stack.length - 1];
}
