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
      let code = `env.exports.${sym}`
      return code;
    }
    if(stack[i][sym] !== undefined) {
      if(i == 0) return `env['${sym}']`
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
  const assignUnderscore = valueExpr !== '`_'
  let r = `let ${varRef}${assignUnderscore && '=_' || ''}=${compileExpr(refs, stack, valueExpr)}`
  return r
}

export function compileFn(refs:any[], stack:any[], expr:(any[] | Fn)) {
  let fn:Fn;
  if(isList(expr)) {
    //@ts-ignore
    let args = skip(expr, 2);
    let name;
    if(isSym(args[0])) name = untick(args.shift());
    let params = untick(args.shift()).map(untick);
    let body = args
    fn = makeFn(name, params, undefined, body, stack);
  } else {
    // @ts-ignore
    fn = expr
  }  

  let code = '';
  code += `function ${fn.name || ''}(`
  const fnScope = {};
  code += fn.params.map(p => {
    fnScope[p.name] = null;
    return p.name
  }).join();
  stack = [...stack, fnScope]
  code += '){\n\tlet _=null;\n\treturn'
  code += compileExprBlock(refs, stack, fn.body);
  code += '\n}'
  return code
}

export function compileSet(refs:any[], stack:any[], expr:any) : string {
  if(expr.length > 4) throw new Error('set called with too many arguments');
  const varSym = expr[2]
  const varRef = compileSym(refs, stack, varSym)
  const valueExpr = expr[3];  
  let r = `${varRef}=${compileExpr(refs, stack, valueExpr)}`
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
    r += `if (${_if}) _=${_then}`
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
  code = exportRef + '=' + code
  return code;
}

export function compileTick(refs:any[], stack:any[], expr:any) {
  expr.shift();
  const astClosure = () => expr; // TODO this should probably be a copy
  return compileExpr(refs, stack, ['`', astClosure])    
}

export function compileQuote(refs:any[], stack:any[], expr:any) {
  expr.splice(0,2)
  stack[0].tick = stack[0].tick  || tick // add tick to env
  let pieces = expr.map(i => {
    if(i && i[0] === '`' && i[1] === '`') {
      return compileExpr(refs, stack, i);
    }
    if(isExpr(i) && i[1] !== '`') {
      i = quote(i);
      i = compileExpr(refs, stack, i);
    } else {
      i = compileExpr(refs, stack, i);
      i = `env.tick(${i})`
    }    
    return i
  })
  pieces
  pieces = pieces.join(',\n')
  pieces
  let code = `
    (function() {
      return ['\`', ${pieces}]
    })()
  `
  return code.trim()
}

function isMacroCall(stack:any[], expr:any) {
  if(!isExpr(expr)) return false;
  const fnSym = expr[1];
  if(!isSym(fnSym)) return false;  
  const fn = getName(stack, untick(fnSym));
  if(!fn && untick(fnSym)[0] === '$') return true;
  return fn && (fn.isMacro || (untick(fnSym)[0] === '$' && fn.isMacro !== false));
}

export function compileMacro(refs:any[], stack:any[], expr:any) {
  const env = stack[0];
  env.compileHost = env.compileHost || compileHost;
  expr.shift()
  const macroExpr = compileExpr(refs, stack, expr.shift())
  const macroArgs = expr.map(_expr => compileExpr(refs, stack, _expr)).join()
  const compileArgs = { refs, stack: [...stack] }
  const compileArgsRef = getRef(refs, compileArgs)  
  let code = `
    (function(){      
      const ast = ${macroExpr}(${macroArgs});
      const exe = env.compileHost(${compileArgsRef}.stack, [ast], ${compileArgsRef}.refs)
      return exe.exec()
    })()`
  code
  return code.trim()
}

export function compileGetr(refs:any[], stack:any[], expr:any) {
  expr.shift()
  expr.shift()
  expr  
  let code = compileExpr(refs, stack, expr.shift());
  while(expr.length) {
    let prop = compileExpr(refs, stack, untick(expr.shift()));
    code += `[${prop}]`
  }
  return code
}

export function compileSetr(refs:any[], stack:any[], expr:any) {
  expr.shift()
  expr.shift()
  let ref = compileExpr(refs, stack, expr.shift());
  let code = ref;
  while(expr.length > 1) {
    let prop = compileExpr(refs, stack, untick(expr.shift()));
    code += `[${prop}]`
  }  
  let value = compileExpr(refs, stack, untick(expr.shift()));
  code += `=${value}`
  return code
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

  const compilers = stack[0].compilers;
  const cname = untick(expr[1])
  if(compilers && compilers[cname]) return compilers[cname](refs, stack, expr);
  if(expr[1] === sym('var')) throw new Error('var can only be used in a block')
  if(expr[1] === sym('cond')) throw new Error('cond can only be used in a block')  
  if(isMacroCall(stack, expr)) return compileMacro(refs, stack, expr);  

  expr.shift();
  const fnName = compileExpr(refs, stack, expr.shift())
  const args = expr.map(i => compileExpr(refs, stack, i)).join();
  let code = `${fnName}(${args})`;
  return code;
}

export function compileExprBlock(refs:any[], stack:any[], expr:any) {
  expr = untick(expr);
  if(expr[0] === '`do') expr.shift()
  expr
  let code = `(function(_){`
  stack = [...stack, {}]
  code += ''
  expr.forEach(i => {
    let exprCode;
    if(i[1] === sym('var')) exprCode = compileVar(refs, stack, i)
    else if(i[1] === sym('fn') && isSym(i[2])) {
      const fnName = i[2];
      exprCode = '_=' + compileExpr(refs, stack, i);
      exprCode += ';' + compileVar(refs, stack, ['`', '`var', fnName, '`_'])
    }
    else if(i[1] === sym('cond')) exprCode = compileCond(refs, stack, i)
    else {
      exprCode = '_=' + compileExpr(refs, stack, i);
    }    
    exprCode = `\n\t${exprCode};`
    code += exprCode
    return exprCode;
  })
  code += '\n\treturn _;\n})(_);'
  return code
}

function loadDefaultCompilers(stack:any[]) {
  const env = stack[0]
  if(!env.compilers) env.compilers = {};
  const defaultCompilers = {
    'getr': compileGetr,
    'setr': compileSetr,
    'do': compileExprBlock,
    'fn': compileFn,
    'set': compileSet,
    'export': compileExport,
    '`': compileTick,
    "'": compileQuote,
  }
  Object.keys(defaultCompilers).map(key => {
    env.compilers[key] = env.compilers[key] || defaultCompilers[key];
  })
  //console.log(env.compilers)
}

export function compileHost(env:any, ast:any[], refs:any[]=[]) {
  const stack:any[] = isList(env) ? [...env] : [env]
  stack
  if(isList(env)) env = env[0] || {};
  stack[0] = env;
  loadDefaultCompilers(stack)
  let innerCode = compileExprBlock(refs, stack, ast)
  let code = 'function(_,env,'
  code += refs.map((v,i) => `r${i}`).join();
  code += `){\n\treturn ${innerCode}\n}`
  let f = js(code)
  const _ = getName(stack, '_')  
  let exec = () => f.apply(null, [ _, env, ...refs])
  return { code, f, exec, env, ast }
}

export function load() {

}


