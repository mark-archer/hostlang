import { flatten, sortBy } from 'lodash'
import { js } from "../utils";
import { isExpr, sym, untick } from './meta-common';
import { $eval, $apply } from './eval-apply';

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

export function compiler(name:string, match: CompilerMatchFn, apply: CompilerApplyFn, priority: number = 1000): ICompiler {
  // create compiler
  const compiler: ICompiler = {
    ICompiler: true,
    name,
    priority,
    match,
    apply
  }  
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
    const name = await $eval(stack, untick(ast[2]));
    const match = await $eval(stack, ast[3]);
    const apply = await $eval(stack, ast[4]);
    let priority = ast[5];

    const _compiler = compiler(name, match, apply, priority);
    // check for overwritting existing value
    // const existingValue = stack[stack.length-1][name]
    // if (!existingValue === undefined) {
    //   throw new Error(`adding compiler "${name}" would overwrite an existing value: ${existingValue}`);
    // }  
    // add to stack
    stack[stack.length-1][name] = _compiler;
    return _compiler
  }
}

// ast -> f
export async function $compile(stack:any[], ast:any[]): Promise<any> {
  // get compilers
  let compilers: ICompiler[] = flatten(stack.map(ctx => Object.values(ctx).filter(isCompiler) as ICompiler[]));
  compilers.push(compilerCompiler);
  compilers = sortBy(compilers, c => c.priority);
    
  // get first matching compiler and apply it
  let compiler: ICompiler;
  for(let _compiler of compilers) {
    const match = await _compiler.match(stack, ast);
    if (match) {
      compiler = _compiler;
      break;
    }
  }
  if(compiler) {
    //return compiler.apply(stack, ast);
    return $apply(stack, compiler, [stack, ast])
  } 
  return ast
}

// interface IApp {
//   code: string
//   refs: any[]
//   apply: (refs:any[]) => any
//   run: () => any
// }

// machine code -> value
// export async function $build(code): Promise<IApp> {
//   const apply: ((args:any[]) => any) = js(code);
//   const refs = [] // [ _, env, ...refs]
//   const run = () => apply.apply(null, refs);
//   return { code, refs, apply, run };
// }