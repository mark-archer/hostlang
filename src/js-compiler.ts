import { compiler, $compile, ICompiler, CompilerApplyFn, ICompileInfo, compileError } from "./meta/meta-compiler";
import { js } from "./utils";
import { expr, isExpr, sym, nameLookup, isSym, untick } from "./meta/meta-common";
import { skip, last, isNumber, isList, isObject } from "./common";
import { isString } from "util";

export async function compileJs(stack: any[], ast: any, options?: any) {

  const jsCtx = {
    compileExpr, compileDo, compileSym, compileVar, compileLiteral    
  }  
  const compilerNames = Object.keys(jsCtx);
  //@ts-ignore
  Object.values(jsCtx).map((c, i) => jsCtx[compilerNames[i]] = compiler(compilerNames[i], c, 900 - i))
  stack = [jsCtx, ...stack] 
  ast = expr('do', ast);
  const ci = await $compile(stack, ast, options)

  const code = `function(_, ){\n${ci.code}\nreturn _;\n}`
  const apply: ((args:any[]) => any) = js(code);
  const refs = [ nameLookup(stack, '_'), ...ci.refs]
  if (refs[0] === undefined) refs[0] = null;
  console.log(code)
  const run = () => apply.apply(null, refs);
  return { code, refs, apply, run };
}


async function compileExpr(ci: ICompileInfo) {
  const ast = ci.peek();
  if (!(isExpr(ast))){ return; }
  let parts = await Promise.all(skip(ast).map(i => $compile(ci.stack, i, ci)));
  ci.push('return _;\n})(_)')
  return true;
}

async function compileDo(ci: ICompileInfo) {
  const ast = ci.peek();
  if (!(isExpr(ast) && ast[1] === sym('do'))){ return; }
  ci.pop();
  ci.push('_=(function(_){')
  const statements = skip(ast, 2);
  ci.stack.push({}) // do scope
  for (const _ast of statements) {
    //ci.indent++;
    _ast
    const _ci = await $compile(ci.stack, _ast, ci);
    //ci.indent--;
    ci.push('\n_=' + _ci.code + ';');
  }
  ci.stack.pop()
  ci.push('return _;\n})(_)')
  return true;
}

async function compileVar(ci: ICompileInfo) {
  let varExpr = ci.peek();
  if (!isExpr(varExpr) || varExpr[1] !== sym('var')){ return; }
  
  const name = untick(varExpr[2]);
  const value = (await $compile(ci.stack, varExpr[3], ci)).code
  last(ci.compileStack)[name] = null;
  console.log(ci.compileStack)
  ci.push(`_; var ${name}=${value}; _=${name}`)
  return true;
}

async function compileSym(ci: ICompileInfo) {
  let _sym = ci.peek();
  if (!isSym(_sym)){ return; }
  _sym = untick(_sym);
  if (isSym(_sym)) {
    // its still ticked so leave it as a sym
    ci.push(`"${_sym}"`)
  } else {    
    console.log(ci.compileStack)
    // its a reference so make sure it's defined
    if (nameLookup(ci.compileStack, _sym) === undefined) {
      // it's not defined, throw an error
      throw compileError(ci, `${_sym} is not defined`)
    }
    ci.push(`${_sym}`)
  }
  ci.pop();
  return true;
}

async function compileLiteral(ci: ICompileInfo) {
  const ast = ci.peek();  
  if (isExpr(ast) || isSym(ast) || ast === undefined){ return; }

  console.log(ast);
  if (isNumber(ast)) {
    ci.push(ast.toString())
    ci.pop();
    return true;
  } 
  else if (isString(ast)) {
    ci.push(`"${ast}"`)
    ci.pop();
    return true;
  }
  else if (isList(ast)){
    ci.push('[')
    const items: any[] = await Promise.all(ast.map(i => $compile(ci.stack, i, ci)));
    ci.push(items.map(i => i.code).join())    
    ci.push(']')
    ci.pop();
    return true;
  }
  else if (isObject(ast)) {
    ci.push("{")
    for(let key in ast) {
      ci.push(`"key": `);
      const value = await $compile(ci.stack, ast[key], ci);
      ci.push(value.code);
    }
    ci.push("}")    
    ci.pop();
    return true;
  }  
}

//function(stack, _, ){ function(){} return _; }