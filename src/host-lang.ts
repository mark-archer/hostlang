import { runtime, $get } from "./meta/meta-lang";
import { readFile } from "fs";
import { parseHost } from "./host-parser";
//import { compileHost, compileModule } from "./compile";
import { nameLookup } from "./meta/meta-common";
import { $compile } from "./meta/meta-compiler";
import { jsCompilerInfo } from "./js-compiler";
import { js } from "./utils";


export function hostRuntime(stack: any[] = []) {
  const hostRuntime = runtime(stack);
  const hostScope = hostRuntime.newScope();
  hostScope._ = hostRuntime._ === undefined ? null : hostRuntime._
  
  const stackFns = {
    parse: parseHost,
    compile: $compileJs,
    build: $build,
    exec: $exec,
    import: $import,
    shell: $shell
  }
  Object.keys(stackFns)
    .forEach(name => hostScope[name] = (...args) => stackFns[name](stack, ...args));

    hostScope.fetch = fetch

  return hostRuntime;  
}

export function $compileJs(stack, ast) {
  const ci = jsCompilerInfo(stack)
  return $compile(ast, ci)
}

export function $build(stack, ast) {
  const jsCode = $compileJs(stack, ast);
  const f = js(jsCode)
  const _ = $get(stack, "_");
  const exec = () => f.apply(null, [ _ ]);
  return exec;
}

export function $exec(stack: any[], ast: any) {
  return $build(stack, ast)();
}

export async function $import(stack: any[], path: string, options?: any) {
  const fetch = nameLookup(stack, "fetch");
  const parse = nameLookup(stack, "parse");
  const code = await fetch(path, options);
  const ast = await parse(code, options);
  //const mod = await compileModule(stack, ast);
  //return mod;
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

