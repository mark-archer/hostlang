import { $compile, ICompilerInfo, compiler, compilerInfo } from "./meta/meta-compiler";
import { untick, isSym, unquote, isExpr, isList } from "./meta/meta-common";
import { skip, sym, isString } from "./common";
import { Fn, makeFn, isFn } from "./typeInfo";
import { js } from "./utils";

export function jsCompilerInfo(stack=[], refs=[], compilerStack=[]) {
  const ci = compilerInfo(stack, refs, compilerStack);
  const compilerScope = {
    compileLiteral,
    compileDo,
    compileSym,
    compileExpr,
    compileFn,
  };
  Object.keys(compilerScope).forEach((name, i) => {
    const applyFn = compilerScope[name];
    const priority = 999 - i;
    compilerScope[name] = compiler(name, applyFn, priority);
  })
  ci.stack = [...ci.stack, compilerScope]
  return ci;
}

export function buildJs(jsCode: string, ci: ICompilerInfo) {
  const externalRefs = {};
  console.log(ci.stack)
  // add everything from the stack
  for (let i = 0; i < ci.stack.length; i++) {
    const ctx = ci.stack[i];
    Object.keys(ctx).forEach(name => externalRefs[name] = ctx[name]);    
  }
  // add everything from refs
  ci.refs.forEach((ref,i) => externalRefs[`r${i}`] = ref);
  // TODO create a wrapper function that uses live stack instead of copy so changes are seen by compiled code
  //let wrapper = `function()`
  const f = js(jsCode, externalRefs)
  return f;
}

export function compileLiteral(expr: any, ci: ICompilerInfo) {
  if (isString(expr)) { return `"${expr}"`; }
  return String(expr);
}

export function compileSym(ast: any, ci: ICompilerInfo) {
  if (!isSym(ast)) return;
  ast = untick(ast);
  // TODO Quote logic
  if (isSym(ast)) return `"${ast}"`;
  // TODO check sym exists
  return ast;
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
  code += `function ${fn.name || ""}(`;
  //const fnScope = {};
  code += fn.params.map((p) => {
    //fnScope[p.name] = null;
    return p.name;
  }).join();
  //stack = [...stack, fnScope];
  //const fnCi = compilerInfo(stack, ci.refs, ci.compilerStack)
  code += "){\n\tlet _=null;\n\treturn";
  console.log(fn.body)
  code += compileDo(fn.body, ci);
  code += "\n}";
  return code;
}