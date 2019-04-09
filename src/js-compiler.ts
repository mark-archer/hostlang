import { $compile, ICompilerInfo, compiler, compilerInfo } from "./meta/meta-compiler";
import { untick, isSym, unquote, isExpr, isList } from "./meta/meta-common";
import { skip, sym, isString, keys, last } from "./common";
import { Fn, makeFn, isFn } from "./typeInfo";
import { $exists } from "./meta/meta-lang";

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
  //const externalRefs = {};

  // // add everything from the stack
  // for (let i = 0; i < ci.stack.length; i++) {
  //   const ctx = ci.stack[i];
  //   Object.keys(ctx).forEach(name => externalRefs[name] = ctx[name]);    
  // }

  // // add everything from refs
  // ci.refs.forEach((ref) => externalRefs[compileRef(ref, ci)] = ref);
  // externalRefs
    
  try {
    const refNames = ci.refs.map(ref => compileRef(ref, ci));
    const refValues = [...ci.refs];
    keys(externalRefs).forEach((name) => {
      refNames.push(name);
      refValues.push(externalRefs[name]);
    });
    refNames.unshift('_');
    refValues.unshift(null);    
    const compiledJs = Function.apply(null, [...refNames, '"use strict"; return ' + jsCode.trim()]);
    return () => compiledJs.apply(null, refValues);
  } catch (err) {
    throw new Error(`Failed to build js code: \n${jsCode} \n${err.message}`);
  }
}

export function compileLiteral(expr: any, ci: ICompilerInfo) {
  if (isString(expr)) { return `"${expr}"`; }
  // TODO object
  // TODO Array
  return String(expr);
}

export function declareVar(name: string, ci: ICompilerInfo) {
  if(!ci.compilerStack.length) ci.compilerStack.push({});
  last(ci.compilerStack)[name] = null;
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
  if (name === '_') return name;
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
  if (!(isFn(ast) || (isExpr(ast) && ast[1] === sym('fn')))) return;
  let stack = ci.stack;
  let fn: Fn;
  if (isList(ast)) {
    const args = skip(ast, 2);
    let name;
    if (isSym(args[0])) { name = untick(args.shift()); }
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
    code += `;let ${fn.name}=_`
    declareVar(fn.name, ci);
  }
  return code;
}

export function compileExport(ast: any, ci:ICompilerInfo) {
  if (!(isExpr(ast) && ast[1] === sym("export"))) return;
  (ast as any[]).splice(1,1);
  const name = untick(ast[2]);
  const code = `${$compile(ast, ci)};\nexports.${name}=_`;
  return code
}

export function compileCond(ast: any, ci: ICompilerInfo) {
  if (!(isExpr(ast) && ast[1] === sym("cond"))) return;
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
  if (!(isExpr(ast) && ast[1] === sym("var"))) return;
  const name = untick(ast[2]);
  declareVar(name, ci);
  const code = `_;let ${name}=${$compile(ast[3], ci)};_=${name}`;
  return code
}

export function compileSet(ast: any, ci:ICompilerInfo) {
  if (!(isExpr(ast) && ast[1] === sym("set"))) return;
  const name = compileSym(ast[2], ci);
  const code = `${name}=${$compile(ast[3], ci)}`;
  return code
}