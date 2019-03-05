import * as fs from "fs";
import * as fsPath from "path";
import * as common from "./common";
import { compileHost, compileModule } from "./compile";
import { parseHost } from "./parse";
import { cleanCopyList } from "./utils";

const moduleCache: any = {};
export async function $import(path: string, options: any= {type: null}) {
  if (moduleCache[path]) { return moduleCache[path]; }

  if (path === "common") { 
    if (options && options.loadCommon) {
      return await options.loadCommon(options);
    }
    const commonHl = await $import('./src/common.hl');
    const _common = {};
    Object.assign(_common, common, commonHl); // NOTE
    return _common;
  }
  
  if ((options.type && options.type.js) || path.toLowerCase().endsWith(".js")) {
    // TODO require doesn't seem to treat path the same as fs.readFile
    const m = await require(path); // NOTE the await here allows returning a promise which will resolve to a module
    moduleCache[path] = m;
    return m;
  }
  const exports = {};
  moduleCache[path] = exports;
  const code: any = await (new Promise((resolve, reject) =>
    fs.readFile(path, "utf8", async (err, code) => {
      if (err) { return reject(err); }
      resolve(code);
    }),
  ));
  const stack = [{import: $import, exports}];
  let ast: any;
  try {
    ast = await parseHost(stack, code);
  } catch (err) {
    throw new Error(`import - failed to parse ${path}:\n${err}`);
  }
  const refs = [];
  let _module;
  try {
    _module = await compileModule(stack, ast, refs);
  } catch (err) {
    throw new Error(`import - failed to compile ${path}:\n${err}`);    
  }
  return _module;
}
