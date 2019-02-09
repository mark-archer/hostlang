import { isSym, untick, isExpr, isList, guid, sym, last, skip } from "./common";
import { js, cleanCopyList, stringify, copy } from "./utils";
import { readFileSync } from "fs";
import { getName } from "./host";
import { Fn, makeFn } from "./typeInfo";
import { parseHost } from "./parse";
import { isString, isObject, isFunction } from "util";

// export function refName() {
//   return 'ref_' + guid().replace(/-/g,'');
// }

export function getRefId(refs:any[], ctx:any) {
  let ref = refs.indexOf(ctx);
  if(ref === -1) {
    ref = refs.length;
    refs.push(ctx);
  }
  // NOTE this could be done with guids to avoid needing to access a map of properties 
  return `r${ref}` 
}

export function defineVar(refs:any[], stack:any[], sym:string) {
  const ctx = last(stack);
  sym = untick(sym);
  if(ctx[sym] !== undefined) throw new Error(`var already exists: ${sym}`);
  ctx[sym] = null;
}

export function compileSym(refs:any[], stack:any[], sym:string) {
  if(!isSym(sym)) {
    throw new Error(`Not a symbol: ${sym}`)    
  }
  sym = untick(sym)
  if(sym == '_') return sym
  for(let i = stack.length-1; i >= 0; i--) {
    if(stack[i][sym] !== undefined) {
      let ctx = stack[i]
      let scopeId = getRefId(refs, ctx)
      let code = `${scopeId}.${sym}` // NOTE this is effectively a pointer
      return code;
    }
    if(stack[i].exports && stack[i].exports[sym] !== undefined) {
      let ctx = stack[i]
      let scopeId = getRefId(refs, ctx)
      let code = `${scopeId}.exports.${sym}` // NOTE this is effectively a pointer
      return code;
    }
  }
  throw new Error(`${sym} is not defined`);
}

export function compileVar(refs:any[], stack:any[], expr:any) {
  const varSym = expr[2]
  defineVar(refs, stack, varSym)
  const varRef = compileSym(refs, stack, varSym)
  const valueExpr = expr.length === 4 ? expr[3] : null;
  let r = `${varRef}=${compileExpr(refs, stack, valueExpr)}`
  return r
}

export function compileExport(refs:any[], stack:any[], expr:any[]) {
  refs
  stack
  expr

  let exportCtx;
  for(let i = stack.length - 1; i >= 0; i--) {
    if(stack[i].exports !== undefined) {
      exportCtx = stack[i];
      break;
    }
  }
  if (!exportCtx) throw new Error(`no export object found: ${expr.map(untick).join(' ')}`);

  const name = untick(expr[3]);
  if(exportCtx.exports[name] !== undefined || exportCtx[name] !== undefined) throw new Error(`export var already exists: ${name}`);

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

export function compileSet(refs:any[], stack:any[], expr:any) {
  if(expr.length > 4) throw new Error('set called with too many arguments');
  const varSym = expr[2]
  const varRef = compileSym(refs, stack, varSym)
  const valueExpr = expr[3];  
  let r = `_=${varRef}=${compileTerm(refs, stack, valueExpr)}`
  r
  return r
}

export function compileCond(refs:any[], stack:any[], expr:any[]) {
  expr.shift()
  expr.shift()
  let r = '';
  expr.forEach((ifthen, i) => {
    let _if = compileExpr(refs, stack, ifthen.shift()).substr(2)
    const _then = compileExprBlock(refs, stack, ifthen).substr(2)
    r += `if (${_if}) _=${_then}`
    if (i < expr.length - 1)
      r += '\nelse '
  })  
  return r
} 

function isExprMacroCall(stack:any[], expr:any) {
  if(!isExpr(expr)) return false;
  const fnSym = expr[1];
  if(!isSym(fnSym)) return false;  
  const fn = getName(stack, untick(fnSym));
  return fn && (fn.isMacro || (untick(fnSym)[0] === '$' && fn.isMacro !== false));
}

export function compileMacro(refs:any[], stack:any[], expr:any) {
  if(isExprMacroCall(stack, expr)) {
    const fnSym = expr[1];
    const macro = getName(stack, untick(fnSym));
    // TODO macro fn not js function then compile    
    const callMacro = (...args) => {
      // if stack is needed it can be included with in a new scope
      const genAst = macro(...args)
      const compileAst = compileHost([...stack], [genAst], [...refs])
      //console.log(compileAst.code)
      return compileAst.exec()
    }
    const _ast = copy(expr);
    _ast[1] = callMacro    
    return _ast
  }
  return expr;
}

export function compileTerm(refs: any[], stack:any[], term:any) {
  if(isSym(term)) {
    return compileSym(refs, stack, term);
  }
  if(isExpr(term)){
    return compileExpr(refs, stack, term);
  }
  if(isList(term)) {
    return '[' + term.map(t => compileTerm(refs, stack, t)).join() + ']';
  }
  if(isObject(term)) {
    return '{' + Object.keys(term).map(k => `"${k}":${compileTerm(refs, stack, term[k])}`) + '}'
  }
  if(isString(term)) {
    return `"${term}"`
  }
  if(isFunction(term)) {
    return getRefId(refs, term);
  }
  return String(term)
}

export function compileExpr(refs:any[], stack:any[], expr:any) {
  if(!isExpr(expr))
    return '_=' + compileTerm(refs, stack, expr)
  if(isExprMacroCall(stack, expr)) {
    expr = compileMacro(refs, stack, expr);
    return compileExpr(refs, stack, expr);
  }
  if(expr[1] === sym('var')) return compileVar(refs, stack, expr)
  if(expr[1] === sym('set')) return compileSet(refs, stack, expr)
  if(expr[1] === sym('cond')) return compileCond(refs, stack, expr);
  if(expr[1] === sym('do')) return compileExprBlock(refs, stack, skip(expr, 2))
  if(expr[1] === sym('fn')) return $fn(refs, stack, expr);
  if(expr[1] === sym('export')) return compileExport(refs, stack, expr);
  
  expr.shift()
  var f = compileTerm(refs, stack, expr.shift())
  let code = `_=${f}(`
  code += expr.map((i:any) => compileTerm(refs, stack, i)).join(',')
  code += ')'
  return code
}

export function compileExprBlock(refs:any[], stack:any[], exprBlock:any) {
  let code = '_=(function(_){'
  stack.push({});
  exprBlock.forEach(expr => code += compileExpr(refs, stack, expr) + ';')
  stack.pop();
  code += 'return _;})(_)'
  return code.trim()
}

export function compileFn(refs:any[], stack:any[], fn:Fn) {
  const fnScope = {}
  let paramNames = []
  fn.params.forEach(p => {
    paramNames.push(p.name)
    fnScope[p.name] = null
  })

  stack.push(fnScope)
  const r = compileExprBlock(refs, stack, fn.body)
  let paramRefs = '\n'
  fn.params.forEach(p => {
    const pRef = compileTerm(refs, stack, sym(p.name))
    paramRefs += `${pRef}=${p.name};`
  })
  stack.pop()

  let code = `_=function(${paramNames.join()}){
    ${paramRefs.trimRight()}
    let _ = null;
    ${r};
    return _;
  }`
  if(fn.name) {
    defineVar(refs, stack, fn.name)
    const ref = compileSym(refs, stack, sym(fn.name))
    code = `${ref}=${code}`
  }
  return code;
}

export function compileHost(stack:any[], ast:any[], refs:any[]=[]) {
  let innerCode = compileExprBlock(refs, stack, ast)  
  let code = 'function(_,'
  refs.map((v, i) => {
    code += `r${i},`
  })
  code = code.substr(0,code.length - 1) // remove trailing comma in arguments;
  code += `){${innerCode};return _;}`
  let f = js(code)
  let r = getName(stack, '_')
  let exec = () => f.apply(null, [ getName(stack, '_'), ...refs])
  return { code, f, refs, exec }
}

export async function execHost(stack:any[]=[], code:string, refs:any[]=[]) {
  if(!stack.length) stack.push({ });
  const astDirty = await parseHost(stack, code)
  const ast = cleanCopyList(astDirty)
  const exe = compileHost(stack, ast, refs)
  return exe.exec();
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