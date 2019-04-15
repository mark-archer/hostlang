import { flatten, sortBy, last } from 'lodash';
import { untick, isExprOf } from './meta-common';
import { stringify } from '../utils';
import { isString } from 'util';
import { $eval, $apply, $get, $set } from './meta-lang';
import { skip } from '../common';

export function isCompiler(x: any) {
  return x && x.ICompiler
}

export type CompilerApplyFn = (ast: any, ci: ICompilerInfo) => (boolean | string)

export interface ICompiler {
  ICompiler: true
  name: string
  apply: CompilerApplyFn
  priority: number
} 

export function compiler(name:string, apply: CompilerApplyFn, priority: number = 1000): ICompiler {
  return {
    ICompiler: true,
    name,
    apply,
    priority
  }
}

const compilerCompiler: ICompiler = compiler("compilerCompiler", (ast: any, ci: ICompilerInfo) => {
  let exportCompiler = false;
  if (isExprOf(ast, "export", "compiler")) {
    exportCompiler = true;
    ast = ['`', ...skip(ast, 2)]    
  }
  if (isExprOf(ast, "compiler")) {
    const name = $eval(ci.stack, untick(ast[2]));
    const priority = $eval(ci.stack, ast[3]);
    const apply = $eval(ci.stack, ['`', '`fn', ...skip(ast, 4)]);
    const _compiler = compiler(name, apply, priority);    
    last(ci.stack)[name] = _compiler;
    if (exportCompiler) {
      $get(ci.stack, "exports")[name] = _compiler;
    }
    //$set(ci.stack, "_", _compiler);
    return "_"
  }
}, 1)

export function getCompilers(stack: any[]): ICompiler[] {
  let compilers = flatten(stack.map(scope => (<any>Object).values(scope).filter(isCompiler)));
  if (!$get(stack, "exclude_default_compilers")) {
    compilers.push(compilerCompiler)
  }
  compilers = sortBy(compilers, c => c.priority);
  return compilers;
}

export interface ICompilerInfo {
  refs: any[]
  stack: any[]
  compilerStack: any[]
}

export function $compile(ast: any, ci: ICompilerInfo) {
  const compilers = getCompilers(ci.stack)
  for (const _compiler of compilers) {
    const result = $apply(ci.stack, _compiler, [ast, ci]);
    if (isString(result) || result) return result;    
  }
  throw new Error(`no compilers are proceeding: ${stringify(ast)}`)
}

export function compilerInfo(stack=[], refs=[], compilerStack=[]): ICompilerInfo {
  return { refs, stack, compilerStack }
}