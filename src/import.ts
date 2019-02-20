import * as fs from 'fs'
import * as fsPath from 'path';
import { parseHost } from "./parse";
import { compileHost, compileModule } from "./compile";
import { cleanCopyList } from './utils';
import * as common from './common'


const moduleCache:any = {}
export async function $import(path:string, options:any={type:null}) {
  // if(!fsPath.isAbsolute(path)) {
  //   path = fsPath.resolve(process.cwd() + '/' + path);
  //   path
  //   let dir:any = path.split('/');
  //   dir.pop();
  //   dir = dir.join('/')
  //   let ls = fs.readdirSync(dir)
  //   ls
  // }
  // const wd = process.cwd()
  // wd  
  //const projectDir = process.cwd()
  //projectDir
  if(path === "common") return common;
  if(moduleCache[path]) return moduleCache[path];  
  if((options.type && options.type.js) || path.toLowerCase().endsWith('.js')) {
    const m = require(path)
    moduleCache[path] = m;
    return m
  }
  const exports = {}
  moduleCache[path] = exports
  const code:any = await (new Promise((resolve, reject) => 
    fs.readFile(path, 'utf8', async (err, code) => {
      if(err) return reject(err);
      resolve(code);
    })
  ))
  const stack = [{import: $import, exports}]
  let ast:any;
  try {
    ast = await parseHost(stack, code)
  } catch (err) {
    throw new Error(`import - failed to parse ${path}:\n${err}`)
  }
  const refs = []
  let _module;
  try {
    _module = await compileModule(stack, ast, refs)
  } catch (err) {
    throw new Error(`import - failed to compile ${path}:\n${err}`)
  }
  return _module
}
