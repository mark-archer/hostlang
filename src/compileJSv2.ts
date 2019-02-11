import { isSym, untick, isExpr, isList, guid, sym, last, skip, tick, unquote, quote } from "./common";
import { js, copy } from "./utils";
import { getName } from "./host";
import { Fn, makeFn } from "./typeInfo";
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

export function compileSym(refs:any[], stack:any[], sym:string) {
  if(!isSym(sym)) {
    throw new Error(`Not a symbol: ${sym}`)
  }
  sym = untick(sym)
  // tick logic
  if(isSym(sym)) return `"${sym}"`; 
  // quote logic
  if(sym[0] === `'`) { 
    sym = unquote(sym)
    sym
    const evalQuote = () => `${tick(getName(stack, sym))}`
    return compileExpr(refs, stack, ['`', evalQuote]);    
  }
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
  const varRef = compileSym(refs, stack, varSym)
  const valueExpr = expr.length === 4 ? expr[3] : null;
  let r = `let ${varRef}=_=${compileExpr(refs, stack, valueExpr)}`
  return r
}

export function compileFn(refs:any[], stack:any[], fn:Fn) {
  let code = '';
  if(fn.name) {
    defineVar(stack, fn.name)
    code = `let ${fn.name}=`
  }
  code += `_=(function(`
  const fnScope = {};
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
  const varRef = compileSym(refs, stack, varSym)
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
  const exportRef = compileSym(refs, stack, sym(name));
    
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

export function compileTick(refs:any[], stack:any[], expr:any) {
  expr.shift();
  const astClosure = () => expr; // TODO this should probably be a copy
  return compileExpr(refs, stack, ['`', astClosure])    
}

export function compileQuote(refs:any[], stack:any[], expr:any) {
  expr.splice(0,2)
  stack[0].tick = stack[0].tick  || tick // add tick to imports
  let pieces = expr.map(i => {
    if(i && i[0] === '`' && i[1] === '`') {
      return compileExpr(refs, stack, i);
    }
    i = compileExpr(refs, stack, i);
    i = `imports.tick(${i})`
    return i
  })
  pieces = pieces.join(',\n')
  pieces
  let code = `
    _=(function() {
      return ['\`', ${pieces}]
    })();
  `
  return code
}

function isMacroCall(stack:any[], expr:any) {
  if(!isExpr(expr)) return false;
  const fnSym = expr[1];
  if(!isSym(fnSym)) return false;  
  const fn = getName(stack, untick(fnSym));
  return fn && (fn.isMacro || (untick(fnSym)[0] === '$' && fn.isMacro !== false));
}

export function compileMacro(refs:any[], stack:any[], expr:any) {
  if(!isMacroCall(stack, expr)) return expr
  const fnSym = expr[1];
  const macro = getName(stack, untick(fnSym));  
  const callMacro = (...args) => {
    const genAst = macro(...args)    
    const compileAst = compileHost(stack, [genAst], refs)
    return compileAst.exec()
  }
  expr.shift()
  expr.shift()
  return compileExpr(refs, stack, ['`', callMacro, ...expr])
}

export function compileExpr(refs:any[], stack:any[], expr:any) : string {  
  if(!isExpr(expr)) {
    if(isSym(expr)) return compileSym(refs, stack, expr);
    if(isList(expr)) return '[' + expr.map(t => compileExpr(refs, stack, t)).join() + ']';
    if(isObject(expr)) return '{' + Object.keys(expr).map(k => `"${k}":${compileExpr(refs, stack, expr[k])}`) + '}'
    if(isString(expr)) return `"${expr}"`
    if(isFunction(expr)) return getRef(refs, expr);
    return String(expr);
  }
  
  if(expr[1] === sym('fn')) return $fn(refs, stack, expr);
  if(expr[1] === sym('do')) return compileExprBlock(refs, stack, skip(expr, 2))
  if(expr[1] === sym('var')) return compileVar(refs, stack, expr)
  if(expr[1] === sym('set')) return compileSet(refs, stack, expr)
  if(expr[1] === sym('cond')) return compileCond(refs, stack, expr);
  if(expr[1] === sym('export')) return compileExport(refs, stack, expr);
  if(expr[1] === '`') return compileTick(refs, stack, expr);
  if(expr[1] === "'") return compileQuote(refs, stack, expr);
  if(isMacroCall(stack, expr)) return compileMacro(refs, stack, expr);

  expr.shift();
  const fnName = compileExpr(refs, stack, expr.shift())
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

export function compileHost(imports:any, ast:any[], refs:any[]=[]) {
  const stack:any[] = isList(imports) ? [...imports] : [imports]
  if(isList(imports)) imports = imports[0] || {};
  let innerCode = compileExprBlock(refs, stack, ast)
  let code = 'function(_,imports,'
  code += refs.map((v,i) => `r${i}`).join();
  code += `){\n\t${innerCode}\n\treturn _;\n}`
  let f = js(code)
  const _ = getName(stack, '_')  
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
