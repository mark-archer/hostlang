
import { parseHost } from './parse';
import * as fs from 'fs';
import { compileHost } from './compileJS';
import { untick } from './common';

const add = (...args) => args.reduce((m,a) => m + a)

function setr(stack, obj, name, value) {
  obj = obj.toString()
  console.log({stack, obj, name, value})
  const _setr = (obj, name, value) => obj[name] = value;
  return ['`', _setr, obj, untick(name), value];
}
setr.isMacro = true;


async function compileFile(file:string, options:any={}) {
  const code = fs.readFileSync(file, 'utf8');
  console.log(code,'\n');
  const ast = await parseHost([], code);
  console.log(JSON.stringify(ast, null, 2), '\n')
  const exports:any = {}
  const r = compileHost([{add,exports,setr}], ast);
  r.exec(); // code has to be run to get module
  //console.log(r.exec())
  // console.log(r.exec()())
  console.log(exports)
  console.log(exports.greet('Blair'))
  return exports
}

//compileFile('./src/host/parseParens.host').catch(console.error);
compileFile('./src/host/greet.host').catch(console.error);

