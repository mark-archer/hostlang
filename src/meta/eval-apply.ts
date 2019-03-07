import { isExpr, isSym, nameLookup, untick } from "./meta-common";
import { skip, isFunction } from "../common";

// ast -> value
export async function $eval(stack:any[], x:any) {
  if (isSym(x)) {
    x = untick(x);
    if (isSym(x)) return x;
    const r = nameLookup(stack, x);
    if (r === undefined) throw new Error(`${x} is not defined`);
    return r
  } 
  if (isExpr(x)) {
    x = untick(x);
    if (isExpr(x)) return x;
    x = skip(x);
    const [ f, ...args ] = await Promise.all(x.map(i => $eval(stack, i)));
    return $apply(stack, f, args);
  }
  return x
}

// f -> value
export function $apply(stack:any[], f:any, args:any[]) {
  // if it's a js function call apply with no 'this'
  if (isFunction(f)) {
    return f.apply(null, args);
  }

  // if it's anything else but still has an 'apply' function call it directly
  if (f && isFunction(f.apply)) {
    return f.apply(...args)
  }

  // any other types of apply?  Maybe allow custom ones?
  throw new Error(`cannot apply ${f} to ${args}`)
}