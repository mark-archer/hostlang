import { isArray, isString } from 'lodash'

export const isList = isArray;

export function sym(s: string) {
  if (isString(s) && !isSym(s)) { s = tick(s); }
  return s;
}

export function isSym(x: any) {
  return isString(x) && x[0] === "`" && x.length > 1;
}

export function expr(...args) {
  return ['`', ...args.map(sym)]
}

export function isExpr(x: any) {
  return isList(x) && x[0] === "`";
}

export function tick(x: any) {
  if (x === "`") { return x; }
  if (isString(x)) { return "`" + x; }
  if (isList(x)) { return ["`", ...x]; }
  return x;
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