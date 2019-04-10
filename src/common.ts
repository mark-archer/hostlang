import * as _ from "lodash";
import * as uuid from "uuid";

export const {
  isString,
  isFunction,
  union,
  isNumber,
  clone,
  isDate,
  isBoolean,
} = _;

export const isObject = (x) => _.isObject(x) && !_.isArray(x);

export const guid = uuid.v4;
export const isList = (x) => _.isArray(x);
export const isHtml = (x) => _.isElement(x);

export const promiseAll: ((x: any[]) => Promise<any>) = (x) => Promise.all(x);

export function isSym(x: any) {
  return isString(x) && x[0] === "`" && x.length > 1;
}

export function isExpr(x: any) {
  return isList(x) && x[0] === "`";
}

export function isHostCode(x: any) {
  return x && (isSym(x) || isExpr(x));
}


export function newid(shard?: string) {
  const shardREDesc =
    "shard can only have numbers, lowercase letters, dots and hypens. They cannot begin with a hypen";
  const shardRE = /^[0-9a-z\.][0-9a-z\-\.]*$/;
  shard = shard || "z";
  if (shard && !shard.match(shardRE)) { throw new Error("newid - invalid shard: " + shardREDesc); }
  return shard + "-" + Date.now().toString() + "-" + uuid.v4().replace(/-/g, "");
}

export function isid(sid: any) {
  // <some grouping text>:<integer -- should be creationTime>:<GUID>
  // return !!/^.*-[0-9]+-[0-9a-f]{8}[0-9a-f]{4}[0-9a-f]{4}[0-9a-f]{4}[0-9a-f]{12}$/i.exec(sid);
  return !!/^.*-[0-9]+-[0-9a-f]{32}$/i.exec(sid) ||
    !!/^.*:[0-9]+:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.exec(sid);
}

export const asid = (x: any) => isObject(x) /*&& isid(x.id)*/ && x.id || x;

export function tick(x: any) {
  if (isString(x)) { return "`" + x; }
  if (isList(x)) { return ["`", ...x]; }
  return x;
}

export function sym(s: string) {
  if (!isSym(s)) { s = tick(s); }
  return s;
}

export function untick(x: any) {
  if (isSym(x)) { return x.substr(1); }
  if (isExpr(x)) {
    x = [...x];
    x.shift();
    return x;
  }
  return x;
}

export function quote(x: any) {
  if (isSym(x)) { return tick("'" + untick(x)); }
  if (isExpr(x)) { return tick(["'", ...untick(x)]); }
  return x;
}

export function unquote(x: any) {
  if (isString(x) && x[0] === "'") { return x.substr(1); }
  if (isList(x) && x[0] === "'") {
    x = [...x];
    x.shift();
    return x;
  }
  return x;
}

export function isJS(x: any) {
  return isFunction(x);
}

export function isPromise(x: any) {
  return x && isFunction(x.then);
}

export interface INvp { kind: "Nvp"; name: string; value: any; }

export function isNvp(x: any) {
  return isObject(x) && x.kind === "Nvp" && x.name !== undefined && x.value !== undefined;
}

export function nvp(name: string, value: any) {
  return { kind: "Nvp", name, value };
}

export function mapkv(x: any, f: (k: string, v: any) => any) {
  const keys = _.keys(x);
  return keys.map((k) => f(k, x[k]));
}

export const keys = _.keys;
export const values = (x: any) => keys(x).map((k) => x[k]);

export const last = _.last;
export const range = _.range;
export const first = _.first;

export const list = (...items: any[]) => items;

export const without = _.without;
export const flatten = _.flatten;
export const compact = _.compact;
export const take = _.take;
export const uniq = _.uniq;

export function skip(x: any[], n: number = 1) {
  return x.slice(n);
}
export function date(arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
  // this craziness is because I couldn't get apply to work with (new Date())
  let date = null;
  if (arguments.length == 7) {
    date = new Date(arg1, --arg2, arg3, arg4, arg5, arg6, arg7);
  } else if (arguments.length == 6) {
    date = new Date(arg1, --arg2, arg3, arg4, arg5, arg6);
  } else if (arguments.length == 5) {
    date = new Date(arg1, --arg2, arg3, arg4, arg5);
  } else if (arguments.length == 4) {
    date = new Date(arg1, --arg2, arg3, arg4);
  } else if (arguments.length == 3) {
    date = new Date(arg1, --arg2, arg3);
  } else if (arguments.length == 2) {
    date = new Date(arg1, --arg2);
  } else if (arguments.length == 1) {
    date = new Date(arg1);
  } else {
    date = new Date();
  }
  return date;
}

export function asString(x: any) { return x + ""; }

export function one(...args: any[]) {
  return args[0];
}

export function EQ(...args: any[]) {
  if (args.length < 2) { return undefined; }
  for (let i = 1; i < args.length; i++) {
    if (args[0] !== args[i]) { return false; }
  }
  return true;
}

export function NEQ(...args: any[]) {
  if (args.length < 2) { return undefined; }
  for (let i = 1; i < args.length; i++) {
    if (args[0] === args[i]) { return false; }
  }
  return true;
}

export function GTE(...args: any[]) {
  if (args.length < 2) { return undefined; }
  for (let i = 1; i < args.length; i++) {
    if (args[0] < args[i]) { return false; }
  }
  return true;
}

export function LTE(...args: any[]) {
  if (args.length < 2) { return undefined; }
  for (let i = 1; i < args.length; i++) {
    if (args[0] > args[i]) { return false; }
  }
  return true;
}

export function isMatch(...args: any[]) {
  if (args.length < 2) { return undefined; }
  for (let i = 1; i < args.length; i++) {
    if (!_.isMatch(args[0], args[i])) { return false; }
  }
  return true;
}

export function isEqual(...args: any[]) {
  if (args.length < 2) { return undefined; }
  for (let i = 1; i < args.length; i++) {
    if (!_.isEqual(args[0], args[i])) { return false; }
  }
  return true;
}

export function GT(...args: any[]) {
  if (args.length < 2) { return undefined; }
  for (let i = 1; i < args.length; i++) {
    if (args[0] <= args[i]) { return false; }
  }
  return true;
}

export function LT(...args: any[]) {
  if (args.length < 2) { return undefined; }
  for (let i = 1; i < args.length; i++) {
    if (args[0] >= args[i]) { return false; }
  }
  return true;
}

export function add(...args: any[]) {
  let r = args.shift();
  for (const a of args) { r += a; }
  return r;
}

export function sum(args: any[]) {
  return add.apply(null, args);
}

export function subtract(...args: any[]) {
  let r = args.shift();
  for (const a of args) { r -= a; }
  return r;
}

export function multiply(...args: any[]) {
  let r = args.shift();
  for (const a of args) { r *= a; }
  return r;
}

export function divide(...args: any[]) {
  let r = args.shift();
  for (const a of args) { r /= a; }
  return r;
}

export function mod(a: any, b: any) {
  return a % b;
}

export function not(...args: any[]) {
  if (args.length !== 1) { throw new Error("not only takes one argument"); }
  return !args[0];
}

export function log(...args: any[]) {
  console.log(...args);
  if (args.length < 2) { args = args[0]; }
  return args;
}

export function warn(...args: any[]) {
  console.warn(...args);
  if (args.length < 2) { args = args[0]; }
  return args;  
}

// @ts-ignore
String.prototype.removeNewlineIndent = function () {
  return this.split("\n").map((s) => s.trim()).join("");
};
