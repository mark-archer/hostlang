import { isSym, untick, isExpr, isList, guid, sym } from "./common";
import { js } from "./utils";
import { readFileSync } from "fs";
import { getName } from "./host";
import { Fn } from "./typeInfo";


// export function refName() {
//   return 'ref_' + guid().replace(/-/g,'');
// }

export function compileSym(refs:any[], stack:any[], sym:string) {
  if(!isSym(sym)) return sym;
  sym = untick(sym);
  if(sym == '_') return sym;
  for(let i = stack.length-1; i >= 0; i--) {
    if(stack[i][sym] !== undefined) {
      let ctx = stack[i]
      let ref = refs.indexOf(ctx);
      if(ref === -1) {
        ref = refs.length;
        refs.push(ctx);
      }
      let code = `r${ref}.${sym}`; // NOTE this is effectively a pointer
      return code;
    }
  }
  throw new Error(`${sym} is not defined`);
}

export function compileExpr(refs:any[], stack:any[], expr:any) {
  if(!isExpr(expr)) {
    if(isList(expr) && expr.length === 1)
      return `_=${compileSym(refs, stack, expr[0])}`;
    else throw new Error('compileExpr - not an expression: ' + expr);
  }
  expr.shift();
  var f = compileSym(refs, stack, expr.shift());
  let code = `_=${f}(`;
  expr.forEach((i:any) => {
    code += compileSym(refs, stack, i) + ',';
  })
  code = code.substr(0, code.length - 1) + ')';
  return code;
}

export function compileExprBlock(refs:any[], stack:any[], expr:any) {
  let code = '_=(function(_){';
  expr.forEach((expr:any) => {
    code += compileExpr(refs, stack, expr) + ';';
  })
  code += 'return _;})(_)'
  return code.trim();
}

export function compileFn(refs:any[], stack:any[], fn:Fn) {
  const fnScope = {}
  let paramNames = []; //['_']
  fn.params.forEach(p => {
    paramNames.push(p.name)
    fnScope[p.name] = null
  });

  stack.push(fnScope);
  const r = compileExprBlock(refs, stack, fn.body);    
  let paramRefs = '\n';
  fn.params.forEach(p => {
    const pRef = compileSym(refs, stack, sym(p.name))
    paramRefs += `${pRef}=${p.name};`
  })
  stack.pop();
  
  return `function(${paramNames.join()}){
    ${paramRefs.trimRight()}
    let _ = null;
    ${r};
    return _;
  }`
}

export function compileHost(stack:any[], ast:any[], refs:any[]=[]) {
  let innerCode = compileExprBlock(refs, stack, ast);
  let code = 'function(_,';
  refs.map((v, i) => {
    code += `r${i},`
  })

  code = code.substr(0,code.length - 1); // remove trailing comma in arguments;
  code += `){${innerCode};return _;}`;
  let f = js(code);
  let r = getName(stack, '_');
  let exec = () => f.apply(null, [ getName(stack, '_'), ...refs]);
  return { code, f, refs, exec }
}
