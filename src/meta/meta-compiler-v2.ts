import { flatten, sortBy, range, clone, isError } from 'lodash'
import { isExpr, sym, untick, isList, nameLookup } from './meta-common';
import { $eval, $apply } from './eval-apply';
import { isString } from '../common';

export function isCompiler(x:any) : boolean {
  return x && x.ICompiler === true;
}

export type CompilerApplyFn = (refs: any[], stack: any[], ast: any) => (string|boolean|Promise<string|boolean>)

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
  apply: async (refs: any[], stack: any[], ast: any) => {
    if (!(isExpr(ast) && ast[1] === sym("compiler"))) return;
    const name = await $eval(stack, untick(ast[2]));
    const apply = await $eval(stack, ast[3]);
    let priority = await $eval(stack, ast[4]);
    const _compiler = compiler(name,  apply, priority);
    stack[stack.length-1][name] = _compiler;
    return true;
  }
}

export function getCompilers(stack:any[]) {
  let compilers: ICompiler[] = flatten(stack.map(ctx => Object.values(ctx).filter(isCompiler) as ICompiler[]));
  if (!nameLookup(stack, "exclude_default_compilers")) {
    compilers.push(compilerCompiler);
  }
  compilers = sortBy(compilers, c => c.priority);  
  return compilers;
}

// ast -> machine code
export async function $compile(stack:any[], ast:any, refs: any[] = []) {
  // NOTE: keep an eye on this logic, meant to simplify things but might cause confusion
  //if (isExpr(ast) || !isList(ast)) ast = [ast];

  // NOTE: we're effectively rebuilding the list of compilers on every call, not super performant
  const compilers = getCompilers(stack);
  
  try {
    for (const compiler of compilers) {
      const r = await $apply(stack, compiler, [refs, stack, ast]);
      if(isString(r)) return r;
    }    
  } catch (err) {
    throw compileError(stack, ast, refs, err);
  }  
  throw compileError(stack, ast, refs, "no compilers are proceeding");
}

export function compileError(stack:any[], ast:any, refs: any[], err:(Error|string)) {
  if (isError(err)) return err;
  return new Error(err)
}
