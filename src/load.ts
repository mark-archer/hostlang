import { readFile } from "fs";
import { parseHost } from "./parse";
import { compileHost, compileModule } from "./compile";


const moduleCache:any = {}
export async function load(path:string, options:any={}) {
  // it should work with both js and host files
  if(moduleCache[path]) return moduleCache[path];
  const exports = {};
  moduleCache[path] = exports;
  return new Promise((resolve, reject) => {
    readFile(path, 'utf8', async (err, code) => {
      if(err) return reject(err);
      const stack = [{exports}]
      const ast = await parseHost(stack, code)
      const refs = []
      await compileModule(stack, ast, refs)
      resolve(exports);
    })
  })
}

//compileFile('./src/host/parseParens.host').catch(console.error);
//load('./src/host/greet.host').catch(console.error);
