import * as fs from "fs";
import * as fsPath from "path";
import * as common from "./common";
import * as compile from "./compile";
import { compileHost, compileModule } from "./compile";
import { parseHost } from "./host/host-parser";
import { cleanCopyList } from "./utils";

const moduleCache: any = {};
export async function $import_old(path: string, options: any= {type: null}) {
  if (moduleCache[path]) { return moduleCache[path]; }

  if (path === "common") { 
    if (options && options.importCommonLib) {
      return await options.importCommonLib(options);
    }
    const commonLib = await $import_old('./src/common.hl');
    const _common:any = {};
    Object.assign(_common, common, commonLib); // NOTE common.hl takes precidence
    console.log(_common.parsers);
    // _common._parsers 
    // for(let i = 0; i < Math.max(commonLib._parsers.length, common._parsers.length); i++) {
    // }
    // _common._parsers = [common._parsers, ...commonLib._parsers];
    return _common;
  }  

  // console.log(path)
  // const absPath = fsPath.resolve(path)
  // console.log(absPath);
  // console.log({path, absPath})
  // path = absPath
  
  if ((options.type && options.type.js) || path.toLowerCase().endsWith(".js")) {
    // NOTE: requiring a js file will always be with respoct to the location of the file require is in
    // TODO pathRoot should probably be configurable
    if(path.startsWith('./')) path = '.' + path;
    const m = await require(path); // NOTE the await here allows returning a promise which will resolve to a module    
    //const m = await require.main.require(path); // NOTE the await here allows returning a promise which will resolve to a module
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
  const stack = [{import: $import_old, exports}];
  let ast: any;
  try {
    ast = await parseHost(stack, code);
  } catch (err) {
    throw new Error(`import - failed to parse ${path}:\n${err}`);    
  }
  const refs = [];
  let _module;
  try {
    // // @ts-ignore
    // compile.commonLib = await $import('./src/common.hl');
    _module = await compileModule(stack, ast, refs);
  } catch (err) {
    throw new Error(`import - failed to compile ${path}:\n${err}`);        
  }
  return _module;
}
