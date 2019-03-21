import { runtime } from "./meta/meta-lang";
import { readFile } from "fs";
import { parseHost } from "./host-parser";
import { compileHost } from "./compile";
import { nameLookup } from "./meta/meta-common";


export function hostRuntime(stack: any[] = []) {
  const hostRuntime = runtime(stack);
  const hostScope = hostRuntime.newScope();  
  
  const stackFns = {
    parse: parseHost,
    compile: compileHost,
    exec: $hostExec,
    import: $import,
  }
  Object.keys(stackFns)
    .forEach(name => hostScope[name] = (...args) => stackFns[name](stack, ...args));

    hostScope.fetch = fetch

  return hostRuntime;  
}

export function $hostExec(stack: any[], ast: any) {
  const exe = compileHost(stack, [ast]);
  return exe.exec();
}

export async function $import(stack: any[], path: string, options?: any) {
  const fetch = nameLookup(stack, "fetch");
  const code = await fetch(path, options);
  // ... todo  
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



