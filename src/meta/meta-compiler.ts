import { flatten, sortBy, range, clone, isError } from 'lodash'
import { js } from "../utils";
import { isExpr, sym, untick, isList } from './meta-common';
import { $eval, $apply } from './eval-apply';

export function isCompiler(x:any) : boolean {
  return x && x.ICompiler === true;
}

type CompilerApplyFn = (stack: any[], ci: ICompileInfo) => (boolean|Promise<boolean>)

export interface ICompiler {
  ICompiler: true
  name: string
  priority: number
  apply: CompilerApplyFn
}

export function compiler(name:string, apply: CompilerApplyFn, priority: number = 1000): ICompiler {
  const compiler: ICompiler = {
    ICompiler: true,
    name,
    priority,
    apply
  }  
  return compiler
}

const compilerCompiler: ICompiler = {
  ICompiler: true,
  name: "compilerCompiler",
  priority: 1000,
  apply: async (stack: any[], ci: ICompileInfo) => {
    const ast = ci.peek();
    if (!(isExpr(ast) && ast[1] === sym("compiler"))) return;
    ci.pop();
    const name = await $eval(stack, untick(ast[2]));
    const apply = await $eval(stack, ast[3]);
    let priority = await $eval(stack, ast[4]);
    const _compiler = compiler(name,  apply, priority);
    stack[stack.length-1][name] = _compiler;
    ci.compilers = getCompilers(stack);
    return true;
  }
}

export interface ICompileInfo {
  compilers: ICompiler[];
  stack: any[];
  ast: any;
  code: string;
  i: number;
  tabSize: number;
  indent: number;
  push: (code: string, indent?: number) => any;
  peek: () => any;
  pop: () => any;
  //getCurrentLineNum: () => number;
  //getCurrentColNum: () => number;
}

export function compileInfo(stack: any[], ast: any, options: any = {}): ICompileInfo {
  const ci = {
    compilers: getCompilers(stack),
    stack: [...stack],
    ast,
    i: 0,
    codeLeft: "", 
    codeRight: "",
    get code() { return ci.codeLeft + ci.codeRight },
    tabSize: options.tabSize || 4,
    indent: options.indent || 0,
    push: (code: string, indent: number = 0) => {
      let indentTot = ci.indent + indent;
      if (indentTot < 0) indentTot = 0;
      let indentStr = range(ci.tabSize).map(() => ' ').join(''); 
      indentStr = range(indentTot).map(() => indentStr).join('');
      code = code.split('\n').map(l => indentStr + l).join('\n');
      ci.codeLeft += code;
    },
    peek: () => clone(ci.ast[ci.i]),
    pop: () => (ci.i++, clone(ci.ast[ci.i-1]))
  };
  return ci;
}

export function getCompilers(stack:any[]) {
  // get compilers
  let compilers: ICompiler[] = flatten(stack.map(ctx => Object.values(ctx).filter(isCompiler) as ICompiler[]));
  compilers.push(compilerCompiler);
  compilers = sortBy(compilers, c => c.priority);  
  return compilers;
}

export function compileError(ci: ICompileInfo, err) {
  //let lineNum = pi.getCurrentLineNum();
  //let colNum = pi.getCurrentColNum();
  //let line = pi.getLine(lineNum);
  // if (line.trim()) {
  //   lineNum = pi.clist && pi.clist._sourceLine || lineNum;
  //   colNum = pi.clist && pi.clist._sourceColumn || colNum;
  //   line = pi.getLine(lineNum);
  // }
  //if (line && line.trim()) { line = "\n" + line; }
  //return new Error(`parse error at line ${lineNum}, col ${colNum}:${line}${"\n" + err}`);  
  if (isError(err)) return err;
  return new Error(String(err))
}

// ast -> machine code
export async function $compile(stack:any[], ast:any, options: any = {}) {
  // NOTE: keep an eye on this logic, meant to simplify things but might cause confusion
  if (isExpr(ast) || !isList(ast)) ast = [ast];
  const ci = compileInfo(stack, ast, options);
  
  try {
    while (ci.i <= (ci.ast.length + 1000)) {
      // keep calling compilers until one returns true
      let matched = false;
      for(let compiler of ci.compilers) {
        matched = await $apply(stack, compiler, [stack, ci]);
        if (matched) break;
      }
      if (matched) continue;
      // if no compilers are continuing, break out of loop
      // NOTE: this is designed to continue even if we're at end of the ast in case 
      //       there are parsers specifically added to modify the ast after parsing is finished
      break;
    }
  } catch (err) {
    throw compileError(ci, err);
  } 

  // if we reached the `i limit throw an error
  if (ci.i >= (ci.ast.length + 1000)) {
    throw compileError(ci, 'reached max loop limit - check for a compiler always returning true')
  }

  // if we're not at the end of AST so throw an error
  if (ci.i < ci.ast.length) {
    throw compileError(ci, "no compilers are proceeding");
  }

  return ci;
}

// interface IApp {
//   code: string
//   refs: any[]
//   apply: (refs:any[]) => any
//   run: () => any
// }

// machine code -> f
// export async function $build(code): Promise<IApp> {
//   const apply: ((args:any[]) => any) = js(code);
//   const refs = [] // [ _, env, ...refs]
//   const run = () => apply.apply(null, refs);
//   return { code, refs, apply, run };
// }