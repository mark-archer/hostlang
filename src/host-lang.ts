import { runtime } from "./meta/meta-lang";
import { readFile } from "fs";
import { parseHost } from "./host-parser";
import { compileHost } from "./compile";


export function hostRuntime(stack: any[] = []) {
  const hostRuntime = runtime(stack);
  const hostScope = hostRuntime.newScope();  
  
  const stackFns = {
    parse: parseHost,
    compile: compileHost,
    exec: $hostEval
  }
  Object.keys(stackFns)
    .forEach(name => hostScope[name] = (...args) => stackFns[name](stack, ...args));

  hostScope.import = _import;
  hostScope.fetch = fetch

  return hostRuntime;  
}

export function $hostEval(stack: any[], ast: any) {
  const exe = compileHost(stack, [ast]);
  return exe.exec();
}

export async function fetch(path: string, options: any = { encoding: 'utf-8' }) {
  const r = await new Promise((resolve, reject) => {
    readFile(path, options, (err, data) => {
      if(err) return reject(err);
      resolve(data)
    })
  });
  return r
}

export async function _import(path: string, options?: any) {
  // const _import = runtime.get("import");
  // if (_import) return await _import(path, options);
}

