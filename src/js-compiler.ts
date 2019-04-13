import { $compile, ICompilerInfo, compiler, compilerInfo } from "./meta/meta-compiler";
import { untick, isSym, unquote, isExpr, isList, isExprOf } from "./meta/meta-common";
import { skip, sym, isString, keys, last, tick } from "./common";
import { Fn, makeFn, isFn } from "./typeInfo";
import { $exists, $get, $var } from "./meta/meta-lang";
import { isObject } from "util";
import { getRef } from "./compile";

export function jsCompilerInfo(stack=[], refs=[], compilerStack=[]) {
  const ci = compilerInfo(stack, refs, compilerStack);
  const compilerScope = {
    compileLiteral,
    compileDo,
    compileSym,
    compileExpr,
    compileCond,
    compileFn,
    compileExport,
    compileVar,
    compileSet,
    compileGetr,
    compileSetr,
    compileReturn,
    compileAND,
    compileOR,
  };
  Object.keys(compilerScope).forEach((name, i) => {
    const applyFn = compilerScope[name];
    const priority = 999 - i;
    compilerScope[name] = compiler(name, applyFn, priority);
  })
  ci.stack = [...ci.stack, compilerScope]
  return ci;
}

export function buildJs(jsCode: string, ci: ICompilerInfo, externalRefs = {}) {
  try {
    const refNames = ci.refs.map(ref => compileRef(ref, ci));
    const refValues = [...ci.refs];
    keys(externalRefs).forEach((name) => {
      refNames.push(name);
      refValues.push(externalRefs[name]);
    });
    refNames.unshift('_');
    refValues.unshift($get(ci.stack, "_"));
    const compiledJs = Function.apply(null, [...refNames, '"use strict"; return ' + jsCode.trim()]);
    return () => compiledJs.apply(null, refValues);
  } catch (err) {
    throw new Error(`Failed to build js code: \n${jsCode} \n${err.message}`);
  }
}

export function compileLiteral(expr: any, ci: ICompilerInfo) {
  if (isString(expr)) return `"${expr}"`;
  if (isList(expr)) {
    return `[${expr.map(i => $compile(i, ci))}]`;
  }
  if (isObject(expr)) {
    let r = `{${Object.keys(k => `"${k}":${$compile(expr[k], ci)}`)}}`
    r
    return r;
  }
  return String(expr);
}

export function declareVar(name: string, ci: ICompilerInfo) {
  //if(!ci.compilerStack.length) ci.compilerStack.push({});
  $var(ci.compilerStack, name);
  // if(ci.compilerStack.length) {
  //   $var(ci.compilerStack, name);
  // } else if(!$exists(ci.stack, name)) {
  //    $var(ci.stack, name);
  // }
}

export function compileRef(obj:any, ci: ICompilerInfo) {
  let iRef = ci.refs.indexOf(obj);
  if (iRef === -1) {
    iRef = ci.refs.length;
    ci.refs.push(obj);
  }
  return `__ref${iRef}`;
}

export function compileSym(ast: any, ci: ICompilerInfo) {
  if (!isSym(ast)) return;
  ast = untick(ast);
  // TODO Quote logic
  if (isSym(ast)) return `"${ast}"`;
  let name = ast;
  // special names
  if (['_', 'return'].includes(name)) return name;
  if ($exists(ci.compilerStack, name)) return name;
  for (let i = ci.stack.length - 1; i >= 0; i--) {
    const scope = ci.stack[i];
    if (scope[name] !== undefined) {
      const ref = compileRef(scope, ci);
      return `${ref}.${name}`
    }
  }
  throw new Error(`${name} is not defined`);
}

export function compileExpr(ast: any, ci: ICompilerInfo) {
  if (!isExpr(ast)) return;
  if (ast[1] === '`do') return compileDo(skip(ast, 2), ci);
  if (isExpr(untick(ast))) {
    return compileLiteral(untick(ast), ci);
  }
  const f = $compile(ast[1], ci);
  const args = skip(ast, 2).map(a => $compile(a, ci));
  return `${f}(${args.join()})`
}

export function compileDo(ast: any, ci: ICompilerInfo) {
  if (!isList(ast) || isExpr(ast)) return;
  let exprs:any = ast.map(i => $compile(i, ci));
  exprs = exprs.map(i => `_=${i};\n`).join('').trim();
  return `(function(_){
    ${exprs}
    return _;
  })(_)`
}

export function compileFn(ast: any, ci: ICompilerInfo) {
  if (!(isFn(ast) || isExprOf(ast, "fn"))) return;
  let stack = ci.stack;
  let fn: Fn;
  if (isList(ast)) {
    const args = skip(untick(ast), 1);
    let name;
    if (isString(args[0])) { name = untick(args.shift()); }
    const params = untick(args.shift()).map(untick);
    const body = args;
    fn = makeFn(name, params, undefined, body, stack);
  } else {
    fn = ast;
  }

  let code = "";
  code += `_=function(`;
  const fnScope = {};
  code += fn.params.map((p) => {
    fnScope[p.name] = null;
    return p.name;
  }).join();
  code += "){\n\tlet _=null;\n\treturn";
  ci.compilerStack.push(fnScope);
  code += compileDo(fn.body, ci);
  ci.compilerStack.pop();
  code += "\n}";
  if(fn.name) {
    if(ci.compilerStack.length) {
      declareVar(fn.name, ci);
      code += `;let ${fn.name}=_`
    } else {
      if (!$exists(ci.stack, fn.name)) $var(ci.stack, fn.name);
      code += `;${compileSym(tick(name), ci)}=_`
    }    
  }
  return code;
}

export function compileExport(ast: any, ci:ICompilerInfo) {
  if (!isExprOf(ast, "export")) return;
  (ast as any[]).splice(1,1);
  const name = untick(ast[2]);
  const code = `${$compile(ast, ci)};\nexports.${name}=_`;
  return code
}

export function compileCond(ast: any, ci: ICompilerInfo) {
  if (!isExprOf(ast, "cond")) return;
  const conds = skip(ast, 2);
  let code = "(function(_){\n";
  for (let cond of conds) {
    cond = untick(cond);
    code += `if(${$compile(cond[0], ci)}) return ${$compile(cond[1], ci)};\nelse `
  }
  code = code.substr(0, code.length - 5);
  code += "\nreturn _;"
  code += "})(_)"
  return code;
}

export function compileVar(ast: any, ci:ICompilerInfo) {
  if (!isExprOf(ast, "var")) return;
  const name = untick(ast[2]);
  if (!ci.compilerStack.length) { // top level variable
    if (!$exists(ci.stack, name)) $var(ci.stack, name);
    const r = compileSym(ast[2], ci)
    const code = `${r}=${$compile(ast[3], ci)}`
    return code
  }
  declareVar(name, ci);
  return `_;let ${name}=${$compile(ast[3], ci)};_=${name}`;  
}

export function compileSet(ast: any, ci:ICompilerInfo) {
  if (!isExprOf(ast, "set")) return;
  const name = compileSym(ast[2], ci);
  const code = `${name}=${$compile(ast[3], ci)}`;
  return code
}

export function compileGetr(ast: any, ci) {
  if (!isExprOf(ast, "getr")) return;
  ast = skip(ast,2)
  let code = $compile(ast.shift(), ci);
  ast.forEach(i => {
    if (isSym(i)) i = untick(i);
    i = $compile(i, ci);
    code += `[${i}]`
  })
  return code;
}

export function compileSetr(ast: any, ci) {
  if (!isExprOf(ast, "setr")) return;
  const value = $compile(ast.pop(), ci);
  ast = skip(ast,2)
  let code = $compile(ast.shift(), ci);
  ast.forEach(i => {
    if (isSym(i)) i = untick(i);
    i = $compile(i, ci);
    code += `[${i}]`
  })
  code += `=${value}`
  return code;
}

export function compileReturn(ast: any, ci) {
  if (!isExprOf(ast, "return")) return;
  if (ast.length === 2) {
    return `_;return null`;
  }
  return `_;return ${$compile(ast[2], ci)}`;
}

export function compileAND(ast: any, ci) {
  if (!isExprOf(ast, "AND")) return;
  let code = skip(ast, 2).map(i => $compile(i, ci)).join(' && ');
  return code;
}

export function compileOR(ast: any, ci) {
  if (!isExprOf(ast, "OR")) return;
  let code = skip(ast, 2).map(i => $compile(i, ci)).join(' || ');
  return code;
}