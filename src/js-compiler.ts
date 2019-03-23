import { $compile, ICompilerInfo, compiler, compilerInfo } from "./meta/meta-compiler";
import { untick, isSym, unquote, isExpr, isList } from "./meta/meta-common";
import { skip } from "./common";

export function jsCompilerInfo(stack=[], refs=[], compilerStack=[]) {
  const ci = compilerInfo(stack, refs, compilerStack);
  const compilerScope = {
    compileDo,
    compileSym,
    compileExpr,
  };
  Object.keys(compilerScope).forEach((name, i) => {
    const applyFn = compilerScope[name];
    const priority = 999 - i;
    compilerScope[name] = compiler(name, applyFn, priority);
  })
  ci.stack = [...ci.stack, compilerScope]
  return ci;
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