import { runtime, $get } from "./meta/meta-lang";
import { readFile, readdirSync, lstatSync } from "fs";
import { parseHost } from "./host-parser";
import { nameLookup } from "./meta/meta-common";
import { $compile } from "./meta/meta-compiler";
import { jsCompilerInfo } from "./js-compiler";
import { js } from "./utils";


export async function hostRuntime(stack: any[] = []) {
  const hostRuntime = runtime(stack);
  const hostScope = hostRuntime.newScope();
  hostScope._ = hostRuntime._ === undefined ? null : hostRuntime._
  
  const stackFns = {
    parse: parseHost,
    compile: $compileJs,
    import: $import,
    shell: $shell
  }
  Object.keys(stackFns)
    .forEach(name => hostScope[name] = (...args) => stackFns[name](stack, ...args));

  hostScope.fetch = fetch;

  await loadHostEnv(stack, hostScope);
  return hostRuntime;  
}

export async function loadHostEnv(stack, envScope:any) {
  // this copies all exports directly into the env scope
  // it also creates a namespace hierarchy matching the folder structure
  // note that if there are name collisions
  //    exported names deeper in the structure will overwrite shallower items in the envScope
  //    a namespace name (folder) should overwrite an exported name at the same level (needs to be tested)
  async function processDir(path, scope) {
    const subpaths = readdirSync(path);
    for (const scopeName of subpaths) {
      const subpath = path + '/' + scopeName;
      const ls = lstatSync(subpath);
      if (ls.isDirectory()) {
        const subscope = {}
        await processDir(subpath, subscope);
        scope[scopeName] = subscope;
        Object.assign(envScope, subscope);
      }
      else {
        const _module = await $import(stack, subpath);
        Object.assign(scope, _module);
      }      
    }              
  }
  //const path = process.cwd() + '/host_env';
  const path = './host_env';
  await processDir(path, envScope);
  envScope
}

export async function $import(stack: any[], path: string, options?: any) {
  const fetch = nameLookup(stack, "fetch");
  const parse = nameLookup(stack, "parse");
  const compile = nameLookup(stack, "compile");
  const code = await fetch(path, options);
  const ast = await parse(code, Object.assign({}, options, { sourceFile: path }));
  if(path.includes("greet")) {
    code
    ast
    const modCode = compile(ast)
  }
  const moduleStack = [...stack, {}]
  //const mod = await compileModule(stack, ast);
  //return mod;
}

export function $compileJs(stack, ast) {
  const ci = jsCompilerInfo(stack)
  const jsCode = $compile(ast, ci)
  const f = js(jsCode)
  const _ = $get(stack, "_");
  const exec = () => f.apply(null, [ _, ...ci.refs ]);
  return exec;
}

export async function fetch(path: string, options: any = { encoding: 'utf-8' }) {
  const r = await new Promise((resolve, reject) => {
    readFile(path, options, (err, data) => {
      if(err) reject(err);
      else resolve(data);
    })
  });
  return r
}

export async function $shell(stack, cmd: string) {
  const parse = $get(stack, "parse");
  const doBlock = $get(stack, "do");
  const ast = await parse(cmd);
  return doBlock(ast);
}

