import * as fs from 'fs'
import * as fsPath from 'path';
import { parseHost } from "./parse";
import { compileHost, compileModule } from "./compile";


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
  
  if(moduleCache[path]) return moduleCache[path];
  if((options.type && options.type.js) || path.toLowerCase().endsWith('.js')) {
    const m = require(path)
    moduleCache[path] = m;
    return m
  }
  const exports = {}
  moduleCache[path] = exports
  let code
  code = await (new Promise((resolve, reject) => 
    fs.readFile(path, 'utf8', async (err, code) => {
      if(err) return reject(err);
      resolve(code);
    })
  ))
  const stack = [{import: $import, exports}]
  const ast = await parseHost(stack, code)
  const refs = []
  let module = await compileModule(stack, ast, refs)
  return module
}

