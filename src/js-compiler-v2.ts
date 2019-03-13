import { isArray, isFunction, isObject, isString } from "util";
import { isList, last, quote, skip, sym, tick, unquote, untick } from "./common";
import * as common from "./common";
import { Fn, makeFn, isFn } from "./typeInfo";
import { js } from "./utils";
import { compiler, $compile } from "./meta/meta-compiler-v2";
import { nameLookup, isSym, isExpr } from "./meta/meta-common";

export async function compileJs(stack:any[], ast:any, refs: any[] = []) {

  const jsCtx = {
    compileDo, 
    compileExpr,
    compileThrow, compileAwait, 
    compileQuote, compileMacro, compileGetr, compileSetr, compileImport, compileReturn,
    compileFn, compileSet, compileCond, compileExport, compileTick,
    compileSym, compileVar,
  }

  const compilerNames = Object.keys(jsCtx);
  Object.values(jsCtx).map((p, i) => jsCtx[compilerNames[i]] = compiler(compilerNames[i], p, 900 - i))
  // @ts-ignore
  jsCtx.exclude_default_compilers = false; // we want default compilers so we can add more compilers at compiletime
  stack = [...stack, jsCtx]
  
  const env = stack[0];
  let innerCode = "";
  if (!isList(ast)) ast = [ast];
  for (const _ast of ast) {
    innerCode += await $compile(stack, ast, refs) 
    innerCode += "\n";
  }
  let code = "function(_,env,";
  code += refs.map((v, i) => `r${i}`).join();
  code += `){\n\treturn ${innerCode}\n}`;
  const f = js(code);
  let _ = nameLookup(stack, "_");
  if (_ === undefined) _ = null;
  const exec = () => f.apply(null, [ _, env, ...refs]);
  return { code, f, exec, env, ast };
}

export async function compileJsModule(stack: any[], ast: any[], refs: any[]= []) {
  let $import = nameLookup(stack, "import");
  if ($import) commonLib = await $import("common"); // load commonLib if we have an import
  if (!stack[0]) { stack.push({}); }
  const $exports: any = stack[0].exports || {};
  stack[0].exports = $exports;  
  const r = await compileJs(stack, ast, refs);
  console.log(r.code)
  await r.exec(); // code has to be run to generate module
  return $exports;
}

export async function getRef(refs: any[], ctx: any) {
  let ref = refs.indexOf(ctx);
  if (ref === -1) {
    ref = refs.length;
    refs.push(ctx);
  }
  return `r${ref}`;
}

export async function defineVar(stack: any[], sym: string) {
  const ctx = last(stack);
  sym = untick(sym);
  const exports = nameLookup(stack, "exports");
  if (exports && exports[sym] !== undefined) { throw new Error(`var already exists as an export: ${sym}`); }
  if (ctx[sym] !== undefined) { throw new Error(`var already exists: ${sym}`); }
  ctx[sym] = null;
}

let commonLib = common;
export async function compileSym(refs: any[], stack: any[], sym: string) {
  if (!isSym(sym)) return;
  sym = untick(sym);
  // tick logic
  if (isSym(sym)) { return `"${sym}"`; }
  // quote logic
  if (sym[0] === `'`) {
    sym = unquote(sym);
    sym;
    const evalQuote = () => `${tick(nameLookup(stack, sym))}`;
    return $compile(stack, ["`", evalQuote], refs);
  }
  if (sym == "_") { return sym; }
  for (let i = stack.length - 1; i >= 0; i--) {
    if (stack[i].exports && stack[i].exports[sym] !== undefined) {
      const code = `env.exports["${sym}"]`;
      return code;
    }
    if (stack[i][sym] !== undefined) {
      if (i == 0) { return `env["${sym}"]`; }
      return sym;
    }
  }
  if(!nameLookup(stack, "dont_load_common") && commonLib && commonLib[sym]) {
    return getRef(refs, commonLib[sym])
  }
  throw new Error(`${sym} is not defined`);
}

export async function compileVar(refs: any[], stack: any[], ast: any) {
  if (!isExpr(ast) || ast[1] !== sym('var')) return;
  const varSym = ast[2];
  defineVar(stack, varSym);
  const varRef = compileSym(refs, stack, varSym);
  const valueExpr = ast.length === 4 ? ast[3] : null;
  const assignUnderscore = valueExpr !== "`_";
  const valueCompiled = await $compile(stack, valueExpr, refs);
  const r = `let ${varRef}${assignUnderscore && "=_" || ""}=${valueCompiled}`;
  return r;
}

export async function compileFn(refs: any[], stack: any[], ast: any) {
  if (!isFn(ast) && (!isExpr(ast) || ast[1] !== sym('fn'))) return;
  let fn: Fn;
  if (isList(ast)) {
    // @ts-ignore
    const args = skip(ast, 2);
    let name;
    if (isSym(args[0])) { name = untick(args.shift()); }
    const params = untick(args.shift()).map(untick);
    const body = args;
    fn = makeFn(name, params, undefined, body, stack);
  } else {
    // @ts-ignore
    fn = ast;
  }

  let code = "";
  code += `function ${fn.name || ""}(`;
  const fnScope = {};
  code += fn.params.map((p) => {
    fnScope[p.name] = null;
    return p.name;
  }).join();
  stack = [...stack, fnScope];
  code += "){\n\tlet _=null;\n\treturn";
  const astBody = ['`', '`do', ...fn.body]
  code += await $compile(stack, astBody, refs);
  code += "\n}";
  return code;
}

export async function compileSet(refs: any[], stack: any[], ast: any): Promise<string> {
  if (!isExpr(ast) || ast[1] !== '`set') return;
  if (ast.length > 4) { throw new Error("set called with too many arguments: " + untick(ast).join()); }
  const varSym = ast[2];
  const varRef = compileSym(refs, stack, varSym);
  const valueAst = ast[3];
  const value = await $compile(stack, valueAst, refs);
  const r = `${varRef}=${value}`;
  r;
  return r;
}

export async function compileCond(refs: any[], stack: any[], ast: any[]) {
  if (!isExpr(ast) || ast[1] !== '`cond') return;
  ast.shift();
  ast.shift();
  let r = "";
  for (let i = 0; i < ast.length; i++) {
    const ifthen = ast[i];
    const _if = compileExpr(refs, stack, ifthen.shift());
    const _then = compileDo(refs, stack, ifthen);
    r += `if (${_if}) _=${_then}`;
    if (i < ast.length - 1) {
      r += "\nelse ";
    }    
  }
  // ast.forEach((ifthen, i) => {
  //   const _if = compileExpr(refs, stack, ifthen.shift());
  //   const _then = compileDo(refs, stack, ifthen);
  //   r += `if (${_if}) _=${_then}`;
  //   if (i < ast.length - 1) {
  //     r += "\nelse ";
  //   }
  // });
  return r;
}

export async function compileExport(refs: any[], stack: any[], ast: any[]) {
  if (!isExpr(ast) || ast[1] !== '`export') return;
  let exportCtx;
  for (let i = stack.length - 1; i >= 0; i--) {
    if (stack[i].exports !== undefined) {
      exportCtx = stack[i];      
      break;
    }
  }
  if (!exportCtx) { throw new Error(`no export object found: ${ast.map(untick).join(" ")}`); }
  
  const name = untick(ast[3]);
  if (exportCtx.exports[name] !== undefined || exportCtx[name] !== undefined) { throw new Error(`export already exists: ${name}`); }
  if (stack.find((scope) => scope[name] !== undefined)) { throw new Error(`export cannot be declared because something with that name already exists: ${name}`); }
  exportCtx.exports[name] = null;
  const op = untick(ast[2]);
  if (!["var", "fn"].includes(op)) { throw new Error("export called without `var or `fn"); }
  const exportRef = compileSym(refs, stack, sym(name));
  let code = "";
  if (op == "fn") {
    ast.splice(1, 1); // remove '`export`
    ast.splice(2, 1); // remove name
    code = compileExpr(refs, stack, ast);
  } else {
    code = compileExpr(refs, stack, ast[4]);
  }
  code = exportRef + "=" + code;
  return code;
}

export async function compileTick(refs: any[], stack: any[], ast: any) {
  if (!isExpr(ast) || ast[1] !== '`') return;
  ast.shift();
  const astClosure = () => ast; // TODO this should probably be a copy
  return compileExpr(refs, stack, ["`", astClosure]);
}

export async function compileQuote(refs: any[], stack: any[], ast: any) {
  if (!isExpr(ast) || ast[1] !== "'") return;
  ast.splice(0, 2);
  stack[0].tick = stack[0].tick  || tick; // add tick to env
  let pieces = ast.map((i) => {
    if (i && i[0] === "`" && i[1] === "`") {
      return compileExpr(refs, stack, i);
    }
    if (isExpr(i) && i[1] !== "`") {
      i = quote(i);
      i = compileExpr(refs, stack, i);
    } else {
      i = compileExpr(refs, stack, i);
      i = `env.tick(${i})`;
    }
    return i;
  });
  pieces;
  pieces = pieces.join(",\n");
  pieces;
  const code = `
    (function() {
      return ['\`', ${pieces}]
    })()
  `;
  return code.trim();
}

function isMacroCall(stack: any[], ast: any) {
  // if(!isExpr(expr)) return false;
  const fnSym = ast[1];
  if (!isSym(fnSym)) { return false; }
  const fn = nameLookup(stack, untick(fnSym));
  if (!fn && untick(fnSym)[0] === "$") { return true; }
  return fn && (fn.isMacro || (untick(fnSym)[0] === "$" && fn.isMacro !== false));
}

export async function compileMacro(refs: any[], stack: any[], ast: any) {
  if (!isMacroCall(stack, ast)) return;
  const env = stack[0];
  env.compileHost = env.compileHost || compileJs;
  ast.shift();
  const macroExpr = compileExpr(refs, stack, ast.shift());
  const macroArgs = ast.map((_expr) => compileExpr(refs, stack, _expr)).join();
  const compileArgs = { refs, stack: [...stack] };
  const compileArgsRef = getRef(refs, compileArgs);
  const code = `
    (function(){
      const ast = ${macroExpr}(${macroArgs});
      const exe = env.compileHost(${compileArgsRef}.stack, [ast], ${compileArgsRef}.refs)
      return exe.exec()
    })()`;
  code;
  return code.trim();
}

export async function compileGetr(refs: any[], stack: any[], ast: any) {
  if (!isExpr(ast) || ast[1] !== '`getr') return;
  ast.shift();
  ast.shift();
  let code = compileExpr(refs, stack, ast.shift());
  while (ast.length) {
    const prop = compileExpr(refs, stack, untick(ast.shift()));
    code += `[${prop}]`;
  }
  return code;
}

export async function compileSetr(refs: any[], stack: any[], ast: any) {
  if (!isExpr(ast) || ast[1] !== '`setr') return;
  ast.shift();
  ast.shift();
  const ref = compileExpr(refs, stack, ast.shift());
  let code = ref;
  while (ast.length > 1) {
    const prop = compileExpr(refs, stack, untick(ast.shift()));
    code += `[${prop}]`;
  }
  const value = compileExpr(refs, stack, untick(ast.shift()));
  code += `=${value}`;
  return code;
}

export async function compileImport(refs: any[], stack: any[], ast: any[]) {
  if (!isExpr(ast) || ast[1] !== '`import') return;
  // @ts-ignore
  if (!ast.isAwait) {
    ast.splice(1, 0, "`await");
    return compileExpr(refs, stack, ast);
  }

  let names;
  if (ast.length == 4) { names = untick(ast.pop()); }
  if (ast.length == 2) { ast = ast[1]; }
  ast.splice(1, 1);
  let code = compileSym(refs, stack, "import");
  const arg = compileExpr(refs, stack, ast[1]);
  code = `${code}(${arg})`;
  if (names && names.length) {
    names = untick(names);
    if (!isArray(names)) { names = [names]; }
    code += ";let{";
    names.forEach((name) => {
      defineVar(stack, name);
      code += untick(name) + ",";
    });
    code += "}=_";
  }
  return code;
}

export async function compileReturn(refs: any[], stack: any[], ast: any[]) {
  if (!isExpr(ast) || ast[1] !== '`return') return;
  let valueExpr = ast[2];
  if (valueExpr === undefined) valueExpr = '`_';
  let valueCode = compileExpr(refs, stack, valueExpr);
  return `${valueCode};return _`
}

export async function compileThrow(refs: any[], stack: any[], ast: any[]) {
  if (!isExpr(ast) || ast[1] !== '`throw') return;
  let valueExpr = ast[2];
  if (valueExpr === undefined) valueExpr = '`_';
  let valueCode = compileExpr(refs, stack, valueExpr);
  return `${valueCode};throw _`
}

export async function compileAwait(refs: any[], stack: any[], ast: any[]) {
  if (!isExpr(ast) || ast[1] !== '`await') return;
  ast.splice(1, 1);
  if (ast.length == 2) { ast = ast[1]; }
  if (isArray(ast)) {
    // @ts-ignore
    ast.isAwait = true;
  }

  const code = `await ${compileExpr(refs, stack, ast)}`;
  last(stack)["%isAwait"] = true;
  return code;
}

export async function compileLiteral(refs: any[], stack: any[], ast: any) {
  if (isList(ast) || isObject(ast) || isFunction(ast)) { 
    return getRef(refs, ast); 
  }
  if (isString(ast)) { 
    return `"${ast}"`; 
  }
  return String(ast);
}

export async function compileExpr(refs: any[], stack: any[], ast: any) {
  if (!isExpr(ast)) return;
  // if (!isExpr(ast)) {
  //   if (isSym(ast)) { return compileSym(refs, stack, ast); }
  //   if (isList(ast) || isObject(ast) || isFunction(ast)) { return getRef(refs, ast); }
  //   if (isString(ast)) { return `"${ast}"`; }
  //   return String(ast);
  // }

  //const compilers = stack[0].compilers;
  //const cname = untick(ast[1]);
  //if (compilers && compilers[cname]) { return compilers[cname](refs, stack, ast); }
  //if (ast[1] === sym("var")) { throw new Error("var can only be used in a block"); }
  //if (ast[1] === sym("cond")) { throw new Error("cond can only be used in a block"); }
  //if (isMacroCall(stack, ast)) { return compileMacro(refs, stack, ast); }

  const fnName = $compile(stack, ast[1], refs);
  const args = skip(ast,2).map((i) => $compile(stack, i, refs)).join();
  const code = `${fnName}(${args})`;
  return code;
}

export async function compileDo(refs: any[], stack: any[], ast: any) {
  if(!isList(ast)) return;
  //if (!isExpr(ast) || ast[1] !== '`do') return;
  ast = untick(ast);
  if (ast[0] === "`do") { ast.shift(); }
  //ast = skip(ast, 2);
  let code = `(function(_){`;
  stack = [...stack, {}];
  for (const innerAst of ast) {
    code += await $compile(stack, innerAst, refs);
    code += ';\n';
  }
  // expr.forEach((i) => {
  //   let exprCode;
  //   if (i && i[1] === sym("var")) { exprCode = compileVar(refs, stack, i); } else if (i && i[1] === sym("fn") && isSym(i[2])) {
  //     const fnName = i[2];
  //     exprCode = "_=" + compileExpr(refs, stack, i);
  //     exprCode += ";" + compileVar(refs, stack, ["`", "`var", fnName, "`_"]);
  //   } else if (i && i[1] === sym("cond")) { exprCode = compileCond(refs, stack, i); } else {
  //     exprCode = "_=" + compileExpr(refs, stack, i);
  //   }
  //   exprCode = `\n\t${exprCode};`;
  //   code += exprCode;
  //   return exprCode;
  // });  
  code += "\n\treturn _;\n})(_);";
  if (last(stack)["%isAwait"]) {
    code = "(async " + code.substr(1);
  }
  return code;
}
