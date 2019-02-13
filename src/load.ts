
import { parseHost } from './parse';
import * as fs from 'fs';
import { compileHost } from './compile';
import { untick, isString } from './common';
import { getName } from './host';
import { cleanCopyList } from './utils';

const add = (...args) => args.reduce((m,a) => m + a)

function $setr(stack, obj, name, value) {
  obj = obj.toString()
  console.log({stack, obj, name, value})
  const _setr = (obj, name, value) => obj[name] = value;
  return ['`', _setr, obj, untick(name), value];
}
$setr.isMacro = true;

export type LoadOptions = {
  codeIsPath?:boolean
}

export async function compileModule(path:string, options:LoadOptions={}) {
  let code:string;
  if (options.codeIsPath) {
    code = path
  } else {
    code = fs.readFileSync(path, 'utf8');    
  }
  //console.log({code},'\n');
  const ast = await parseHost([], code);
  console.log(JSON.stringify(ast, null, 2), '\n')
  const exports:any = {}
  const r = compileHost([{add, exports, setr: $setr}], ast);
  console.log(r.code);
  r.exec(); // code has to be run to generate module
  //console.log(r.exec())
  return exports
}

const moduleCache:any = {}
export async function load(path:string, options:LoadOptions={}) {

}

//compileFile('./src/host/parseParens.host').catch(console.error);
//load('./src/host/greet.host').catch(console.error);
