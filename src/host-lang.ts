import { runtime, $get, $newScope, $eval } from "./meta/meta-lang";
import { readFile, readdirSync, lstatSync } from "fs";
import { parseHost } from "./host-parser";
import { $compile } from "./meta/meta-compiler";
import { jsCompilerInfo, buildJs } from "./js-compiler";

export async function hostRuntime(stack: any[] = []) {
  const hostRuntime = runtime(stack);
  const hostScope = hostRuntime.newScope();
  
  hostScope._ = hostRuntime._ === undefined ? null : hostRuntime._
  
  const stackFns = {
    eval: $hostEval,
    parse: parseHost,
    import: $import,
    shell: $shell,
  }
  // Object.keys(stackFns)
  //   .forEach(name => hostScope[name] = (...args) => stackFns[name](stack, ...args));
  Object.assign(hostScope, stackFns);

  hostScope.fetch = fetch;

  await loadHostEnv(stack, hostScope);
  return hostRuntime;  
}

export function $hostEval(stack, ast) {
  const jsCode = $compile(ast, jsCompilerInfo(stack));
  jsCode
  return $eval(stack, ast);
}
//@ts-ignore
$hostEval.isMeta = true;

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
  const path = './host_env';
  await processDir(path, envScope);
}

export async function $import(stack: any[], path: string, options?: any) {
  const _fetch = fetch;
  const parse = parseHost;
  
  const code = await _fetch(path, options);
  const ast = await parse(stack, code, Object.assign({}, options, { sourceFile: path }));  
  const ci = jsCompilerInfo(stack, undefined, [{}]);
  const jsCode = $compile(ast, ci);
  const _module: any = { exports: {} };
  const moduleFn = buildJs(jsCode, ci, { module: _module, exports: _module.exports });
  moduleFn(); // module code needs to be run to generate exports
  return await _module.exports;
}
// @ts-ignore
$import.isMeta = true;

export async function fetch(path: string, options: any = { encoding: 'utf-8' }): Promise<string> {
  const r: any = await new Promise((resolve, reject) => {
    readFile(path, options, (err, data:any) => {
      if(err) reject(err);
      else resolve(data);
    })
  });
  return r
}

export async function $shell(stack, cmd: string) {
  const doBlock = $get(stack, "do");
  const ast = await parseHost(stack, cmd);
  return doBlock(stack, ast);
}
// @ts-ignore
$shell.isMeta = true;

