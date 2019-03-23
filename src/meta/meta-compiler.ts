import { flatten, sortBy, last } from 'lodash';
import { nameLookup, isExpr, sym, untick } from './meta-common';
import { stringify } from '../utils';
import { isString } from 'util';
import { $eval } from './meta-lang';
import { skip } from '../common';
//export function 

// ast -> machine code

// js == machine code -> fn

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
  if (!(isExpr(ast) && ast[1] === sym("compiler"))) return;
  const name = $eval(ci.stack, untick(ast[2]));
  const priority = $eval(ci.stack, ast[3]);
  const apply = $eval(ci.stack, ['`', '`fn', ...skip(ast, 4)]);
  last(ci.stack)[name] = compiler(name, apply, priority);
  return ""
})

export function getCompilers(stack: any[]): ICompiler[] {
  let compilers = flatten(stack.map(scope => (<any>Object).values(scope).filter(isCompiler)));
  if (!nameLookup(stack, "exclude_default_compilers")) {
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

export function $compile(ast: any, ci: ICompilerInfo = compilerInfo()) {
  const compilers = getCompilers(ci.stack)
  for (const _compiler of compilers) {
    const result = _compiler.apply(ast, ci);
    if (isString(result)) return result;
    if (result) throw new Error(`a compiler returned a truthy, non-string value: ${stringify({ compiler: _compiler, result })}`);
  }
  throw new Error(`no compilers are proceeding: ${stringify(ast)}`)
}

export function compilerInfo(stack=[], refs=[], compilerStack=[]): ICompilerInfo {
  return { refs, stack, compilerStack }
}