import { readFile, lstat, lstatSync, readdir, readdirSync } from "fs";
import { parseHost } from "./parse";
import { compileHost, compileModule } from "./compile";


const moduleCache:any = {}
export async function load(path:string, options:any={}) {
  let dir:any = path.split('/')
  dir.pop()
  dir = dir.join('/')
  const ls = readdirSync('./tests/host/')
  ls
  if(moduleCache[path]) return moduleCache[path];  
  if(path.toLowerCase().endsWith('.js')) {
    const m = require(path)
    moduleCache[path] = m;
    return m
  }
  let resolveModule, rejectModule;
  moduleCache[path] = new Promise((_resolve, _reject) => {
    resolveModule = _resolve;
    rejectModule = _reject;
  })
  let code
  code = await (new Promise((resolve, reject) => 
    readFile(path, 'utf8', async (err, code) => {
      if(err) {
        rejectModule(err);
        return reject(err);
      }
      resolve(code);
    })
  ))
  const stack = [{load}]
  const ast = await parseHost(stack, code)
  const refs = []
  let module = await compileModule(stack, ast, refs)
  resolveModule(module)
  return module
}


//compileFile('./src/host/parseParens.host').catch(console.error);
//load('./src/host/greet.host').catch(console.error);
