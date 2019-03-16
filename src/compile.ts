import { isArray, isFunction, isObject, isString } from "util";
import { isExpr, isList, isSym, last, quote, skip, sym, tick, unquote, untick } from "./common";
import * as common from "./common";
import { getName } from "./host";
import { Fn, makeFn } from "./typeInfo";
import { js } from "./utils";

export function getRef(refs: any[], ctx: any) {
  let ref = refs.indexOf(ctx);
  if (ref === -1) {
    ref = refs.length;
    refs.push(ctx);
  }
  return `r${ref}`;
}

export function defineVar(stack: any[], sym: string) {
  const ctx = last(stack);
  sym = untick(sym);
  const exports = getName(stack, "exports");
  if (exports && exports[sym] !== undefined) { throw new Error(`var already exists as an export: ${sym}`); }
  if (ctx[sym] !== undefined) { throw new Error(`var already exists: ${sym}`); }
  ctx[sym] = null;
}

let commonLib = common;
export function compileSym(refs: any[], stack: any[], sym: string) {
  sym = untick(sym);
  // tick logic
  if (isSym(sym)) { return `"${sym}"`; }
  // quote logic
  if (sym[0] === `'`) {
    sym = unquote(sym);
    sym;
    const evalQuote = () => `${tick(getName(stack, sym))}`;
    return compileExpr(refs, stack, ["`", evalQuote]);
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
  if(!getName(stack, "dont_load_common") && commonLib && commonLib[sym]) {
    return getRef(refs, commonLib[sym])
  }
  throw new Error(`${sym} is not defined`);
}

export function compileVar(refs: any[], stack: any[], expr: any) {
  const varSym = expr[2];
  defineVar(stack, varSym);
  const varRef = compileSym(refs, stack, varSym);
  const valueExpr = expr.length === 4 ? expr[3] : null;
  const assignUnderscore = valueExpr !== "`_";
  const r = `let ${varRef}${assignUnderscore && "=_" || ""}=${compileExpr(refs, stack, valueExpr)}`;
  
  // above 2 lines should probably just below, lots of logic just to avoid name=_=_;
  // const r = `let ${varRef}=_=${compileExpr(refs, stack, valueExpr)}`;
  return r;
}

export function compileFn(refs: any[], stack: any[], expr: (any[] | Fn)) {
  let fn: Fn;
  if (isList(expr)) {
    // @ts-ignore
    const args = skip(expr, 2);
    let name;
    if (isSym(args[0])) { name = untick(args.shift()); }
    const params = untick(args.shift()).map(untick);
    const body = args;
    fn = makeFn(name, params, undefined, body, stack);
  } else {
    // @ts-ignore
    fn = expr;
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
  code += compileExprBlock(refs, stack, fn.body);
  code += "\n}";
  return code;
}

export function compileSet(refs: any[], stack: any[], expr: any): string {
  if (expr.length > 4) { throw new Error("set called with too many arguments: " + untick(expr).join()); }
  const varSym = expr[2];
  const varRef = compileSym(refs, stack, varSym);
  const valueExpr = expr[3];
  const r = `${varRef}=${compileExpr(refs, stack, valueExpr)}`;
  r;
  return r;
}

export function compileCond(refs: any[], stack: any[], expr: any[]) {
  expr.shift();
  expr.shift();
  let r = "";
  expr.forEach((ifthen, i) => {
    const _if = compileExpr(refs, stack, ifthen.shift());
    const _then = compileExprBlock(refs, stack, ifthen);
    r += `if (${_if}) _=${_then}`;
    if (i < expr.length - 1) {
      r += "\nelse ";
    }
  });
  return r;
}

export function compileExport(refs: any[], stack: any[], expr: any[]) {
  let exportCtx;
  for (let i = stack.length - 1; i >= 0; i--) {
    if (stack[i].exports !== undefined) {
      exportCtx = stack[i];      
      break;
    }
  }
  if (!exportCtx) { throw new Error(`no export object found: ${expr.map(untick).join(" ")}`); }
  
  const name = untick(expr[3]);
  if (exportCtx.exports[name] !== undefined || exportCtx[name] !== undefined) { throw new Error(`export already exists: ${name}`); }
  if (stack.find((scope) => scope[name] !== undefined)) { throw new Error(`export cannot be declared because something with that name already exists: ${name}`); }
  exportCtx.exports[name] = null;
  const op = untick(expr[2]);
  if (!["var", "fn"].includes(op)) { throw new Error("export called without `var or `fn"); }
  const exportRef = compileSym(refs, stack, sym(name));
  let code = "";
  if (op == "fn") {
    expr.splice(1, 1); // remove '`export`
    expr.splice(2, 1); // remove name
    code = compileExpr(refs, stack, expr);
  } else {
    code = compileExpr(refs, stack, expr[4]);
  }
  code = exportRef + "=" + code;
  return code;
}

export function compileTick(refs: any[], stack: any[], expr: any) {
  expr.shift();
  const astClosure = () => expr; // TODO this should probably be a copy
  return compileExpr(refs, stack, ["`", astClosure]);
}

export function compileQuote(refs: any[], stack: any[], expr: any) {
  expr.splice(0, 2);
  stack[0].tick = stack[0].tick  || tick; // add tick to env
  let pieces = expr.map((i) => {
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

function isMacroCall(stack: any[], expr: any) {
  // if(!isExpr(expr)) return false;
  const fnSym = expr[1];
  if (!isSym(fnSym)) { return false; }
  const fn = getName(stack, untick(fnSym));
  if (!fn && untick(fnSym)[0] === "$") { return true; }
  return fn && (fn.isMacro || (untick(fnSym)[0] === "$" && fn.isMacro !== false));
}

export function compileMacro(refs: any[], stack: any[], expr: any) {
  const env = stack[0];
  env.compileHost = env.compileHost || compileHost;
  expr.shift();
  const macroExpr = compileExpr(refs, stack, expr.shift());
  const macroArgs = expr.map((_expr) => compileExpr(refs, stack, _expr)).join();
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

export function compileGetr(refs: any[], stack: any[], expr: any) {
  expr.shift();
  expr.shift();
  let code = compileExpr(refs, stack, expr.shift());
  while (expr.length) {
    const prop = compileExpr(refs, stack, untick(expr.shift()));
    code += `[${prop}]`;
  }
  return code;
}

export function compileSetr(refs: any[], stack: any[], expr: any) {
  expr.shift();
  expr.shift();
  const ref = compileExpr(refs, stack, expr.shift());
  let code = ref;
  while (expr.length > 1) {
    const prop = compileExpr(refs, stack, untick(expr.shift()));
    code += `[${prop}]`;
  }
  const value = compileExpr(refs, stack, untick(expr.shift()));
  code += `=${value}`;
  return code;
}

export function compileImport(refs: any[], stack: any[], expr: any[]) {
  // @ts-ignore
  if (!expr.isAwait) {
    expr.splice(1, 0, "`await");
    return compileExpr(refs, stack, expr);
  }

  let names;
  if (expr.length == 4) { names = untick(expr.pop()); }
  if (expr.length == 2) { expr = expr[1]; }
  expr.splice(1, 1);
  let code = compileSym(refs, stack, "import");
  const arg = compileExpr(refs, stack, expr[1]);
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

export function compileReturn(refs: any[], stack: any[], expr: any[]) {
  let valueExpr = expr[2];
  if (valueExpr === undefined) valueExpr = '`_';
  let valueCode = compileExpr(refs, stack, valueExpr);
  return `${valueCode};return _`
}

export function compileThrow(refs: any[], stack: any[], expr: any[]) {
  let valueExpr = expr[2];
  if (valueExpr === undefined) valueExpr = '`_';
  let valueCode = compileExpr(refs, stack, valueExpr);
  return `${valueCode};throw _`
}

export function compileAwait(refs: any[], stack: any[], expr: any[]) {
  expr.splice(1, 1);
  if (expr.length == 2) { expr = expr[1]; }
  if (isArray(expr)) {
    // @ts-ignore
    expr.isAwait = true;
  }

  const code = `await ${compileExpr(refs, stack, expr)}`;
  last(stack)["%isAwait"] = true;
  return code;
}

export function compileExpr(refs: any[], stack: any[], expr: any): string {
  if (!isExpr(expr)) {
    if (isSym(expr)) { return compileSym(refs, stack, expr); }
    if (isList(expr) || isObject(expr) || isFunction(expr)) { return getRef(refs, expr); }
    // if(isList(expr)) return '[' + expr.map(t => compileExpr(refs, stack, t)).join() + ']';
    // if(isObject(expr)) return '{' + Object.keys(expr).map(k => `"${k}":${compileExpr(refs, stack, expr[k])}`) + '}'
    // if(isFunction(expr)) return getRef(refs, expr);
    if (isString(expr)) { return `"${expr}"`; }
    return String(expr);
  }

  const compilers = stack[0].compilers;
  const cname = untick(expr[1]);
  if (compilers && compilers[cname]) { return compilers[cname](refs, stack, expr); }
  if (expr[1] === sym("var")) { throw new Error("var can only be used in a block"); }
  if (expr[1] === sym("cond")) { throw new Error("cond can only be used in a block"); }
  if (isMacroCall(stack, expr)) { return compileMacro(refs, stack, expr); }

  expr.shift();
  const fnName = compileExpr(refs, stack, expr.shift());
  const args = expr.map((i) => compileExpr(refs, stack, i)).join();
  const code = `${fnName}(${args})`;
  return code;
}

export function compileExprBlock(refs: any[], stack: any[], expr: any) {
  expr = untick(expr);
  if (expr[0] === "`do") { expr.shift(); }
  let code = `(function(_){`;
  stack = [...stack, {}];
  code += "";
  expr.forEach((i) => {
    let exprCode;
    if (i && i[1] === sym("var")) { exprCode = compileVar(refs, stack, i); } else if (i && i[1] === sym("fn") && isSym(i[2])) {
      const fnName = i[2];
      exprCode = "_=" + compileExpr(refs, stack, i);
      exprCode += ";" + compileVar(refs, stack, ["`", "`var", fnName, "`_"]);
    } else if (i && i[1] === sym("cond")) { exprCode = compileCond(refs, stack, i); } else {
      exprCode = "_=" + compileExpr(refs, stack, i);
    }
    exprCode = `\n\t${exprCode};`;
    code += exprCode;
    return exprCode;
  });
  code += "\n\treturn _;\n})(_);";
  if (last(stack)["%isAwait"]) {
    code = "(async " + code.substr(1);
  }
  return code;
}

function loadCommon(stack: any[]) {
  const defaultCompilers = {
    "getr": compileGetr,
    "setr": compileSetr,
    "do": compileExprBlock,
    "fn": compileFn,
    "set": compileSet,
    "export": compileExport,
    "`": compileTick,
    "'": compileQuote,
    "await": compileAwait,
    "import": compileImport,
    "return": compileReturn,
    "throw": compileThrow
  };
  const env = stack[0];
  if (!env.compilers) { env.compilers = {}; }
  Object.keys(defaultCompilers).forEach((key) => {
    env.compilers[key] = env.compilers[key] || defaultCompilers[key];
  });
}

export function compileHost(env: any, ast: any[], refs: any[]= []) {
  const stack: any[] = isList(env) ? [...env] : [env];
  if (isList(env)) { env = env[0] || {}; }
  stack[0] = env;
  env.env = env;
  loadCommon(stack);
  const innerCode = compileExprBlock(refs, stack, ast);
  let code = "function(_,env,";
  code += refs.map((v, i) => `r${i}`).join();
  code += `){\n\treturn ${innerCode}\n}`;
  const f = js(code);
  const _ = getName(stack, "_");
  const exec = () => f.apply(null, [ _, env, ...refs]);
  return { code, f, exec, env, ast };
}

export async function compileModule(env: any, ast: any[], refs: any[]= []) {
  let $import = env.import || getName(env, "import");
  if ($import) commonLib = await $import("common"); // load commonLib if we have an import
  if (isList(env)) { env = [...env]; } else { env = [env]; }
  if (env[0]) { env[0] = {...env[0]}; } else { env.push({}); }
  const $exports: any = env[0].exports || {};
  env[0].exports = $exports;  
  const r = compileHost(env, ast, refs);
  await r.exec(); // code has to be run to generate module
  return $exports;
}
