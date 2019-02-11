import { isSym, untick, isExpr, isList, guid, sym, last, skip, unquote, tick, quote, add } from "./common";
import { js, cleanCopyList, stringify, copy } from "./utils";
import { readFileSync } from "fs";
import { getName, evalHost } from "./host";
import { Fn, makeFn } from "./typeInfo";
import { parseHost } from "./parse";
import { isString, isObject, isFunction } from "util";


export function getRef(refs:any[], ctx:any) {
  let ref = refs.indexOf(ctx);
  if(ref === -1) {
    ref = refs.length;
    refs.push(ctx);
  }
  return `r${ref}` 
}

export function defineVar(stack:any[], sym:string) {
  const ctx = last(stack);
  sym = untick(sym);
  const exports = getName(stack, 'exports');
  if(exports && exports[sym] !== undefined) throw new Error(`var already exists as an export: ${sym}`);
  if(ctx[sym] !== undefined) throw new Error(`var already exists: ${sym}`);
  ctx[sym] = null;
}

export function compileSym(stack:any[], sym:string) {
  if(!isSym(sym)) {
    throw new Error(`Not a symbol: ${sym}`)
  }
  sym = untick(sym)
  if(isSym(sym)) return `"${sym}"`; // logic for tick    
  if(sym == '_') return sym;
  for(let i = stack.length-1; i >= 0; i--) {
    if(stack[i].exports && stack[i].exports[sym] !== undefined) {
      let code = `imports.exports.${sym}`
      return code;
    }
    if(stack[i][sym] !== undefined) {
      if(i == 0) return `imports['${sym}']`
      return sym;
    }
  }
  throw new Error(`${sym} is not defined`);
}

export function compileVar(refs:any[], stack:any[], expr:any) {
  const varSym = expr[2]
  defineVar(stack, varSym)
  const varRef = compileSym(stack, varSym)
  const valueExpr = expr.length === 4 ? expr[3] : null;
  let r = `let ${varRef}=_=${compileExpr(refs, stack, valueExpr)}`
  return r
}

export function compileFn(refs:any[], stack:any[], fn:Fn) {
  const fnScope = {};
  let code = '';
  if(fn.name) code = `let ${fn.name}=`
  code += `_=(function(`
  code += fn.params.map(p => {
    fnScope[p.name] = null;
    return p.name
  }).join();
  stack = [...stack, fnScope]
  code += '){\n\tlet _=null;'
  code += compileExprBlock(refs, stack, fn.body);
  code += '\n\treturn _;\n})'
  return code
}

export function compileSet(refs:any[], stack:any[], expr:any) : string {
  if(expr.length > 4) throw new Error('set called with too many arguments');
  const varSym = expr[2]
  const varRef = compileSym(stack, varSym)
  const valueExpr = expr[3];  
  let r = `_=${varRef}=${compileExpr(refs, stack, valueExpr)}`
  r
  return r
}

export function compileCond(refs:any[], stack:any[], expr:any[]) {
  expr.shift()
  expr.shift()
  let r = '';
  expr.forEach((ifthen, i) => {
    let _if = compileExpr(refs, stack, ifthen.shift())
    const _then = compileExprBlock(refs, stack, ifthen)
    r += `if (${_if}) ${_then}`
    if (i < expr.length - 1)
      r += '\nelse '
  })  
  return r
}

export function compileExport(refs:any[], stack:any[], expr:any[]) {
  let exportCtx;
  for(let i = stack.length - 1; i >= 0; i--) {
    if(stack[i].exports !== undefined) {
      exportCtx = stack[i];
      break;
    }
  }
  if (!exportCtx) throw new Error(`no export object found: ${expr.map(untick).join(' ')}`);

  const name = untick(expr[3]);
  if(exportCtx.exports[name] !== undefined || exportCtx[name] !== undefined) throw new Error(`export already exists: ${name}`);
  if(stack.find(scope => scope[name] !== undefined)) throw new Error(`export cannot be declared because something with that name already exists: ${name}`);
  exportCtx.exports[name] = null;
  const exportRef = compileSym(stack, sym(name));
    
  const op = untick(expr[2]);
  let code = '';
  if (op == 'fn') {
    expr.splice(1,1) // remove '`export`
    expr.splice(2,1) // remove name
    code = compileExpr(refs, stack, expr)
  } else {
    code = compileExpr(refs, stack, expr[4])
  }
  code = '_=' + exportRef + '=' + code
  return code;
}

export function compileExpr(refs:any[], stack:any[], expr:any) : string {  
  if (isSym(expr)) return compileSym(stack, expr);
  if(!isExpr(expr)) return expr;

  if(expr[1] === sym('fn')) return $fn(refs, stack, expr);
  if(expr[1] === sym('do')) return compileExprBlock(refs, stack, skip(expr, 2))
  if(expr[1] === sym('var')) return compileVar(refs, stack, expr)
  if(expr[1] === sym('set')) return compileSet(refs, stack, expr)
  if(expr[1] === sym('cond')) return compileCond(refs, stack, expr);
  if(expr[1] === sym('export')) return compileExport(refs, stack, expr);
  // if(expr[1] === '`') return compileTick(refs, stack, expr);
  //if(expr[1] === "'") return compileQuote(refs, stack, expr);

  expr.shift();
  const fnName = compileExpr(refs, stack, expr.shift()) //untick(expr.shift())
  const args = expr.map(i => compileExpr(refs, stack, i)).join();
  let code = `_=${fnName}(${args})`;
  return code;
}

export function compileExprBlock(refs:any[], stack:any[], expr:any) {
  let code = `_=(function(_){`
  stack = [...stack, {}]
  code += ''
  expr = untick(expr);
  expr.forEach(i => {
    code += '\n\t';
    if(!isExpr(i)) code += '_='
    code += compileExpr(refs, stack, i);
    code += ';';
  })
  code += '\n\treturn _;\n})(_);'
  return code
}

export function compileHost(imports:any, ast:any[]) {
  const stack:any[] = [imports]
  const refs:any[] = []
  let innerCode = compileExprBlock(refs, stack, ast)
  let code = 'function(_,imports,'
  code += refs.map((v,i) => `r${i}`).join();
  //let importValues:any[] = []
  // code += Object.keys(imports).map(key => {
  //   importValues.push(imports[key])
  //   return key
  // })
  // .concat(refs.map((v,i) => `r${i}`))
  // .join();
  code += `){\n\t${innerCode}\n\treturn _;\n}`
  let f = js(code)
  const _ = getName(stack, '_')  
  //let exec = () => f.apply(null, [ _, ...importValues, ...refs])
  let exec = () => f.apply(null, [ _, imports, ...refs])
  return { code, f, exec, imports, ast }
}

const $fn = (refs:any[], stack:any[], expr) => {
  let args = skip(expr, 2);
  let name;
  if(isSym(args[0])) {
    name = untick(args.shift());    
  }
  let params = untick(args.shift()).map(untick);
  let body = args
  const f = makeFn(name, params, undefined, body, stack);
  return compileFn(refs, stack, f);
}
