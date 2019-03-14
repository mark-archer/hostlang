import { flatten, sortBy, range, clone, isError } from 'lodash'
import { isExpr, sym, untick, isList } from './meta-common';
import { $eval, $apply } from './meta-lang';
import { js } from '../utils';

export function isCompiler(x:any) : boolean {
  return x && x.ICompiler === true;
}

export type CompilerApplyFn = (ci: ICompileInfo) => boolean

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
  apply: (ci: ICompileInfo) => {
    const stack = ci.stack;
    const ast = ci.peek();
    if (!(isExpr(ast) && ast[1] === sym("compiler"))) return;
    ci.pop();
    const name = $eval(stack, untick(ast[2]));
    const apply = $eval(stack, ast[3]);
    let priority = $eval(stack, ast[4]);
    const _compiler = compiler(name,  apply, priority);
    stack[stack.length-1][name] = _compiler;
    ci.compilers = getCompilers(stack);
    return true;
  }
}

export interface ICompileInfo {
  compilers: ICompiler[];
  stack: any[];
  refs: any[];
  refNames: any[];
  compileStack: any[];
  ast: any;
  codeLeft: string;
  codeRight: string;
  code: string;
  i: number;
  tabSize: number;
  indent: number;
  push: (code: string, indent?: number) => any;
  pushRight: (code: string, indent?: number) => any;
  peek: () => any;
  pop: () => any;
  //getCurrentLineNum: () => number;
  //getCurrentColNum: () => number;
}

export function compileInfo(stack: any[], ast: any, options: any = {}): ICompileInfo {
  const ci = {
    stack,
    compilers: getCompilers(stack),
    refs: options.refs || [],
    refNames: options.refNames || [],
    compileStack: options.compileStack || [{}],
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
    pushRight: (code: string, indent: number = 0) => {
      let indentTot = ci.indent + indent;
      if (indentTot < 0) indentTot = 0;
      let indentStr = range(ci.tabSize).map(() => ' ').join(''); 
      indentStr = range(indentTot).map(() => indentStr).join('');
      code = code.split('\n').map(l => indentStr + l).join('\n');
      ci.codeRight = code + ci.codeRight;
    },
    peek: () => clone(ci.ast[ci.i]),
    pop: () => (ci.i++, clone(ci.ast[ci.i-1])),
    getRef: (item, name?: string) => {
      if (!ci.refs.includes(item)) {
        ci.refs.push(item);
        ci.refNames.push(name);
      }
      const i = ci.refs.indexOf(item);
      return ci.refNames[i] || `r${i}`;
    }
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

// ast -> targetCode
export function $compile(stack:any[], ast:any, options: any = {}) {
  // NOTE: keep an eye on this logic, meant to simplify things but might cause confusion
  if (isExpr(ast) || !isList(ast)) ast = [ast];
  const ci = compileInfo(stack, ast, options);
  
  try {
    while (ci.i <= (ci.ast.length + 1000)) {
      // keep calling compilers until one returns true
      let matched = false;
      for(let compiler of ci.compilers) {
        matched = $apply(stack, compiler, [ci]);
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
    throw compileError(ci, `no compilers are proceeding: ${ci.peek()}`);
  }

  return ci;
}

export function compileError(ci: ICompileInfo, err) {
  if (isError(err)) return err;
  return new Error(String(err))
}

// build: code -> fn
export function $build(stack, code) {
  const externalReferences = {};
  // pretty crazy overhead - but this will ensure that the code is effectively running in the scope of the stack
  for (const ctx of stack) Object.keys(ctx).forEach(name => externalReferences[name] = ctx[name]);
  // todo decide if using async function
  return js(code, externalReferences);
}
