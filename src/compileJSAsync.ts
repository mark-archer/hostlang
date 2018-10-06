import { isSym, untick, isExpr, isList, guid } from "./common";
import { js } from "./utils";
import { readFileSync } from "fs";
import { getName } from "./host";


export function refName() {
  return 'ref_' + guid().replace(/-/g,'');
}

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
      return `_=>${compileSym(refs, stack, expr[0])}`;
    else throw new Error('compileExpr - not an expression: ' + expr);
  }
  expr.shift();
  var f = compileSym(refs, stack, expr.shift());
  let code = `_=>${f}(`;
  expr.forEach((i:any) => {
    code += compileSym(refs, stack, i) + ',';
  })
  code = code.substr(0, code.length - 1) + ')';
  return code;
}

export function compileExprBlock(refs:any[], stack:any[], expr:any) {
  let code = 'Promise.resolve(_)\n';
  expr.forEach((expr:any) => {
    code += '.then(' + compileExpr(refs, stack, expr) + ')\n';
  })
  return code.trim();
}

export function compileHost(stack:any[], ast:any[], refs:any[]=[]) {
  let code = compileExprBlock(refs, stack, ast);
  let fnCode = 'function(_,';  
  refs.map((v, i) => {
    fnCode += `r${i},`
  })

  fnCode = fnCode.substr(0,fnCode.length - 1); // remove trailing comma in arguments;
  fnCode += `){ return ${code} }`;  
  let f = js(fnCode);
  let r = getName(stack, '_');
  let exec = () => f.apply(null, [ getName(stack, '_'), ...refs]);
  return { fnCode, f, refs, exec }
}
