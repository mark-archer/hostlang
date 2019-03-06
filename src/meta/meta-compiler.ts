import { flatten, sortBy } from 'lodash'
import { js } from "../utils";
import { isExpr, sym, untick } from './meta-common';

export function isCompiler(x:any) : boolean {
  return x && x.ICompiler === true;
}

type CompilerMatchFn = (stack: any[], ast:any) => (boolean | Promise<boolean>)
type CompilerApplyFn = (stack: any[], ast:any) => (string  | Promise<any>)

interface ICompiler {
  ICompiler: true
  name: string
  priority: number
  match: CompilerMatchFn
  apply: CompilerApplyFn
}

export function compiler(stack: any[], name:string, match: CompilerMatchFn, apply: CompilerApplyFn, priority: number = 1000): ICompiler {
  // create compiler
  const compiler: ICompiler = {
    ICompiler: true,
    name,
    priority,
    match,
    apply
  }
  // check for overwritting existing value
  const existingValue = stack[stack.length-1][name]
  // if (!existingValue === undefined) {
  //   throw new Error(`adding compiler "${name}" would overwrite an existing value: ${existingValue}`);
  // }  
  // add to stack
  stack[stack.length-1][name] = compiler;
  // return compiler
  return compiler
}

const compilerCompiler: ICompiler = {
  ICompiler: true,
  name: "compilerCompiler",
  priority: 1000,
  match: (stack: any[], ast) => isExpr(ast) && ast[1] === sym('compiler'),
  apply: async (stack: any[], ast) => {
    // if(![5,6].includes(ast.length)) {
    //   throw new Error(`compiler expected 3-4 arguments, given: ${ast.length - 2}`)
    // }
    const name = await $compile(stack, untick(ast[2]));
    const match = await $compile(stack, ast[3]);
    const apply = await $compile(stack, ast[4]);
    let priority = ast[5];
    return compiler(stack, name, match, apply, priority);
  }
}

export async function $compile(stack:any[], ast:any[]): Promise<any> {
  // get compilers
  let compilers: ICompiler[] = flatten(stack.map(ctx => Object.values(ctx).filter(isCompiler) as ICompiler[]));
  compilers = sortBy(compilers, c => c.priority);
  compilers.unshift(compilerCompiler);
    
  // get first matching compiler and apply it
  let compiler: ICompiler;
  for(let c of compilers) {
    const match = await c.match(stack, ast);
    if (match) {
      compiler = c;
      break;
    }
  }
  if(compiler) {
    return await compiler.apply(stack, ast);
  }  
  return ast
}

// interface IApp {
//   code: string
//   refs: any[]
//   apply: (refs:any[]) => any
//   run: () => any
// }

// export async function $build(code): Promise<IApp> {
//   const apply: ((args:any[]) => any) = js(code);
//   const refs = [] // [ _, env, ...refs]
//   const run = () => apply.apply(null, refs);
//   return { code, refs, apply, run };
// }